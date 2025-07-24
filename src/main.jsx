import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Importiamo gli stili globali

// 1. Trova l'elemento HTML con l'id 'root' nel tuo file index.html
const rootElement = document.getElementById('root');

// 2. Crea la "radice" della tua applicazione React in quell'elemento
const root = ReactDOM.createRoot(rootElement);

// 3. Renderizza il componente principale <App /> all'interno della radice
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// ReactDOM rendering
