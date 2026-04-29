import {
  type WithdrawOrderWireRow,
  withdrawOrderPaymentStatusToLabel,
} from "../../realtime/withdrawLobbyWire";
import { SC_POINT_SCALE } from "../../wallet/formatWalletAmount";

function mockRow(
  withdrawOrderUID: string,
  amount: string,
  statusRaw: number | string,
): WithdrawOrderWireRow {
  const st = String(statusRaw);
  return {
    withdrawOrderUID,
    amount,
    withdrawOrderPaymentStatus: st,
    statusLabel: withdrawOrderPaymentStatusToLabel(statusRaw),
  };
}

/** Fixed list for offline / mock-mode Redemption History (12 rows → 3 pages at size 4). */
export const MOCK_WITHDRAW_ORDER_ROWS: readonly WithdrawOrderWireRow[] = [
  mockRow("wd-mock-k4n2p9x1", String(200 * SC_POINT_SCALE), 5),
  mockRow("wd-mock-m7vq3j2a", String(150 * SC_POINT_SCALE), 1),
  mockRow("wd-mock-r8bw1c5d", String(320 * SC_POINT_SCALE), 4),
  mockRow("wd-mock-t2hy6f0g", String(75 * SC_POINT_SCALE), 3),
  mockRow("wd-mock-z9qm4n8p", String(500 * SC_POINT_SCALE), 5),
  mockRow("wd-mock-a3xs7k2m", String(120 * SC_POINT_SCALE), 2),
  mockRow("wd-mock-d5ef1w4r", String(90 * SC_POINT_SCALE), 6),
  mockRow("wd-mock-g8ij2l6o", String(250 * SC_POINT_SCALE), 1),
  mockRow("wd-mock-j1op5q9s", String(180 * SC_POINT_SCALE), 5),
  mockRow("wd-mock-n4uv8t3x", String(60 * SC_POINT_SCALE), 7),
  mockRow("wd-mock-q7yz0b4c", String(410 * SC_POINT_SCALE), 4),
  mockRow("wd-mock-u0cd3e6f", String(95 * SC_POINT_SCALE), 1),
];

export function getMockWithdrawOrdersPage(
  page: number,
  pageSize: number,
): { orders: WithdrawOrderWireRow[]; total: number } {
  const total = MOCK_WITHDRAW_ORDER_ROWS.length;
  const p = Math.max(0, Math.floor(page));
  const size = Math.max(1, Math.floor(pageSize));
  const start = p * size;
  const orders = MOCK_WITHDRAW_ORDER_ROWS.slice(start, start + size);
  return { orders: [...orders], total };
}
