import { Coins, Sparkles } from 'lucide-react'
import './ShopPage.css'
import '../lobby/SessionPageDecor.css'

type Pack = { id: string; gcLabel: string; bonus: string; price: string }

const PACKS: Pack[] = [
  { id: '1', gcLabel: '600K', bonus: '+FREE SC 2', price: '$1.99' },
  { id: '2', gcLabel: '1.5M', bonus: '+FREE SC 5', price: '$4.99' },
  { id: '3', gcLabel: '3M', bonus: '+FREE SC 8', price: '$9.99' },
  { id: '4', gcLabel: '6M', bonus: '+FREE SC 15', price: '$19.99' },
  { id: '5', gcLabel: '12M', bonus: '+FREE SC 30', price: '$39.99' },
  { id: '6', gcLabel: '25M', bonus: '+FREE SC 60', price: '$79.99' },
  { id: '7', gcLabel: '50M', bonus: '+FREE SC 100', price: '$89.99' },
  { id: '8', gcLabel: '100M', bonus: '+FREE SC 200', price: '$99.99' },
  { id: '9', gcLabel: '200M', bonus: '+FREE SC 500', price: '$199.99' },
]

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
                  <Coins className="shop-page__gc-icon" size={18} strokeWidth={2.25} aria-hidden />
                  <span className="shop-page__gc">{p.gcLabel}</span>
                </span>
                <span className="shop-page__coin" aria-hidden>
                  GC
                </span>
              </div>
              <div className="shop-page__card-art" aria-hidden>
                <Coins className="shop-page__card-art-icon shop-page__card-art-icon--a" size={40} strokeWidth={1.5} />
                <Coins className="shop-page__card-art-icon shop-page__card-art-icon--b" size={28} strokeWidth={1.5} />
              </div>
              <p className="shop-page__bonus">
                <Sparkles className="shop-page__bonus-icon" size={14} strokeWidth={2.25} aria-hidden />
                {p.bonus}
              </p>
              <button type="button" className="shop-page__price">
                {p.price}
              </button>
            </li>
          ))}
        </ul>
        <p className="shop-page__hint">
          UI preview only—wire real purchases to your payment backend.
        </p>
      </div>
    </div>
  )
}
