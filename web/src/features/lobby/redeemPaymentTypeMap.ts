import type { RedeemMethodSlug } from "./redeemFlow";
import { WITHDRAW_PAYMENT_TYPE_REC } from "../../realtime/withdrawLobbyWire";

/**
 * UI 提現方式 → megaman CreateWithdrawOrderReq.paymentType（proto/dsk/dsk.proto PaymentTypeRec）。
 */
export const REDEEM_METHOD_TO_WITHDRAW_PAYMENT_TYPE: Record<
  RedeemMethodSlug,
  number
> = {
  "credit-card": WITHDRAW_PAYMENT_TYPE_REC.CreditCard,
  paypal: WITHDRAW_PAYMENT_TYPE_REC.PayPal,
  cashapp: WITHDRAW_PAYMENT_TYPE_REC.CashAPP,
  ach: WITHDRAW_PAYMENT_TYPE_REC.ACH,
};
