const { Resend } = require('resend');

let resendClient = null;

function getResendClient() {
  if (resendClient) return resendClient;

  const { RESEND_API_KEY } = process.env;

  if (!RESEND_API_KEY) {
    console.warn(
      '[mailer] RESEND_API_KEY not set. Consultation request emails will not be sent ' +
      '(submissions are still saved to the database and visible in /admin).'
    );
    return null;
  }

  resendClient = new Resend(RESEND_API_KEY);
  return resendClient;
}

async function sendConsultationEmail(consultation) {
  const client = getResendClient();
  if (!client) return false;

  const from = process.env.EMAIL_FROM || 'Immigration Horizons Website <onboarding@resend.dev>';
  const receiver = process.env.CONTACT_RECEIVER_EMAIL;

  if (!receiver) {
    console.warn('[mailer] CONTACT_RECEIVER_EMAIL not set. Skipping consultation email.');
    return false;
  }

  const isContact = consultation.source === 'contact';
  const heading = isContact ? 'New Contact Form Message' : 'New Free Consultation Request';

  const html = `
    <h2>${heading}</h2>
    <p><strong>Name:</strong> ${escapeHtml(consultation.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(consultation.email)}</p>
    ${!isContact ? `<p><strong>Phone:</strong> ${escapeHtml(consultation.phone || '-')}</p>` : ''}
    ${!isContact ? `<p><strong>Service Interested In:</strong> ${escapeHtml(consultation.service)}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(consultation.message).replace(/\n/g, '<br>')}</p>
    ${consultation.attachmentUrl ? `<p><strong>Attachment:</strong> <a href="${process.env.SITE_URL || ''}${consultation.attachmentUrl}">${escapeHtml(consultation.attachmentUrl)}</a></p>` : ''}
    <hr>
    <p style="color:#888;font-size:12px;">Submitted via immigrationhorizons.com on ${new Date().toLocaleString()}</p>
  `;

  try {
    const { error } = await client.emails.send({
      from,
      to: receiver,
      replyTo: consultation.email,
      subject: isContact
        ? `New Contact Message - ${consultation.name}`
        : `New Consultation Request - ${consultation.service} - ${consultation.name}`,
      html,
    });

    if (error) {
      console.error('[mailer] Failed to send consultation email:', error.message || error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[mailer] Failed to send consultation email:', err.message);
    return false;
  }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = { sendConsultationEmail };
