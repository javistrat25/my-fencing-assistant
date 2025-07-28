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
        redirect_uri: `https://${process.env.VERCEL_URL}/api/oauth/callback`,
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

    res.status(200).json({
      success: true,
      message: 'Authentication successful! You can now use the API endpoints.',
      hasToken: !!access_token
    });
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
}