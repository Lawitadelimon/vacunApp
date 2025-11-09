import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaBell,
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import cow2Image from "./assets/cows2.jpg";

interface Reporte {
  id?: string;
  titulo: string;
  categoria: string;
  trabajadorId: string;
  trabajadorNombre?: string;
  fecha: string;
  estado: "realizada" | "no realizada" | "pendiente";
  reporte: any;
  creadoEn: any;
}

interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  reporteId?: string; // Id del reporte asociado
  leido: boolean;
  creadoEn: any;
}

export default function Reportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"worker" | "admin" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hayNotificaciones, setHayNotificaciones] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [menuNotificacionesOpen, setMenuNotificacionesOpen] = useState(false);

  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>("");
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>("");

  const navigate = useNavigate();

  // 🔹 Autenticación
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = doc(db, "users", user.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists())
            setUserRole(snap.data().role as "worker" | "admin");
        });
        return () => unsubUser();
      }
    });
    return () => unsubAuth();
  }, []);

  // 🔹 Cargar notificaciones en tiempo real (solo admin)
  useEffect(() => {
    if (userRole !== "admin") return;
    const q = query(
      collection(db, "notificaciones"),
      where("para", "==", "admin"),
      orderBy("creadoEn", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Notificacion[];
      setNotificaciones(data);
      setHayNotificaciones(data.some((n) => !n.leido));
    });
    return () => unsub();
  }, [userRole]);

  // 🔹 Función para marcar notificación como leída y abrir reporte
  const abrirNotificacion = async (n: Notificacion) => {
    if (!n.leido) {
      await updateDoc(doc(db, "notificaciones", n.id), { leido: true });
    }
    if (n.reporteId) {
      navigate(`/reportes/${n.reporteId}`);
    }
    setMenuNotificacionesOpen(false);
  };

  
  useEffect(() => {
    if (!userId || !userRole) return;

    const reportesRef = collection(db, "reportes");
    const tareasRef = collection(db, "tareas");

    const qReportes =
      userRole === "worker"
        ? query(reportesRef, where("trabajadorId", "==", userId), orderBy("creadoEn", "desc"))
        : query(reportesRef, orderBy("creadoEn", "desc"));

    const qTareas =
      userRole === "worker"
        ? query(tareasRef, where("para", "==", userId), orderBy("fecha", "desc"))
        : query(tareasRef, orderBy("fecha", "desc"));

    const unsubReportes = onSnapshot(qReportes, (snap) => {
      const rpts = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Reporte));
      setReportes(rpts);
    });

    const unsubTareas = onSnapshot(qTareas, (snap) => {
      if (userRole !== "admin") return;
      const tareasConReporte = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((t: any) => t.reporte && t.reporte !== "")
        .map(
          (t: any) =>
            ({
              id: t.id,
              titulo: t.titulo,
              categoria: t.categoria,
              trabajadorId: t.para,
              trabajadorNombre: t.paraNombre,
              fecha: t.fecha,
              estado: t.estado || "pendiente",
              reporte: t.reporte,
              creadoEn: t.fecha,
            } as Reporte)
        );
      setReportes((prev) => [...prev, ...tareasConReporte]);
    });

    return () => {
      unsubReportes();
      unsubTareas();
    };
  }, [userId, userRole]);

  const reportesFiltrados = reportes.filter((r) => {
    const cumpleCategoria = filtroCategoria === "todas" || r.categoria === filtroCategoria;
    let cumpleFecha = true;
    if (filtroFechaInicio) cumpleFecha = cumpleFecha && r.fecha >= filtroFechaInicio;
    if (filtroFechaFin) cumpleFecha = cumpleFecha && r.fecha <= filtroFechaFin;
    return cumpleCategoria && cumpleFecha;
  });

  const formatearReporteVisual = (r: any) => {
    if (!r) return <span className="italic text-gray-500">Sin reporte</span>;
    const entries = Object.entries(r).filter(([_, v]) => v && v.toString().trim() !== "");
    return entries.length === 0 ? (
      <span className="italic text-gray-500">Sin reporte</span>
    ) : (
      <ul className="list-disc list-inside space-y-1">
        {entries.map(([k, v]) => (
          <li key={k}>
            <strong className="capitalize">{k}:</strong> {v}
          </li>
        ))}
      </ul>
    );
  };

  const formatearFecha = (fecha: any) => {
    if (!fecha) return "Sin fecha";
    if (fecha.toDate) return fecha.toDate().toLocaleString();
    return new Date(fecha).toLocaleString();
  };

  const categorias = Array.from(new Set(reportes.map((r) => r.categoria)));

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-indigo-500 text-white relative overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cow2Image})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />
      {/* Header */}
