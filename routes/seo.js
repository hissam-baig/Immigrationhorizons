const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const services = require('../utils/services');

const STATIC_ROUTES = [
  '/', '/services', '/about', '/reviews', '/blog', '/consultation', '/contact',
  ...services.map((s) => `/services/${s.slug}`),
];

router.get('/sitemap.xml', async (req, res) => {
  const siteUrl = res.locals.siteUrl;
  let posts = [];
  try {
    posts = await BlogPost.find({ published: true }).select('slug updatedAt');
  } catch (err) {
    // DB may not be configured yet; sitemap still returns the static routes
  }

  const urls = [
    ...STATIC_ROUTES.map((path) => ({ loc: `${siteUrl}${path}` })),
    ...posts.map((post) => ({ loc: `${siteUrl}/blog/${post.slug}`, lastmod: post.updatedAt })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `
    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  res.type('application/xml').send(xml);
});

router.get('/robots.txt', (req, res) => {
  const siteUrl = res.locals.siteUrl;
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  );
});

module.exports = router;
