export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simple AI response logic based on the message content
    const userMessage = message.toLowerCase();
    let response = '';

    if (userMessage.includes('quote') || userMessage.includes('quotes')) {
      if (userMessage.includes('active') || userMessage.includes('sent')) {
        response = `You currently have ${context?.activeQuotes || 0} active quotes in the "Quote Sent" stage. These are opportunities where quotes have been sent to customers and are awaiting their response.`;
      } else if (userMessage.includes('pending')) {
        response = `You have ${context?.quotesPending || 0} quotes pending in the "Quote Pending" stage. These are opportunities that are ready for quotes to be prepared and sent.`;
      } else {
        response = `Here's your current quote status:\n\n• Active Quotes (Quote Sent): ${context?.activeQuotes || 0}\n• Quotes Pending: ${context?.quotesPending || 0}\n\nWould you like me to help you with any specific aspect of your quote pipeline?`;
      }
    } else if (userMessage.includes('revenue') || userMessage.includes('earnings') || userMessage.includes('income')) {
      response = `Your current revenue is ${context?.revenue ? `$${context.revenue.toLocaleString()}` : 'not available'}. This represents the total value of won opportunities in your pipeline.`;
    } else if (userMessage.includes('won') || userMessage.includes('invoice')) {
      response = `You have ${context?.wonInvoices || 0} won invoices. These are completed opportunities that have been successfully closed.`;
    } else if (userMessage.includes('help') || userMessage.includes('assist')) {
      response = `I'm here to help you with your fencing business! I can help you with:\n\n• Checking quote status and pipeline data\n• Analyzing sales metrics and revenue\n• Providing insights on opportunities\n• Answering questions about your business performance\n\nWhat would you like to know?`;
    } else if (userMessage.includes('hello') || userMessage.includes('hi')) {
      response = `Hello! I'm your Executive Assistant for your fencing business. How can I help you today? I can provide insights on your quotes, revenue, and business performance.`;
    } else {
      response = `I understand you're asking about "${message}". I can help you with information about your quotes, revenue, won invoices, and overall business performance. Could you please be more specific about what you'd like to know?`;
    }

    res.status(200).json({
      success: true,
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    });
  }
} 