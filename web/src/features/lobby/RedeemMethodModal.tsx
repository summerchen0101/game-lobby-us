import {
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useAlert } from "../../components/alert/alertContext";
import { useAuth } from "../../auth/useAuth";
import { isMockMode } from "../../lib/env";
import { GATEWAY_API_CREATE_WITHDRAW_ORDER } from "../../realtime/gatewayApi";
import { isGatewaySuccessCode } from "../../realtime/gatewayWire";
import {
  decodeCreateWithdrawOrderResponseBytes,
  encodeCreateWithdrawOrderRequestBytes,
} from "../../realtime/withdrawLobbyWire";
import { useGatewayLobby } from "../../realtime/useGatewayLobby";
import { REDEEM_METHOD_TO_WITHDRAW_PAYMENT_TYPE } from "./redeemPaymentTypeMap";
import { REDEEM_METHOD_SLUGS, type RedeemMethodSlug } from "./redeemFlow";
import "./RedeemFormPage.css";
import "./RedeemMethodModal.css";

const METHOD_LABEL: Record<RedeemMethodSlug, string> = {
  "credit-card": "CreditCard",
  paypal: "PayPal",
  cashapp: "CashAPP",
  ach: "ACH",
};

type Step = "pick" | "form" | "success";

const MOCK_WITHDRAW_ORDER_UID = "demo-mock-withdraw-order";

type Props = {
  open: boolean;
  onClose: () => void;
  /** 建立訂單成功後（刷新列表等） */
  onOrderCreated?: () => void | Promise<void>;
};

type SubmitFields = {
  method: RedeemMethodSlug;
  amountStr: string;
  cardNumber?: string;
  cardValidCode?: string;
  paypalEmail?: string;
  accountNumber?: string;
  routingNumber?: string;
  appAccount?: string;
};

function parseWithdrawAmountToWire(amountStr: string): bigint | null {
  const t = amountStr.trim().replace(/,/g, "");
  if (!/^\d+$/.test(t)) return null;
  try {
    return BigInt(t);
  } catch {
    return null;
  }
}

function RedeemCashAppForm({
  amount,
  busy,
  onSubmit,
}: {
  amount: string;
  busy: boolean;
  onSubmit: (appAccount: string) => Promise<void>;
}) {
  const [appAccount, setAppAccount] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!appAccount.trim() || busy) return;
    await onSubmit(appAccount.trim());
  };

  return (
    <form className="redeem-form-page__form" onSubmit={handleSubmit}>
      <label className="redeem-form-page__label">AMOUNT TO REDEEM*</label>
      <input
        className="redeem-form-page__input"
        value={amount}
        readOnly
        aria-readonly
      />

      <label
        className="redeem-form-page__label"
        htmlFor="redeem-modal-cashapp-account">
        Choose AppAccount*
      </label>
      <input
        id="redeem-modal-cashapp-account"
        className="redeem-form-page__input"
        value={appAccount}
        onChange={(e) => setAppAccount(e.target.value)}
        autoComplete="off"
        required
        disabled={busy}
      />

      <p className="redeem-form-page__hint">REDEEM TO CashAPP ACCOUNT</p>

      <button
        type="submit"
        className="redeem-form-page__confirm"
        disabled={busy}>
        {busy ? "…" : "CONFIRM"}
      </button>
    </form>
  );
}

function RedeemAchForm({
  amount,
  busy,
  onSubmit,
}: {
  amount: string;
  busy: boolean;
  onSubmit: (accountNumber: string, routingNumber: string) => Promise<void>;
}) {
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !routingNumber.trim() || busy) return;
    await onSubmit(accountNumber.trim(), routingNumber.trim());
  };

  return (
    <form className="redeem-form-page__form" onSubmit={handleSubmit}>
      <label className="redeem-form-page__label">AMOUNT TO REDEEM*</label>
      <input
        className="redeem-form-page__input"
        value={amount}
        readOnly
        aria-readonly
      />

      <label
        className="redeem-form-page__label"
        htmlFor="redeem-modal-ach-acct">
        Choose AccountNumber*
      </label>
      <input
        id="redeem-modal-ach-acct"
        className="redeem-form-page__input"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
        autoComplete="off"
        required
        disabled={busy}
      />

      <label
        className="redeem-form-page__label"
        htmlFor="redeem-modal-ach-route">
        Choose RoutingNumber*
      </label>
      <input
        id="redeem-modal-ach-route"
        className="redeem-form-page__input"
        value={routingNumber}
        onChange={(e) => setRoutingNumber(e.target.value)}
        autoComplete="off"
        required
        disabled={busy}
      />

      <p className="redeem-form-page__hint">REDEEM TO ACH ACCOUNT</p>

      <button
        type="submit"
        className="redeem-form-page__confirm"
        disabled={busy}>
        {busy ? "…" : "CONFIRM"}
      </button>
    </form>
  );
}

