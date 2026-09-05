import { useEffect, useState } from 'react'

type Landing = {
  slug: string
  label: string
  title: string
  headline: string
  note: string
}

export function Landings() {
  const [landings, setLandings] = useState<Landing[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/landings/landings.json')
      .then((res) => res.json())
      .then(setLandings)
      .catch(() => setFailed(true))
  }, [])

  if (failed) {
    return (
      <p className="notice">
        The pages didn’t load. Refresh to try again.
      </p>
    )
  }

  return (
    <ul className="choices">
      {landings.map((landing) => (
        <li key={landing.slug}>
          <a className="choice" href={`/${landing.slug}`}>
            <span className="choice-label">{landing.label}</span>
            <span className="choice-headline">{landing.headline}</span>
            <span className="choice-note">{landing.note}</span>
            <span className="choice-action">
              Read {landing.title.toLowerCase()}
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