<header className="w-screen py-3 px-4 md:py-4 md:px-6 flex justify-between items-center shadow-md bg-indigo-500 text-white relative z-20">
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
      {/* Contenido */}
      <main className="relative z-10 p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
          <h2 className="text-3xl font-extrabold text-yellow-300 drop-shadow-md flex items-center gap-3">
            📋 Reportes
            <span className="text-sm text-yellow-100 bg-yellow-500/20 px-3 py-1 rounded-full">
              {reportesFiltrados.length} encontrados
            </span>
          </h2>

          {userRole === "admin" && (
            <div className="flex flex-wrap gap-3 mb-6 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="p-2 rounded-lg bg-indigo-500 text-white border border-yellow-300/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
              >
                <option className="bg-gray-100 text-indigo-500" value="todas">
                  Todas las categorías
                </option>
                {categorias.map((c) => (
                  <option key={c} className="bg-white text-indigo-500" value={c}>{c}</option>
                ))}
              </select>

              <input type="date" value={filtroFechaInicio} onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="p-2 rounded-lg bg-black/40 bg-indigo-500 border border-yellow-300/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all" />

              <input type="date" value={filtroFechaFin} onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="p-2 rounded-lg bg-black/40 bg-indigo-500 border border-yellow-300/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all" />

              <button onClick={() => { setFiltroCategoria("todas"); setFiltroFechaInicio(""); setFiltroFechaFin(""); }}
                className="px-4 py-2 bg-yellow-400/80 hover:bg-yellow-600 text-black font-semibold rounded-lg shadow-md transition-all">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {reportesFiltrados.length === 0 ? (
          <p className="text-center text-lg text-yellow-100 italic mt-10">No hay reportes disponibles por el momento 🐄</p>
        ) : (
          <ul className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {reportesFiltrados.map((r) => {
              const esRealizada = r.estado === "realizada";
              const esNoRealizada = r.estado === "no realizada";
              const estadoColor = esRealizada
                ? "bg-green-500/20 text-green-200 border-green-400/40"
                : esNoRealizada
                ? "bg-red-500/20 text-red-200 border-red-400/40"
                : "bg-yellow-500/20 text-yellow-200 border-yellow-400/40";

              return (
                <li key={r.id} className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-indigo-600/40 to-indigo-400/30 border ${estadoColor} shadow-lg hover:shadow-2xl transition-all duration-300 backdrop-blur-md hover:scale-[1.03]`}>
                  <div className={`absolute left-0 top-0 h-full w-1.5 ${esRealizada ? "bg-green-400" : esNoRealizada ? "bg-red-400" : "bg-yellow-400"}`} />

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white">{r.titulo}</h3>
                    {esRealizada && <FaCheckCircle className="text-green-400 text-2xl" />}
                    {esNoRealizada && <FaTimesCircle className="text-red-400 text-2xl" />}
                  </div>

                  <div className="space-y-1 text-sm text-gray-100">
                    <div>🏷️ Categoría: <span className="font-semibold">{r.categoria}</span></div>
                    <div>📅 Fecha: <span>{r.fecha}</span></div>
                    {userRole === "admin" && (
                      <div>👷‍♂️ Trabajador: <span className="font-semibold text-yellow-300">{r.trabajadorNombre || r.trabajadorId}</span></div>
                    )}
                  </div>

                  <div className="mt-4 bg-black/30 rounded-xl p-4 text-sm text-gray-100 leading-relaxed border border-white/10 shadow-inner">
                    {formatearReporteVisual(r.reporte)}
                  </div>

                  <div className="text-xs text-gray-300 mt-3 italic text-right">⏰ Creado en: {formatearFecha(r.creadoEn)}</div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
