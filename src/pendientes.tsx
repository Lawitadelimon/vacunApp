import { Link } from 'react-router-dom';
import { FaClipboardList, FaBell, FaTrash, FaHome } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import Notificaciones from './notificaciones';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function Pendientes() {
  const [tarea, setTarea] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [para, setPara] = useState('');
  const [categoria, setCategoria] = useState('');
  const [animalId, setAnimalId] = useState('');
  const [fecha, setFecha] = useState('');
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [tareas, setTareas] = useState<any[]>([]);
  const [animales, setAnimales] = useState<any[]>([]);

  const categoriasGranja = ['Vacunación', 'Alimentación', 'Limpieza', 'Revisión'];
  const hoy = new Date().toISOString().split('T')[0];

  // Cargar tareas
  useEffect(() => {
    const cargarTareas = async () => {
      const querySnapshot = await getDocs(collection(db, 'tareas'));
      const lista = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTareas(lista);
    };
    cargarTareas();
  }, []);

  // Cargar animales para desplegable
  useEffect(() => {
    const cargarAnimales = async () => {
      const querySnapshot = await getDocs(collection(db, 'categorias'));
      let lista: any[] = [];
      for (let cat of querySnapshot.docs) {
        const animalesSnap = await getDocs(collection(db, 'categorias', cat.id, 'animales'));
        lista.push(...animalesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
      setAnimales(lista);
    };
    cargarAnimales();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarea || !fecha || !para || !categoria) return alert('Completa los campos obligatorios');

    // Buscar el animal seleccionado (si aplica)
    let animalSeleccionado = null;
    if (categoria === 'Vacunación' && animalId) {
      animalSeleccionado = animales.find(a => (a.codigo || a.id) === animalId) || null;
    }

    const nuevaTarea = {
      titulo: tarea,
      descripcion,
      para,
      categoria,
      animalId: animalId || '',
      animalCodigo: animalSeleccionado?.codigo || '',
      animalRaza: animalSeleccionado?.raza || '',
      fecha,
      completada: false
    };

    const docRef = await addDoc(collection(db, 'tareas'), nuevaTarea);
    setTareas([...tareas, { ...nuevaTarea, id: docRef.id }]);

    setTarea('');
    setDescripcion('');
    setPara('');
    setCategoria('');
    setAnimalId('');
    setFecha('');
  };

  const eliminarTarea = async (id: string) => {
    await deleteDoc(doc(db, 'tareas', id));
    setTareas(tareas.filter(t => t.id !== id));
  };

  const marcarCompletada = (id: string) => {
    setTareas(prev =>
      prev.map(t => t.id === id ? { ...t, completada: !t.completada } : t)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-yellow-300 font-sans">
      {/* Header con botón de casita y título centrado */}
      <header className="bg-yellow-600 w-full py-4 px-6 shadow-md relative flex items-center justify-between">
        <Link to="/" className="text-white text-2xl hover:text-yellow-200">
          <FaHome />
        </Link>

        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-2xl font-extrabold">
          VacunApp - Pendientes
        </h1>

        <button
          onClick={() => setMostrarNotificaciones(true)}
          className="relative text-white text-xl hover:text-yellow-200"
        >
          <FaBell />
          {tareas.some(t => !t.completada && t.fecha >= hoy) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full"></span>
          )}
        </button>
      </header>

      <main className="flex flex-col md:flex-row justify-center gap-6 p-6">
        {/* Lista de tareas */}
        <section className="bg-white rounded-xl shadow-md p-6 w-full md:w-1/2">
          <h2 className="text-lg font-bold flex items-center gap-2 text-yellow-800 mb-4">
            <FaClipboardList className="text-yellow-600" />
            Tareas Registradas
          </h2>

          <ul className="space-y-4">
            {tareas.map((t) => (
              <li key={t.id} className="p-3 bg-yellow-100 rounded shadow space-y-1 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={t.completada}
                      onChange={() => marcarCompletada(t.id)}
                    />
                    <span className={`font-medium ${t.completada ? 'line-through text-gray-500' : ''}`}>
                      {t.titulo} {t.animalCodigo && `(Animal: ${t.animalCodigo} - ${t.animalRaza})`}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 italic">Para: {t.para}</div>
                  {t.descripcion && (
                    <div className="text-xs text-gray-600">{t.descripcion}</div>
                  )}
                  <div className="text-xs text-yellow-700 mt-1">{t.fecha}</div>
                </div>
                <button
                  onClick={() => eliminarTarea(t.id)}
                  className="text-red-600 hover:text-red-800 ml-2"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Formulario */}
        <section className="bg-white rounded-xl shadow-md p-6 w-full md:w-1/2">
          <h2 className="text-lg font-bold text-yellow-800 mb-4">Añadir nueva tarea</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-yellow-800">Tarea:</label>
              <input
                type="text"
                value={tarea}
                onChange={(e) => setTarea(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Descripción / Leyenda:</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Tarea asignada para:</label>
              <input
                type="text"
                value={para}
                onChange={(e) => setPara(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Categoría:</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Seleccionar categoría</option>
                {categoriasGranja.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {categoria === 'Vacunación' && (
              <div>
                <label className="block text-sm font-medium text-yellow-800">Animal:</label>
                <select
                  value={animalId}
                  onChange={(e) => setAnimalId(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Seleccionar animal</option>
                  {animales.map((a) => (
                    <option key={a.id} value={a.codigo || a.id}>
                      {a.codigo || a.id} - {a.raza || 'Sin raza'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-yellow-800">Fecha:</label>
              <input
                type="date"
                value={fecha}
                min={hoy}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:ring-2 focus:ring-yellow-400"
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
