import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { CURRENCY_ICON_GC, CURRENCY_ICON_SC } from "../../lib/currencyIcons";
import { isMockMode } from "../../lib/env";
import {
  GATEWAY_API_BUY_PRODUCT,
  GATEWAY_API_LIST_PRODUCTS,
} from "../../realtime/gatewayApi";
import { isGatewaySuccessCode } from "../../realtime/gatewayWire";
import {
  decodeBuyProductResponseBytes,
  decodeListProductsResponseBytes,
  encodeBuyProductRequestBytes,
  encodeListProductsRequestBytes,
} from "../../realtime/shopLobbyWire";
import { useGatewayLobby } from "../../realtime/useGatewayLobby";
import { mapListProductToShopPack } from "./mapListProductToShopPack";
import {
  resolveServerPaymentTypeForUiMethod,
  serverPaymentTypesToMethods,
  type ShopPaymentMethodId,
} from "./paymentTypeMap";
import { ShopCheckoutOverlay, type CheckoutStep } from "./ShopCheckoutOverlay";
import type { ShopPack } from "./types";
import "./ShopPage.css";
import "../lobby/SessionPageDecor.css";

const PANEL = "/images/shop";

const MOCK_PACKS: ShopPack[] = [
  {
    id: "1",
    productID: "1",
    gcLabel: "600K",
    bonusSc: 2,
    price: "$1.99",
    originalPrice: "",
    coinPile: 1,
    paymentTypes: ["11", "12", "14", "15"],
  },
  {
    id: "2",
    productID: "2",
    gcLabel: "1500K",
    bonusSc: 5,
    price: "$4.99",
    originalPrice: "",
    coinPile: 1,
    paymentTypes: ["11", "12", "14", "15"],
  },
  {
    id: "3",
    productID: "3",
    gcLabel: "3M",
    bonusSc: 10,
    price: "$9.99",
    originalPrice: "",
    coinPile: 2,
    paymentTypes: ["11", "12", "14", "15"],
  },
  {
    id: "4",
    productID: "4",
    gcLabel: "6M",
    bonusSc: 20,
    price: "$19.99",
    originalPrice: "",
    coinPile: 2,
    paymentTypes: ["11", "12", "14", "15"],
  },
  {
    id: "5",
    productID: "5",
    gcLabel: "12M",
    bonusSc: 40,
    price: "$39.99",
    originalPrice: "",
    coinPile: 3,
    paymentTypes: ["11", "12", "14", "15"],
  },
  {
    id: "6",
    productID: "6",
    gcLabel: "15M",
    bonusSc: 50,
    price: "$49.99",
    originalPrice: "",
    coinPile: 3,
    paymentTypes: ["11", "12", "14", "15"],
  },
  {
    id: "7",
    productID: "7",
    gcLabel: "18M",
    bonusSc: 60,
    price: "$59.99",
    originalPrice: "",
    coinPile: 4,
    paymentTypes: ["11", "12", "14", "15"],
  },
  {
    id: "8",
    productID: "8",
    gcLabel: "24M",
    bonusSc: 80,
    price: "$79.99",
    originalPrice: "",
    coinPile: 4,
    paymentTypes: ["11", "12", "14", "15"],
  },
  {
    id: "9",
    productID: "9",
    gcLabel: "30M",
    bonusSc: 100,
    price: "$99.99",
    originalPrice: "",
    coinPile: 5,
    paymentTypes: ["11", "12", "14", "15"],
  },
];

function coinPileSrc(n: 1 | 2 | 3 | 4 | 5) {
  return `${PANEL}/icon_coinPile${n}.png`;
}

