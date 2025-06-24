// Główny plik wejściowy aplikacji React - punkt startowy aplikacji Knowledge Assistant
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Główny komponent aplikacji
import './index.css'; // Globalne style CSS (Tailwind CSS)
import reportWebVitals from './reportWebVitals'; // Narzędzie do mierzenia wydajności

// Utworzenie root elementu React 18 dla renderowania aplikacji
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Renderowanie aplikacji w trybie StrictMode (dodatkowe sprawdzenia w developmencie)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Opcjonalne mierzenie wydajności aplikacji
// Można przekazać funkcję do logowania wyników (np. reportWebVitals(console.log))
// lub wysyłania do zewnętrznego serwisu analitycznego
reportWebVitals();
