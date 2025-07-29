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
  console.log('Get pipeline stages endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.ghl_access_token;

  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Fetching pipeline stages...');
    
    // Get pipeline stages from GHL
    const stagesResponse = await axios.get('https://services.leadconnectorhq.com/pipelines/stages', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: 'hhgoXNHThJUYz4r3qS18'
      }
    });
    
    console.log('Pipeline stages fetched successfully');
    
    const stages = stagesResponse.data.stages || [];
    console.log(`Found ${stages.length} pipeline stages`);
    
    // Log all stages for debugging
    console.log('All pipeline stages:');
    stages.forEach((stage, index) => {
      console.log(`${index + 1}. ID: ${stage.id}, Name: ${stage.name}, Pipeline: ${stage.pipelineId}`);
    });
    
    // Find stages that might be related to quotes
    const quoteRelatedStages = stages.filter(stage => {
      const name = stage.name?.toLowerCase() || '';
      return name.includes('quote') || 
             name.includes('pending') ||
             name.includes('sent') ||
             name.includes('fence') ||
             name.includes('sales');
    });
    
    console.log('Quote-related stages:', quoteRelatedStages.map(s => ({ id: s.id, name: s.name })));
    
    // Find specific stages
    const quoteSentStage = stages.find(stage => 
      stage.name?.toLowerCase().includes('quote sent') ||
      stage.name?.toLowerCase().includes('sent quote')
    );
    
    const quotePendingStage = stages.find(stage => 
      stage.name?.toLowerCase().includes('quote pending') ||
      stage.name?.toLowerCase().includes('pending quote')
    );
    
    res.status(200).json({
      success: true,
      allStages: stages,
      quoteRelatedStages: quoteRelatedStages,
      quoteSentStage: quoteSentStage,
      quotePendingStage: quotePendingStage,
      summary: {
        totalStages: stages.length,
        quoteRelatedCount: quoteRelatedStages.length,
        foundQuoteSent: !!quoteSentStage,
        foundQuotePending: !!quotePendingStage
      }
    });
    
  } catch (error) {
    console.error('Error fetching pipeline stages:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch pipeline stages',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
} 