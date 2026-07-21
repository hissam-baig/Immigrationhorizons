const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const services = require('../utils/services');

const STATIC_ROUTES = [
  '/', '/services', '/about', '/reviews', '/blog', '/consultation', '/contact',
  '/privacy', '/terms', '/resources', '/free-evaluation', '/book-consultation',
  ...services.map((s) => `/services/${s.slug}`),
];

function buildLlmSummary(siteUrl) {
  const serviceLines = services.map((service) => `- ${service.name}: ${siteUrl}/services/${service.slug}`).join('\n');

  return [
    'Immigration Horizons',
    '',
    'Website summary',
    'Immigration Horizons prepares immigration petition documents and strategy for EB-2 NIW, EB-1A, EB-1B, and EB-1C cases. The site also publishes blog content, client reviews, and consultation details.',
    '',
    'Preferred pages',
    `- Home: ${siteUrl}/`,
    `- Services: ${siteUrl}/services`,
    `- About: ${siteUrl}/about`,
    `- Reviews: ${siteUrl}/reviews`,
    `- Blog: ${siteUrl}/blog`,
    `- Consultation: ${siteUrl}/consultation`,
    `- Contact: ${siteUrl}/contact`,
    '',
    'Services',
    serviceLines,
    '',
    'Important notes',
    '- The business provides petition preparation, drafting, and document support, not legal representation before USCIS or any court.',
    '- Core deliverables include petition letters, recommendation letters, expert opinion letters, business plans, personal statements, and RFE / NOID responses.',
    '- The site uses public reviews and blog posts as supporting credibility content.',
    '',
    'Contact',
    `- Email: ${process.env.CONTACT_RECEIVER_EMAIL || 'smartforce54@gmail.com'}`,
    `- WhatsApp 1: +${process.env.WHATSAPP_NUMBER_1 || '923305507598'}`,
    `- WhatsApp 2: +${process.env.WHATSAPP_NUMBER_2 || '923418883635'}`,
  ].join('\n');
}

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
  const sections = [
    ['Googlebot', 'Allow: /'],
    ['Bingbot', 'Allow: /'],
    ['GPTBot', 'Allow: /'],
    ['ClaudeBot', 'Allow: /'],
    ['PerplexityBot', 'Allow: /'],
    ['AppleBot', 'Allow: /'],
    ['*', 'Allow: /'],
  ];
  const lines = sections.flatMap(([agent, rule]) => [
    `User-agent: ${agent}`,
    rule,
    'Disallow: /admin',
    'Disallow: /api',
    'Disallow: /private',
    '',
  ]);
  lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
  res.type('text/plain').send(lines.join('\n'));
});

router.get('/llms.txt', (req, res) => {
  const siteUrl = res.locals.siteUrl;
  res.type('text/plain').send(buildLlmSummary(siteUrl));
});

module.exports = router;
