const { google } = require('googleapis');

let sheetsClient = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
    console.warn(
      '[sheets] GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SHEET_ID not set. ' +
      'Consultation requests will not be synced to Google Sheets (still saved to the database).'
    );
    return null;
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function appendConsultationToSheet(consultation) {
  const sheets = getSheetsClient();
  if (!sheets) return false;

  const sheetName = process.env.GOOGLE_SHEET_TAB_NAME || 'Leads';

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          new Date(consultation.createdAt || Date.now()).toLocaleString(),
          consultation.name,
          consultation.email,
          consultation.phone || '',
          consultation.service || '',
          consultation.message,
          String(consultation._id || ''),
          consultation.attachmentUrl || '',
        ]],
      },
    });
    return true;
  } catch (err) {
    console.error('[sheets] Failed to append consultation to Google Sheet:', err.message);
    return false;
  }
}

module.exports = { appendConsultationToSheet };
