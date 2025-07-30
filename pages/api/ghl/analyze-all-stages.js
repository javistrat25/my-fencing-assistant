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
  console.log('Analyze all stages endpoint called');
  
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
    console.log('Fetching all opportunities to analyze stages and contacts...');
    
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
    
    // Analyze all unique stage IDs
    const uniqueStageIds = [...new Set(opportunities.map(opp => opp.pipelineStageId))];
    console.log('Unique stage IDs found:', uniqueStageIds);
    
    // Group opportunities by stage ID
    const opportunitiesByStage = {};
    uniqueStageIds.forEach(stageId => {
      opportunitiesByStage[stageId] = opportunities.filter(opp => opp.pipelineStageId === stageId);
    });
    
    // Analyze each stage
    const stageAnalysis = {};
    for (const stageId of uniqueStageIds) {
      const stageOpportunities = opportunitiesByStage[stageId];
      const stageNames = [...new Set(stageOpportunities.map(opp => opp.name))];
      const contactNames = [...new Set(stageOpportunities.map(opp => opp.contact?.name).filter(Boolean))];
      const totalValue = stageOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || opp.amount || 0), 0);
      
      stageAnalysis[stageId] = {
        count: stageOpportunities.length,
        sampleNames: stageNames.slice(0, 5), // First 5 opportunity names
        contactNames: contactNames.slice(0, 10), // First 10 contact names
        totalValue: totalValue,
        averageValue: totalValue / stageOpportunities.length,
        statuses: [...new Set(stageOpportunities.map(opp => opp.status).filter(Boolean))]
      };
    }
    
    // Look for potential "Closed-Paid in full" stage
    const potentialClosedPaidStages = [];
    for (const [stageId, analysis] of Object.entries(stageAnalysis)) {
      const stageText = JSON.stringify(analysis).toLowerCase();
      if (stageText.includes('closed') || 
          stageText.includes('paid') || 
          stageText.includes('complete') ||
          stageText.includes('finished') ||
          stageText.includes('done')) {
        potentialClosedPaidStages.push({
          stageId: stageId,
          analysis: analysis,
          reason: 'Contains closed/paid/complete keywords'
        });
      }
    }
    
    // Search for specific target contacts
    const targetNames = ['Raul Navarro', 'Ismael Ortiz', 'David Baron', 'Adriana Ortiz'];
    const foundContacts = [];
    const partialMatches = [];
    
    for (const opportunity of opportunities) {
      const contactName = opportunity.contact?.name;
      if (contactName) {
        for (const targetName of targetNames) {
          const contactLower = contactName.toLowerCase();
          const targetLower = targetName.toLowerCase();
          
          if (contactLower === targetLower) {
            foundContacts.push({
              targetName: targetName,
              contactName: contactName,
              opportunityId: opportunity.id,
              opportunityName: opportunity.name,
              stageId: opportunity.pipelineStageId,
              value: opportunity.monetaryValue || opportunity.amount || 0,
              status: opportunity.status,
              contact: opportunity.contact
            });
          } else if (contactLower.includes(targetLower.split(' ')[0]) || 
                     contactLower.includes(targetLower.split(' ')[1])) {
            partialMatches.push({
              targetName: targetName,
              contactName: contactName,
              opportunityId: opportunity.id,
              opportunityName: opportunity.name,
              stageId: opportunity.pipelineStageId,
              value: opportunity.monetaryValue || opportunity.amount || 0,
              status: opportunity.status,
              contact: opportunity.contact
            });
          }
        }
      }
    }
    
    // Get all unique contact names for reference
    const allContactNames = [...new Set(opportunities.map(opp => opp.contact?.name).filter(Boolean))].sort();
    
    console.log(`Found ${foundContacts.length} exact matches for target contacts`);
    console.log(`Found ${partialMatches.length} partial matches for target contacts`);
    console.log(`Found ${potentialClosedPaidStages.length} potential Closed-Paid stages`);

    res.status(200).json({
      success: true,
      totalOpportunities: opportunities.length,
      uniqueStageIds: uniqueStageIds,
      stageAnalysis: stageAnalysis,
      potentialClosedPaidStages: potentialClosedPaidStages,
      foundContacts: foundContacts,
      partialMatches: partialMatches,
      allContactNames: allContactNames,
      targetNames: targetNames,
      summary: {
        totalStages: uniqueStageIds.length,
        potentialClosedPaidCount: potentialClosedPaidStages.length,
        exactMatchesFound: foundContacts.length,
        partialMatchesFound: partialMatches.length,
        totalUniqueContacts: allContactNames.length
      }
    });
    
  } catch (error) {
    console.error('Error analyzing stages:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to analyze stages',
      details: error.response?.data || error.message
    });
  }
} 