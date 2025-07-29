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
  console.log('Test location endpoint called');
  
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

  // GHL Location ID
  const locationId = 'hhgoXNHThJUYz4r3qS18';
  console.log('Testing with location ID:', locationId);

  try {
    console.log('Testing pipelines endpoint to verify location ID...');
    
    // Test the pipelines endpoint to verify location ID
    const pipelinesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/pipelines', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        locationId: locationId
      }
    });

    console.log('Pipelines test successful');
    
    res.status(200).json({
      success: true,
      message: 'Location ID is valid',
      locationId: locationId,
      pipelines: pipelinesResponse.data.pipelines || [],
      pipelineCount: pipelinesResponse.data.pipelines?.length || 0,
      apiVersion: '2021-07-28'
    });
  } catch (error) {
    console.error('Error testing location:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test location ID',
      details: error.response?.data || error.message,
      locationId: locationId,
      suggestions: [
        'Check if location ID is correct',
        'Verify OAuth token has proper permissions',
        'Try different location ID format'
      ]
    });
  }
}