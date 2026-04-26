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

type Step = "summary" | "protect" | "card";

type PendingPayment = "credit" | "google" | "apple" | "cashapp" | null;

const US_STATE_CODES = "AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY,DC".split(
  ",",
);

type Props = {
  open: boolean;
  pack: Pack;
  step: Step;
  onClose: () => void;
  onStepChange: (step: Step) => void;
};

function BackIcon() {
  return <IoChevronBack className="shop-checkout__back-icon" aria-hidden />;
}

function OrderSummaryView({
  pack,
  onClose,
  onSelectPayment,
}: {
  pack: Pack;
  onClose: () => void;
  onSelectPayment: (id: "credit" | "google" | "apple" | "cashapp") => void;
}) {
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
        <ul className="shop-checkout__pay-list">
          <li>
            <button
              type="button"
              className="shop-checkout__pay-btn shop-checkout__pay-btn--pill"
              onClick={() => onSelectPayment("google")}>
              <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                <FcGoogle
                  className="shop-checkout__pay-ri shop-checkout__pay-ri--google"
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
              onClick={() => onSelectPayment("apple")}>
              <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                <FaApple
                  className="shop-checkout__pay-ri shop-checkout__pay-ri--apple"
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
              onClick={() => onSelectPayment("credit")}>
              <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                <FaRegCreditCard className="shop-checkout__pay-ri" />
              </span>
              <span className="shop-checkout__pay-btn-label">Credit Card</span>
              <span className="shop-checkout__pay-btn-balance" aria-hidden />
            </button>
          </li>
          <li>
            <button
              type="button"
              className="shop-checkout__pay-btn shop-checkout__pay-btn--pill"
              onClick={() => onSelectPayment("cashapp")}>
              <span className="shop-checkout__pay-btn-icon-slot" aria-hidden>
                <SiCashapp
                  className="shop-checkout__pay-ri shop-checkout__pay-ri--cashapp"
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

function ProtectAccountView({
  onClose,
  onContinue,
}: {
  onClose: () => void;
  onContinue: () => void;
}) {
  const idPrefix = useId();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [country, setCountry] = useState("US");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const dobYears = Array.from({ length: 2007 - 1920 + 1 }, (_, i) => 2007 - i);
  const dobDays = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("[shop checkout] protect account", {
      firstName,
      lastName,
      email,
      phoneCountry,
      phoneNumber,
      dob: `${dobYear}-${dobMonth}-${dobDay}`,
      address1,
      address2,
      country,
      city,
      state,
      zip,
    });
    onContinue();
  };

  return (
    <>
      <header className="app-modal__head-row shop-checkout__head--protect">
        <span className="app-modal__head-spacer" aria-hidden />
        <h2
          className="app-modal__title--abs-center shop-checkout__title"
          id="shop-checkout-dialog-title">
          PROTECT YOUR ACCOUNT
        </h2>
        <button
          type="button"
          className="app-modal__close"
          onClick={onClose}
          aria-label="Close and return to order summary">
          ×
        </button>
      </header>
      <hr className="app-modal__rule shop-checkout__head-rule" />
      <form
        className="shop-checkout__card-form shop-checkout__protect-form"
        onSubmit={handleSubmit}
        noValidate>
        <p className="shop-checkout__protect-lead">
          let us help you redeem your winnings faster please ensure your details are
          correct
        </p>
        <div className="shop-checkout__fields shop-checkout__fields--protect">
          <div className="shop-checkout__row2">
            <label className="shop-checkout__field" htmlFor={`${idPrefix}-fn`}>
              <span className="shop-checkout__label-text shop-checkout__label-text--protect">
                FirstName
              </span>
              <input
                id={`${idPrefix}-fn`}
                className="shop-checkout__input shop-checkout__input--protect"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="FirstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="shop-checkout__field" htmlFor={`${idPrefix}-ln`}>
              <span className="shop-checkout__label-text shop-checkout__label-text--protect">
                LastName
              </span>
              <input
                id={`${idPrefix}-ln`}
                className="shop-checkout__input shop-checkout__input--protect"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="LastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
          </div>
          <label className="shop-checkout__field" htmlFor={`${idPrefix}-email`}>
            <span className="shop-checkout__label-text shop-checkout__label-text--protect">
              Email
            </span>
            <input
              id={`${idPrefix}-email`}
              className="shop-checkout__input shop-checkout__input--protect"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="summer@ffglobaltech.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <div className="shop-checkout__field shop-checkout__field--stack">
            <span
              className="shop-checkout__field-heading"
              id={`${idPrefix}-phone-legend`}>
              Phone :
            </span>
            <div
              className="shop-checkout__row-phone"
              role="group"
              aria-labelledby={`${idPrefix}-phone-legend`}>
              <input
                className="shop-checkout__input shop-checkout__input--protect shop-checkout__input--code"
                name="phoneCountry"
                type="text"
                inputMode="numeric"
                autoComplete="tel-country-code"
                placeholder="1"
                value={phoneCountry}
                onChange={(e) => setPhoneCountry(e.target.value)}
                aria-label="Country code"
              />
              <input
                className="shop-checkout__input shop-checkout__input--protect shop-checkout__input--grow"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="PhoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="shop-checkout__field shop-checkout__field--stack">
            <span
              className="shop-checkout__field-heading"
              id={`${idPrefix}-dob-legend`}>
              Date of birth
            </span>
            <div
              className="shop-checkout__row3"
              role="group"
              aria-labelledby={`${idPrefix}-dob-legend`}>
              <select
                className="shop-checkout__input shop-checkout__input--protect shop-checkout__select"
                name="dobMonth"
                aria-label="Month"
                value={dobMonth}
                onChange={(e) => setDobMonth(e.target.value)}>
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={String(m).padStart(2, "0")}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                className="shop-checkout__input shop-checkout__input--protect shop-checkout__select"
                name="dobDay"
                aria-label="Day"
                value={dobDay}
                onChange={(e) => setDobDay(e.target.value)}>
                <option value="">Day</option>
                {dobDays.map((d) => (
                  <option key={d} value={String(d).padStart(2, "0")}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                className="shop-checkout__input shop-checkout__input--protect shop-checkout__select"
                name="dobYear"
                aria-label="Year"
                value={dobYear}
                onChange={(e) => setDobYear(e.target.value)}>
                <option value="">Year</option>
                {dobYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="shop-checkout__field" htmlFor={`${idPrefix}-a1`}>
            <span className="shop-checkout__label-text shop-checkout__label-text--protect">
              Address line 1*
            </span>
            <input
              id={`${idPrefix}-a1`}
              className="shop-checkout__input shop-checkout__input--protect"
              name="address1"
              type="text"
              autoComplete="address-line1"
              placeholder="Address line 1*"
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
            />
          </label>
          <p className="shop-checkout__helper-green">
            Please do not enter a PO box address. Use a valid address
          </p>
          <label className="shop-checkout__field" htmlFor={`${idPrefix}-a2`}>
            <span className="shop-checkout__label-text shop-checkout__label-text--protect">
              Address line 2 (optional)
            </span>
            <input
              id={`${idPrefix}-a2`}
              className="shop-checkout__input shop-checkout__input--protect"
              name="address2"
              type="text"
              autoComplete="address-line2"
              placeholder="Address line 2(optional)"
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
            />
          </label>
          <div className="shop-checkout__field shop-checkout__field--stack">
            <span
              className="shop-checkout__field-heading"
              id={`${idPrefix}-cc-legend`}>
              Country:
            </span>
            <div
              className="shop-checkout__row2"
              role="group"
              aria-labelledby={`${idPrefix}-cc-legend`}>
              <label className="shop-checkout__field" htmlFor={`${idPrefix}-ctry`}>
                <span className="shop-checkout__visually-hidden">Country</span>
                <select
                  id={`${idPrefix}-ctry`}
                  className="shop-checkout__input shop-checkout__input--protect shop-checkout__select"
                  name="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}>
                  <option value="US">US</option>
                </select>
              </label>
              <label className="shop-checkout__field" htmlFor={`${idPrefix}-city`}>
                <span className="shop-checkout__visually-hidden">City</span>
                <input
                  id={`${idPrefix}-city`}
                  className="shop-checkout__input shop-checkout__input--protect"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="City*"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
            </div>
          </div>
          <div className="shop-checkout__field shop-checkout__field--stack">
            <span
              className="shop-checkout__field-heading"
              id={`${idPrefix}-st-legend`}>
              State:
            </span>
            <div
              className="shop-checkout__row2"
              role="group"
              aria-labelledby={`${idPrefix}-st-legend`}>
              <label className="shop-checkout__field" htmlFor={`${idPrefix}-st`}>
                <span className="shop-checkout__visually-hidden">State</span>
                <select
                  id={`${idPrefix}-st`}
                  className="shop-checkout__input shop-checkout__input--protect shop-checkout__select"
                  name="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}>
                  <option value="">Select state</option>
                  {US_STATE_CODES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="shop-checkout__field" htmlFor={`${idPrefix}-zip`}>
                <span className="shop-checkout__visually-hidden">Zip</span>
                <input
                  id={`${idPrefix}-zip`}
                  className="shop-checkout__input shop-checkout__input--protect"
                  name="zip"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="Zip*"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
        <p className="shop-checkout__footer-hint">
          Please confirm your details. These details should match your official ID
          document
        </p>
        <button
          type="submit"
          className="shop-checkout__submit shop-checkout__submit--blue">
          SUBMIT
        </button>
      </form>
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
      <header className="app-modal__head-row">
        <button
          type="button"
          className="app-modal__head-btn"
          onClick={onBack}
          aria-label="Back to protect your account">
          <BackIcon />
        </button>
        <h2
          className="app-modal__title--abs-center shop-checkout__title"
          id="shop-checkout-dialog-title">
          CARD DETAILS
        </h2>
        <span className="app-modal__head-spacer" aria-hidden />
      </header>
      <hr className="app-modal__rule shop-checkout__head-rule" />
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
  const [pendingPayment, setPendingPayment] = useState<PendingPayment>(null);

  useEffect(() => {
    setPendingPayment(null);
  }, [open, pack.id]);

  const closeOverlay = useCallback(() => {
    setPendingPayment(null);
    onClose();
  }, [onClose]);

  const leaveProtectToSummary = useCallback(() => {
    setPendingPayment(null);
    onStepChange("summary");
  }, [onStepChange]);

  const handleProtectContinue = useCallback(() => {
    if (pendingPayment === "credit") {
      onStepChange("card");
      return;
    }
    if (
      pendingPayment === "google" ||
      pendingPayment === "apple" ||
      pendingPayment === "cashapp"
    ) {
      console.warn(`[shop checkout] ${pendingPayment} not available yet`);
      setPendingPayment(null);
      onStepChange("summary");
      return;
    }
    setPendingPayment(null);
    onStepChange("summary");
  }, [pendingPayment, onStepChange]);

  const handleSelectPayment = useCallback(
    (id: NonNullable<Exclude<PendingPayment, null>>) => {
      setPendingPayment(id);
      onStepChange("protect");
    },
    [onStepChange],
  );

  const handleBackdrop = useCallback(() => {
    if (step === "card") onStepChange("protect");
    else if (step === "protect") leaveProtectToSummary();
    else closeOverlay();
  }, [step, onStepChange, leaveProtectToSummary, closeOverlay]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "card") onStepChange("protect");
      else if (step === "protect") leaveProtectToSummary();
      else closeOverlay();
    },
    [step, onStepChange, leaveProtectToSummary, closeOverlay],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  return createPortal(
    <div
      className="app-modal-overlay"
      role="presentation"
      onClick={handleBackdrop}>
      <div
        className="app-modal app-modal--col shop-checkout"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shop-checkout-dialog-title"
        onClick={(e) => e.stopPropagation()}>
        {step === "summary" ? (
          <OrderSummaryView
            pack={pack}
            onClose={closeOverlay}
            onSelectPayment={handleSelectPayment}
          />
        ) : step === "protect" ? (
          <ProtectAccountView
            key={pack.id}
            onClose={leaveProtectToSummary}
            onContinue={handleProtectContinue}
          />
        ) : (
          <CardDetailsView
            key={pack.id}
            pack={pack}
            onBack={() => onStepChange("protect")}
            onComplete={closeOverlay}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
