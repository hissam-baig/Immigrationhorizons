# Immigration Horizons — Project Memory

## Apps in this repo

| | Path | Stack | Port | Status |
|---|---|---|---|---|
| **Old site** | repo root | Express 4 + EJS + MongoDB | 3000 | Live in production |
| **New frontend** | `web/` | Next.js 16 + React 19 + TS + Tailwind v4 | 3000 | In build, not deployed |
| **Admin CMS** | `web/server/` | Express + EJS + MongoDB | 4000 | Standalone admin panel |

### Admin CMS (`web/server/`)
`cd web/server && npm install && npm run dev` → http://localhost:4000/admin. `npm run seed` migrates existing testimonials/FAQs/settings into Mongo. Login via env `ADMIN_USERNAME`/`ADMIN_PASSWORD` or DB users (`models/admin/User`).
- Router `routes/admin/index.js`: dashboard, leads (+ CSV export, notes), blog CRUD, SEO manager, testimonials, FAQs, services, media library, settings, users, global search.
- Models: shared root (`BlogPost`, `Consultation`, `Comment`) + `models/admin/*` (FAQ, Testimonial, SEOMeta, Setting, Media, User, InternalNote).
- The panel was originally built in the **repo-root** Express app (wired via root `server.js` → `routes/admin/index`) and then moved here as a standalone copy. Root copy left intact so the live app isn't broken — remove it only at cutover.
- This admin only reads/manages stored data. Lead email (Resend) + Sheets sync live in the site's form handler, not here. The `/admin/contact-form` page shows integration status.

**Running the new site — this trips people up:**

```bash
cd web && npm run dev      # NEW Next.js site
```

`npm run dev` from the **repo root** runs `nodemon server.js` — the **old** EJS site.
Same for `build` / `start`: always `cd web` first.

Do not modify the root Express app unless asked. It is serving real traffic until cutover.

---

## Business positioning — non-negotiable

Immigration Horizons is an **immigration consulting and paralegal services practice. NOT a law firm.**

- Allowed: immigration consultants, immigration specialists, petition preparation experts, immigration documentation specialists, paralegal support
- Never: attorney, lawyer, legal advice, legal representation, "we represent you before USCIS"
- The disclaimer in `site.disclaimer` must never be softened. It is also embedded in the Organization JSON-LD via `disambiguatingDescription`.

## Content accuracy rules (enforced throughout)

These exist because the site's core differentiator is verifiability.

1. **No USCIS processing times or cost figures.** They change constantly and are case- and service-centre-specific. Point to the official USCIS processing-times tool instead.
2. **No approval rates, success rates, or guarantees.** There is a homepage FAQ that explicitly says we cannot guarantee approval — keep it, it is a deliberate EEAT signal.
3. **No invented case studies or client profiles.** Outcome content is built only from the 8 real testimonials in `lib/content/testimonials.ts`, each with a working `verifyUrl`.
4. **No stock photography of people.** Undercuts the "verifiable, not just claimed" argument. Illustrations are inline SVG.
5. **No placeholder content.** The legacy `team.js` had a `placeholder: true` member — deliberately not published.

### Open items awaiting the owner
- **"Countries served" number** — owner said they would supply a figure. Until then the copy says "Global" / "clients across multiple countries". Do not invent a number.
- **Real photography** of Rahat / the practice would strengthen the trust sections.

---

## Architecture (`web/`)

```
src/
  app/                    routes; page.tsx = homepage, not-found.tsx = custom 404
  components/
    layout/               header (only client component), footer, whatsapp-fab
    sections/             composable homepage/page sections
    seo/json-ld.tsx       Organization, WebSite, FAQPage, Breadcrumb schema
    ui/                   design-system primitives
  lib/content/            ALL copy lives here as typed data, never inline in JSX
```

### Design system
- Tokens in `app/globals.css` via Tailwind v4 `@theme`. Navy = primary, gold = secondary.
- **Gold contrast rule:** `gold-500` is ~2.6:1 on white and fails AA as text. Use it for fills/rules/ornament only. Gold *text* on light must be `gold-700`+; on navy use `gold-300/400`. The gold CTA button is `gold-500` fill + `navy-900` text (passes AA).
- Light-only. Dark mode was deliberately removed — it wrecked the navy/gold trust brand.
- Fonts: Source Serif 4 (display) + Inter (UI/body), both variable, self-hosted via `next/font`. Zero external font requests.

### Performance rules
- **Do not add animation libraries.** `motion` was installed then removed — it forced every section into a client component and cost ~39 KB gzipped. Scroll reveals are CSS-only via `animation-timeline: view()`.
- **Critical:** the reveal `opacity: 0` must stay *inside* `@supports (animation-timeline: view())` and `@media (prefers-reduced-motion: no-preference)` in `globals.css`. Firefox lacks support — moving it out would blank the page for every Firefox visitor.
- Keep sections as server components. `header.tsx` is the only `"use client"` file.
- FAQ accordions use native `<details>`/`<summary>` — accessible, SEO-visible, zero JS.
- Illustrations are inline SVG + CSS keyframes. No canvas/WebGL/JS animation.

