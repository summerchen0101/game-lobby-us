import "./ensureProtobufLong";
import * as protobuf from "protobufjs/light.js";
import type { Game, LobbyWalletType, User } from "../lib/api/types";
import { getUnityWebEntryBase } from "../lib/env";
import schema from "../gen/lobby_wire.schema.js";

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace);

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name);
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`lobby wire: missing message type ${name}`);
  }
  return t;
}

const LobbyGetResponseType = mustLookup("megaman.LobbyGetResponse");

export function decodeLobbyGetResponseBytes(data: Uint8Array) {
  const msg = LobbyGetResponseType.decode(data);
  return LobbyGetResponseType.toObject(msg, {
    longs: String,
    defaults: true,
    enums: String,
  });
}

export type LobbyGetDecoded = ReturnType<typeof decodeLobbyGetResponseBytes>;

type LobbyGameRow = NonNullable<
  NonNullable<LobbyGetDecoded["games"]>["games"]
>[number];

function numFromWire(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** megaman.GameLabel 數值（若 toObject 未轉成字串則用此對應） */
const GAME_LABEL_NUM_TO_NAME: Record<number, string> = {
  0: "UNKNOWN_LABEL",
  1: "HOT",
  2: "LATEST",
  3: "UNDER_MAINTENANCE",
  4: "COMING_SOON",
  5: "GENERAL",
};

const GAME_CATEGORY_NUM_TO_NAME: Record<number, string> = {
  0: "UNKNOWN_CATEGORY",
  1: "SLOT",
  2: "TABLE",
  3: "OTHER",
  4: "SCRATCHOFF",
};

function lobbyLabelFromRow(labelRaw: unknown): string | undefined {
  if (typeof labelRaw === "string" && labelRaw.trim()) {
    return labelRaw.trim();
  }
  if (typeof labelRaw === "number" && Number.isInteger(labelRaw)) {
    return GAME_LABEL_NUM_TO_NAME[labelRaw] ?? String(labelRaw);
  }
  return undefined;
}

function lobbyCategoryFromRow(categoryRaw: unknown): string | undefined {
  if (typeof categoryRaw === "string" && categoryRaw.trim()) {
    return categoryRaw.trim();
  }
  if (typeof categoryRaw === "number" && Number.isInteger(categoryRaw)) {
    return GAME_CATEGORY_NUM_TO_NAME[categoryRaw] ?? String(categoryRaw);
  }
  return undefined;
}

function sortFieldFromWire(v: unknown): number {
  const n = numFromWire(v);
  return n !== undefined ? n : 0;
}

function lobbyGameRowToApiGame(g: LobbyGameRow): Game {
  const id = String(g.ID ?? "");
  const path = typeof g.path === "string" ? g.path.trim() : "";
  const icon = typeof g.iconURL === "string" ? g.iconURL.trim() : "";
  const lobbyLabel = lobbyLabelFromRow(g.label);
  const lobbyCategory = lobbyCategoryFromRow(g.category);
  const providerRaw = g.providerName;
  const provider =
    typeof providerRaw === "string" && providerRaw.trim()
      ? providerRaw.trim()
      : undefined;
  let launchUrl = "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    launchUrl = path;
  } else if (path && id) {
    try {
      const u = new URL(getUnityWebEntryBase());
      u.searchParams.set("game_id", id);
      launchUrl = u.toString();
    } catch {
      launchUrl = "";
    }
  }
  return {
    id,
    title: typeof g.displayName === "string" ? g.displayName : id || "Game",
    thumbnailUrl: icon || undefined,
    launchUrl,
    lobbyLabel,
    lobbyCategory,
    provider,
    lobbySortFields: {
      sort: sortFieldFromWire(g.sort),
      hotSort: sortFieldFromWire(g.hotSort),
      slotSort: sortFieldFromWire(g.slotSort),
      cardSort: sortFieldFromWire(g.cardSort),
      fishSort: sortFieldFromWire(g.fishSort),
      arcadeSort: sortFieldFromWire(g.arcadeSort),
      lotterySort: sortFieldFromWire(g.lotterySort),
      battleSort: sortFieldFromWire(g.battleSort),
      classicSort: sortFieldFromWire(g.classicSort),
    },
  };
}

export type LobbyGameSortMenu =
  | "all"
  | "hot"
  | "slots"
  | "new"
  | "shooting"
  | "arcade"
  | "exclusive"
  | "battle"
  | "classic"
  | "providers";

