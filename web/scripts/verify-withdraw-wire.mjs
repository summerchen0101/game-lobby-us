/**
 * 驗證 megaman.CreateWithdrawOrderReq：PayPal（PaymentTypeRec.PayPal = 13）encode/decode 後
 * field 3（paymentType）仍為 13。可用於排除「舊前端 paypal→2」與 wire 不一致問題。
 *
 * 執行：npm run verify:withdraw-wire（於 web/）
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import protobuf from "protobufjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const protoPath = join(__dirname, "../proto/lobby_wire.proto");
const protoText = readFileSync(protoPath, "utf8");
const parsed = protobuf.parse(protoText);
const root = parsed.root;

const PaymentTypeRecPayPal = 13;
const PaymentTypeRecCreditCard = 14;
const PaymentTypeRecCashAPP = 15;
const PaymentTypeRecACH = 16;

const Req = root.lookupType("megaman.CreateWithdrawOrderReq");

function assert(cond, msg) {
  if (!cond) {
    console.error(msg);
    process.exit(1);
  }
}

function roundTrip(name, payload) {
  const err = Req.verify(payload);
  assert(!err, `verify ${name}: ${err}`);
  const encoded = Req.encode(Req.create(payload)).finish();
  const decoded = Req.decode(encoded);
  const o = Req.toObject(decoded, {
    longs: String,
    defaults: true,
    enums: String,
  });
  const pt = o.paymentType;
  const ptNum =
    typeof pt === "bigint"
      ? Number(pt)
      : typeof pt === "string"
        ? Number(pt.trim())
        : pt;
  assert(
    ptNum === payload.paymentType,
    `${name}: expected paymentType ${payload.paymentType}, got ${String(pt)}`,
  );
  console.log(`ok ${name}: paymentType=${ptNum}`);
}

roundTrip("PayPal", {
  userID: 2046952017814859776,
  amount: "100",
  paymentType: PaymentTypeRecPayPal,
  paypalEmail: "user@example.com",
});

roundTrip("CreditCard", {
  userID: 1,
  amount: "50",
  paymentType: PaymentTypeRecCreditCard,
  cardNumber: "4111111111111111",
  cardValidCode: "123",
});

roundTrip("CashAPP", {
  userID: 1,
  amount: "50",
  paymentType: PaymentTypeRecCashAPP,
  appAccount: "$cashtag",
});

roundTrip("ACH", {
  userID: 1,
  amount: "50",
  paymentType: PaymentTypeRecACH,
  accountNumber: "000111222",
  routingNumber: "011000015",
});

console.log("verify-withdraw-wire: all checks passed.");