---

## Information architecture

The legacy site conflated two different things into one flat service list. They are now separate:

- **Case categories** (visa classification): `eb2-niw`, `eb1a`, `eb1b`, `eb1c`, `o1-visa`
- **Support services** (single deliverables): `rfe-response`, `recommendation-letters`, `expert-opinion-letters`, `business-plans`, `evidence-packaging`

Support services previously existed only as bullet points inside categories — no pages, no search traffic, despite being what many clients actually search for.

Nav derives from the service catalogue in `lib/content/services.ts`, so adding a service updates header, mega menu, and footer automatically.

`enumValue` on each case category must stay in sync with the legacy `Consultation` model enum.

---

## Verification expected before declaring a phase done

```bash
cd web
npm run lint          # must be clean
npm run build         # must compile + typecheck
```

Then serve the production build and check the rendered HTML — not just that it compiled:
- single `<h1>`, no heading-level skips
- FAQ schema answers byte-match the visible answers (Google penalises mismatches)
- exactly one `<meta name="robots">` (Next auto-injects one on not-found — do not add a second)
- no horizontal scroll at any breakpoint

---

## Phase status

- ✅ 1 Audit · 2 Design system · 3 Nav/layout · 4 Homepage · 4B content spec · 4C optimization pass
- ✅ 5A `/services` index + service template + definitive EB-2 NIW page (4,702 words)
- ✅ 5B EB-1A/EB-1B/EB-1C/O-1 (2,573–2,907 words each)
- ✅ 5C 5 support-service pages (rfe-response, recommendation-letters, expert-opinion-letters, business-plans, evidence-packaging)
- ✅ P1 routing fix: ALL core pages built — /consultation, /contact, /about, /reviews, /faqs, /privacy, /terms, /resources, /blog. Zero 404s; every internal link resolves.
- ✅ P3 visual system (all inline SVG/CSS, zero added JS): hero globe, process timeline, DocumentStack illustration, CategoryComparison table, profession icons, PhotoSlot.
- 🔨 6 Blog data layer (real posts) · ⬜ 7 SEO (sitemap/canonical dedupe) · 8 Optimization

### Forms & lead delivery (P1)
- /consultation + /contact use React 19 Server Actions (`app/*/actions.ts`) + `useActionState`. Validation, honeypot ("company" field), UTM passthrough.
- `lib/leads.ts` sends via Resend when RESEND_API_KEY is set, else logs + accepts gracefully. **Cutover TODO:** Mongo persistence + Google Sheets append are NOT ported yet (email is the wired path). `resend` is installed in web/.
- /consultation is the only Dynamic (ƒ) route — it reads searchParams for ?service= prefill + UTM.

### Visuals (P3) — imagery decision
- Photos: user chose "SVG now + PhotoSlot for later". `components/ui/photo-slot.tsx` renders a branded placeholder until a real WebP path is passed as `src` — then it's an optimised next/image. NO fake stock people. Real photo slot live on /about story section.
- Reusable visual components in `components/visuals/`: document-stack, category-comparison. Plus process.tsx reworked into a connected timeline.

### Service-page architecture (Phase 5)
- **EB-2 NIW is bespoke:** `app/services/eb2-niw/page.tsx` + `lib/content/eb2-niw.ts`. Static route wins over dynamic by Next resolution order.
- **All other service pages are data-driven:** one renderer at `app/services/[slug]/page.tsx` consumes typed content from `lib/content/service-pages/*.ts` (registry in `index.ts`). Adding a page = write a content file + register it. Do NOT build new page components.
- Reusable service components in `components/service/`: ServiceHero, TableOfContents, ContentSection, Prose, DefinitionList, SubSection, Callout, InlineCta, OfficialSources, RelatedServices, Breadcrumbs.
- Every service page cites primary sources (INA/CFR/USCIS) via OfficialSources — EEAT + honesty. O-1 page states plainly it is a NONIMMIGRANT classification (temporary), not a green card.
- Next 16: `params` is a Promise — `const { slug } = await params`.

### Verified content-safety checks (keep running these each new page)
Programmatic scan of rendered HTML confirms zero: dollar amounts, month/week timeframes, guarantee/approval-rate language, attorney self-description. FAQ schema answers byte-match visible text. TOC anchors all resolve to real ids.

**Deferred to Phase 6:** homepage "Latest Articles" section (needs the blog data layer — do not stub with fake posts).

**Deferred to Phase 7:** `/eb2-niw` and `/services/eb2-niw` are duplicate content on the legacy site. Needs canonicalisation to one URL, not two competing pages.

**Carry into the data layer:** the placeholder-Mongo-URI guard from the deleted `server.v2.js` was a real fix that never got merged.

---

## Git

Branch `redesign-v2`. Nothing committed yet this effort: 5 dead legacy files (`server.new.js`, `server.v2.js`, `config/db.new.js`, `config/db.v2.js`, `routes/admin.new.js`) are staged as deletions; `web/` is untracked.
