export type ProfileAvatar = {
  id: string
  imageSrc: string
}

/** 對應 `public/images/head/head{N}.png`（N = 1…10）；後端舊 id 同此區間 */
export const PROFILE_AVATAR_COUNT = 10

export const PROFILE_AVATARS: readonly ProfileAvatar[] = Array.from(
  { length: PROFILE_AVATAR_COUNT },
  (_, i) => {
    const n = i + 1
    return {
      id: String(n),
      imageSrc: `/images/head/head${n}.png`,
    }
  },
)

/** docs/profile.md 靜態表 ItemID 顯示順序（供頭像選擇排序） */
export const PROFILE_AVATAR_ITEM_ORDER: readonly number[] = [
  401, 406, 490, 491, 414, 494, 496, 495, 492, 438, 448, 487, 441, 485, 486,
  488, 489, 446, 419, 455, 497, 499,
]

const ITEM_ID_TO_HEAD_INDEX = new Map<number, number>(
  PROFILE_AVATAR_ITEM_ORDER.map((itemId, i) => [
    itemId,
    (i % PROFILE_AVATAR_COUNT) + 1,
  ]),
)

function isLegacyOneToTenId(id: string): boolean {
  return /^[1-9]$|^10$/.test(id)
}

function headSrcForIndex(n: number): string {
  return `/images/head/head${n}.png`
}

/**
 * `backendAvatarId` 為登入／refresh 之 User.avatarId（可為 Item ID 如 401）；
 * `storedId` 為 localStorage，僅在後端未給有效 id 時使用。
 */
export function effectiveAvatarId(
  backendAvatarId: number | undefined,
  storedId: string,
): string | undefined {
  if (
    backendAvatarId !== undefined &&
    Number.isFinite(backendAvatarId) &&
    backendAvatarId >= 1
  ) {
    return String(Math.floor(backendAvatarId))
  }
  const t = storedId?.trim()
  if (t && (isLegacyOneToTenId(t) || /^\d+$/.test(t))) return t
  return undefined
}

export function getProfileAvatarById(
  id: string | null | undefined,
): ProfileAvatar | undefined {
  if (id == null || id === "") return undefined
  const s = String(id).trim()
  const fromList = PROFILE_AVATARS.find((a) => a.id === s)
  if (fromList) return fromList
  const n = Number(s)
  if (!Number.isFinite(n) || n < 1) return undefined
  const headIdx = ITEM_ID_TO_HEAD_INDEX.get(Math.floor(n))
  if (headIdx !== undefined) {
    return { id: s, imageSrc: headSrcForIndex(headIdx) }
  }
  if (isLegacyOneToTenId(s)) {
    return { id: s, imageSrc: headSrcForIndex(Number(s)) }
  }
  return undefined
}
