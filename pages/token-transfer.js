import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function TokenTransfer() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if this is mobile
    if (typeof window !== 'undefined') {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      
      if (mobile) {
        // On mobile, try to get token from localStorage
        const storedToken = localStorage.getItem('ghl_access_token');
        console.log('📱 Mobile detected, checking localStorage for token...');
        console.log('📱 Stored token:', storedToken ? 'Found' : 'Not found');
        
        if (storedToken) {
          setToken(storedToken);
          setMessage('✅ Token found in localStorage! You can now use the mobile dashboard.');
        } else {
          setMessage('❌ No token found. Please visit this page on desktop first to transfer your token.');
        }
      } else {
        // On desktop, check if there's already a token
        const storedToken = localStorage.getItem('ghl_access_token');
        if (storedToken) {
          setToken(storedToken);
          setMessage('✅ Token already saved. You can visit this page on mobile now.');
        }
      }
    }
  }, []);

  const saveToken = () => {
    if (token.trim()) {
      localStorage.setItem('ghl_access_token', token.trim());
      setMessage('✅ Token saved! You can now use the mobile dashboard.');
    } else {
      setMessage('❌ Please enter a valid token.');
    }
  };

  const clearToken = () => {
    localStorage.removeItem('ghl_access_token');
    setToken('');
    setMessage('🗑️ Token cleared from localStorage.');
  };

  const copyToken = () => {
    const storedToken = localStorage.getItem('ghl_access_token');
    if (storedToken) {
      navigator.clipboard.writeText(storedToken);
      setMessage('📋 Token copied to clipboard!');
    } else {
      setMessage('❌ No token to copy.');
    }
  };

  if (isMobile) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <Head>
          <title>Mobile Token Check</title>
        </Head>
        
        <h1>Mobile Token Check</h1>
        <p>This page checks if you have an authentication token for mobile use.</p>
        
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

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={copyToken}
            style={{
              padding: '12px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Copy Token
          </button>
          
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

        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <h4>Debug Info:</h4>
          <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Loading...'}</p>
          <p><strong>localStorage Available:</strong> {typeof window !== 'undefined' && window.localStorage ? 'Yes' : 'No'}</p>
          <p><strong>Token in localStorage:</strong> {typeof window !== 'undefined' ? (localStorage.getItem('ghl_access_token') ? 'Yes' : 'No') : 'Unknown'}</p>
          <p><strong>localStorage Keys:</strong> {typeof window !== 'undefined' ? Object.keys(localStorage).join(', ') : 'Unknown'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <Head>
        <title>Token Transfer Tool</title>
      </Head>
      
      <h1>Token Transfer Tool</h1>
      <p>This tool helps transfer your authentication token from desktop to mobile.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Instructions:</h3>
        <ol>
          <li>Enter your GHL access token below</li>
          <li>Click "Save Token" to store it</li>
          <li>Visit this page on your mobile device</li>
          <li>The token will be available for mobile use</li>
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
          onClick={saveToken}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Save Token
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

      <div style={{ marginTop: '20px' }}>
        <h3>Mobile URL:</h3>
        <p style={{
          backgroundColor: '#f3f4f6',
          padding: '12px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {typeof window !== 'undefined' ? window.location.origin : ''}/token-transfer
        </p>
      </div>
    </div>
  );
} 