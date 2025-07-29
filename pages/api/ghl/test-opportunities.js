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
  console.log('Test opportunities endpoint called');
  
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

  try {
    console.log('Testing opportunities API...');
    
    // First, get locations
    const locationsResponse = await axios.get('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
    
    const locations = locationsResponse.data.locations || [];
    console.log(`Found ${locations.length} locations`);
    
    if (locations.length === 0) {
      return res.status(500).json({
        error: 'No locations found',
        message: 'OAuth token has no access to any locations'
      });
    }
    
    const locationId = locations[0].id;
    console.log('Using location ID:', locationId);
    
    // Get all opportunities
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: locationId,
        limit: 50
      }
    });
    
    const opportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Found ${opportunities.length} opportunities`);
    
    // Show all opportunities with their details
    const opportunityDetails = opportunities.map(opp => ({
      id: opp.id,
      name: opp.name,
      status: opp.status,
      pipelineStageId: opp.pipelineStageId,
      pipelineId: opp.pipelineId,
      contact: opp.contact?.name || 'No contact',
      monetaryValue: opp.monetaryValue,
      createdAt: opp.createdAt
    }));
    
    res.status(200).json({
      success: true,
      message: 'Opportunities test successful',
      totalOpportunities: opportunities.length,
      locationId: locationId,
      locationName: locations[0].name,
      opportunities: opportunityDetails,
      // Show first 5 opportunities for inspection
      sampleOpportunities: opportunityDetails.slice(0, 5)
    });
    
  } catch (error) {
    console.error('Error testing opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test opportunities',
      details: error.response?.data || error.message,
      message: 'Check if OAuth token is valid'
    });
  }
}