import axios from 'axios';
import qs from 'qs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const code = req.query.code;
  console.log('Authorization code:', code);

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GHL credentials not configured' });
  }

  try {
    const tokenResponse = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://my-fencing-assistant.vercel.app/api/oauth/callback',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log('Token obtained successfully');

    // Store tokens in cookies with simplified settings
    res.setHeader('Set-Cookie', [
      `ghl_access_token=${access_token}; Path=/; HttpOnly; Max-Age=${expires_in}`,
      `ghl_refresh_token=${refresh_token}; Path=/; HttpOnly; Max-Age=2592000` // 30 days
    ]);

    // Redirect back to the main app with success
    res.redirect(302, `/?auth=success&message=Authentication successful! You can now use the API endpoints.`);
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
}