require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');

const connectDB = require('./config/db');

const mainRoutes = require('./routes/main');
const blogRoutes = require('./routes/blog');
const consultationRoutes = require('./routes/consultation');
const adminRoutes = require('./routes/admin');
const seoRoutes = require('./routes/seo');

const services = require('./utils/services');
const social = require('./utils/social');
const marketplaceListings = require('./utils/marketplaceListings');

const app = express();

// Never let a bad MongoDB URI / transient DB hiccup take the whole process down.
// The site still needs to serve the marketing pages even if the DB is unreachable.
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err && err.message ? err.message : err);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.message ? err.message : err);
});

connectDB();

// ----- View engine -----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'partials/layout');

// ----- Core middleware -----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// ----- Sessions (for /admin login) -----
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'insecure-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
};

if (process.env.MONGODB_URI) {
  try {
    const store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI });
    store.on('error', (err) => {
      console.error('[session store] MongoDB session store error:', err.message);
    });
    sessionConfig.store = store;
  } catch (err) {
    console.error('[session store] Could not set up MongoDB session store, falling back to in-memory sessions:', err.message);
  }
}

app.use(session(sessionConfig));

// ----- Locals available in every view -----
app.use((req, res, next) => {
  const trackedKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  const trackingParams = trackedKeys.reduce((acc, key) => {
    if (req.query[key]) acc[key] = String(req.query[key]).trim();
    return acc;
  }, {});

  res.locals.siteUrl = process.env.SITE_URL || 'https://immigrationhorizons.com';
  res.locals.whatsapp1 = process.env.WHATSAPP_NUMBER_1 || '923305507598';
  res.locals.whatsapp2 = process.env.WHATSAPP_NUMBER_2 || '923418883635';
  res.locals.contactEmail = process.env.CONTACT_RECEIVER_EMAIL || 'smartforce54@gmail.com';
  res.locals.currentPath = req.path;
  res.locals.trackingParams = trackingParams;
  res.locals.isAdmin = !!(req.session && req.session.isAdmin);
  res.locals.services = services;
  res.locals.marketplaceListings = marketplaceListings;
  res.locals.fiverrProfileUrl = social.FIVERR_PROFILE_URL;
  res.locals.fiverrRfeGigUrl = social.FIVERR_RFE_GIG_URL;
  res.locals.upworkProfileUrl = social.UPWORK_PROFILE_URL;
  res.locals.upworkRfeNiwCatalogUrl = social.UPWORK_RFE_NIW_CATALOG_URL;
  res.locals.ga4Id = process.env.GA4_ID || '';
  res.locals.gtmId = process.env.GTM_ID || '';
  res.locals.metaPixelId = process.env.META_PIXEL_ID || '';
  res.locals.linkedinPartnerId = process.env.LINKEDIN_PARTNER_ID || '';
  res.locals.clarityId = process.env.MICROSOFT_CLARITY_ID || '';
  res.locals.description = null;
  res.locals.keywords = null;
  next();
});

// ----- Routes -----
app.use('/', seoRoutes);
app.use('/', mainRoutes);
app.use('/', blogRoutes);
app.use('/', consultationRoutes);
app.use('/', adminRoutes);

// ----- 404 -----
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found | Immigration Horizons',
    description: 'The page you requested could not be found on Immigration Horizons.',
    noindex: true,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Immigration Horizons site running at http://localhost:${PORT}`);
});
