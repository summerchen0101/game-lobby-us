import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/useAuth";
import type { Game } from "../lib/api/types";
import { useWallet } from "../wallet/walletContext";
import {
  getGatewayWsUrlForDevLog,
  isMockMode,
  isWsLobbyGamesEnabled,
} from "../lib/env";
import {
  GATEWAY_API_LOBBY_GET,
  GATEWAY_API_SEND_MESSAGE_PUSH,
  GATEWAY_API_SERVER_LOGIN,
  GATEWAY_API_SLOT_JACKPOT_PUSH,
} from "./gatewayApi";
import { decodeSlotJackPotInfoBytes } from "./jackpotLobbyWire";
import type { GatewayWsRequestFn } from "./gatewayWs";
import { isGatewaySuccessCode } from "./gatewayWire";
import { hexPreview } from "./bytesHexPreview";
import {
  decodeLobbyGetResponseBytes,
  type LobbyGetDecoded,
  lobbyDecodedGamesToApiGames,
  lobbyDecodedToUserPatch,
} from "./lobbyDecode";
import { useGatewayWs } from "./useGatewayWs";
import {
  GatewayLobbyContext,
  type GatewayLobbyContextValue,
  type PaymentFinishListener,
} from "./gatewayLobbyContext";
import {
  tryDecodeSendMessagePushToPaymentPush,
  userPatchFromPaymentPush,
} from "./shopLobbyWire";
import { wireUInt64Field } from "./wireUint64";

function devGatewayWsProbeEnabled(): boolean {
  if (!import.meta.env.DEV) return false;
  return import.meta.env.VITE_DEV_GATEWAY_WS !== "false";
}

