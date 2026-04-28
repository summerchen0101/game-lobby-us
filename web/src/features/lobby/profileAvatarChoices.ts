import type { PlayerAvatarRowDecoded } from '../../realtime/playerAvatarWire'
import {
  PROFILE_AVATAR_ITEM_ORDER,
  getProfileAvatarById,
} from './profileAvatars'

export type HeadIconChoice = {
  id: string
  imageSrc: string
  disabled?: boolean
}

const ORDER_INDEX = new Map(
  PROFILE_AVATAR_ITEM_ORDER.map((id, i) => [id, i]),
)

export function headIconChoicesFromServerRows(
  rows: PlayerAvatarRowDecoded[] | undefined | null,
): HeadIconChoice[] {
  if (!rows?.length) return []
  const mapped = rows.map((row) => {
    const id =
      row.avatarID != null && String(row.avatarID) !== ''
        ? String(row.avatarID).trim()
        : ''
    const url = typeof row.avatarUrl === 'string' ? row.avatarUrl.trim() : ''
    let imageSrc = ''
    if (url.startsWith('http://') || url.startsWith('https://')) {
      imageSrc = url
    } else if (id) {
      imageSrc = getProfileAvatarById(id)?.imageSrc ?? ''
    }
    if (!imageSrc && id) {
      imageSrc = '/images/head/head1.png'
    }
    const st = row.goodState
    const disabled =
      st === 'UNUSABLE' || st === '3'
    return { id: id || '0', imageSrc, disabled }
  })
  const out = mapped.filter((c) => c.id && c.id !== '0')
  out.sort((a, b) => {
    const na = Number(a.id)
    const nb = Number(b.id)
    const ia = ORDER_INDEX.get(na)
    const ib = ORDER_INDEX.get(nb)
    if (ia !== undefined && ib !== undefined) return ia - ib
    if (ia !== undefined) return -1
    if (ib !== undefined) return 1
    return na - nb
  })
  return out
}
