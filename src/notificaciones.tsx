import { useEffect, useState } from 'react';
import { collection, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';
import { db } from './firebase';

export default function Notificaciones() {
  const [tareas, setTareas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Suscripción en tiempo real
    const unsubscribe = onSnapshot(collection(db, 'tareas'), (snapshot) => {
      const tareasFirebase = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));
      setTareas(tareasFirebase);
      setLoading(false);
    });

    // Cleanup al desmontar
    return () => unsubscribe();
  }, []);

  const hoy = new Date().toISOString().split('T')[0];

  // Mostrar tareas pendientes cuya fecha sea hoy o pasada y que no estén completadas
  const pendientesHoy = tareas.filter(
    (t) => t.fecha && t.fecha <= hoy && !t.completada
  );

  const marcarCompletada = async (id: string) => {
    try {
      const tareaRef = doc(db, 'tareas', id);
      await updateDoc(tareaRef, { completada: true });
      // Ya no necesitamos recargar manualmente porque onSnapshot actualizará
    } catch (error) {
      console.error("Error al marcar completada:", error);
    }
  };

  const eliminarTarea = async (id: string) => {
    try {
      const tareaRef = doc(db, 'tareas', id);
      await deleteDoc(tareaRef);
      // onSnapshot actualizará automáticamente
    } catch (error) {
      console.error("Error al eliminar tarea:", error);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-100 flex flex-col items-center p-4">
      <header className="bg-yellow-600 w-full py-4 text-center shadow-md mb-4 relative flex items-center justify-center">
        {/* Botón de casita */}
          <Link
              to="/"
              className="absolute left-4 text-white text-2xl hover:text-yellow-200 transition"
              aria-label="Volver al inicio"
            >
            <FaHome />
         </Link>

        <h1 className="text-white text-2xl font-extrabold">Notificaciones</h1>
      </header>

      <div className="bg-white w-full max-w-lg p-4 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Tareas pendientes</h2>

        {loading ? (
          <p className="text-center text-gray-500">Cargando...</p>
        ) : pendientesHoy.length === 0 ? (
          <p className="text-center text-gray-500">No hay notificaciones por ahora 🎉</p>
        ) : (
          <ul className="space-y-2">
            {pendientesHoy.map((t) => (
              <li
                key={t.id}
                className="bg-yellow-50 p-3 rounded border border-yellow-200 shadow flex justify-between items-start"
              >
                <div className="flex flex-col flex-1 pr-2">
                  <p className="font-semibold">{t.titulo || 'Tarea sin título'}</p>

                  {t.descripcion && (
                    <p className="text-sm text-gray-700">{t.descripcion}</p>
                  )}

                  {t.categoria && (
                    <p className="text-sm text-gray-700 italic">Categoría: {t.categoria}</p>
                  )}

                  {(t.animalCodigo || t.animalRaza || t.animalId) && (
                    <p className="text-sm text-gray-700">
                      Animal: {t.animalCodigo || t.animalId} {t.animalRaza && `- ${t.animalRaza}`}
                    </p>
                  )}

                  {t.para && (
                    <p className="text-sm text-gray-600">Asignada a: {t.para}</p>
                  )}

                  {t.fecha && (
                    <p className="text-xs text-gray-500 mt-1">Fecha: {t.fecha}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => marcarCompletada(t.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 text-sm rounded"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => eliminarTarea(t.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-sm rounded"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
