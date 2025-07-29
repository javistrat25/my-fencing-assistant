import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuotes, setActiveQuotes] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [showQuotesPending, setShowQuotesPending] = useState(false);
  const [quotesPendingData, setQuotesPendingData] = useState([]);
  const [quotesPendingLoading, setQuotesPendingLoading] = useState(false);
  const [quotesPendingCount, setQuotesPendingCount] = useState(0);
  
  // Chatbot states
  const [showChatbot, setShowChatbot] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your Executive Assistant. I can help you with:\n\n• Checking quote status and pipeline data\n• Analyzing sales metrics\n• Providing insights on opportunities\n• Answering questions about your fencing business\n\nHow can I assist you today?",
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch active quotes count on component mount
  useEffect(() => {
    fetchActiveQuotes();
    fetchQuotesPendingCount();
  }, []);

  const fetchActiveQuotes = async () => {
    setMetricsLoading(true);
    try {
      const response = await fetch('/api/ghl/quote-sent');
      const data = await response.json();
      
      if (data.success && data.opportunities) {
        // Count opportunities that are in quote sent stage
        const quoteSentCount = data.opportunities.length;
        setActiveQuotes(quoteSentCount);
      } else {
        setActiveQuotes(0);
      }
    } catch (error) {
      console.error('Error fetching active quotes:', error);
      setActiveQuotes(0);
    }
    setMetricsLoading(false);
  };

  const fetchQuotesPendingCount = async () => {
    try {
      const response = await fetch('/api/ghl/quote-pending');
      const data = await response.json();
      
      if (data.success && data.opportunities) {
        // Count opportunities that are in quote pending stage
        const pendingCount = data.opportunities.length;
        setQuotesPendingCount(pendingCount);
      } else {
        setQuotesPendingCount(0);
      }
    } catch (error) {
      console.error('Error fetching quotes pending count:', error);
      setQuotesPendingCount(0);
    }
  };

  const loadQuotesPending = async () => {
    setQuotesPendingLoading(true);
    setShowQuotesPending(true);
    try {
      const response = await fetch('/api/ghl/quote-pending');
      const data = await response.json();
      
      if (data.success && data.opportunities) {
        // Filter for quote pending opportunities and extract contact names
        const pendingQuotes = data.opportunities.map(opportunity => {
          const contact = opportunity.relations?.find(rel => rel.objectKey === 'contact');
          return {
            id: opportunity.id,
            name: contact?.fullName || opportunity.name || 'Unknown',
            value: opportunity.monetaryValue || 0,
            status: opportunity.status,
            createdAt: opportunity.createdAt
          };
        });
        setQuotesPendingData(pendingQuotes);
        setQuotesPendingCount(pendingQuotes.length);
      } else {
        setQuotesPendingData([]);
        setQuotesPendingCount(0);
      }
    } catch (error) {
      console.error('Error fetching quotes pending:', error);
      setQuotesPendingData([]);
      setQuotesPendingCount(0);
    }
    setQuotesPendingLoading(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setChatLoading(true);

    try {
      // Simulate AI response based on user input
      const response = await generateAIResponse(inputMessage);
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setChatLoading(false);
  };

  const generateAIResponse = async (userInput) => {
    const input = userInput.toLowerCase();
    
    // Check for specific keywords and provide relevant responses
    if (input.includes('quote') && input.includes('pending')) {
      return `Currently, you have ${quotesPendingCount} quotes pending in your pipeline. These are opportunities that need your attention. Would you like me to show you the details of these pending quotes?`;
    }
    
    if (input.includes('quote') && input.includes('sent')) {
      return `You have ${activeQuotes} active quotes that have been sent to customers. These represent potential revenue of approximately $${(activeQuotes * 5000).toLocaleString()} based on average quote values.`;
    }
    
    if (input.includes('revenue') || input.includes('sales')) {
      return `Your current revenue this month is $127,500. With ${activeQuotes} active quotes and a conversion rate of 67%, you're on track for strong performance this month.`;
    }
    
    if (input.includes('pipeline') || input.includes('opportunities')) {
      return `Your pipeline value is $340,000 with ${activeQuotes} active quotes and ${quotesPendingCount} pending quotes. Your conversion rate is 67%, which is excellent for the fencing industry.`;
    }
    
    if (input.includes('help') || input.includes('what can you do')) {
      return `I can help you with:\n\n• Checking quote status and counts\n• Analyzing sales metrics and revenue\n• Providing insights on your pipeline\n• Answering questions about your fencing business\n• Tracking opportunities and conversions\n\nJust ask me anything about your business!`;
    }
    
    if (input.includes('conversion') || input.includes('rate')) {
      return `Your current conversion rate is 67%, which is above industry average for fencing companies. This means you're converting about 2 out of every 3 quotes into sales.`;
    }
    
    // Default response
    return `I understand you're asking about "${userInput}". As your executive assistant, I can help you track quotes, analyze sales data, and provide insights about your fencing business. Could you be more specific about what you'd like to know?`;
  };

  const healthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setContent(JSON.stringify(data, null, 2));
    } catch (error) {
      setContent(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ghl/contacts');
      const data = await response.json();
      setContent(JSON.stringify(data, null, 2));
    } catch (error) {
      setContent(`Error Loading Contacts: ${error.message}`);
    }
    setLoading(false);
  };

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ghl/opportunities');
      const data = await response.json();
      setContent(JSON.stringify(data, null, 2));
      // Also update the active quotes count when opportunities are loaded
      if (data.success && data.opportunities) {
        setActiveQuotes(data.opportunities.length);
      }
    } catch (error) {
      setContent(`Error Loading Opportunities: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#1a1a1a', 
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        fontSize: '2.5rem', 
        fontWeight: 'bold',
        marginBottom: '40px',
        fontFamily: 'Georgia, serif'
      }}>
        Fencing Executive Assistant
      </h1>

      {/* Hero Metrics Section */}
      <div style={{
        background: '#2a2a2a',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '30px',
        border: '1px solid #404040'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '1.8rem',
          fontWeight: 'bold',
          marginBottom: '30px',
          fontFamily: 'Georgia, serif'
        }}>
          Hero Metrics Section
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          alignItems: 'center'
        }}>
          {/* Revenue This Month */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: '#a0a0a0',
              fontSize: '0.9rem',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Revenue This Month
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              $127,500
            </div>
          </div>

          {/* Active Quotes - Now from Quote Sent Stage */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: '#a0a0a0',
              fontSize: '0.9rem',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Active Quotes (Quote Sent)
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              {metricsLoading ? (
                <div style={{
                  fontSize: '1rem',
                  color: '#a0a0a0'
                }}>
                  Loading...
                </div>
              ) : (
                <>
                  {activeQuotes}
                  <button
                    onClick={fetchActiveQuotes}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#007bff',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      padding: '4px',
                      borderRadius: '4px',
                      marginLeft: '8px'
                    }}
                    title="Refresh Active Quotes"
                  >
                    🔄
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Conversion Rate */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: '#a0a0a0',
              fontSize: '0.9rem',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Conversion Rate
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              67%
            </div>
          </div>

          {/* Pipeline Value */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: '#a0a0a0',
              fontSize: '0.9rem',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Pipeline Value
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>
              $340,000
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '15px',
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {/* Quotes Pending Button */}
        <button
          onClick={loadQuotesPending}
          disabled={quotesPendingLoading}
          style={{
            padding: '15px 30px',
            border: 'none',
            background: '#dc3545',
            color: 'white',
            borderRadius: '8px',
            cursor: quotesPendingLoading ? 'not-allowed' : 'pointer',
            opacity: quotesPendingLoading ? 0.7 : 1,
            fontSize: '1.1rem',
            fontWeight: '600',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => {
            if (!quotesPendingLoading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
        >
          <span>
            {quotesPendingLoading ? 'Loading...' : `Quotes Pending: ${quotesPendingCount}`}
          </span>
          <span style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            padding: '4px 8px',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            minWidth: '20px',
            textAlign: 'center'
          }}>
            {quotesPendingCount}
          </span>
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          style={{
            padding: '15px 30px',
            border: 'none',
            background: '#6f42c1',
            color: 'white',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '600',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
        >
          <span>🤖 AI Assistant</span>
        </button>
      </div>

      {/* AI Chatbot Window */}
      {showChatbot && (
        <div style={{
          background: '#2a2a2a',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid #404040',
          maxHeight: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0,
              color: 'white'
            }}>
              🤖 Executive Assistant
            </h3>
            <button
              onClick={() => setShowChatbot(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0a0a0',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '20px',
            maxHeight: '400px',
            padding: '10px',
            background: '#1a1a1a',
            borderRadius: '8px'
          }}>
            {messages.map((message) => (
              <div key={message.id} style={{
                marginBottom: '15px',
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: message.sender === 'user' ? '#007bff' : '#404040',
                  color: 'white',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap'
                }}>
                  {message.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-start'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: '#404040',
                  color: '#a0a0a0',
                  fontSize: '0.9rem'
                }}>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about your business..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #404040',
                borderRadius: '8px',
                background: '#1a1a1a',
                color: 'white',
                fontSize: '0.9rem'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatLoading}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: '#007bff',
                color: 'white',
                borderRadius: '8px',
                cursor: !inputMessage.trim() || chatLoading ? 'not-allowed' : 'pointer',
                opacity: !inputMessage.trim() || chatLoading ? 0.5 : 1,
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Quotes Pending Window */}
      {showQuotesPending && (
        <div style={{
          background: '#2a2a2a',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          border: '1px solid #404040',
          maxHeight: '500px',
          overflow: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0,
              color: 'white'
            }}>
              Quotes Pending - Fence Sales Pipeline ({quotesPendingCount})
            </h3>
            <button
              onClick={() => setShowQuotesPending(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0a0a0',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {quotesPendingLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#a0a0a0'
            }}>
              Loading quotes pending...
            </div>
          ) : quotesPendingData.length > 0 ? (
            <div style={{
              display: 'grid',
              gap: '15px'
            }}>
              {quotesPendingData.map((quote, index) => (
                <div key={quote.id} style={{
                  background: '#1a1a1a',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #404040',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: 'white',
                      marginBottom: '5px'
                    }}>
                      {quote.name}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#a0a0a0'
                    }}>
                      Quote Value: ${quote.value.toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#28a745',
                    fontWeight: '500'
                  }}>
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#a0a0a0'
            }}>
              No quotes pending at this time.
            </div>
          )}
        </div>
      )}

      {/* Content Display */}
      {content && (
        <div style={{
          background: 'white',
          color: 'black',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px',
          fontFamily: 'monospace',
          fontSize: '14px',
          overflow: 'auto',
          maxHeight: '500px'
        }}>
          <pre>{content}</pre>
        </div>
      )}
    </div>
  );
} 