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
  console.log('Quote pending endpoint called');
  
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
    console.log('Fetching quote pending opportunities...');
    
    // Fetch opportunities and filter for quote pending stage
    const response = await axios.get('https://rest.gohighlevel.com/v1/opportunities/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 100,
        status: 'open'
      }
    });

    console.log('Opportunities fetched successfully');
    
    let opportunities = response.data.opportunities || [];
    
    // Filter for quote pending opportunities specifically
    const quotePendingOpportunities = opportunities.filter(opportunity => {
      const name = opportunity.name?.toLowerCase() || '';
      const status = opportunity.status?.toLowerCase() || '';
      const pipelineStageId = opportunity.pipelineStageId || '';
      
      // Look for quote pending indicators
      return name.includes('quote pending') || 
             name.includes('pending') ||
             status.includes('quote pending') ||
             status.includes('pending') ||
             pipelineStageId.includes('quote pending') ||
             pipelineStageId.includes('pending') ||
             // Add more specific filters for quote pending stage
             name.includes('quote') && !name.includes('sent') ||
             status.includes('quote') && !status.includes('sent');
    });
    
    console.log(`Found ${quotePendingOpportunities.length} quote pending opportunities out of ${opportunities.length} total`);

    res.status(200).json({
      success: true,
      opportunities: quotePendingOpportunities,
      total: quotePendingOpportunities.length,
      stage: 'quote pending',
      apiVersion: 'v1',
      endpoint: 'rest.gohighlevel.com/v1/opportunities/'
    });
  } catch (error) {
    console.error('Error fetching quote pending opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch quote pending opportunities',
      details: error.response?.data || error.message
    });
  }
}