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
  console.log('Debug Token endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  console.log('Cookies received:', Object.keys(cookies));
  const accessToken = cookies.ghl_access_token;
  console.log('Access token found:', !!accessToken);
  
  if (!accessToken) {
    console.log('No access token available');
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  console.log('Testing OAuth token validity...');
  
  const testResults = {
    tokenLength: accessToken.length,
    tokenPreview: accessToken.substring(0, 20) + '...',
    tests: {}
  };

  // Test 1: Users endpoint (should work with valid token)
  try {
    console.log('Test 1: Testing users/lookup endpoint...');
    const usersResponse = await axios.get('https://services.leadconnectorhq.com/users/lookup', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    testResults.tests.usersLookup = {
      status: 'SUCCESS',
      statusCode: usersResponse.status,
      data: usersResponse.data
    };
    console.log('✅ Users lookup successful');
    
  } catch (error) {
    testResults.tests.usersLookup = {
      status: 'FAILED',
      statusCode: error.response?.status,
      error: error.response?.data || error.message
    };
    console.log('❌ Users lookup failed:', error.response?.status);
  }

  // Test 2: Locations endpoint (the one that was failing)
  try {
    console.log('Test 2: Testing locations endpoint...');
    const locationsResponse = await axios.get('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    testResults.tests.locations = {
      status: 'SUCCESS',
      statusCode: locationsResponse.status,
      data: locationsResponse.data
    };
    console.log('✅ Locations successful');
    
  } catch (error) {
    testResults.tests.locations = {
      status: 'FAILED',
      statusCode: error.response?.status,
      error: error.response?.data || error.message
    };
    console.log('❌ Locations failed:', error.response?.status);
  }

  // Test 3: Opportunities endpoint (what we actually need)
  try {
    console.log('Test 3: Testing opportunities endpoint...');
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      params: {
        limit: 10,
        status: 'open'
      }
    });
    
    testResults.tests.opportunities = {
      status: 'SUCCESS',
      statusCode: opportunitiesResponse.status,
      data: {
        total: opportunitiesResponse.data.opportunities?.length || 0,
        sample: opportunitiesResponse.data.opportunities?.slice(0, 3) || []
      }
    };
    console.log('✅ Opportunities successful');
    
  } catch (error) {
    testResults.tests.opportunities = {
      status: 'FAILED',
      statusCode: error.response?.status,
      error: error.response?.data || error.message
    };
    console.log('❌ Opportunities failed:', error.response?.status);
  }

  // Test 4: Alternative opportunities endpoint
  try {
    console.log('Test 4: Testing alternative opportunities endpoint...');
    const altOpportunitiesResponse = await axios.get('https://rest.gohighlevel.com/v1/opportunities/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 10,
        status: 'open'
      }
    });
    
    testResults.tests.altOpportunities = {
      status: 'SUCCESS',
      statusCode: altOpportunitiesResponse.status,
      data: {
        total: altOpportunitiesResponse.data.opportunities?.length || 0,
        sample: altOpportunitiesResponse.data.opportunities?.slice(0, 3) || []
      }
    };
    console.log('✅ Alternative opportunities successful');
    
  } catch (error) {
    testResults.tests.altOpportunities = {
      status: 'FAILED',
      statusCode: error.response?.status,
      error: error.response?.data || error.message
    };
    console.log('❌ Alternative opportunities failed:', error.response?.status);
  }

  // Summary
  const successfulTests = Object.values(testResults.tests).filter(test => test.status === 'SUCCESS').length;
  const totalTests = Object.keys(testResults.tests).length;
  
  testResults.summary = {
    totalTests,
    successfulTests,
    successRate: `${successfulTests}/${totalTests}`,
    tokenValid: successfulTests > 0
  };

  res.status(200).json({
    success: true,
    message: 'OAuth token debugging completed',
    ...testResults
  });
}