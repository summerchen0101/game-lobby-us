export const DEFAULT_REDEEM_PILL_MESSAGES: readonly string[] = [
  "Will withdrew $300",
  "Alex claimed $1,250",
  "Sam redeemed a $500 prize",
];

export function sanitizePillMessages(messages: string[]): string[] {
  return messages.map((s) => s.trim()).filter(Boolean);
}
