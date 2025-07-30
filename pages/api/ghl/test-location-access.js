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
  console.log('Test location access endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.ghl_access_token;

  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  const tests = [];

  try {
    console.log('Testing different location access approaches...');
    
    // Test 1: Try without location_id
    try {
      console.log('Test 1: Contacts without location_id');
      const response1 = await axios.get('https://services.leadconnectorhq.com/contacts/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          limit: 5
        }
      });
      
      tests.push({
        test: 'contacts without location_id',
        status: 'SUCCESS',
        count: response1.data.contacts?.length || 0,
        message: 'Contacts endpoint works without location_id'
      });
      
    } catch (error) {
      tests.push({
        test: 'contacts without location_id',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 2: Try with different API version
    try {
      console.log('Test 2: Contacts with different API version');
      const response2 = await axios.get('https://services.leadconnectorhq.com/contacts/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: 'hhgoXNHThJUYz4r3qS18',
          limit: 5
        }
      });
      
      tests.push({
        test: 'contacts with location_id',
        status: 'SUCCESS',
        count: response2.data.contacts?.length || 0,
        message: 'Contacts endpoint works with location_id'
      });
      
    } catch (error) {
      tests.push({
        test: 'contacts with location_id',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 3: Try different contacts endpoint
    try {
      console.log('Test 3: Different contacts endpoint');
      const response3 = await axios.get('https://services.leadconnectorhq.com/contacts/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: 'hhgoXNHThJUYz4r3qS18',
          limit: 5
        }
      });
      
      tests.push({
        test: 'contacts/search endpoint',
        status: 'SUCCESS',
        count: response3.data.contacts?.length || 0,
        message: 'Contacts search endpoint works'
      });
      
    } catch (error) {
      tests.push({
        test: 'contacts/search endpoint',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 4: Check what scopes we actually have
    try {
      console.log('Test 4: Check token scopes');
      const response4 = await axios.get('https://services.leadconnectorhq.com/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      tests.push({
        test: 'user info (to check scopes)',
        status: 'SUCCESS',
        user: response4.data,
        message: 'User info retrieved successfully'
      });
      
    } catch (error) {
      tests.push({
        test: 'user info (to check scopes)',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 5: Try to get available locations
    try {
      console.log('Test 5: Get available locations');
      const response5 = await axios.get('https://services.leadconnectorhq.com/locations/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      tests.push({
        test: 'available locations',
        status: 'SUCCESS',
        locations: response5.data.locations || [],
        message: 'Locations retrieved successfully'
      });
      
    } catch (error) {
      tests.push({
        test: 'available locations',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }

    res.status(200).json({
      success: true,
      tests: tests,
      summary: {
        totalTests: tests.length,
        successfulTests: tests.filter(test => test.status === 'SUCCESS').length,
        failedTests: tests.filter(test => test.status === 'FAILED').length
      }
    });
    
  } catch (error) {
    console.error('Error testing location access:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test location access',
      details: error.response?.data || error.message
    });
  }
} 