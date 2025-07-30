import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

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
      console.log('Real-time update:', update);
      if (update.type === 'metrics') {
        setRealtimeQuoteSent(update.quoteSent);
        setRealtimeQuotePending(update.quotePending);
        // Also update the regular states for consistency
        setActiveQuotes(update.quoteSent);
        setQuotesPending(update.quotePending);
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
    console.log('Fetching all metrics...');
    
    try {
      // Fetch Active Quotes
      const activeQuotesResponse = await fetch('/api/ghl/quote-sent', {
        credentials: 'include'
      });
      const activeQuotesData = await activeQuotesResponse.json();
      if (activeQuotesData.success && activeQuotesData.opportunities) {
        setActiveQuotes(activeQuotesData.opportunities.length);
      }

      // Fetch Quotes Pending
      const quotesPendingResponse = await fetch('/api/ghl/quote-pending', {
        credentials: 'include'
      });
      const quotesPendingData = await quotesPendingResponse.json();
      if (quotesPendingData.success && quotesPendingData.opportunities) {
        setQuotesPending(quotesPendingData.opportunities.length);
      }

      // Fetch Won Invoices
      const wonInvoicesResponse = await fetch('/api/ghl/won-invoices', {
        credentials: 'include'
      });
      const wonInvoicesData = await wonInvoicesResponse.json();
      if (wonInvoicesData.success) {
        setWonInvoices(wonInvoicesData.total);
      }

      // Fetch Revenue
      const revenueResponse = await fetch('/api/ghl/revenue', {
        credentials: 'include'
      });
      const revenueData = await revenueResponse.json();
      if (revenueData.success) {
        setRevenue(revenueData.revenue);
      }
      
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
    
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

  if (currentPage === 'ai-assistant') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>AI Assistant - Fencing Executive Assistant</title>
        </Head>
        
        {/* Navigation Sidebar */}
        <div className="fixed left-0 top-0 h-full w-16 bg-white shadow-lg z-50">
          <div className="flex flex-col items-center py-6 space-y-6">
            <Link href="/" 
                  className="p-3 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            </Link>
            
            <div className="p-3 rounded-lg bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* AI Assistant Content */}
        <div className="ml-16 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Assistant</h1>
            
            {/* Chat Interface */}
            <div className="bg-white rounded-2xl shadow-lg h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-2xl">
                      <p>Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your fencing business..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dashboard - Fencing Executive Assistant</title>
      </Head>
      
      {/* Navigation Sidebar */}
      <div className="fixed left-0 top-0 h-full w-16 bg-white shadow-lg z-50">
        <div className="flex flex-col items-center py-6 space-y-6">
          <div className="p-3 rounded-lg bg-blue-100">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
            </svg>
          </div>
          
          <button 
            onClick={() => setCurrentPage('ai-assistant')}
            className="p-3 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-16 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
          
          {/* Hero Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Active Quotes */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">
                    {metricsLoading ? '...' : formatNumber(activeQuotes)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Active Quotes</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quotes Pending */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">
                    {metricsLoading ? '...' : formatNumber(quotesPending)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Quotes Pending</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Won Invoices */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">
                    {metricsLoading ? '...' : formatNumber(wonInvoices)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Won Invoices</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold text-gray-900">
                    {metricsLoading ? '...' : formatCurrency(revenue)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Revenue</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Connection Status */}
          {webhookConnected && (
            <div className="mt-6 flex items-center text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time updates connected
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 