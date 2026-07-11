# Immigration Horizons — Website

A Node.js (Express + EJS + MongoDB) website for Immigration Horizons: services pages for EB1A, EB1B, EB1C, EB2-NIW (and a "coming soon" Investor Visa category), a client reviews page, a free-consultation booking form that saves leads to MongoDB and Google Sheets and emails you, and a dynamic blog with a password-protected admin panel to add/edit/delete posts.

## 1. Requirements

- Node.js 18+ and npm
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (for the blog + consultation requests)
- A free [Resend](https://resend.com) account for sending consultation form emails
- A Google Cloud service account with access to a Google Sheet (leads get appended there as a backup/CRM view)

## 2. Setup

```bash
npm install
cp .env.example .env
```

Then open `.env` and fill in:

| Variable | What it is |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string (see below) |
| `SESSION_SECRET` | Any long random string |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Login for `/admin` (the blog dashboard) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Used to email you consultation form submissions |
| `CONTACT_RECEIVER_EMAIL` | Where those emails land (defaults to smartforce54@gmail.com) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` / `GOOGLE_SHEET_ID` / `GOOGLE_SHEET_TAB_NAME` | Used to append each lead as a row in a Google Sheet |
| `WHATSAPP_NUMBER_1` / `WHATSAPP_NUMBER_2` | Shown on the site / used for the WhatsApp button |

### MongoDB Atlas (free tier)
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Database Access → add a database user with a password
3. Network Access → allow your server's IP (or `0.0.0.0/0` while testing)
4. Connect → Drivers → copy the connection string into `MONGODB_URI`

### Resend (for the consultation form emails)
1. Create a free account at https://resend.com
2. Add and verify a sending domain under Domains (or use their shared `onboarding@resend.dev` sender for testing — it can only deliver to your own Resend account email, so use a verified domain for real leads)
3. Create an API key at https://resend.com/api-keys and paste it into `RESEND_API_KEY`
4. Set `EMAIL_FROM` to an address on your verified domain, e.g. `"Immigration Horizons <leads@immigrationhorizons.com>"`

### Google Sheets (leads are appended here in addition to the database)
1. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project and enable the **Google Sheets API**
2. IAM & Admin → Service Accounts → Create Service Account
3. Open the new service account → Keys → Add Key → JSON, and download it
4. Create (or open) your Google Sheet, add a tab (default name `Leads`) with header row `Date, Name, Email, Phone, Service, Message, ID`
5. Click **Share** on the sheet and share it with the service account's email (found in the downloaded JSON as `client_email`) with **Editor** access
6. Fill in `.env`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the `client_email` from the JSON
   - `GOOGLE_PRIVATE_KEY` — the `private_key` from the JSON, pasted as-is (keep the `\n` sequences and surrounding quotes)
   - `GOOGLE_SHEET_ID` — the long ID in the sheet's URL: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`
   - `GOOGLE_SHEET_TAB_NAME` — the tab name from step 4 (defaults to `Leads`)

Until these are filled in, the site still runs and all the marketing pages work — the blog will just say it's not connected yet, and consultation submissions are always saved to MongoDB (visible in `/admin`) even if the email or Sheets sync isn't configured.

## 3. Run it

```bash
npm start        # production
npm run dev       # auto-restart on file changes (requires nodemon, already in package.json)
```

Visit http://localhost:3000

## 4. Admin panel (blog)

Go to `/admin/login` and sign in with `ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env`. From there you can add, edit, publish/unpublish, and delete blog posts, and see incoming consultation requests.

To use a bcrypt-hashed password instead of a plain-text one in `.env`, run:
```bash
node scripts/createAdmin.js "your-new-password"
```
and put the printed `ADMIN_PASSWORD_HASH` value in `.env` (then you can remove `ADMIN_PASSWORD`).

## 5. Client reviews

The testimonials shown on the homepage and `/reviews` page live in `utils/testimonials.js`. They're based on the reviews and inbox messages from the Fiverr profile (https://www.fiverr.com/rahatkarim487), each with a "Verify on Fiverr" link back to that profile. Edit that file directly to add, remove, or update reviews — no database needed for these, since they're the fixed, verified set you provided.

## 6. Project structure

```
server.js            Entry point
config/db.js          MongoDB connection
models/               BlogPost, Consultation (Mongoose schemas)
routes/                main (home/services/about/reviews), blog, consultation (contact form), admin
views/                 EJS templates (partials/layout, nav, footer + one file per page)
public/                CSS, JS, uploaded blog images
utils/                 services.js and testimonials.js — edit these to change service descriptions or reviews
middleware/             auth.js (admin login guard), upload.js (blog image uploads)
scripts/createAdmin.js  optional helper to generate a bcrypt password hash
```

## 7. Deploying

Any Node host works (Render, Railway, a VPS, etc.). Set the same environment variables from `.env` in your host's dashboard/secrets manager instead of committing a `.env` file. Point your domain (immigrationhorizons.com) at the deployed app.
