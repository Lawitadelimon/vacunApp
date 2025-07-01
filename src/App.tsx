import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import Pendientes from './pendientes';
import Notificaciones from './notificaciones';
import Animales from './animales';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/animales" element={<Animales />} />
      <Route path="/pendientes" element={<Pendientes />} />
      <Route path="/notificaciones" element={<Notificaciones />} />
    </Routes>
  );
}
