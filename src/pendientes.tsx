import { FaClipboardList, FaBell } from 'react-icons/fa';
import { useState } from 'react';
import Notificaciones from './notificatciones'; 

export default function Pendientes() {
  const [tarea, setTarea] = useState('');
  const [para, setPara] = useState('');
  const [categoria, setCategoria] = useState('');
  const [fecha, setFecha] = useState('');
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  const [tareas, setTareas] = useState([
    { titulo: 'Vacunar vaca 001', para: 'Carlos', fecha: 'Hoy' },
    { titulo: 'Revisión veterinaria', para: 'Lucía', fecha: '28/06/2025' },
    { titulo: 'Aplicar antiparasitario', para: 'Pedro', fecha: '01/07/2025' },
  ]);

  const hoy = new Date().toISOString().split('T')[0]; 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tarea || !fecha || !para || !categoria) return alert('Completa todos los campos');

    const nuevaTarea = {
      titulo: tarea,
      para,
      categoria,
      fecha,
    };

    setTareas([...tareas, nuevaTarea]);

    setTarea('');
    setPara('');
    setCategoria('');
    setFecha('');
  };

  const handleNotificaciones = () => {
    setMostrarNotificaciones(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 to-yellow-300 font-sans">
    
      <header className="bg-yellow-600 w-full py-4 px-6 shadow-md flex justify-between items-center">
        <h1 className="text-white text-2xl font-extrabold">VacunApp - Pendientes</h1>
        <button onClick={handleNotificaciones} className="text-white text-xl">
          <FaBell />
        </button>
      </header>

      <main className="flex flex-col md:flex-row justify-center gap-6 p-6">
        
        <section className="bg-white rounded-xl shadow-md p-6 w-full md:w-1/2">
          <h2 className="text-lg font-bold flex items-center gap-2 text-yellow-800 mb-4">
            <FaClipboardList className="text-yellow-600" />
            Tareas Registradas
          </h2>

          <ul className="space-y-4">
            {tareas.map((t, index) => (
              <li key={index} className="p-3 bg-yellow-100 rounded shadow space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t.titulo}</span>
                  <span className="text-sm text-yellow-700">{t.fecha}</span>
                </div>
                <div className="text-sm text-gray-700 italic">Para: {t.para}</div>
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
                className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Tarea Asignada Para:</label>
              <input
                type="text"
                value={para}
                onChange={(e) => setPara(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Categoría:</label>
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-yellow-800">Fecha:</label>
              <input
                type="date"
                value={fecha}
                min={hoy}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