function RedeemCreditCardForm({
  amount,
  busy,
  onSubmit,
}: {
  amount: string;
  busy: boolean;
  onSubmit: (cardNumber: string, cardValidCode: string) => Promise<void>;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardCode, setCardCode] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim() || !cardCode.trim() || busy) return;
    await onSubmit(cardNumber.trim(), cardCode.trim());
  };

  return (
    <form className="redeem-form-page__form" onSubmit={handleSubmit}>
      <label className="redeem-form-page__label">AMOUNT TO REDEEM*</label>
      <input
        className="redeem-form-page__input"
        value={amount}
        readOnly
        aria-readonly
      />

      <label className="redeem-form-page__label" htmlFor="redeem-modal-cc-num">
        Choose CardNumber*
      </label>
      <input
        id="redeem-modal-cc-num"
        className="redeem-form-page__input"
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
        autoComplete="off"
        required
        disabled={busy}
      />

      <label className="redeem-form-page__label" htmlFor="redeem-modal-cc-cvv">
        Choose CardValidCode*
      </label>
      <input
        id="redeem-modal-cc-cvv"
        className="redeem-form-page__input"
        value={cardCode}
        onChange={(e) => setCardCode(e.target.value)}
        autoComplete="off"
        required
        disabled={busy}
      />

      <p className="redeem-form-page__hint">REDEEM TO CreditCard ACCOUNT</p>

      <button
        type="submit"
        className="redeem-form-page__confirm"
        disabled={busy}>
        {busy ? "…" : "CONFIRM"}
      </button>
    </form>
  );
}

