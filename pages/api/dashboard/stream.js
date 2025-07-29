// pages/api/dashboard/stream.js
let clients = [];

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Add this client to the list
  clients.push(res);

  // Remove client on close
  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
}

// Helper to send updates to all clients
export function sendDashboardUpdate(data) {
  clients.forEach(res => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}