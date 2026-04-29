import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { InfoPopover } from "../../components/InfoPopover";
import { useAuth } from "../../auth/useAuth";
import { CURRENCY_ICON_SC } from "../../lib/currencyIcons";
import { isMockMode } from "../../lib/env";
import {
  formatScFromRaw,
  formatWithdrawHistoryFiatAmount,
  MIN_REDEEM_SC_DISPLAY,
  MIN_REDEEM_SC_RAW,
} from "../../wallet/formatWalletAmount";
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

const ORDERS_PER_PAGE = 4;

/** Aligns with withdrawOrderPaymentStatusToLabel() labels in withdrawLobbyWire. */
const WITHDRAW_HISTORY_STATUS_MOD: Record<
  string,
  "positive" | "progress" | "negative" | "muted"
> = {
  Success: "positive",
  Passed: "positive",
  Reviewing: "progress",
  Processing: "progress",
  Rejected: "negative",
  Failed: "negative",
  Expired: "negative",
  Unknown: "muted",
};

function redeemHistoryStatusClassName(statusLabel: string): string {
  const base = "redeem-page__history-status";
  const mod =
    WITHDRAW_HISTORY_STATUS_MOD[statusLabel] ?? "muted";
  return `${base} ${base}--${mod}`;
}

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

/** Re-export: minimum redeemable SC shown to the user (50). */
export const MIN_REDEEM_SC = MIN_REDEEM_SC_DISPLAY;

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
        const line = `${p.nickname} redeemed ${formatScFromRaw(p.actualAmount)} SC`;
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

  const redeemableDisplay = formatScFromRaw(redeemableAmount);

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

  const cannotRedeem = redeemableAmount < MIN_REDEEM_SC_RAW;

  /** 未達可提領門檻且無任何提領紀錄 → 全頁不足卡（不顯示空白 history 區） */
  const showInsufficientFullPage =
    initialOrdersFetched &&
    !ordersLoading &&
    cannotRedeem &&
    !hasOrderHistory;

  /** 有紀錄但不可提領 → 仍顯示紀錄，並顯示 Insufficient 提示 */
  const showInsufficientWithHistory =
    initialOrdersFetched &&
    !ordersLoading &&
    cannotRedeem &&
    hasOrderHistory;

  const showRedeemHistoryUi =
    (mock || gatewayRequestReady) && !showInsufficientFullPage;

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
                  {formatScFromRaw(scAmount)} <ScInlineIcon />
                </p>
                <p>
                  <strong>Redeemable Sweeps Coins:</strong>{" "}
                  {formatScFromRaw(redeemableAmount)} <ScInlineIcon />
                </p>
                <p>
                  <strong>Unplayed Sweeps Coins Balance:</strong>{" "}
                  {formatScFromRaw(unplayed)} <ScInlineIcon />
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
          <p className="redeem-page__amount">{redeemableDisplay}</p>
        </div>
      </div>

      {!mock && !gatewayRequestReady ? (
        <div className="redeem-page__card redeem-page__history-card">
          <p className="redeem-page__history-title">Connecting…</p>
        </div>
      ) : null}

      {showInsufficientWithHistory ? (
        <div className="redeem-page__card redeem-page__insufficient-card redeem-page__insufficient-card--with-history">
          <h3 className="redeem-page__insufficient-title">Insufficient SC</h3>
          <p className="redeem-page__insufficient-text">
            Win a minimum of {MIN_REDEEM_SC_DISPLAY} SC to redeem.
          </p>
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
                      {formatWithdrawHistoryFiatAmount(row.amount)} BankTransfer
                    </span>
                    <span
                      className={redeemHistoryStatusClassName(row.statusLabel)}>
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
            disabled={
              ordersLoading ||
              (!mock && !gatewayRequestReady) ||
              cannotRedeem
            }
            onClick={() => setMethodModalOpen(true)}>
            NEW REDEEM
          </button>
        </div>
      ) : null}

      {showInsufficientFullPage ? (
        <div className="redeem-page__insufficient-card">
          <h3 className="redeem-page__insufficient-title">Insufficient SC</h3>
          <p className="redeem-page__insufficient-text">
            Win a minimum of {MIN_REDEEM_SC_DISPLAY} SC to redeem.
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
        redeemableAmountRaw={redeemableAmount}
      />
    </section>
  );
}
