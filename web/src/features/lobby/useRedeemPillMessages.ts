import { useEffect, useMemo, useState } from "react";
import { mockGetRedeemPillMessages } from "../../lib/api/mock";
import {
  DEFAULT_REDEEM_PILL_MESSAGES,
  sanitizePillMessages,
} from "./redeemPillMessages";

export function useRedeemPillMessages(
  liveMessages: readonly string[] = [],
): string[] {
  const [mockAugmented, setMockAugmented] = useState<string[]>(() => [
    ...DEFAULT_REDEEM_PILL_MESSAGES,
  ]);
  useEffect(() => {
    let cancelled = false;
    void mockGetRedeemPillMessages().then((m) => {
      if (cancelled) return;
      setMockAugmented(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return useMemo(
    () => sanitizePillMessages([...liveMessages, ...mockAugmented]),
    [liveMessages, mockAugmented],
  );
}
