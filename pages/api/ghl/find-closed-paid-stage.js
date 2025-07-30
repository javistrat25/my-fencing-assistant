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
  console.log('Find Closed-Paid stage endpoint called');
  
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
    console.log('Fetching all opportunities to find Closed-Paid stage...');
    
    // Get all opportunities
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: 'hhgoXNHThJUYz4r3qS18',
        limit: 100
      }
    });
    
    console.log('Opportunities fetched successfully');
    
    let opportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Found ${opportunities.length} total opportunities`);
    
    // Group opportunities by stage ID
    const opportunitiesByStage = {};
    const uniqueStageIds = [...new Set(opportunities.map(opp => opp.pipelineStageId))];
    
    uniqueStageIds.forEach(stageId => {
      opportunitiesByStage[stageId] = opportunities.filter(opp => opp.pipelineStageId === stageId);
    });
    
    // Analyze each stage for potential "Closed-Paid in full" characteristics
    const stageAnalysis = {};
    const potentialClosedPaidStages = [];
    
    for (const [stageId, stageOpportunities] of Object.entries(opportunitiesByStage)) {
      const analysis = {
        stageId: stageId,
        count: stageOpportunities.length,
        opportunityNames: stageOpportunities.map(opp => opp.name),
        contactNames: stageOpportunities.map(opp => opp.contact?.name).filter(Boolean),
        totalValue: stageOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || opp.amount || 0), 0),
        averageValue: stageOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || opp.amount || 0), 0) / stageOpportunities.length,
        statuses: [...new Set(stageOpportunities.map(opp => opp.status).filter(Boolean))],
        sources: [...new Set(stageOpportunities.map(opp => opp.source).filter(Boolean))],
        // Look for keywords that suggest completion
        keywords: {
          closed: stageOpportunities.some(opp => 
            opp.name?.toLowerCase().includes('closed') || 
            opp.status?.toLowerCase().includes('closed')
          ),
          paid: stageOpportunities.some(opp => 
            opp.name?.toLowerCase().includes('paid') || 
            opp.status?.toLowerCase().includes('paid')
          ),
          complete: stageOpportunities.some(opp => 
            opp.name?.toLowerCase().includes('complete') || 
            opp.status?.toLowerCase().includes('complete')
          ),
          finished: stageOpportunities.some(opp => 
            opp.name?.toLowerCase().includes('finished') || 
            opp.status?.toLowerCase().includes('finished')
          ),
          done: stageOpportunities.some(opp => 
            opp.name?.toLowerCase().includes('done') || 
            opp.status?.toLowerCase().includes('done')
          ),
          final: stageOpportunities.some(opp => 
            opp.name?.toLowerCase().includes('final') || 
            opp.status?.toLowerCase().includes('final')
          )
        }
      };
      
      stageAnalysis[stageId] = analysis;
      
      // Check if this stage might be "Closed-Paid in full"
      const hasCompletionKeywords = analysis.keywords.closed || 
                                   analysis.keywords.paid || 
                                   analysis.keywords.complete || 
                                   analysis.keywords.finished || 
                                   analysis.keywords.done || 
                                   analysis.keywords.final;
      
      // Also check if this stage has high average values (suggesting completed projects)
      const hasHighValues = analysis.averageValue > 5000; // Threshold for "high value"
      
      if (hasCompletionKeywords || hasHighValues) {
        potentialClosedPaidStages.push({
          stageId: stageId,
          analysis: analysis,
          reasons: []
        });
        
        if (hasCompletionKeywords) {
          potentialClosedPaidStages[potentialClosedPaidStages.length - 1].reasons.push('Contains completion keywords');
        }
        if (hasHighValues) {
          potentialClosedPaidStages[potentialClosedPaidStages.length - 1].reasons.push('High average value');
        }
      }
    }
    
    // Sort potential stages by relevance (more keywords = higher relevance)
    potentialClosedPaidStages.sort((a, b) => {
      const aScore = Object.values(a.analysis.keywords).filter(Boolean).length;
      const bScore = Object.values(b.analysis.keywords).filter(Boolean).length;
      return bScore - aScore;
    });
    
    // Get all unique contact names for reference
    const allContactNames = [...new Set(opportunities.map(opp => opp.contact?.name).filter(Boolean))].sort();
    
    console.log(`Found ${potentialClosedPaidStages.length} potential Closed-Paid stages`);
    console.log('Potential stages:', potentialClosedPaidStages.map(stage => ({
      stageId: stage.stageId,
      reasons: stage.reasons,
      count: stage.analysis.count,
      averageValue: stage.analysis.averageValue
    })));

    res.status(200).json({
      success: true,
      totalOpportunities: opportunities.length,
      uniqueStageIds: uniqueStageIds,
      stageAnalysis: stageAnalysis,
      potentialClosedPaidStages: potentialClosedPaidStages,
      allContactNames: allContactNames,
      summary: {
        totalStages: uniqueStageIds.length,
        potentialClosedPaidCount: potentialClosedPaidStages.length,
        totalUniqueContacts: allContactNames.length
      }
    });
    
  } catch (error) {
    console.error('Error finding Closed-Paid stage:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to find Closed-Paid stage',
      details: error.response?.data || error.message
    });
  }
} 