import type { ListProductsWireProduct } from "../../realtime/shopLobbyWire";
import type { ShopPack } from "./types";

const ITEM_GC = 1;
const ITEM_SC = 2;

function numFromContent(
  contents: Record<string, unknown>[],
  itemId: number,
): number {
  for (const c of contents) {
    const id = Number(c.itemID ?? c.itemId ?? 0);
    if (id !== itemId) continue;
    const a = c.amount;
    if (typeof a === "number" && Number.isFinite(a)) return a;
    if (typeof a === "string") {
      const n = Number(a);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function formatGcLabel(amount: number): string {
  if (amount <= 0) return "—";
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    const s = m >= 10 ? String(Math.round(m)) : String(Math.round(m * 10) / 10);
    return `${s.replace(/\.0$/, "")}M`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    const s = k >= 100 ? String(Math.round(k)) : String(Math.round(k * 10) / 10);
    return `${s.replace(/\.0$/, "")}K`;
  }
  return String(Math.round(amount));
}

function gcAmountToPile(n: number): ShopPack["coinPile"] {
  if (n >= 24_000_000) return 5;
  if (n >= 15_000_000) return 4;
  if (n >= 6_000_000) return 3;
  if (n >= 1_500_000) return 2;
  return 1;
}

/** Normalizes API price strings (e.g. $1.9900 → $1.99). */
function formatShopPriceForDisplay(s: string): string {
  const m = s.match(/^(\D*)([\d.,]+)/);
  if (!m) return s;
  const prefix = m[1];
  const n = Number(m[2].replace(/,/g, ""));
  if (!Number.isFinite(n)) return s;
  const rounded = Math.round(n * 100) / 100;
  const body = rounded.toFixed(2).replace(/\.?0+$/, "");
  const lead = /\$/.test(prefix) ? prefix : `$${prefix}`;
  return lead + body;
}

export function mapListProductToShopPack(p: ListProductsWireProduct): ShopPack {
  const contents = p.productContents ?? [];
  const gcAmt = numFromContent(contents, ITEM_GC);
  const scAmt = numFromContent(contents, ITEM_SC);
  const productID = String(p.productID ?? "0");
  return {
    id: productID,
    productID,
    gcLabel: formatGcLabel(gcAmt),
    bonusSc: scAmt > 0 ? Math.round(scAmt / 10000) : 0,
    price: formatShopPriceForDisplay(p.price || "—"),
    originalPrice: p.originalPrice
      ? formatShopPriceForDisplay(p.originalPrice)
      : "",
    coinPile: gcAmountToPile(gcAmt),
    paymentTypes: p.paymentTypes ?? [],
  };
}
