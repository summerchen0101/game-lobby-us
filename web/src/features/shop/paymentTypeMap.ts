/**
 * Gateway `paymentType` / `paymentTypes[]` 與結帳 UI 按鈕對應。
 */
export type ShopPaymentMethodId = "google" | "apple" | "credit" | "cashapp";

const SERVER_PAYMENT_TYPE_TO_UI: Record<string, ShopPaymentMethodId> = {
  "11": "google",
  "12": "apple",
  "14": "credit",
  "15": "cashapp",
};

const METHOD_DISPLAY_ORDER: ShopPaymentMethodId[] = [
  "google",
  "apple",
  "credit",
  "cashapp",
];

export function serverPaymentTypesToMethods(
  paymentTypes: string[],
): ShopPaymentMethodId[] {
  const found = new Set<ShopPaymentMethodId>();
  for (const t of paymentTypes) {
    const m = SERVER_PAYMENT_TYPE_TO_UI[t];
    if (m) found.add(m);
  }
  return METHOD_DISPLAY_ORDER.filter((m) => found.has(m));
}

export function uiMethodToServerPaymentType(
  method: ShopPaymentMethodId,
): string {
  const hit = Object.entries(SERVER_PAYMENT_TYPE_TO_UI).find(
    ([, v]) => v === method,
  );
  return hit?.[0] ?? "0";
}

/**
 * 從該商品後端給的 `paymentTypes` 中，找出對應此 UI 按鈕的**實際**枚舉值（須與 BuyProduct 一致）。
 * 不可硬送與 ListProducts 回傳不一致的值，否則後端常回 "One of the request inputs is not valid"。
 */
export function resolveServerPaymentTypeForUiMethod(
  paymentTypes: string[],
  method: ShopPaymentMethodId,
): string | null {
  for (const t of paymentTypes) {
    if (SERVER_PAYMENT_TYPE_TO_UI[t] === method) {
      return t;
    }
  }
  return null;
}
