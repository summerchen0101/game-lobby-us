import './ShopPage.css'

type Pack = { id: string; gcLabel: string; bonus: string; price: string }

const PACKS: Pack[] = [
  { id: '1', gcLabel: '600K', bonus: '+FREE SC 2', price: '$1.99' },
  { id: '2', gcLabel: '1.5M', bonus: '+FREE SC 5', price: '$4.99' },
  { id: '3', gcLabel: '3M', bonus: '+FREE SC 8', price: '$9.99' },
  { id: '4', gcLabel: '6M', bonus: '+FREE SC 15', price: '$19.99' },
  { id: '5', gcLabel: '12M', bonus: '+FREE SC 30', price: '$39.99' },
  { id: '6', gcLabel: '25M', bonus: '+FREE SC 60', price: '$79.99' },
]

export function ShopPage() {
  return (
    <div className="shop-page page-container">
      <h1 className="shop-page__title">STORE</h1>
      <p className="shop-page__subtitle">CHOOSE YOUR COINS PACKAGE</p>
      <ul className="shop-page__grid">
        {PACKS.map((p) => (
          <li key={p.id} className="shop-page__card">
            <div className="shop-page__card-top">
              <span className="shop-page__gc">{p.gcLabel}</span>
              <span className="shop-page__coin" aria-hidden>
                GC
              </span>
            </div>
            <div className="shop-page__card-art" aria-hidden />
            <p className="shop-page__bonus">{p.bonus}</p>
            <button type="button" className="shop-page__price">
              {p.price}
            </button>
          </li>
        ))}
      </ul>
      <p className="shop-page__hint">僅介面示意，實際購買流程請接後端金流。</p>
    </div>
  )
}
