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
    
    // Try the services.leadconnectorhq.com endpoint first (matches GHL docs)
    const response = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: 'hhgoXNHThJUYz4r3qS18',
        limit: 100,
        status: 'open'
      }
    });

    console.log('Opportunities fetched successfully from services endpoint');
    
    let opportunities = response.data.opportunities || [];
    
    // Debug: Log first few opportunities to see their structure
    console.log('Sample opportunities structure:');
    opportunities.slice(0, 3).forEach((opp, index) => {
      console.log(`Opportunity ${index + 1}:`, {
        id: opp.id,
        name: opp.name,
        status: opp.status,
        pipelineStageId: opp.pipelineStageId,
        pipelineStage: opp.pipelineStage,
        pipelineStageName: opp.pipelineStage?.name
      });
    });
    
    // Filter for "Quote Pending" stage specifically (matching GHL pipeline)
    const quotePendingOpportunities = opportunities.filter(opportunity => {
      const name = opportunity.name?.toLowerCase() || '';
      const status = opportunity.status?.toLowerCase() || '';
      const pipelineStageId = opportunity.pipelineStageId || '';
      const pipelineStageName = opportunity.pipelineStage?.name?.toLowerCase() || '';
      
      // Debug: Log what we're checking
      console.log('Checking opportunity:', {
        name,
        status,
        pipelineStageId,
        pipelineStageName,
        isMatch: name.includes('quote pending') || 
                 status.includes('quote pending') ||
                 pipelineStageId.includes('quote pending') ||
                 pipelineStageName.includes('quote pending') ||
                 name.includes('quote') && name.includes('pending') ||
                 status.includes('quote') && status.includes('pending') ||
                 pipelineStageName === 'quote pending'
      });
      
      // Look for exact "Quote Pending" stage match
      return name.includes('quote pending') || 
             status.includes('quote pending') ||
             pipelineStageId.includes('quote pending') ||
             pipelineStageName.includes('quote pending') ||
             // Also check for variations
             name.includes('quote') && name.includes('pending') ||
             status.includes('quote') && status.includes('pending') ||
             pipelineStageName === 'quote pending';
    });
    
    console.log(`Found ${quotePendingOpportunities.length} quote pending opportunities out of ${opportunities.length} total`);

    res.status(200).json({
      success: true,
      opportunities: quotePendingOpportunities,
      total: quotePendingOpportunities.length,
      stage: 'Quote Pending',
      apiVersion: '2021-07-28',
      endpoint: 'services.leadconnectorhq.com/opportunities/search',
      allOpportunities: opportunities.length,
      // Debug: Return first few opportunities for inspection
      debug: {
        sampleOpportunities: opportunities.slice(0, 3).map(opp => ({
          id: opp.id,
          name: opp.name,
          status: opp.status,
          pipelineStage: opp.pipelineStage,
          pipelineStageName: opp.pipelineStage?.name,
          allFields: Object.keys(opp)
        })),
        totalOpportunities: opportunities.length,
        endpointUsed: 'services.leadconnectorhq.com/opportunities/search'
      }
    });
  } catch (error) {
    console.error('Error fetching quote pending opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch quote pending opportunities',
      details: error.response?.data || error.message
    });
  }
}