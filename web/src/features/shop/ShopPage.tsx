import "./ShopPage.css";
import "../lobby/SessionPageDecor.css";

const PANEL = "/imgs/panel/Panel_Shop";

type Pack = {
  id: string;
  /** Shown after GC chip, e.g. 600K, 12M */
  gcLabel: string;
  bonusSc: number;
  price: string;
  /** 1..5 → icon_coinPileN.png */
  coinPile: 1 | 2 | 3 | 4 | 5;
};

const PACKS: Pack[] = [
  { id: "1", gcLabel: "600K", bonusSc: 2, price: "$1.99", coinPile: 1 },
  { id: "2", gcLabel: "1500K", bonusSc: 5, price: "$4.99", coinPile: 1 },
  { id: "3", gcLabel: "3M", bonusSc: 10, price: "$9.99", coinPile: 2 },
  { id: "4", gcLabel: "6M", bonusSc: 20, price: "$19.99", coinPile: 2 },
  { id: "5", gcLabel: "12M", bonusSc: 40, price: "$39.99", coinPile: 3 },
  { id: "6", gcLabel: "15M", bonusSc: 50, price: "$49.99", coinPile: 3 },
  { id: "7", gcLabel: "18M", bonusSc: 60, price: "$59.99", coinPile: 4 },
  { id: "8", gcLabel: "24M", bonusSc: 80, price: "$79.99", coinPile: 4 },
  { id: "9", gcLabel: "30M", bonusSc: 100, price: "$99.99", coinPile: 5 },
];

function coinPileSrc(n: 1 | 2 | 3 | 4 | 5) {
  return `${PANEL}/icon_coinPile${n}.png`;
}

export function ShopPage() {
  return (
    <div className="shop-page page-container session-page session-page--pattern">
      <div className="shop-page__inner">
        <h1 className="shop-page__title">STORE</h1>
        <p className="shop-page__subtitle">CHOOSE YOUR COINS PACKAGE</p>
        <ul className="shop-page__grid">
          {PACKS.map((p) => (
            <li key={p.id} className="shop-page__card">
              <div className="shop-page__card-top">
                <span className="shop-page__gc-row">
                  <span className="shop-page__chip shop-page__chip--gc">
                    GC
                  </span>
                  <span className="shop-page__gc-amount">{p.gcLabel}</span>
                </span>
              </div>
              <div className="shop-page__card-art" data-pile={p.coinPile}>
                <img
                  src={coinPileSrc(p.coinPile)}
                  alt=""
                  className="shop-page__card-art-img"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p
                className="shop-page__bonus"
                aria-label={`Plus free SC ${p.bonusSc}`}>
                <span className="shop-page__bonus-free">+FREE</span>
                <span className="shop-page__chip shop-page__chip--sc">SC</span>
                <span className="shop-page__bonus-amt">{p.bonusSc}</span>
              </p>
              <button type="button" className="shop-page__price-btn">
                {p.price}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
