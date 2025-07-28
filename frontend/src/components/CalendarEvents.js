import React, { useEffect, useState } from 'react';

function CalendarEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/ghl/calendar-events')
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || data || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load calendar events');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading calendar events...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Calendar Events</h2>
      {events.length === 0 ? (
        <div>No events found.</div>
      ) : (
        <ul>
          {events.map((e, i) => (
            <li key={e.id || i}>
              {e.title || e.name || 'Untitled Event'}
              {e.startTime && (
                <span> — {new Date(e.startTime).toLocaleString()}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CalendarEvents; 