/** 與 docs/lobby ELobbyMenuType 對照之排序欄位（default 用 0 → 以 sort 為 0 時穩定） */
export function lobbySortKeyForMenu(
  menu: LobbyGameSortMenu,
): keyof NonNullable<Game["lobbySortFields"]> {
  switch (menu) {
    case "hot":
      return "hotSort";
    case "slots":
      return "slotSort";
    case "new":
      return "cardSort";
    case "shooting":
      return "fishSort";
    case "arcade":
      return "arcadeSort";
    case "exclusive":
      return "lotterySort";
    case "battle":
      return "battleSort";
    case "classic":
      return "classicSort";
    case "all":
    case "providers":
    default:
      return "sort";
  }
}

function compareGamesByLobbySort(
  a: Game,
  b: Game,
  menu: LobbyGameSortMenu,
): number {
  const key = lobbySortKeyForMenu(menu);
  const fa = a.lobbySortFields?.[key] ?? 0;
  const fb = b.lobbySortFields?.[key] ?? 0;
  if (fb !== fa) return fb - fa;
  return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
}

/** 依目前分類分頁對 `Game[]` 做排序（大到小，見 docs/lobby）。 */
export function sortLobbyGamesByMenu(
  games: Game[],
  menu: LobbyGameSortMenu,
): Game[] {
  const copy = [...games];
  copy.sort((a, b) => compareGamesByLobbySort(a, b, menu));
  return copy;
}

/** 將 LOBBY_GET 解碼結果轉成大廳 Game 列表（launchUrl 僅在 path 為 http(s) 或可組 WebEntry 時填入）。 */
export function lobbyDecodedGamesToApiGames(decoded: LobbyGetDecoded): Game[] {
  const games: LobbyGameRow[] = decoded.games?.games ?? [];
  return games.map((row) => lobbyGameRowToApiGame(row));
}

type LobbyThirdPartyRow = NonNullable<
  NonNullable<LobbyGetDecoded["thirdPartyGameInfoList"]>
>[number];

/**
 * `LobbyGet.thirdPartyGameInfoList` 單筆 → 大廳卡片（順序交由呼叫端維持後端順序）。
 * 無效列（缺少 platform／gameUID）回傳 null。
 */
export function lobbyThirdPartyRowToApiGame(
  row: LobbyThirdPartyRow,
): Game | null {
  const platform = typeof row.platform === "string" ? row.platform.trim() : "";
  const uid =
    typeof row.gameUID === "string"
      ? row.gameUID.trim()
      : String(row.gameUID ?? "").trim();
  if (!platform || !uid) return null;
  const name =
    typeof row.gameName === "string" && row.gameName.trim()
      ? row.gameName.trim()
      : uid;
  return {
    id: `tp:${encodeURIComponent(platform)}:${encodeURIComponent(uid)}`,
    title: name,
    subtitle: platform,
    launchUrl: "",
    provider: platform,
    thirdPartyLaunch: { platform, gameUID: uid },
  };
}

/** 後端已排序之第三方列表；勿再呼叫 sortLobbyGamesByMenu。 */
export function lobbyThirdPartyListToApiGames(
  list: LobbyGetDecoded["thirdPartyGameInfoList"] | undefined | null,
): Game[] {
  const rows = list ?? [];
  const out: Game[] = [];
  for (const row of rows) {
    const g = lobbyThirdPartyRowToApiGame(row);
    if (g) out.push(g);
  }
  return out;
}

type LobbyPlayerRow = NonNullable<LobbyGetDecoded["playerInfo"]>;

function lobbyWalletTypeFromWire(raw: unknown): LobbyWalletType | undefined {
  if (raw === "GC" || raw === 1 || raw === "1") return "GC";
  if (raw === "SC" || raw === 2 || raw === "2") return "SC";
  if (raw === "UNKNOWN_WALLET_TYPE" || raw === 0 || raw === "0")
    return "UNKNOWN";
  return undefined;
}

/**
 * LOBBY_GET 內 `playerInfo`（與 megaman.LobbyGetResponse 欄位 3 對齊）轉成可 merge 進 `User` 的欄位。
 */
function isGoldenCoinType(raw: unknown): boolean {
  return raw === "GOLDEN" || raw === 1 || raw === "1";
}

type BagRow = NonNullable<LobbyGetDecoded["bag"]>;

function sumGoldenAmountFromBag(
  bag: BagRow | null | undefined,
): number | undefined {
  if (!bag?.coins?.length) return undefined;
  let sum = 0;
  for (const c of bag.coins) {
    if (!c || typeof c !== "object") continue;
    if (!isGoldenCoinType((c as { type?: unknown }).type)) continue;
    const n = numFromWire((c as { amount?: unknown }).amount);
    if (n !== undefined) sum += n;
  }
  return sum;
}

/**
 * LOBBY_GET `bag` / `bagGC`（欄位 1、19）→ `User.balance`（GC）與 `sweepstakesBalance`（SC）。
 * 命名依 proto：`bagGC` 對應 GC 顯示餘額，`bag` 對應 SC。
 */
