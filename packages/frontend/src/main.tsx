import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import App from './App';
import { processRecurringExpenses } from './api';
import { handleRedirectResult } from './googleDrive';

// Capture OAuth redirect token before React renders (PWA redirect flow)
handleRedirectResult();

// Process any due recurring expenses on startup
processRecurringExpenses().catch(() => {});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
