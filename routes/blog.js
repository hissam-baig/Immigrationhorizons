const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const Comment = require('../models/Comment');
const categories = require('../utils/blogCategories');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function loadRelatedAndComments(post) {
  const [related, comments] = await Promise.all([
    BlogPost.find({
      category: post.category,
      published: true,
      _id: { $ne: post._id },
    })
      .sort({ createdAt: -1 })
      .limit(3),
    Comment.find({ post: post._id }).sort({ createdAt: -1 }),
  ]);
  return { related, comments };
}

// List published posts, with optional ?category filter and ?q search
router.get('/blog', async (req, res) => {
  const { category, q } = req.query;
  const filter = { published: true };
  if (category) filter.category = category;
  if (q) {
    const safe = escapeRegex(q.trim());
    filter.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { excerpt: { $regex: safe, $options: 'i' } },
    ];
  }

  let posts = [];
  let dbError = false;
  try {
    posts = await BlogPost.find(filter).sort({ createdAt: -1 });
  } catch (err) {
    dbError = true;
  }

  res.render('blog/index', {
    title: 'Immigration Blog | Immigration Horizons',
    description: 'Notes on EB-2 NIW, EB-1A, EB-1B and EB-1C strategy, RFE responses, and USCIS policy updates.',
    keywords: 'Immigration blog, EB-2 NIW blog, EB-1A blog, USCIS updates, RFE guide, immigration news',
    posts,
    categories,
    activeCategory: category || null,
    q: q || '',
    dbError,
  });
});

// Single post by slug
router.get('/blog/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, published: true });
    if (!post) return res.status(404).render('blog/post', { title: 'Post not found', post: null });

    const { related, comments } = await loadRelatedAndComments(post);

    res.render('blog/post', {
      title: `${post.title} | Immigration Horizons Blog`,
      description: post.excerpt ? post.excerpt.slice(0, 160) : undefined,
      keywords: `${post.title}, immigration blog, EB-2 NIW, EB-1A, USCIS updates`,
      post,
      related,
      comments,
      commentError: null,
    });
  } catch (err) {
    res.status(500).render('blog/post', { title: 'Error', post: null });
  }
});

// Submit a comment on a post
router.post('/blog/:slug/comments', async (req, res) => {
  const { name, message, website } = req.body;

  if (website) {
    // Honeypot tripped — silently pretend success, don't save.
    return res.redirect(`/blog/${req.params.slug}#comments`);
  }

  try {
    const post = await BlogPost.findOne({ slug: req.params.slug, published: true });
    if (!post) return res.status(404).render('blog/post', { title: 'Post not found', post: null });

    if (!name || !message) {
      const { related, comments } = await loadRelatedAndComments(post);
      return res.render('blog/post', {
        title: `${post.title} | Immigration Horizons Blog`,
        description: post.excerpt ? post.excerpt.slice(0, 160) : undefined,
        keywords: `${post.title}, immigration blog, EB-2 NIW, EB-1A, USCIS updates`,
        post,
        related,
        comments,
        commentError: 'Please fill in your name and a comment before submitting.',
      });
    }

    await Comment.create({ post: post._id, name, message });
    res.redirect(`/blog/${req.params.slug}#comments`);
  } catch (err) {
    res.status(500).render('blog/post', { title: 'Error', post: null });
  }
});

module.exports = router;
