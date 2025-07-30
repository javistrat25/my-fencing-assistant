import axios from 'axios';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
    return cookies;
  }, {});
}

export default async function handler(req, res) {
  console.log('Quote sent efficient endpoint called');
  if (req.method !== 'GET') { return res.status(405).json({ error: 'Method not allowed' }); }
  
  // Try multiple ways to get the access token
  let accessToken = null;
  
  // Method 1: Try cookies (desktop)
  if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    accessToken = cookies.ghl_access_token;
    console.log('Method 1: Found token in cookies');
  }
  
  // Method 2: Try Authorization header (mobile-friendly)
  if (!accessToken && req.headers.authorization) {
    accessToken = req.headers.authorization.replace('Bearer ', '');
    console.log('Method 2: Found token in Authorization header');
  }
  
  // Method 3: Try query parameter (fallback for mobile)
  if (!accessToken && req.query.token) {
    accessToken = req.query.token;
    console.log('Method 3: Found token in query parameter');
  }

  if (!accessToken) { 
    return res.status(401).json({ 
      error: 'No access token available. Please authenticate via OAuth first.', 
      message: 'Visit /api/auth to start the OAuth flow',
      methods: 'Try: 1) Desktop cookies, 2) Authorization header, 3) Query parameter'
    }); 
  }
  
  try {
    console.log('Fetching quote sent opportunities with stage filtering...');
    const quoteSentStageId = "caae0892-7efb-4f5e-bcc6-07123c1cc463";
    // Fetch opportunities filtered by stage ID (no pagination)
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Version': '2021-07-28' },
      params: { location_id: 'hhgoXNHThJUYz4r3qS18', limit: 100, pipeline_stage_id: quoteSentStageId }
    });
    const quoteSentOpportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Total quote sent opportunities fetched: ${quoteSentOpportunities.length}`);
    quoteSentOpportunities.forEach((opp, index) => { console.log(`${index + 1}. ${opp.name} - Contact: ${opp.contact?.name || 'No contact'}`); });
    res.status(200).json({
      success: true, opportunities: quoteSentOpportunities, total: quoteSentOpportunities.length,
      stageId: quoteSentStageId, message: 'Filtered by pipeline_stage_id (no pagination)'
    });
  } catch (error) {
    console.error('Error fetching quote sent opportunities:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch quote sent opportunities', details: error.response?.data || error.message });
  }
} 