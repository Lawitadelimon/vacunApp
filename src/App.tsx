import { Routes, Route, Link } from 'react-router-dom';
import Contact from './contact';
import About from './About';
import HomePage from './HomePage';

export default function App() {
  return (
    <div className="p-6">
      <h1 className="font-extrabold text-2xl mb-4">Innova System</h1>

      <nav className="space-x-4 mb-6">
        <Link to="/" className="text-blue-600 hover:underline">Inicio</Link>
        <Link to="/about" className="text-blue-600 hover:underline">Acerca De</Link>
        <Link to="/contact" className="text-blue-600 hover:underline">Contacto</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

      <footer className="mt-auto border-t pt-4 text-sm text-gray-500">
        <p>&copy; 2025 Innova System. Todos los derechos reservados.</p>
        <p>
          <a href="mailto:innovaSystem@company.com" className="text-blue-600 hover:underline">Contacto</a>
        </p>
      </footer>
    </div>
  );
}
