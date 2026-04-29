import {
  type WithdrawOrderWireRow,
  withdrawOrderPaymentStatusToLabel,
} from "../../realtime/withdrawLobbyWire";

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

/** Fixed list for offline / mock-mode Redemption History (12 rows → 2 pages at size 10). */
export const MOCK_WITHDRAW_ORDER_ROWS: readonly WithdrawOrderWireRow[] = [
  mockRow("wd-mock-k4n2p9x1", "200", 5),
  mockRow("wd-mock-m7vq3j2a", "150", 1),
  mockRow("wd-mock-r8bw1c5d", "320", 4),
  mockRow("wd-mock-t2hy6f0g", "75", 3),
  mockRow("wd-mock-z9qm4n8p", "500", 5),
  mockRow("wd-mock-a3xs7k2m", "120", 2),
  mockRow("wd-mock-d5ef1w4r", "90", 6),
  mockRow("wd-mock-g8ij2l6o", "250", 1),
  mockRow("wd-mock-j1op5q9s", "180", 5),
  mockRow("wd-mock-n4uv8t3x", "60", 7),
  mockRow("wd-mock-q7yz0b4c", "410", 4),
  mockRow("wd-mock-u0cd3e6f", "95", 1),
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
