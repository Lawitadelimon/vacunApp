import { Link, useNavigate } from "react-router-dom";
import {
  FaClipboardList,
  FaTrash,
  FaHome,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBell,
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
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [hayNotificaciones, setHayNotificaciones] = useState(false);

  const navigate = useNavigate();
  const categoriasGranja = ["Vacunación", "Alimentación", "Limpieza", "Revisión"];
  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];
  const tareasPorPagina = 5;

  const toggleTarea = (id: string) => {
    setAbiertas(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
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

  // Notificaciones en tiempo real
  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "notificaciones"),
      where("para", "==", userId),
      orderBy("creadoEn", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notificacion));
      setNotificaciones(lista);
      setHayNotificaciones(lista.some(n => !n.leido));
    });
    return () => unsub();
  }, [userId]);

  const abrirNotificacion = async (n: Notificacion) => {
    if (!n.leido) await updateDoc(doc(db, "notificaciones", n.id), { leido: true });
    if (n.tareaId) navigate(`/pendientes/${n.tareaId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tarea.trim() || !descripcion.trim() || !para || !categoria || !fecha || !userId) return alert("Completa todos los campos");

    const trabajadorSeleccionado = usuarios.find((u) => u.id === para);
    const datosTarea: Omit<Tarea, "id"> = {
      titulo: tarea.trim(),
      descripcion: descripcion.trim(),
      para: trabajadorSeleccionado?.id || "",
      paraNombre: trabajadorSeleccionado?.nombre || trabajadorSeleccionado?.email || "",
      categoria,
      fecha,
      completada: false,
      userId,
      reporte: "",
      estado: "pendiente",
    };

    if (editandoId) {
      await updateDoc(doc(db, "tareas", editandoId), datosTarea);
      setEditandoId(null);
    } else {
      await addDoc(collection(db, "tareas"), datosTarea);
    }

    setTarea("");
    setDescripcion("");
    setPara("");
    setCategoria("");
    setFecha("");
  };

  const eliminarTarea = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;
    await deleteDoc(doc(db, "tareas", id));
  };

  const editarTarea = (t: Tarea) => {
    setTarea(t.titulo);
    setDescripcion(t.descripcion || "");
    setPara(t.para);
    setCategoria(t.categoria);
    setFecha(t.fecha);
    setEditandoId(t.id);
  };

  const formatearReporteVisual = (reporte: any) => {
    if (!reporte) return <span className="italic text-gray-500">Sin reporte</span>;
    if (typeof reporte === "string") return <span>{reporte.trim()}</span>;
    if (typeof reporte === "object") {
      const entries = Object.entries(reporte).filter(([_, v]) => v && v.toString().trim() !== "");
      if (entries.length === 0) return <span className="italic text-gray-500">Sin reporte</span>;
      return (
        <ul className="list-disc list-inside space-y-1">
          {entries.map(([k, v]) => (
            <li key={k}><strong className="capitalize">{k}:</strong> {v}</li>
          ))}
        </ul>
      );
    }
    return <span>{reporte.toString()}</span>;
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  // Paginación
  const indexUltimaTarea = pagina * tareasPorPagina;
  const indexPrimeraTarea = indexUltimaTarea - tareasPorPagina;
  const tareasMostradas = tareas.slice(indexPrimeraTarea, indexUltimaTarea);
  const totalPaginas = Math.ceil(tareas.length / tareasPorPagina);

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${cow2Image})` }} />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

      <div className="relative z-10 flex-1 flex flex-col items-center max-w-6xl mx-auto w-full px-4">
       {/* Header */}
<header className="w-screen py-3 px-4 md:py-4 md:px-6 flex justify-between items-center shadow-md bg-amber-500 text-white relative z-20">
  <h1 className="text-lg md:text-2xl font-extrabold">AniManager</h1>

  {/* Menú desktop */}
  <div className="hidden md:flex items-center gap-4">
    <button onClick={() => navigate("/home")} className="text-white hover:text-yellow-400 transition">
      <FaHome size={22} />
    </button>

    <div className="relative">
      <button onClick={() => navigate("/notificaciones")} className="text-white hover:text-yellow-400 text-xl transition">
        <FaBell />
      </button>
      {hayNotificaciones && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
          {notificaciones.filter(n => !n.leido).length}
        </span>
      )}
    </div>

    <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
      Cerrar sesión
    </button>
  </div>

  {/* Menú hamburguesa móvil */}
  <button
    className="md:hidden text-white text-2xl hover:text-yellow-400 transition"
    onClick={() => setMenuOpen(!menuOpen)}
  >
    {menuOpen ? <FaTimes /> : <FaBars />}
  </button>

  {menuOpen && (
    <div className="absolute top-full right-2 mt-2 w-56 bg-black/90 backdrop-blur-md rounded-lg shadow-lg flex flex-col p-3 space-y-2 md:hidden z-50">
      {/* Inicio */}
      <button
        onClick={() => { navigate("/home"); setMenuOpen(false); }}
        className="flex items-center gap-2 text-white hover:text-gray-300"
      >
        <FaHome /> Inicio
      </button>

      {/* Notificaciones */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(false) || navigate("/notificaciones")}
          className="flex items-center gap-2 text-white hover:text-gray-300 w-full"
        >
          <FaBell /> Notificaciones
          {hayNotificaciones && (
            <span className="ml-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
              {notificaciones.filter(n => !n.leido).length}
            </span>
          )}
        </button>
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={() => { handleLogout(); setMenuOpen(false); }}
        className="flex items-center gap-2 text-red-400 hover:text-red-600"
      >
        🚪 Cerrar sesión
      </button>
    </div>
  )}
