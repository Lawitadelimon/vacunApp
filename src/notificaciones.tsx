import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export default function Notificaciones() {
  const [tareas, setTareas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarTareas = async () => {
    const querySnapshot = await getDocs(collection(db, 'tareas'));
    const tareasFirebase = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));
    setTareas(tareasFirebase);
    setLoading(false);
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  const hoy = new Date().toISOString().split('T')[0];

  const pendientesHoy = tareas.filter(
    (t) => t.fecha <= hoy && !t.completada
  );

  const marcarCompletada = async (id: string) => {
    const tareaRef = doc(db, 'tareas', id);
    await updateDoc(tareaRef, { completada: true });
    cargarTareas(); // recargar lista
  };

  const eliminarTarea = async (id: string) => {
    const tareaRef = doc(db, 'tareas', id);
    await deleteDoc(tareaRef);
    cargarTareas(); // recargar lista
  };

  return (
    <div className="min-h-screen bg-yellow-100 flex flex-col items-center p-4">
      <header className="bg-yellow-600 w-full py-4 text-center shadow-md mb-4">
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
                className="bg-yellow-50 p-3 rounded border border-yellow-200 shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{t.tarea}</p>
                  <p className="text-sm text-gray-600">Fecha: {t.fecha}</p>
                </div>
                <div className="flex gap-2">
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
