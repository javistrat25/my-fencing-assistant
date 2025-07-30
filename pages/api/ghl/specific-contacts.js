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
  console.log('Specific contacts endpoint called');
  
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

  // The specific contacts we want to find
  const targetNames = [
    'Raul Navarro',
    'Ismael Ortiz', 
    'David Baron',
    'Adriana Ortiz'
  ];

  try {
    console.log('Fetching all opportunities to find specific contacts...');
    
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
    
    // Find opportunities for our target contacts
    const foundContacts = [];
    const notFoundContacts = [...targetNames];
    
    for (const opportunity of opportunities) {
      const contactName = opportunity.contact?.name;
      if (contactName && targetNames.includes(contactName)) {
        const stageName = stageIdToName[opportunity.pipelineStageId] || 'Unknown Stage';
        
        foundContacts.push({
          contactName: contactName,
          opportunityId: opportunity.id,
          opportunityName: opportunity.name,
          pipelineStageId: opportunity.pipelineStageId,
          pipelineStageName: stageName,
          opportunityValue: opportunity.monetaryValue || opportunity.amount || 0,
          status: opportunity.status,
          source: opportunity.source,
          createdAt: opportunity.createdAt,
          updatedAt: opportunity.updatedAt,
          contact: {
            id: opportunity.contact?.id,
            name: opportunity.contact?.name,
            email: opportunity.contact?.email,
            phone: opportunity.contact?.phone,
            company: opportunity.contact?.company
          }
        });
        
        // Remove from not found list
        const index = notFoundContacts.indexOf(contactName);
        if (index > -1) {
          notFoundContacts.splice(index, 1);
        }
      }
    }
    
    // Try to find contacts directly if not found in opportunities
    for (const contactName of notFoundContacts) {
      try {
        console.log(`Searching for contact: ${contactName}`);
        
        // Search for contacts by name
        const contactsResponse = await axios.get('https://services.leadconnectorhq.com/contacts/search', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          params: {
            location_id: 'hhgoXNHThJUYz4r3qS18',
            query: contactName,
            limit: 10
          }
        });
        
        const contacts = contactsResponse.data.contacts || [];
        console.log(`Found ${contacts.length} contacts for ${contactName}`);
        
        for (const contact of contacts) {
          if (contact.name && contact.name.toLowerCase().includes(contactName.toLowerCase())) {
            foundContacts.push({
              contactName: contact.name,
              opportunityId: null,
              opportunityName: null,
              pipelineStageId: null,
              pipelineStageName: 'No Opportunity Found',
              opportunityValue: 0,
              status: null,
              source: null,
              contact: {
                id: contact.id,
                name: contact.name,
                email: contact.email,
                phone: contact.phone,
                company: contact.company
              }
            });
            break;
          }
        }
        
      } catch (error) {
        console.error(`Error searching for contact ${contactName}:`, error.response?.data || error.message);
      }
    }
    
    console.log(`Found ${foundContacts.length} target contacts`);
    console.log(`Not found: ${notFoundContacts}`);

    res.status(200).json({
      success: true,
      foundContacts: foundContacts,
      notFoundContacts: notFoundContacts,
      totalFound: foundContacts.length,
      totalSearched: targetNames.length
    });
    
  } catch (error) {
    console.error('Error fetching specific contacts:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to fetch specific contacts',
      details: error.response?.data || error.message
    });
  }
} 