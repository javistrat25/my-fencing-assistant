import express from 'express';
import { fetchLeads } from '../integrations/ghl.js';

const router = express.Router();

// GET /api/leads - fetch all leads from GHL
router.get('/', async (req, res) => {
  try {
    const leads = await fetchLeads();
    res.json({ leads });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

export default router; 