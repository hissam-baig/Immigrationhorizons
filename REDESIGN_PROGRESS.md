# Immigration Horizons — Redesign Progress

_A brief for review. Last updated end of Phase 5B._

---

## The one thing to know first

There are **two apps in this repo**.

| | Location | Stack | State |
|---|---|---|---|
| **Old site** | repo root | Express + EJS + MongoDB | Live in production, untouched |
| **New site** | `web/` | Next.js 16 + React 19 + TypeScript + Tailwind v4 | Under construction, not deployed |

**To view the new site:** `cd web && npm run dev`
`npm run dev` at the **root** runs the OLD site — this is the thing that trips people up.

Nothing is deployed and nothing is committed yet. The old site keeps serving real traffic until we cut over at the end.

---

## What's done (Phases 1–5B)

| Phase | What | Status |
|---|---|---|
| 1 | Audit of the existing project | ✅ |
| 2 | Design system (colour, type, components) | ✅ |
| 3 | Navigation + layout (header, mega menu, footer) | ✅ |
| 4 | Homepage | ✅ |
| 4B/4C | Homepage rebuilt to content spec + optimization pass | ✅ |
| 5A | `/services` index + definitive EB-2 NIW page | ✅ |
| 5B | EB-1A, EB-1B, EB-1C, O-1 pages | ✅ |
| 5C | 5 support-service pages | ⬜ next |
| 6 | Resources + Blog | ⬜ |
| 7 | SEO pass (sitemap, canonicals, schema audit) | ⬜ |
| 8 | Final optimization | ⬜ |

---

## Pages you can look at now (http://localhost:3100)

| URL | What it is | Words |
|---|---|---|
| `/` | Homepage — 12 sections | ~3,400 |
| `/services` | Services index (routing hub) | ~1,350 |
| `/services/eb2-niw` | Flagship EB-2 NIW resource | 4,702 |
| `/services/eb1a` | EB-1A Extraordinary Ability | 2,907 |
| `/services/eb1b` | EB-1B Professor/Researcher | 2,573 |
| `/services/eb1c` | EB-1C Manager/Executive | 2,616 |
| `/services/o1-visa` | O-1 Visa | 2,766 |
| `/styleguide` | Design-system reference (noindex) | — |
| any bad URL | Custom 404 that recovers the visitor | — |

---

## Key decisions made (these shape everything)

1. **Stack = full Next.js rebuild** — your call in Phase 1. The brief specified Next.js; the old site was Express/EJS.
2. **Navy + gold, light-only.** Dark mode removed on purpose — it wrecked the trust brand. Gold is constrained by contrast rules (it fails AA as text, so it's used for fills/accents only).
3. **Fonts:** Source Serif 4 (headings) + Inter (body). Self-hosted, zero external requests. _You approved these._
4. **No animation library.** Scroll reveals are pure CSS. This keeps the JS payload low (~204 KB gzipped, mostly the React/Next framework floor).
5. **Information architecture corrected.** The old site had a flat, confused service list. Now split into:
   - **Case categories** (what you file under): EB-2 NIW, EB-1A, EB-1B, EB-1C, O-1
   - **Support services** (single deliverables): RFE responses, recommendation letters, expert opinion letters, business plans, evidence packaging
   - EB-1B/EB-1C had no pages before; O-1 was mispositioned. Fixed.

---

## Content approach — please read this part

Your content strategy doc asked for some things I **cannot invent**, and I flagged each one:

- **No processing times or costs anywhere.** They change constantly and would mislead. Pages point to the official USCIS tools instead. This is framed as a trust signal, not an omission.
- **No approval rates or guarantees.** There's even a homepage FAQ that says we *can't* guarantee approval — deliberate, it's what Google's EEAT rewards.
- **No invented case studies.** "Outcomes" are built only from your 8 real Fiverr testimonials, each with a verify link.
- **No stock photos of people.** Would undercut the "verifiable, not just claimed" positioning. Illustrations are inline SVG (the animated globe on the homepage).
- **Positioning is enforced throughout:** "consultants / specialists / petition preparation" — never "attorneys / lawyers / legal advice." The not-a-law-firm disclaimer appears on every relevant page and inside the structured data.

**All service-page content is regulatory and citeable** — INA sections, CFR, and Matter of Dhanasar — with working links to USCIS / eCFR / DOJ. That's the stable ground where the real SEO value sits.

---

## Quality bar being held (verified in rendered HTML, not assumed)

Every page checked for:
- Single `<h1>`, no heading-level skips
- FAQ schema answers **byte-match** the visible text (Google penalises mismatches)
- Breadcrumb + FAQ + Organization schema present and valid
- Zero forbidden claims (dollar amounts, timeframes, guarantees, attorney self-description)
- Table-of-contents anchors all resolve
- Build passes, lint clean, TypeScript clean, all routes prerender static

---

## Two open items I need from YOU

1. **"Countries served" number** — you said you'd supply a figure. Until then the copy says "Global." One-line change when you send it.
2. **Mission / Vision / Core Values wording** — this is the one place I wrote *positioning copy about your business* rather than facts derived from your existing site. Every service page now inherits that voice. Worth a read before we build more on top of it. It's on the homepage ("Trusted immigration consulting" section).

Optional but valuable: **real photos** of Rahat / the workspace would strengthen the trust sections more than any illustration.

---

## Known items parked for later phases

- **Homepage "Latest Articles"** — deferred to Phase 6 (needs the blog data layer; won't stub with fake posts).
- **`/eb2-niw` vs `/services/eb2-niw` duplicate** — the old site had both. Phase 7 will canonicalise to one.
- **FAQ overlap** — `/services` reuses some homepage FAQs. Phase 7 will vary them so pages don't compete in search.
- **Support-service pages** (`/services/rfe-response` etc.) currently 404 — built in Phase 5C next.

---

## How the code is organised (for when you want specifics)

```
web/src/
  app/                      routes (page.tsx = homepage)
  components/
    layout/                 header, footer, whatsapp button
    sections/               homepage/page sections (reusable)
    service/                service-page building blocks
    seo/json-ld.tsx         all structured data
    ui/                     design-system primitives
  lib/content/              ALL copy lives here as typed data — never inline
```

The important pattern: **content is separated from presentation.** All the words live in `lib/content/`. Service pages (except EB-2 NIW) are **data-driven** — one renderer, many content files. Adding a page means writing content, not components.
