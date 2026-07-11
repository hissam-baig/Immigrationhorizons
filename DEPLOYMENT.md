# Deployment Guide — Immigration Horizons

This app is a traditional **Node.js + Express + EJS server** (`server.js` calls
`app.listen(...)` and keeps a long-running process open). It talks to:

- **MongoDB Atlas** (blog posts, consultation leads, admin sessions)
- **Resend** (transactional email for the consultation form)
- **Google Sheets API** (lead backup)
- **Local disk** (`public/uploads/`) for blog cover images and consultation
  resume/document uploads, written via `multer.diskStorage` in
  [`middleware/upload.js`](middleware/upload.js) and
  [`middleware/uploadDocument.js`](middleware/uploadDocument.js)

That last point is the one architectural fact that decides which hosts are a
good fit — read the callout below before picking a platform.

---

## ⚠️ Read this first: the file-upload problem on serverless hosts

`middleware/upload.js` and `middleware/uploadDocument.js` save uploaded files
to `public/uploads/` **on the local filesystem** of the running process, and
`server.js` then serves that folder as static files.

That works perfectly on a normal server (VPS, Render, Railway, Fly.io) where
one process stays alive and its disk persists. It **breaks silently on
serverless platforms** (Vercel, Netlify Functions, AWS Lambda) because:

