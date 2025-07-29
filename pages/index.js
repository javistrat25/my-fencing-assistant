import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeQuotes, setActiveQuotes] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Fetch active quotes count on component mount
  useEffect(() => {
    fetchActiveQuotes();
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

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={loadContacts}
          disabled={loading}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: '#007bff',
            color: 'white',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Contacts
        </button>
        <button
          onClick={loadOpportunities}
          disabled={loading}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: '#28a745',
            color: 'white',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Quote Sent Opportunities
        </button>
        <button
          onClick={healthCheck}
          disabled={loading}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: '#007bff',
            color: 'white',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Health Check
        </button>
      </div>

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