export function lobbyDecodedBagsToUserBalancePatch(
  decoded: LobbyGetDecoded,
): Partial<User> | null {
  const gc = sumGoldenAmountFromBag(decoded.bagGC ?? undefined);
  const sc = sumGoldenAmountFromBag(decoded.bag ?? undefined);
  if (gc === undefined && sc === undefined) return null;
  const out: Partial<User> = {};
  if (gc !== undefined) out.balance = gc;
  if (sc !== undefined) out.sweepstakesBalance = sc;
  return out;
}

export function lobbyDecodedPlayerToUserPatch(
  decoded: LobbyGetDecoded,
): Partial<User> | null {
  const p = decoded.playerInfo as LobbyPlayerRow | null | undefined;
  const idRaw = p && typeof p === "object" ? p.userID : undefined;
  const id = idRaw != null && String(idRaw) !== "" ? String(idRaw) : undefined;
  const nickRaw = p && typeof p === "object" ? p.nickname : undefined;
  const displayName =
    typeof nickRaw === "string" && nickRaw.trim() ? nickRaw.trim() : undefined;
  const vipLevel =
    p && typeof p === "object" ? numFromWire(p.vipLevel) : undefined;
  const avatarRaw =
    p && typeof p === "object"
      ? (p as { avatarID?: unknown }).avatarID
      : undefined;
  const avatarNum = numFromWire(avatarRaw);
  const avatarId =
    avatarNum !== undefined && avatarNum >= 1
      ? Math.floor(avatarNum)
      : undefined;
  const cellRaw =
    p && typeof p === "object"
      ? (p as { cellPhone?: unknown }).cellPhone
      : undefined;
  const cellPhone =
    typeof cellRaw === "string" && cellRaw.trim() ? cellRaw.trim() : undefined;
  const walletRaw =
    p && typeof p === "object"
      ? (p as { walletType?: unknown }).walletType
      : undefined;
  const lobbyWalletType = lobbyWalletTypeFromWire(walletRaw);
  const vipBet = numFromWire(
    p && typeof p === "object"
      ? (p as { vipCurrentLevelBetExp?: unknown }).vipCurrentLevelBetExp
      : undefined,
  );
  const vipBetReq = numFromWire(
    p && typeof p === "object"
      ? (p as { vipCurrentLevelBetExpRequired?: unknown })
          .vipCurrentLevelBetExpRequired
      : undefined,
  );
  const phoneFromPlayer = (p as { phone?: unknown } | null)?.phone;
  const phonePlayer =
    typeof phoneFromPlayer === "string" && phoneFromPlayer.trim()
      ? phoneFromPlayer.trim()
      : undefined;
  const phoneRoot =
    typeof decoded.phone === "string" && decoded.phone.trim()
      ? decoded.phone.trim()
      : undefined;
  const phone = phoneRoot ?? cellPhone ?? phonePlayer;
  const email =
    typeof decoded.email === "string" && decoded.email.trim()
      ? decoded.email.trim()
      : undefined;
  if (
    !id &&
    !displayName &&
    vipLevel === undefined &&
    !phone &&
    !email &&
    avatarId === undefined &&
    lobbyWalletType === undefined &&
    vipBet === undefined &&
    vipBetReq === undefined
  )
    return null;
  const out: Partial<User> = {};
  if (id) out.id = id;
  if (displayName) out.displayName = displayName;
  if (vipLevel !== undefined) out.vipLevel = Math.floor(vipLevel);
  if (avatarId !== undefined) out.avatarId = avatarId;
  if (lobbyWalletType !== undefined) out.lobbyWalletType = lobbyWalletType;
  if (vipBet !== undefined) out.vipCurrentLevelBetExp = Math.floor(vipBet);
  if (vipBetReq !== undefined)
    out.vipCurrentLevelBetExpRequired = Math.floor(vipBetReq);
  if (phone) out.phone = phone;
  if (email) out.email = email;
  return out;
}

function lobbyDecodedCurrencyToUserPatch(
  decoded: LobbyGetDecoded,
): Partial<User> | null {
  const raw = decoded.currency;
  if (raw === undefined || raw === null || String(raw) === "") return null;
  return { currency: String(raw) };
}

/** 合併 playerInfo、email/phone、幣值與雙錢包餘額，供 LOBBY_GET 成功後一次 mergeUser。 */
export function lobbyDecodedToUserPatch(
  decoded: LobbyGetDecoded,
): Partial<User> {
  return {
    ...(lobbyDecodedPlayerToUserPatch(decoded) ?? {}),
    ...(lobbyDecodedBagsToUserBalancePatch(decoded) ?? {}),
    ...(lobbyDecodedCurrencyToUserPatch(decoded) ?? {}),
  };
}
