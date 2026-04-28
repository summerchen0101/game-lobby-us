import { hexPreview } from './bytesHexPreview'
import { decodeGatewayRequestDataForDevLog } from './gatewayRequestDevPayload'

const DATA_HEX_PREVIEW_MAX_BYTES = 256
const HEX_PREVIEW_LEN = 48

/** `import.meta.env.DEV` 或 `VITE_GATEWAY_WS_TRACE=true` 時啟用（production build 預設關）。 */
export function isGatewayWsTraceEnabled(): boolean {
  if (import.meta.env.DEV) return true
  return import.meta.env.VITE_GATEWAY_WS_TRACE === 'true'
}

/** 與 `getGatewayWsUrlForDevLog` 相同規則，避免完整 token 進 console。 */
export function maskTokenForLog(raw: string): string {
  if (!raw) return '(empty)'
  if (raw.length <= 12) return '(set)'
  return `${raw.slice(0, 6)}…${raw.slice(-4)}(len=${raw.length})`
}

export function sanitizeBasicForLog(
  basic: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...basic }
  if (typeof out.token === 'string') {
    out.token = maskTokenForLog(out.token)
  }
  return out
}

export function logGatewayRequestOut(params: {
  kind?: 'PING_PONG' | 'API'
  apiType: number
  requestID: string
  debugLabel?: string
  basic: Record<string, unknown>
  data: Uint8Array
}): void {
  if (!isGatewayWsTraceEnabled()) return
  const dataByteLength = params.data.byteLength
  const dataHexPreview =
    dataByteLength > 0 && dataByteLength <= DATA_HEX_PREVIEW_MAX_BYTES
      ? hexPreview(params.data, HEX_PREVIEW_LEN)
      : undefined
  const dataDecoded = decodeGatewayRequestDataForDevLog(
    params.apiType,
    params.data,
  )
  console.info('[gateway-ws] → request', {
    kind: params.kind ?? 'API',
    apiType: params.apiType,
    requestID: params.requestID,
    debugLabel: params.debugLabel,
    basic: sanitizeBasicForLog(params.basic),
    dataByteLength,
    dataDecoded,
    ...(dataHexPreview ? { dataHexPreview } : {}),
  })
}
