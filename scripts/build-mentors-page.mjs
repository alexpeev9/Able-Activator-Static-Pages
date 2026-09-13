import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const sourceHtml = String.raw`C:\Users\Alex\Downloads\pages\team-members\Our Speakers and Mentors - ABLE Activator.html`;
const landingPath = path.join(root, "public/pages/landing/landing-1/index.html");
const outPath = path.join(
  root,
  "public/pages/mentors-and-speakers/mentors-and-speakers-1/index.html",
);

const THUMB_BASE = "https://activator.bg/wp-content/uploads/elementor/thumbs/";

const decode = (value) =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#1055;&#1088;&#1086;&#1075;&#1088;&#1072;&#1084;&#1072;/g, "Програма");

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const extractMembers = (html) => {
  const blocks = html.split('<div class="lae-team-member-wrapper">').slice(1);
  return blocks.map((block) => {
    const img = block.match(/src="\.\/Our Speakers and Mentors - ABLE Activator_files\/([^"]+)"/);
    const name = block.match(/<h3 class="lae-title">([\s\S]*?)<\/h3>/);
    const position = block.match(
      /<div class="lae-team-member-position">\s*([\s\S]*?)\s*<\/div>/,
    );
    const linkedin = block.match(
      /<a class="lae-linkedin" href="([^"]+)"/,
    );
    const profile = block.match(
      /<a class="lae-title-link"[^>]*href="([^"]+)"/,
    );
    const filename = img ? img[1] : "";
    const rawPosition = position
      ? decode(position[1].replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
          .replace(/\s+/g, " ")
          .trim()
      : "";

    return {
      name: name ? decode(name[1]).replace(/\s+/g, " ").trim() : "",
      position: rawPosition,
      image: filename ? THUMB_BASE + filename : "",
      linkedin: linkedin ? linkedin[1] : "",
      profile: profile ? profile[1] : "",
    };
  }).filter((member) => member.name && member.image);
};

const landing = fs.readFileSync(landingPath, "utf8").split(/\r?\n/);
const chromeCss = landing.slice(19, 716).join("\n");
const headerHtml = landing.slice(2931, 3354).join("\n");
const footerHtml = landing.slice(4267, 4309).join("\n");
const headerJs = landing.slice(4532, 4629).join("\n");

const source = fs.readFileSync(sourceHtml, "utf8");
const members = extractMembers(source);

