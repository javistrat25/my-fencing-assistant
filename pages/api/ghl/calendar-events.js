export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For now, return a placeholder since we don't have tokens stored
  // In a real app, you'd store tokens in a database
  res.status(401).json({ 
    error: 'No access token available. Please authenticate via OAuth first.',
    message: 'Visit /api/auth to start the OAuth flow'
  });
} 