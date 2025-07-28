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

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.GHL_CLIENT_ID,
    redirect_uri: `https://${process.env.VERCEL_URL}/api/oauth/callback`,
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
  console.log('Redirecting to GHL auth URL');
  res.redirect(authUrl);
}