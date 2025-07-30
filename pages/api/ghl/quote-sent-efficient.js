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
  console.log('Quote sent efficient endpoint called');
  
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
    console.log('Fetching quote sent opportunities with stage filtering...');
    
    const quoteSentStageId = "caae0892-7efb-4f5e-bcc6-07123c1cc463";
    let allQuoteSentOpportunities = [];
    let skip = 0;
    const limit = 100;
    let hasMore = true;
    
    // Try to filter by stage ID directly in the API call
    while (hasMore) {
      console.log(`Fetching quote sent opportunities batch: skip=${skip}, limit=${limit}`);
      
      const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: 'hhgoXNHThJUYz4r3qS18',
          limit: limit,
          skip: skip,
          // Try filtering by stage ID - this may or may not work depending on GHL API
          pipeline_stage_id: quoteSentStageId
        }
      });
      
      const batchOpportunities = opportunitiesResponse.data.opportunities || [];
      console.log(`Batch returned ${batchOpportunities.length} opportunities`);
      
      if (batchOpportunities.length === 0) {
        hasMore = false;
      } else {
        allQuoteSentOpportunities = allQuoteSentOpportunities.concat(batchOpportunities);
        skip += limit;
        
        // Safety check to prevent infinite loops
        if (skip > 10000) {
          console.log('Reached safety limit, stopping pagination');
          hasMore = false;
        }
      }
    }
    
    console.log(`Total quote sent opportunities fetched: ${allQuoteSentOpportunities.length}`);
    
    // Log all found opportunities for debugging
    allQuoteSentOpportunities.forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.name} - Contact: ${opp.contact?.name || 'No contact'}`);
    });

    res.status(200).json({
      success: true,
      opportunities: allQuoteSentOpportunities,
      total: allQuoteSentOpportunities.length,
      stageId: quoteSentStageId,
      paginationInfo: {
        totalBatches: Math.ceil(skip / limit),
        totalFetched: allQuoteSentOpportunities.length
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