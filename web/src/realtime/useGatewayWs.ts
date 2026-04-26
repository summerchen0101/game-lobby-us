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
    onOpen,
    onSocketError,
    onGatewayError,
    getRequestBasicExtras,
    url,
    wsToken,
    clientVer,
    requestTimeoutMs,
    heartbeatIntervalMs,
    reconnect,
    initialReconnectDelayMs,
    maxReconnectDelayMs,
  } = params

  const onStateRef = useRef(onState)
  const onResponseRef = useRef(onResponse)
  const onOpenRef = useRef(onOpen)
  const onSocketErrorRef = useRef(onSocketError)
  const onGatewayErrorRef = useRef(onGatewayError)
  const getExtrasRef = useRef(getRequestBasicExtras)

  useEffect(() => {
    onStateRef.current = onState
    onResponseRef.current = onResponse
    onOpenRef.current = onOpen
    onSocketErrorRef.current = onSocketError
    onGatewayErrorRef.current = onGatewayError
    getExtrasRef.current = getRequestBasicExtras
  }, [
    onState,
    onResponse,
    onOpen,
    onSocketError,
    onGatewayError,
    getRequestBasicExtras,
  ])

  useEffect(() => {
    if (!enabled) return

    const client = createGatewayWs({
      url,
      wsToken,
      clientVer,
      requestTimeoutMs,
      heartbeatIntervalMs,
      reconnect,
      initialReconnectDelayMs,
      maxReconnectDelayMs,
      getRequestBasicExtras: () =>
        (getExtrasRef.current?.() ?? {}) as Record<string, unknown>,
      onState: (s) => onStateRef.current?.(s),
      onResponse: (m) => onResponseRef.current?.(m),
      onOpen: (ctx) => onOpenRef.current?.(ctx),
      onSocketError: (e) => onSocketErrorRef.current?.(e),
      onGatewayError: (m) => onGatewayErrorRef.current?.(m),
    })

    client.open()
    return () => client.close()
  }, [
    enabled,
    url,
    wsToken,
    clientVer,
    requestTimeoutMs,
    heartbeatIntervalMs,
    reconnect,
    initialReconnectDelayMs,
    maxReconnectDelayMs,
  ])
}
