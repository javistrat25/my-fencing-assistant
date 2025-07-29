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

  // Fetch active quotes count on component mount
  useEffect(() => {
    fetchActiveQuotes();
    fetchQuotesPendingCount();
  }, []);

  const fetchActiveQuotes = async () => {
    setMetricsLoading(true);
    try {
      const response = await fetch('/api/ghl/opportunities');
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
      const response = await fetch('/api/ghl/opportunities');
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
      const response = await fetch('/api/ghl/opportunities');
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

          {/* Active Quotes - Now Live Data */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: '#a0a0a0',
              fontSize: '0.9rem',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Active Quotes
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

      {/* Quotes Pending Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
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
      </div>

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