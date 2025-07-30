import axios from 'axios';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
    return cookies;
  }, {});
}

export default async function handler(req, res) {
  console.log('Mobile auth test endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.ghl_access_token;
  
  console.log('Cookies received:', Object.keys(cookies));
  console.log('Access token present:', !!accessToken);

  if (!accessToken) {
    return res.status(401).json({ 
      error: 'No access token available',
      message: 'Please authenticate via OAuth first',
      cookies: Object.keys(cookies),
      userAgent: req.headers['user-agent']
    });
  }

  try {
    // Test a simple API call
    const testResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Authentication working',
      userInfo: testResponse.data,
      userAgent: req.headers['user-agent']
    });

  } catch (error) {
    console.error('Error testing mobile auth:', error.response?.data || error.message);
    
    return res.status(500).json({
      error: 'Authentication test failed',
      details: error.response?.data || error.message,
      userAgent: req.headers['user-agent'],
      cookies: Object.keys(cookies)
    });
  }
} 