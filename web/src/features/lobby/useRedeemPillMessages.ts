import { useEffect, useMemo, useState } from "react";
import { mockGetRedeemPillMessages } from "../../lib/api/mock";
import { DEFAULT_REDEEM_PILL_MESSAGES, sanitizePillMessages } from "./redeemPillMessages";

export function useRedeemPillMessages(): string[] {
  const [raw, setRaw] = useState<string[]>(() => [
    ...DEFAULT_REDEEM_PILL_MESSAGES,
  ]);
  useEffect(() => {
    let cancelled = false;
    void mockGetRedeemPillMessages().then((m) => {
      if (cancelled) return;
      setRaw(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return useMemo(() => sanitizePillMessages(raw), [raw]);
}