1. Serverless functions run in a fresh, mostly read-only container per
   invocation (only `/tmp` is writable, and it's wiped between invocations).
2. Even if you redirect uploads to `/tmp`, the file is gone by the time a
   *different* invocation tries to serve it back — there's no shared disk
   across invocations/instances.
3. The result: the admin uploads a blog cover image, it "succeeds," and then
   404s (or the request errors outright, since the deployed bundle's
   `public/` folder isn't writable at all).

**You have two options:**

- **Deploy to a host with a persistent, writable disk** (Render, Railway,
  Fly.io, a VPS) — the app works completely unmodified. This is the
  recommended path and what the rest of this guide leads with.
- **Deploy to Vercel** — works for everything *except* uploads unless you
  first swap `multer.diskStorage` for a cloud storage backend (Cloudinary,
  AWS S3, or Vercel Blob). Covered in its own section below with the exact
  code changes required.

---

## Platform comparison

| Platform | Persistent disk (uploads work as-is) | Docker support | Free tier | Setup effort | Best for |
|---|---|---|---|---|---|
| **Render** | ✅ (paid disk add-on; free tier disk is ephemeral but survives restarts, not redeploys) | ✅ auto-detects `Dockerfile` | ✅ (spins down when idle) | Low | **Recommended default** — simplest for this app |
| **Railway** | ✅ (volumes) | ✅ auto-detects `Dockerfile` | Trial credit, no perpetual free tier | Low | Great DX, fast deploys |
| **Fly.io** | ✅ (volumes, on every tier) | ✅ Docker-native (this is how it deploys) | Small free allowance | Medium | **Recommended for Docker** — real volumes without a paid tier |
| **DigitalOcean / Linode / Hetzner VPS** | ✅ (full disk) | ✅ (run the Dockerfile yourself, or skip Docker entirely) | ❌ (~$4–6/mo) | Medium–High | Full control, cheapest at scale, you manage everything (Nginx, TLS, PM2/Docker, updates) |
| **Hostinger VPS** | ✅ (full disk) | ✅ (Docker OS template available, or install manually) | ❌ (VPS plans only) | Medium | Same as any VPS, via hPanel — see Part 4b for the exact walkthrough |
| **DigitalOcean App Platform** | ⚠️ (needs Spaces/S3 for uploads) | ✅ | Limited free | Low | If you're already in the DO ecosystem |
| **Vercel** | ❌ (must migrate uploads to cloud storage first) | ❌ (doesn't run arbitrary Dockerfiles for Node apps) | ✅ generous | Medium (requires code change) | Only if you want Vercel specifically, e.g. for its CDN/edge network or existing team workflow |
| **Heroku** | ❌ (ephemeral filesystem, same problem as Vercel) | ✅ (`heroku.yml`) | ❌ (no free tier anymore) | Low | Not recommended — no upside over Render/Railway today |

**Recommendation: Render.** It runs your existing code with zero changes,
has a real (if modest) free tier, and setup takes about 10 minutes. Railway
is an equally good second choice if you prefer its dashboard/DX.

---

## Part 1 — Shared prep (do this regardless of platform)

### 1. Push the repo to GitHub

All the platforms below deploy by connecting to a Git repo. If you haven't
already:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

Double check `.env` is **not** committed (it's already in `.gitignore`) and
consider adding `public/uploads/` to `.gitignore` too — uploaded content
shouldn't live in git history:

```gitignore
node_modules/
.env
*.log
.DS_Store
public/uploads/*
!public/uploads/resumes
```

### 2. Set up MongoDB Atlas for production

1. In [Atlas](https://cloud.mongodb.com), create (or reuse) a cluster.
2. **Database Access** → add a dedicated production DB user with a strong,
   generated password (don't reuse your local dev password).
3. **Network Access** → add `0.0.0.0/0` (allow from anywhere). This is
   required for Render/Railway/Vercel since their outbound IPs are dynamic —
   Atlas auth (user+password over TLS) is what actually protects the
   database, not the IP allowlist.
4. **Connect → Drivers** → copy the `mongodb+srv://...` connection string.
   This becomes your production `MONGODB_URI`.

### 3. Get production API keys

- **Resend**: verify a sending domain at
  [resend.com/domains](https://resend.com/domains) (don't ship with the
  shared `onboarding@resend.dev` sender — it can't reliably deliver to
  arbitrary inboxes). Create a production API key.
- **Google Sheets**: reuse the same service account JSON from `.env.example`,
  or create a separate one for prod. Make sure the sheet is shared with the
  service account's email.

### 4. Decide on the admin password

`routes/admin.js` accepts either a plain-text `ADMIN_PASSWORD` or a
pre-hashed `ADMIN_PASSWORD_HASH`. For production, generate a hash instead of
storing the plaintext password as an env var:

```bash
node scripts/createAdmin.js "your-new-strong-password"
# prints: ADMIN_PASSWORD_HASH=$2a$10$...
```

Set that as an env var on your host and **do not** also set `ADMIN_PASSWORD`.

### 5. Full environment variable checklist

Set all of these on whichever host you choose (see `.env.example` for the
full annotated version):

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Most hosts inject this automatically — don't hardcode it |
| `SITE_URL` | Your real domain, e.g. `https://immigrationhorizons.com` |
| `MONGODB_URI` | Production Atlas connection string |
| `SESSION_SECRET` | Long random string — generate with `openssl rand -hex 32` |
| `ADMIN_USERNAME` | |
| `ADMIN_PASSWORD_HASH` | From step 4 above (preferred over `ADMIN_PASSWORD`) |
| `RESEND_API_KEY` | Production key |
| `EMAIL_FROM` | Must be on your verified Resend domain |
| `CONTACT_RECEIVER_EMAIL` | Where leads get emailed |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | |
| `GOOGLE_PRIVATE_KEY` | Keep the `\n` escapes literal — most host dashboards handle multi-line env vars fine, but double check after pasting |
| `GOOGLE_SHEET_ID` | |
| `GOOGLE_SHEET_TAB_NAME` | |
| `WHATSAPP_NUMBER_1` / `WHATSAPP_NUMBER_2` | |

---

## Part 2 — Recommended: Deploy to Render

1. Sign up at [render.com](https://render.com) and connect your GitHub
   account.
2. **New → Web Service** → select this repo.
3. Configure:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or the smallest paid tier for no cold-start
     spin-down)
4. Add all the environment variables from the checklist above under the
   **Environment** tab.
5. *(Recommended)* Add a **Disk** under the service's **Disks** tab — mount
   path `/opt/render/project/src/public/uploads`, 1GB is plenty — so
   uploaded images/resumes survive redeploys. (Render's free tier doesn't
   include persistent disks; this needs a paid instance. On the free tier,
   uploads survive restarts but are wiped on every new deploy — fine for
   testing, not for production content.)
6. Deploy. Render gives you a `*.onrender.com` URL immediately.
7. **Custom domain**: Settings → Custom Domains → add your domain, then
   point your DNS at Render per their instructions (CNAME for a subdomain,
   or their provided A/ALIAS records for an apex domain). TLS is automatic.

Render free-tier services spin down after 15 minutes of inactivity and take
~30s to wake on the next request — fine for a low-traffic marketing site,
annoying if you want instant load every time. Upgrade to the $7/mo instance
to remove that.

---

## Part 2b — Alternative: Deploy to Railway

Nearly identical flow, good if you prefer Railway's UI or want a persistent
volume without a paid tier gate:

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub
   repo**.
2. Railway auto-detects Node and runs `npm install` + `npm start`. Confirm
   under **Settings**.
3. **Variables** tab → paste in the full env var checklist.
4. **Settings → Volumes** → attach a volume mounted at
   `/app/public/uploads` so uploads persist across deploys.
5. **Settings → Networking → Generate Domain** for a free `*.up.railway.app`
   URL, or add a custom domain + CNAME.

---

## Part 2c — Docker

The repo now includes a `Dockerfile`, `.dockerignore`, and `docker-compose.yml`
at the root. Docker packages the app consistently but — same as every other
option — doesn't by itself solve the uploads-persistence problem; you still
need a volume mounted at `public/uploads/` wherever the container runs.

### Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux), installed
  and running.
  - Windows: Docker Desktop will prompt you to enable the **WSL2 backend**
    during install — accept it, it's required.
  - Verify with `docker --version` and `docker compose version` — both
    should print a version number.
- The repo's `Dockerfile` / `.dockerignore` / `docker-compose.yml` (already
  added, nothing to write yourself).
- The same environment variables/secrets as every other option (checklist in
  Part 1). With Docker these are supplied at *run* time — via
  `--env-file`, `docker-compose.yml`'s `env_file:`, or a host's "secrets"
  feature — never baked into the image.
- A **registry account** only if you're deploying somewhere that doesn't
  build the Dockerfile itself (e.g. pushing manually to a bare VPS). Fly.io,
  Render, and Railway all build your Dockerfile and push to their own
  internal registry automatically — no separate Docker Hub/GHCR account
  needed for those.
- A **volume strategy** for `public/uploads/` — a named Docker volume
  locally (already wired up in `docker-compose.yml`), or a platform volume
  (Fly.io volumes, Railway volumes) in production.
- `package.json` now pins `"engines": { "node": ">=20.0.0" }` to match the
  Dockerfile's `node:20-alpine` base, so the two don't drift apart later.

### Build & run locally

```bash
cp .env.example .env   # fill in real values
docker compose up --build
```

Visit http://localhost:3000. Uploaded files land in the `uploads` named
volume and survive `docker compose down` / `up` (but not `docker compose
down -v`, which deletes volumes).

### Deploy to Fly.io (Docker-native, volumes on every tier)

```bash
# 1. Install the CLI and sign in
curl -L https://fly.io/install.sh | sh
fly auth login

# 2. From the repo root — detects the Dockerfile, generates fly.toml
fly launch --no-deploy

# 3. Create a volume for persistent uploads (use the region fly launch picked)
fly volumes create uploads --size 1 --region <region-from-step-2>

# 4. Add this to the generated fly.toml so the volume actually mounts:
#    [[mounts]]
#      source = "uploads"
#      destination = "/app/public/uploads"

# 5. Set every secret from the Part 1 checklist
fly secrets set MONGODB_URI="..." SESSION_SECRET="..." RESEND_API_KEY="..." # etc.

# 6. Deploy
fly deploy
```

### Deploy the same Dockerfile to Render or Railway instead

Both platforms auto-detect a `Dockerfile` at the repo root and build from it
instead of running `npm install`/`npm start` directly — everything else in
Part 2 / Part 2b stays the same, just pick "Docker" as the environment
instead of "Node" when creating the service. Persistent volumes are still a
paid-tier feature on both, same caveat as before.

### Why not Vercel with Docker?

Vercel's Node.js runtime doesn't execute an arbitrary `Dockerfile` for
serverless functions — you'd still need the exported-`app` +
`vercel.json` approach from Part 3 below. Docker support on Vercel exists
only in narrower contexts that don't fit a plain Express app like this one.

---

## Part 3 — Deploy to Vercel (requires code changes)

Vercel is a great fit if you want its CDN/edge network or you're already
standardized on it — but this app needs two changes first.

### Change 1: Export the Express app instead of always calling `.listen()`

Vercel's Node runtime imports your handler and calls it per-request; it does
not want you binding a port yourself. At the bottom of `server.js`, replace:

```js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Immigration Horizons site running at http://localhost:${PORT}`);
});
```

with:

```js
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Immigration Horizons site running at http://localhost:${PORT}`);
  });
}

