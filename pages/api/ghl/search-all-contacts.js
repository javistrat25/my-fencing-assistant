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
  console.log('Search all contacts endpoint called');
  
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
    console.log('Fetching all contacts...');
    
    // Get all contacts
    const contactsResponse = await axios.get('https://services.leadconnectorhq.com/contacts/search', {
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
    
    console.log('Contacts fetched successfully');
    
    let allContacts = contactsResponse.data.contacts || [];
    console.log(`Found ${allContacts.length} total contacts`);
    
    // Log all contact names to help identify the correct names
    console.log('All contacts found:');
    allContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.name} - Email: ${contact.email} - Phone: ${contact.phone}`);
    });
    
    // Search for partial matches of our target names
    const targetNames = [
      'Raul Navarro',
      'Ismael Ortiz', 
      'David Baron',
      'Adriana Ortiz'
    ];
    
    const partialMatches = [];
    
    for (const contact of allContacts) {
      const contactName = contact.name?.toLowerCase() || '';
      
      for (const targetName of targetNames) {
        const targetLower = targetName.toLowerCase();
        
        // Check for partial matches (first name, last name, etc.)
        if (contactName.includes(targetLower.split(' ')[0]) || 
            contactName.includes(targetLower.split(' ')[1]) ||
            contactName.includes(targetLower)) {
          
          partialMatches.push({
            contactName: contact.name,
            targetName: targetName,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            id: contact.id
          });
        }
      }
    }
    
    // Also get all opportunities to see if contacts are there with different names
    console.log('Fetching all opportunities to cross-reference...');
    
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
    
    let opportunities = opportunitiesResponse.data.opportunities || [];
    console.log(`Found ${opportunities.length} total opportunities`);
    
    // Get all opportunity contacts
    const opportunityContacts = opportunities
      .filter(opp => opp.contact)
      .map(opp => ({
        contactName: opp.contact.name,
        opportunityName: opp.name,
        opportunityId: opp.id,
        pipelineStageId: opp.pipelineStageId,
        value: opp.monetaryValue || opp.amount || 0
      }));
    
    console.log('Opportunity contacts:');
    opportunityContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.contactName} - Opportunity: ${contact.opportunityName} - Stage: ${contact.pipelineStageId}`);
    });

    res.status(200).json({
      success: true,
      allContacts: allContacts.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        id: c.id
      })),
      partialMatches: partialMatches,
      opportunityContacts: opportunityContacts,
      totalContacts: allContacts.length,
      totalOpportunities: opportunities.length,
      totalPartialMatches: partialMatches.length
    });
    
  } catch (error) {
    console.error('Error searching all contacts:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to search all contacts',
      details: error.response?.data || error.message
    });
  }
} 