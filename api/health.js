export default function handler(req, res) {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Fencing Executive Assistant Backend is running.',
    timestamp: new Date().toISOString()
  });
} 