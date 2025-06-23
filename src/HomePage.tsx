import { Link } from 'react-router-dom';
import { FaBell, FaClipboardList, FaPaw } from 'react-icons/fa';
import cowImage from './assets/cows.jpg';

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center">
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-xs"
        style={{ backgroundImage: `url(${cowImage})` }}
      />

      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido encima */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <header className="bg-yellow-600 w-full py-4 text-center shadow-md">
          <h1 className="text-white text-2xl font-extrabold">VacunApp</h1>
        </header>

        <div className="text-center mt-6 px-4">
          <h2 className="text-xl font-bold text-white drop-shadow">
            Bienvenido a VacunApp
          </h2>
          <p className="text-sm font-semibold text-white drop-shadow">
            Donde el bienestar de tu ganado es lo primero!
          </p>
          <hr className="my-4 border-t border-white w-3/4 mx-auto" />
        </div>

        <div className="w-[300px] h-[400px] bg-yellow-600 rounded-lg shadow-lg flex flex-col items-center justify-center gap-4 p-6">
          <Link
            to="/animales"
            className="bg-amber-700 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded shadow flex items-center justify-center gap-2"
          >
            <FaPaw /> Animales
          </Link>
          <Link
            to="/pendientes"
            className="bg-amber-700 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded shadow flex items-center justify-center gap-2"
          >
            <FaClipboardList /> Pendientes
          </Link>
          <Link
            to="/notificaciones"
            className="bg-amber-700 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded shadow flex items-center justify-center gap-2"
          >
            <FaBell /> Notificaciones
          </Link>
        </div>
      </div>
    </div>
  );
}
