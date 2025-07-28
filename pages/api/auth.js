export default function handler(req, res) {
  console.log('Auth endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GHL_CLIENT_ID) {
    return res.status(500).json({ error: 'GHL_CLIENT_ID not configured' });
  }

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
  console.log('Redirecting to:', authUrl);
  res.redirect(authUrl);
}