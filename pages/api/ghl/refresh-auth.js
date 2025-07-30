import axios from 'axios';
import qs from 'qs';

// Manual cookie parser to avoid import issues
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

export default async function handler(req, res) {
  console.log('Refresh auth endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get refresh token
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies.ghl_refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      error: 'No refresh token available. Please re-authenticate via OAuth.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Attempting to refresh token...');
    
    const tokenData = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET
    };
    
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
    console.log('Token refreshed successfully');
    console.log('New access token length:', access_token ? access_token.length : 0);
    console.log('New expires in:', expires_in);

    // Store new tokens in cookies
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

    // Test the new token immediately
    try {
      const testResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      const user = testResponse.data;
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        },
        tokenInfo: {
          expiresIn: expires_in,
          tokenType: tokenResponse.data.token_type
        }
      });
      
    } catch (testError) {
      console.error('Test with new token failed:', testError.response?.data || testError.message);
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed but test failed',
        warning: 'The new token may still have permission issues',
        error: testError.response?.data || testError.message
      });
    }
    
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to refresh token',
      details: error.response?.data || error.message,
      recommendation: 'You may need to re-authenticate via /api/auth'
    });
  }
} 