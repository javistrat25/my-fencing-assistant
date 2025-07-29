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
  const accessToken = cookies.ghl_access_token;
  const locationId = 'hhgoXNHThJUYz4r3qS18';

  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Fetching all opportunities for debugging...');
    
    // Get all opportunities
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: locationId,
        limit: 100 // Fixed: GHL API limit is 100, not 500
      }
    });
    
    const opportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Found ${opportunities.length} total opportunities`);
    
    // Get unique stage IDs
    const stageIds = [...new Set(opportunities.map(opp => opp.pipelineStageId))];
    console.log('Unique stage IDs found:', stageIds);
    
    // Count opportunities by stage ID
    const stageIdCounts = {};
    stageIds.forEach(stageId => {
      stageIdCounts[stageId] = opportunities.filter(opp => opp.pipelineStageId === stageId).length;
    });
    
    // Show first few opportunities with their details
    const sampleOpportunities = opportunities.slice(0, 5).map(opp => ({
      id: opp.id,
      name: opp.name,
      pipelineStageId: opp.pipelineStageId,
      status: opp.status,
      source: opp.source,
      monetaryValue: opp.monetaryValue
    }));
    
    // Test our hardcoded mapping
    const hardcodedMapping = {
      "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5": "Quote Pending",
      "caae0892-7efb-4f5e-bcc6-07123c1cc463": "Quote Sent"
    };
    
    const mappingResults = {};
    Object.keys(hardcodedMapping).forEach(stageId => {
      const count = opportunities.filter(opp => opp.pipelineStageId === stageId).length;
      mappingResults[stageId] = {
        expectedName: hardcodedMapping[stageId],
        actualCount: count,
        opportunities: opportunities.filter(opp => opp.pipelineStageId === stageId).map(opp => opp.name)
      };
    });

    res.status(200).json({
      success: true,
      totalOpportunities: opportunities.length,
      uniqueStageIds: stageIds,
      stageIdCounts: stageIdCounts,
      sampleOpportunities: sampleOpportunities,
      hardcodedMapping: hardcodedMapping,
      mappingResults: mappingResults,
      allOpportunities: opportunities.map(opp => ({
        id: opp.id,
        name: opp.name,
        pipelineStageId: opp.pipelineStageId,
        status: opp.status
      }))
    });
    
  } catch (error) {
    console.error('Error debugging opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to debug opportunities',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
}