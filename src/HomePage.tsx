import { Link } from 'react-router-dom';
import { FaBell, FaClipboardList, FaPaw } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import cowImage from './assets/cows.jpg';

export default function HomePage() {
  const [hayNotificaciones, setHayNotificaciones] = useState(false);

  const cargarNotificaciones = async () => {
    const querySnapshot = await getDocs(collection(db, 'tareas'));
    const hoy = new Date().toISOString().split('T')[0];

    const pendientes = querySnapshot.docs
      .map(doc => doc.data())
      .filter((t: any) => t.fecha && t.fecha <= hoy && !t.completada);

    setHayNotificaciones(pendientes.length > 0);
  };

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center">
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-xs"
        style={{ backgroundImage: `url(${cowImage})` }}
      />

      <div className="absolute inset-0 bg-black/40" />

      {/* Contenido encima */}
      <div className="relative z-10 flex flex-col items-center w-full">
        <header className="bg-yellow-600 w-full py-4 text-center shadow-md relative">
          <h1 className="text-white text-2xl font-extrabold">VacunApp</h1>
        </header>

        <div className="text-center mt-6 px-4">
          <h2 className="text-xl font-bold text-white drop-shadow">
            Bienvenido a VacunApp
          </h2>
          <p className="text-sm font-semibold text-white drop-shadow">
            ¡Donde el bienestar de tu ganado es lo primero!
          </p>
          <hr className="my-4 border-t border-white w-3/4 mx-auto" />
        </div>

        <div className="w-[300px] h-[400px] bg-yellow-600 border-2 rounded-xl shadow-lg flex flex-col items-center justify-center gap-4 p-6 relative">
          
          <Link
            to="/animales"
            className="bg-amber-700 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded-xl shadow flex items-center justify-center gap-2"
          >
            <FaPaw /> Animales
          </Link>

          <Link
            to="/pendientes"
            className="bg-amber-700 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded-xl shadow flex items-center justify-center gap-2"
          >
            <FaClipboardList /> Pendientes
          </Link>

          <div className="relative">
            <Link
              to="/notificaciones"
              className="bg-amber-700 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded-xl shadow flex items-center justify-center gap-2"
            >
              <FaBell /> Notificaciones
            </Link>

            {/* Vaquita flotante si hay notificaciones */}
            {hayNotificaciones && (
              <span className="absolute -top-3 -right-3 text-2xl animate-bounce">
                🐄
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
