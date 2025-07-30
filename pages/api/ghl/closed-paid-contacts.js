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
  console.log('Closed-Paid contacts endpoint called');
  
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
    console.log('Fetching all opportunities to find Closed-Paid contacts...');
    
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
    
    // Log all opportunities to help identify the "Closed-Paid in full" stage
    console.log('All opportunities with their stage IDs:');
    opportunities.forEach((opp, index) => {
      console.log(`${index + 1}. ${opp.name} - Stage ID: ${opp.pipelineStageId} - Contact: ${opp.contact?.name || 'No contact'}`);
    });
    
    // Get unique stage IDs to help identify the correct stage
    const uniqueStageIds = [...new Set(opportunities.map(opp => opp.pipelineStageId))];
    console.log('Unique stage IDs found:', uniqueStageIds);
    
    // For now, let's look for opportunities that might be "Closed-Paid in full"
    // We'll need to identify the correct stage ID
    const possibleClosedPaidOpportunities = opportunities.filter(opportunity => {
      // Look for opportunities that might be completed/paid
      const name = opportunity.name?.toLowerCase() || '';
      const status = opportunity.status?.toLowerCase() || '';
      
      return name.includes('closed') || 
             name.includes('paid') ||
             status.includes('closed') ||
             status.includes('paid') ||
             status.includes('completed');
    });
    
    // Get contact details for these opportunities
    const contactsWithDetails = [];
    
    for (const opportunity of possibleClosedPaidOpportunities) {
      if (opportunity.contact?.id) {
        try {
          // Get detailed contact information
          const contactResponse = await axios.get(`https://services.leadconnectorhq.com/contacts/${opportunity.contact.id}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28'
            }
          });
          
          const contactDetails = contactResponse.data;
          contactsWithDetails.push({
            opportunityId: opportunity.id,
            opportunityName: opportunity.name,
            opportunityValue: opportunity.monetaryValue || opportunity.amount || 0,
            stageId: opportunity.pipelineStageId,
            contact: {
              id: contactDetails.id,
              name: contactDetails.name,
              email: contactDetails.email,
              phone: contactDetails.phone,
              company: contactDetails.company,
              address: contactDetails.address
            }
          });
          
        } catch (error) {
          console.error(`Error fetching contact details for ${opportunity.contact.id}:`, error.response?.data || error.message);
          // Still include the opportunity with basic contact info
          contactsWithDetails.push({
            opportunityId: opportunity.id,
            opportunityName: opportunity.name,
            opportunityValue: opportunity.monetaryValue || opportunity.amount || 0,
            stageId: opportunity.pipelineStageId,
            contact: opportunity.contact || { name: 'Contact not found' }
          });
        }
      }
    }
    
    console.log(`Found ${contactsWithDetails.length} potential Closed-Paid contacts`);

    res.status(200).json({
      success: true,
      contacts: contactsWithDetails,
      totalContacts: contactsWithDetails.length,
      allOpportunities: opportunities.length,
      uniqueStageIds: uniqueStageIds,
      allOpportunitiesWithStages: opportunities.map(opp => ({
        id: opp.id,
        name: opp.name,
        stageId: opp.pipelineStageId,
        contactName: opp.contact?.name || 'No contact',
        value: opp.monetaryValue || opp.amount || 0
      }))
    });
    
  } catch (error) {
    console.error('Error fetching Closed-Paid contacts:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch Closed-Paid contacts',
      details: error.response?.data || error.message
    });
  }
} 