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
    console.log('Fetching all quote sent opportunities with pagination...');
    
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
      "1b494e0c-2833-4d04-8220-a5b23714a11c": "LOST client",
      "caae0892-7efb-4f5e-bcc6-07123c1cc463": "Quote Sent"
    };
    
    const quoteSentStageId = "caae0892-7efb-4f5e-bcc6-07123c1cc463";
    let allOpportunities = [];
    let skip = 0;
    const limit = 100;
    let hasMore = true;
    
    // Fetch all opportunities using pagination
    while (hasMore) {
      console.log(`Fetching opportunities batch: skip=${skip}, limit=${limit}`);
      
      const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: 'hhgoXNHThJUYz4r3qS18',
          limit: limit,
          skip: skip
        }
      });
      
      const batchOpportunities = opportunitiesResponse.data.opportunities || [];
      console.log(`Batch returned ${batchOpportunities.length} opportunities`);
      
      if (batchOpportunities.length === 0) {
        hasMore = false;
      } else {
        allOpportunities = allOpportunities.concat(batchOpportunities);
        skip += limit;
        
        // Safety check to prevent infinite loops
        if (skip > 10000) {
          console.log('Reached safety limit, stopping pagination');
          hasMore = false;
        }
      }
    }
    
    console.log(`Total opportunities fetched: ${allOpportunities.length}`);
    
    // Get unique stage IDs from all opportunities
    const opportunityStageIds = [...new Set(allOpportunities.map(opp => opp.pipelineStageId))];
    console.log('All opportunity stage IDs:', opportunityStageIds);
    
    // Filter for "Quote Sent" stage using the exact stage ID
    let quoteSentOpportunities = allOpportunities.filter(opportunity => {
      const isQuoteSent = opportunity.pipelineStageId === quoteSentStageId;
      const stageName = stageIdToName[opportunity.pipelineStageId] || 'Unknown';
      
      if (isQuoteSent) {
        console.log(`Quote Sent Opportunity: ${opportunity.name} - Contact: ${opportunity.contact?.name || 'No contact'}`);
      }
      
      return isQuoteSent;
    });
    
    console.log(`Found ${quoteSentOpportunities.length} quote sent opportunities out of ${allOpportunities.length} total`);
    
    // Log stage distribution for debugging
    const stageDistribution = {};
    allOpportunities.forEach(opp => {
      const stageName = stageIdToName[opp.pipelineStageId] || 'Unknown';
      stageDistribution[stageName] = (stageDistribution[stageName] || 0) + 1;
    });
    console.log('Stage distribution:', stageDistribution);

    res.status(200).json({
      success: true,
      opportunities: quoteSentOpportunities,
      total: quoteSentOpportunities.length,
      allOpportunities: allOpportunities.length,
      stageMapping: stageIdToName,
      availableStages: opportunityStageIds,
      stageDistribution: stageDistribution,
      paginationInfo: {
        totalBatches: Math.ceil(skip / limit),
        totalFetched: allOpportunities.length
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