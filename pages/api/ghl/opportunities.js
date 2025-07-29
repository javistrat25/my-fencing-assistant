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
    console.log('Fetching opportunities with correct GHL API specification');
    
    // Use the correct GHL opportunities search endpoint with required parameters
    const response = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28' // Required API version header
      },
      params: {
        location_id: locationId, // Required parameter
        limit: 50,
        status: 'open', // Filter for open opportunities
        // Try to filter by stage name in the query
        q: 'quote sent' // Search query for quote sent opportunities
      }
    });

    console.log('Opportunities fetched successfully with GHL API specification');
    
    let opportunities = response.data.opportunities || [];
    
    // If no results with "quote sent" search, try alternative approaches
    if (opportunities.length === 0) {
      console.log('No results with "quote sent" search, trying broader search...');
      
      // Try without search query to get all opportunities
      const allResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
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

      const allOpportunities = allResponse.data.opportunities || [];
      
      // Client-side filtering for quote sent opportunities
      opportunities = allOpportunities.filter(opportunity => {
        const name = opportunity.name?.toLowerCase() || '';
        const status = opportunity.status?.toLowerCase() || '';
        const pipelineStageId = opportunity.pipelineStageId || '';
        
        return name.includes('quote sent') || 
               name.includes('quote') ||
               status.includes('quote sent') ||
               status.includes('quote') ||
               pipelineStageId.includes('quote');
      });
      
      console.log(`Found ${opportunities.length} quote sent opportunities out of ${allOpportunities.length} total`);
    }

    res.status(200).json({
      success: true,
      opportunities: opportunities,
      total: opportunities.length,
      stage: 'quote sent',
      apiVersion: '2021-07-28',
      locationId: locationId,
      endpoint: '/opportunities/search'
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error.response?.data || error.message);
    
    // Try alternative endpoint structure
    try {
      console.log('Trying alternative opportunities endpoint...');
      const altResponse = await axios.get('https://rest.gohighlevel.com/v1/opportunities/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          limit: 50,
          status: 'open'
        }
      });
      
      const opportunities = altResponse.data.opportunities || [];
      
      console.log('Alternative opportunities endpoint worked');
      res.status(200).json({
        success: true,
        opportunities: opportunities,
        total: opportunities.length,
        stage: 'quote sent',
        apiVersion: '2021-07-28'
      });
    } catch (altError) {
      console.error('All opportunities endpoints failed:', altError.response?.data || altError.message);
      res.status(500).json({
        error: 'Failed to fetch opportunities',
        details: error.response?.data || error.message,
        bestPractices: [
          'Use /opportunities/search endpoint',
          'Include location_id as required parameter',
          'Include Version: 2021-07-28 header',
          'Use services.leadconnectorhq.com base URL'
        ]
      });
    }
  }
}