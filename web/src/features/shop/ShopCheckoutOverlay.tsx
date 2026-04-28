import { useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FaApple, FaRegCreditCard } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { IoChevronBack } from "react-icons/io5";
import { SiCashapp } from "react-icons/si";
import "./ShopCheckout.css";
import { CURRENCY_ICON_GC, CURRENCY_ICON_SC } from "../../lib/currencyIcons";
import type { ShopPack, ShopPaymentMethodId } from "./types";

const PANEL = "/images/shop";

export type CheckoutStep = "summary" | "payment" | "success";

type Props = {
  open: boolean;
  pack: ShopPack;
  step: CheckoutStep;
  visibleMethods: ShopPaymentMethodId[];
  buyBusy: boolean;
  buyError: string | null;
  paymentUrl: string | null;
  onClose: () => void;
  onSelectPaymentMethod: (method: ShopPaymentMethodId) => void;
  onCancelPaymentFrame: () => void;
};

function BackIcon() {
  return <IoChevronBack className="shop-checkout__back-icon" aria-hidden />;
}

const METHOD_ROWS: {
  id: ShopPaymentMethodId;
  label: string;
  icon: ReactNode;
}[] = [
  {
    id: "google",
    label: "Google Pay",
    icon: (
      <FcGoogle className="shop-checkout__pay-ri shop-checkout__pay-ri--google" />
    ),
  },
  {
    id: "apple",
    label: "Apple Pay",
    icon: (
      <FaApple className="shop-checkout__pay-ri shop-checkout__pay-ri--apple" />
    ),
  },
  {
    id: "credit",
    label: "Credit Card",
    icon: <FaRegCreditCard className="shop-checkout__pay-ri" />,
  },
  {
    id: "cashapp",
    label: "Cash APP",
    icon: (
      <SiCashapp className="shop-checkout__pay-ri shop-checkout__pay-ri--cashapp" />
    ),
  },
];

