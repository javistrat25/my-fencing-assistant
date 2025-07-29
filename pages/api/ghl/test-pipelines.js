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
  console.log('Test pipelines endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.ghl_access_token;
  const locationId = 'hhgoXNHThJUYz4r3qS18';

  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Testing different pipeline endpoints...');
    
    const results = {};
    
    // Test 1: services.leadconnectorhq.com/pipelines/ with location_id
    try {
      console.log('Testing services.leadconnectorhq.com/pipelines/ with location_id...');
      const response1 = await axios.get('https://services.leadconnectorhq.com/pipelines/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: locationId
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
    
    // Test 2: services.leadconnectorhq.com/pipelines/ without location_id
    try {
      console.log('Testing services.leadconnectorhq.com/pipelines/ without location_id...');
      const response2 = await axios.get('https://services.leadconnectorhq.com/pipelines/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
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
    
    // Test 3: rest.gohighlevel.com/v1/pipelines/
    try {
      console.log('Testing rest.gohighlevel.com/v1/pipelines/...');
      const response3 = await axios.get('https://rest.gohighlevel.com/v1/pipelines/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      results.test3 = {
        success: true,
        status: response3.status,
        data: response3.data
      };
    } catch (error) {
      results.test3 = {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message
      };
    }
    
    // Test 4: services.leadconnectorhq.com/pipelines with different version
    try {
      console.log('Testing services.leadconnectorhq.com/pipelines with different version...');
      const response4 = await axios.get('https://services.leadconnectorhq.com/pipelines', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: locationId
        }
      });
      results.test4 = {
        success: true,
        status: response4.status,
        data: response4.data
      };
    } catch (error) {
      results.test4 = {
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
        test4_success: results.test4?.success || false
      }
    });
    
  } catch (error) {
    console.error('Error testing pipelines:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test pipelines',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
}