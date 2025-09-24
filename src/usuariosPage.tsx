import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import casa from './assets/casa.png';
import { useNavigate, Link } from "react-router-dom";
import { FaHome, FaUserTie, FaEdit, FaTrash, FaPlus, FaBell } from "react-icons/fa";
import { motion } from "framer-motion";

interface Worker {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  salary?: string;
  emergencyNumber?: string;
  role?: string;
}

export default function UsuariosPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [addingWorker, setAddingWorker] = useState(false);
  const [formData, setFormData] = useState<Worker>({
    name: "",
    email: "",
    phone: "",
    position: "",
    salary: "",
    emergencyNumber: "",
  });
  const [hayNotificaciones, setHayNotificaciones] = useState(true); // ejemplo
  const workersPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    cargarWorkers();
  }, []);

  const cargarWorkers = async () => {
    const q = query(collection(db, "users"), where("role", "==", "worker"));
    const snapshot = await getDocs(q);
    setWorkers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker)));
  };

  const handleLogout = () => {
    // Aquí tu lógica de logout
    navigate("/login");
  };

  const eliminarWorker = async (id: string) => {
    if (confirm("¿Seguro que quieres eliminar este trabajador?")) {
      await deleteDoc(doc(db, "users", id));
      setWorkers(prev => prev.filter(worker => worker.id !== id));
    }
  };

  const guardarEdicion = async () => {
    if (editingWorker) {
      const ref = doc(db, "users", editingWorker.id!);
      await updateDoc(ref, formData);
      setWorkers(prev =>
        prev.map(worker =>
          worker.id === editingWorker.id ? { ...worker, ...formData } : worker
        )
      );
      setEditingWorker(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        position: "",
        salary: "",
        emergencyNumber: "",
      });
    }
  };

  const guardarNuevo = async () => {
    if (!formData.name || !formData.email) {
      alert("El nombre y el correo son obligatorios.");
      return;
    }
    const nuevo = { ...formData, role: "worker" };
    const docRef = await addDoc(collection(db, "users"), nuevo);
    setWorkers(prev => [...prev, { id: docRef.id, ...nuevo }]);
    setAddingWorker(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      position: "",
      salary: "",
      emergencyNumber: "",
    });
  };

  // Paginación
  const indexOfLastWorker = currentPage * workersPerPage;
  const indexOfFirstWorker = indexOfLastWorker - workersPerPage;
  const currentWorkers = workers.slice(indexOfFirstWorker, indexOfLastWorker);
  const totalPages = Math.ceil(workers.length / workersPerPage);

  return (
    <div
      className="relative flex flex-col min-h-screen bg-black bg-center bg-cover"
      style={{ backgroundImage: `url(${casa})` }}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-full sm:max-w-2xl md:max-w-4xl px-4 sm:px-6 mx-auto flex-1">

        {/* Header */}
        <header className="fixed top-0 left-0 w-full py-3 sm:py-4 px-4 sm:px-6 flex justify-between items-center bg-black/10 backdrop-blur-md shadow-lg text-white z-20">
          <button onClick={() => navigate("/home")} className="text-white hover:text-yellow-400 transition">
            <FaHome size={22} />
          </button>

          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide text-center">
            Lista de Trabajadores
          </h1>

          <div className="flex items-center gap-3">
            <Link to="/notificaciones" className="text-white text-xl relative">
              <FaBell />
              {hayNotificaciones && (
                <span className="absolute -top-2 -right-2 text-lg animate-bounce"></span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
            >
              Cerrar sesión
            </button>

           
          </div>
        </header>

        {/* Lista de trabajadores */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-20 sm:mt-24 mb-6 sm:mb-8 bg-white/10 p-4 sm:p-6 md:p-8 rounded-2xl w-full text-white shadow-lg backdrop-blur-lg overflow-y-auto max-h-[70vh]"
        >
          {workers.length === 0 ? (
            <p className="text-center text-base sm:text-lg font-medium">
              No hay trabajadores registrados.
            </p>
          ) : (
            <>
              <ul className="space-y-3 sm:space-y-4">
                {currentWorkers.map(worker => (
                  <motion.li
  key={worker.id}
  initial={{ opacity: 0, x: -30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.4 }}
  className="bg-[#FFF9E5] hover:bg-[#D6CBB3] p-5 sm:p-6 rounded-2xl flex flex-col gap-3 shadow-md transition-all duration-300 cursor-pointer"
>
  <div className="flex items-center gap-3">
    <FaUserTie className="text-[#2E7D32]" size={22} />
    <span className="font-semibold text-base sm:text-lg text-[#4E342E]">{worker.name}</span>
  </div>

  <div className="text-sm sm:text-base opacity-90 space-y-1 text-[#4E342E]">
    <p><b>Email:</b> {worker.email}</p>
    {worker.phone && <p><b>Teléfono:</b> {worker.phone}</p>}
    {worker.position && <p><b>Puesto:</b> {worker.position}</p>}
    {worker.salary && <p><b>Salario:</b> {worker.salary}</p>}
    {worker.hireDate && <p><b>Ingreso:</b> {worker.hireDate}</p>}
    {worker.emergencyNumber && <p><b>Emergencia:</b> {worker.emergencyNumber}</p>}
  </div>

  <div className="flex justify-end gap-3 mt-2">
    <button
      onClick={() => {
        setEditingWorker(worker);
        setFormData(worker);
      }}
      className="text-[#FFC107] hover:text-[#795548] transition-colors"
    >
      <FaEdit size={18} />
    </button>
    <button
      onClick={() => eliminarWorker(worker.id!)}
      className="text-[#D32F2F] hover:text-[#B71C1C] transition-colors"
    >
      <FaTrash size={18} />
    </button>
  </div>
</motion.li>

                ))}
              </ul>

              {/* Paginación */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm">Página {currentPage} de {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full bg-[#094297dc] py-2 sm:py-3 md:py-4 text-center text-[10px] sm:text-xs md:text-sm text-white">
        <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
      </footer>

      {/* Modal de edición */}
      {editingWorker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-xl w-96 text-black">
            <h2 className="text-lg font-bold mb-4">Editar trabajador</h2>
            {["nombre","email","telefono","posicion de trabajo","salario","numero de emergencia"].map(field => (
              <input
                key={field}
                type="text"
                placeholder={field}
                value={formData[field as keyof Worker] || ""}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full border rounded-md p-2 mb-2"
              />
            ))}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setEditingWorker(null)} className="px-3 py-1 bg-gray-300 rounded-md">Cancelar</button>
              <button onClick={guardarEdicion} className="px-3 py-1 bg-blue-500 text-white rounded-md">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de nuevo trabajador */}
      {addingWorker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-xl w-96 text-black">
            <h2 className="text-lg font-bold mb-4">Nuevo trabajador</h2>
            {["name","email","phone","position","salary","hireDate","emergencyNumber"].map(field => (
              <input
                key={field}
                type="text"
                placeholder={field}
                value={formData[field as keyof Worker] || ""}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full border rounded-md p-2 mb-2"
              />
            ))}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setAddingWorker(false)} className="px-3 py-1 bg-gray-300 rounded-md">Cancelar</button>
              <button onClick={guardarNuevo} className="px-3 py-1 bg-green-500 text-white rounded-md">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
