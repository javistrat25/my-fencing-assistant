import axios from 'axios';

export default async function handler(req, res) {
  console.log('Contacts API key endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key in environment variables
  const apiKey = process.env.GHL_API_KEY;
  console.log('API key found:', !!apiKey);
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'No API key configured. Please add GHL_API_KEY to environment variables.',
      message: 'Add your GHL API key to Vercel environment variables'
    });
  }

  // GHL Location ID
  const locationId = 'hhgoXNHThJUYz4r3qS18';
  console.log('Using location ID:', locationId);

  try {
    console.log('Fetching contacts with API key');
    
    const response = await axios.get(`https://rest.gohighlevel.com/v1/locations/${locationId}/contacts/`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 10 // Limit to first 10 contacts for testing
      }
    });

    console.log('Contacts fetched successfully with API key');
    res.status(200).json({
      success: true,
      contacts: response.data.contacts || [],
      total: response.data.total || 0
    });
  } catch (error) {
    console.error('Error fetching contacts with API key:', error.response?.data || error.message);
    
    res.status(500).json({ 
      error: 'Failed to fetch contacts with API key',
      details: error.response?.data || error.message
    });
  }
}