import * as protobuf from 'protobufjs/light.js'
import schema from '../gen/lobby_wire.schema.js'

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace)

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name)
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`lobby wire: missing message type ${name}`)
  }
  return t
}

const SlotJackPotInfoType = mustLookup('megaman.SlotJackPotInfo')

function parseAmount(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return Math.max(0, Math.round(v))
  }
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
  }
  return 0
}

/** 取 jackpot_amounts 前三格；無有效資料時回傳 null */
export function decodeSlotJackPotInfoBytes(
  data: Uint8Array,
): readonly [number, number, number] | null {
  try {
    const msg = SlotJackPotInfoType.decode(data)
    const o = SlotJackPotInfoType.toObject(msg, {
      longs: String,
      defaults: true,
    }) as { jackpotAmounts?: unknown[] }
    const arr = o.jackpotAmounts
    if (!Array.isArray(arr) || arr.length === 0) return null
    return [
      parseAmount(arr[0]),
      parseAmount(arr[1] ?? 0),
      parseAmount(arr[2] ?? 0),
    ] as const
  } catch {
    return null
  }
}

/** 供 dev log 還原完整 `jackpot_amounts`（`decodeSlotJackPotInfoBytes` 僅回前三格）。 */
export function decodeSlotJackPotInfoToObjectForDev(
  data: Uint8Array,
): { jackpotAmounts: number[] } | null {
  try {
    const msg = SlotJackPotInfoType.decode(data)
    const o = SlotJackPotInfoType.toObject(msg, {
      longs: String,
      defaults: true,
    }) as { jackpotAmounts?: unknown[] }
    const arr = o.jackpotAmounts
    if (!Array.isArray(arr)) return { jackpotAmounts: [] }
    return { jackpotAmounts: arr.map((v) => parseAmount(v)) }
  } catch {
    return null
  }
}
