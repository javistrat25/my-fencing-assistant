import axios from 'axios';
import cookie from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = cookie.parse(req.headers.cookie || '');
  const accessToken = cookies.ghl_access_token;
  
  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Fetching contacts with token');
    
    const response = await axios.get('https://rest.gohighlevel.com/v1/contacts/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
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
    res.status(500).json({ 
      error: 'Failed to fetch contacts',
      details: error.response?.data || error.message
    });
  }
} 