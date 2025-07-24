import React, { useState, useEffect } from 'react';
import './App.css';


function App() {
  const [count, setCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  };

  const fetchCount = async () => {
    try {
      const response = await fetch(`/api/clicks`);
      const data = await response.json();
      setCount(data.count);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error fetching count:', error);
    }
  };

  const handleClick = async () => {
    try {
      const response = await fetch(`/api/clicks`, {
        method: 'POST',
      });
      const data = await response.json();
      setCount(data.count);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error updating count:', error);
    }
  };

  useEffect(() => {
    fetchCount();
    // Update the time ago every second
    const interval = setInterval(() => {
      if (lastUpdated) {
        setLastUpdated(prev => prev); // Trigger re-render to update time ago
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <h1>Click Counter</h1>
      <p>Current Count: {count}</p>
      {lastUpdated && (
        <p className="last-click">Last clicked: {formatTimeAgo(lastUpdated)}</p>
      )}
      <button onClick={handleClick}>Click Me!</button>
    </div>
  );
}

export default App;
