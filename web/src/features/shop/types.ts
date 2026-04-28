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

export type { ShopPaymentMethodId };