module.exports = app;
```

This keeps `npm start` working locally/on other hosts (`require.main ===
module` is true when you run `node server.js` directly) while letting Vercel
import `app` without it trying to bind a port.

Add a `vercel.json` at the repo root so all routes go through `server.js`:

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

### Change 2: Move uploads off local disk

Replace the `multer.diskStorage` in `middleware/upload.js` and
`middleware/uploadDocument.js` with `multer.memoryStorage()` and upload the
buffer to a cloud provider inside the route handler. Cloudinary has the
least setup for images:

```js
// middleware/upload.js
const multer = require('multer');
module.exports = multer({
  storage: multer.memoryStorage(),
  fileFilter, // same as before
  limits: { fileSize: 5 * 1024 * 1024 },
});
```

Then in the blog admin route that handles the upload (`routes/admin.js`),
pipe `req.file.buffer` to Cloudinary's SDK and store the returned secure URL
on the post instead of a local path. (Happy to wire this up if you want to
go the Vercel route — it's a focused change, just flag it and I'll implement
it rather than leave it as a TODO.)

### Vercel deploy steps (once the above is done)

1. `npm i -g vercel` (or use the Vercel dashboard's GitHub import).
2. `vercel` from the repo root → follow prompts to link the project.
3. Add every env var from the checklist via **Project Settings →
   Environment Variables** (or `vercel env add <NAME>` per variable).
4. `vercel --prod` to deploy, or just push to your connected GitHub branch.
5. **Domains** tab → add your custom domain, update DNS as instructed.

**MongoDB note for Vercel:** functions are stateless and can scale to many
concurrent invocations, each potentially opening its own DB connection.
Mongoose reuses the connection across warm invocations of the same
container, but under bursty traffic you can exhaust Atlas's connection
limit faster than on a single long-running server. If you see connection
errors under load, lower `maxPoolSize` on the Mongoose connect call and/or
upgrade off the Atlas free tier (M0) tier's connection cap.

---

## Part 4 — VPS option (DigitalOcean / Hetzner / Linode)

For full control or the lowest long-run cost. High level, since exact steps
vary by provider:

1. Spin up a small Ubuntu droplet/instance ($4–6/mo tier is plenty for this
   app).
2. Install Node.js (via `nvm` or NodeSource), `git`, and `nginx`.
3. Clone the repo, `npm install --production`, copy your `.env` file over
   (`scp` it — never commit it).
4. Run the app under a process manager so it restarts on crash/reboot:
   ```bash
   npm i -g pm2
   pm2 start server.js --name immigration-horizons
   pm2 save
   pm2 startup   # follow the printed instructions to enable on-boot start
   ```
5. Put Nginx in front as a reverse proxy (`proxy_pass
   http://localhost:3000;`) and get free TLS with Certbot
   (`certbot --nginx`).
