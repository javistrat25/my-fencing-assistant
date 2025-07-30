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
  console.log('Quote pending efficient endpoint called');
  
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
    console.log('Fetching quote pending opportunities with stage filtering...');
    
    const quotePendingStageId = "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5";
    
    // Fetch opportunities filtered by stage ID (no pagination)
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: 'hhgoXNHThJUYz4r3qS18',
        limit: 100, // GHL API maximum limit
        pipeline_stage_id: quotePendingStageId
      }
    });
    
    const quotePendingOpportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Total quote pending opportunities fetched: ${quotePendingOpportunities.length}`);
    
    // Log all found opportunities for debugging
    quotePendingOpportunities.forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.name} - Contact: ${opp.contact?.name || 'No contact'}`);
    });

    res.status(200).json({
      success: true,
      opportunities: quotePendingOpportunities,
      total: quotePendingOpportunities.length,
      stageId: quotePendingStageId,
      message: 'Filtered by pipeline_stage_id (no pagination)'
    });
    
  } catch (error) {
    console.error('Error fetching quote pending opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch quote pending opportunities',
      details: error.response?.data || error.message
    });
  }
} 