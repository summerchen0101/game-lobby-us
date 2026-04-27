import * as protobuf from 'protobufjs/light.js'
import schema from '../gen/lobby_wire.schema.js'
import type { ActiveWallet } from '../wallet/walletContext'

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace)

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name)
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`lobby wire: missing message type ${name}`)
  }
  return t
}

const WalletUseRequestType = mustLookup('megaman.WalletUseRequest')

/** ACTIVE_WALLET_GC = 1, ACTIVE_WALLET_SC = 2 */
export function encodeWalletUseRequestBytes(activeWallet: ActiveWallet): Uint8Array {
  const mode = activeWallet === 'SC' ? 2 : 1
  const err = WalletUseRequestType.verify({ mode })
  if (err) throw new Error(`WalletUseRequest: ${err}`)
  const msg = WalletUseRequestType.create({ mode })
  return Uint8Array.from(WalletUseRequestType.encode(msg).finish())
}

/**
 * 回應若與 `WalletUseRequest` 同形可解；否則回 null 由呼叫端改以 hex 顯示。
 * 僅供 dev 日誌用。
 */
export function tryDecodeWalletUseRequestForDev(
  data: Uint8Array,
): Record<string, unknown> | null {
  if (data.byteLength === 0) return null
  try {
    const msg = WalletUseRequestType.decode(data)
    return WalletUseRequestType.toObject(msg, {
      longs: String,
      defaults: true,
      enums: String,
    }) as Record<string, unknown>
  } catch {
    return null
  }
}
