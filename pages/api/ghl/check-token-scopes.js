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
  console.log('Check token scopes endpoint called');
  
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

  const scopeTests = [];

  try {
    console.log('Testing token scopes and permissions...');
    
    // Test 1: Basic token validation - try to get user info
    try {
      const userResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      const user = userResponse.data;
      scopeTests.push({
        test: 'User Info (users/me)',
        status: 'SUCCESS',
        message: `User: ${user.firstName} ${user.lastName} (${user.email})`,
        data: user
      });
      
    } catch (error) {
      scopeTests.push({
        test: 'User Info (users/me)',
        status: 'FAILED',
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });
    }
    
    // Test 2: Try to get user's locations
    try {
      const locationsResponse = await axios.get('https://services.leadconnectorhq.com/locations/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      const locations = locationsResponse.data.locations || [];
      scopeTests.push({
        test: 'Locations (locations/)',
        status: 'SUCCESS',
        message: `Found ${locations.length} locations`,
        data: locations
      });
      
    } catch (error) {
      scopeTests.push({
        test: 'Locations (locations/)',
        status: 'FAILED',
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });
    }
    
    // Test 3: Try to get opportunities (this should work)
    try {
      const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
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
      
      const opportunities = opportunitiesResponse.data.opportunities || [];
      scopeTests.push({
        test: 'Opportunities (opportunities/search)',
        status: 'SUCCESS',
        message: `Found ${opportunities.length} opportunities`,
        data: opportunities.slice(0, 3) // Show first 3
      });
      
    } catch (error) {
      scopeTests.push({
        test: 'Opportunities (opportunities/search)',
        status: 'FAILED',
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });
    }
    
    // Test 4: Try contacts with different approaches
    try {
      const contactsResponse = await axios.get('https://services.leadconnectorhq.com/contacts/', {
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
      
      const contacts = contactsResponse.data.contacts || [];
      scopeTests.push({
        test: 'Contacts (contacts/)',
        status: 'SUCCESS',
        message: `Found ${contacts.length} contacts`,
        data: contacts.slice(0, 3) // Show first 3
      });
      
    } catch (error) {
      scopeTests.push({
        test: 'Contacts (contacts/)',
        status: 'FAILED',
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });
    }
    
    // Test 5: Try pipelines
    try {
      const pipelinesResponse = await axios.get('https://services.leadconnectorhq.com/pipelines/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: 'hhgoXNHThJUYz4r3qS18'
        }
      });
      
      const pipelines = pipelinesResponse.data.pipelines || [];
      scopeTests.push({
        test: 'Pipelines (pipelines/)',
        status: 'SUCCESS',
        message: `Found ${pipelines.length} pipelines`,
        data: pipelines
      });
      
    } catch (error) {
      scopeTests.push({
        test: 'Pipelines (pipelines/)',
        status: 'FAILED',
        error: error.response?.data || error.message,
        statusCode: error.response?.status
      });
    }

    // Analyze what we can and cannot access
    const successfulTests = scopeTests.filter(test => test.status === 'SUCCESS');
    const failedTests = scopeTests.filter(test => test.status === 'FAILED');
    
    const analysis = {
      totalTests: scopeTests.length,
      successfulTests: successfulTests.length,
      failedTests: failedTests.length,
      workingEndpoints: successfulTests.map(test => test.test),
      failingEndpoints: failedTests.map(test => test.test),
      recommendations: []
    };
    
    // Generate recommendations based on results
    if (failedTests.length > successfulTests.length) {
      analysis.recommendations.push('Your token has limited permissions. Consider re-authenticating with broader scopes.');
    }
    
    if (successfulTests.some(test => test.test.includes('Opportunities'))) {
      analysis.recommendations.push('Opportunities API works - we can extract contact data from opportunities.');
    }
    
    if (failedTests.some(test => test.test.includes('Contacts'))) {
      analysis.recommendations.push('Contacts API is not accessible - we\'ll need to work with opportunity data instead.');
    }

    res.status(200).json({
      success: true,
      scopeTests: scopeTests,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('Error checking token scopes:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to check token scopes',
      details: error.response?.data || error.message
    });
  }
} 