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
  console.log('Auto refresh token endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try multiple ways to get the access token
  let accessToken = null;
  let refreshToken = null;
  
  // Method 1: Try cookies (desktop)
  if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    accessToken = cookies.ghl_access_token;
    refreshToken = cookies.ghl_refresh_token;
    console.log('Method 1: Found tokens in cookies');
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
      methods: 'Try: 1) Desktop cookies, 2) Authorization header, 3) Query parameter'
    });
  }

  try {
    // First, test the current token
    const testResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });

    // If we get here, the token is still valid
    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      userInfo: testResponse.data,
      token: accessToken,
      needsRefresh: false
    });

  } catch (error) {
    console.error('Token test failed, attempting refresh:', error.response?.status);
    
    // If token is invalid and we have a refresh token, try to refresh
    if (error.response?.status === 401 && refreshToken) {
      try {
        console.log('Attempting to refresh token...');
        
        const refreshResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.GHL_CLIENT_ID,
          client_secret: process.env.GHL_CLIENT_SECRET
        });

        const newAccessToken = refreshResponse.data.access_token;
        const newRefreshToken = refreshResponse.data.refresh_token;

        // Test the new token
        const newTestResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
          headers: {
            'Authorization': `Bearer ${newAccessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        });

        return res.status(200).json({
          success: true,
          message: 'Token refreshed successfully',
          userInfo: newTestResponse.data,
          token: newAccessToken,
          refreshToken: newRefreshToken,
          needsRefresh: true
        });

      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
        return res.status(401).json({
          error: 'Token refresh failed',
          message: 'Please re-authenticate via OAuth',
          details: refreshError.response?.data || refreshError.message
        });
      }
    } else {
      // No refresh token or other error
      return res.status(401).json({
        error: 'Token is invalid',
        message: 'Please re-authenticate via OAuth',
        details: error.response?.data || error.message
      });
    }
  }
} 