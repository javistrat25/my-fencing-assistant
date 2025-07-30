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
  console.log('All opportunities endpoint called');
  
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
    console.log('Fetching ALL opportunities using pagination...');
    
    let allOpportunities = [];
    let hasMore = true;
    let page = 0;
    const limit = 100;
    
    while (hasMore) {
      console.log(`Fetching page ${page + 1}...`);
      
      try {
        const response = await axios.get('https://services.leadconnectorhq.com/opportunities/search', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          params: {
            location_id: 'hhgoXNHThJUYz4r3qS18',
            limit: limit,
            skip: page * limit
          }
        });
        
        const opportunities = response.data.opportunities || [];
        console.log(`Page ${page + 1}: Found ${opportunities.length} opportunities`);
        
        if (opportunities.length === 0) {
          hasMore = false;
        } else {
          allOpportunities = allOpportunities.concat(opportunities);
          page++;
          
          // Safety check to prevent infinite loops
          if (page > 10) {
            console.log('Reached maximum page limit (10), stopping pagination');
            hasMore = false;
          }
        }
        
      } catch (error) {
        console.error(`Error fetching page ${page + 1}:`, error.response?.data || error.message);
        hasMore = false;
      }
    }
    
    console.log(`Total opportunities found: ${allOpportunities.length}`);
    
    // Stage ID to name mapping
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
    
    // Log all opportunities with their contacts
    console.log('All opportunities with contacts:');
    allOpportunities.forEach((opp, index) => {
      const stageName = stageIdToName[opp.pipelineStageId] || 'Unknown Stage';
      console.log(`${index + 1}. ${opp.name} - Contact: ${opp.contact?.name || 'No contact'} - Stage: ${stageName} (${opp.pipelineStageId})`);
    });
    
    // Search for our target names
    const targetNames = [
      'Raul Navarro',
      'Ismael Ortiz', 
      'David Baron',
      'Adriana Ortiz'
    ];
    
    const foundTargets = [];
    
    for (const opportunity of allOpportunities) {
      const contactName = opportunity.contact?.name;
      if (contactName && targetNames.includes(contactName)) {
        const stageName = stageIdToName[opportunity.pipelineStageId] || 'Unknown Stage';
        foundTargets.push({
          contactName: contactName,
          opportunityName: opportunity.name,
          pipelineStageId: opportunity.pipelineStageId,
          pipelineStageName: stageName,
          opportunityValue: opportunity.monetaryValue || opportunity.amount || 0,
          contact: opportunity.contact
        });
      }
    }
    
    console.log(`Found ${foundTargets.length} target contacts in all opportunities`);

    res.status(200).json({
      success: true,
      totalOpportunities: allOpportunities.length,
      foundTargets: foundTargets,
      allOpportunities: allOpportunities.map(opp => ({
        id: opp.id,
        name: opp.name,
        contactName: opp.contact?.name || 'No contact',
        pipelineStageId: opp.pipelineStageId,
        pipelineStageName: stageIdToName[opp.pipelineStageId] || 'Unknown Stage',
        value: opp.monetaryValue || opp.amount || 0
      }))
    });
    
  } catch (error) {
    console.error('Error fetching all opportunities:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch all opportunities',
      details: error.response?.data || error.message
    });
  }
} 