const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const services = require('../utils/services');
const testimonials = require('../utils/testimonials');
const team = require('../utils/team');

const LANDING_PAGES = {
  'eb2-niw': {
    slug: 'eb2-niw',
    title: 'EB2 NIW Petition Preparation | Immigration Horizons',
    description: 'Strategic EB-2 NIW petition preparation for professionals, researchers, engineers, doctors, and entrepreneurs seeking a National Interest Waiver.',
    keywords: 'EB2 NIW, National Interest Waiver, EB-2 NIW petition, EB-2 NIW service, NIW petition preparation',
    heroTag: 'National Interest Waiver',
    headline: 'EB-2 NIW petition strategy built for approval-focused submissions',
    subheadline: 'We prepare EB-2 NIW cases around the Dhanasar framework with a clear evidence narrative, polished drafting, and structured filing support.',
    ctaLabel: 'Book an EB-2 NIW Review',
    service: services.find((service) => service.slug === 'eb2-niw'),
    highlights: [
      'Proposed endeavor framing tailored to your background',
      'Recommendation letters and expert opinion drafting',
      'RFE / NOID response support when needed',
      'Business plan and personal statement development',
    ],
    faqs: [
      { q: 'Who is a good fit for EB-2 NIW?', a: 'Professionals with advanced degrees or exceptional ability whose work has substantial merit and national importance.' },
      { q: 'Do you help with a single deliverable?', a: 'Yes. You can hire us for one document or for a full petition package.' },
      { q: 'Can you help if I already received an RFE?', a: 'Yes. We regularly prepare focused RFE responses for existing cases.' },
    ],
  },
  'eb1a': {
    slug: 'eb1a',
    title: 'EB1A Extraordinary Ability Petition Help | Immigration Horizons',
    description: 'EB-1A petition drafting for extraordinary ability cases in science, business, education, arts, and athletics.',
    keywords: 'EB1A, EB-1A petition, extraordinary ability visa, EB-1A requirements, EB-1A petition help',
    heroTag: 'Extraordinary Ability',
    headline: 'EB-1A cases mapped to the strongest criteria from day one',
    subheadline: 'We identify the strongest evidence, shape the narrative, and prepare the documents USCIS expects to see in an EB-1A filing.',
    ctaLabel: 'Book an EB-1A Review',
    service: services.find((service) => service.slug === 'eb1a'),
    highlights: [
      'Criteria mapping and evidence selection',
      'Recommendation letters and expert opinions',
      'Exhibit packaging and filing order',
      'RFE / NOID response support',
    ],
    faqs: [
      { q: 'What evidence helps EB-1A most?', a: 'Awards, published material about you, judging, memberships, original contributions, publications, and comparable high-level evidence.' },
      { q: 'Can you review my profile before filing?', a: 'Yes. The consultation is designed to help you understand your strongest filing strategy.' },
      { q: 'Do you work with clients outside the US?', a: 'Yes. The service is built for global clients working across time zones.' },
    ],
  },
  'o1-visa': {
    slug: 'o1-visa',
    title: 'O1 Visa Petition Preparation | Immigration Horizons',
    description: 'O-1 visa petition strategy and drafting for individuals with extraordinary ability or extraordinary achievement.',
    keywords: 'O1 visa, O-1 visa petition, O-1 visa requirements, extraordinary ability visa, O-1 petition help',
    heroTag: 'O-1 Visa',
    headline: 'O-1 visa filings for high-achievement professionals and creators',
    subheadline: 'We help organize your record of accomplishment into a clean, persuasive petition package that is ready for premium submission.',
    ctaLabel: 'Book an O-1 Review',
    service: null,
    highlights: [
      'Petition narrative and evidence strategy',
      'Support letters and endorsement drafting',
      'Exhibit organization and filing-ready structure',
      'Premium-processing-friendly packet preparation',
    ],
    faqs: [
      { q: 'What kind of candidates fit O-1?', a: 'Applicants with sustained acclaim or a demonstrated record of extraordinary achievement in their field.' },
      { q: 'Can this work for creatives and business owners?', a: 'Yes. We structure the case around the field and the strongest available evidence.' },
      { q: 'Is this a full legal filing service?', a: 'We provide petition preparation and drafting support, not legal representation.' },
    ],
  },
};

function renderLandingPage(res, pageKey) {
  const page = LANDING_PAGES[pageKey];
  const relatedServices = services.filter((service) => !page.service || service.slug !== page.service.slug).slice(0, 3);

  return res.render('landing-page', {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    page,
    relatedServices,
  });
}

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
    keywords: 'EB-2 NIW, EB-1A, EB-1B, EB-1C, immigration petition preparation, recommendation letters, RFE response, petition drafting',
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
    keywords: 'Immigration services, EB-2 NIW services, EB-1A services, EB-1B services, EB-1C services, recommendation letters, RFE response, business plan',
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
    keywords: `${service.name}, ${service.tagline}, immigration petition preparation, USCIS petition support, recommendation letters, RFE response`,
    service,
  });
});

router.get('/eb2-niw', (req, res) => renderLandingPage(res, 'eb2-niw'));
router.get('/eb1a', (req, res) => renderLandingPage(res, 'eb1a'));
router.get('/o1-visa', (req, res) => renderLandingPage(res, 'o1-visa'));

router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us | Immigration Horizons',
    description: 'Immigration Horizons is an immigration consulting practice specializing in EB-2 NIW, EB-1A, EB-1B and EB-1C self-petitions, with 200+ cases handled and 5+ years of experience.',
    keywords: 'About Immigration Horizons, immigration consultant, EB-2 NIW specialist, EB-1A specialist, EB-1B specialist, EB-1C specialist',
    stats: SITE_STATS,
    team,
  });
});

router.get('/reviews', (req, res) => {
  res.render('reviews', {
    title: 'Client Reviews | Immigration Horizons',
    description: 'Verified client reviews and case-approval messages from Immigration Horizons\' Fiverr profile.',
    keywords: 'Immigration Horizons reviews, client testimonials, Fiverr reviews, immigration case approvals',
    testimonials,
  });
});

router.get('/privacy', (req, res) => {
  res.render('privacy', {
    title: 'Privacy Policy | Immigration Horizons',
    description: 'How Immigration Horizons collects, stores, and protects consultation and website data.',
    keywords: 'privacy policy, Immigration Horizons privacy, lead form data, website data protection',
  });
});

router.get('/terms', (req, res) => {
  res.render('terms', {
    title: 'Terms of Use | Immigration Horizons',
    description: 'Terms governing use of the Immigration Horizons website and consultation forms.',
    keywords: 'terms of use, Immigration Horizons terms, website terms, consultation terms',
  });
});

router.get('/resources', (req, res) => {
  res.render('resources', {
    title: 'Resources | Immigration Horizons',
    description: 'Helpful immigration resources, service links, and guidance pages for visitors.',
    keywords: 'immigration resources, EB-2 NIW resources, EB-1A resources, USCIS resources',
    services,
  });
});

router.get('/free-evaluation', (req, res) => res.redirect(301, '/consultation'));
router.get('/book-consultation', (req, res) => res.redirect(301, '/consultation'));

module.exports = router;
