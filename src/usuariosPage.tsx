import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUserTie,
  FaEdit,
  FaTrash,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import Swal from "sweetalert2";
import cowsBackground from "./assets/cows2.jpg";

interface Worker {
  hireDate?: any;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [] = useState(false);
  const workersPerPage = 8;
  const navigate = useNavigate();

  useEffect(() => {
    const cargarWorkers = async () => {
      const q = query(collection(db, "users"), where("role", "==", "worker"));
      const snapshot = await getDocs(q);
      setWorkers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Worker)));
    };
    cargarWorkers();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const eliminarWorker = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Seguro que quieres eliminar este trabajador?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, "users", id));
      setWorkers((prev) => prev.filter((w) => w.id !== id));
      Swal.fire({
        icon: 'success',
        title: 'Trabajador eliminado',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const guardarEdicion = async () => {
    if (editingWorker) {
      const ref = doc(db, "users", editingWorker.id!);
      const { id, ...dataToUpdate } = formData;
      const cleanData = Object.fromEntries(
        Object.entries(dataToUpdate).filter(([, value]) => value !== undefined && value !== "")
      );
      await updateDoc(ref, cleanData);
      setWorkers((prev) =>
        prev.map((w) => (w.id === editingWorker.id ? { ...w, ...formData } : w))
      );
      setEditingWorker(null);
      Swal.fire({
        icon: 'success',
        title: 'Trabajador actualizado',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  const guardarNuevo = async () => {
    if (!formData.name || !formData.email) {
      return Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'El nombre y el correo son obligatorios',
      });
    }
    const nuevo = { ...formData, role: "worker" };
    const docRef = await addDoc(collection(db, "users"), nuevo);
    setWorkers((prev) => [...prev, { id: docRef.id, ...nuevo }]);
    setAddingWorker(false);
    Swal.fire({
      icon: 'success',
      title: 'Trabajador añadido',
      showConfirmButton: false,
      timer: 1500
    });
  };

  // Paginación
  const indexOfLastWorker = currentPage * workersPerPage;
  const indexOfFirstWorker = indexOfLastWorker - workersPerPage;
  const currentWorkers = workers.slice(indexOfFirstWorker, indexOfLastWorker);
  const totalPages = Math.ceil(workers.length / workersPerPage);

  return (
    <div
      className="relative flex flex-col min-h-screen bg-black bg-cover bg-center"
      style={{ backgroundImage: `url(${cowsBackground})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full py-3 px-4 sm:px-6 flex justify-between items-center bg-purple-600 text-white shadow-md z-30">
        <h1 className="text-2xl text-white md:text-2xl font-extrabold">Lista de Trabajadores</h1>

        {/* Desktop menu */}
        <div className="hidden sm:flex text-white items-center gap-4">
          <button
            onClick={() => navigate("/home")}
            className="hover:text-purple-300 transition"
          >
            <FaHome size={22} />
          </button>

         

          <button
            onClick={handleLogout}
            className="bg-purple-400 hover:bg-purple-500 text-white font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Mobile menu */}
        <button
          className="sm:hidden text-black hover:text-purple-300 text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full right-0 bg-white/40 text-black w-48 rounded-b-2xl shadow-lg flex flex-col items-center py-2 gap-2 md:hidden animate-fadeIn"
          >
            <button
              onClick={() => {
                navigate("/home");
                setMenuOpen(false);
              }}
              className="w-4/5 py-2 rounded-xl bg-purple-400 hover:bg-purple-500 flex items-center font-semibold justify-center gap-2"
            >
              <FaHome /> Inicio
            </button>
           
            <button
              onClick={() => {
                handleLogout();
                setMenuOpen(false);
              }}
              className="w-4/5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center font-semibold justify-center gap-2"
            >
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </header>

      {/* MAIN */}
      <main className="relative z-10 flex flex-col flex-1 items-center pt-20 pb-20 px-3 sm:px-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/30 backdrop-blur-lg rounded-3xl shadow-lg p-4 sm:p-6 md:p-8 w-full max-w-5xl text-black overflow-y-auto"
        >
          {workers.length === 0 ? (
            <p className="text-center text-white text-base sm:text-lg">
              No hay trabajadores registrados.
            </p>
          ) : (
            <>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentWorkers.map((worker) => (
                  <motion.li
                    key={worker.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-purple-50 hover:bg-purple-200 rounded-2xl p-4 sm:p-5 shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FaUserTie className="text-purple-700" />
                      <span className="font-semibold text-lg">{worker.name}</span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <b>Email:</b> {worker.email}
                      </p>
                      {worker.phone && <p><b>Teléfono:</b> {worker.phone}</p>}
                      {worker.position && <p><b>Puesto:</b> {worker.position}</p>}
                      {worker.salary && <p><b>Salario:</b> {worker.salary}</p>}
                      {worker.emergencyNumber && (
                        <p><b>Emergencia:</b> {worker.emergencyNumber}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setEditingWorker(worker);
                          setFormData(worker);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full flex items-center justify-center"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => eliminarWorker(worker.id!)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full flex items-center justify-center"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </ul>

              {/* Paginación */}
              <div className="flex justify-center items-center gap-3 mt-6 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  Anterior
                </button>
                <span className="text-white text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md disabled:opacity-50 text-sm sm:text-base"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </motion.div>
      </main>

      

      {/* MODALES */}
      {(editingWorker || addingWorker) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 px-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md text-black overflow-y-auto max-h-[80vh]">
            <h2 className="text-lg font-bold mb-3">
              {editingWorker ? "Editar trabajador" : "Nuevo trabajador"}
            </h2>
            {["name", "email", "phone", "position", "salary", "emergencyNumber"].map(
              (field) => (
                <input
                  key={field}
                  type="text"
                  placeholder={field}
                  value={formData[field as keyof Worker] || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                  className="w-full border rounded-md p-2 mb-2 focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                />
              )
            )}
            <div className="flex flex-wrap justify-end gap-2 mt-3">
              <button
                onClick={() =>
                  editingWorker ? setEditingWorker(null) : setAddingWorker(false)
                }
                className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded-xl font-semibold text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={editingWorker ? guardarEdicion : guardarNuevo}
                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm sm:text-base"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
