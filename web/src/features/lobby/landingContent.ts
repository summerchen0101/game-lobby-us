import type { Game } from "../../lib/api/types";
import type { ActiveWallet } from "../../wallet/walletContext";

const G = "https://static.crowncoinscasino.com/production/assets/games";

/** 直向大廳 Panel 背景（public） */
export const PANEL_VERTICAL_LOBBY_BG_BASE = "/images/lobby/bg";

export const PANEL_BG_UNLOGIN = `${PANEL_VERTICAL_LOBBY_BG_BASE}/tmp_unLoginBg.png`;
export const PANEL_BG_GC = `${PANEL_VERTICAL_LOBBY_BG_BASE}/tmp_GCbg.png`;
export const PANEL_BG_SC = `${PANEL_VERTICAL_LOBBY_BG_BASE}/tmp_SCbg.png`;
export const PANEL_PATTERN_BG = `${PANEL_VERTICAL_LOBBY_BG_BASE}/Pattern_bg.png`;

const DEFAULT_UNITY_DEMO_URL =
  "https://unityweb-alpha.ffglobaltech.com/0000/Single1/index.html";

export function unityDemoGameUrl(): string {
  return import.meta.env.VITE_UNITY_DEMO_URL?.trim() || DEFAULT_UNITY_DEMO_URL;
}

/** 本地遊戲卡圖（放於 public/images/games/entry）；檔名：entry_slot{N}_L.png */
export const GAME_ENTRY_BASE = "/images/games/entry";

/** 與 public/images/games/entry 內檔案對齊，依 slot 編號數字排序（不含 entry_slotLoading_L 等）。 */
const GAME_ENTRY_SLOT_IDS: number[] = [
  1, 2, 4, 8, 15, 16, 18, 20, 21, 35, 41, 42, 43, 45, 46, 47, 50, 51, 52, 55,
  56, 57, 58, 59, 60, 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 74, 75, 76, 77,
  78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96,
  97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112,
  113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127,
  128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 141, 142, 143,
  144, 145, 238, 249,
];

export const GAME_ENTRY_CARD_IMAGES: string[] = GAME_ENTRY_SLOT_IDS.map(
  (n) => `${GAME_ENTRY_BASE}/entry_slot${n}_L.png`,
);

/**
 * 大廳／訪客卡片縮圖：有設定本地清單時優先使用，否則用 API 或靜態 fallback。
 */
export function gameEntryThumbnail(
  index: number,
  fallback?: string,
): string | undefined {
  if (GAME_ENTRY_CARD_IMAGES.length === 0) return fallback;
  return GAME_ENTRY_CARD_IMAGES[index % GAME_ENTRY_CARD_IMAGES.length];
}

/**
 * 「Our Top Games」內用於 Unity WebGL iframe 試玩之遊戲卡（與訪客首列 Olympia 為同一筆體感）。
 * 已登入時會再插入 API 回傳列表前方，方便同區塊測試。
 */
export const UNITY_DEMO_LOBBY_GAME: Game = {
  id: "ffgt-unity-webgl-demo",
  title: "Olympia",
  subtitle: "WebGL (Alpha)",
  launchUrl: unityDemoGameUrl(),
  openInNewWindow: false,
  thumbnailUrl: `${G}/crownslots/olympics-alternate-all-KXkAo.webp`,
};

