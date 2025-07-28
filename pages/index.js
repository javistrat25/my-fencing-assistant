import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [content, setContent] = useState('Click a button to load data...');
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
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

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ghl/calendar-events');
      const data = await response.json();
      setContent(JSON.stringify(data, null, 2));
    } catch (error) {
      setContent(`Error Loading Calendar Events: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <Head>
        <title>Fencing Executive Assistant</title>
        <meta name="description" content="Fencing Executive Assistant Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={{
        fontFamily: 'Arial, sans-serif',
        margin: 0,
        padding: '20px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            color: '#333',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            Fencing Executive Assistant
          </h1>
          
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            justifyContent: 'center'
          }}>
            <button 
              onClick={loadContacts}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: '#007bff',
                color: 'white',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Contacts
            </button>
            <button 
              onClick={loadCalendar}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: '#007bff',
                color: 'white',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Calendar Events
            </button>
            <button 
              onClick={checkHealth}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: '#007bff',
                color: 'white',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              Health Check
            </button>
          </div>
          
          <div style={{
            minHeight: '400px',
            border: '1px solid #ddd',
            padding: '20px',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#666' }}>
                Loading...
              </div>
            ) : (
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                {content}
              </pre>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 