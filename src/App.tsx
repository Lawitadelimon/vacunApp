import { Routes, Route } from "react-router-dom";
import Inicio from "./inicio";
import AuthPage from "./AuthPage";
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

export default function App() {
  return (
    <Routes>
      {/* Páginas públicas */}
      <Route path="/" element={<Inicio />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Páginas protegidas (todos los usuarios logueados) */}
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
          <ProtectedRoute allowedRoles={["admin"]}>
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

      {/* Página de error */}
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}
