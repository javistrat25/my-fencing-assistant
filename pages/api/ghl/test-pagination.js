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
  console.log('Test pagination endpoint called');
  
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
    console.log('Testing pagination...');
    
    // Test single API call first
    console.log('Testing single API call...');
    const singleResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: locationId,
        limit: 100,
        offset: 0
      }
    });
    
    console.log('Single API call successful');
    const singleOpportunities = singleResponse.data.opportunities || [];
    console.log(`Single call returned ${singleOpportunities.length} opportunities`);
    
    // Test pagination
    console.log('Testing pagination...');
    let allOpportunities = [];
    let offset = 0;
    const limit = 100;
    let pageCount = 0;
    
    while (true) {
      pageCount++;
      console.log(`Making API call ${pageCount} with offset=${offset}`);
      
      const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: locationId,
          limit: limit,
          offset: offset
        }
      });
      
      const opportunities = opportunitiesResponse.data.opportunities || [];
      allOpportunities = allOpportunities.concat(opportunities);
      
      console.log(`Page ${pageCount}: Got ${opportunities.length} opportunities (offset: ${offset}, total so far: ${allOpportunities.length})`);
      
      // If we got fewer than the limit, we've reached the end
      if (opportunities.length < limit) {
        console.log(`Reached end: got ${opportunities.length} < ${limit}`);
        break;
      }
      
      offset += limit;
      
      // Safety check to prevent infinite loops
      if (offset > 1000) {
        console.log('Reached safety limit of 1000 opportunities');
        break;
      }
    }
    
    console.log(`Pagination complete: Total opportunities fetched: ${allOpportunities.length}`);
    
    // Test the hardcoded mapping
    const hardcodedMapping = {
      "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5": "Quote Pending",
      "caae0892-7efb-4f5e-bcc6-07123c1cc463": "Quote Sent"
    };
    
    const quotePendingCount = allOpportunities.filter(opp => 
      opp.pipelineStageId === "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5"
    ).length;
    
    const quoteSentCount = allOpportunities.filter(opp => 
      opp.pipelineStageId === "caae0892-7efb-4f5e-bcc6-07123c1cc463"
    ).length;

    res.status(200).json({
      success: true,
      singleCall: {
        opportunitiesCount: singleOpportunities.length,
        sampleOpportunities: singleOpportunities.slice(0, 3).map(opp => ({
          id: opp.id,
          name: opp.name,
          pipelineStageId: opp.pipelineStageId
        }))
      },
      pagination: {
        totalOpportunities: allOpportunities.length,
        pagesFetched: pageCount,
        quotePendingCount: quotePendingCount,
        quoteSentCount: quoteSentCount,
        sampleOpportunities: allOpportunities.slice(0, 3).map(opp => ({
          id: opp.id,
          name: opp.name,
          pipelineStageId: opp.pipelineStageId
        }))
      }
    });
    
  } catch (error) {
    console.error('Error testing pagination:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test pagination',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
}