function RedeemPayPalForm({
  amount,
  busy,
  onSubmit,
}: {
  amount: string;
  busy: boolean;
  onSubmit: (paypalEmail: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    await onSubmit(email.trim());
  };

  return (
    <form className="redeem-form-page__form" onSubmit={handleSubmit}>
      <label className="redeem-form-page__label">AMOUNT TO REDEEM*</label>
      <input
        className="redeem-form-page__input"
        value={amount}
        readOnly
        aria-readonly
      />

      <label
        className="redeem-form-page__label"
        htmlFor="redeem-modal-paypal-email">
        Choose PaypalEmail*
      </label>
      <input
        id="redeem-modal-paypal-email"
        className="redeem-form-page__input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        disabled={busy}
      />

      <p className="redeem-form-page__hint">REDEEM TO PayPal ACCOUNT</p>

      <button
        type="submit"
        className="redeem-form-page__confirm"
        disabled={busy}>
        {busy ? "…" : "CONFIRM"}
      </button>
    </form>
  );
}

function RedeemWithdrawSuccessView({
  orderUid,
  amountDisplay,
  onBackToLobby,
}: {
  orderUid: string;
  amountDisplay: string;
  onBackToLobby: () => void;
}) {
  return (
    <div className="redeem-method-modal__success">
      <p className="redeem-method-modal__success-hero-title">
        YOUR REQUEST SUBMITTED
      </p>
      <div className="redeem-method-modal__success-summary-card">
        <p className="redeem-method-modal__success-summary-label">
          Your redemption request
        </p>
        <p className="redeem-method-modal__success-amount" aria-label="Amount">
          {amountDisplay || "—"}
        </p>
        <p className="redeem-method-modal__success-line">
          Has been successfully submitted
        </p>
        <p className="redeem-method-modal__success-hint">
          Please check your email for payment updates.
        </p>
      </div>
      <div className="redeem-method-modal__success-detail-card">
        <p className="redeem-method-modal__success-field-label">Order number</p>
        <div
          className="redeem-method-modal__success-order-box"
          title={orderUid}>
          {orderUid}
        </div>
        <p className="redeem-method-modal__success-field-label">Status</p>
        <div className="redeem-method-modal__success-status-box">pending</div>
        <button
          type="button"
          className="redeem-method-modal__success-cta"
          onClick={onBackToLobby}>
          BACK TO LOBBY
        </button>
      </div>
    </div>
  );
}

export function RedeemMethodModal({ open, onClose, onOrderCreated }: Props) {
  const { show } = useAlert();
  const { user } = useAuth();
  const { requestRef, gatewayRequestReady } = useGatewayLobby();
  const titleId = useId();
  const amountId = useId();

  const [step, setStep] = useState<Step>("pick");
  const [pickAmount, setPickAmount] = useState("");
  const [committedAmount, setCommittedAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<RedeemMethodSlug | null>(
    null,
  );
  const [submitBusy, setSubmitBusy] = useState(false);
  const [successOrderUid, setSuccessOrderUid] = useState("");
  const [successAmountDisplay, setSuccessAmountDisplay] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setPickAmount("");
    setCommittedAmount("");
    setSelectedMethod(null);
    setSubmitBusy(false);
    setSuccessOrderUid("");
    setSuccessAmountDisplay("");
  }, [open]);

  const finalizeSuccessFlow = useCallback(
    async (orderUid: string, amountStr: string) => {
      setSuccessOrderUid(orderUid);
      setSuccessAmountDisplay(amountStr.trim());
      await onOrderCreated?.();
      setStep("success");
    },
    [onOrderCreated],
  );

  const submitWithdrawOrder = useCallback(
    async (fields: SubmitFields) => {
      const mock = isMockMode();
      if (mock) {
        await finalizeSuccessFlow(MOCK_WITHDRAW_ORDER_UID, fields.amountStr);
        return;
      }
      const req = requestRef.current;
      if (!req || !gatewayRequestReady) {
        show("Not connected to server. Try again.", { variant: "error" });
        return;
      }
      const amt = parseWithdrawAmountToWire(fields.amountStr);
      if (amt === null || amt <= BigInt(0)) {
        show("Enter a valid whole-number SC amount.", { variant: "error" });
        return;
      }
      const paymentType = REDEEM_METHOD_TO_WITHDRAW_PAYMENT_TYPE[fields.method];
      const data = encodeCreateWithdrawOrderRequestBytes({
        userID: user?.id,
        amount: amt,
        paymentType,
        cardNumber: fields.cardNumber,
        cardValidCode: fields.cardValidCode,
        paypalEmail: fields.paypalEmail,
        accountNumber: fields.accountNumber,
        routingNumber: fields.routingNumber,
        appAccount: fields.appAccount,
      });

      setSubmitBusy(true);
      try {
        console.log(data);
        const r = await req({
          type: GATEWAY_API_CREATE_WITHDRAW_ORDER,
          data,
          debugLabel: "CREATE_WITHDRAW_ORDER",
        });
        const code = String(r.code ?? "");
        if (!isGatewaySuccessCode(code)) {
          show(r.errMessage?.trim() || `Withdrawal failed (${code})`, {
            variant: "error",
          });
          return;
        }
        const raw = r.data;
        if (!(raw instanceof Uint8Array) || raw.byteLength === 0) {
          show("Empty withdrawal response", { variant: "error" });
          return;
        }
        const { withdrawOrderUID } =
          decodeCreateWithdrawOrderResponseBytes(raw);
        const oid = withdrawOrderUID.trim();
        await finalizeSuccessFlow(
          oid || "—",
          fields.amountStr,
        );
      } catch (e) {
        show(e instanceof Error ? e.message : "Withdrawal failed", {
          variant: "error",
        });
      } finally {
        setSubmitBusy(false);
      }
    },
    [
      finalizeSuccessFlow,
      gatewayRequestReady,
      requestRef,
      show,
      user?.id,
    ],
  );

  const goBackFromForm = useCallback(() => {
    setStep("pick");
    setSelectedMethod(null);
  }, []);

  const trySelectMethod = useCallback(
    (method: RedeemMethodSlug) => {
      const raw = pickAmount.trim();
      if (!raw) {
        document.getElementById(amountId)?.focus();
        return;
      }
      setCommittedAmount(raw);
      setSelectedMethod(method);
      setStep("form");
    },
    [pickAmount, amountId],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "form") {
        goBackFromForm();
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, step, goBackFromForm, onClose]);

  const headerBack = useCallback(() => {
    if (step === "success") {
      onClose();
      return;
    }
    if (step === "form") {
      goBackFromForm();
      return;
    }
    onClose();
  }, [step, goBackFromForm, onClose]);

  const handleOverlayDismiss = useCallback(() => {
    if (step === "success") return;
    onClose();
  }, [step, onClose]);

  const formBranch = useMemo(() => {
    if (step !== "form" || !selectedMethod) return null;
    const amount = committedAmount;
    switch (selectedMethod) {
      case "cashapp":
        return (
          <RedeemCashAppForm
            amount={amount}
            busy={submitBusy}
            onSubmit={async (appAccount) =>
              submitWithdrawOrder({
                method: "cashapp",
                amountStr: committedAmount,
                appAccount,
              })
            }
          />
        );
      case "ach":
        return (
          <RedeemAchForm
            amount={amount}
            busy={submitBusy}
            onSubmit={async (accountNumber, routingNumber) =>
              submitWithdrawOrder({
                method: "ach",
                amountStr: committedAmount,
                accountNumber,
                routingNumber,
              })
            }
          />
        );
      case "credit-card":
        return (
          <RedeemCreditCardForm
            amount={amount}
            busy={submitBusy}
            onSubmit={async (cardNumber, cardValidCode) =>
              submitWithdrawOrder({
                method: "credit-card",
                amountStr: committedAmount,
                cardNumber,
                cardValidCode,
              })
            }
          />
        );
      case "paypal":
        return (
          <RedeemPayPalForm
            amount={amount}
            busy={submitBusy}
            onSubmit={async (paypalEmail) =>
              submitWithdrawOrder({
                method: "paypal",
                amountStr: committedAmount,
                paypalEmail,
              })
            }
          />
        );
      default:
        return null;
    }
  }, [step, selectedMethod, committedAmount, submitBusy, submitWithdrawOrder]);

  const titleText =
    step === "pick"
      ? "Choose redemption method"
      : step === "success"
        ? "Redemption submitted"
        : `Redeem via ${selectedMethod ? METHOD_LABEL[selectedMethod] : ""}`;

  if (!open) return null;

  return createPortal(
    <div
      className="app-modal-overlay"
      role="presentation"
      onClick={handleOverlayDismiss}>
      <div
        className="app-modal app-modal--scroll-y redeem-method-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}>
        <div className="redeem-method-modal__head">
          <button
            type="button"
            className="redeem-method-modal__back"
            aria-label={step === "form" ? "Back to methods" : "Close"}
            onClick={headerBack}>
            ‹
          </button>
        </div>

        <div
          className={
            step === "form"
              ? "redeem-method-modal__body redeem-method-modal__body--form"
              : step === "success"
                ? "redeem-method-modal__body redeem-method-modal__body--success"
                : "redeem-method-modal__body"
          }>
          <h2 id={titleId} className="redeem-method-modal__sr-only">
            {titleText}
          </h2>

          {step === "success" ? (
            <RedeemWithdrawSuccessView
              orderUid={successOrderUid}
              amountDisplay={successAmountDisplay}
              onBackToLobby={onClose}
            />
          ) : step === "pick" ? (
            <>
              <label className="redeem-method-modal__label" htmlFor={amountId}>
                AMOUNT TO REDEEM*
              </label>
              <input
                id={amountId}
                className="redeem-method-modal__input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                aria-required
                value={pickAmount}
                onChange={(e) => setPickAmount(e.target.value)}
              />

              <p className="redeem-method-modal__label redeem-method-modal__label--spaced">
                REDEEM TO:
              </p>
              <div className="redeem-method-modal__methods" role="group">
                {REDEEM_METHOD_SLUGS.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    className="redeem-method-modal__method-btn"
                    onClick={() => trySelectMethod(slug)}>
                    {METHOD_LABEL[slug]}
                  </button>
                ))}
              </div>
            </>
          ) : (
            formBranch
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
