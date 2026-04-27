import { useCallback, useSyncExternalStore } from "react"
const KEY = "wynoco_profile_avatar_id"
const LOCAL_EVENT = "wynoco-profile-avatar"

function read(): string {
  if (typeof window === "undefined") return ""
  try {
    return localStorage.getItem(KEY) ?? ""
  } catch {
    return ""
  }
}

function notify() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(LOCAL_EVENT))
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === KEY) {
      callback()
    }
  }
  const onLocal = () => callback()
  window.addEventListener("storage", onStorage)
  window.addEventListener(LOCAL_EVENT, onLocal)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.removeEventListener(LOCAL_EVENT, onLocal)
  }
}

function getServerSnapshot() {
  return ""
}

/**
 * Subscribes to the persisted profile avatar id (localStorage) so e.g. Profile and SessionHeader stay in sync.
 */
export function useProfileAvatarId() {
  const id = useSyncExternalStore(
    subscribe,
    read,
    getServerSnapshot,
  )

  const setAvatarId = useCallback((next: string) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* quota / private mode */
    }
    notify()
  }, [])

  return { avatarId: id, setAvatarId }
}
