import { MOCK_GAMES } from '../../lib/mockGames'
import './LobbyPage.css'

export function LobbyPage() {
  return (
    <div className="lobby">
      <section className="lobby-hero" aria-labelledby="lobby-hero-title">
        <h1 id="lobby-hero-title" className="lobby-hero__title">
          歡迎回來
        </h1>
        <p className="lobby-hero__lede">
          從下方選取遊戲。版面會依螢幕寬度自動調整，觸控目標亦符合最小可點擊區域。
        </p>
        <div className="lobby-hero__actions">
          <button type="button" className="btn btn--primary">
            主要動作
          </button>
          <button type="button" className="btn btn--ghost">
            次要
          </button>
        </div>
      </section>

      <section className="lobby-games" aria-labelledby="lobby-games-title">
        <h2 id="lobby-games-title" className="lobby-games__title">
          遊戲
        </h2>
        <ul className="game-grid" role="list">
          {MOCK_GAMES.map((g) => (
            <li key={g.id}>
              <button type="button" className="game-card">
                <span className="game-card__title">{g.title}</span>
                {g.subtitle ? (
                  <span className="game-card__sub">{g.subtitle}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
