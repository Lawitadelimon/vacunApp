import { Routes, Route } from "react-router-dom";
import Inicio from "./inicio";
import AuthPage from "./AuthPage";
import ForgotPasswordPage from "./ForgotPasswordPage"; // <-- Importa la nueva página
import HomePage from "./HomePage";
import Pendientes from "./pendientes";
import Notificaciones from "./notificaciones";
import Animales from "./animales";
import Reproduccion from "./reproduccion";
import Alimentacion from "./alimentacion";
import Salud from "./salud";
import Reportes from "./reportes";
import ProtectedRoute from "./ProtectedRoute";
import ErrorPage from "./ErrorPage";
import UsuariosPage from "./usuariosPage";
import HistorialAnimales from "./HistorialAnimales";
import Nacimientos from "./nacimientos";

export default function App() {
  return (
    <Routes>
      {/* Páginas públicas */}
      <Route path="/" element={<Inicio />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} /> {/* <-- NUEVA RUTA */}

      {/* Páginas protegidas */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/animales"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <Animales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reproduccion"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <Reproduccion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nacimientos"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <Nacimientos />
          </ProtectedRoute>
        }
      />

      <Route
        path="/estadisticas"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <HistorialAnimales />
          </ProtectedRoute>
        }
      />

      <Route
        path="/alimentacion"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <Alimentacion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/salud"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <Salud />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <Reportes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pendientes"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <Pendientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notificaciones"
        element={
          <ProtectedRoute allowedRoles={["admin", "worker"]}>
            <Notificaciones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UsuariosPage />
          </ProtectedRoute>
        }
      />

      {/* Página de error */}
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}
