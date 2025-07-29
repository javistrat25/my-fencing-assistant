// pages/api/webhooks/ghl.js
import { sendDashboardUpdate } from '../dashboard/stream';

// In-memory store for opportunities (reset on server restart)
let opportunities = [];

function updateOpportunities(eventType, data) {
  if (eventType === 'OpportunityCreate') {
    opportunities.push(data);
  } else if (eventType === 'OpportunityUpdate') {
    // Find and update the opportunity by ID
    const idx = opportunities.findIndex(o => o.id === data.id);
    if (idx !== -1) {
      opportunities[idx] = { ...opportunities[idx], ...data };
    } else {
      opportunities.push(data); // If not found, add it
    }
  }
  // You can add logic for OpportunityDelete if needed
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventType, data } = req.body;

  // Update in-memory opportunities
  updateOpportunities(eventType, data);

  // Calculate new metrics
  const quoteSentCount = opportunities.filter(
    o => o.pipelineStage?.toLowerCase() === 'quote sent'
  ).length;
  const quotePendingCount = opportunities.filter(
    o => o.pipelineStage?.toLowerCase() === 'quoted–pending'
  ).length;

  // Broadcast updated metrics
  sendDashboardUpdate({
    type: 'metrics',
    quoteSent: quoteSentCount,
    quotePending: quotePendingCount,
    timestamp: new Date()
  });

  res.status(200).json({ success: true });
}