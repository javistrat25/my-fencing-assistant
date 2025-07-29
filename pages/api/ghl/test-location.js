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
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.ghl_access_token;
  const locationId = 'hhgoXNHThJUYz4r3qS18'; // your location ID

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token available.' });
  }

  try {
    const response = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      params: {
        location_id: locationId,
        limit: 10,
        status: 'open'
      }
    });

    res.status(200).json({
      success: true,
      opportunities: response.data.opportunities || [],
      total: response.data.opportunities?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch opportunities',
      details: error.response?.data || error.message
    });
  }
}