import type { ShopPaymentMethodId } from "./paymentTypeMap";

export type ShopPack = {
  id: string;
  /** Gateway ListProductsResponseProduct.productID */
  productID: string;
  /** Shown after GC chip, e.g. 600K, 12M */
  gcLabel: string;
  bonusSc: number;
  price: string;
  originalPrice: string;
  /** 1..5 → icon_coinPileN.png */
  coinPile: 1 | 2 | 3 | 4 | 5;
  /** 後端 paymentTypes 原字串 */
  paymentTypes: string[];
};

/** LOBBY_GET / account fields used to prefill the binding form when empty. */
export type ShopBindingPrefill = {
  email?: string;
  phone?: string;
};

/** Payload for megaman.MegaAccountBindingRequest (shop binding step). */
export type ShopBindingFormPayload = {
  countryCode: string;
  phone: string;
  email: string;
  answer: string;
  firstName: string;
  lastName: string;
  birthday: string;
  address: string;
  country: string;
  city: string;
  state: string;
  zip: string;
};

export type { ShopPaymentMethodId };
