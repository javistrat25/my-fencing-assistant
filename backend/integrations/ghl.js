import axios from 'axios';

const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';
const GHL_API_KEY = process.env.GHL_API_KEY;

export async function fetchLeads() {
  try {
    const response = await axios.get(`${GHL_API_BASE}/contacts/`, {
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
      },
    });
    return response.data.contacts || [];
  } catch (error) {
    console.error('Error fetching leads from GHL:', error.message);
    throw error;
  }
}
