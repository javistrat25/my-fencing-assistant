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
  console.log('Won invoices endpoint called');
  
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
    console.log('Fetching won invoices...');
    
    // Get opportunities and filter for won/invoiced ones
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
    
    // Filter for won/invoiced opportunities
    // This will need to be updated with the correct stage IDs once we get them
    const wonInvoices = opportunities.filter(opportunity => {
      const status = opportunity.status?.toLowerCase() || '';
      const name = opportunity.name?.toLowerCase() || '';
      
      return status.includes('won') || 
             status.includes('closed') ||
             status.includes('completed') ||
             name.includes('won') ||
             name.includes('invoice') ||
             name.includes('completed');
    });
    
    console.log(`Found ${wonInvoices.length} won invoices out of ${opportunities.length} total`);

    res.status(200).json({
      success: true,
      wonInvoices: wonInvoices,
      total: wonInvoices.length,
      allOpportunities: opportunities.length
    });
    
  } catch (error) {
    console.error('Error fetching won invoices:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch won invoices',
      details: error.response?.data || error.message
    });
  }
} 