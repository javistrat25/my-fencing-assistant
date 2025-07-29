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
  console.log('Opportunities endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  console.log('Cookies received:', Object.keys(cookies));
  const accessToken = cookies.ghl_access_token;
  console.log('Access token found:', !!accessToken);
  console.log('Access token length:', accessToken ? accessToken.length : 0);
  console.log('Access token preview:', accessToken ? accessToken.substring(0, 20) + '...' : 'none');
  
  if (!accessToken) {
    console.log('No access token available');
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  // GHL Location ID
  const locationId = 'hhgoXNHThJUYz4r3qS18';
  console.log('Using location ID:', locationId);

  try {
    console.log('Fetching opportunities in quote sent stage');
    
    // First, get all opportunities
    const response = await axios.get(`https://rest.gohighlevel.com/v1/locations/${locationId}/opportunities/`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 50 // Get more opportunities to filter
      }
    });

    console.log('Opportunities fetched successfully');
    
    // Filter opportunities in "quote sent" stage
    const allOpportunities = response.data.opportunities || [];
    const quoteSentOpportunities = allOpportunities.filter(opportunity => {
      // Check if the opportunity is in the quote sent stage
      // This might be based on stage name, status, or custom field
      const stageName = opportunity.stage?.name?.toLowerCase() || '';
      const status = opportunity.status?.toLowerCase() || '';
      const customFields = opportunity.customField || {};
      
      // Look for various ways "quote sent" might be represented
      return stageName.includes('quote sent') || 
             stageName.includes('quote') ||
             status.includes('quote sent') ||
             status.includes('quote') ||
             customFields.stage?.toLowerCase().includes('quote sent') ||
             customFields.status?.toLowerCase().includes('quote sent');
    });

    console.log(`Found ${quoteSentOpportunities.length} opportunities in quote sent stage out of ${allOpportunities.length} total`);

    res.status(200).json({
      success: true,
      opportunities: quoteSentOpportunities,
      total: quoteSentOpportunities.length,
      totalOpportunities: allOpportunities.length,
      stage: 'quote sent'
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error.response?.data || error.message);
    
    // Try alternative endpoint
    try {
      console.log('Trying alternative opportunities endpoint...');
      const altResponse = await axios.get(`https://api.gohighlevel.com/v1/locations/${locationId}/opportunities/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50
        }
      });
      
      const allOpportunities = altResponse.data.opportunities || [];
      const quoteSentOpportunities = allOpportunities.filter(opportunity => {
        const stageName = opportunity.stage?.name?.toLowerCase() || '';
        const status = opportunity.status?.toLowerCase() || '';
        return stageName.includes('quote sent') || 
               stageName.includes('quote') ||
               status.includes('quote sent') ||
               status.includes('quote');
      });
      
      console.log('Alternative opportunities endpoint worked');
      res.status(200).json({
        success: true,
        opportunities: quoteSentOpportunities,
        total: quoteSentOpportunities.length,
        totalOpportunities: allOpportunities.length,
        stage: 'quote sent'
      });
    } catch (altError) {
      console.error('All opportunities endpoints failed:', altError.response?.data || altError.message);
      res.status(500).json({
        error: 'Failed to fetch opportunities',
        details: error.response?.data || error.message
      });
    }
  }
}