6. Point your domain's A record at the droplet's IP.

Uploads work unmodified since `public/uploads/` is just a normal folder on a
normal disk. This is the only option here that also gives you full
filesystem-level backup control over uploaded documents.

---

## Part 4b — Hostinger VPS with Docker (step-by-step)

Hostinger doesn't have a Render/Railway-style "connect your GitHub repo and
we build it" app platform — their Node/Docker-capable product is **VPS
hosting**, managed through **hPanel**. This runs the exact Docker setup from
Part 2c on a Hostinger VPS, fronted by Caddy for automatic HTTPS, using the
`docker-compose.prod.yml` already in the repo.

### 1. Provision the VPS

1. In hPanel, buy/open a **VPS** plan (the entry KVM plan is enough for a
   low-traffic marketing site; go up a tier if the blog gets real traffic).
2. During setup, pick an OS/template. If Hostinger offers a **Docker**
   application template (Ubuntu with Docker CE + Compose plugin
   pre-installed), choose it — it skips step 3 below entirely. If you only
   see plain OS images, pick **Ubuntu 22.04/24.04 LTS** and install Docker
   manually in the next step.
3. Set your SSH key (or root password) during creation, note the VPS's
   **public IP** from the hPanel VPS overview page.

### 2. Connect and install Docker (skip if you used the Docker template)

