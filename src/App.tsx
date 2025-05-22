import { Routes, Route, Link } from 'react-router-dom';
import Contact from './contact';

export default function App() {
  return (
    <div className="p-6">
      <h1 className="font-extrabold text-2xl mb-4">Innova System</h1>

      <nav className="space-x-4 mb-6">
        <Link to="/" className="text-blue-600 hover:underline">Inicio</Link>
        <Link to="/contact" className="text-blue-600 hover:underline">Contacto</Link>
      </nav>

      <Routes>
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </div>
  );
}
