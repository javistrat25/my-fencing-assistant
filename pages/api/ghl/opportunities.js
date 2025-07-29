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
  console.log('Opportunities endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  console.log('Cookies received:', Object.keys(cookies));
  const accessToken = cookies.ghl_access_token;
  console.log('Access token found:', !!accessToken);
  console.log('Access token length:', accessToken ? accessToken.length : 0);
  console.log('Access token preview:', accessToken ? accessToken.substring(0, 20) + '...' : 'none');
  
  if (!accessToken) {
    console.log('No access token available');
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  // GHL Location ID
  const locationId = 'hhgoXNHThJUYz4r3qS18';
  console.log('Using location ID:', locationId);

  try {
    console.log('Trying rest.gohighlevel.com endpoint first...');
    
    // Try the rest.gohighlevel.com endpoint first
    const response = await axios.get('https://rest.gohighlevel.com/v1/opportunities/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 50,
        status: 'open'
      }
    });

    console.log('Opportunities fetched successfully from rest endpoint');
    
    let opportunities = response.data.opportunities || [];
    
    // Filter for quote sent opportunities
    const quoteSentOpportunities = opportunities.filter(opportunity => {
      const name = opportunity.name?.toLowerCase() || '';
      const status = opportunity.status?.toLowerCase() || '';
      const pipelineStageId = opportunity.pipelineStageId || '';
      
      return name.includes('quote sent') || 
             name.includes('quote') ||
             status.includes('quote sent') ||
             status.includes('quote') ||
             pipelineStageId.includes('quote');
    });
    
    console.log(`Found ${quoteSentOpportunities.length} quote sent opportunities out of ${opportunities.length} total`);

    res.status(200).json({
      success: true,
      opportunities: quoteSentOpportunities,
      total: quoteSentOpportunities.length,
      allOpportunities: opportunities.length,
      stage: 'quote sent',
      apiVersion: 'v1',
      endpoint: 'rest.gohighlevel.com/v1/opportunities/'
    });
  } catch (error) {
    console.error('Error with rest endpoint:', error.response?.data || error.message);
    
    // Try the services.leadconnectorhq.com endpoint as fallback
    try {
      console.log('Trying services.leadconnectorhq.com endpoint...');
      const altResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: locationId,
          limit: 50,
          status: 'open'
        }
      });
      
      const opportunities = altResponse.data.opportunities || [];
      
      console.log('Services endpoint worked');
      res.status(200).json({
        success: true,
        opportunities: opportunities,
        total: opportunities.length,
        stage: 'all opportunities',
        apiVersion: '2021-07-28',
        endpoint: 'services.leadconnectorhq.com/opportunities/search'
      });
    } catch (altError) {
      console.error('All endpoints failed:', altError.response?.data || altError.message);
      res.status(500).json({
        error: 'Failed to fetch opportunities',
        details: error.response?.data || error.message,
        altError: altError.response?.data || altError.message,
        bestPractices: [
          'Try rest.gohighlevel.com/v1/opportunities/',
          'Try services.leadconnectorhq.com/opportunities/search',
          'Check OAuth token permissions',
          'Verify location ID is correct'
        ]
      });
    }
  }
}