```bash
ssh root@<vps-ip>

curl -fsSL https://get.docker.com | sh
# installs Docker Engine + the `docker compose` plugin

docker --version
docker compose version
```

### 3. Open the right ports

hPanel → your VPS → **Firewall** — create/attach a firewall rule set
allowing:

- `22` (SSH)
- `80` (HTTP — needed for Let's Encrypt's certificate challenge)
- `443` (HTTPS)

If the VPS also runs `ufw` locally (default on some templates), mirror the
same rules there: `ufw allow 22,80,443/tcp && ufw enable`. Rules only take
effect once both layers agree — a port open in hPanel but blocked by `ufw`
(or vice versa) still won't be reachable.

### 4. Point your domain at the VPS

- **Domain registered with Hostinger**: hPanel → **Domains** → your domain →
  **DNS / Nameservers** → add an `A` record: host `@` (and `www` if you want
  it), value = the VPS's public IP.
- **Domain registered elsewhere**: add the same `A` record in that
  registrar's DNS settings instead. Either way, wait for propagation
  (`dig yourdomain.com` should return the VPS IP) before starting Caddy, or
  its first certificate request will fail and retry until DNS catches up.

### 5. Get the code and secrets onto the VPS

```bash
git clone <your-repo-url> immigration-horizons
cd immigration-horizons

cp .env.example .env
nano .env   # fill in MONGODB_URI, SESSION_SECRET, RESEND_API_KEY, etc.
            # set SITE_DOMAIN=yourdomain.com (bare domain, no https://)
```

### 6. Bring the stack up

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
```

Caddy automatically requests and renews a Let's Encrypt certificate for
`SITE_DOMAIN` the first time it starts and terminates HTTPS for you — there's
no separate Certbot/Nginx setup to do. `web` isn't published to a host port
at all (`expose`, not `ports`, in `docker-compose.prod.yml`), so the app is
only reachable through Caddy on 80/443.

### 7. Redeploying after code changes

```bash
cd immigration-horizons
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

The `uploads` named volume isn't touched by `up --build`, so existing blog
images/resumes survive redeploys. Only `docker compose ... down -v` deletes
volumes — don't run that in production unless you mean to wipe uploads.

### 8. Backups

- **Whole-VPS**: hPanel → VPS → **Snapshots/Backups** — Hostinger can take
  periodic full-disk snapshots; enable this for easy disaster recovery.
- **Uploads specifically**: the volume lives on the VPS disk too, but if you
  want an off-box copy: `docker run --rm -v immigration-horizons_uploads:/data
  -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .`
- **Database**: this is already handled by MongoDB Atlas, not the VPS —
  confirm Atlas's own backup settings are on if this is a paid cluster tier.

---

## Part 5 — Post-deploy checklist (all platforms)

- [ ] Homepage loads over HTTPS with no mixed-content warnings
- [ ] `/admin` login works with the production admin credentials
- [ ] Create a test blog post **with a cover image** and confirm the image
      still loads after a hard refresh (this is the check that catches the
      serverless-uploads problem if you missed it)
- [ ] Submit the consultation form end-to-end and confirm:
  - the email arrives at `CONTACT_RECEIVER_EMAIL` via Resend
  - a row appears in the Google Sheet
  - a document upload (resume/PDF) attaches correctly
- [ ] Check server logs for `[db] Connected to MongoDB Atlas` (not a
      connection error)
- [ ] Remove/rotate the placeholder default admin password if you ever
      logged in with it during testing
- [ ] Set up basic uptime monitoring (e.g. [UptimeRobot](https://uptimerobot.com),
      free) pinging `/` — matters most on Render's free tier since it tells
      you if the service is asleep

---

## TL;DR recommendation

- **Just want it live with minimal fuss and no code changes:** Render (or
  Railway).
- **Want a portable, host-agnostic build:** Docker + Fly.io — zero code
  changes, and real persistent volumes without needing a paid tier.
- **Want it on Vercel specifically:** budget an extra hour to move uploads
  to Cloudinary/S3 first — don't skip this, it will fail silently in prod
  otherwise.
- **Want the cheapest long-term cost and full control:** a small VPS + PM2 +
  Nginx (or that same VPS running the Dockerfile via `docker compose up
  -d`, if you'd rather manage one container than a bare Node install).
