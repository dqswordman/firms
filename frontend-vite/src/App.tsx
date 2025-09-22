import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', color: '#0f172a' }}>
      <h1>FIRMS Wildfire Explorer vNext</h1>
      <p>
        Stage 1 scaffold in place. Legacy UI remains in <code>frontend/</code>. New modules will be
        added incrementally (map container, stores, services) in subsequent stages.
      </p>
    </div>
  );
};

export default App;
