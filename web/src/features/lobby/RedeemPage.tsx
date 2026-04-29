import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { InfoPopover } from "../../components/InfoPopover";
import { useAuth } from "../../auth/useAuth";
import { CURRENCY_ICON_SC } from "../../lib/currencyIcons";
import { isMockMode } from "../../lib/env";
import { formatWalletPillAmount } from "../../wallet/formatWalletAmount";
import { GATEWAY_API_LIST_WITHDRAW_ORDERS } from "../../realtime/gatewayApi";
import { isGatewaySuccessCode } from "../../realtime/gatewayWire";
import {
  encodeListWithdrawOrdersRequestBytes,
  decodeListWithdrawOrdersResponseBytes,
  type WithdrawOrderWireRow,
} from "../../realtime/withdrawLobbyWire";
import { useGatewayLobby } from "../../realtime/useGatewayLobby";
import { redeemScBalancesFromLobby } from "./redeemBalances";
import { RedeemNotifyPill } from "./RedeemNotifyPill";
import { useRedeemPillMessages } from "./useRedeemPillMessages";
import { RedeemMethodModal } from "./RedeemMethodModal";
import { getMockWithdrawOrdersPage } from "./mockWithdrawOrderHistory";
import "./RedeemPage.css";
import "./SessionPageDecor.css";

const SC_INLINE_PX = 18;

const ORDERS_PER_PAGE = 10;

function ScInlineIcon() {
  return (
    <img
      className="redeem-page__info-sc-icon"
      src={CURRENCY_ICON_SC}
      alt=""
      width={SC_INLINE_PX}
      height={SC_INLINE_PX}
    />
  );
}

export const MIN_REDEEM_SC = 50;

