export default function handler(req, res) {
  console.log('Auth endpoint called at:', new Date().toISOString());
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GHL_CLIENT_ID) {
    console.log('GHL_CLIENT_ID not configured');
    return res.status(500).json({ error: 'GHL_CLIENT_ID not configured' });
  }

  console.log('GHL_CLIENT_ID found, building auth URL');

  // Use the correct Vercel URL
  const redirectUri = 'https://my-fencing-assistant.vercel.app/api/oauth/callback';

  const scopes = [
    'workflows.readonly',
    'calendars/events.readonly',
    'conversations.readonly',
    'conversations/message.readonly',
    'contacts.readonly',
    'calendars/resources.readonly',
    'calendars/groups.readonly',
    'calendars.readonly',
    'opportunities.readonly',
    'locations.readonly',
    'locations/customValues.readonly',
    'locations/customFields.readonly',
    'locations/tasks.readonly',
    'locations/tags.readonly'
  ];

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.GHL_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: scopes.join(' ')
  });

  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?${params.toString()}`;
  console.log('Redirecting to GHL auth URL');
  res.redirect(authUrl);
}