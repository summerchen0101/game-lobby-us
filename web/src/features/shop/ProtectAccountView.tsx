import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { IoChevronBack } from "react-icons/io5";
import { splitPhoneForBindingForm } from "./splitPhoneForBindingForm";
import type { ShopBindingFormPayload, ShopBindingPrefill } from "./types";

const US_STATE_CODES =
  "AL,AK,AZ,AR,CA,CO,CT,DE,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY,DC".split(
    ",",
  );

const PHONE_COUNTRY_CODES = ["886", "1"] as const;

/** Digits only, leading zeros removed (e.g. 09… → 9…) for binding payload. */
function normalizePhoneDigitsForSubmit(input: string): string {
  return input.replace(/\D/g, "").replace(/^0+/, "");
}

type FieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "phoneCountry"
  | "phoneNumber"
  | "dob"
  | "address1"
  | "city"
  | "state"
  | "zip"
  | "sms";

const FIELD_LABELS: Record<FieldKey, string> = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phoneCountry: "Country code",
  phoneNumber: "Phone number",
  dob: "Date of birth",
  address1: "Address line 1",
  city: "City",
  state: "State",
  zip: "ZIP code",
  sms: "SMS code",
};

const SCROLL_ORDER: FieldKey[] = [
  "firstName",
  "lastName",
  "email",
  "phoneCountry",
  "phoneNumber",
  "dob",
  "address1",
  "city",
  "state",
  "zip",
  "sms",
];

function formatMissingLabels(keys: Set<FieldKey>): string {
  const labels = SCROLL_ORDER.filter((k) => keys.has(k)).map(
    (k) => FIELD_LABELS[k],
  );
  if (labels.length === 0) return "Please complete the highlighted fields.";
  return `Missing: ${labels.join(", ")}`;
}

function BackIcon() {
  return <IoChevronBack className="shop-checkout__back-icon" aria-hidden />;
}

type Props = {
  bindingBusy: boolean;
  bindingError: string | null;
  protectNeedSms: boolean;
  bindingPrefill?: ShopBindingPrefill;
  /** Full exit from protect flow (e.g. to order summary). */
  onClose: () => void;
  /** From SMS verification: return to the full binding form without leaving checkout. */
  onBackToProtectForm: () => void;
  onSubmit: (payload: ShopBindingFormPayload) => Promise<void>;
};

const PROTECT_ACCOUNT_DEV_DEFAULTS = import.meta.env.DEV
  ? {
      firstName: "Summer",
      lastName: "Chen",
      email: "summer@ffglobaltech.com",
      phoneCountry: "1",
      phoneNumber: "3105550192",
      dobMonth: "03",
      dobDay: "15",
      dobYear: "1990",
      address1: "742 Evergreen Terrace",
      address2: "Apt 2B",
      country: "US",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
    }
  : null;

const dev = PROTECT_ACCOUNT_DEV_DEFAULTS;

