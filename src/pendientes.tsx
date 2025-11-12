import {  useNavigate } from "react-router-dom"; 
import {
  FaClipboardList,
  FaTrash,
  FaHome,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import cow2Image from "./assets/cows2.jpg";

// Interfaces
interface Usuario {
  id: string;
  nombre?: string;
  email?: string;
  role?: string;
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  para: string;
  paraNombre?: string;
  categoria: string;
  fecha: string;
  completada: boolean;
  userId: string;
  reporte?: string;
  estado: "pendiente" | "realizada" | "no realizada";
}

interface Notificacion {
  id: string;
  mensaje: string;
  para: string;
  leido: boolean;
  tareaId?: string;
  creadoEn: any;
}

export default function Pendientes() {
  const [tarea, setTarea] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [para, setPara] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState("");
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [abiertas, setAbiertas] = useState<string[]>([]);
  const [pagina, setPagina] = useState(1);
  const [, setNotificaciones] = useState<Notificacion[]>([]);
  const [, setHayNotificaciones] = useState(false);

  const navigate = useNavigate();
  const categoriasGranja = ["Vacunación", "Alimentación", "Limpieza", "Revisión"];
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  const tareasPorPagina = 5;

  const toggleTarea = (id: string) => {
    setAbiertas((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  // Tareas
  useEffect(() => {
    const q = query(collection(db, "tareas"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Tarea, "id">),
      }));
      setTareas(lista);
    });
    return () => unsub();
  }, []);

  // Usuarios
  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Usuario, "id">),
      }));
      setUsuarios(lista.filter((u) => u.role === "worker"));
    });
    return () => unsub();
  }, []);

  // Notificaciones
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "notificaciones"),
      where("para", "==", userId),
      orderBy("creadoEn", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Notificacion)
      );
      setNotificaciones(lista);
      setHayNotificaciones(lista.some((n) => !n.leido));
    });
    return () => unsub();
  }, [userId]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const indexUltimaTarea = pagina * tareasPorPagina;
  const indexPrimeraTarea = indexUltimaTarea - tareasPorPagina;
  const tareasMostradas = tareas.slice(indexPrimeraTarea, indexUltimaTarea);
  const totalPaginas = Math.ceil(tareas.length / tareasPorPagina);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarea || !descripcion || !para || !categoria || !fecha || !userId) {
      return Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'Completa todos los campos',
      });
    }

    const trabajador = usuarios.find((u) => u.id === para);
    const data: Omit<Tarea, "id"> = {
      titulo: tarea.trim(),
      descripcion: descripcion.trim(),
      para: trabajador?.id || "",
      paraNombre: trabajador?.nombre || trabajador?.email || "",
      categoria,
      fecha,
      completada: false,
      userId,
      reporte: "",
      estado: "pendiente",
    };

    if (editandoId) {
      await updateDoc(doc(db, "tareas", editandoId), data);
      setEditandoId(null);
      Swal.fire({
        icon: 'success',
        title: 'Tarea actualizada',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      await addDoc(collection(db, "tareas"), data);
      Swal.fire({
        icon: 'success',
        title: 'Tarea añadida',
        showConfirmButton: false,
        timer: 1500
      });
    }

    setTarea("");
    setDescripcion("");
    setPara("");
    setCategoria("");
    setFecha("");
  };

  const handleEliminar = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Seguro que deseas eliminar esta tarea?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, "tareas", id));
      Swal.fire({
        icon: 'success',
        title: 'Tarea eliminada',
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cow2Image})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

      {/* HEADER ancho completo */}
      <header className="w-full py-3 px-4 flex justify-between items-center shadow-md bg-blue-500 text-black relative z-20">
        <h1 className="text-xl sm:text-2xl font-extrabold">
          Asignación de tareas
        </h1>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="text-black hover:text-blue-300 transition">
            <FaHome size={22} />
          </button>

          

          <button
            onClick={handleLogout}
            className="bg-blue-400 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded-xl"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Menú móvil */}
        <div className="md:hidden relative">
          <button
            className="text-black text-2xl hover:text-blue-300 transition"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white/40 rounded-xl shadow-lg py-3 flex flex-col items-center gap-2 z-50">
              <button
                onClick={() => { navigate("/home"); setMenuOpen(false); }}
                className="w-5/7 py-2 rounded-xl bg-blue-400 hover:bg-blue-500 flex items-center font-semibold justify-center gap-2"
              >
                <FaHome /> Inicio
              </button>
              
              <button
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-xl w-full"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Contenedor centrado */}
      <div className="relative z-10 flex-1 flex flex-col items-center w-full max-w-6xl mx-auto px-2 sm:px-4">
        {/* Leyenda */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-6 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-1 rounded-full shadow">
            <FaClock className="text-gray-500" /> Pendiente
          </div>
          <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1 rounded-full shadow">
            <FaCheckCircle className="text-green-600" /> Realizada
          </div>
          <div className="flex items-center gap-2 text-red-700 bg-red-100 px-3 py-1 rounded-full shadow">
            <FaTimesCircle className="text-red-600" /> No realizada
          </div>
        </div>

        {/* Contenido principal */}
        <main className="flex flex-col md:flex-row justify-center gap-6 sm:gap-8 p-4 sm:p-6 w-full">
          {/* Lista */}
          <section className="bg-white/90 rounded-2xl shadow-lg p-4 sm:p-6 w-full md:w-1/2 border border-yellow-100 transition-all hover:shadow-2xl max-h-[600px] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-black mb-4 border-b border-blue-500 pb-2">
              <FaClipboardList className="text-blue-600" /> Tareas Registradas
            </h2>

            {tareas.length === 0 ? (
              <p className="text-center text-gray-600 italic">
                No hay tareas registradas aún 🐄
              </p>
            ) : (
              tareasMostradas.map((t) => {
                const abierta = abiertas.includes(t.id);
                const pendiente = t.estado === "pendiente";
                const noRealizada = t.estado === "no realizada";
                const realizada = t.estado === "realizada";

                return (
                  <div
                    key={t.id}
                    className={`p-4 mb-3 rounded-xl border shadow-md transition-all ${
                      pendiente
                        ? "bg-gray-50 border-gray-300 hover:bg-gray-100"
                        : noRealizada
                        ? "bg-red-100 border-red-400 hover:bg-red-200"
                        : "bg-green-100 border-green-400 hover:bg-green-200"
                    }`}
                  >
                    <div
                      className="flex items-center justify-between"
                      onClick={() => toggleTarea(t.id)}
                    >
                      <div className="flex items-center gap-3">
                        {pendiente && <FaClock className="text-gray-500" />}
                        {noRealizada && <FaTimesCircle className="text-red-600" />}
                        {realizada && <FaCheckCircle className="text-green-600" />}
                        <div>
                          <p className="font-semibold">{t.titulo}</p>
                          <p className="text-xs text-gray-600">{t.categoria}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditandoId(t.id);
                            setTarea(t.titulo);
                            setDescripcion(t.descripcion || "");
                            setPara(t.para);
                            setCategoria(t.categoria);
                            setFecha(t.fecha);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminar(t.id);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>

                    {abierta && (
                      <div className="mt-2 ml-8 text-sm text-gray-700">
                        {t.descripcion && <p>{t.descripcion}</p>}
                        <p>👨‍🌾 {t.paraNombre}</p>
                        <p>📅 {t.fecha}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPagina(n)}
                    className={`px-3 py-1 rounded ${
                      n === pagina
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-blue-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Formulario */}
          <section className="bg-white/90 rounded-2xl shadow-lg p-4 sm:p-6 w-full md:w-1/2 border border-blue-500 transition-all hover:shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-blue-800 mb-4 border-b border-blue-500 pb-2">
              {editandoId ? "✏️ Editar tarea" : "🧾 Añadir nueva tarea"}
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                value={tarea}
                onChange={(e) => setTarea(e.target.value)}
                placeholder="Tarea..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={para}
                onChange={(e) => setPara(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccionar trabajador</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre || u.email}
                  </option>
                ))}
              </select>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccionar categoría</option>
                {categoriasGranja.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="date"
                min={hoy}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
              >
                {editandoId ? "Guardar cambios" : "Añadir tarea"}
              </button>
            </form>
          </section>
        </main>

        {/* Footer */}
       {/* FOOTER ancho completo */}
      <footer className="w-full bg-[#099757dc] py-3 md:py-4 text-center text-xs md:text-sm text-white fixed bottom-0 z-50">
        <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
      </footer>
    </div>
    </div>
  );
}