/** 未登入首頁 — 第一列（TOP FREE-TO-PLAY） */
export const GUEST_TOP_GAMES: Game[] = [
  { ...UNITY_DEMO_LOBBY_GAME },
  {
    id: "guest-top-2",
    title: "Ember Rush",
    launchUrl: "",
    thumbnailUrl: `${G}/booming/68b705d3800528273b1057c8-cutThumbnailShortHr-rBBMl.webp`,
  },
  {
    id: "guest-top-3",
    title: "Treasure Blast",
    launchUrl: "",
    thumbnailUrl: `${G}/playson-infin/pls_coin_strike_xxl-cutThumbnailHr-bUafU.webp`,
  },
  {
    id: "guest-top-4",
    title: "Lucky Spin",
    launchUrl: "",
    thumbnailUrl: `${G}/koala/kg_5009-cutThumbnailShortHr-FAQcd.webp`,
  },
  {
    id: "guest-top-5",
    title: "Crown Jewels",
    launchUrl: "",
    thumbnailUrl: `${G}/playson-infin/pls_coin_strike_xxl-cutThumbnailHr-bUafU.webp`,
  },
  {
    id: "guest-top-6",
    title: "Neon Reels",
    launchUrl: "",
    thumbnailUrl: `${G}/koala/kg_5009-cutThumbnailShortHr-FAQcd.webp`,
  },
  {
    id: "guest-top-7",
    title: "Jungle Gold",
    launchUrl: "",
    thumbnailUrl: `${G}/booming/68b705d3800528273b1057c8-cutThumbnailShortHr-rBBMl.webp`,
  },
  {
    id: "guest-top-8",
    title: "Midas Riches",
    launchUrl: "",
    thumbnailUrl: `${G}/crownslots/olympics-alternate-all-KXkAo.webp`,
  },
  {
    id: "guest-top-9",
    title: "Star Fortune",
    launchUrl: "",
    thumbnailUrl: `${G}/playson-infin/pls_coin_strike_xxl-cutThumbnailHr-bUafU.webp`,
  },
];

/** 未登入首頁 — 第二列（DEMO here） */
export const GUEST_DEMO_ROW_GAMES: Game[] = [
  {
    id: "guest-demo-1",
    title: "Steam Spin",
    launchUrl: "",
    thumbnailUrl: `${G}/penguin-king/103094-cutThumbnailHr-mQKpF.webp`,
  },
  {
    id: "guest-demo-2",
    title: "Leprechaun Penny",
    launchUrl: "",
    thumbnailUrl: `${G}/onseo/1032-cutThumbnailShortHr-hmaJN.webp`,
  },
  {
    id: "guest-demo-3",
    title: "777 Bonanza",
    launchUrl: "",
    thumbnailUrl: `${G}/3-oaks-via-infin/oa_4_wolf_drums-alternate-all-ZKaxJ.webp`,
  },
];

/** 向後相容：未登入合併列表（僅供需單一清單之邏輯使用） */
export const GUEST_DEMO_GAMES: Game[] = [
  ...GUEST_TOP_GAMES,
  ...GUEST_DEMO_ROW_GAMES,
];

/** Static marketing assets (URLs from Crown sample; replace for production). */
export const DEFAULT_HERO_IMAGE =
  "https://crowncoinscasino.com/assets/direct_reg_carousel_1-DSLgz1KV.webp";

/** 舊版單一 hero；未設 env 時仍用外部預設（非直向 Panel 資產）。 */
export function getLobbyHeroImage(): string {
  const u = import.meta.env.VITE_LOBBY_HERO_IMAGE?.trim();
  return u || DEFAULT_HERO_IMAGE;
}

/**
 * 已登入大廳 banner：依目前選中錢包 GC/SC 切圖；`VITE_LOBBY_HERO_IMAGE` 若設定則覆寫兩者。
 */
export function getSessionLobbyBannerImage(activeWallet: ActiveWallet): string {
  const u = import.meta.env.VITE_LOBBY_HERO_IMAGE?.trim();
  if (u) return u;
  return activeWallet === "SC" ? PANEL_BG_SC : PANEL_BG_GC;
}

/** 大廳 banner 上 Jackpot 1–3 示範額度（可改接 API） */
export const LOBBY_DEMO_JACKPOT_AMOUNTS: Readonly<[number, number, number]> = [
  6_314_803, 507_900, 62_753,
];

/** 訪客 hero：預設未登入 Panel 圖；`VITE_GUEST_HERO_IMAGE` 可覆寫。 */
export function getGuestHeroImage(): string {
  const u = import.meta.env.VITE_GUEST_HERO_IMAGE?.trim();
  return u || PANEL_BG_UNLOGIN;
}