export function RedeemPage() {
  const { user } = useAuth();
  const {
    requestRef,
    lobbyGet,
    gatewayRequestReady,
    subscribeWithdrawSuccessPush,
  } = useGatewayLobby();

  const mock = isMockMode();

  const [pillExtras, setPillExtras] = useState<string[]>([]);
  useEffect(() => {
    return subscribeWithdrawSuccessPush((p) => {
      setPillExtras((prev) => {
        const line = `${p.nickname} redeemed ${formatWalletPillAmount(p.actualAmount)} SC`;
        return [line, ...prev].slice(0, 24);
      });
    });
  }, [subscribeWithdrawSuccessPush]);

  const pillMessages = useRedeemPillMessages(pillExtras);

  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersRows, setOrdersRows] = useState<WithdrawOrderWireRow[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(!mock);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [initialOrdersFetched, setInitialOrdersFetched] = useState(mock);

  const { amount: scAmount, redeemableAmount, unplayed } =
    redeemScBalancesFromLobby({
      lobbyGet,
      sweepstakesFallback: user?.sweepstakesBalance,
    });

  const scDisplay = formatWalletPillAmount(scAmount);

  const hasOrderHistory =
    ordersTotal > 0 || ordersRows.length > 0;

  const totalPages =
    ordersTotal <= 0
      ? 1
      : Math.max(1, Math.ceil(ordersTotal / ORDERS_PER_PAGE));

  const fetchOrders = useCallback(
    async (page: number) => {
      if (mock) {
        const { orders, total } = getMockWithdrawOrdersPage(page, ORDERS_PER_PAGE);
        setOrdersRows(orders);
        setOrdersTotal(total);
        setOrdersError(null);
        setInitialOrdersFetched(true);
        setOrdersLoading(false);
        return;
      }
      const req = requestRef.current;
      if (!req) {
        setOrdersLoading(false);
        setInitialOrdersFetched(true);
        return;
      }
      setOrdersLoading(true);
      setOrdersError(null);
      try {
        const r = await req({
          type: GATEWAY_API_LIST_WITHDRAW_ORDERS,
          data: encodeListWithdrawOrdersRequestBytes(page, ORDERS_PER_PAGE),
          debugLabel: "LIST_WITHDRAW_ORDERS",
        });
        const code = String(r.code ?? "");
        if (!isGatewaySuccessCode(code)) {
          setOrdersError(r.errMessage?.trim() || `Request failed (${code})`);
          setOrdersRows([]);
          setOrdersTotal(0);
          return;
        }
        const raw = r.data;
        if (!(raw instanceof Uint8Array) || raw.byteLength === 0) {
          setOrdersRows([]);
          setOrdersTotal(0);
          return;
        }
        const { orders, total } = decodeListWithdrawOrdersResponseBytes(raw);
        setOrdersRows(orders);
        const tn = Number(total);
        setOrdersTotal(Number.isFinite(tn) ? tn : 0);
      } catch (e) {
        setOrdersError(e instanceof Error ? e.message : "Failed to load orders");
        setOrdersRows([]);
        setOrdersTotal(0);
      } finally {
        setOrdersLoading(false);
        setInitialOrdersFetched(true);
      }
    },
    [mock, requestRef],
  );

  useEffect(() => {
    if (mock) {
      void fetchOrders(ordersPage);
      return;
    }
    if (!gatewayRequestReady) return;
    void fetchOrders(ordersPage);
  }, [mock, gatewayRequestReady, ordersPage, fetchOrders]);

  const refetchOrdersAfterWithdraw = useCallback(async () => {
    setOrdersPage(0);
    if (mock) {
      await fetchOrders(0);
      return;
    }
    if (!gatewayRequestReady) return;
    await fetchOrders(0);
  }, [mock, gatewayRequestReady, fetchOrders]);

  const pagerPrev = useCallback(() => {
    setOrdersPage((p) => Math.max(0, p - 1));
  }, []);

  const pagerNext = useCallback(() => {
    setOrdersPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const pagerLabel = useMemo(
    () =>
      totalPages <= 1
        ? ""
        : `Page ${ordersPage + 1} / ${totalPages}`,
    [ordersPage, totalPages],
  );

  /** 文件：SC < 50 且無訂單紀錄 → 不足畫面 */
  const showInsufficient =
    initialOrdersFetched &&
    !ordersLoading &&
    !hasOrderHistory &&
    scAmount < MIN_REDEEM_SC;

  const showRedeemHistoryUi =
    (mock || gatewayRequestReady) && !showInsufficient;

  return (
    <section className="redeem-page page-container session-page session-page--pattern">
      <div className="redeem-page__hero">
        <h1 className="redeem-page__title">REDEEM</h1>
        <RedeemNotifyPill messages={pillMessages} />
        <p className="redeem-page__sub">SWEEPSTAKES PRIZE REDEMPTION</p>
      </div>

      <div className="redeem-page__card">
        <div className="redeem-page__row">
          <Link to="/" className="redeem-page__back" aria-label="Back">
            ‹
          </Link>
          <h2 className="redeem-page__row-title">Redeemable Balance:</h2>
          <InfoPopover
            align="end"
            panelClassName="redeem-page__info-popover"
            content={
              <div className="redeem-page__info-panel">
                <p>
                  <strong>Your Sweeps Coins Balance:</strong>{" "}
                  {formatWalletPillAmount(scAmount)} <ScInlineIcon />
                </p>
                <p>
                  <strong>Redeemable Sweeps Coins:</strong>{" "}
                  {formatWalletPillAmount(redeemableAmount)} <ScInlineIcon />
                </p>
                <p>
                  <strong>Unplayed Sweeps Coins Balance:</strong>{" "}
                  {formatWalletPillAmount(unplayed)} <ScInlineIcon />
                </p>
                <p>
                  <ScInlineIcon /> 1 Sweeps Coin = $1
                </p>
                <p>
                  Unplayed Sweeps Coins from purchases and bonuses can be used to
                  play in games, but cannot be redeemed. Sweeps Coins gained by
                  winnings can be redeemed.
                </p>
              </div>
            }>
            {(p, triggerRef) => (
              <button
                ref={triggerRef}
                {...p}
                className="redeem-page__info"
                aria-label="Prize redemption info">
                i
              </button>
            )}
          </InfoPopover>
        </div>

        <div className="redeem-page__balance-row">
          <span className="redeem-page__sc-badge" aria-hidden>
            <img src={CURRENCY_ICON_SC} alt="" width={40} height={40} />
          </span>
          <p className="redeem-page__amount">{scDisplay}</p>
        </div>
      </div>

      {!mock && !gatewayRequestReady ? (
        <div className="redeem-page__card redeem-page__history-card">
          <p className="redeem-page__history-title">Connecting…</p>
        </div>
      ) : null}

      {showRedeemHistoryUi ? (
        <div className="redeem-page__card redeem-page__history-card">
          <h2 className="redeem-page__history-title">Redemption History:</h2>
          {ordersError ? (
            <p className="redeem-page__insufficient-text" role="alert">
              {ordersError}
            </p>
          ) : ordersLoading ? (
            <p className="redeem-page__history-title">Loading history…</p>
          ) : (
            <>
              <ul
                className="redeem-page__history-list"
                aria-label="Redemption history">
                {ordersRows.map((row, i) => (
                  <li
                    key={
                      row.withdrawOrderUID ||
                      `${ordersPage}-${row.amount}-${row.withdrawOrderPaymentStatus}-${i}`
                    }
                    className="redeem-page__history-row">
                    <span className="redeem-page__history-icon" aria-hidden>
                      i
                    </span>
                    <span className="redeem-page__history-desc">
                      {formatWalletPillAmount(Number(row.amount) || 0)} SC
                    </span>
                    <span className="redeem-page__history-status">
                      {row.statusLabel}
                    </span>
                  </li>
                ))}
              </ul>
              {ordersRows.length === 0 && !ordersError ? (
                <p className="redeem-page__insufficient-text">
                  No redemption requests yet.
                </p>
              ) : null}
            </>
          )}
          <div className="redeem-page__history-pager">
            <button
              type="button"
              className="redeem-page__history-pager-btn"
              aria-label="Previous page"
              disabled={ordersPage <= 0 || ordersLoading}
              onClick={pagerPrev}>
              ‹
            </button>
            <span className="redeem-page__history-pager-link">{pagerLabel}</span>
            <button
              type="button"
              className="redeem-page__history-pager-btn"
              aria-label="Next page"
              disabled={
                ordersLoading ||
                ordersPage >= totalPages - 1 ||
                totalPages <= 1
              }
              onClick={pagerNext}>
              ›
            </button>
          </div>
          <button
            type="button"
            className="redeem-page__new-redeem"
            disabled={ordersLoading || (!mock && !gatewayRequestReady)}
            onClick={() => setMethodModalOpen(true)}>
            NEW REDEEM
          </button>
        </div>
      ) : null}

      {showInsufficient ? (
        <div className="redeem-page__insufficient-card">
          <h3 className="redeem-page__insufficient-title">Insufficient SC</h3>
          <p className="redeem-page__insufficient-text">
            Win a minimum of {MIN_REDEEM_SC} SC to redeem.
          </p>
          <p className="redeem-page__insufficient-accent">Keep playing!</p>
          <Link to="/" className="redeem-page__to-lobby">
            Back to lobby
          </Link>
        </div>
      ) : null}

      <RedeemMethodModal
        open={methodModalOpen}
        onClose={() => setMethodModalOpen(false)}
        onOrderCreated={refetchOrdersAfterWithdraw}
      />
    </section>
  );
}
