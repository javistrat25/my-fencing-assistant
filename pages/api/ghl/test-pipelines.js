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
  console.log('Test pipelines endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  const accessToken = cookies.ghl_access_token;
  const locationId = 'hhgoXNHThJUYz4r3qS18';

  if (!accessToken) {
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    console.log('Testing pipeline stages API...');
    
    // Test the pipelines endpoint
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
    
    console.log('Pipelines API response:', JSON.stringify(pipelinesResponse.data, null, 2));
    
    // Extract all stages from all pipelines
    const pipelineStages = [];
    if (pipelinesResponse.data.pipelines) {
      pipelinesResponse.data.pipelines.forEach(pipeline => {
        console.log(`Pipeline: ${pipeline.name} (${pipeline.id})`);
        if (pipeline.stages) {
          pipeline.stages.forEach(stage => {
            console.log(`  Stage: ${stage.name} (${stage.id})`);
            pipelineStages.push({
              id: stage.id,
              name: stage.name,
              pipelineId: pipeline.id,
              pipelineName: pipeline.name
            });
          });
        }
      });
    }
    
    // Create stage ID to name mapping
    const stageIdToName = {};
    pipelineStages.forEach(stage => {
      stageIdToName[stage.id] = stage.name;
    });
    
    // Test the specific stage IDs we know about
    const knownStageIds = [
      "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5", // From the quote pending opportunity
      "caae0892-7efb-4f5e-bcc6-07123c1cc463"  // From the quote sent opportunity
    ];
    
    const stageMappings = {};
    knownStageIds.forEach(stageId => {
      stageMappings[stageId] = stageIdToName[stageId] || 'NOT FOUND';
    });

    res.status(200).json({
      success: true,
      pipelinesResponse: pipelinesResponse.data,
      pipelineStages: pipelineStages,
      stageIdToName: stageIdToName,
      knownStageMappings: stageMappings,
      totalPipelines: pipelinesResponse.data.pipelines?.length || 0,
      totalStages: pipelineStages.length
    });
    
  } catch (error) {
    console.error('Error testing pipelines:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to test pipelines',
      details: error.response?.data || error.message,
      status: error.response?.status
    });
  }
}