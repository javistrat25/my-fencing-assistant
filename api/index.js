import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import qs from 'qs';

dotenv.config();

const app = express();

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

// Export for Vercel
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fencing Executive Assistant</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .nav {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            justify-content: center;
        }
        .nav button {
            padding: 10px 20px;
            border: none;
            background: #007bff;
            color: white;
            border-radius: 4px;
            cursor: pointer;
        }
        .nav button:hover {
            background: #0056b3;
        }
        .content {
            min-height: 400px;
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 4px;
        }
        .loading {
            text-align: center;
            color: #666;
        }
        .error {
            color: red;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Fencing Executive Assistant</h1>
        
        <div class="nav">
            <button onclick="loadContacts()">Contacts</button>
            <button onclick="loadCalendar()">Calendar Events</button>
            <button onclick="checkHealth()">Health Check</button>
        </div>
        
        <div class="content" id="content">
            <div class="loading">Click a button to load data...</div>
        </div>
    </div>

    <script>
        async function checkHealth() {
            const content = document.getElementById('content');
            content.innerHTML = '<div class="loading">Checking backend health...</div>';
            
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                content.innerHTML = \`
                    <h3>Backend Health Check</h3>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                content.innerHTML = \`
                    <div class="error">
                        <h3>Error</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }

        async function loadContacts() {
            const content = document.getElementById('content');
            content.innerHTML = '<div class="loading">Loading contacts...</div>';
            
            try {
                const response = await fetch('/api/ghl/contacts');
                const data = await response.json();
                content.innerHTML = \`
                    <h3>Contacts</h3>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                content.innerHTML = \`
                    <div class="error">
                        <h3>Error Loading Contacts</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }

        async function loadCalendar() {
            const content = document.getElementById('content');
            content.innerHTML = '<div class="loading">Loading calendar events...</div>';
            
            try {
                const response = await fetch('/api/ghl/calendar-events');
                const data = await response.json();
                content.innerHTML = \`
                    <h3>Calendar Events</h3>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`;
            } catch (error) {
                content.innerHTML = \`
                    <div class="error">
                        <h3>Error Loading Calendar Events</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
} 