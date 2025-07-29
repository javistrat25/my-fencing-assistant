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
  console.log('Get my locations endpoint called');
  
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
    console.log('Getting locations for this token...');
    
    // Get locations that this token has access to
    const locationsResponse = await axios.get('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
    
    console.log('Locations endpoint worked');
    
    const locations = locationsResponse.data.locations || [];
    console.log(`Found ${locations.length} locations`);
    
    // Show all available locations
    const locationInfo = locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state
    }));
    
    res.status(200).json({
      success: true,
      message: 'Available locations for this token',
      locations: locationInfo,
      totalLocations: locations.length,
      accessTokenLength: accessToken.length,
      endpoint: 'services.leadconnectorhq.com/locations/'
    });
    
  } catch (error) {
    console.error('Error getting locations:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to get locations',
      details: error.response?.data || error.message,
      message: 'Check if OAuth token is valid'
    });
  }
}