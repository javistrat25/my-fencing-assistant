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
    console.log('Fetching opportunities with server-side filtering');
    
    // Try the correct GHL opportunities endpoint
    const response = await axios.get('https://rest.gohighlevel.com/v1/opportunities/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 50,
        // Try different stage names that might represent "quote sent"
        stage: 'Quote Sent', // Primary attempt
        // Additional parameters for better filtering
        status: 'active'
      }
    });

    console.log('Opportunities fetched successfully with server-side filtering');
    
    let opportunities = response.data.opportunities || [];
    
    // If no results with "Quote Sent", try alternative stage names
    if (opportunities.length === 0) {
      console.log('No results with "Quote Sent", trying alternative stage names...');
      
      const alternativeStages = ['Quote', 'Quote Sent', 'Proposal Sent', 'Estimate Sent'];
      
      for (const stage of alternativeStages) {
        try {
          const altResponse = await axios.get('https://rest.gohighlevel.com/v1/opportunities/', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            params: {
              limit: 50,
              stage: stage,
              status: 'active'
            }
          });
          
          opportunities = altResponse.data.opportunities || [];
          if (opportunities.length > 0) {
            console.log(`Found ${opportunities.length} opportunities with stage: ${stage}`);
            break;
          }
        } catch (altError) {
          console.log(`No results for stage: ${stage}`);
        }
      }
    }

    // If still no results, get all opportunities and filter client-side
    if (opportunities.length === 0) {
      console.log('No results with server-side filtering, fetching all opportunities...');
      
      const allResponse = await axios.get('https://rest.gohighlevel.com/v1/opportunities/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 100,
          status: 'active'
        }
      });

      const allOpportunities = allResponse.data.opportunities || [];
      
      // Client-side filtering for quote sent opportunities
      opportunities = allOpportunities.filter(opportunity => {
        const stageName = opportunity.stage?.name?.toLowerCase() || '';
        const status = opportunity.status?.toLowerCase() || '';
        const customFields = opportunity.customField || {};
        
        return stageName.includes('quote sent') || 
               stageName.includes('quote') ||
               status.includes('quote sent') ||
               status.includes('quote') ||
               customFields.stage?.toLowerCase().includes('quote sent') ||
               customFields.status?.toLowerCase().includes('quote sent');
      });
      
      console.log(`Found ${opportunities.length} quote sent opportunities out of ${allOpportunities.length} total`);
    }

    res.status(200).json({
      success: true,
      opportunities: opportunities,
      total: opportunities.length,
      stage: 'quote sent',
      apiVersion: 'v1'
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error.response?.data || error.message);
    
    // Try alternative endpoint
    try {
      console.log('Trying alternative opportunities endpoint...');
      const altResponse = await axios.get('https://api.gohighlevel.com/v1/opportunities/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 50,
          stage: 'Quote Sent',
          status: 'active'
        }
      });
      
      const opportunities = altResponse.data.opportunities || [];
      
      console.log('Alternative opportunities endpoint worked');
      res.status(200).json({
        success: true,
        opportunities: opportunities,
        total: opportunities.length,
        stage: 'quote sent',
        apiVersion: 'v1'
      });
    } catch (altError) {
      console.error('All opportunities endpoints failed:', altError.response?.data || altError.message);
      res.status(500).json({
        error: 'Failed to fetch opportunities',
        details: error.response?.data || error.message,
        bestPractices: [
          'Use server-side filtering with query parameters',
          'Include proper error handling',
          'Use correct API version and endpoints',
          'Include location ID in URL path'
        ]
      });
    }
  }
}