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
  console.log('Quote sent endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  console.log('Cookies received:', Object.keys(cookies));
  const accessToken = cookies.ghl_access_token;
  console.log('Access token found:', !!accessToken);
  
  const locationId = 'hhgoXNHThJUYz4r3qS18';

  if (!accessToken) {
    console.log('No access token available');
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Fetching quote sent opportunities...');
    
    // First, get the available locations for this token
    // let locationId = null; // This line is removed as locationId is now hardcoded
    // try {
    //   const locationsResponse = await axios.get('https://services.leadconnectorhq.com/locations/', {
    //     headers: {
    //       'Authorization': `Bearer ${accessToken}`,
    //       'Content-Type': 'application/json',
    //       'Version': '2021-07-28'
    //     }
    //   });
      
    //   const locations = locationsResponse.data.locations || [];
    //   console.log(`Found ${locations.length} locations`);
      
    //   if (locations.length > 0) {
    //     locationId = locations[0].id; // Use the first available location
    //     console.log('Using location ID:', locationId);
    //   } else {
    //     throw new Error('No locations available');
    //   }
      
    // } catch (locationError) {
    //   console.error('Error getting locations:', locationError.response?.data || locationError.message);
    //   return res.status(500).json({
    //     error: 'Failed to get location ID',
    //     details: locationError.response?.data || locationError.message
    //   });
    // }
    
    // Now get opportunities using the correct location ID
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: locationId,
        limit: 100,
        status: 'open'
      }
    });
    
    console.log('Opportunities fetched successfully');
    
    let opportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Found ${opportunities.length} total opportunities`);
    
    // Debug: Log first few opportunities to see their structure
    console.log('Sample opportunities structure:');
    opportunities.slice(0, 3).forEach((opp, index) => {
      console.log(`Opportunity ${index + 1}:`, {
        id: opp.id,
        name: opp.name,
        status: opp.status,
        pipelineStageId: opp.pipelineStageId,
        pipelineId: opp.pipelineId,
        contact: opp.contact?.name || 'No contact'
      });
    });
    
    // Filter for "Quote Sent" stage specifically (exact match, case-insensitive)
    const quoteSentOpportunities = opportunities.filter(opportunity => {
      const stageName = opportunity.pipelineStage?.name?.toLowerCase() || '';
      return stageName === 'quote sent';
    });
    
    console.log(`Found ${quoteSentOpportunities.length} quote sent opportunities out of ${opportunities.length} total`);

    res.status(200).json({
      success: true,
      opportunities: quoteSentOpportunities,
      total: quoteSentOpportunities.length,
      stage: 'Quote Sent',
      apiVersion: '2021-07-28',
      endpoint: 'services.leadconnectorhq.com/opportunities/search',
      allOpportunities: opportunities.length,
      locationId: locationId,
      // Debug: Return first few opportunities for inspection
      debug: {
        sampleOpportunities: opportunities.slice(0, 3).map(opp => ({
          id: opp.id,
          name: opp.name,
          status: opp.status,
          pipelineStageId: opp.pipelineStageId,
          pipelineId: opp.pipelineId,
          contact: opp.contact?.name || 'No contact'
        })),
        totalOpportunities: opportunities.length,
        endpointUsed: 'services.leadconnectorhq.com/opportunities/search'
      }
    });
  } catch (error) {
    console.error('Error fetching quote sent opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch quote sent opportunities',
      details: error.response?.data || error.message
    });
  }
}