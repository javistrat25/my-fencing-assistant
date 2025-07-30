import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function MobileToken() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      
      // Check for token in URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      
      if (tokenFromUrl) {
        setToken(tokenFromUrl);
        setMessage('✅ Token received from URL! You can now use the mobile dashboard.');
        // Also save to localStorage as backup
        localStorage.setItem('ghl_access_token', tokenFromUrl);
      } else if (mobile) {
        // Check localStorage as fallback
        const storedToken = localStorage.getItem('ghl_access_token');
        if (storedToken) {
          setToken(storedToken);
          setMessage('✅ Token found in localStorage! You can now use the mobile dashboard.');
        } else {
          setMessage('❌ No token found. Please use the desktop transfer tool to get a token URL.');
        }
      }
    }
  }, []);

  const generateTokenUrl = () => {
    if (token.trim()) {
      const baseUrl = window.location.origin + '/mobile-token';
      const tokenUrl = `${baseUrl}?token=${encodeURIComponent(token.trim())}`;
      return tokenUrl;
    }
    return '';
  };

  const copyTokenUrl = () => {
    const tokenUrl = generateTokenUrl();
    if (tokenUrl) {
      navigator.clipboard.writeText(tokenUrl);
      setMessage('📋 Token URL copied to clipboard! Share this with your mobile device.');
    } else {
      setMessage('❌ Please enter a valid token first.');
    }
  };

  const clearToken = () => {
    localStorage.removeItem('ghl_access_token');
    setToken('');
    setMessage('🗑️ Token cleared.');
  };

  if (isMobile) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <Head>
          <title>Mobile Token Setup</title>
        </Head>
        
        <h1>Mobile Token Setup</h1>
        <p>This page helps you set up authentication for mobile use.</p>
        
        <div style={{
          backgroundColor: message.includes('✅') ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${message.includes('✅') ? '#10b981' : '#ef4444'}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, color: message.includes('✅') ? '#065f46' : '#991b1b' }}>
            {message}
          </p>
        </div>

        {token && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Current Token:</h3>
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '12px',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {token.substring(0, 20)}...{token.substring(token.length - 20)}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button
            onClick={clearToken}
            style={{
              padding: '12px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Clear Token
          </button>
        </div>

        {token && (
          <div style={{ marginTop: '20px' }}>
            <a 
              href="/mobile-dashboard"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              Go to Mobile Dashboard
            </a>
          </div>
        )}

        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <h4>Debug Info:</h4>
          <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Loading...'}</p>
          <p><strong>URL Parameters:</strong> {typeof window !== 'undefined' ? window.location.search : 'Unknown'}</p>
          <p><strong>localStorage Available:</strong> {typeof window !== 'undefined' && window.localStorage ? 'Yes' : 'No'}</p>
          <p><strong>Token in localStorage:</strong> {typeof window !== 'undefined' ? (localStorage.getItem('ghl_access_token') ? 'Yes' : 'No') : 'Unknown'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Desktop Token Generator</title>
      </Head>
      
      <h1>Desktop Token Generator</h1>
      <p>Generate a mobile-friendly token URL for your phone.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Enter your GHL access token below</li>
          <li>Click "Generate Mobile URL"</li>
          <li>Copy the generated URL</li>
          <li>Open the URL on your mobile device</li>
        </ol>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="token" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          GHL Access Token:
        </label>
        <textarea
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste your GHL access token here..."
          style={{
            width: '100%',
            height: '100px',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={copyTokenUrl}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Generate Mobile URL
        </button>
        
        <button
          onClick={clearToken}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Clear Token
        </button>
      </div>

      {message && (
        <div style={{
          backgroundColor: message.includes('✅') ? '#d1fae5' : '#fee2e2',
          border: `1px solid ${message.includes('✅') ? '#10b981' : '#ef4444'}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0, color: message.includes('✅') ? '#065f46' : '#991b1b' }}>
            {message}
          </p>
        </div>
      )}

      {token && (
        <div style={{ marginTop: '20px' }}>
          <h3>Generated Mobile URL:</h3>
          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '12px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all'
          }}>
            {generateTokenUrl()}
          </div>
        </div>
      )}
    </div>
  );
} 