export function ShopPage() {
  const { token } = useAuth();
  const { requestRef, subscribePaymentFinish } = useGatewayLobby();
  const [packs, setPacks] = useState<ShopPack[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [checkoutPack, setCheckoutPack] = useState<ShopPack | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("summary");
  const [visibleMethods, setVisibleMethods] = useState<ShopPaymentMethodId[]>(
    [],
  );
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPacks([]);
      setListLoading(false);
      setListError(null);
      return;
    }

    if (isMockMode()) {
      setPacks(MOCK_PACKS);
      setListLoading(false);
      setListError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setListLoading(true);
      setListError(null);
      for (let i = 0; i < 50 && !cancelled; i++) {
        const req = requestRef.current;
        if (req) {
          try {
            const r = await req({
              type: GATEWAY_API_LIST_PRODUCTS,
              data: encodeListProductsRequestBytes(),
              debugLabel: "LIST_PRODUCTS",
            });
            const code = String(r.code ?? "");
            if (!isGatewaySuccessCode(code)) {
              if (!cancelled) {
                setListError(
                  r.errMessage?.trim() || `List products failed (${code})`,
                );
                setPacks([]);
              }
              return;
            }
            const raw = r.data;
            if (raw instanceof Uint8Array && raw.byteLength > 0) {
              const { products } = decodeListProductsResponseBytes(raw);
              if (!cancelled) {
                setPacks(products.map(mapListProductToShopPack));
              }
            } else if (!cancelled) {
              setPacks([]);
            }
          } catch (e) {
            if (!cancelled) {
              setListError(
                e instanceof Error ? e.message : "Could not load products",
              );
              setPacks([]);
            }
          } finally {
            if (!cancelled) setListLoading(false);
          }
          return;
        }
        await new Promise((res) => setTimeout(res, 100));
      }
      if (!cancelled) {
        setListError("Could not connect to shop");
        setPacks([]);
        setListLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, requestRef]);

  useEffect(() => {
    if (checkoutStep !== "payment" || !paymentUrl) return;
    return subscribePaymentFinish((push) => {
      const err = String(push.errorMsg ?? "").trim();
      const reason = String(push.reason ?? "").trim();
      if (err || reason) {
        setBuyError(err || reason);
        setPaymentUrl(null);
        setCheckoutStep("summary");
        return;
      }
      setPaymentUrl(null);
      setCheckoutStep("success");
    });
  }, [checkoutStep, paymentUrl, subscribePaymentFinish]);

  const openCheckout = (p: ShopPack) => {
    setBuyError(null);
    setPaymentUrl(null);
    setCheckoutStep("summary");
    const methods = serverPaymentTypesToMethods(p.paymentTypes);
    setVisibleMethods(methods);
    setCheckoutPack(p);
  };

  const closeCheckout = useCallback(() => {
    setCheckoutPack(null);
    setCheckoutStep("summary");
    setPaymentUrl(null);
    setBuyError(null);
  }, []);

  const cancelPaymentFrame = useCallback(() => {
    setPaymentUrl(null);
    setCheckoutStep("summary");
  }, []);

  const handleSelectPayment = useCallback(
    async (method: ShopPaymentMethodId) => {
      const pack = checkoutPack;
      if (!pack) return;
      if (isMockMode()) {
        setBuyError("Turn off mock API mode to purchase (VITE_API_USE_MOCK).");
        return;
      }
      const req = requestRef.current;
      if (!req) {
        setBuyError("Not connected");
        return;
      }
      const serverType = resolveServerPaymentTypeForUiMethod(
        pack.paymentTypes,
        method,
      );
      if (serverType == null) {
        setBuyError(
          "This payment method is not available for this product. Check paymentTypeMap.ts matches server paymentTypes.",
        );
        return;
      }
      setBuyBusy(true);
      setBuyError(null);
      try {
        const r = await req({
          type: GATEWAY_API_BUY_PRODUCT,
          data: encodeBuyProductRequestBytes(pack.productID, serverType),
          debugLabel: "BUY_PRODUCT",
        });
        const code = String(r.code ?? "");
        if (!isGatewaySuccessCode(code)) {
          setBuyError(r.errMessage?.trim() || `Purchase failed (${code})`);
          return;
        }
        const raw = r.data;
        if (!(raw instanceof Uint8Array) || raw.byteLength === 0) {
          setBuyError("Empty purchase response");
          return;
        }
        const { paymentURL: url } = decodeBuyProductResponseBytes(raw);
        if (!url?.trim()) {
          setBuyError("No payment URL returned");
          return;
        }
        setPaymentUrl(url.trim());
        setCheckoutStep("payment");
      } catch (e) {
        setBuyError(e instanceof Error ? e.message : "Purchase failed");
      } finally {
        setBuyBusy(false);
      }
    },
    [checkoutPack, requestRef],
  );

  return (
    <div className="shop-page page-container session-page session-page--pattern">
      <div className="shop-page__inner">
        <h1 className="shop-page__title">STORE</h1>
        <p className="shop-page__subtitle">CHOOSE YOUR COINS PACKAGE</p>
        {listLoading ? (
          <p className="shop-page__status" role="status">
            Loading packages…
          </p>
        ) : listError ? (
          <p
            className="shop-page__status shop-page__status--error"
            role="alert">
            {listError}
          </p>
        ) : packs.length === 0 ? (
          <p className="shop-page__status" role="status">
            No packages available.
          </p>
        ) : (
          <ul className="shop-page__grid">
            {packs.map((p) => (
              <li key={p.id} className="shop-page__card">
                <div className="shop-page__card-mid">
                  <div className="shop-page__card-top">
                    <span className="shop-page__gc-row">
                      <span className="shop-page__chip shop-page__chip--gc">
                        <img
                          src={CURRENCY_ICON_GC}
                          alt=""
                          width={24}
                          height={24}
                        />
                      </span>
                      <span className="shop-page__gc-amount">{p.gcLabel}</span>
                    </span>
                  </div>
                  <div className="shop-page__card-art" data-pile={p.coinPile}>
                    <img
                      src={coinPileSrc(p.coinPile)}
                      alt=""
                      className="shop-page__card-art-img"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <p
                    className="shop-page__bonus"
                    aria-label={`Plus free SC ${p.bonusSc}`}>
                    <span className="shop-page__bonus-free">+FREE</span>
                    <span className="shop-page__chip shop-page__chip--sc">
                      <img
                        src={CURRENCY_ICON_SC}
                        alt=""
                        width={24}
                        height={24}
                      />
                    </span>
                    <span className="shop-page__bonus-amt">{p.bonusSc}</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="shop-page__price-btn"
                  onClick={() => openCheckout(p)}>
                  {p.price}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {checkoutPack ? (
        <ShopCheckoutOverlay
          open
          pack={checkoutPack}
          step={checkoutStep}
          visibleMethods={visibleMethods}
          buyBusy={buyBusy}
          buyError={buyError}
          paymentUrl={paymentUrl}
          onClose={closeCheckout}
          onSelectPaymentMethod={handleSelectPayment}
          onCancelPaymentFrame={cancelPaymentFrame}
        />
      ) : null}
    </div>
  );
}
