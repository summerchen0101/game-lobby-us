export const REDEEM_METHOD_SLUGS = [
  "credit-card",
  "paypal",
  "cashapp",
  "ach",
] as const;

export type RedeemMethodSlug = (typeof REDEEM_METHOD_SLUGS)[number];
