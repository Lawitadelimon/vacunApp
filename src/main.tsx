import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./UserContext";
// @ts-ignore: virtual module provided by Vite PWA plugin at build time
import { registerSW } from 'virtual:pwa-register';

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// 👇 Esto activa la PWA (se actualiza automáticamente si cambias el build)
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Hay una nueva versión disponible. ¿Deseas actualizar?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("La app está lista para usarse sin conexión 🚀");
  },
});
