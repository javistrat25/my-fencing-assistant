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
  console.log('Test simple endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.ghl_access_token;
  const locationId = 'hhgoXNHThJUYz4r3qS18';

  console.log('Cookies found:', Object.keys(cookies));
  console.log('Access token exists:', !!accessToken);

  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Testing simple API call...');
    
    // Test the basic API call that should work
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: locationId,
        limit: 100
      }
    });
    
    console.log('API call successful');
    const opportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Found ${opportunities.length} opportunities`);
    
    // Test the hardcoded mapping
    const hardcodedMapping = {
      "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5": "Quote Pending",
      "caae0892-7efb-4f5e-bcc6-07123c1cc463": "Quote Sent"
    };
    
    const quotePendingCount = opportunities.filter(opp => 
      opp.pipelineStageId === "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5"
    ).length;
    
    const quoteSentCount = opportunities.filter(opp => 
      opp.pipelineStageId === "caae0892-7efb-4f5e-bcc6-07123c1cc463"
    ).length;

    res.status(200).json({
      success: true,
      totalOpportunities: opportunities.length,
      quotePendingCount: quotePendingCount,
      quoteSentCount: quoteSentCount,
      sampleOpportunities: opportunities.slice(0, 3).map(opp => ({
        id: opp.id,
        name: opp.name,
        pipelineStageId: opp.pipelineStageId
      }))
    });
    
  } catch (error) {
    console.error('Error testing simple API call:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test simple API call',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
}