export const FLOATING_CTA_IMAGE =
  "https://crowncoinscasino.com/assets/landing-present-float-FhIAs5Kv.png";

export type BenefitItem = {
  alt: string;
  label: string;
  image: string;
  htmlLabel?: boolean;
};

export const BENEFITS: BenefitItem[] = [
  {
    alt: "Safe and Secure",
    label: "Safe and Secure",
    image: "https://crowncoinscasino.com/assets/benefit-lock-fFmUkmZG.png",
  },
  {
    alt: "Easy and Fast Redemption",
    label: "Easy and Fast Redemption",
    image: "https://crowncoinscasino.com/assets/benefit-cash-DGxeLdYk.png",
  },
  {
    alt: "Lowest Play Required",
    label: "<b>Lowest</b> Play Required",
    image: "https://crowncoinscasino.com/assets/benefit-x1-PUzEn1IQ.png",
    htmlLabel: true,
  },
  {
    alt: "Top VIP Experience",
    label: "Top VIP Experience",
    image: "https://crowncoinscasino.com/assets/benefit-medals-Dn7jJhzB.png",
  },
  {
    alt: "24/7 Customer Support",
    label: "24/7 Customer Support",
    image:
      "https://crowncoinscasino.com/assets/benefit-headphones-BwSGQSnP.png",
  },
  {
    alt: "No Purchase Necessary",
    label: "No Purchase Necessary",
    image: "https://crowncoinscasino.com/assets/benefit-slot-iD2nh_zz.png",
  },
];

const P = "https://static.crowncoinscasino.com/production/assets/provider";

export type ProviderLogo = { alt: string; src: string };

/** First marquee row (LTR scroll). */
export const PROVIDERS_ROW_A: ProviderLogo[] = [
  { alt: "Spinomenal", src: `${P}/768-btkJK.webp` },
  { alt: "Sneaky Slots", src: `${P}/943-qCmIN.webp` },
  { alt: "Hacksaw RGS", src: `${P}/697-pWqaw.webp` },
  { alt: "Novomatic", src: `${P}/1010-teHgU.webp` },
  { alt: "Playtech", src: `${P}/595-BRpfK.webp` },
  { alt: "Red Tiger", src: `${P}/804-BAZkX.webp` },
  { alt: "Booming", src: `${P}/874-uqyHO.webp` },
  { alt: "Relax Gaming", src: `${P}/562-mwHye.webp` },
  { alt: "Galaxys", src: `${P}/876-wMnxg.webp` },
  { alt: "Evolution", src: `${P}/802-peIYA.webp` },
  { alt: "Yggdrasil Gaming", src: `${P}/1077-khXUr.webp` },
  { alt: "Micro Gaming", src: `${P}/661-swFlL.webp` },
];

/** Second marquee row (RTL scroll). */
export const PROVIDERS_ROW_B: ProviderLogo[] = [
  { alt: "NetEnt", src: `${P}/805-QTerx.webp` },
  { alt: "Koala", src: `${P}/807-oCIwL.webp` },
  { alt: "Reel Riot", src: `${P}/702-cACoa.webp` },
  { alt: "Big Time Gaming", src: `${P}/806-gwMAi.webp` },
  { alt: "Crownslots", src: `${P}/801-nkksY.webp` },
  { alt: "Hacksaw", src: `${P}/696-gUGyp.webp` },
  { alt: "RubyPlay", src: `${P}/74-KrsyP.webp` },
  { alt: "Penguin King", src: `${P}/1011-Sqpik.webp` },
  { alt: "Spinomenal", src: `${P}/768-btkJK.webp` },
  { alt: "Playtech", src: `${P}/595-BRpfK.webp` },
  { alt: "Novomatic", src: `${P}/1010-teHgU.webp` },
  { alt: "Relax Gaming", src: `${P}/562-mwHye.webp` },
];
