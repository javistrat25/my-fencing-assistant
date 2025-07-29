import axios from 'axios';

export default async function handler(req, res) {
  console.log('Test API key endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check for API key in environment variables
  const apiKey = process.env.GHL_API_KEY;
  console.log('API key found:', !!apiKey);
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'No API key configured. Please add GHL_API_KEY to environment variables.',
      message: 'Add your GHL API key to Vercel environment variables',
      instructions: [
        '1. Go to your GHL Developer Dashboard',
        '2. Find your app settings',
        '3. Look for "API Key" or "Generate API Key"',
        '4. Add the API key to Vercel environment variables as GHL_API_KEY'
      ]
    });
  }

  // GHL Location ID
  const locationId = 'hhgoXNHThJUYz4r3qS18';
  console.log('Using location ID:', locationId);

  try {
    console.log('Testing API key with GHL API...');
    
    const response = await axios.get(`https://rest.gohighlevel.com/v1/locations/${locationId}/contacts/`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 5 // Limit to first 5 contacts for testing
      }
    });

    console.log('API key test successful');
    res.status(200).json({
      success: true,
      message: 'API key is valid for GHL API calls',
      data: response.data,
      contactsCount: response.data.contacts?.length || 0
    });
  } catch (error) {
    console.error('API key test failed:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'API key test failed',
      details: error.response?.data || error.message,
      apiKeyInfo: {
        length: apiKey.length,
        preview: apiKey.substring(0, 20) + '...'
      }
    });
  }
}