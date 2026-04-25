import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { FaApple, FaRegCreditCard } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { IoChevronBack } from "react-icons/io5";
import { SiCashapp } from "react-icons/si";
import "./ShopCheckout.css";
import { CURRENCY_ICON_GC, CURRENCY_ICON_SC } from "../../lib/currencyIcons";
import type { Pack } from "./types";

const PANEL = "/imgs/panel/Panel_Shop";

type Step = "summary" | "card";

type Props = {
  open: boolean;
  pack: Pack;
  step: Step;
  onClose: () => void;
  onStepChange: (step: Step) => void;
};

function BackIcon() {
  return <IoChevronBack className="shop-checkout__back-icon" size={24} aria-hidden />;
}

function OrderSummaryView({
  pack,
  onClose,
  onSelectCreditCard,
  onSelectOther,
}: {
  pack: Pack;
  onClose: () => void;
  onSelectCreditCard: () => void;
  onSelectOther: (id: "google" | "apple" | "cashapp") => void;
}) {
  return (
    <>
      <header className="shop-checkout__head">
        <button
          type="button"
          className="shop-checkout__back"
          onClick={onClose}
          aria-label="Close">
          <BackIcon />
        </button>
        <h2 className="shop-checkout__title" id="shop-checkout-dialog-title">
          ORDER SUMMARY
        </h2>
        <span className="shop-checkout__head-spacer" aria-hidden />
      </header>
      <hr className="shop-checkout__head-rule" />
      <div className="shop-checkout__summary-body">
        <p className="shop-checkout__price">{pack.price}</p>
        <p className="shop-checkout__line">
          <span className="shop-checkout__line-muted">Get</span>{" "}
          <span className="shop-checkout__line-gc">
            <span className="shop-page__chip shop-page__chip--gc">
              <img src={CURRENCY_ICON_GC} alt="" width={24} height={24} />
            </span>
            <span className="shop-checkout__line-amt shop-checkout__line-amt--gc">
              {pack.gcLabel}
            </span>
          </span>{" "}
          <span className="shop-checkout__line-muted">+ Free</span>{" "}
          <span className="shop-checkout__line-sc">
            <span className="shop-page__chip shop-page__chip--sc">
              <img src={CURRENCY_ICON_SC} alt="" width={24} height={24} />
            </span>
            <span className="shop-checkout__line-amt shop-checkout__line-amt--sc">
              {pack.bonusSc}
            </span>
          </span>
        </p>
        <ul className="shop-checkout__pay-list">
          <li>
            <button
              type="button"
              className="shop-checkout__pay-btn shop-checkout__pay-btn--pill"
              onClick={() => onSelectOther("google")}>
              <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                <FcGoogle
                  className="shop-checkout__pay-ri shop-checkout__pay-ri--google"
                  size={18}
                />
              </span>
              <span className="shop-checkout__pay-btn-label">Google Pay</span>
              <span className="shop-checkout__pay-btn-balance" aria-hidden />
            </button>
          </li>
          <li>
            <button
              type="button"
              className="shop-checkout__pay-btn shop-checkout__pay-btn--pill"
              onClick={() => onSelectOther("apple")}>
              <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                <FaApple
                  className="shop-checkout__pay-ri shop-checkout__pay-ri--apple"
                  size={17}
                />
              </span>
              <span className="shop-checkout__pay-btn-label">Apple Pay</span>
              <span className="shop-checkout__pay-btn-balance" aria-hidden />
            </button>
          </li>
          <li>
            <button
              type="button"
              className="shop-checkout__pay-btn shop-checkout__pay-btn--pill"
              onClick={onSelectCreditCard}>
              <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                <FaRegCreditCard
                  className="shop-checkout__pay-ri"
                  size={17}
                />
              </span>
              <span className="shop-checkout__pay-btn-label">Credit Card</span>
              <span className="shop-checkout__pay-btn-balance" aria-hidden />
            </button>
          </li>
          <li>
            <button
              type="button"
              className="shop-checkout__pay-btn shop-checkout__pay-btn--pill"
              onClick={() => onSelectOther("cashapp")}>
              <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                <SiCashapp
                  className="shop-checkout__pay-ri shop-checkout__pay-ri--cashapp"
                  size={17}
                />
              </span>
              <span className="shop-checkout__pay-btn-label">Cash APP</span>
              <span className="shop-checkout__pay-btn-balance" aria-hidden />
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}

function CardDetailsView({
  pack,
  onBack,
  onComplete,
}: {
  pack: Pack;
  onBack: () => void;
  onComplete: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  const idPrefix = useId();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Stub: wire to tokenized PSP / GameShell in production; do not send raw PAN to your API.
    console.log("[shop checkout] complete purchase", {
      packId: pack.id,
      saveCard,
      // omit raw card data in real builds
    });
    onComplete();
  };

  return (
    <>
      <header className="shop-checkout__head">
        <button
          type="button"
          className="shop-checkout__back"
          onClick={onBack}
          aria-label="Back to order summary">
          <BackIcon />
        </button>
        <h2 className="shop-checkout__title" id="shop-checkout-dialog-title">
          CARD DETAILS
        </h2>
        <span className="shop-checkout__head-spacer" aria-hidden />
      </header>
      <hr className="shop-checkout__head-rule" />
      <form
        className="shop-checkout__card-form"
        onSubmit={handleSubmit}
        noValidate>
        <p className="shop-checkout__required-note">* Required Fields</p>
        <div className="shop-checkout__fields">
          <label className="shop-checkout__field" htmlFor={`${idPrefix}-cc`}>
            <span className="shop-checkout__label-text">
              CREDIT CARD NUMBER*
            </span>
            <input
              id={`${idPrefix}-cc`}
              className="shop-checkout__input"
              name="ccnumber"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="Enter Your Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </label>
          <label className="shop-checkout__field" htmlFor={`${idPrefix}-name`}>
            <span className="shop-checkout__label-text">NAME ON CARD*</span>
            <input
              id={`${idPrefix}-name`}
              className="shop-checkout__input"
              name="ccname"
              type="text"
              autoComplete="cc-name"
              placeholder="Enter Your Full Name"
              value={nameOnCard}
              onChange={(e) => setNameOnCard(e.target.value)}
            />
          </label>
          <div className="shop-checkout__row2">
            <label className="shop-checkout__field" htmlFor={`${idPrefix}-exp`}>
              <span className="shop-checkout__label-text">EXPIRY*</span>
              <input
                id={`${idPrefix}-exp`}
                className="shop-checkout__input"
                name="cc-exp"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </label>
            <label className="shop-checkout__field" htmlFor={`${idPrefix}-cvv`}>
              <span className="shop-checkout__label-text">CVV*</span>
              <input
                id={`${idPrefix}-cvv`}
                className="shop-checkout__input"
                name="cvc"
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="Enter Your CVV"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
              />
            </label>
          </div>
        </div>
        <label className="shop-checkout__save">
          <input
            type="checkbox"
            className="shop-checkout__save-input"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
          />
          <span className="shop-checkout__save-box" aria-hidden />
          <span className="shop-checkout__save-text">
            KEEP MY CREDIT CARD DETAILS
          </span>
        </label>
        <div className="shop-checkout__logos" aria-label="Accepted cards">
          <img
            src={`${PANEL}/logo_VISA2.png`}
            alt="Visa"
            className="shop-checkout__logo"
          />
          <img
            src={`${PANEL}/logo_masterCard2.png`}
            alt="Mastercard"
            className="shop-checkout__logo"
          />
          <img
            src={`${PANEL}/logo_AMEX2.png`}
            alt="American Express"
            className="shop-checkout__logo"
          />
        </div>
        <button type="submit" className="shop-checkout__submit">
          COMPLETE PURCHASE
        </button>
      </form>
    </>
  );
}

export function ShopCheckoutOverlay({
  open,
  pack,
  step,
  onClose,
  onStepChange,
}: Props) {
  const handleBackdrop = useCallback(() => {
    if (step === "card") onStepChange("summary");
    else onClose();
  }, [step, onClose, onStepChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "card") onStepChange("summary");
      else onClose();
    },
    [step, onClose, onStepChange],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  const onSelectOther = useCallback(
    (id: "google" | "apple" | "cashapp") => {
      console.warn(`[shop checkout] ${id} not available yet`);
    },
    [],
  );

  if (!open) return null;

  return createPortal(
    <div
      className="shop-checkout-overlay"
      role="presentation"
      onClick={handleBackdrop}>
      <div
        className="shop-checkout"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-checkout-dialog-title"
        onClick={(e) => e.stopPropagation()}>
        {step === "summary" ? (
          <OrderSummaryView
            pack={pack}
            onClose={onClose}
            onSelectCreditCard={() => onStepChange("card")}
            onSelectOther={onSelectOther}
          />
        ) : (
          <CardDetailsView
            key={pack.id}
            pack={pack}
            onBack={() => onStepChange("summary")}
            onComplete={onClose}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
