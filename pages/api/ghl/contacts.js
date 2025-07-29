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
  console.log('Contacts endpoint called');
  
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

  try {
    console.log('Fetching contacts with token');
    
    // Try the correct GHL API endpoint
    const response = await axios.get('https://rest.gohighlevel.com/v1/contacts/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        limit: 10 // Limit to first 10 contacts for testing
      }
    });

    console.log('Contacts fetched successfully');
    res.status(200).json({
      success: true,
      contacts: response.data.contacts || [],
      total: response.data.total || 0
    });
  } catch (error) {
    console.error('Error fetching contacts:', error.response?.data || error.message);
    
    // Try alternative endpoint if first one fails
    try {
      console.log('Trying alternative endpoint...');
      const altResponse = await axios.get('https://api.gohighlevel.com/v1/contacts/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          limit: 10
        }
      });
      
      console.log('Alternative endpoint worked');
      res.status(200).json({
        success: true,
        contacts: altResponse.data.contacts || [],
        total: altResponse.data.total || 0
      });
    } catch (altError) {
      console.error('Alternative endpoint also failed:', altError.response?.data || altError.message);
      res.status(500).json({ 
        error: 'Failed to fetch contacts',
        details: error.response?.data || error.message
      });
    }
  }
} 