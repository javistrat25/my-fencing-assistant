import axios from 'axios';

export default async function handler(req, res) {
  console.log('Mobile auth endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try multiple ways to get the access token
  let accessToken = null;
  
  // Method 1: Try cookies (desktop)
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
      return cookies;
    }, {});
    accessToken = cookies.ghl_access_token;
    console.log('Method 1: Found token in cookies');
  }
  
  // Method 2: Try Authorization header (mobile-friendly)
  if (!accessToken && req.headers.authorization) {
    accessToken = req.headers.authorization.replace('Bearer ', '');
    console.log('Method 2: Found token in Authorization header');
  }
  
  // Method 3: Try query parameter (fallback for mobile)
  if (!accessToken && req.query.token) {
    accessToken = req.query.token;
    console.log('Method 3: Found token in query parameter');
  }

  if (!accessToken) {
    return res.status(401).json({ 
      error: 'No access token available',
      message: 'Please authenticate via OAuth first',
      cookies: req.headers.cookie ? Object.keys(req.headers.cookie.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
        return cookies;
      }, {})) : [],
      userAgent: req.headers['user-agent'],
      methods: 'Try: 1) Desktop cookies, 2) Authorization header, 3) Query parameter'
    });
  }

  try {
    // Test the token with a simple API call
    const testResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Mobile authentication working',
      userInfo: testResponse.data,
      userAgent: req.headers['user-agent'],
      method: 'mobile-auth'
    });

  } catch (error) {
    console.error('Error testing mobile auth:', error.response?.data || error.message);
    
    return res.status(500).json({
      error: 'Authentication test failed',
      details: error.response?.data || error.message,
      userAgent: req.headers['user-agent']
    });
  }
} 