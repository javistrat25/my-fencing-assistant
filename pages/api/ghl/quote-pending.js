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
  console.log('Quote pending endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  console.log('Cookies received:', Object.keys(cookies));
  const accessToken = cookies.ghl_access_token;
  console.log('Access token found:', !!accessToken);
  
  const locationId = 'hhgoXNHThJUYz4r3qS18';

  if (!accessToken) {
    console.log('No access token available');
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Fetching quote pending opportunities...');
    
    // First, get pipeline stages to create a mapping
    let pipelineStages = [];
    try {
      const pipelinesResponse = await axios.get('https://services.leadconnectorhq.com/pipelines/', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          location_id: locationId
        }
      });
      
      console.log('Pipelines response:', JSON.stringify(pipelinesResponse.data, null, 2));
      
      // Extract all stages from all pipelines
      if (pipelinesResponse.data.pipelines) {
        pipelinesResponse.data.pipelines.forEach(pipeline => {
          if (pipeline.stages) {
            pipeline.stages.forEach(stage => {
              pipelineStages.push({
                id: stage.id,
                name: stage.name,
                pipelineId: pipeline.id
              });
            });
          }
        });
      }
      
      console.log(`Found ${pipelineStages.length} pipeline stages:`, pipelineStages.map(s => `${s.name} (${s.id})`));
      
    } catch (pipelineError) {
      console.error('Error fetching pipelines:', pipelineError.response?.data || pipelineError.message);
      // Continue without pipeline stages - we'll use a fallback approach
    }
    
    // Now get opportunities using the correct location ID
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: locationId,
        limit: 100,
        status: 'open'
      }
    });
    
    console.log('Opportunities fetched successfully');
    
    let opportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Found ${opportunities.length} total opportunities`);
    
    // Debug: Log first few opportunities to see their structure
    console.log('Sample opportunities structure:');
    opportunities.slice(0, 3).forEach((opp, index) => {
      console.log(`Opportunity ${index + 1}:`, {
        id: opp.id,
        name: opp.name,
        status: opp.status,
        pipelineStageId: opp.pipelineStageId,
        pipelineId: opp.pipelineId,
        contact: opp.contact?.name || 'No contact'
      });
    });
    
    // Create a mapping from pipelineStageId to stage name
    const stageIdToName = {};
    pipelineStages.forEach(stage => {
      stageIdToName[stage.id] = stage.name;
    });
    
    console.log('Stage ID to name mapping:', stageIdToName);
    
    // Filter for "Quote Pending" stage using the mapping
    const quotePendingOpportunities = opportunities.filter(opportunity => {
      const stageId = opportunity.pipelineStageId;
      const stageName = stageIdToName[stageId] || '';
      const isQuotePending = stageName.toLowerCase() === 'quote pending';
      
      console.log(`Opportunity ${opportunity.name}: stageId=${stageId}, stageName="${stageName}", isQuotePending=${isQuotePending}`);
      
      return isQuotePending;
    });
    
    console.log('Found', quotePendingOpportunities.length, 'quote pending opportunities out of', opportunities.length, 'total');

    res.status(200).json({
      success: true,
      opportunities: quotePendingOpportunities,
      rawOpportunities: opportunities, // TEMP: Return raw data for debugging
      totalOpportunities: opportunities.length,
      filteredCount: quotePendingOpportunities.length,
      pipelineStages: pipelineStages, // TEMP: Return pipeline stages for debugging
      stageIdToName: stageIdToName // TEMP: Return mapping for debugging
    });
  } catch (error) {
    console.error('Error fetching quote pending opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch quote pending opportunities',
      details: error.response?.data || error.message
    });
  }
}