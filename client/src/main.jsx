import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';
import './assignment.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { ReadingListProvider } from './context/ReadingListContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ReadingListProvider>
          <App />
        </ReadingListProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
