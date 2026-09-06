import { landingCatalog } from './landings/catalog.ts'

export function Landings() {
  return (
    <ul className="choices">
      {landingCatalog.map((landing) => (
        <li key={landing.slug}>
          <a
            className="choice"
            href={`/${landing.slug}`}
            aria-label={landing.title}
          >
            <span className="choice-headline">{landing.title}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12h15M13 6l6 6-6 6" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
