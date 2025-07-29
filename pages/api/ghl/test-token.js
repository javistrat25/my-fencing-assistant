import axios from 'axios';

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
  console.log('Test token endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  console.log('Cookies received:', Object.keys(cookies));
  const accessToken = cookies.ghl_access_token;
  
  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  // Test the token with a simple GHL API call
  try {
    console.log('Testing token with GHL API...');
    
    const response = await axios.get('https://rest.gohighlevel.com/v1/contacts/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Token is valid for API calls',
      data: response.data
    });
  } catch (error) {
    console.error('Token test failed:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Token test failed',
      details: error.response?.data || error.message,
      tokenInfo: {
        length: accessToken.length,
        preview: accessToken.substring(0, 20) + '...',
        isBearer: accessToken.startsWith('Bearer')
      }
    });
  }
}