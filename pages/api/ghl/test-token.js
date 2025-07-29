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
  console.log('Access token found:', !!accessToken);
  console.log('Access token length:', accessToken ? accessToken.length : 0);
  console.log('Access token preview:', accessToken ? accessToken.substring(0, 20) + '...' : 'none');
  
  if (!accessToken) {
    console.log('No access token available');
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Testing token with a simple GHL endpoint...');
    
    // Try a simple endpoint to test the token
    const response = await axios.get('https://services.leadconnectorhq.com/contacts/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        limit: 1
      }
    });
    
    console.log('Token test successful');
    
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      accessTokenLength: accessToken.length,
      accessTokenPreview: accessToken.substring(0, 20) + '...',
      testResult: 'GHL API access working',
      contactsCount: response.data.contacts?.length || 0
    });
    
  } catch (error) {
    console.error('Error testing token:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Token test failed',
      details: error.response?.data || error.message,
      accessTokenLength: accessToken.length,
      accessTokenPreview: accessToken.substring(0, 20) + '...',
      message: 'Token might be expired or invalid'
    });
  }
}