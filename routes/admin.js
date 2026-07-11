const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const BlogPost = require('../models/BlogPost');
const Consultation = require('../models/Consultation');
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const categories = require('../utils/blogCategories');

// ---------- Login ----------
router.get('/admin/login', (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login', error: null });
});

router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPasswordPlain = process.env.ADMIN_PASSWORD || 'admin';

  // Supports either a plain-text ADMIN_PASSWORD in .env, or a pre-hashed
  // ADMIN_PASSWORD_HASH if you prefer not to keep the plain password on disk.
  let ok = false;
  if (process.env.ADMIN_PASSWORD_HASH) {
    ok = username === validUsername && (await bcrypt.compare(password || '', process.env.ADMIN_PASSWORD_HASH));
  } else {
    ok = username === validUsername && password === validPasswordPlain;
  }

  if (!ok) {
    return res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password.' });
  }

  req.session.isAdmin = true;
  res.redirect('/admin');
});

router.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// ---------- Dashboard ----------
router.get('/admin', requireAdmin, async (req, res) => {
  const [posts, consultations] = await Promise.all([
    BlogPost.find().sort({ createdAt: -1 }),
    Consultation.find().sort({ createdAt: -1 }).limit(20),
  ]);
  res.render('admin/dashboard', { title: 'Admin Dashboard', posts, consultations });
});

// ---------- Blog CRUD ----------
router.get('/admin/posts/new', requireAdmin, (req, res) => {
  res.render('admin/post-form', { title: 'New Blog Post', post: null, categories, error: null });
});

router.post('/admin/posts', requireAdmin, upload.single('coverImageFile'), async (req, res) => {
  try {
    const { title, category, excerpt, content, published, coverImageUrl } = req.body;
    const coverImage = req.file ? `/uploads/${req.file.filename}` : coverImageUrl || '';
    await BlogPost.create({
      title,
      category,
      excerpt,
      content,
      coverImage,
      published: published === 'on',
    });
    res.redirect('/admin');
  } catch (err) {
    res.render('admin/post-form', { title: 'New Blog Post', post: req.body, categories, error: err.message });
  }
});

router.get('/admin/posts/:id/edit', requireAdmin, async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) return res.redirect('/admin');
  res.render('admin/post-form', { title: 'Edit Blog Post', post, categories, error: null });
});

router.put('/admin/posts/:id', requireAdmin, upload.single('coverImageFile'), async (req, res) => {
  try {
    const { title, category, excerpt, content, published, coverImageUrl } = req.body;
    const update = { title, category, excerpt, content, published: published === 'on' };
    if (req.file) update.coverImage = `/uploads/${req.file.filename}`;
    else if (coverImageUrl) update.coverImage = coverImageUrl;

    await BlogPost.findByIdAndUpdate(req.params.id, update, { runValidators: true });
    res.redirect('/admin');
  } catch (err) {
    const post = await BlogPost.findById(req.params.id);
    res.render('admin/post-form', { title: 'Edit Blog Post', post, categories, error: err.message });
  }
});

router.delete('/admin/posts/:id', requireAdmin, async (req, res) => {
  await BlogPost.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

// ---------- Consultation inbox ----------
router.put('/admin/consultations/:id/status', requireAdmin, async (req, res) => {
  await Consultation.findByIdAndUpdate(req.params.id, { status: req.body.status });
  res.redirect('/admin');
});

router.delete('/admin/consultations/:id', requireAdmin, async (req, res) => {
  await Consultation.findByIdAndDelete(req.params.id);
  res.redirect('/admin');
});

module.exports = router;
