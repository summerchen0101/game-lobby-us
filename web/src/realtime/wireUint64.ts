import Long from "long";

/**
 * megaman / gateway uint64：超過 Number.MAX_SAFE_INTEGER 時使用 long.js，protobufjs 可正確編碼。
 */
export function wireUInt64Field(value: bigint | number | string): number | Long {
  const bi =
    typeof value === "bigint"
      ? value
      : typeof value === "number"
        ? BigInt(Math.trunc(value))
        : BigInt(String(value).trim() || "0");
  if (bi < 0n) throw new Error("uint64 must be non-negative");
  if (bi <= BigInt(Number.MAX_SAFE_INTEGER)) return Number(bi);
  return Long.fromString(bi.toString(), true);
}
