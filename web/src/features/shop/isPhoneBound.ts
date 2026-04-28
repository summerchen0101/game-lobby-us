import type { User } from "../../lib/api/types";

/** True when LOBBY_GET（或其它來源）已 merge 非空手機字串。 */
export function isPhoneBound(user: User | null | undefined): boolean {
  return !!(user?.phone?.trim());
}
