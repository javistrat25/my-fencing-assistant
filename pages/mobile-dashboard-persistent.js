import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MobileDashboardPersistent() {
  const [activeQuotes, setActiveQuotes] = useState(0);
  const [quotesPending, setQuotesPending] = useState(0);
  const [wonInvoices, setWonInvoices] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [tokenStatus, setTokenStatus] = useState('checking');
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // AI Assistant states
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

  // Check for auth token and handle persistence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Try to get token from multiple sources
      let token = null;
      
      // 1. Check URL parameters first (for initial setup)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      
      if (tokenFromUrl) {
        token = tokenFromUrl;
        localStorage.setItem('ghl_access_token', token);
        console.log('📱 Token received from URL and saved');
      } else {
        // 2. Check localStorage (for returning users)
        token = localStorage.getItem('ghl_access_token');
        if (token) {
          console.log('📱 Token found in localStorage');
        }
      }
      
      if (token) {
        setAuthToken(token);
        setTokenStatus('valid');
        // Test the token
        testToken(token);
      } else {
        setAuthError('No authentication token found. Please use the token transfer tool first.');
        setTokenStatus('missing');
      }
    }
  }, []);

  const testToken = async (token) => {
    try {
      const response = await fetch('/api/ghl/auto-refresh-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.needsRefresh) {
          // Update with new token
          localStorage.setItem('ghl_access_token', data.token);
          setAuthToken(data.token);
          console.log('🔄 Token refreshed automatically');
        }
        setTokenStatus('valid');
        fetchMetrics(data.token);
      } else {
        setAuthError('Token is invalid. Please re-authenticate.');
        setTokenStatus('invalid');
      }
    } catch (error) {
      console.error('Token test failed:', error);
      setAuthError('Token validation failed. Please re-authenticate.');
      setTokenStatus('invalid');
    }
  };

  // Fetch metrics when auth token is available
  useEffect(() => {
    if (authToken && tokenStatus === 'valid') {
      fetchMetrics();
    }
  }, [authToken, tokenStatus]);

  const fetchMetrics = async () => {
    if (!authToken) return;
    
    setMetricsLoading(true);
    console.log('🔄 Starting to fetch all metrics...');
    
    try {
      // Fetch Active Quotes
      console.log('📊 Fetching Active Quotes...');
      const activeQuotesResponse = await fetch(`/api/ghl/quote-sent-efficient?token=${authToken}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!activeQuotesResponse.ok) {
        console.error('❌ Active Quotes HTTP error:', activeQuotesResponse.status);
        setActiveQuotes(0);
      } else {
        const activeQuotesData = await activeQuotesResponse.json();
        console.log('📊 Active Quotes response:', activeQuotesData);
        if (activeQuotesData.success && activeQuotesData.opportunities) {
          const count = activeQuotesData.opportunities.length;
          console.log('✅ Setting Active Quotes to:', count);
          setActiveQuotes(count);
        } else {
          console.log('❌ Active Quotes failed or no data');
          setActiveQuotes(0);
        }
      }

      // Fetch Quotes Pending
      console.log('📊 Fetching Quotes Pending...');
      const quotesPendingResponse = await fetch(`/api/ghl/quote-pending-efficient?token=${authToken}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!quotesPendingResponse.ok) {
        console.error('❌ Quotes Pending HTTP error:', quotesPendingResponse.status);
        setQuotesPending(0);
      } else {
        const quotesPendingData = await quotesPendingResponse.json();
        console.log('📊 Quotes Pending response:', quotesPendingData);
        if (quotesPendingData.success && quotesPendingData.opportunities) {
          const count = quotesPendingData.opportunities.length;
          console.log('✅ Setting Quotes Pending to:', count);
          setQuotesPending(count);
        } else {
          console.log('❌ Quotes Pending failed or no data');
          setQuotesPending(0);
        }
      }

      // Fetch Won Invoices
      console.log('📊 Fetching Won Invoices...');
      const wonInvoicesResponse = await fetch(`/api/ghl/won-invoices?token=${authToken}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!wonInvoicesResponse.ok) {
        console.error('❌ Won Invoices HTTP error:', wonInvoicesResponse.status);
        setWonInvoices(0);
      } else {
        const wonInvoicesData = await wonInvoicesResponse.json();
        console.log('📊 Won Invoices response:', wonInvoicesData);
        if (wonInvoicesData.success) {
          const count = wonInvoicesData.total;
          console.log('✅ Setting Won Invoices to:', count);
          setWonInvoices(count);
        } else {
          console.log('❌ Won Invoices failed or no data');
          setWonInvoices(0);
        }
      }

      // Fetch Revenue
      console.log('📊 Fetching Revenue...');
      const revenueResponse = await fetch(`/api/ghl/revenue?token=${authToken}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (!revenueResponse.ok) {
        console.error('❌ Revenue HTTP error:', revenueResponse.status);
        setRevenue(0);
      } else {
        const revenueData = await revenueResponse.json();
        console.log('📊 Revenue response:', revenueData);
        if (revenueData.success) {
          const amount = revenueData.revenue;
          console.log('✅ Setting Revenue to:', amount);
          setRevenue(amount);
        } else {
          console.log('❌ Revenue failed or no data');
          setRevenue(0);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching metrics:', error);
    }
    
    console.log('✅ Finished fetching metrics');
    setMetricsLoading(false);
  };

  const clearToken = () => {
    localStorage.removeItem('ghl_access_token');
    setAuthToken(null);
    setAuthError('Token cleared. Please re-authenticate.');
    setTokenStatus('missing');
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            activeQuotes,
            quotesPending,
            wonInvoices,
            revenue
          }
        })
      });

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: data.response || "I'm sorry, I couldn't process your request. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, there was an error processing your request. Please try again.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (authError && tokenStatus !== 'valid') {
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Head>
          <title>Mobile Dashboard - Authentication Required</title>
        </Head>
        
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#991b1b', marginBottom: '16px' }}>Authentication Required</h2>
          <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>{authError}</p>
          <p style={{ color: '#7f1d1d', fontSize: '14px', marginBottom: '20px' }}>
            Visit the token transfer tool to get your authentication token.
          </p>
          <a 
            href="/mobile-token"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Get Token
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: 'Arial, sans-serif',
      display: 'flex'
    }}>
      <Head>
        <title>Mobile Dashboard - Fencing Assistant</title>
      </Head>
      
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: '0 0 8px 0'
          }}>
            Fencing Assistant
          </h2>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280',
            margin: 0
          }}>
            Mobile Dashboard
          </p>
        </div>

        <button
          onClick={() => setCurrentPage('dashboard')}
          style={{
            padding: '12px 16px',
            backgroundColor: currentPage === 'dashboard' ? '#3b82f6' : 'transparent',
            color: currentPage === 'dashboard' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '16px',
            fontWeight: currentPage === 'dashboard' ? '600' : '400'
          }}
        >
          📊 Dashboard
        </button>

        <button
          onClick={() => setCurrentPage('ai-assistant')}
          style={{
            padding: '12px 16px',
            backgroundColor: currentPage === 'ai-assistant' ? '#3b82f6' : 'transparent',
            color: currentPage === 'ai-assistant' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '16px',
            fontWeight: currentPage === 'ai-assistant' ? '600' : '400'
          }}
        >
          🤖 AI Assistant
        </button>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={clearToken}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {currentPage === 'dashboard' ? (
          <>
            {/* Header */}
            <div style={{
              backgroundColor: 'white',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#111827',
                margin: 0
              }}>
                Dashboard
              </h1>
            </div>

            {/* Metrics Cards */}
            <div style={{ padding: '20px' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '16px',
                marginBottom: '20px'
              }}>
                {/* Active Quotes */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <span style={{ color: 'white', fontSize: '20px' }}>📊</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                        {metricsLoading ? '...' : formatNumber(activeQuotes)}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                        Active Quotes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quotes Pending */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#eab308',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <span style={{ color: 'white', fontSize: '20px' }}>⏳</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                        {metricsLoading ? '...' : formatNumber(quotesPending)}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                        Quotes Pending
                      </p>
                    </div>
                  </div>
                </div>

                {/* Won Invoices */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#10b981',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <span style={{ color: 'white', fontSize: '20px' }}>✅</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                        {metricsLoading ? '...' : formatNumber(wonInvoices)}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                        Won Invoices
                      </p>
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#8b5cf6',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <span style={{ color: 'white', fontSize: '20px' }}>💰</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                        {metricsLoading ? '...' : formatCurrency(revenue)}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                        Revenue
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {metricsLoading && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ color: '#6b7280' }}>Loading metrics...</p>
                </div>
              )}

              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                backgroundColor: '#d1fae5', 
                borderRadius: '8px',
                border: '1px solid #10b981'
              }}>
                <h4 style={{ color: '#065f46', margin: '0 0 8px 0' }}>✅ Persistent Authentication</h4>
                <p style={{ color: '#065f46', fontSize: '14px', margin: 0 }}>
                  Your token is saved and will work automatically. No need to repeat the setup process!
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* AI Assistant Header */}
            <div style={{
              backgroundColor: 'white',
              padding: '16px 20px',
              borderBottom: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: '#111827',
                margin: 0
              }}>
                AI Assistant
              </h1>
            </div>

            {/* Chat Interface */}
            <div style={{ 
              height: 'calc(100vh - 80px)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Messages */}
              <div style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                backgroundColor: '#f8fafc'
              }}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: message.sender === 'user' ? '#3b82f6' : 'white',
                      color: message.sender === 'user' ? 'white' : '#111827',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      border: message.sender === 'assistant' ? '1px solid #e5e7eb' : 'none'
                    }}>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{ margin: 0, color: '#6b7280' }}>AI is thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your fencing business..."
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatLoading}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: inputMessage.trim() && !chatLoading ? '#3b82f6' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: inputMessage.trim() && !chatLoading ? 'pointer' : 'not-allowed',
                      fontSize: '16px'
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 