</header>


        {/* Leyenda */}
        <div className="flex justify-center gap-6 mt-6 text-sm md:text-base font-medium">
          <div className="flex items-center gap-2 text-gray-700 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full shadow">
            <FaClock className="text-gray-500" /> Pendiente
          </div>
          <div className="flex items-center gap-2 text-green-700 bg-green-100 px-3 py-1 rounded-full shadow">
            <FaCheckCircle className="text-green-600" /> Realizada
          </div>
          <div className="flex items-center gap-2 text-red-700 bg-red-100 px-3 py-1 rounded-full shadow">
            <FaTimesCircle className="text-red-600" /> No realizada
          </div>
        </div>

        <main className="flex flex-col md:flex-row justify-center gap-8 p-6 w-full">
          {/* Lista de tareas */}
          <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 w-full md:w-1/2 border border-yellow-100 transition-all hover:shadow-2xl hover:scale-[1.01] max-h-[600px] overflow-y-auto scrollbar-hide">
            <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-800 mb-6 border-b border-yellow-300 pb-2">
              <FaClipboardList className="text-yellow-600" /> Tareas Registradas
            </h2>

            {tareas.length === 0 ? (
              <p className="text-center text-gray-600 italic">No hay tareas registradas aún 🐄</p>
            ) : (
              <>
                <ul className="space-y-4">
                  {tareasMostradas.map((t) => {
                    const pendiente = t.estado === "pendiente";
                    const noRealizada = t.estado === "no realizada";
                    const realizada = t.estado === "realizada";
                    const abierta = abiertas.includes(t.id);

                    return (
                      <li key={t.id} className={`group p-4 rounded-xl shadow-md border transition-all duration-300 transform hover:scale-[1.02] ${pendiente ? "bg-gray-50 border-gray-300 hover:bg-gray-100" : noRealizada ? "bg-red-100 border-red-400 hover:bg-red-200" : "bg-green-100 border-green-400 hover:bg-green-200"}`}>
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleTarea(t.id)}>
                          <div className="flex items-center gap-3">
                            {pendiente && <FaClock className="text-gray-500 text-2xl" />}
                            {noRealizada && <FaTimesCircle className="text-red-600 text-2xl" />}
                            {realizada && <FaCheckCircle className="text-green-600 text-2xl" />}
                            <div className="font-semibold text-gray-800">{t.titulo} <span className="text-sm text-gray-600">({t.categoria})</span></div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={(e) => { e.stopPropagation(); editarTarea(t); }} className="text-blue-600 hover:text-blue-800 transition-transform hover:scale-125"><FaEdit /></button>
                            <button onClick={(e) => { e.stopPropagation(); eliminarTarea(t.id); }} className="text-red-600 hover:text-red-800 transition-transform hover:scale-125"><FaTrash /></button>
                          </div>
                        </div>

                        {abierta && (
                          <div className="mt-2 ml-9">
                            {t.descripcion && <div className="text-xs text-gray-700">{t.descripcion}</div>}
                            <div className="text-sm text-gray-800 mt-1">👨‍🌾 Asignada a: <span className="font-medium text-yellow-800">{t.paraNombre || t.para}</span></div>
                            <div className="text-xs text-yellow-700 mt-1">📅 Fecha: {t.fecha}</div>
                            {pendiente && <div className="mt-2 p-3 rounded-md border border-gray-300 bg-white/70 text-gray-700 italic">⏳ Esperando reporte del trabajador</div>}
                            {!pendiente && (
                              <div className={`mt-3 p-3 rounded-md border ${noRealizada ? "bg-red-50 border-red-300 text-red-900" : "bg-green-50 border-green-300 text-green-900"} transition-opacity`}>
                                <strong>Reporte del trabajador:</strong>
                                <div className="mt-1 font-semibold">{noRealizada ? "❌ Tarea no realizada" : "✅ Tarea realizada"}</div>
                                <div className="mt-1 p-2 bg-white/60 border rounded-md text-sm">
                                  <strong>📝 Detalle:</strong>
                                  <div className="mt-1 text-gray-800">{formatearReporteVisual(t.reporte)}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(num => (
                      <button key={num} onClick={() => setPagina(num)} className={`px-3 py-1 rounded ${num === pagina ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-yellow-300"}`}>{num}</button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Formulario */}
          <section className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 w-full md:w-1/2 border border-yellow-100 transition-all hover:shadow-2xl hover:scale-[1.01]">
            <h2 className="text-xl font-bold text-yellow-800 mb-6 border-b border-yellow-300 pb-2">
              {editandoId ? "✏️ Editar tarea" : "🧾 Añadir nueva tarea"}
            </h2>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-yellow-800">Tarea:</label>
                <input type="text" value={tarea} onChange={(e) => setTarea(e.target.value)} className="mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all" placeholder="Ej. Alimentar ganado" />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-yellow-800">Descripción:</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all" placeholder="Detalles adicionales..."></textarea>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-yellow-800">Asignar a trabajador:</label>
                <select value={para} onChange={(e) => setPara(e.target.value)} className="mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all">
                  <option value="">Seleccionar trabajador</option>
                  {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nombre || u.email}</option>))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-yellow-800">Categoría:</label>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all">
                  <option value="">Seleccionar categoría</option>
                  {categoriasGranja.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-yellow-800">Fecha:</label>
                <input type="date" value={fecha} min={hoy} onChange={(e) => setFecha(e.target.value)} className="mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none transition-all" />
              </div>
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-[1.03]">
                {editandoId ? "Guardar cambios" : "Añadir tarea"}
              </button>
            </form>
          </section>
        </main>

        {/* Footer */}
        <footer className="w-screen bg-[#094297dc] py-3 md:py-4 text-center text-xs md:text-sm text-white relative z-10">
          <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
