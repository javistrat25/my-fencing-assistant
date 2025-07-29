export default function handler(req, res) {
  res.status(200).json({
    message: 'Basic GHL test endpoint working',
    timestamp: new Date().toISOString()
  });
} 