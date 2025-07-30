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
  console.log('Revenue endpoint called');
  
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
    console.log('Calculating revenue...');
    
    // Get opportunities and calculate revenue from won ones
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
    
    // Filter for won/invoiced opportunities and calculate revenue
    const wonOpportunities = opportunities.filter(opportunity => {
      const status = opportunity.status?.toLowerCase() || '';
      const name = opportunity.name?.toLowerCase() || '';
      
      return status.includes('won') || 
             status.includes('closed') ||
             status.includes('completed') ||
             name.includes('won') ||
             name.includes('invoice') ||
             name.includes('completed');
    });
    
    // Calculate total revenue from won opportunities
    let totalRevenue = 0;
    wonOpportunities.forEach(opportunity => {
      // Try different fields where the amount might be stored
      const amount = opportunity.amount || 
                    opportunity.value || 
                    opportunity.total || 
                    opportunity.price ||
                    0;
      
      totalRevenue += parseFloat(amount) || 0;
    });
    
    console.log(`Found ${wonOpportunities.length} won opportunities with total revenue: $${totalRevenue}`);

    res.status(200).json({
      success: true,
      revenue: totalRevenue,
      wonOpportunities: wonOpportunities.length,
      totalOpportunities: opportunities.length,
      currency: 'USD'
    });
    
  } catch (error) {
    console.error('Error calculating revenue:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to calculate revenue',
      details: error.response?.data || error.message
    });
  }
} 