import './EventsPage.css'

export function EventsPage() {
  return (
    <section className="events-page page-container">
      <h1 className="events-page__title">PROMO</h1>
      <p className="events-page__lede">New offers and missions will be posted here.</p>
      <div className="events-page__card">
        <p className="events-page__empty">No active promos right now. Check back soon.</p>
      </div>
    </section>
  )
}
