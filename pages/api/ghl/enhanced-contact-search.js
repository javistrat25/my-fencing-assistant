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
  console.log('Enhanced contact search endpoint called');
  
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

  const targetNames = ['Raul Navarro', 'Ismael Ortiz', 'David Baron', 'Adriana Ortiz'];
  const results = {
    targetNames: targetNames,
    foundContacts: [],
    notFoundContacts: [...targetNames],
    apiTests: [],
    allContactsFromOpportunities: []
  };

  try {
    console.log('Starting enhanced contact search...');
    
    // Test 1: Try direct contacts API
    console.log('Test 1: Trying direct contacts API...');
    try {
      const contactsResponse = await axios.get('https://services.leadconnectorhq.com/contacts/', {
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
      
      const contacts = contactsResponse.data.contacts || [];
      results.apiTests.push({
        method: 'Direct contacts API',
        status: 'SUCCESS',
        count: contacts.length,
        message: `Found ${contacts.length} contacts via direct API`
      });
      
      // Search for target names in direct contacts
      for (const contact of contacts) {
        for (const targetName of targetNames) {
          if (contact.name && contact.name.toLowerCase().includes(targetName.toLowerCase())) {
            results.foundContacts.push({
              targetName: targetName,
              contactName: contact.name,
              source: 'Direct contacts API',
              contact: contact
            });
          }
        }
      }
      
    } catch (error) {
      results.apiTests.push({
        method: 'Direct contacts API',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 2: Try contacts search API
    console.log('Test 2: Trying contacts search API...');
    for (const targetName of targetNames) {
      try {
        const searchResponse = await axios.get('https://services.leadconnectorhq.com/contacts/search', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          params: {
            location_id: 'hhgoXNHThJUYz4r3qS18',
            query: targetName,
            limit: 10
          }
        });
        
        const searchResults = searchResponse.data.contacts || [];
        if (searchResults.length > 0) {
          results.foundContacts.push({
            targetName: targetName,
            contactName: searchResults[0].name,
            source: 'Contacts search API',
            contact: searchResults[0]
          });
        }
        
      } catch (error) {
        console.log(`Search for ${targetName} failed:`, error.response?.data || error.message);
      }
    }
    
    // Test 3: Get all opportunities and extract contacts
    console.log('Test 3: Extracting contacts from opportunities...');
    try {
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
      
      const opportunities = opportunitiesResponse.data.opportunities || [];
      results.apiTests.push({
        method: 'Opportunities API',
        status: 'SUCCESS',
        count: opportunities.length,
        message: `Found ${opportunities.length} opportunities`
      });
      
      // Extract all unique contacts from opportunities
      const seenContactIds = new Set();
      for (const opportunity of opportunities) {
        if (opportunity.contact && opportunity.contact.id && !seenContactIds.has(opportunity.contact.id)) {
          seenContactIds.add(opportunity.contact.id);
          results.allContactsFromOpportunities.push({
            contactId: opportunity.contact.id,
            contactName: opportunity.contact.name,
            contactEmail: opportunity.contact.email,
            contactPhone: opportunity.contact.phone,
            contactCompany: opportunity.contact.company,
            opportunityId: opportunity.id,
            opportunityName: opportunity.name,
            stageId: opportunity.pipelineStageId,
            value: opportunity.monetaryValue || opportunity.amount || 0,
            status: opportunity.status
          });
        }
      }
      
      // Search for target names in opportunity contacts
      for (const contact of results.allContactsFromOpportunities) {
        for (const targetName of targetNames) {
          const contactLower = contact.contactName?.toLowerCase() || '';
          const targetLower = targetName.toLowerCase();
          
          if (contactLower === targetLower || 
              contactLower.includes(targetLower.split(' ')[0]) || 
              contactLower.includes(targetLower.split(' ')[1])) {
            
            // Check if we already found this contact
            const alreadyFound = results.foundContacts.some(found => 
              found.contactName === contact.contactName && found.targetName === targetName
            );
            
            if (!alreadyFound) {
              results.foundContacts.push({
                targetName: targetName,
                contactName: contact.contactName,
                source: 'Opportunities API',
                contact: contact
              });
            }
          }
        }
      }
      
    } catch (error) {
      results.apiTests.push({
        method: 'Opportunities API',
        status: 'FAILED',
        error: error.response?.data || error.message
      });
    }
    
    // Test 4: Try individual contact lookups for remaining targets
    console.log('Test 4: Trying individual contact lookups...');
    const remainingTargets = targetNames.filter(targetName => 
      !results.foundContacts.some(found => found.targetName === targetName)
    );
    
    for (const targetName of remainingTargets) {
      // Try different variations of the name
      const nameVariations = [
        targetName,
        targetName.split(' ')[0], // First name only
        targetName.split(' ')[1], // Last name only
        targetName.split(' ').reverse().join(' ') // Last, First
      ];
      
      for (const variation of nameVariations) {
        try {
          const searchResponse = await axios.get('https://services.leadconnectorhq.com/contacts/search', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28'
            },
            params: {
              location_id: 'hhgoXNHThJUYz4r3qS18',
              query: variation,
              limit: 5
            }
          });
          
          const searchResults = searchResponse.data.contacts || [];
          for (const result of searchResults) {
            if (result.name && result.name.toLowerCase().includes(targetName.toLowerCase())) {
              results.foundContacts.push({
                targetName: targetName,
                contactName: result.name,
                source: `Individual search (${variation})`,
                contact: result
              });
              break;
            }
          }
          
        } catch (error) {
          console.log(`Individual search for ${variation} failed:`, error.response?.data || error.message);
        }
      }
    }
    
    // Update not found contacts
    results.notFoundContacts = targetNames.filter(targetName => 
      !results.foundContacts.some(found => found.targetName === targetName)
    );
    
    console.log(`Found ${results.foundContacts.length} target contacts`);
    console.log(`Not found: ${results.notFoundContacts}`);
    
    res.status(200).json({
      success: true,
      results: results,
      summary: {
        totalTargets: targetNames.length,
        found: results.foundContacts.length,
        notFound: results.notFoundContacts.length,
        totalContactsFromOpportunities: results.allContactsFromOpportunities.length
      }
    });
    
  } catch (error) {
    console.error('Error in enhanced contact search:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to perform enhanced contact search',
      details: error.response?.data || error.message
    });
  }
} 