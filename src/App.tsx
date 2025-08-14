import { Routes, Route } from 'react-router-dom';
import Inicio from './inicio';
import AuthPage from './AuthPage';
import HomePage from './HomePage';
import Pendientes from './pendientes';
import Notificaciones from './notificaciones';
import Animales from './animales';
import ProtectedRoute from './ProtectedRoute';
import ErrorPage from './ErrorPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/animales"
        element={
          <ProtectedRoute>
            <Animales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pendientes"
        element={
          <ProtectedRoute>
            <Pendientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notificaciones"
        element={
          <ProtectedRoute>
            <Notificaciones />
          </ProtectedRoute>
        }
      />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}
