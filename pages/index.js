import { useState, useEffect } from 'react';
import Head from 'next/head';

// Updated dashboard with modern design - v2
export default function Home() {
  const [activeQuotes, setActiveQuotes] = useState(0);
  const [quotesPending, setQuotesPending] = useState(0);
  const [wonInvoices, setWonInvoices] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Real-time webhook states
  const [realtimeQuoteSent, setRealtimeQuoteSent] = useState(null);
  const [realtimeQuotePending, setRealtimeQuotePending] = useState(null);
  const [webhookConnected, setWebhookConnected] = useState(false);
  
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
  
  // Detailed view states
  const [showQuotesPendingDetails, setShowQuotesPendingDetails] = useState(false);
  const [quotesPendingDetails, setQuotesPendingDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Active Quotes detailed view states
  const [showActiveQuotesDetails, setShowActiveQuotesDetails] = useState(false);
  const [activeQuotesDetails, setActiveQuotesDetails] = useState([]);
  const [activeQuotesDetailsLoading, setActiveQuotesDetailsLoading] = useState(false);

  // Fetch metrics on component mount
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Add SSE client connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/dashboard/stream');
    
    eventSource.onopen = () => {
      console.log('SSE connection established');
      setWebhookConnected(true);
    };
    
    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      console.log('🔄 Real-time update received:', update);
      if (update.type === 'metrics') {
        console.log('📊 Real-time metrics update:', {
          quoteSent: update.quoteSent,
          quotePending: update.quotePending
        });
        setRealtimeQuoteSent(update.quoteSent);
        setRealtimeQuotePending(update.quotePending);
        // TEMPORARILY DISABLED: Don't overwrite the API data with real-time data
        // console.log('✅ Updating states from real-time data');
        // setActiveQuotes(update.quoteSent);
        // setQuotesPending(update.quotePending);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setWebhookConnected(false);
    };
    
    return () => {
      eventSource.close();
      setWebhookConnected(false);
    };
  }, []);

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    console.log('🔄 Starting to fetch all metrics...');
    
    try {
      // Fetch Active Quotes
      console.log('📊 Fetching Active Quotes...');
      const activeQuotesResponse = await fetch('/api/ghl/quote-sent-efficient', {
        credentials: 'include'
      });
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

      // Fetch Quotes Pending
      console.log('📊 Fetching Quotes Pending...');
      const quotesPendingResponse = await fetch('/api/ghl/quote-pending-efficient', {
        credentials: 'include'
      });
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

      // Fetch Won Invoices
      console.log('📊 Fetching Won Invoices...');
      const wonInvoicesResponse = await fetch('/api/ghl/won-invoices', {
        credentials: 'include'
      });
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

      // Fetch Revenue
      console.log('📊 Fetching Revenue...');
      const revenueResponse = await fetch('/api/ghl/revenue', {
        credentials: 'include'
      });
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
      
    } catch (error) {
      console.error('❌ Error fetching metrics:', error);
    }
    
    console.log('✅ Finished fetching metrics');
    setMetricsLoading(false);
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
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: data.response || 'I apologize, but I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setChatLoading(false);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleQuotesPendingClick = async () => {
    if (showQuotesPendingDetails) {
      setShowQuotesPendingDetails(false);
      return;
    }

    setDetailsLoading(true);
    try {
      const response = await fetch('/api/ghl/quote-pending-efficient', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.opportunities) {
        setQuotesPendingDetails(data.opportunities);
        setShowQuotesPendingDetails(true);
      } else {
        console.error('Failed to fetch quotes pending details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching quotes pending details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleActiveQuotesClick = async () => {
    if (showActiveQuotesDetails) {
      setShowActiveQuotesDetails(false);
      return;
    }

    setActiveQuotesDetailsLoading(true);
    try {
      const response = await fetch('/api/ghl/quote-sent-efficient', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.opportunities) {
        setActiveQuotesDetails(data.opportunities);
        setShowActiveQuotesDetails(true);
      } else {
        console.error('Failed to fetch active quotes details:', data.error);
      }
    } catch (error) {
      console.error('Error fetching active quotes details:', error);
    } finally {
      setActiveQuotesDetailsLoading(false);
    }
  };

  if (currentPage === 'ai-assistant') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
        <Head>
          <title>AI Assistant - Fencing Executive Assistant</title>
        </Head>
        
        {/* Navigation Sidebar */}
        <div style={{ position: 'fixed', left: 0, top: 0, height: '100%', width: '64px', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '24px' }}>
            <button 
              onClick={() => setCurrentPage('dashboard')}
              style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <svg width="24" height="24" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            </button>
            
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#dbeafe' }}>
              <svg width="24" height="24" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Assistant Content */}
        <div style={{ marginLeft: '64px', padding: '32px' }}>
          <div style={{ maxWidth: '896px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '32px' }}>AI Assistant</h1>
            
            {/* Chat Interface */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', height: '600px', display: 'flex', flexDirection: 'column' }}>
              {/* Messages */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                {messages.map((message) => (
                  <div key={message.id} style={{ display: 'flex', marginBottom: '16px', justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '320px',
                      padding: '8px 16px',
                      borderRadius: '16px',
                      backgroundColor: message.sender === 'user' ? '#2563eb' : '#f3f4f6',
                      color: message.sender === 'user' ? 'white' : '#111827'
                    }}>
                      <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{message.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ backgroundColor: '#f3f4f6', color: '#111827', padding: '8px 16px', borderRadius: '16px' }}>
                      <p style={{ margin: 0 }}>Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input */}
              <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your fencing business..."
                    style={{ flex: 1, padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '12px', outline: 'none' }}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatLoading}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: (!inputMessage.trim() || chatLoading) ? 0.5 : 1
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Head>
        <title>Dashboard - Fencing Executive Assistant</title>
      </Head>
      
      {/* Navigation Sidebar */}
      <div style={{ position: 'fixed', left: 0, top: 0, height: '100%', width: '64px', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '24px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#dbeafe' }}>
            <svg width="24" height="24" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
          </div>
          
          <button 
            onClick={() => setCurrentPage('ai-assistant')}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <svg width="24" height="24" fill="none" stroke="#6b7280" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '64px', padding: '32px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '32px' }}>Dashboard</h1>
          
          {/* Hero Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {/* Active Quotes */}
            <div 
              onClick={handleActiveQuotesClick}
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                padding: '24px', 
                borderLeft: '4px solid #3b82f6',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: showActiveQuotesDetails ? 'scale(1.02)' : 'scale(1)',
                boxShadow: showActiveQuotesDetails 
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!showActiveQuotesDetails) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    {metricsLoading ? '...' : formatNumber(activeQuotes)}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    Active Quotes
                    {activeQuotesDetailsLoading && <span style={{ marginLeft: '8px', color: '#3b82f6' }}>Loading...</span>}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '12px' }}>
                  <svg width="32" height="32" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quotes Pending */}
            <div 
              onClick={handleQuotesPendingClick}
              style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                padding: '24px', 
                borderLeft: '4px solid #eab308',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: showQuotesPendingDetails ? 'scale(1.02)' : 'scale(1)',
                boxShadow: showQuotesPendingDetails 
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                  : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!showQuotesPendingDetails) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    {metricsLoading ? '...' : formatNumber(quotesPending)}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>
                    Quotes Pending
                    {detailsLoading && <span style={{ marginLeft: '8px', color: '#eab308' }}>Loading...</span>}
                  </p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '12px' }}>
                  <svg width="32" height="32" fill="none" stroke="#eab308" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Won Invoices */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px', borderLeft: '4px solid #22c55e' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    {metricsLoading ? '...' : formatNumber(wonInvoices)}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Won Invoices</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '12px' }}>
                  <svg width="32" height="32" fill="none" stroke="#22c55e" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px', borderLeft: '4px solid #a855f7' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                    {metricsLoading ? '...' : formatCurrency(revenue)}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Revenue</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f3e8ff', borderRadius: '12px' }}>
                  <svg width="32" height="32" fill="none" stroke="#a855f7" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quotes Pending Details */}
          {showQuotesPendingDetails && (
            <div style={{ 
              marginTop: '24px', 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
              padding: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  Quotes Pending Details
                </h2>
                <button
                  onClick={() => setShowQuotesPendingDetails(false)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
              </div>
              
              {quotesPendingDetails.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {quotesPendingDetails.map((opportunity, index) => (
                    <div 
                      key={opportunity.id || index}
                      style={{
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
                            {opportunity.contact?.name || opportunity.name || 'Unnamed Contact'}
                          </h3>
                          {opportunity.contact?.email && (
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                              <strong>Email:</strong> {opportunity.contact.email}
                            </p>
                          )}
                          {opportunity.contact?.phone && (
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                              <strong>Phone:</strong> {opportunity.contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                  <p>No quotes pending details available</p>
                </div>
              )}
            </div>
          )}

          {/* Active Quotes Details */}
          {showActiveQuotesDetails && (
            <div style={{ 
              marginTop: '24px', 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
              padding: '24px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  Active Quotes Details
                </h2>
                <button
                  onClick={() => setShowActiveQuotesDetails(false)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Close
                </button>
              </div>
              
              {activeQuotesDetails.length > 0 ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {activeQuotesDetails.map((opportunity, index) => (
                    <div 
                      key={opportunity.id || index}
                      style={{
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
                            {opportunity.contact?.name || opportunity.name || 'Unnamed Contact'}
                          </h3>
                          {opportunity.contact?.email && (
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                              <strong>Email:</strong> {opportunity.contact.email}
                            </p>
                          )}
                          {opportunity.contact?.phone && (
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                              <strong>Phone:</strong> {opportunity.contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                  <p>No active quotes details available</p>
                </div>
              )}
            </div>
          )}

          {/* Real-time Connection Status */}
          {webhookConnected && (
            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#059669' }}>
              <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', marginRight: '8px' }}></div>
              Real-time updates connected
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 