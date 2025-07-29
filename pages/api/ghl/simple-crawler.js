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
  console.log('Simple GHL Crawler endpoint called');
  
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
    console.log('Testing different GHL API endpoints...');
    
    let opportunities = [];
    let workingEndpoint = '';
    let locationId = 'default';
    
    // Try different API endpoints
    const endpoints = [
      {
        name: 'services.leadconnectorhq.com/opportunities/search',
        url: 'https://services.leadconnectorhq.com/opportunities/search',
        params: { limit: 50, status: 'open' }
      },
      {
        name: 'rest.gohighlevel.com/v1/opportunities/',
        url: 'https://rest.gohighlevel.com/v1/opportunities/',
        params: { limit: 50, status: 'open' }
      }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint.name}`);
        
        const response = await axios.get(endpoint.url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          params: endpoint.params
        });
        
        opportunities = response.data.opportunities || [];
        workingEndpoint = endpoint.name;
        console.log(`Success with ${endpoint.name}: Found ${opportunities.length} opportunities`);
        break;
        
      } catch (error) {
        console.log(`Failed with ${endpoint.name}:`, error.response?.status || error.message);
        continue;
      }
    }
    
    if (opportunities.length === 0) {
      return res.status(500).json({
        error: 'No opportunities found with any endpoint',
        message: 'All GHL API endpoints failed'
      });
    }
    
    // Analyze opportunities by stage
    const stageAnalysis = {};
    opportunities.forEach(opp => {
      const stageId = opp.pipelineStageId || 'unknown';
      const stageName = opp.pipelineStage?.name || 'Unknown Stage';
      
      if (!stageAnalysis[stageId]) {
        stageAnalysis[stageId] = {
          name: stageName,
          count: 0,
          totalValue: 0,
          opportunities: []
        };
      }
      
      stageAnalysis[stageId].count++;
      stageAnalysis[stageId].totalValue += opp.monetaryValue || 0;
      stageAnalysis[stageId].opportunities.push({
        id: opp.id,
        name: opp.name,
        contact: opp.contact?.name || 'Unknown',
        value: opp.monetaryValue || 0,
        status: opp.status,
        pipelineStageId: opp.pipelineStageId
      });
    });
    
    // Find quote-related stages
    const quoteStages = {};
    Object.keys(stageAnalysis).forEach(stageId => {
      const stage = stageAnalysis[stageId];
      const stageName = stage.name.toLowerCase();
      
      if (stageName.includes('quote')) {
        quoteStages[stageId] = stage;
      }
    });
    
    res.status(200).json({
      success: true,
      message: 'GHL data crawl completed',
      workingEndpoint: workingEndpoint,
      summary: {
        totalOpportunities: opportunities.length,
        totalStages: Object.keys(stageAnalysis).length,
        quoteStages: Object.keys(quoteStages).length
      },
      stageAnalysis: stageAnalysis,
      quoteStages: quoteStages,
      // Sample data for inspection
      sampleOpportunities: opportunities.slice(0, 5).map(opp => ({
        id: opp.id,
        name: opp.name,
        status: opp.status,
        pipelineStageId: opp.pipelineStageId,
        pipelineStage: opp.pipelineStage?.name,
        contact: opp.contact?.name || 'Unknown',
        value: opp.monetaryValue || 0
      }))
    });
    
  } catch (error) {
    console.error('Crawler error:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to crawl GHL data',
      details: error.response?.data || error.message,
      message: 'Check if OAuth token is valid'
    });
  }
}