function OrderSummaryView({
  pack,
  visibleMethods,
  buyBusy,
  buyError,
  onClose,
  onSelectPayment,
}: {
  pack: ShopPack;
  visibleMethods: ShopPaymentMethodId[];
  buyBusy: boolean;
  buyError: string | null;
  onClose: () => void;
  onSelectPayment: (id: ShopPaymentMethodId) => void;
}) {
  const methodSet = new Set(visibleMethods);
  const rows = METHOD_ROWS.filter((r) => methodSet.has(r.id));

  return (
    <>
      <header className="app-modal__head-row">
        <button
          type="button"
          className="app-modal__head-btn"
          onClick={onClose}
          aria-label="Close">
          <BackIcon />
        </button>
        <h2
          className="app-modal__title--abs-center shop-checkout__title"
          id="shop-checkout-dialog-title">
          ORDER SUMMARY
        </h2>
        <span className="app-modal__head-spacer" aria-hidden />
      </header>
      <hr className="app-modal__rule shop-checkout__head-rule" />
      <div className="shop-checkout__summary-body">
        <p className="shop-checkout__price">{pack.price}</p>
        {pack.originalPrice && pack.originalPrice !== pack.price ? (
          <p className="shop-checkout__line shop-checkout__line--muted-small">
            <span className="shop-checkout__strike">
              {pack.originalPrice}
            </span>
          </p>
        ) : null}
        <p className="shop-checkout__line">
          <span className="shop-checkout__line-muted">Get</span>{" "}
          <span className="shop-checkout__line-gc">
            <span className="shop-page__chip shop-page__chip--gc">
              <img src={CURRENCY_ICON_GC} alt="" />
            </span>
            <span className="shop-checkout__line-amt shop-checkout__line-amt--gc">
              {pack.gcLabel}
            </span>
          </span>{" "}
          <span className="shop-checkout__line-muted">+ Free</span>{" "}
          <span className="shop-checkout__line-sc">
            <span className="shop-page__chip shop-page__chip--sc">
              <img src={CURRENCY_ICON_SC} alt="" />
            </span>
            <span className="shop-checkout__line-amt shop-checkout__line-amt--sc">
              {pack.bonusSc}
            </span>
          </span>
        </p>
        {buyError ? (
          <p className="shop-checkout__pay-error" role="alert">
            {buyError}
          </p>
        ) : null}
        {rows.length === 0 ? (
          <p className="shop-checkout__pay-error" role="status">
            No payment methods available for this product.
          </p>
        ) : (
          <ul className="shop-checkout__pay-list">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="shop-checkout__pay-btn shop-checkout__pay-btn--pill"
                  disabled={buyBusy}
                  onClick={() => onSelectPayment(row.id)}>
                  <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                    {row.icon}
                  </span>
                  <span className="shop-checkout__pay-btn-label">
                    {buyBusy ? "Please wait…" : row.label}
                  </span>
                  <span className="shop-checkout__pay-btn-balance" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function PaymentFrameView({
  paymentUrl,
  onBack,
}: {
  paymentUrl: string;
  onBack: () => void;
}) {
  return (
    <>
      <header className="app-modal__head-row">
        <button
          type="button"
          className="app-modal__head-btn"
          onClick={onBack}
          aria-label="Back to order summary">
          <BackIcon />
        </button>
        <h2
          className="app-modal__title--abs-center shop-checkout__title"
          id="shop-checkout-dialog-title">
          COMPLETE PAYMENT
        </h2>
        <span className="app-modal__head-spacer" aria-hidden />
      </header>
      <hr className="app-modal__rule shop-checkout__head-rule" />
      <div className="shop-checkout__payment-frame-wrap">
        <iframe
          title="Secure payment"
          className="shop-checkout__payment-frame"
          src={paymentUrl}
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>
    </>
  );
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <>
      <header className="app-modal__head-row">
        <span className="app-modal__head-spacer" aria-hidden />
        <h2
          className="app-modal__title--abs-center shop-checkout__title"
          id="shop-checkout-dialog-title">
          THANK YOU
        </h2>
        <button
          type="button"
          className="app-modal__close"
          onClick={onClose}
          aria-label="Close">
          ×
        </button>
      </header>
      <hr className="app-modal__rule shop-checkout__head-rule" />
      <div className="shop-checkout__summary-body shop-checkout__success-body">
        <p className="shop-checkout__success-text">
          Your purchase is complete. Coins have been added to your wallet.
        </p>
        <button
          type="button"
          className="shop-checkout__submit shop-checkout__submit--blue"
          onClick={onClose}>
          OK
        </button>
      </div>
    </>
  );
}

export function ShopCheckoutOverlay({
  open,
  pack,
  step,
  visibleMethods,
  buyBusy,
  buyError,
  paymentUrl,
  onClose,
  onSelectPaymentMethod,
  onCancelPaymentFrame,
}: Props) {
  const closeOverlay = useCallback(() => {
    onCancelPaymentFrame();
    onClose();
  }, [onClose, onCancelPaymentFrame]);

  const handleBackdrop = useCallback(() => {
    if (step === "payment") onCancelPaymentFrame();
    else if (step === "success") closeOverlay();
    else closeOverlay();
  }, [step, onCancelPaymentFrame, closeOverlay]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "payment") onCancelPaymentFrame();
      else closeOverlay();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, step, onCancelPaymentFrame, closeOverlay]);

  if (!open) return null;

  return createPortal(
    <div
      className="app-modal-overlay"
      role="presentation"
      onClick={handleBackdrop}>
      <div
        className={
          "app-modal app-modal--col shop-checkout" +
          (step === "payment" ? " shop-checkout--payment" : "")
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-checkout-dialog-title"
        onClick={(e) => e.stopPropagation()}>
        {step === "summary" ? (
          <OrderSummaryView
            pack={pack}
            visibleMethods={visibleMethods}
            buyBusy={buyBusy}
            buyError={buyError}
            onClose={closeOverlay}
            onSelectPayment={onSelectPaymentMethod}
          />
        ) : step === "payment" && paymentUrl ? (
          <PaymentFrameView
            paymentUrl={paymentUrl}
            onBack={onCancelPaymentFrame}
          />
        ) : (
          <SuccessView onClose={closeOverlay} />
        )}
      </div>
    </div>,
    document.body,
  );
}
