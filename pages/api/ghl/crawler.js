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

class GHLDataCrawler {
  constructor(accessToken) {
    this.token = accessToken;
    this.baseURL = 'https://services.leadconnectorhq.com';
  }

  async crawlAllData() {
    console.log('Starting comprehensive GHL data crawl...');
    
    try {
      // Get locations first
      const locations = await this.getLocations();
      console.log(`Found ${locations.length} locations`);
      
      if (locations.length === 0) {
        throw new Error('No locations available for this token');
      }
      
      const locationId = locations[0].id;
      console.log(`Using location ID: ${locationId}`);
      
      // Crawl all data types
      const results = {
        locations: locations,
        opportunities: await this.crawlOpportunities(locationId),
        contacts: await this.crawlContacts(locationId),
        pipelines: await this.crawlPipelines(locationId),
        calendars: await this.crawlCalendars(locationId)
      };
      
      console.log('Crawl completed successfully');
      return results;
      
    } catch (error) {
      console.error('Crawl failed:', error);
      throw error;
    }
  }

  async getLocations() {
    try {
      // Try the correct GHL locations endpoint
      const response = await axios.get(`${this.baseURL}/locations/`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });
      
      return response.data.locations || [];
    } catch (error) {
      console.error('Error getting locations:', error.response?.data || error.message);
      
      // Fallback: try without locations endpoint
      console.log('Trying fallback approach...');
      return [{
        id: 'default',
        name: 'Default Location',
        address: 'Unknown'
      }];
    }
  }

  async crawlOpportunities(locationId) {
    console.log('Crawling opportunities...');
    
    let allOpportunities = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Limit to 10 pages to avoid infinite loops
      try {
        const response = await axios.get(`${this.baseURL}/opportunities/search`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          params: {
            location_id: locationId,
            limit: 100,
            page: page,
            status: 'open'
          }
        });

        const opportunities = response.data.opportunities || [];
        allOpportunities.push(...opportunities);
        
        console.log(`Page ${page}: Found ${opportunities.length} opportunities`);
        
        // Check if there are more pages
        hasMore = opportunities.length === 100;
        page++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error on page ${page}:`, error.response?.data || error.message);
        break;
      }
    }
    
    console.log(`Total opportunities found: ${allOpportunities.length}`);
    return allOpportunities;
  }

  async crawlContacts(locationId) {
    console.log('Crawling contacts...');
    
    try {
      const response = await axios.get(`${this.baseURL}/contacts/`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          locationId: locationId,
          limit: 100
        }
      });
      
      const contacts = response.data.contacts || [];
      console.log(`Found ${contacts.length} contacts`);
      return contacts;
      
    } catch (error) {
      console.error('Error crawling contacts:', error.response?.data || error.message);
      return [];
    }
  }

  async crawlPipelines(locationId) {
    console.log('Crawling pipelines...');
    
    try {
      const response = await axios.get(`${this.baseURL}/opportunities/pipelines`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          locationId: locationId
        }
      });
      
      const pipelines = response.data.pipelines || [];
      console.log(`Found ${pipelines.length} pipelines`);
      return pipelines;
      
    } catch (error) {
      console.error('Error crawling pipelines:', error.response?.data || error.message);
      return [];
    }
  }

  async crawlCalendars(locationId) {
    console.log('Crawling calendars...');
    
    try {
      const response = await axios.get(`${this.baseURL}/calendars/`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        params: {
          locationId: locationId
        }
      });
      
      const calendars = response.data.calendars || [];
      console.log(`Found ${calendars.length} calendars`);
      return calendars;
      
    } catch (error) {
      console.error('Error crawling calendars:', error.response?.data || error.message);
      return [];
    }
  }

  // Analyze opportunities by pipeline stage
  analyzeOpportunities(opportunities) {
    const stageAnalysis = {};
    
    opportunities.forEach(opp => {
      const stageId = opp.pipelineStageId || 'unknown';
      if (!stageAnalysis[stageId]) {
        stageAnalysis[stageId] = {
          count: 0,
          totalValue: 0,
          opportunities: []
        };
      }
      
      stageAnalysis[stageId].count++;
      stageAnalysis[stageId].totalValue += opp.monetaryValue || 0;
      stageAnalysis[stageId].opportunities.push({
        id: opp.id,
        name: opp.name,
        contact: opp.contact?.name || 'Unknown',
        value: opp.monetaryValue || 0,
        status: opp.status
      });
    });
    
    return stageAnalysis;
  }
}

export default async function handler(req, res) {
  console.log('GHL Crawler endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse cookies to get access token
  const cookies = parseCookies(req.headers.cookie);
  console.log('Cookies received:', Object.keys(cookies));
  const accessToken = cookies.ghl_access_token;
  console.log('Access token found:', !!accessToken);
  
  if (!accessToken) {
    console.log('No access token available');
    return res.status(401).json({
      error: 'No access token available. Please authenticate via OAuth first.',
      message: 'Visit /api/auth to start the OAuth flow'
    });
  }

  try {
    const crawler = new GHLDataCrawler(accessToken);
    const crawlResults = await crawler.crawlAllData();
    
    // Analyze opportunities by stage
    const stageAnalysis = crawler.analyzeOpportunities(crawlResults.opportunities);
    
    res.status(200).json({
      success: true,
      message: 'Comprehensive GHL data crawl completed',
      summary: {
        totalOpportunities: crawlResults.opportunities.length,
        totalContacts: crawlResults.contacts.length,
        totalPipelines: crawlResults.pipelines.length,
        totalCalendars: crawlResults.calendars.length,
        locations: crawlResults.locations.length
      },
      stageAnalysis: stageAnalysis,
      // Sample data for inspection
      sampleOpportunities: crawlResults.opportunities.slice(0, 5),
      sampleContacts: crawlResults.contacts.slice(0, 3),
      pipelines: crawlResults.pipelines
    });
    
  } catch (error) {
    console.error('Crawler error:', error.response?.data || error.message);
    
    res.status(500).json({
      error: 'Failed to crawl GHL data',
      details: error.response?.data || error.message,
      message: 'Check if OAuth token is valid'
    });
  }
}