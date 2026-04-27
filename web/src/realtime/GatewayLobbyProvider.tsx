import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/useAuth'
import type { Game } from '../lib/api/types'
import {
  getGatewayWsUrlForDevLog,
  isMockMode,
  isWsLobbyGamesEnabled,
} from '../lib/env'
import {
  GATEWAY_API_LOBBY_GET,
  GATEWAY_API_SLOT_JACKPOT_PUSH,
} from './gatewayApi'
import { decodeSlotJackPotInfoBytes } from './jackpotLobbyWire'
import type { GatewayWsRequestFn } from './gatewayWs'
import { isGatewaySuccessCode } from './gatewayWire'
import { hexPreview } from './bytesHexPreview'
import {
  decodeLobbyGetResponseBytes,
  lobbyDecodedGamesToApiGames,
  lobbyDecodedPlayerToUserPatch,
} from './lobbyDecode'
import { formatGatewayResponseForDevLog } from './gatewayResponseDevPayload'
import { useGatewayWs } from './useGatewayWs'
import { GatewayLobbyContext, type GatewayLobbyContextValue } from './gatewayLobbyContext'

function devGatewayWsProbeEnabled(): boolean {
  if (!import.meta.env.DEV) return false
  return import.meta.env.VITE_DEV_GATEWAY_WS !== 'false'
}

export function GatewayLobbyProvider({ children }: { children: ReactNode }) {
  const { token, user, mergeUser } = useAuth()
  const wsLobbyEnabled = isWsLobbyGamesEnabled()
  const gatewayWsEnabled =
    !isMockMode() && (devGatewayWsProbeEnabled() || wsLobbyEnabled)
  const shouldRunLobbyGetOnOpen =
    (import.meta.env.DEV && import.meta.env.VITE_DEV_LOBBY_GET !== 'false') ||
    wsLobbyEnabled

  const [lobbyGames, setLobbyGames] = useState<Game[] | null>(null)
  const [lobbyLoading, setLobbyLoading] = useState(false)
  const [lobbyError, setLobbyError] = useState<string | null>(null)
  const [liveJackpotAmounts, setLiveJackpotAmounts] = useState<
    readonly [number, number, number] | null
  >(null)

  const requestRef = useRef<GatewayWsRequestFn | null>(null)

  const getRequestBasicExtras = useCallback((): Record<string, unknown> => {
    const uid = user?.id
    if (!uid || !/^\d+$/.test(uid)) {
      return { userID: 0 }
    }
    const n = Number.parseInt(uid, 10)
    return { userID: Number.isFinite(n) ? n : 0 }
  }, [user?.id])

  useEffect(() => {
    if (token) return
    setLobbyGames(null)
    setLobbyError(null)
    setLobbyLoading(false)
    setLiveJackpotAmounts(null)
    requestRef.current = null
  }, [token])

  useGatewayWs({
    enabled: gatewayWsEnabled,
    wsToken: token ?? '',
    clientVer: import.meta.env.VITE_CLIENT_VER?.trim() || undefined,
    getRequestBasicExtras,
    onState: (s) => {
      if (import.meta.env.DEV) {
        console.info('[gateway-ws][dev] state:', s, {
          wsUrl: getGatewayWsUrlForDevLog({ token: token ?? '' }),
        })
      }
    },
    onResponse: (msg) => {
      if (import.meta.env.DEV) {
        console.info(
          '[gateway-ws][dev] response:',
          formatGatewayResponseForDevLog(msg),
        )
      }
      const codeStr = String(msg.code ?? '')
      if (!isGatewaySuccessCode(codeStr)) return
      if (Number(msg.type) !== GATEWAY_API_SLOT_JACKPOT_PUSH) return
      const raw = msg.data
      if (!(raw instanceof Uint8Array) || raw.byteLength === 0) return
      const triple = decodeSlotJackPotInfoBytes(raw)
      if (triple) setLiveJackpotAmounts(triple)
    },
    onOpen: async ({ request }) => {
      requestRef.current = request
      if (!shouldRunLobbyGetOnOpen) return
      if (wsLobbyEnabled) setLobbyLoading(true)
      try {
        const r = await request({
          type: GATEWAY_API_LOBBY_GET,
          data: new Uint8Array(0),
          debugLabel: 'LOBBY_GET',
        })
        const raw = r.data
        const len = raw instanceof Uint8Array ? raw.byteLength : 0
        if (import.meta.env.DEV) {
          console.info('[gateway-ws][dev] LOBBY_GET', {
            code: r.code,
            type: r.type,
            errMessage: r.errMessage,
            dataLength: len,
            dataHexPreview24:
              len > 0 && raw instanceof Uint8Array ? hexPreview(raw, 24) : '',
          })
        }
        if (String(r.code) === '200') {
          if (len > 0 && raw instanceof Uint8Array) {
            try {
              const decoded = decodeLobbyGetResponseBytes(raw)
              const items = lobbyDecodedGamesToApiGames(decoded)
              const userPatch = lobbyDecodedPlayerToUserPatch(decoded)
              if (userPatch && Object.keys(userPatch).length > 0) {
                mergeUser(userPatch)
              }
              if (import.meta.env.DEV) {
                console.info(
                  '[gateway-ws][dev] LOBBY_GET decoded games:',
                  items.length,
                  items.slice(0, 3),
                  'playerInfo:',
                  userPatch ?? null,
                )
              }
              setLobbyGames(items)
              if (wsLobbyEnabled) setLobbyError(null)
            } catch (decodeErr) {
              console.warn('[gateway-ws] LOBBY_GET decode failed', decodeErr)
              if (wsLobbyEnabled) {
                setLobbyGames([])
                setLobbyError('Could not decode lobby games')
              } else {
                setLobbyGames(null)
              }
            }
          } else {
            setLobbyGames([])
            if (wsLobbyEnabled) setLobbyError(null)
          }
        } else {
          if (wsLobbyEnabled) {
            setLobbyGames([])
            setLobbyError(
              r.errMessage?.trim() ||
                `Lobby request failed (${String(r.code ?? '')})`,
            )
          } else {
            setLobbyGames(null)
          }
        }
      } catch (e) {
        console.warn('[gateway-ws] LOBBY_GET failed', e)
        if (wsLobbyEnabled) {
          setLobbyGames([])
          setLobbyError(
            e instanceof Error ? e.message : 'Lobby WebSocket request failed',
          )
        } else {
          setLobbyGames(null)
        }
      } finally {
        if (wsLobbyEnabled) setLobbyLoading(false)
      }
    },
    onSocketError: (ev) => {
      console.warn('[gateway-ws] WebSocket error:', ev)
      if (wsLobbyEnabled) {
        setLobbyLoading(false)
        setLobbyError((prev) => prev ?? 'WebSocket connection error')
      } else {
        setLobbyGames(null)
      }
    },
    onGatewayError: (msg) => {
      if (import.meta.env.DEV) {
        console.warn('[gateway-ws][dev] non-success code:', msg)
      }
    },
  })

  const value = useMemo<GatewayLobbyContextValue>(
    () => ({
      requestRef,
      lobbyGames,
      lobbyLoading,
      lobbyError,
      liveJackpotAmounts,
    }),
    [lobbyGames, lobbyLoading, lobbyError, liveJackpotAmounts],
  )

  return (
    <GatewayLobbyContext.Provider value={value}>{children}</GatewayLobbyContext.Provider>
  )
}
