import axios from 'axios';
import cookie from 'cookie';

export default async function handler(req, res) {
  console.log('Calendar events endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = cookie.parse(req.headers.cookie || '');
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
    console.log('Fetching calendar events with token');
    
    const response = await axios.get('https://rest.gohighlevel.com/v1/appointments/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 10 // Limit to first 10 events for testing
      }
    });

    console.log('Calendar events fetched successfully');
    res.status(200).json({
      success: true,
      events: response.data.appointments || [],
      total: response.data.total || 0
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch calendar events',
      details: error.response?.data || error.message
    });
  }
} 