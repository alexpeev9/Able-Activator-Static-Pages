import sectionData from './pages.json'

type PageEntry = { slug: string; title: string }
type Section = { id: string; title: string; blurb?: string; pages: PageEntry[] }

const sections = sectionData as Section[]

export function Sections() {
  return (
    <div className="sections">
      {sections.map((section) => (
        <section className="section" key={section.id} aria-labelledby={`${section.id}-title`}>
          <div className="section-head">
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            {section.blurb ? <p className="section-blurb">{section.blurb}</p> : null}
          </div>

          {section.pages.length > 0 ? (
            <ul className="choices">
              {section.pages.map((page) => (
                <li key={page.slug}>
                  <a
                    className="choice"
                    href={`/${section.id}/${page.slug}`}
                    aria-label={page.title}
                  >
                    <span className="choice-headline">{page.title}</span>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 12h15M13 6l6 6-6 6" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="section-empty">Coming soon</p>
          )}
        </section>
      ))}
    </div>
  )
}
