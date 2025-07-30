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
  console.log('Check permissions endpoint called');
  
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

  const permissionTests = [];

  try {
    console.log('Testing various API endpoints to check permissions...');
    
    // Test 1: Opportunities endpoint (we know this works but might be limited)
    try {
      const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: 'hhgoXNHThJUYz4r3qS18',
          limit: 100
        }
      });
      
      const opportunities = opportunitiesResponse.data.opportunities || [];
      permissionTests.push({
        endpoint: 'opportunities/search',
        status: 'SUCCESS',
        count: opportunities.length,
        message: `Found ${opportunities.length} opportunities`
      });
      
      // Log the actual opportunities to see what we're getting
      console.log('Opportunities found:');
      opportunities.forEach((opp, index) => {
        console.log(`${index + 1}. ${opp.name} - Contact: ${opp.contact?.name || 'No contact'} - Stage: ${opp.pipelineStageId}`);
      });
      
    } catch (error) {
      permissionTests.push({
        endpoint: 'opportunities/search',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 2: Contacts endpoint
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
      permissionTests.push({
        endpoint: 'contacts/',
        status: 'SUCCESS',
        count: contacts.length,
        message: `Found ${contacts.length} contacts`
      });
      
    } catch (error) {
      permissionTests.push({
        endpoint: 'contacts/',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 3: Pipelines endpoint
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
      permissionTests.push({
        endpoint: 'pipelines/',
        status: 'SUCCESS',
        count: pipelines.length,
        message: `Found ${pipelines.length} pipelines`
      });
      
    } catch (error) {
      permissionTests.push({
        endpoint: 'pipelines/',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 4: Locations endpoint
    try {
      const locationsResponse = await axios.get('https://services.leadconnectorhq.com/locations/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      const locations = locationsResponse.data.locations || [];
      permissionTests.push({
        endpoint: 'locations/',
        status: 'SUCCESS',
        count: locations.length,
        message: `Found ${locations.length} locations`
      });
      
    } catch (error) {
      permissionTests.push({
        endpoint: 'locations/',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 5: User info endpoint
    try {
      const userResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      const user = userResponse.data;
      permissionTests.push({
        endpoint: 'users/me',
        status: 'SUCCESS',
        message: `User: ${user.firstName} ${user.lastName} (${user.email})`
      });
      
    } catch (error) {
      permissionTests.push({
        endpoint: 'users/me',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }

    res.status(200).json({
      success: true,
      permissionTests: permissionTests,
      summary: {
        totalTests: permissionTests.length,
        successfulTests: permissionTests.filter(test => test.status === 'SUCCESS').length,
        failedTests: permissionTests.filter(test => test.status === 'FAILED').length
      }
    });
    
  } catch (error) {
    console.error('Error checking permissions:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to check permissions',
      details: error.response?.data || error.message
    });
  }
} 