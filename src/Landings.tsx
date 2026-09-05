import { useEffect, useState } from 'react'

type Landing = {
  slug: string
  title: string
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
