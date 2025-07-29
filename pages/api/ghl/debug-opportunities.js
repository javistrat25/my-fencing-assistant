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
  console.log('Debug opportunities endpoint called');
  
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
    console.log('Fetching raw opportunities data...');
    
    // Try both endpoints to see which works
    let opportunities = [];
    let endpointUsed = '';
    
    try {
      // Try services endpoint first
      const servicesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: 'hhgoXNHThJUYz4r3qS18',
          limit: 50
        }
      });
      
      opportunities = servicesResponse.data.opportunities || [];
      endpointUsed = 'services.leadconnectorhq.com/opportunities/search';
      console.log('Services endpoint worked');
      
    } catch (servicesError) {
      console.log('Services endpoint failed, trying rest endpoint...');
      
      // Try rest endpoint as fallback
      const restResponse = await axios.get('https://rest.gohighlevel.com/v1/opportunities/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50
        }
      });
      
      opportunities = restResponse.data.opportunities || [];
      endpointUsed = 'rest.gohighlevel.com/v1/opportunities/';
      console.log('Rest endpoint worked');
    }
    
    console.log(`Found ${opportunities.length} total opportunities`);
    
    // Log detailed structure of first 3 opportunities
    const sampleOpportunities = opportunities.slice(0, 3).map(opp => ({
      id: opp.id,
      name: opp.name,
      status: opp.status,
      pipelineStageId: opp.pipelineStageId,
      pipelineStage: opp.pipelineStage,
      pipelineStageName: opp.pipelineStage?.name,
      pipelineId: opp.pipelineId,
      pipeline: opp.pipeline,
      pipelineName: opp.pipeline?.name,
      // Log all available fields
      allFields: Object.keys(opp)
    }));
    
    // Also check for any field that might contain stage information
    const stageFields = opportunities.slice(0, 5).map(opp => {
      const stageRelatedFields = {};
      Object.keys(opp).forEach(key => {
        if (key.toLowerCase().includes('stage') || key.toLowerCase().includes('pipeline')) {
          stageRelatedFields[key] = opp[key];
        }
      });
      return { id: opp.id, name: opp.name, stageFields: stageRelatedFields };
    });

    res.status(200).json({
      success: true,
      totalOpportunities: opportunities.length,
      endpointUsed,
      sampleOpportunities,
      stageFields,
      allOpportunityIds: opportunities.map(opp => opp.id),
      // Return first 5 opportunities for inspection
      firstFive: opportunities.slice(0, 5)
    });
    
  } catch (error) {
    console.error('Error fetching opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch opportunities',
      details: error.response?.data || error.message,
      message: 'Check console logs for more details'
    });
  }
}