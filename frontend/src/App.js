import React, { useState } from 'react';
import Contacts from './components/Contacts';
import CalendarEvents from './components/CalendarEvents';

function App() {
  const [page, setPage] = useState('contacts');

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <h1>Fencing Assistant Dashboard</h1>
      <nav style={{ marginBottom: 24 }}>
        <button onClick={() => setPage('contacts')} style={{ marginRight: 8 }}>
          Contacts
        </button>
        <button onClick={() => setPage('calendar')}>Calendar Events</button>
      </nav>
      <div>
        {page === 'contacts' && <Contacts />}
        {page === 'calendar' && <CalendarEvents />}
      </div>
    </div>
  );
}

export default App;
