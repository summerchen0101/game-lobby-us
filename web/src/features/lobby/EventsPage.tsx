import './EventsPage.css'

export function EventsPage() {
  return (
    <section className="events-page page-container">
      <h1 className="events-page__title">活動</h1>
      <p className="events-page__lede">最新優惠與任務將於此公布。</p>
      <div className="events-page__card">
        <p className="events-page__empty">目前尚無進行中的活動，請稍後再來查看。</p>
      </div>
    </section>
  )
}
