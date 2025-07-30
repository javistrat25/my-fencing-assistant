import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MobileTest() {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    
    // Test 1: Basic connectivity
    try {
      const response = await fetch('/api/ghl/test-mobile-auth');
      const data = await response.json();
      results.push({
        test: 'Authentication Test',
        success: response.ok,
        data: data,
        status: response.status
      });
    } catch (error) {
      results.push({
        test: 'Authentication Test',
        success: false,
        error: error.message
      });
    }

    // Test 2: Quote Sent API
    try {
      const response = await fetch('/api/ghl/quote-sent-efficient', {
        credentials: 'include'
      });
      const data = await response.json();
      results.push({
        test: 'Quote Sent API',
        success: response.ok,
        data: { count: data.opportunities?.length || 0, success: data.success },
        status: response.status
      });
    } catch (error) {
      results.push({
        test: 'Quote Sent API',
        success: false,
        error: error.message
      });
    }

    // Test 3: Quote Pending API
    try {
      const response = await fetch('/api/ghl/quote-pending-efficient', {
        credentials: 'include'
      });
      const data = await response.json();
      results.push({
        test: 'Quote Pending API',
        success: response.ok,
        data: { count: data.opportunities?.length || 0, success: data.success },
        status: response.status
      });
    } catch (error) {
      results.push({
        test: 'Quote Pending API',
        success: false,
        error: error.message
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Mobile Debug Test</title>
      </Head>
      
      <h1>Mobile Debug Test</h1>
      <p>This page helps debug mobile data loading issues.</p>
      
      <button 
        onClick={runTests}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isLoading ? 'Running Tests...' : 'Run Mobile Tests'}
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h3>Device Info:</h3>
        <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Loading...'}</p>
        <p><strong>Is Mobile:</strong> {typeof window !== 'undefined' ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Yes' : 'No' : 'Loading...'}</p>
      </div>

      {testResults.length > 0 && (
        <div>
          <h3>Test Results:</h3>
          {testResults.map((result, index) => (
            <div 
              key={index}
              style={{
                padding: '16px',
                margin: '8px 0',
                backgroundColor: result.success ? '#d1fae5' : '#fee2e2',
                borderRadius: '8px',
                border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', color: result.success ? '#065f46' : '#991b1b' }}>
                {result.test} - {result.success ? '✅ PASS' : '❌ FAIL'}
              </h4>
              {result.status && <p><strong>Status:</strong> {result.status}</p>}
              {result.data && (
                <div>
                  <p><strong>Response:</strong></p>
                  <pre style={{ 
                    backgroundColor: '#f3f4f6', 
                    padding: '8px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              {result.error && (
                <p style={{ color: '#dc2626' }}>
                  <strong>Error:</strong> {result.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 