import { FaClipboardList, FaBell } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Notificaciones from './notificaciones';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';

export default function Pendientes() {
  const [tarea, setTarea] = useState('');
  const [para, setPara] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState('');
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [tareas, setTareas] = useState([]);

  const hoy = new Date().toISOString().split('T')[0];

  const categorias = [
    'Vacunación',
    'Alimentación',
    'Revisión veterinaria',
    'Limpieza corral',
    'Pesaje',
    'Otros',
  ];

  useEffect(() => {
    const cargarTareas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tareas'));
        const tareasFirebase = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setTareas(tareasFirebase);
      } catch (error) {
        console.error('Error al cargar tareas:', error);
      }
    };

    cargarTareas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tarea || !fecha || !para) return alert('Completa todos los campos');

    const nuevaTarea = {
      titulo: tarea,
      para,
      categoria,
      fecha,
      completada: false,
    };

    try {
      const docRef = await addDoc(collection(db, 'tareas'), nuevaTarea);
      setTareas([...tareas, { ...nuevaTarea, id: docRef.id }]);
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      alert('Error al guardar tarea en la base de datos.');
    }

    setTarea('');
    setPara('');
    setCategoria('');
    setFecha('');
  };

  const handleEliminar = async (id) => {
    try {
      await deleteDoc(doc(db, 'tareas', id));
      setTareas(tareas.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
  };

  const toggleCompletada = async (id, completada) => {
    try {
      await updateDoc(doc(db, 'tareas', id), { completada: !completada });
      setTareas(
        tareas.map(t =>
          t.id === id ? { ...t, completada: !completada } : t
        )
      );
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
    }
  };

  const tareasPendientesHoy = tareas.filter(
    t => t.fecha <= hoy && !t.completada
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-yellow-300 font-sans">
      <header className="bg-yellow-600 w-full py-4 px-6 shadow-md flex justify-between items-center">
        <h1 className="text-white text-2xl font-extrabold">VacunApp - Pendientes</h1>
        <div className="relative">
          <button onClick={() => setMostrarNotificaciones(true)} className="text-white text-xl">
            <FaBell />
            {tareasPendientesHoy.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      <main className="flex flex-col md:flex-row justify-center gap-6 p-6">
        <section className="bg-white rounded-xl shadow-md p-6 w-full md:w-1/2">
          <h2 className="text-lg font-bold flex items-center gap-2 text-yellow-800 mb-4">
            <FaClipboardList className="text-yellow-600" />
            Tareas Registradas
          </h2>

          <ul className="space-y-4">
            {tareas.map((t) => (
              <li key={t.id} className="p-3 bg-yellow-100 rounded shadow space-y-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={t.completada}
                      onChange={() => toggleCompletada(t.id, t.completada)}
                      className="cursor-pointer"
                    />
                    <span className={`font-medium ${t.completada ? 'line-through text-gray-500' : ''}`}>
                      {t.titulo}
                    </span>
                  </div>

                  <button
                    onClick={() => handleEliminar(t.id)}
                    className="text-red-500 font-bold text-xl px-2"
                  >
                    ×
                  </button>
                </div>

                <div className="text-sm text-gray-700 italic">Para: {t.para}</div>
                <div className="text-sm text-gray-700 italic">Categoría: {t.categoria}</div>
                <div className="text-sm text-yellow-700 mt-1">Fecha: {t.fecha}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl shadow-md p-6 w-full md:w-1/2">
          <h2 className="text-lg font-bold text-yellow-800 mb-4">Añadir nueva tarea</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-yellow-800">Tarea:</label>
              <input
                type="text"
                value={tarea}
                onChange={(e) => setTarea(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Asignada Para:</label>
              <input
                type="text"
                value={para}
                onChange={(e) => setPara(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Categoría:</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Fecha:</label>
              <input
                type="date"
                value={fecha}
                min={hoy}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md mt-2"
            >
              Añadir tarea
            </button>
          </form>
        </section>
      </main>

      {mostrarNotificaciones && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/2 shadow-lg relative">
            <button
              className="absolute top-2 right-3 text-yellow-700 font-bold text-xl"
              onClick={() => setMostrarNotificaciones(false)}
            >
              ×
            </button>
            <Notificaciones tareas={tareas} />
          </div>
        </div>
      )}
    </div>
  );
}
