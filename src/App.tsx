import { Routes, Route } from "react-router-dom";
import Inicio from "./inicio";
import AuthPage from "./AuthPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
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
import useOfflineSync from "./hooks/useOfflineSync"; // 👈 usamos solo este hook

export default function App() {
  const online = useOfflineSync(); // ✅ controla conexión y sincroniza

  return (
    <>
      {/* 🔹 Aviso visual si está sin conexión */}
      {!online && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50 shadow-lg font-semibold">
          ⚠️ Estás sin conexión. Los cambios se guardarán localmente y se sincronizarán al volver.
        </div>
      )}

      <Routes>
        {/* Páginas públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
    </>
  );
}