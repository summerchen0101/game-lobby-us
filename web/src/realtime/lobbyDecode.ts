import * as protobuf from 'protobufjs/light.js'
import type { Game } from '../lib/api/types'
import { getUnityWebEntryBase } from '../lib/env'
import schema from '../gen/lobby_wire.schema.js'

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace)

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name)
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`lobby wire: missing message type ${name}`)
  }
  return t
}

const LobbyGetResponseType = mustLookup('megaman.LobbyGetResponse')

export function decodeLobbyGetResponseBytes(data: Uint8Array) {
  const msg = LobbyGetResponseType.decode(data)
  return LobbyGetResponseType.toObject(msg, {
    longs: String,
    defaults: true,
    enums: String,
  })
}

export type LobbyGetDecoded = ReturnType<typeof decodeLobbyGetResponseBytes>

type LobbyGameRow = NonNullable<
  NonNullable<LobbyGetDecoded['games']>['games']
>[number]

function lobbyGameRowToApiGame(g: LobbyGameRow): Game {
  const id = String(g.ID ?? '')
  const path = typeof g.path === 'string' ? g.path.trim() : ''
  const icon = typeof g.iconURL === 'string' ? g.iconURL.trim() : ''
  let launchUrl = ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    launchUrl = path
  } else if (path && id) {
    try {
      const u = new URL(getUnityWebEntryBase())
      u.searchParams.set('game_id', id)
      launchUrl = u.toString()
    } catch {
      launchUrl = ''
    }
  }
  return {
    id,
    title: typeof g.displayName === 'string' ? g.displayName : id || 'Game',
    thumbnailUrl: icon || undefined,
    launchUrl,
  }
}

/** 將 LOBBY_GET 解碼結果轉成大廳 Game 列表（launchUrl 僅在 path 為 http(s) 或可組 WebEntry 時填入）。 */
export function lobbyDecodedGamesToApiGames(decoded: LobbyGetDecoded): Game[] {
  const games: LobbyGameRow[] = decoded.games?.games ?? []
  return games.map((row) => lobbyGameRowToApiGame(row))
}
