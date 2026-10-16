// CampusLend - 24BCE0246 Amani Yadav & 24BCE2516 Sanjana B S
// Google OAuth 2.0 Configuration

import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * Returns whether real Google OAuth credentials have been supplied in .env
 */
export function isGoogleOAuthConfigured() {
  const cid = process.env.GOOGLE_CLIENT_ID || '';
  const csecret = process.env.GOOGLE_CLIENT_SECRET || '';
  return (
    cid &&
    !cid.includes('your-google-client-id') &&
    !cid.includes('placeholder') &&
    csecret &&
    !csecret.includes('your-google-client-secret')
  );
}

/**
 * Returns the Google OAuth authorization URL.
 */
export function getGoogleAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'select_account',
  });
}

/**
 * Exchanges the authorization code for tokens, fetches user info,
 * and validates the email domain.
 * @param {string} code - Authorization code from Google callback
 * @returns {{ id, email, name, picture }} - Google user info
 */
export async function getGoogleUser(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  // Validate college domain (@vitstudent.ac.in or @vit.ac.in)
  const email = (data.email || '').toLowerCase().trim();
  const isVitStudent = email.endsWith('@vitstudent.ac.in');
  const isVitStaff = email.endsWith('@vit.ac.in');

  if (!isVitStudent && !isVitStaff) {
    const err = new Error('Access restricted to VIT email addresses (@vitstudent.ac.in or @vit.ac.in).');
    err.statusCode = 403;
    throw err;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    picture: data.picture,
  };
}

export default oauth2Client;
