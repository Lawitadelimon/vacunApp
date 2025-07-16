import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase'; // ajusta la ruta si es necesario
import { FaBell, FaClipboardList, FaPaw } from 'react-icons/fa';
import cowImage from './assets/cows.jpg';

export default function HomePage() {
  const [tareas, setTareas] = useState<any[]>([]);

  useEffect(() => {
    const cargarTareas = async () => {
      const querySnapshot = await getDocs(collection(db, 'tareas'));
      const tareasFirebase = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));
      setTareas(tareasFirebase);
    };

    cargarTareas();
  }, []);

  const hoy = new Date().toISOString().split('T')[0];

  const pendientesHoy = tareas.filter(
    (t) => t.fecha <= hoy && !t.completada
  );

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
            ¡Donde el bienestar de tu ganado es lo primero!
          </p>
          <hr className="my-4 border-t border-white w-3/4 mx-auto" />
        </div>

        <div className="w-[300px] h-[400px] bg-yellow-600 border-2 rounded-xl shadow-lg flex flex-col items-center justify-center gap-4 p-6">
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

          <Link
            to="/notificaciones"
            className="relative bg-amber-700 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded-xl shadow flex items-center justify-center gap-2"
          >
            <FaBell /> Notificaciones
            {pendientesHoy.length > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full shadow" />
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
