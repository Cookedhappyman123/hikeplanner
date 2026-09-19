import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { TripProvider } from './state/TripContext.jsx';
import './styles/global.css';

// HashRouter (not BrowserRouter): this keeps client-side routing working
// out of the box on static hosts with no server-side rewrite rules
// (GitHub Pages in particular — see Phase 4). Switch to BrowserRouter
// later if the chosen host is configured with an SPA fallback.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <TripProvider>
        <App />
      </TripProvider>
    </HashRouter>
  </React.StrictMode>
);
