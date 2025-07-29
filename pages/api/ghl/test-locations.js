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
  console.log('Test locations endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.ghl_access_token;

  console.log('Cookies found:', Object.keys(cookies));
  console.log('Access token exists:', !!accessToken);

  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Testing locations API...');
    
    // Test different locations endpoints
    const results = {};
    
    // Test 1: services.leadconnectorhq.com/locations/
    try {
      console.log('Testing services.leadconnectorhq.com/locations/...');
      const response1 = await axios.get('https://services.leadconnectorhq.com/locations/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      results.test1 = {
        success: true,
        status: response1.status,
        data: response1.data
      };
    } catch (error) {
      results.test1 = {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message
      };
    }
    
    // Test 2: rest.gohighlevel.com/v1/locations/
    try {
      console.log('Testing rest.gohighlevel.com/v1/locations/...');
      const response2 = await axios.get('https://rest.gohighlevel.com/v1/locations/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      results.test2 = {
        success: true,
        status: response2.status,
        data: response2.data
      };
    } catch (error) {
      results.test2 = {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message
      };
    }
    
    // Test 3: Try the hardcoded location ID with opportunities
    try {
      console.log('Testing hardcoded location ID with opportunities...');
      const response3 = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: 'hhgoXNHThJUYz4r3qS18',
          limit: 10
        }
      });
      results.test3 = {
        success: true,
        status: response3.status,
        opportunitiesCount: response3.data.opportunities?.length || 0
      };
    } catch (error) {
      results.test3 = {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message
      };
    }

    res.status(200).json({
      success: true,
      results: results,
      summary: {
        test1_success: results.test1?.success || false,
        test2_success: results.test2?.success || false,
        test3_success: results.test3?.success || false
      }
    });
    
  } catch (error) {
    console.error('Error testing locations:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test locations',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
} 