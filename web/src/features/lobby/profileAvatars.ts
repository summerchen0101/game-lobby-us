export type ProfileAvatar = {
  id: string
  imageSrc: string
}

/** 對應 `public/images/head/head{N}.png`（N = 1…10）；後端數字 avatar id 同此區間 */
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

function isKnownAvatarId(id: string): boolean {
  return /^[1-9]$|^10$/.test(id)
}

/**
 * `backendAvatarId` 為登入／refresh 之 User.avatarId；
 * `storedId` 為 localStorage，僅在後端未給有效 id 時使用。
 */
export function effectiveAvatarId(
  backendAvatarId: number | undefined,
  storedId: string,
): string | undefined {
  if (
    backendAvatarId !== undefined &&
    Number.isFinite(backendAvatarId) &&
    backendAvatarId >= 1 &&
    backendAvatarId <= PROFILE_AVATAR_COUNT
  ) {
    return String(Math.floor(backendAvatarId))
  }
  const t = storedId?.trim()
  if (t && isKnownAvatarId(t)) return t
  return undefined
}

export function getProfileAvatarById(
  id: string | null | undefined,
): ProfileAvatar | undefined {
  if (id == null || id === "") return undefined
  const s = String(id).trim()
  const fromList = PROFILE_AVATARS.find((a) => a.id === s)
  if (fromList) return fromList
  if (!isKnownAvatarId(s)) return undefined
  const n = Number(s)
  return {
    id: s,
    imageSrc: `/images/head/head${n}.png`,
  }
}
