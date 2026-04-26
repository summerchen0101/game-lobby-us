import { useEffect, useRef } from 'react'
import {
  createGatewayWs,
  type GatewayWsOptions,
} from './gatewayWs'

export type UseGatewayWsParams = GatewayWsOptions & {
  /** false 時不連線（預設 false，避免干擾未就緒後端） */
  enabled?: boolean
}

/**
 * 以 ref 保留最新 callback，避免 effect 過度重跑。
 * `enabled === true` 時建立連線並在 unmount 時關閉。
 */
export function useGatewayWs(params: UseGatewayWsParams): void {
  const {
    enabled = false,
    onState,
    onResponse,
    onSocketError,
    onGatewayError,
    getRequestBasicExtras,
    url,
    wsToken,
    heartbeatIntervalMs,
    reconnect,
    initialReconnectDelayMs,
    maxReconnectDelayMs,
  } = params

  const onStateRef = useRef(onState)
  const onResponseRef = useRef(onResponse)
  const onSocketErrorRef = useRef(onSocketError)
  const onGatewayErrorRef = useRef(onGatewayError)
  const getExtrasRef = useRef(getRequestBasicExtras)

  useEffect(() => {
    onStateRef.current = onState
    onResponseRef.current = onResponse
    onSocketErrorRef.current = onSocketError
    onGatewayErrorRef.current = onGatewayError
    getExtrasRef.current = getRequestBasicExtras
  }, [
    onState,
    onResponse,
    onSocketError,
    onGatewayError,
    getRequestBasicExtras,
  ])

  useEffect(() => {
    if (!enabled) return

    const client = createGatewayWs({
      url,
      wsToken,
      heartbeatIntervalMs,
      reconnect,
      initialReconnectDelayMs,
      maxReconnectDelayMs,
      getRequestBasicExtras: () =>
        (getExtrasRef.current?.() ?? {}) as Record<string, unknown>,
      onState: (s) => onStateRef.current?.(s),
      onResponse: (m) => onResponseRef.current?.(m),
      onSocketError: (e) => onSocketErrorRef.current?.(e),
      onGatewayError: (m) => onGatewayErrorRef.current?.(m),
    })

    client.open()
    return () => client.close()
  }, [
    enabled,
    url,
    wsToken,
    heartbeatIntervalMs,
    reconnect,
    initialReconnectDelayMs,
    maxReconnectDelayMs,
  ])
}
