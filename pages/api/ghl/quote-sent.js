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
  console.log('Quote sent endpoint called');
  
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
    console.log('Fetching quote sent opportunities...');
    
    // Now get opportunities using the correct location ID
    const opportunitiesResponse = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      params: {
        location_id: locationId,
        limit: 500, // Increased limit to get more opportunities
        // Removed status filter to get all opportunities
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
        contact: opp.contact?.name || 'No contact',
        // Log all available fields for debugging
        allFields: Object.keys(opp)
      });
    });
    
    // Create a mapping from pipelineStageId to stage name
    const stageIdToName = {
      // Hardcoded mapping based on known stage IDs
      "0fa7f486-3f87-4ba2-8daa-fe83d23ef7e5": "Quote Pending",
      "caae0892-7efb-4f5e-bcc6-07123c1cc463": "Quote Sent"
    };
    
    console.log('Stage ID to name mapping:', stageIdToName);
    console.log('Available stage IDs:', Object.keys(stageIdToName));
    
    // Get unique stage IDs from opportunities
    const opportunityStageIds = [...new Set(opportunities.map(opp => opp.pipelineStageId))];
    console.log('Opportunity stage IDs:', opportunityStageIds);
    
    // Check which stage IDs we have mappings for
    const mappedStageIds = opportunityStageIds.filter(id => stageIdToName[id]);
    const unmappedStageIds = opportunityStageIds.filter(id => !stageIdToName[id]);
    console.log('Mapped stage IDs:', mappedStageIds);
    console.log('Unmapped stage IDs:', unmappedStageIds);
    
    // Filter for "Quote Sent" stage using the mapping
    let quoteSentOpportunities = opportunities.filter(opportunity => {
      const stageId = opportunity.pipelineStageId;
      const stageName = stageIdToName[stageId] || '';
      const isQuoteSent = stageName.toLowerCase() === 'quote sent';
      
      console.log(`Opportunity ${opportunity.name}: stageId=${stageId}, stageName="${stageName}", isQuoteSent=${isQuoteSent}`);
      
      return isQuoteSent;
    });
    
    // If no opportunities found and we have unmapped stage IDs, try a fallback approach
    if (quoteSentOpportunities.length === 0 && unmappedStageIds.length > 0) {
      console.log('No opportunities found with pipeline stages mapping. Trying fallback approach...');
      
      // Try to find opportunities that might be in "Quote Sent" stage by looking at other fields
      // This is a fallback in case the pipeline stages API doesn't work
      quoteSentOpportunities = opportunities.filter(opportunity => {
        // Look for any field that might contain stage information
        const opportunityString = JSON.stringify(opportunity).toLowerCase();
        const hasQuoteSent = opportunityString.includes('quote sent') || 
                            opportunityString.includes('quoted sent') ||
                            opportunityString.includes('sent quote');
        
        console.log(`Opportunity ${opportunity.name}: fallback check - hasQuoteSent=${hasQuoteSent}`);
        
        return hasQuoteSent;
      });
    }
    
    console.log('Found', quoteSentOpportunities.length, 'quote sent opportunities out of', opportunities.length, 'total');

    res.status(200).json({
      success: true,
      opportunities: quoteSentOpportunities,
      rawOpportunities: opportunities, // TEMP: Return raw data for debugging
      totalOpportunities: opportunities.length,
      filteredCount: quoteSentOpportunities.length,
      pipelineStages: [], // TEMP: Return pipeline stages for debugging
      stageIdToName: stageIdToName // TEMP: Return mapping for debugging
    });
  } catch (error) {
    console.error('Error fetching quote sent opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch quote sent opportunities',
      details: error.response?.data || error.message
    });
  }
}