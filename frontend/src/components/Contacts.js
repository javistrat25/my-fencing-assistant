import React, { useEffect, useState } from 'react';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/ghl/contacts')
      .then(res => res.json())
      .then(data => {
        setContacts(data.contacts || data || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load contacts');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading contacts...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Contacts</h2>
      {contacts.length === 0 ? (
        <div>No contacts found.</div>
      ) : (
        <ul>
          {contacts.map((c, i) => (
            <li key={c.id || i}>
              {c.firstName} {c.lastName} {c.email && <span>({c.email})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Contacts; 