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
  const accessToken = cookies.ghl_access_token;

  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Fetching quote sent opportunities...');
    
    // Get all opportunities
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
    
    console.log('Opportunities fetched successfully');
    
    let opportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Found ${opportunities.length} total opportunities`);
    
    // Updated stage ID mapping based on actual pipeline stages
    const stageIdToName = {
      "9de677cf-3448-43a8-ac75-9c3b912627fb": "First Contact",
      "c263cf7d-72f4-4957-a337-c795c4feeef3": "First Contact by Rincon",
      "3e480531-834d-4c7f-a6e4-7ffc08b96140": "Scheduled Visit",
      "2a02ea5a-d040-4ff5-a29b-d5747ed3340b": "Won-Invoiced",
      "08b2df08-94a2-4b26-b79d-4ab6cc8308c7": "Fabrication- In Progress",
      "df57527e-fa1f-4d4d-b348-dbaad3201e9b": "Powder- In Progress",
      "7219e696-269c-4865-bc38-c29b3e44b4aa": "Installing- In Progress",
      "27e4efe6-42cd-4937-ad8d-118ab234d95f": "Finished- Pending Payment",
      "1b494e0c-2833-4d04-8220-a5b23714a11c": "LOST client"
    };
    
    console.log('Stage ID to name mapping:', stageIdToName);
    
    // Get unique stage IDs from opportunities
    const opportunityStageIds = [...new Set(opportunities.map(opp => opp.pipelineStageId))];
    console.log('Opportunity stage IDs:', opportunityStageIds);
    
    // For "Quote Sent" - we'll look for opportunities that might be in a quote stage
    // Since there's no specific "Quote Sent" stage, let's look for opportunities that might be ready for quotes
    let quoteSentOpportunities = opportunities.filter(opportunity => {
      const stageId = opportunity.pipelineStageId;
      const stageName = stageIdToName[stageId] || '';
      
      // Look for stages that might indicate quotes have been sent
      // This is a best guess based on the pipeline stages available
      const isQuoteSent = stageName.toLowerCase().includes('scheduled') ||
                         stageName.toLowerCase().includes('visit') ||
                         stageName.toLowerCase().includes('fabrication') ||
                         stageName.toLowerCase().includes('powder') ||
                         stageName.toLowerCase().includes('installing');
      
      console.log(`Opportunity ${opportunity.name}: stageId=${stageId}, stageName="${stageName}", isQuoteSent=${isQuoteSent}`);
      
      return isQuoteSent;
    });
    
    console.log(`Found ${quoteSentOpportunities.length} quote sent opportunities out of ${opportunities.length} total`);

    res.status(200).json({
      success: true,
      opportunities: quoteSentOpportunities,
      total: quoteSentOpportunities.length,
      allOpportunities: opportunities.length,
      stageMapping: stageIdToName,
      availableStages: opportunityStageIds
    });
    
  } catch (error) {
    console.error('Error fetching quote sent opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch quote sent opportunities',
      details: error.response?.data || error.message
    });
  }
}