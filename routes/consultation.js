const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const { sendConsultationEmail } = require('../utils/mailer');
const { appendConsultationToSheet } = require('../utils/sheets');
const uploadDocument = require('../middleware/uploadDocument');
const services = require('../utils/services');

function getTrackingFields(req) {
  const source = req.body || req.query || {};
  return {
    utmSource: source.utm_source || '',
    utmMedium: source.utm_medium || '',
    utmCampaign: source.utm_campaign || '',
    utmTerm: source.utm_term || '',
    utmContent: source.utm_content || '',
    gclid: source.gclid || '',
    fbclid: source.fbclid || '',
    landingPage: `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`,
    referrer: req.get('referer') || '',
  };
}

const CONSULTATION_TITLE = 'Book a Free Consultation | Immigration Horizons';
const CONTACT_TITLE = 'Contact Us | Immigration Horizons';

// ---------- Free Consultation (full form) ----------
router.get('/consultation', (req, res) => {
  res.render('consultation', {
    title: CONSULTATION_TITLE,
    description: 'Book a free consultation for your EB-2 NIW, EB-1A, EB-1B or EB-1C petition.',
    keywords: 'free consultation, EB-2 NIW consultation, EB-1A consultation, EB-1B consultation, EB-1C consultation, immigration petition review',
    services,
    prefillService: req.query.service || null,
    trackingParams: res.locals.trackingParams || {},
    submitted: false,
    error: null,
  });
});

router.post('/consultation', (req, res, next) => {
  uploadDocument.single('attachment')(req, res, (err) => {
    if (err) {
      return res.render('consultation', {
        title: CONSULTATION_TITLE,
        keywords: 'free consultation, EB-2 NIW consultation, EB-1A consultation, EB-1B consultation, EB-1C consultation, immigration petition review',
        services,
        prefillService: null,
        submitted: false,
        error: err.message || 'That file could not be uploaded. Please try a PDF, DOC, or DOCX under 8MB.',
      });
    }
    next();
  });
}, async (req, res) => {
  const { name, email, phone, service, message, website } = req.body;

  if (website) {
    // Honeypot tripped — silently pretend success, don't save/email.
    return res.render('consultation', {
      title: CONSULTATION_TITLE,
      keywords: 'free consultation, EB-2 NIW consultation, EB-1A consultation, EB-1B consultation, EB-1C consultation, immigration petition review',
      services,
      prefillService: null,
      submitted: true,
      error: null,
    });
  }

  if (!name || !email || !service || !message) {
    return res.render('consultation', {
      title: CONSULTATION_TITLE,
      keywords: 'free consultation, EB-2 NIW consultation, EB-1A consultation, EB-1B consultation, EB-1C consultation, immigration petition review',
      services,
      prefillService: service || null,
      submitted: false,
      error: 'Please fill in your name, email, service, and a short description before submitting.',
    });
  }

  try {
    const attachmentUrl = req.file ? `/uploads/resumes/${req.file.filename}` : '';
    const consultation = await Consultation.create({
      name,
      email,
      phone,
      service,
      message,
      attachmentUrl,
      source: 'consultation',
      ...getTrackingFields(req),
    });

    const [sent] = await Promise.all([
      sendConsultationEmail(consultation),
      appendConsultationToSheet(consultation),
    ]);

    if (sent) {
      consultation.emailSent = true;
      await consultation.save();
    }
  } catch (err) {
    console.error('[consultation] Failed to save/send consultation request:', err.message);
    const isDbTimeout = /buffering timed out|timed out after/i.test(err.message);
    return res.render('consultation', {
      title: CONSULTATION_TITLE,
      keywords: 'free consultation, EB-2 NIW consultation, EB-1A consultation, EB-1B consultation, EB-1C consultation, immigration petition review',
      services,
      prefillService: null,
      submitted: false,
      error: isDbTimeout
        ? "We're having trouble reaching our database right now. Please try again in a minute, or reach us directly on WhatsApp."
        : 'Something went wrong submitting your request. Please try again, or reach us directly on WhatsApp.',
    });
  }

  res.render('consultation', {
    title: CONSULTATION_TITLE,
    keywords: 'free consultation, EB-2 NIW consultation, EB-1A consultation, EB-1B consultation, EB-1C consultation, immigration petition review',
    services,
    prefillService: null,
    submitted: true,
    error: null,
  });
});

// ---------- Contact (short form) ----------
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: CONTACT_TITLE,
    description: 'Get in touch with Immigration Horizons by WhatsApp, email, or a short message.',
    keywords: 'contact Immigration Horizons, immigration consultant contact, WhatsApp immigration help, EB-2 NIW contact',
    trackingParams: res.locals.trackingParams || {},
    submitted: false,
    error: null,
  });
});

router.post('/contact', async (req, res) => {
  const { name, email, message, website } = req.body;

  if (website) {
    return res.render('contact', {
      title: CONTACT_TITLE,
      keywords: 'contact Immigration Horizons, immigration consultant contact, WhatsApp immigration help, EB-2 NIW contact',
      submitted: true,
      error: null,
    });
  }

  if (!name || !email || !message) {
    return res.render('contact', {
      title: CONTACT_TITLE,
      keywords: 'contact Immigration Horizons, immigration consultant contact, WhatsApp immigration help, EB-2 NIW contact',
      submitted: false,
      error: 'Please fill in your name, email, and message before submitting.',
    });
  }

  try {
    const consultation = await Consultation.create({
      name,
      email,
      message,
      source: 'contact',
      ...getTrackingFields(req),
    });

    const [sent] = await Promise.all([
      sendConsultationEmail(consultation),
      appendConsultationToSheet(consultation),
    ]);

    if (sent) {
      consultation.emailSent = true;
      await consultation.save();
    }
  } catch (err) {
    console.error('[contact] Failed to save/send contact message:', err.message);
    const isDbTimeout = /buffering timed out|timed out after/i.test(err.message);
    return res.render('contact', {
      title: CONTACT_TITLE,
      keywords: 'contact Immigration Horizons, immigration consultant contact, WhatsApp immigration help, EB-2 NIW contact',
      submitted: false,
      error: isDbTimeout
        ? "We're having trouble reaching our database right now. Please try again in a minute, or reach us directly on WhatsApp."
        : 'Something went wrong sending your message. Please try again, or reach us directly on WhatsApp.',
    });
  }

  res.render('contact', {
    title: CONTACT_TITLE,
    keywords: 'contact Immigration Horizons, immigration consultant contact, WhatsApp immigration help, EB-2 NIW contact',
    submitted: true,
    error: null,
  });
});

module.exports = router;