export function GatewayLobbyProvider({ children }: { children: ReactNode }) {
  const { token, user, mergeUser } = useAuth();
  const { setActiveWallet } = useWallet();
  const wsLobbyEnabled = isWsLobbyGamesEnabled();
  const gatewayWsEnabled =
    !isMockMode() && (devGatewayWsProbeEnabled() || wsLobbyEnabled);
  const shouldRunLobbyGetOnOpen =
    (import.meta.env.DEV && import.meta.env.VITE_DEV_LOBBY_GET !== "false") ||
    wsLobbyEnabled;

  const [lobbyGames, setLobbyGames] = useState<Game[] | null>(null);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [liveJackpotAmounts, setLiveJackpotAmounts] = useState<
    readonly [number, number, number] | null
  >(null);
  const [lobbyGet, setLobbyGet] = useState<LobbyGetDecoded | null>(null);

  const requestRef = useRef<GatewayWsRequestFn | null>(null);
  const paymentFinishListenersRef = useRef(new Set<PaymentFinishListener>());

  const subscribePaymentFinish = useCallback(
    (listener: PaymentFinishListener) => {
      paymentFinishListenersRef.current.add(listener);
      return () => {
        paymentFinishListenersRef.current.delete(listener);
      };
    },
    [],
  );

  const getRequestBasicExtras = useCallback((): Record<string, unknown> => {
    const uid = user?.id;
    if (!uid || !/^\d+$/.test(uid)) {
      return { userID: 0 };
    }
    try {
      return { userID: wireUInt64Field(uid) };
    } catch {
      return { userID: 0 };
    }
  }, [user?.id]);

  useEffect(() => {
    if (token) return;
    setLobbyGames(null);
    setLobbyError(null);
    setLobbyLoading(false);
    setLiveJackpotAmounts(null);
    setLobbyGet(null);
    requestRef.current = null;
  }, [token]);

  useGatewayWs({
    enabled: gatewayWsEnabled && Boolean(token?.trim()),
    wsToken: token ?? "",
    clientVer: import.meta.env.VITE_CLIENT_VER?.trim() || undefined,
    getRequestBasicExtras,
    onState: (s) => {
      if (import.meta.env.DEV) {
        console.info("[gateway-ws][dev] state:", s, {
          wsUrl: getGatewayWsUrlForDevLog({ token: token ?? "" }),
        });
      }
    },
    onResponse: (msg) => {
      const codeStr = String(msg.code ?? "");
      if (!isGatewaySuccessCode(codeStr)) return;
      const t = Number(msg.type);
      const raw = msg.data;
      if (t === GATEWAY_API_SLOT_JACKPOT_PUSH) {
        if (!(raw instanceof Uint8Array) || raw.byteLength === 0) return;
        const triple = decodeSlotJackPotInfoBytes(raw);
        if (triple) setLiveJackpotAmounts(triple);
        return;
      }
      if (t === GATEWAY_API_SEND_MESSAGE_PUSH) {
        const push = tryDecodeSendMessagePushToPaymentPush(
          t,
          raw instanceof Uint8Array ? raw : undefined,
        );
        if (!push) return;
        const patch = userPatchFromPaymentPush(push);
        if (patch) mergeUser(patch);
        for (const fn of paymentFinishListenersRef.current) {
          try {
            fn(push);
          } catch (e) {
            console.warn("[gateway-ws] payment finish listener", e);
          }
        }
      }
    },
    onOpen: async ({ request }) => {
      requestRef.current = request;

      try {
        const loginRes = await request({
          type: GATEWAY_API_SERVER_LOGIN,
          data: new Uint8Array(0),
          debugLabel: "SERVER_LOGIN",
        });
        const loginRaw = loginRes.data;
        const loginLen =
          loginRaw instanceof Uint8Array ? loginRaw.byteLength : 0;
        if (import.meta.env.DEV) {
          console.info("[gateway-ws][dev] SERVER_LOGIN", {
            code: loginRes.code,
            type: loginRes.type,
            errMessage: loginRes.errMessage,
            dataLength: loginLen,
            dataHexPreview24:
              loginLen > 0 && loginRaw instanceof Uint8Array
                ? hexPreview(loginRaw, 24)
                : "",
          });
        }
        const loginCode = String(loginRes.code ?? "");
        if (!isGatewaySuccessCode(loginCode)) {
          console.warn("[gateway-ws] SERVER_LOGIN non-success", {
            code: loginRes.code,
            errMessage: loginRes.errMessage,
          });
        }
      } catch (e) {
        console.warn("[gateway-ws] SERVER_LOGIN failed", e);
      }

      if (!shouldRunLobbyGetOnOpen) return;
      if (wsLobbyEnabled) setLobbyLoading(true);
      try {
        const r = await request({
          type: GATEWAY_API_LOBBY_GET,
          data: new Uint8Array(0),
          debugLabel: "LOBBY_GET",
        });
        const raw = r.data;
        const len = raw instanceof Uint8Array ? raw.byteLength : 0;
        if (import.meta.env.DEV) {
          console.info("[gateway-ws][dev] LOBBY_GET", {
            code: r.code,
            type: r.type,
            errMessage: r.errMessage,
            dataLength: len,
            dataHexPreview24:
              len > 0 && raw instanceof Uint8Array ? hexPreview(raw, 24) : "",
          });
        }
        if (String(r.code) === "200") {
          if (len > 0 && raw instanceof Uint8Array) {
            try {
              const decoded = decodeLobbyGetResponseBytes(raw);
              const items = lobbyDecodedGamesToApiGames(decoded);
              const userPatch = lobbyDecodedToUserPatch(decoded);
              if (Object.keys(userPatch).length > 0) {
                mergeUser(userPatch);
                if (
                  userPatch.lobbyWalletType === "GC" ||
                  userPatch.lobbyWalletType === "SC"
                ) {
                  setActiveWallet(userPatch.lobbyWalletType);
                }
              }
              setLobbyGames(items);
              setLobbyGet(decoded);
              if (wsLobbyEnabled) setLobbyError(null);
            } catch (decodeErr) {
              console.warn("[gateway-ws] LOBBY_GET decode failed", decodeErr);
              setLobbyGet(null);
              if (wsLobbyEnabled) {
                setLobbyGames([]);
                setLobbyError("Could not decode lobby games");
              } else {
                setLobbyGames(null);
              }
            }
          } else {
            setLobbyGames([]);
            setLobbyGet(null);
            if (wsLobbyEnabled) setLobbyError(null);
          }
        } else {
          setLobbyGet(null);
          if (wsLobbyEnabled) {
            setLobbyGames([]);
            setLobbyError(
              r.errMessage?.trim() ||
                `Lobby request failed (${String(r.code ?? "")})`,
            );
          } else {
            setLobbyGames(null);
          }
        }
      } catch (e) {
        console.warn("[gateway-ws] LOBBY_GET failed", e);
        setLobbyGet(null);
        if (wsLobbyEnabled) {
          setLobbyGames([]);
          setLobbyError(
            e instanceof Error ? e.message : "Lobby WebSocket request failed",
          );
        } else {
          setLobbyGames(null);
        }
      } finally {
        if (wsLobbyEnabled) setLobbyLoading(false);
      }
    },
    onSocketError: (ev) => {
      console.warn("[gateway-ws] WebSocket error:", ev);
      if (wsLobbyEnabled) {
        setLobbyLoading(false);
        setLobbyError((prev) => prev ?? "WebSocket connection error");
      } else {
        setLobbyGames(null);
        setLobbyGet(null);
      }
    },
    onGatewayError: (msg) => {
      if (import.meta.env.DEV) {
        console.warn("[gateway-ws][dev] non-success code:", msg);
      }
    },
  });

  const value = useMemo<GatewayLobbyContextValue>(
    () => ({
      requestRef,
      lobbyGames,
      lobbyLoading,
      lobbyError,
      liveJackpotAmounts,
      lobbyGet,
      subscribePaymentFinish,
    }),
    [
      lobbyGames,
      lobbyLoading,
      lobbyError,
      liveJackpotAmounts,
      lobbyGet,
      subscribePaymentFinish,
    ],
  );

  return (
    <GatewayLobbyContext.Provider value={value}>
      {children}
    </GatewayLobbyContext.Provider>
  );
}
