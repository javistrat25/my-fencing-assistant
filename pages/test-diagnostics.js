import { useState } from 'react';
import Head from 'next/head';

export default function TestDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runDiagnostic = async (endpoint) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`/api/ghl/${endpoint}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px' }}>
      <Head>
        <title>API Diagnostics - Fencing Executive Assistant</title>
      </Head>
      
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '32px' }}>
          API Diagnostics
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <button
            onClick={() => runDiagnostic('check-permissions')}
            disabled={loading}
            style={{
              padding: '16px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.5 : 1
            }}
          >
            Check API Permissions
          </button>
          
          <button
            onClick={() => runDiagnostic('analyze-all-stages')}
            disabled={loading}
            style={{
              padding: '16px 24px',
              backgroundColor: '#059669',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.5 : 1
            }}
          >
            Analyze All Stages
          </button>
          
          <button
            onClick={() => runDiagnostic('enhanced-contact-search')}
            disabled={loading}
            style={{
              padding: '16px 24px',
              backgroundColor: '#dc2626',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.5 : 1
            }}
          >
            Enhanced Contact Search
          </button>
          
          <button
            onClick={() => runDiagnostic('opportunity-contacts')}
            disabled={loading}
            style={{
              padding: '16px 24px',
              backgroundColor: '#7c3aed',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.5 : 1
            }}
          >
            Opportunity Contacts
          </button>
          
          <button
            onClick={() => runDiagnostic('find-closed-paid-stage')}
            disabled={loading}
            style={{
              padding: '16px 24px',
              backgroundColor: '#ea580c',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.5 : 1
            }}
          >
            Find Closed-Paid Stage
          </button>
          
          <button
            onClick={() => runDiagnostic('check-token-scopes')}
            disabled={loading}
            style={{
              padding: '16px 24px',
              backgroundColor: '#0891b2',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.5 : 1
            }}
          >
            Check Token Scopes
          </button>
          
          <button
            onClick={() => runDiagnostic('refresh-auth')}
            disabled={loading}
            style={{
              padding: '16px 24px',
              backgroundColor: '#16a34a',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.5 : 1
            }}
          >
            Refresh Token
          </button>
          
          <button
            onClick={() => runDiagnostic('opportunities-only-contacts')}
            disabled={loading}
            style={{
              padding: '16px 24px',
              backgroundColor: '#9333ea',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              opacity: loading ? 0.5 : 1
            }}
          >
            Opportunities-Only Contacts
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '18px', color: '#6b7280' }}>Running diagnostic...</p>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <h3 style={{ color: '#dc2626', margin: '0 0 8px 0' }}>Error</h3>
            <p style={{ color: '#991b1b', margin: 0 }}>{error}</p>
          </div>
        )}

        {results && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
              Diagnostic Results
            </h2>
            
            <pre style={{ 
              backgroundColor: '#f9fafb', 
              padding: '16px', 
              borderRadius: '8px', 
              overflow: 'auto', 
              fontSize: '14px',
              lineHeight: '1.5',
              maxHeight: '600px'
            }}>
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 