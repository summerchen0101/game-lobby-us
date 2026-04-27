import type { ProviderLogo } from './landingContent'
import './ProviderMarquee.css'

type Props = {
  title: string
  rowA: ProviderLogo[]
  rowB: ProviderLogo[]
}

function Track({ items, direction }: { items: ProviderLogo[]; direction: 'left' | 'right' }) {
  const doubled = [...items, ...items]
  return (
    <div className={`provider-marquee__viewport provider-marquee__viewport--${direction}`}>
      <div className={`provider-marquee__track provider-marquee__track--${direction}`}>
        {doubled.map((p, i) => (
          <div key={`${p.alt}-${i}`} className="provider-marquee__item">
            <img src={p.src} alt={p.alt} loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ProviderMarquee({ title, rowA, rowB }: Props) {
  return (
    <section className="provider-marquee" aria-labelledby="provider-marquee-title">
      <h2 id="provider-marquee-title" className="provider-marquee__title">
        {title}
      </h2>
      <Track items={rowA} direction="left" />
      <Track items={rowB} direction="right" />
    </section>
  )
}
