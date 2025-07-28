import express from 'express';
import dotenv from 'dotenv';
import leadsRouter from './routes/leads.js';
import tasksRouter from './routes/tasks.js';
import axios from 'axios';
import fs from 'fs';
import qs from 'qs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const TOKENS_FILE = './tokens.json';
let ghlAccessToken = null;
let ghlRefreshToken = null;

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

// Load tokens from file on server start (only if file exists)
if (fs.existsSync(TOKENS_FILE)) {
  try {
    const tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
    ghlAccessToken = tokens.access_token;
    ghlRefreshToken = tokens.refresh_token;
    console.log('Loaded tokens from file.');
  } catch (err) {
    console.error('Failed to load tokens from file:', err.message);
  }
}

app.use('/api/leads', leadsRouter);
app.use('/api/tasks', tasksRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Fencing Executive Assistant Backend is running.',
    hasToken: !!ghlAccessToken 
  });
});

// 1. Start OAuth flow: /auth
app.get('/auth', (req, res) => {
  if (!process.env.GHL_CLIENT_ID) {
    return res.status(500).json({ error: 'GHL_CLIENT_ID not configured' });
  }
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.GHL_CLIENT_ID,
    redirect_uri: process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}/oauth/callback` : 
      'http://localhost:4000/oauth/callback',
    scope: [
      'calendars.write',
      'calendars/events.write',
      'calendars/groups.write',
      'calendars/resources.write',
      'conversations.write',
      'contacts.write',
      'conversations/message.write',
      'opportunities.write',
      'workflows.readonly'
    ].join(' ')
  });
  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?${params.toString()}`;
  res.redirect(authUrl);
});

// 2. OAuth callback: /oauth/callback
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;
  console.log('Authorization code:', code);
  if (!code) {
    return res.status(400).send('No code provided');
  }
  
  if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
    return res.status(500).json({ error: 'GHL credentials not configured' });
  }
  
  try {
    const tokenResponse = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.VERCEL_URL ? 
          `https://${process.env.VERCEL_URL}/oauth/callback` : 
          'http://localhost:4000/oauth/callback',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    ghlAccessToken = access_token;
    ghlRefreshToken = refresh_token;
    
    // Only save to file if we're in development
    if (!process.env.VERCEL_URL && fs.existsSync('./')) {
      fs.writeFileSync(TOKENS_FILE, JSON.stringify({ access_token, refresh_token }, null, 2));
    }
    
    res.send('Authentication successful! You can now use the API endpoints.');
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).send('Failed to exchange code for token');
  }
});

async function refreshAccessToken() {
  if (!ghlRefreshToken) throw new Error('No refresh token available');
  if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
    throw new Error('GHL credentials not configured');
  }
  
  try {
    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token',
      qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: ghlRefreshToken,
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    const { access_token, refresh_token } = response.data;
    ghlAccessToken = access_token;
    ghlRefreshToken = refresh_token;
    
    // Only save to file if we're in development
    if (!process.env.VERCEL_URL && fs.existsSync('./')) {
      fs.writeFileSync(TOKENS_FILE, JSON.stringify({ access_token, refresh_token }, null, 2));
    }
    
    console.log('Access token refreshed.');
    return access_token;
  } catch (err) {
    console.error('Failed to refresh access token:', err.response?.data || err.message);
    throw err;
  }
}

function makeGhlApiRoute(path, apiUrl) {
  app.get(path, async (req, res) => {
    if (!ghlAccessToken) {
      return res.status(401).json({ error: 'No access token available. Please authenticate via OAuth.' });
    }
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${ghlAccessToken}`
        }
      });
      res.json(response.data);
    } catch (error) {
      // If unauthorized, try to refresh the token and retry once
      if (error.response && error.response.status === 401 && ghlRefreshToken) {
        try {
          await refreshAccessToken();
          const retryResponse = await axios.get(apiUrl, {
            headers: {
              Authorization: `Bearer ${ghlAccessToken}`
            }
          });
          return res.json(retryResponse.data);
        } catch (refreshError) {
          return res.status(401).json({ error: 'Failed to refresh access token. Please re-authenticate via OAuth.' });
        }
      }
      console.error(`Error fetching from ${apiUrl}:`, error.response?.data || error.message);
      res.status(500).send(`Failed to fetch data from ${apiUrl}`);
    }
  });
}

makeGhlApiRoute('/api/ghl/contacts', 'https://rest.gohighlevel.com/v1/contacts/');
makeGhlApiRoute('/api/ghl/conversations', 'https://rest.gohighlevel.com/v1/conversations/');
makeGhlApiRoute('/api/ghl/calendars', 'https://rest.gohighlevel.com/v1/calendars/');
makeGhlApiRoute('/api/ghl/workflows', 'https://rest.gohighlevel.com/v1/workflows/');

app.get('/api/ghl/calendar-events', async (req, res) => {
  if (!ghlAccessToken) {
    return res.status(401).json({ error: 'No access token available. Please authenticate via OAuth.' });
  }
  try {
    const response = await axios.get('https://rest.gohighlevel.com/v1/calendars/events/', {
      headers: {
        Authorization: `Bearer ${ghlAccessToken}`
      }
    });
    res.json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 401 && ghlRefreshToken) {
      try {
        await refreshAccessToken();
        const retryResponse = await axios.get('https://rest.gohighlevel.com/v1/calendars/events/', {
          headers: {
            Authorization: `Bearer ${ghlAccessToken}`
          }
        });
        return res.json(retryResponse.data);
      } catch (refreshError) {
        return res.status(401).json({ error: 'Failed to refresh access token. Please re-authenticate via OAuth.' });
      }
    }
    console.error('Error fetching calendar events:', error.response?.data || error.message);
    res.status(500).send('Failed to fetch calendar events');
  }
});

app.get('/', (req, res) => {
  res.send('Fencing Executive Assistant Backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