const highlights = [
  {
    title: "Proven leaders and industry experts",
    icon: "M6.8 2.4 5.4 3.8 7.5 5.9 8.9 4.5ZM25.2 2.4 23.1 4.5 24.5 5.9 26.6 3.8ZM16 3c-4.1.5-7.3 3.8-7.9 7.8C7.7 14.1 9 17 11.3 18.9 12.2 19.8 12.8 20.9 13 22v6h2.3a2 2 0 0 0 3.4 0H21v-4h.1v-1.2c0-1.5.8-2.9 2-4.1C24.8 17 26 14.7 26 12c0-5-4.1-9-10-9zm0 2c3.9 0 7 3.1 7 7 0 2.1-1 3.9-2.3 5.3A8 8 0 0 0 18.3 22h-4.4c-.2-1.7-1-3.4-2.3-4.6-1.8-1.5-2.8-3.8-2.5-6.3C9.5 8 12.1 5.4 15.2 5.1 15.5 5 15.7 5 16 5ZM2 12v2h3v-2zm25 0v2h3v-2zM7.5 20.1 5.4 22.2 6.8 23.6 8.9 21.5zm17 0-1.4 1.4 2.1 2.1 1.4-1.4zM14 24h4v2h-4z",
  },
  {
    title: "Practical workshops and interactive panels",
    icon: "M16 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-4 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM9 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7 0c-1.3 0-2.3.5-3 1.3S12 13 12 14c0 .9.3 1.9.9 2.6A9 9 0 0 0 10.9 18C10.8 17.2 10.6 16.6 10.1 16.1 9.5 15.4 8.6 15 7.5 15S5.5 15.4 4.9 16.1 4 17.7 4 18.5c0 .8.3 1.6.8 2.2A5 5 0 0 0 2 25h2c0-1.6 1.5-3 3.5-3 .3 0 .5 0 .8.1A8 8 0 0 0 8 24h2c0-3.3 2.7-6 6-6s6 2.7 6 6h2c0-.7-.2-1.3-.4-1.9.3-.1.6-.1.9-.1C26.5 22 28 23.4 28 25h2c0-1.9-1.2-3.4-2.8-4.3.5-.6.8-1.4.8-2.2 0-.8-.3-1.8-.9-2.4S25.6 15 24.5 15s-2 .4-2.6 1.1c-.5.5-.6 1.2-.7 1.9A9 9 0 0 0 19.1 16.6C19.7 15.9 20 14.9 20 14c0-1-.3-2-1-2.7S17.3 10 16 10zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  },
  {
    title: "Open Q&A sessions — get to know our country's best",
    icon: "M21 4c-3.6 0-6.5 2.7-6.9 6.2L6 21.6 5.5 22.3 6.1 22.9 6.9 23.7 4.3 26.3 5.7 27.7 8.3 25.1 9.7 26.5 10.4 26 21.8 17.9C25.3 17.5 28 14.6 28 11c0-3.9-3.1-7-7-7zm0 2c2.8 0 5 2.2 5 5 0 1-.3 2-.8 2.8l-6.9-7C19 6.3 20 6 21 6zm-4.2 2.3 6.9 6.9C22.9 15.7 22 16 21 16c-2.8 0-5-2.2-5-5 0-1 .3-2 .8-2.7zM14.4 13.2c.7 2.1 2.3 3.7 4.4 4.4L9.9 23.9 8.1 22.1z",
  },
  {
    title: "Tailored advice and know-how",
    icon: "M19.3 7c-.6 0-1.1 0-1.7.2s-1.2.4-1.8.8c-.8-.4-1.5-.8-2.2-.9-1.7-.2-3.4 0-5.7 1.1C5.2 8.6 3.6 9 1.4 9H1v9.6l.6.3 1.8.9 6.6 7.3c.8.7 1.8.9 2.7.8s1.7-.3 2.4-.7c1.5-.9 5.5-3.7 5.5-3.7l.2-.1.1-.1c.5-.5.7-1 .9-1.6l3.8-1.9 2.9-1 .7-.2V9h-1c-2.2 0-3.7-.5-4.9-1s-1.9-1-3.1-1h-.9z",
  },
  {
    title: "Industry-specific knowledge",
    icon: "M4 6v2h22v16H12v2h18v-2h-2V6H4zm4 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm6 1v2h5v-2h-5zm7 0v2h3v-2h-3zM8 11a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 3v2h10v-2H14zM4 18v8h2v-6h3v6h2v-5.3l2.1 1.1a2 2 0 0 0 1.9 0L18.5 19.9 17.5 18.1 14 20 10.9 18.3A3 3 0 0 0 9.5 18H4z",
  },
  {
    title: "Strong personal connections",
    icon: "M11 3v4h2V3zm4 1v3h2V4zM4.9 8 5 9.1l1.8 17.2A2.8 2.8 0 0 0 9.8 29h9.4a2.8 2.8 0 0 0 2.8-2.7L22.7 22H25a3 3 0 0 0 3-3v-3a3 3 0 0 0-3-3h-1.4L24.1 9 24.1 8H7.1zM7.1 10h14.8l-1.7 16.1a.8.8 0 0 1-.8.9H9.8a.8.8 0 0 1-.8-.9L7.1 10zm16.3 5H25a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2.2l.6-5z",
  },
];

const memberCards = members
  .map((member) => {
    const name = escapeHtml(member.name);
    const role = escapeHtml(member.position);
    const heading = member.profile
      ? `<a class="person-name" href="${escapeHtml(member.profile)}">${name}</a>`
      : `<h3 class="person-name">${name}</h3>`;
    const linkedin = member.linkedin
      ? `<a class="person-in" href="${escapeHtml(member.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile of ${name}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.9 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4M3.2 9.2h3.4V21H3.2zM9.3 9.2h3.25v1.6h.05c.45-.85 1.56-1.75 3.2-1.75 3.43 0 4.06 2.25 4.06 5.18V21h-3.4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.74 0-2 1.35-2 2.75V21H9.3z"/></svg>
            </a>`
      : "";

    return `        <article class="person">
          <div class="person-media">
            <img src="${escapeHtml(member.image)}" alt="${name}" width="300" height="300" loading="lazy" decoding="async" />
            ${linkedin}
          </div>
          ${heading}
          <p class="person-role">${role}</p>
        </article>`;
  })
  .join("\n");

const highlightCards = highlights
  .map(
    (item) => `        <article class="card highlight">
          <span class="highlight-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="currentColor"><path d="${item.icon}"/></svg>
          </span>
          <h3 class="card-title">${escapeHtml(item.title)}</h3>
        </article>`,
  )
  .join("\n");

const page = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ABLE Activator — Mentors and Speakers</title>
    <meta
      name="description"
      content="All the speakers at ABLE Activator volunteer their knowledge and experience with the idea of improving the business environment in Bulgaria."
    />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&amp;family=Barlow:wght@400;500;600&amp;family=IBM+Plex+Mono:wght@400;500&amp;family=Inter:wght@400;500&amp;display=swap"
      rel="stylesheet"
    />

    <style>
${chromeCss}

      :root {
        --accent-2: #8ec54a;
      }

      /* Hero + facts styles are maintained in the page artifact.
         Re-run only after copying them from mentors-and-speakers-1/index.html. */

      .people {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 28px 18px;
      }
      .person {
        min-width: 0;
      }
      .person-media {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
        background: #141414;
        border: 1px solid var(--line);
      }
      .person-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        filter: grayscale(0.15);
      }
      .person-in {
        position: absolute;
        right: 10px;
        bottom: 10px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #0a66c2;
        color: #fff;
        display: grid;
        place-items: center;
      }
      .person-in:hover {
        color: #fff;
        background: #084d92;
      }
      .person-in svg {
        width: 15px;
        height: 15px;
        fill: currentColor;
      }
      .person-name {
        display: block;
        margin: 14px 0 6px;
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 600;
        line-height: 1.25;
        color: var(--text-bright);
      }
      a.person-name:hover {
        color: var(--accent);
      }
      .person-role {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.45;
        color: var(--text-dim);
      }

      .site-footer {
        position: relative;
        z-index: 1;
        border-top: 1px solid var(--line-soft);
        background: var(--bg-footer);
      }
      .site-footer-in {
        max-width: var(--container);
        margin: 0 auto;
        padding: 24px var(--slab-pad-x);
        display: flex;
        flex-wrap: wrap;
        gap: 8px 20px;
        align-items: center;
        justify-content: space-between;
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #5f686c;
      }
      .foot-grid {
        max-width: var(--container);
        margin: 0 auto;
        padding: clamp(30px, 4vw, 46px) var(--slab-pad-x) 0;
        display: flex;
        flex-wrap: wrap;
        gap: 18px 28px;
        align-items: center;
        justify-content: space-between;
      }
      .foot-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 22px;
      }
      .foot-links a {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #8d979b;
      }
      .foot-links a:hover {
        color: var(--accent);
      }
      .foot-social {
        display: flex;
        gap: 10px;
      }
      .foot-social a {
        width: 34px;
        height: 34px;
        border: 1px solid var(--line-strong);
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #a8b1b5;
      }
      .foot-social a:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
      .foot-social svg {
        width: 15px;
        height: 15px;
        display: block;
        fill: currentColor;
      }

      @media (max-width: 980px) {
        .people {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (max-width: 820px) {
        .card-grid--highlights {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 720px) {
        .people {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 860px) {
        .foot-grid {
          flex-direction: column;
          justify-content: center;
          gap: 18px;
        }
        .foot-links {
          justify-content: center;
        }
        .site-footer-in {
          justify-content: center;
          text-align: center;
        }
      }
      @media (max-width: 520px) {
        .card-grid--highlights,
        .people {
          grid-template-columns: minmax(0, 1fr);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }
        * {
          animation: none !important;
        }
        .page-bg video {
          display: none;
        }
      }
    </style>
  </head>
  <body>
${headerHtml}

    <main>
      <section class="slab" id="people">
        <div class="container">
          <div class="eyebrow">The roster</div>
          <h2 class="sec-title">Faces of the program</h2>
          <p class="sec-lede">People who have volunteered their time with ABLE Activator.</p>
          <div class="people">
${memberCards}
          </div>
        </div>
      </section>
    </main>

${footerHtml}

    <script>
      document.addEventListener("DOMContentLoaded", function () {
${headerJs}
      });
    </script>
  </body>
</html>
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, page);
console.log(`Wrote ${members.length} members to ${outPath}`);
