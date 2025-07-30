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
  console.log('Get all pipeline stages endpoint called');
  
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
    console.log('Fetching all pipeline stages...');
    
    // Get all pipelines first
    const pipelinesResponse = await axios.get('https://services.leadconnectorhq.com/pipelines/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: 'hhgoXNHThJUYz4r3qS18'
      }
    });
    
    console.log('Pipelines fetched successfully');
    const pipelines = pipelinesResponse.data.pipelines || [];
    console.log(`Found ${pipelines.length} pipelines`);
    
    // Get stages for each pipeline
    const allStages = [];
    const pipelineDetails = [];
    
    for (const pipeline of pipelines) {
      console.log(`Fetching stages for pipeline: ${pipeline.name} (ID: ${pipeline.id})`);
      
      try {
        const stagesResponse = await axios.get('https://services.leadconnectorhq.com/pipelines/stages', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          params: {
            location_id: 'hhgoXNHThJUYz4r3qS18',
            pipeline_id: pipeline.id
          }
        });
        
        const stages = stagesResponse.data.stages || [];
        console.log(`Found ${stages.length} stages for pipeline: ${pipeline.name}`);
        
        pipelineDetails.push({
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          stages: stages.map(stage => ({
            stageId: stage.id,
            stageName: stage.name,
            stageOrder: stage.order || 0
          }))
        });
        
        allStages.push(...stages);
        
      } catch (error) {
        console.error(`Error fetching stages for pipeline ${pipeline.name}:`, error.response?.data || error.message);
        pipelineDetails.push({
          pipelineId: pipeline.id,
          pipelineName: pipeline.name,
          error: error.response?.data || error.message,
          stages: []
        });
      }
    }
    
    console.log(`Total stages found: ${allStages.length}`);
    
    // Find stages that might be related to quotes
    const quoteRelatedStages = allStages.filter(stage => {
      const name = stage.name?.toLowerCase() || '';
      return name.includes('quote') || 
             name.includes('pending') ||
             name.includes('sent') ||
             name.includes('won') ||
             name.includes('closed') ||
             name.includes('completed') ||
             name.includes('fence') ||
             name.includes('sales');
    });
    
    // Find specific stages
    const quoteSentStage = allStages.find(stage => 
      stage.name?.toLowerCase().includes('quote sent') ||
      stage.name?.toLowerCase().includes('sent quote')
    );
    
    const quotePendingStage = allStages.find(stage => 
      stage.name?.toLowerCase().includes('quote pending') ||
      stage.name?.toLowerCase().includes('pending quote')
    );
    
    const wonStage = allStages.find(stage => 
      stage.name?.toLowerCase().includes('won') ||
      stage.name?.toLowerCase().includes('closed') ||
      stage.name?.toLowerCase().includes('completed')
    );
    
    res.status(200).json({
      success: true,
      summary: {
        totalPipelines: pipelines.length,
        totalStages: allStages.length,
        quoteRelatedCount: quoteRelatedStages.length
      },
      pipelines: pipelineDetails,
      allStages: allStages.map(stage => ({
        id: stage.id,
        name: stage.name,
        pipelineId: stage.pipelineId,
        order: stage.order || 0
      })),
      quoteRelatedStages: quoteRelatedStages.map(stage => ({
        id: stage.id,
        name: stage.name,
        pipelineId: stage.pipelineId
      })),
      specificStages: {
        quoteSent: quoteSentStage ? {
          id: quoteSentStage.id,
          name: quoteSentStage.name,
          pipelineId: quoteSentStage.pipelineId
        } : null,
        quotePending: quotePendingStage ? {
          id: quotePendingStage.id,
          name: quotePendingStage.name,
          pipelineId: quotePendingStage.pipelineId
        } : null,
        won: wonStage ? {
          id: wonStage.id,
          name: wonStage.name,
          pipelineId: wonStage.pipelineId
        } : null
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