export function ProtectAccountView({
  bindingBusy,
  bindingError,
  protectNeedSms,
  bindingPrefill,
  onClose,
  onBackToProtectForm,
  onSubmit,
}: Props) {
  const idPrefix = useId();
  const [firstName, setFirstName] = useState(dev?.firstName ?? "");
  const [lastName, setLastName] = useState(dev?.lastName ?? "");
  const [email, setEmail] = useState(dev?.email ?? "");
  const [phoneCountry, setPhoneCountry] = useState(dev?.phoneCountry ?? "1");
  const [phoneNumber, setPhoneNumber] = useState(dev?.phoneNumber ?? "");
  const [dobMonth, setDobMonth] = useState(dev?.dobMonth ?? "");
  const [dobDay, setDobDay] = useState(dev?.dobDay ?? "");
  const [dobYear, setDobYear] = useState(dev?.dobYear ?? "");
  const [address1, setAddress1] = useState(dev?.address1 ?? "");
  const [address2, setAddress2] = useState(dev?.address2 ?? "");
  const [country, setCountry] = useState(dev?.country ?? "US");
  const [city, setCity] = useState(dev?.city ?? "");
  const [state, setState] = useState(dev?.state ?? "");
  const [zip, setZip] = useState(dev?.zip ?? "");
  const [smsAnswer, setSmsAnswer] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<FieldKey>>(
    () => new Set(),
  );
  const scrollInvalidIntoViewAfterSubmit = useRef(false);

  const dobYears = Array.from({ length: 2007 - 1920 + 1 }, (_, i) => 2007 - i);
  const dobDays = Array.from({ length: 31 }, (_, i) => i + 1);

  const fieldDomId = useCallback(
    (key: FieldKey): string => {
      switch (key) {
        case "firstName":
          return `${idPrefix}-fn`;
        case "lastName":
          return `${idPrefix}-ln`;
        case "email":
          return `${idPrefix}-email`;
        case "phoneCountry":
          return `${idPrefix}-phone-cc`;
        case "phoneNumber":
          return `${idPrefix}-phone-num`;
        case "dob":
          return `${idPrefix}-dob-m`;
        case "address1":
          return `${idPrefix}-a1`;
        case "city":
          return `${idPrefix}-city`;
        case "state":
          return `${idPrefix}-st`;
        case "zip":
          return `${idPrefix}-zip`;
        case "sms":
          return `${idPrefix}-sms`;
      }
    },
    [idPrefix],
  );

  const removeInvalid = useCallback((key: FieldKey) => {
    setInvalidFields((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!(PHONE_COUNTRY_CODES as readonly string[]).includes(phoneCountry)) {
      setPhoneCountry("1");
    }
  }, [phoneCountry]);

  useEffect(() => {
    setInvalidFields(new Set());
    setLocalError(null);
    if (!protectNeedSms) setSmsAnswer("");
  }, [protectNeedSms]);

  useEffect(() => {
    const e = bindingPrefill?.email?.trim();
    if (!e) return;
    setEmail((prev) => (prev.trim() ? prev : e));
  }, [bindingPrefill?.email]);

  useEffect(() => {
    const raw = bindingPrefill?.phone?.trim();
    if (!raw) return;
    const split = splitPhoneForBindingForm(raw);
    if (!split.national) return;
    setPhoneNumber((pn) => {
      if (pn.replace(/\D/g, "").length > 0) return pn;
      setPhoneCountry(split.countryCode);
      return split.national;
    });
  }, [bindingPrefill?.phone]);

  useEffect(() => {
    if (invalidFields.size === 0) {
      scrollInvalidIntoViewAfterSubmit.current = false;
      return;
    }
    if (!scrollInvalidIntoViewAfterSubmit.current) return;
    scrollInvalidIntoViewAfterSubmit.current = false;
    requestAnimationFrame(() => {
      for (const key of SCROLL_ORDER) {
        if (!invalidFields.has(key)) continue;
        const el = document.getElementById(fieldDomId(key));
        if (el) {
          el.scrollIntoView({ block: "nearest", behavior: "smooth" });
          break;
        }
      }
    });
  }, [invalidFields, fieldDomId]);

  const buildPayload = (answer: string): ShopBindingFormPayload => {
    const birthday = `${dobYear}-${dobMonth}-${dobDay}`;
    const addrParts = [address1.trim(), address2.trim()].filter(Boolean);
    const address = addrParts.join(", ");
    return {
      countryCode: phoneCountry.trim(),
      phone: normalizePhoneDigitsForSubmit(phoneNumber),
      email: email.trim(),
      answer,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthday,
      address,
      country,
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
    };
  };

  const computeInvalidFields = (): Set<FieldKey> => {
    const s = new Set<FieldKey>();
    if (!firstName.trim()) s.add("firstName");
    if (!lastName.trim()) s.add("lastName");
    if (!email.trim()) s.add("email");
    if (!phoneCountry.trim()) s.add("phoneCountry");
    const digits = phoneNumber.replace(/\D/g, "");
    if (!phoneNumber.trim() || digits.length === 0) s.add("phoneNumber");
    if (!dobMonth || !dobDay || !dobYear) s.add("dob");
    if (!address1.trim()) s.add("address1");
    if (!city.trim()) s.add("city");
    if (!state.trim()) s.add("state");
    if (!zip.trim()) s.add("zip");
    return s;
  };

  const inv = (key: FieldKey) => invalidFields.has(key);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setInvalidFields(new Set());
    setLocalError(null);
    if (protectNeedSms) {
      const code = smsAnswer.trim();
      if (!code) {
        scrollInvalidIntoViewAfterSubmit.current = true;
        setInvalidFields(new Set<FieldKey>(["sms"]));
        setLocalError("Enter the verification code.");
        return;
      }
      setInvalidFields(new Set());
      await onSubmit(buildPayload(code));
      return;
    }
    const missing = computeInvalidFields();
    if (missing.size > 0) {
      scrollInvalidIntoViewAfterSubmit.current = true;
      setInvalidFields(missing);
      setLocalError(formatMissingLabels(missing));
      return;
    }
    await onSubmit(buildPayload(""));
  };

  const pi = "shop-checkout__input shop-checkout__input--protect";

  return (
    <>
      <header className="app-modal__head-row shop-checkout__head--protect">
        <button
          type="button"
          className="app-modal__head-btn"
          onClick={
            protectNeedSms ? onBackToProtectForm : onClose
          }
          aria-label={
            protectNeedSms
              ? "Back to protect account form"
              : "Back to order summary"
          }>
          <BackIcon />
        </button>
        <h2
          className="app-modal__title--abs-center shop-checkout__title"
          id="shop-checkout-dialog-title">
          PROTECT YOUR ACCOUNT
        </h2>
        {protectNeedSms ? (
          <span className="app-modal__head-spacer" aria-hidden />
        ) : (
          <button
            type="button"
            className="app-modal__close"
            onClick={onClose}
            aria-label="Close and return to order summary">
            ×
          </button>
        )}
      </header>
      <hr className="app-modal__rule shop-checkout__head-rule" />
      <form
        className="shop-checkout__card-form shop-checkout__protect-form"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate>
        <fieldset disabled={bindingBusy} className="shop-checkout__fieldset-reset">
        {protectNeedSms ? (
          <>
            <p className="shop-checkout__protect-lead">
              Enter the verification code sent to your phone.
            </p>
            <div className="shop-checkout__fields shop-checkout__fields--protect">
              <label
                className="shop-checkout__field"
                htmlFor={`${idPrefix}-sms`}>
                <span className="shop-checkout__label-text shop-checkout__label-text--protect">
                  SMS code
                </span>
                <input
                  id={`${idPrefix}-sms`}
                  className={
                    pi + (inv("sms") ? " shop-checkout__field-invalid" : "")
                  }
                  name="smsAnswer"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Code"
                  value={smsAnswer}
                  aria-invalid={inv("sms")}
                  onChange={(e) => {
                    setSmsAnswer(e.target.value);
                    removeInvalid("sms");
                  }}
                />
              </label>
            </div>
          </>
        ) : (
          <>
            <p className="shop-checkout__protect-lead">
              let us help you redeem your winnings faster please ensure your
              details are correct
            </p>
            <div className="shop-checkout__fields shop-checkout__fields--protect">
              <div className="shop-checkout__row2">
                <label
                  className="shop-checkout__field"
                  htmlFor={`${idPrefix}-fn`}>
                  <span className="shop-checkout__label-text shop-checkout__label-text--protect">
                    FirstName
                  </span>
                  <input
                    id={`${idPrefix}-fn`}
                    className={
                      pi +
                      (inv("firstName") ? " shop-checkout__field-invalid" : "")
                    }
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    placeholder="FirstName"
                    value={firstName}
                    aria-invalid={inv("firstName")}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      removeInvalid("firstName");
                    }}
                  />
                </label>
                <label
                  className="shop-checkout__field"
                  htmlFor={`${idPrefix}-ln`}>
                  <span className="shop-checkout__label-text shop-checkout__label-text--protect">
                    LastName
                  </span>
                  <input
                    id={`${idPrefix}-ln`}
                    className={
                      pi +
                      (inv("lastName") ? " shop-checkout__field-invalid" : "")
                    }
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    placeholder="LastName"
                    value={lastName}
                    aria-invalid={inv("lastName")}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      removeInvalid("lastName");
                    }}
                  />
                </label>
              </div>
              <label
                className="shop-checkout__field"
                htmlFor={`${idPrefix}-email`}>
                <span className="shop-checkout__label-text shop-checkout__label-text--protect">
                  Email
                </span>
                <input
                  id={`${idPrefix}-email`}
                  className={
                    pi + (inv("email") ? " shop-checkout__field-invalid" : "")
                  }
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder=""
                  value={email}
                  aria-invalid={inv("email")}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    removeInvalid("email");
                  }}
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
                  <select
                    id={`${idPrefix}-phone-cc`}
                    className={
                      "shop-checkout__input shop-checkout__input--protect shop-checkout__select shop-checkout__input--code" +
                      (inv("phoneCountry")
                        ? " shop-checkout__field-invalid"
                        : "")
                    }
                    name="phoneCountry"
                    autoComplete="tel-country-code"
                    aria-label="Country code"
                    value={phoneCountry}
                    aria-invalid={inv("phoneCountry")}
                    onChange={(e) => {
                      setPhoneCountry(e.target.value);
                      removeInvalid("phoneCountry");
                    }}>
                    {PHONE_COUNTRY_CODES.map((code) => (
                      <option key={code} value={code}>
                        +{code}
                      </option>
                    ))}
                  </select>
                  <input
                    id={`${idPrefix}-phone-num`}
                    className={
                      pi +
                      " shop-checkout__input--grow" +
                      (inv("phoneNumber")
                        ? " shop-checkout__field-invalid"
                        : "")
                    }
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    placeholder="PhoneNumber"
                    value={phoneNumber}
                    aria-invalid={inv("phoneNumber")}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      removeInvalid("phoneNumber");
                    }}
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
                    id={`${idPrefix}-dob-m`}
                    className={
                      "shop-checkout__input shop-checkout__input--protect shop-checkout__select" +
                      (inv("dob") ? " shop-checkout__field-invalid" : "")
                    }
                    name="dobMonth"
                    aria-label="Month"
                    aria-invalid={inv("dob")}
                    value={dobMonth}
                    onChange={(e) => {
                      setDobMonth(e.target.value);
                      removeInvalid("dob");
                    }}>
                    <option value="">Month</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={String(m).padStart(2, "0")}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    id={`${idPrefix}-dob-d`}
                    className={
                      "shop-checkout__input shop-checkout__input--protect shop-checkout__select" +
                      (inv("dob") ? " shop-checkout__field-invalid" : "")
                    }
                    name="dobDay"
                    aria-label="Day"
                    aria-invalid={inv("dob")}
                    value={dobDay}
                    onChange={(e) => {
                      setDobDay(e.target.value);
                      removeInvalid("dob");
                    }}>
                    <option value="">Day</option>
                    {dobDays.map((d) => (
                      <option key={d} value={String(d).padStart(2, "0")}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    id={`${idPrefix}-dob-y`}
                    className={
                      "shop-checkout__input shop-checkout__input--protect shop-checkout__select" +
                      (inv("dob") ? " shop-checkout__field-invalid" : "")
                    }
                    name="dobYear"
                    aria-label="Year"
                    aria-invalid={inv("dob")}
                    value={dobYear}
                    onChange={(e) => {
                      setDobYear(e.target.value);
                      removeInvalid("dob");
                    }}>
                    <option value="">Year</option>
                    {dobYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <label
                className="shop-checkout__field"
                htmlFor={`${idPrefix}-a1`}>
                <span className="shop-checkout__label-text shop-checkout__label-text--protect">
                  Address line 1*
                </span>
                <input
                  id={`${idPrefix}-a1`}
                  className={
                    pi +
                    (inv("address1") ? " shop-checkout__field-invalid" : "")
                  }
                  name="address1"
                  type="text"
                  autoComplete="address-line1"
                  placeholder="Address line 1*"
                  value={address1}
                  aria-invalid={inv("address1")}
                  onChange={(e) => {
                    setAddress1(e.target.value);
                    removeInvalid("address1");
                  }}
                />
              </label>
              <p className="shop-checkout__helper-green">
                Please do not enter a PO box address. Use a valid address
              </p>
              <label
                className="shop-checkout__field"
                htmlFor={`${idPrefix}-a2`}>
                <span className="shop-checkout__label-text shop-checkout__label-text--protect">
                  Address line 2 (optional)
                </span>
                <input
                  id={`${idPrefix}-a2`}
                  className={pi}
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
                  <label
                    className="shop-checkout__field"
                    htmlFor={`${idPrefix}-ctry`}>
                    <span className="shop-checkout__visually-hidden">
                      Country
                    </span>
                    <select
                      id={`${idPrefix}-ctry`}
                      className="shop-checkout__input shop-checkout__input--protect shop-checkout__select"
                      name="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}>
                      <option value="US">US</option>
                    </select>
                  </label>
                  <label
                    className="shop-checkout__field"
                    htmlFor={`${idPrefix}-city`}>
                    <span className="shop-checkout__visually-hidden">City</span>
                    <input
                      id={`${idPrefix}-city`}
                      className={
                        pi +
                        (inv("city") ? " shop-checkout__field-invalid" : "")
                      }
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      placeholder="City*"
                      value={city}
                      aria-invalid={inv("city")}
                      onChange={(e) => {
                        setCity(e.target.value);
                        removeInvalid("city");
                      }}
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
                  <label
                    className="shop-checkout__field"
                    htmlFor={`${idPrefix}-st`}>
                    <span className="shop-checkout__visually-hidden">
                      State
                    </span>
                    <select
                      id={`${idPrefix}-st`}
                      className={
                        "shop-checkout__input shop-checkout__input--protect shop-checkout__select" +
                        (inv("state") ? " shop-checkout__field-invalid" : "")
                      }
                      name="state"
                      value={state}
                      aria-invalid={inv("state")}
                      onChange={(e) => {
                        setState(e.target.value);
                        removeInvalid("state");
                      }}>
                      <option value="">Select state</option>
                      {US_STATE_CODES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label
                    className="shop-checkout__field"
                    htmlFor={`${idPrefix}-zip`}>
                    <span className="shop-checkout__visually-hidden">Zip</span>
                    <input
                      id={`${idPrefix}-zip`}
                      className={
                        pi + (inv("zip") ? " shop-checkout__field-invalid" : "")
                      }
                      name="zip"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="Zip*"
                      value={zip}
                      aria-invalid={inv("zip")}
                      onChange={(e) => {
                        setZip(e.target.value);
                        removeInvalid("zip");
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}
        {bindingError || localError ? (
          <p className="shop-checkout__pay-error" role="alert">
            {bindingError ?? localError}
          </p>
        ) : null}
        {!protectNeedSms ? (
          <p className="shop-checkout__footer-hint">
            Please confirm your details. These details should match your
            official ID document
          </p>
        ) : null}
        <button
          type="submit"
          className={
            "shop-checkout__submit shop-checkout__submit--blue" +
            (protectNeedSms ? " shop-checkout__submit--protect-sms" : "")
          }
          disabled={bindingBusy}>
          {bindingBusy ? "Please wait…" : "SUBMIT"}
        </button>
        </fieldset>
      </form>
    </>
  );
}
