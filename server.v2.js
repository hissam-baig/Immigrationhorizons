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

// Only wire up the MongoDB-backed session store if MONGODB_URI looks like a
// real connection string (not the <placeholder> from .env.example). Falls
// back to the default in-memory session store otherwise.
const mongoUri = process.env.MONGODB_URI;
const hasRealMongoUri = mongoUri && !mongoUri.includes('<') && !mongoUri.includes('>');

if (hasRealMongoUri) {
  try {
    const store = MongoStore.create({ mongoUrl: mongoUri });
    store.on('error', (err) => {
      console.error('[session store] MongoDB session store error:', err.message);
    });
    sessionConfig.store = store;
  } catch (err) {
    console.error('[session store] Could not set up MongoDB session store, falling back to in-memory sessions:', err.message);
  }
} else if (mongoUri) {
  console.warn('[session store] MONGODB_URI still has placeholder values - using in-memory sessions for now.');
}

app.use(session(sessionConfig));

// ----- Locals available in every view -----
app.use((req, res, next) => {
  res.locals.siteUrl = process.env.SITE_URL || 'https://immigrationhorizons.com';
  res.locals.whatsapp1 = process.env.WHATSAPP_NUMBER_1 || '923305507598';
  res.locals.whatsapp2 = process.env.WHATSAPP_NUMBER_2 || '923418883635';
  res.locals.contactEmail = process.env.CONTACT_RECEIVER_EMAIL || 'smartforce54@gmail.com';
  res.locals.currentPath = req.path;
  res.locals.isAdmin = !!(req.session && req.session.isAdmin);
  next();
});

// ----- Routes -----
app.use('/', mainRoutes);
app.use('/', blogRoutes);
app.use('/', consultationRoutes);
app.use('/', adminRoutes);

// ----- 404 -----
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ----- Catch-all error handler (last resort, keeps errors from taking the process down) -----
app.use((err, req, res, next) => {
  console.error('[express error]', err && err.stack ? err.stack : err);
  res.status(500).send('Something went wrong. Please try again in a moment.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Immigration Horizons site running at http://localhost:${PORT}`);
});
