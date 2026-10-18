import React from 'react';import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './app.jsx';
import {StoreProvider} from './context/store.jsx';
import './styles/app.css';


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StoreProvider>
        <App />
    </StoreProvider>
  </BrowserRouter>
);
