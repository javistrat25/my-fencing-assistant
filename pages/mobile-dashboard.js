import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MobileDashboard() {
  const [activeQuotes, setActiveQuotes] = useState(0);
  const [quotesPending, setQuotesPending] = useState(0);
  const [wonInvoices, setWonInvoices] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Check for auth token on mount
  useEffect(() => {
    // Try to get token from localStorage (mobile-friendly)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('ghl_access_token');
      if (token) {
        setAuthToken(token);
        console.log('📱 Found auth token in localStorage');
      } else {
        setAuthError('No authentication token found. Please authenticate on desktop first.');
        console.log('📱 No auth token in localStorage');
      }
    }
  }, []);

  // Fetch metrics when auth token is available
  useEffect(() => {
    if (authToken) {
      fetchMetrics();
    }
  }, [authToken]);

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

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (authError) {
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
          <p style={{ color: '#7f1d1d', fontSize: '14px' }}>
            Please visit the dashboard on desktop first to authenticate, then return to mobile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Head>
        <title>Mobile Dashboard - Fencing Assistant</title>
      </Head>
      
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
          Fencing Assistant
        </h1>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          margin: '4px 0 0 0'
        }}>
          Mobile Dashboard
        </p>
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
      </div>
    </div>
  );
} 