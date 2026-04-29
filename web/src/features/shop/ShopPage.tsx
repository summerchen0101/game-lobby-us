import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { CURRENCY_ICON_GC, CURRENCY_ICON_SC } from "../../lib/currencyIcons";
import { isMockMode } from "../../lib/env";
import {
  GATEWAY_API_BUY_PRODUCT,
  GATEWAY_API_LIST_PRODUCTS,
  GATEWAY_API_MEGA_ACCOUNT_BINDING,
} from "../../realtime/gatewayApi";
import { isGatewaySuccessCode } from "../../realtime/gatewayWire";
import {
  decodeBuyProductResponseBytes,
  decodeListProductsResponseBytes,
  decodeMegaAccountBindingResponseBytes,
  encodeBuyProductRequestBytes,
  encodeListProductsRequestBytes,
  encodeMegaAccountBindingRequestBytes,
} from "../../realtime/shopLobbyWire";
import { useGatewayLobby } from "../../realtime/useGatewayLobby";
import { mapListProductToShopPack } from "./mapListProductToShopPack";
import {
  resolveServerPaymentTypeForUiMethod,
  serverPaymentTypesToMethods,
  type ShopPaymentMethodId,
} from "./paymentTypeMap";
import { isPhoneBound } from "./isPhoneBound";
import { ShopCheckoutOverlay, type CheckoutStep } from "./ShopCheckoutOverlay";
import type {
  ShopBindingFormPayload,
  ShopPack,
  ShopBindingPrefill,
} from "./types";
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
  const { token, user, mergeUser } = useAuth();
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
  const [pendingPaymentMethod, setPendingPaymentMethod] =
    useState<ShopPaymentMethodId | null>(null);
  const [protectNeedSms, setProtectNeedSms] = useState(false);
  const [bindingBusy, setBindingBusy] = useState(false);
  const [bindingError, setBindingError] = useState<string | null>(null);
  const protectAutoBuyStartedRef = useRef(false);

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
    setPendingPaymentMethod(null);
    setProtectNeedSms(false);
    setBindingError(null);
    const methods = serverPaymentTypesToMethods(p.paymentTypes);
    setVisibleMethods(methods);
    setCheckoutPack(p);
  };

  const closeCheckout = useCallback(() => {
    setCheckoutPack(null);
    setCheckoutStep("summary");
    setPaymentUrl(null);
    setBuyError(null);
    setPendingPaymentMethod(null);
    setProtectNeedSms(false);
    setBindingError(null);
  }, []);

  const cancelPaymentFrame = useCallback(() => {
    setPaymentUrl(null);
    setCheckoutStep("summary");
  }, []);

  const handleProtectClose = useCallback(() => {
    setCheckoutStep("summary");
    setPendingPaymentMethod(null);
    setProtectNeedSms(false);
    setBindingError(null);
  }, []);

  const handleBackToProtectForm = useCallback(() => {
    setProtectNeedSms(false);
    setBindingError(null);
  }, []);

  const executeBuyProduct = useCallback(
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
      let paymentTab: Window | null = null;
      try {
        // Open before first await so the call stays in the user-gesture chain (popup friendly).
        // Do not pass noopener/noreferrer: those can yield null or a window that cannot be
        // navigated from here via location.href, leaving about:blank stuck on screen.
        paymentTab = window.open("about:blank", "_blank");
        const r = await req({
          type: GATEWAY_API_BUY_PRODUCT,
          data: encodeBuyProductRequestBytes(pack.productID, serverType),
          debugLabel: "BUY_PRODUCT",
        });
        const code = String(r.code ?? "");
        if (!isGatewaySuccessCode(code)) {
          paymentTab?.close();
          setBuyError(r.errMessage?.trim() || `Purchase failed (${code})`);
          return;
        }
        const raw = r.data;
        if (!(raw instanceof Uint8Array) || raw.byteLength === 0) {
          paymentTab?.close();
          setBuyError("Empty purchase response");
          return;
        }
        const { paymentURL: url } = decodeBuyProductResponseBytes(raw);
        if (!url?.trim()) {
          paymentTab?.close();
          setBuyError("No payment URL returned");
          return;
        }
        const trimmed = url.trim();
        if (paymentTab && !paymentTab.closed) {
          try {
            paymentTab.location.href = trimmed;
          } catch {
            paymentTab.close();
          }
        }
        setPaymentUrl(trimmed);
        setCheckoutStep("payment");
      } catch (e) {
        paymentTab?.close();
        setBuyError(e instanceof Error ? e.message : "Purchase failed");
      } finally {
        setBuyBusy(false);
      }
    },
    [checkoutPack, requestRef],
  );

  const handleBindingSubmit = useCallback(
    async (payload: ShopBindingFormPayload) => {
      if (!checkoutPack || pendingPaymentMethod == null) return;
      const req = requestRef.current;
      if (!req) {
        setBindingError("Not connected");
        return;
      }
      const uid = user?.id;
      if (!uid || !/^\d+$/.test(uid)) {
        setBindingError("Missing user id");
        return;
      }
      setBindingBusy(true);
      setBindingError(null);
      try {
        const data = encodeMegaAccountBindingRequestBytes({
          userID: uid,
          countryCode: payload.countryCode,
          phone: payload.phone,
          email: payload.email,
          answer: payload.answer,
          firstName: payload.firstName,
          lastName: payload.lastName,
          birthday: payload.birthday,
          address: payload.address,
          country: payload.country,
          city: payload.city,
          state: payload.state,
          zip: payload.zip,
          language: "en",
        });
        const r = await req({
          type: GATEWAY_API_MEGA_ACCOUNT_BINDING,
          data,
          debugLabel: "MEGA_ACCOUNT_BINDING",
        });
        const code = String(r.code ?? "");
        if (!isGatewaySuccessCode(code)) {
          setBindingError(r.errMessage?.trim() || `Binding failed (${code})`);
          return;
        }
        const raw = r.data;
        const decoded =
          raw instanceof Uint8Array && raw.byteLength > 0
            ? decodeMegaAccountBindingResponseBytes(raw)
            : decodeMegaAccountBindingResponseBytes(new Uint8Array(0));
        if (decoded.needSMSAnswer) {
          setProtectNeedSms(true);
          if (payload.answer.trim()) {
            setBindingError("Invalid or expired verification code.");
          }
          return;
        }
        const phone = decoded.phoneNum.trim();
        if (phone) mergeUser({ phone });
        const method = pendingPaymentMethod;
        setPendingPaymentMethod(null);
        setProtectNeedSms(false);
        await executeBuyProduct(method);
      } catch (e) {
        setBindingError(e instanceof Error ? e.message : "Binding failed");
      } finally {
        setBindingBusy(false);
      }
    },
    [
      checkoutPack,
      pendingPaymentMethod,
      user?.id,
      requestRef,
      mergeUser,
      executeBuyProduct,
    ],
  );

  const handleSelectPayment = useCallback(
    async (method: ShopPaymentMethodId) => {
      const pack = checkoutPack;
      if (!pack) return;
      if (isMockMode()) {
        setBuyError("Turn off mock API mode to purchase (VITE_API_USE_MOCK).");
        return;
      }
      if (!isPhoneBound(user)) {
        setPendingPaymentMethod(method);
        setProtectNeedSms(false);
        setBindingError(null);
        setCheckoutStep("protect");
        return;
      }
      await executeBuyProduct(method);
    },
    [checkoutPack, user, executeBuyProduct],
  );

  useEffect(() => {
    if (checkoutStep !== "protect") {
      protectAutoBuyStartedRef.current = false;
      return;
    }
    if (!isPhoneBound(user)) return;

    if (pendingPaymentMethod == null) {
      setProtectNeedSms(false);
      setBindingError(null);
      setCheckoutStep("summary");
      return;
    }

    if (protectAutoBuyStartedRef.current) return;
    protectAutoBuyStartedRef.current = true;

    const method = pendingPaymentMethod;
    setPendingPaymentMethod(null);
    setProtectNeedSms(false);
    setBindingError(null);
    setCheckoutStep("summary");
    void executeBuyProduct(method);
  }, [checkoutStep, user, pendingPaymentMethod, executeBuyProduct]);

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
          bindingBusy={bindingBusy}
          bindingError={bindingError}
          protectNeedSms={protectNeedSms}
          bindingPrefill={
            {
              email: user?.email,
              phone: user?.phone,
            } satisfies ShopBindingPrefill
          }
          onClose={closeCheckout}
          onProtectClose={handleProtectClose}
          onBackToProtectForm={handleBackToProtectForm}
          onBindingSubmit={handleBindingSubmit}
          onSelectPaymentMethod={handleSelectPayment}
          onCancelPaymentFrame={cancelPaymentFrame}
        />
      ) : null}
    </div>
  );
}
