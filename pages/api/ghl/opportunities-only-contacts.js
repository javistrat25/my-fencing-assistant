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
  console.log('Opportunities-only contacts endpoint called');
  
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
    console.log('Fetching all opportunities to extract contact data...');
    
    // Get all opportunities (this should work with your token)
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
    
    // Stage ID to name mapping (from your provided list)
    const stageIdToName = {
      "9de677cf-3448-43a8-ac75-9c3b912627fb": "First Contact",
      "c263cf7d-72f4-4957-a337-c795c4feeef3": "First Contact by Rincon",
      "3e480531-834d-4c7f-a6e4-7ffc08b96140": "Scheduled Visit",
      "2a02ea5a-d040-4ff5-a29b-d5747ed3340b": "Won-Invoiced",
      "08b2df08-94a2-4b26-b79d-4ab6cc8308c7": "Fabrication- In Progress",
      "df57527e-fa1f-4d4d-b348-dbaad3201e9b": "Powder- In Progress",
      "7219e696-269c-4865-bc38-c29b3e44b4aa": "Installing- In Progress",
      "27e4efe6-42cd-4937-ad8d-118ab234d95f": "Finished- Pending Payment",
      "1b494e0c-2833-4d04-8220-a5b23714a11c": "LOST client",
      "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5": "Quote Pending",
      "caae0892-7efb-4f5e-bcc6-07123c1cc463": "Quote Sent"
    };
    
    // Extract all unique contacts from opportunities
    const contactsFromOpportunities = [];
    const seenContactIds = new Set();
    
    for (const opportunity of opportunities) {
      if (opportunity.contact && opportunity.contact.id && !seenContactIds.has(opportunity.contact.id)) {
        seenContactIds.add(opportunity.contact.id);
        
        const stageName = stageIdToName[opportunity.pipelineStageId] || 'Unknown Stage';
        
        contactsFromOpportunities.push({
          contactId: opportunity.contact.id,
          contactName: opportunity.contact.name,
          contactEmail: opportunity.contact.email,
          contactPhone: opportunity.contact.phone,
          contactCompany: opportunity.contact.company,
          opportunityId: opportunity.id,
          opportunityName: opportunity.name,
          pipelineStageId: opportunity.pipelineStageId,
          pipelineStageName: stageName,
          opportunityValue: opportunity.monetaryValue || opportunity.amount || 0,
          status: opportunity.status,
          source: opportunity.source,
          createdAt: opportunity.createdAt,
          updatedAt: opportunity.updatedAt
        });
      }
    }
    
    // Search for specific target contacts
    const targetNames = ['Raul Navarro', 'Ismael Ortiz', 'David Baron', 'Adriana Ortiz'];
    const foundTargetContacts = [];
    const partialMatches = [];
    
    for (const contact of contactsFromOpportunities) {
      const contactName = contact.contactName?.toLowerCase() || '';
      
      for (const targetName of targetNames) {
        const targetLower = targetName.toLowerCase();
        
        // Exact match
        if (contactName === targetLower) {
          foundTargetContacts.push({
            targetName: targetName,
            contactName: contact.contactName,
            source: 'Opportunities API',
            contact: contact
          });
        }
        // Partial match (first name, last name, etc.)
        else if (contactName.includes(targetLower.split(' ')[0]) || 
                 contactName.includes(targetLower.split(' ')[1]) ||
                 contactName.includes(targetLower)) {
          partialMatches.push({
            targetName: targetName,
            contactName: contact.contactName,
            source: 'Opportunities API (Partial)',
            contact: contact
          });
        }
      }
    }
    
    // Look for potential "Closed-Paid in full" stage
    const potentialClosedPaidStages = [];
    const opportunitiesByStage = {};
    
    // Group opportunities by stage
    opportunities.forEach(opp => {
      if (!opportunitiesByStage[opp.pipelineStageId]) {
        opportunitiesByStage[opp.pipelineStageId] = [];
      }
      opportunitiesByStage[opp.pipelineStageId].push(opp);
    });
    
    // Analyze each stage for completion indicators
    for (const [stageId, stageOpportunities] of Object.entries(opportunitiesByStage)) {
      const stageName = stageIdToName[stageId] || 'Unknown';
      const totalValue = stageOpportunities.reduce((sum, opp) => sum + (opp.monetaryValue || opp.amount || 0), 0);
      const averageValue = totalValue / stageOpportunities.length;
      
      // Check for completion keywords
      const hasCompletionKeywords = stageOpportunities.some(opp => {
        const name = opp.name?.toLowerCase() || '';
        const status = opp.status?.toLowerCase() || '';
        return name.includes('closed') || 
               name.includes('paid') ||
               name.includes('complete') ||
               name.includes('finished') ||
               status.includes('closed') ||
               status.includes('paid') ||
               status.includes('complete') ||
               status.includes('finished');
      });
      
      // Check if this might be a "Closed-Paid in full" stage
      if (hasCompletionKeywords || averageValue > 5000) {
        potentialClosedPaidStages.push({
          stageId: stageId,
          stageName: stageName,
          count: stageOpportunities.length,
          totalValue: totalValue,
          averageValue: averageValue,
          hasCompletionKeywords: hasCompletionKeywords,
          sampleOpportunities: stageOpportunities.slice(0, 3).map(opp => opp.name)
        });
      }
    }
    
    // Get all unique contact names for reference
    const allContactNames = [...new Set(opportunities.map(opp => opp.contact?.name).filter(Boolean))].sort();
    
    console.log(`Found ${contactsFromOpportunities.length} unique contacts from opportunities`);
    console.log(`Found ${foundTargetContacts.length} exact matches for target contacts`);
    console.log(`Found ${partialMatches.length} partial matches for target contacts`);
    console.log(`Found ${potentialClosedPaidStages.length} potential Closed-Paid stages`);

    res.status(200).json({
      success: true,
      totalOpportunities: opportunities.length,
      uniqueContacts: contactsFromOpportunities.length,
      foundTargetContacts: foundTargetContacts,
      partialMatches: partialMatches,
      potentialClosedPaidStages: potentialClosedPaidStages,
      allContactNames: allContactNames,
      targetNames: targetNames,
      summary: {
        totalOpportunities: opportunities.length,
        uniqueContacts: contactsFromOpportunities.length,
        exactMatchesFound: foundTargetContacts.length,
        partialMatchesFound: partialMatches.length,
        potentialClosedPaidStages: potentialClosedPaidStages.length,
        totalUniqueContactNames: allContactNames.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching opportunities-only contacts:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch opportunities-only contacts',
      details: error.response?.data || error.message
    });
  }
} 