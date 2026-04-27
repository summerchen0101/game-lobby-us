export type Pack = {
  id: string;
  /** Shown after GC chip, e.g. 600K, 12M */
  gcLabel: string;
  bonusSc: number;
  price: string;
  /** 1..5 → icon_coinPileN.png */
  coinPile: 1 | 2 | 3 | 4 | 5;
};
