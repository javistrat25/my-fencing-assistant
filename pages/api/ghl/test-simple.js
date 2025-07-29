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
  console.log('Simple test endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  console.log('Cookies received:', Object.keys(cookies));
  const accessToken = cookies.ghl_access_token;
  console.log('Access token found:', !!accessToken);
  
  if (!accessToken) {
    console.log('No access token available');
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Testing basic GHL API access...');
    
    // Try a simple contacts endpoint first
    const contactsResponse = await axios.get('https://services.leadconnectorhq.com/contacts/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: 'hhgoXNHThJUYz4r3qS18',
        limit: 5
      }
    });
    
    console.log('Contacts endpoint worked');
    
    res.status(200).json({
      success: true,
      message: 'GHL API access is working',
      contactsCount: contactsResponse.data.contacts?.length || 0,
      sampleContact: contactsResponse.data.contacts?.[0] || null,
      accessTokenLength: accessToken.length,
      endpoint: 'services.leadconnectorhq.com/contacts/'
    });
    
  } catch (error) {
    console.error('Error testing GHL API:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test GHL API',
      details: error.response?.data || error.message,
      message: 'Check if OAuth token is valid'
    });
  }
}