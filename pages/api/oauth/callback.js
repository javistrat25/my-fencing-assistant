import axios from 'axios';
import qs from 'qs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('OAuth callback received');
  console.log('Query parameters:', req.query);
  console.log('Headers:', req.headers);

  const code = req.query.code;
  console.log('Authorization code:', code);

  if (!code) {
    console.log('No authorization code provided');
    return res.status(400).json({ error: 'No code provided' });
  }

  if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
    console.log('GHL credentials not configured');
    return res.status(500).json({ error: 'GHL credentials not configured' });
  }

  try {
    console.log('Exchanging code for token...');
    console.log('Using client ID:', process.env.GHL_CLIENT_ID ? 'Set' : 'Not set');
    console.log('Using client secret:', process.env.GHL_CLIENT_SECRET ? 'Set' : 'Not set');
    
    const tokenData = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://my-fencing-assistant.vercel.app/api/oauth/callback',
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      user_type: 'Location'
    };
    
    console.log('Token request data:', { ...tokenData, client_secret: '***' });
    
    const tokenResponse = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      qs.stringify(tokenData),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    console.log('Token obtained successfully');
    console.log('Access token length:', access_token ? access_token.length : 0);
    console.log('Token type:', tokenResponse.data.token_type);
    console.log('Expires in:', expires_in);

    // Store tokens in cookies with proper settings for Vercel
    const cookieOptions = [
      `ghl_access_token=${access_token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${expires_in}`
    ].join('; ');

    const refreshCookieOptions = [
      `ghl_refresh_token=${refresh_token}`,
      'Path=/',
      'HttpOnly', 
      'SameSite=Lax',
      'Max-Age=2592000'
    ].join('; ');

    res.setHeader('Set-Cookie', [cookieOptions, refreshCookieOptions]);

    // Redirect back to the main app with success
    res.redirect(302, `/?auth=success&message=Authentication successful! You can now use the API endpoints.`);
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    console.error('Full error:', error);
    
    // Return a more detailed error response
    res.status(500).json({ 
      error: 'Failed to exchange code for token',
      details: error.response?.data || error.message,
      message: 'Check server logs for more details'
    });
  }
}