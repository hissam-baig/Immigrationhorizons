# Immigration Horizons — Legacy Site (Project Memory)

## This repo, after the split

This repo now holds **only the legacy site**: Express 4 + EJS + MongoDB, port 3000, live in production.

The redesigned Next.js frontend and its standalone admin CMS — previously developed here under `web/` and `web/server/` — have been split out into their own repo: **[Immigration-Horizons](https://github.com/ashderkarim123/Immigration-Horizons)** (full commit history preserved via `git subtree split`). That repo's own `CLAUDE.md` documents the design system, architecture, phase status, and content rules for the new site — this file no longer needs to, and should not duplicate it.

`npm run dev` from this repo root runs `nodemon server.js` — the legacy EJS site. There is no `web/` here anymore.

Do not modify this app unless asked. It is serving real traffic until an explicit cutover decision is made to the new stack.

---

## Business positioning — non-negotiable

Immigration Horizons is an **immigration consulting and paralegal services practice. NOT a law firm.**

- Allowed: immigration consultants, immigration specialists, petition preparation experts, immigration documentation specialists, paralegal support
- Never: attorney, lawyer, legal advice, legal representation, "we represent you before USCIS"

This applies to any copy in `views/` here just as much as to the new site.

## Content accuracy rules (enforced throughout)

These exist because the site's core differentiator is verifiability.

1. **No USCIS processing times or cost figures.** They change constantly and are case- and service-centre-specific. Point to the official USCIS processing-times tool instead.
2. **No approval rates, success rates, or guarantees.**
3. **No invented case studies or client profiles.**
4. **No stock photography of people.**
5. **No placeholder content.**

### Open items awaiting the owner
- **"Countries served" number** — owner said they would supply a figure. Until then the copy says "Global" / "clients across multiple countries". Do not invent a number.
- **Real photography** of Rahat / the practice would strengthen the trust sections.

---

## Git

Branch `redesign-v2`. `web/` was removed from this repo after being split into the standalone Immigration-Horizons repo (see above) — its full history is preserved there, not here going forward.
