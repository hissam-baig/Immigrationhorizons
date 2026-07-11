const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const services = require('../utils/services');
const testimonials = require('../utils/testimonials');
const team = require('../utils/team');

const SITE_STATS = {
  casesHandled: '200+',
  yearsExperience: '5+',
  clientsWorldwide: true,
};

const WHY_US = [
  {
    title: 'Transparent, Personalized Case Strategy',
    text: 'Every case strategy is built around your specific credentials and goals, not a generic template.',
    icon: 'target',
  },
  {
    title: 'Custom-Drafted Documents',
    text: 'Petition letters, recommendation letters, and expert opinions are written from scratch for your case — no boilerplate.',
    icon: 'document',
  },
  {
    title: '200+ Cases Handled',
    text: 'Years of hands-on experience preparing self-petition immigration cases.',
    icon: 'briefcase',
  },
  {
    title: 'RFE Support',
    text: 'If your case receives a Request for Evidence, our team helps prepare a thorough response.',
    icon: 'shield',
  },
  {
    title: 'Efficient, Timely Preparation',
    text: 'A structured process keeps your case moving without unnecessary delays.',
    icon: 'clock',
  },
  {
    title: 'One Dedicated Point of Contact',
    text: 'You work with the same person from your first consultation through filing.',
    icon: 'headset',
  },
  {
    title: 'Global Client Base',
    text: 'Clients supported across multiple countries, comfortable working across time zones and, where needed, multiple languages.',
    icon: 'globe',
  },
  {
    title: 'Verified Track Record',
    text: 'Reviews and completed-case history are publicly viewable and verifiable on our Fiverr profile.',
    icon: 'badge',
  },
];

router.get('/', async (req, res) => {
  let recentPosts = [];
  try {
    recentPosts = await BlogPost.find({ published: true }).sort({ createdAt: -1 }).limit(6);
  } catch (err) {
    // DB may not be configured yet; fail quietly on the homepage
  }

  res.render('index', {
    title: 'Immigration Horizons | US Immigration Petition Specialists',
    services,
    testimonials: testimonials.slice(0, 3),
    stats: SITE_STATS,
    whyUs: WHY_US,
    team,
    recentPosts,
  });
});

router.get('/services', (req, res) => {
  res.render('services', {
    title: 'Our Services | Immigration Horizons',
    description: 'EB-2 NIW, EB-1A, EB-1B and EB-1C petition preparation — full petitions or single deliverables like recommendation letters, business plans, and RFE responses.',
    services,
  });
});

router.get('/services/:slug', (req, res) => {
  const service = services.find((s) => s.slug === req.params.slug);
  if (!service) {
    return res.status(404).render('404', { title: 'Service Not Found' });
  }
  res.render('service-detail', {
    title: `${service.name} — ${service.tagline} | Immigration Horizons`,
    description: service.description,
    service,
  });
});

router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us | Immigration Horizons',
    description: 'Immigration Horizons is an immigration consulting practice specializing in EB-2 NIW, EB-1A, EB-1B and EB-1C self-petitions, with 200+ cases handled and 5+ years of experience.',
    stats: SITE_STATS,
    team,
  });
});

router.get('/reviews', (req, res) => {
  res.render('reviews', {
    title: 'Client Reviews | Immigration Horizons',
    description: 'Verified client reviews and case-approval messages from Immigration Horizons\' Fiverr profile.',
    testimonials,
  });
});

module.exports = router;
