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
  console.log('Test simple endpoint called');
  
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
    console.log('Testing different API approaches...');
    
    const results = {};
    
    // Test 1: Try to get locations without specifying location_id
    try {
      console.log('Test 1: Getting locations without location_id...');
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
        locations: response1.data.locations || [],
        locationCount: (response1.data.locations || []).length
      };
    } catch (error) {
      results.test1 = {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message
      };
    }
    
    // Test 2: Try rest.gohighlevel.com endpoint
    try {
      console.log('Test 2: Trying rest.gohighlevel.com...');
      const response2 = await axios.get('https://rest.gohighlevel.com/v1/locations/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      results.test2 = {
        success: true,
        status: response2.status,
        locations: response2.data.locations || [],
        locationCount: (response2.data.locations || []).length
      };
    } catch (error) {
      results.test2 = {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message
      };
    }
    
    // Test 3: Try opportunities without location_id
    try {
      console.log('Test 3: Getting opportunities without location_id...');
      const response3 = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          limit: 10
        }
      });
      results.test3 = {
        success: true,
        status: response3.status,
        opportunities: response3.data.opportunities || [],
        opportunityCount: (response3.data.opportunities || []).length
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
        test3_success: results.test3?.success || false,
        availableLocations: results.test1?.locations || results.test2?.locations || []
      }
    });
    
  } catch (error) {
    console.error('Error testing API approaches:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test API approaches',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
}