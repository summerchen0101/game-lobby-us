/**
 * Map a stored phone string into country code + national digits for Protect Account UI.
 * US-centric: 10 digits → 1 + national; 11 starting with 1 → drop leading 1.
 */
export function splitPhoneForBindingForm(phone: string): {
  countryCode: string;
  national: string;
} {
  const d = phone.replace(/\D/g, "");
  if (d.length === 0) return { countryCode: "1", national: "" };
  if (d.length === 11 && d.startsWith("1")) {
    return { countryCode: "1", national: d.slice(1) };
  }
  if (d.length === 10) {
    return { countryCode: "1", national: d };
  }
  return { countryCode: "1", national: d };
}
