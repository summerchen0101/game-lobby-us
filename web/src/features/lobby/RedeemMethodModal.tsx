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
import { REDEEM_METHOD_SLUGS, type RedeemMethodSlug } from "./redeemFlow";
import "./RedeemFormPage.css";
import "./RedeemMethodModal.css";

const METHOD_LABEL: Record<RedeemMethodSlug, string> = {
  "credit-card": "CreditCard",
  paypal: "PayPal",
  cashapp: "CashAPP",
  ach: "ACH",
};

type Step = "pick" | "form";

type Props = {
  open: boolean;
  onClose: () => void;
};

function RedeemCashAppForm({
  amount,
  onSuccess,
}: {
  amount: string;
  onSuccess: () => void;
}) {
  const { show } = useAlert();
  const [appAccount, setAppAccount] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!appAccount.trim()) return;
    show("Redemption request recorded (preview).", { variant: "success" });
    onSuccess();
  };

  return (
    <form className="redeem-form-page__form" onSubmit={onSubmit}>
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
      />

      <p className="redeem-form-page__hint">REDEEM TO CashAPP ACCOUNT</p>

      <button type="submit" className="redeem-form-page__confirm">
        CONFIRM
      </button>
    </form>
  );
}

function RedeemAchForm({
  amount,
  onSuccess,
}: {
  amount: string;
  onSuccess: () => void;
}) {
  const { show } = useAlert();
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !routingNumber.trim()) return;
    show("Redemption request recorded (preview).", { variant: "success" });
    onSuccess();
  };

  return (
    <form className="redeem-form-page__form" onSubmit={onSubmit}>
      <label className="redeem-form-page__label">AMOUNT TO REDEEM*</label>
      <input
        className="redeem-form-page__input"
        value={amount}
        readOnly
        aria-readonly
      />

      <label className="redeem-form-page__label" htmlFor="redeem-modal-ach-acct">
        Choose AccountNumber*
      </label>
      <input
        id="redeem-modal-ach-acct"
        className="redeem-form-page__input"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
        autoComplete="off"
        required
      />

      <label className="redeem-form-page__label" htmlFor="redeem-modal-ach-route">
        Choose RoutingNumber*
      </label>
      <input
        id="redeem-modal-ach-route"
        className="redeem-form-page__input"
        value={routingNumber}
        onChange={(e) => setRoutingNumber(e.target.value)}
        autoComplete="off"
        required
      />

      <p className="redeem-form-page__hint">REDEEM TO ACH ACCOUNT</p>

      <button type="submit" className="redeem-form-page__confirm">
        CONFIRM
      </button>
    </form>
  );
}

function RedeemCreditCardForm({
  amount,
  onSuccess,
}: {
  amount: string;
  onSuccess: () => void;
}) {
  const { show } = useAlert();
  const [cardNumber, setCardNumber] = useState("");
  const [cardCode, setCardCode] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!cardNumber.trim() || !cardCode.trim()) return;
    show("Redemption request recorded (preview).", { variant: "success" });
    onSuccess();
  };

  return (
    <form className="redeem-form-page__form" onSubmit={onSubmit}>
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
      />

      <p className="redeem-form-page__hint">REDEEM TO CreditCard ACCOUNT</p>

      <button type="submit" className="redeem-form-page__confirm">
        CONFIRM
      </button>
    </form>
  );
}

function RedeemPayPalForm({
  amount,
  onSuccess,
}: {
  amount: string;
  onSuccess: () => void;
}) {
  const { show } = useAlert();
  const [email, setEmail] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    show("Redemption request recorded (preview).", { variant: "success" });
    onSuccess();
  };

  return (
    <form className="redeem-form-page__form" onSubmit={onSubmit}>
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
      />

      <p className="redeem-form-page__hint">REDEEM TO PayPal ACCOUNT</p>

      <button type="submit" className="redeem-form-page__confirm">
        CONFIRM
      </button>
    </form>
  );
}

export function RedeemMethodModal({ open, onClose }: Props) {
  const titleId = useId();
  const amountId = useId();

  const [step, setStep] = useState<Step>("pick");
  const [pickAmount, setPickAmount] = useState("");
  const [committedAmount, setCommittedAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<RedeemMethodSlug | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setPickAmount("");
    setCommittedAmount("");
    setSelectedMethod(null);
  }, [open]);

  const goBackFromForm = useCallback(() => {
    setStep("pick");
    setSelectedMethod(null);
  }, []);

  const onConfirmSuccess = useCallback(() => {
    onClose();
  }, [onClose]);

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
    [pickAmount, amountId]
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
    if (step === "form") {
      goBackFromForm();
      return;
    }
    onClose();
  }, [step, goBackFromForm, onClose]);

  const formBranch = useMemo(() => {
    if (step !== "form" || !selectedMethod) return null;
    const common = {
      amount: committedAmount,
      onSuccess: onConfirmSuccess,
    };
    switch (selectedMethod) {
      case "cashapp":
        return <RedeemCashAppForm {...common} />;
      case "ach":
        return <RedeemAchForm {...common} />;
      case "credit-card":
        return <RedeemCreditCardForm {...common} />;
      case "paypal":
        return <RedeemPayPalForm {...common} />;
      default:
        return null;
    }
  }, [
    step,
    selectedMethod,
    committedAmount,
    onConfirmSuccess,
  ]);

  const titleText =
    step === "pick"
      ? "Choose redemption method"
      : `Redeem via ${selectedMethod ? METHOD_LABEL[selectedMethod] : ""}`;

  if (!open) return null;

  return createPortal(
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
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
              : "redeem-method-modal__body"
          }>
          <h2 id={titleId} className="redeem-method-modal__sr-only">
            {titleText}
          </h2>

          {step === "pick" ? (
            <>
              <label className="redeem-method-modal__label" htmlFor={amountId}>
                AMOUNT TO REDEEM*
              </label>
              <input
                id={amountId}
                className="redeem-method-modal__input"
                type="text"
                inputMode="decimal"
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
    document.body
  );
}
