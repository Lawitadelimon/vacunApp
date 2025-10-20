import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  where,
  addDoc,
  serverTimestamp,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaHome, FaBell, FaBars, FaTimes } from "react-icons/fa";
import { db, auth } from "./firebase";
import cow2Image from "./assets/cows2.jpg";

interface Tarea { /* ...igual que antes... */ }
interface Reporte { /* ...igual que antes... */ }
interface Notificacion { /* ...igual que antes... */ }

export default function Notificaciones() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [reporte, setReporte] = useState<{ [key: string]: Reporte }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuNotificacionesOpen, setMenuNotificacionesOpen] = useState(false);
  const [openWorkers, setOpenWorkers] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setRol(snap.data().role || "worker");
      } else {
        navigate("/");
      }
    });
    return () => unsub();
  }, [navigate]);

  // Tareas
  useEffect(() => {
    if (!rol || !userId) return;
    let q;
    if (rol === "worker") {
      q = query(
        collection(db, "tareas"),
        where("para", "==", userId),
        where("estado", "==", "pendiente"),
        orderBy("fecha", "desc")
      );
    } else if (rol === "admin") {
      q = query(
        collection(db, "tareas"),
        where("estado", "in", ["completada", "no realizada"]),
        orderBy("fecha", "desc")
      );
    }
    if (!q) return;

    const unsub = onSnapshot(q, (snap) => {
      setTareas(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tarea)));
      setLoading(false);
    });
    return () => unsub();
  }, [rol, userId]);

  // Notificaciones (admin)
  useEffect(() => {
    if (rol !== "admin") return;
    const q = query(
      collection(db, "notificaciones"),
      where("para", "==", "admin"),
      orderBy("creadoEn", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notificacion));
      setNotificaciones(data);
      setNotificacionesNoLeidas(data.filter((n) => !n.leido).length);
    });
    return () => unsub();
  }, [rol]);

  const toggleWorker = (workerId: string) =>
    setOpenWorkers((prev) => ({ ...prev, [workerId]: !prev[workerId] }));

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  const abrirNotificacion = async (n: Notificacion) => {
    if (!n.leido) {
      await updateDoc(doc(db, "notificaciones", n.id), { leido: true });
    }
    setMenuNotificacionesOpen(false);
  };

  const tareasPorTrabajador = tareas.reduce((acc: Record<string, Tarea[]>, t) => {
    const user = t.paraNombre || t.para || "Desconocido";
    if (!acc[user]) acc[user] = [];
    acc[user].push(t);
    return acc;
  }, {});

  return (
    <div className="relative min-h-screen flex flex-col text-white overflow-x-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url(${cow2Image})` }} />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0" />

      {/* HEADER */}
      <header className="relative z-20 w-full py-3 px-4 md:px-6 flex justify-between items-center bg-amber-700 text-black shadow-md">
        <h1 className="text-2xl font-extrabold">Panel de notificaciones</h1>

        {/* Menú desktop */}
        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="text-black hover:text-amber-600 transition">
            <FaHome size={22} />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuNotificacionesOpen(!menuNotificacionesOpen)}
              className="relative text-black text-xl hover:text-amber-600 transition"
            >
              <FaBell />
              {notificacionesNoLeidas > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {notificacionesNoLeidas}
                </span>
              )}
            </button>

            {menuNotificacionesOpen && (
              <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white text-gray-800 rounded-lg shadow-lg z-50">
                {notificaciones.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No hay notificaciones</p>
                ) : (
                  notificaciones.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b last:border-none cursor-pointer hover:bg-gray-100 transition ${
                        !n.leido ? "bg-yellow-100 font-semibold" : ""
                      }`}
                      onClick={() => abrirNotificacion(n)}
                    >
                      <p className="text-sm">{n.titulo}</p>
                      <p className="text-xs text-gray-500">{n.mensaje}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="bg-amber-600 hover:bg-amber-800 text-black font-semibold px-3 py-1 rounded-xl">
            Cerrar sesión
          </button>
        </div>

        {/* Menú hamburguesa móvil */}
<button
  className="md:hidden text-white text-2xl"
  onClick={() => setMenuOpen(!menuOpen)}
>
  {menuOpen ? <FaTimes /> : <FaBars />}
</button>

{menuOpen && (
  <div className="absolute top-full right-2 mt-2 w-56 bg-black/90 backdrop-blur-md rounded-lg shadow-lg flex flex-col p-3 space-y-2 z-50">

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
        onClick={() => setMenuNotificacionesOpen(!menuNotificacionesOpen)}
        className="flex items-center gap-2 text-white hover:text-gray-300 w-full"
      >
        <FaBell /> Notificaciones
        {notificacionesNoLeidas > 0 && (
          <span className="ml-1 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
            {notificacionesNoLeidas}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {menuNotificacionesOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 max-h-72 overflow-y-auto bg-white text-gray-800 rounded-lg shadow-lg z-50">
          {notificaciones.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No hay notificaciones</p>
          ) : (
            notificaciones.map((n) => (
              <div
                key={n.id}
                className={`p-3 border-b last:border-none cursor-pointer hover:bg-gray-100 transition ${
                  !n.leido ? "bg-yellow-100 font-semibold" : ""
                }`}
                onClick={async () => {
                  await updateDoc(doc(db, "notificaciones", n.id), { leido: true });
                  setMenuNotificacionesOpen(false);
                  setMenuOpen(false);
                }}
              >
                <p className="text-sm">{n.titulo}</p>
                <p className="text-xs text-gray-500">{n.mensaje}</p>
              </div>
            ))
          )}
        </div>
      )}
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

      {/* MAIN */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 py-8 md:px-10">
        {loading ? (
          <p className="text-center text-yellow-100">Cargando...</p>
        ) : rol === "worker" ? (
          <div className="bg-[#FFF9E6]/10 backdrop-blur-md w-full max-w-3xl p-6 md:p-8 rounded-3xl border border-[#FFEB99]/30 shadow-2xl shadow-[#B71C1C]/20">
            <h2 className="text-3xl font-bold text-[#FFEB99] mb-6 flex items-center gap-2 drop-shadow-md">📋 Mis tareas pendientes</h2>
            {tareas.length === 0 ? (
              <p className="text-center text-yellow-200 italic">No tienes tareas pendientes 🎉</p>
            ) : (
              <ul className="space-y-6">
                {tareas.map((t) => (
                  <li key={t.id} className="group p-4 md:p-6 rounded-3xl border border-[#FFEB99]/40 bg-[#FFF9E6]/10 shadow-lg hover:shadow-[#FFEB99]/30 transition-all duration-300 hover:scale-[1.02]">
                    <h3 className="font-bold text-[#FFEB99] text-lg mb-2 drop-shadow-sm">{t.titulo}</h3>
                    {t.descripcion && <p className="text-sm text-gray-200 mb-1">{t.descripcion}</p>}
                    {t.fecha && <p className="text-xs text-gray-300 mb-3">📅 {t.fecha}</p>}
                    <div className="mt-2">{/* renderCamposReporte(t) */}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="bg-[#FFF9E6]/10 backdrop-blur-md w-full max-w-4xl p-6 md:p-8 rounded-3xl border border-[#FFEB99]/30 shadow-2xl shadow-[#B71C1C]/20">
            <h2 className="text-3xl font-bold text-[#FFEB99] mb-6 drop-shadow-md">📋 Tareas reportadas</h2>
            {Object.keys(tareasPorTrabajador).length === 0 ? (
              <p className="text-center text-yellow-200 italic">No hay tareas reportadas aún 🎉</p>
            ) : (
              Object.entries(tareasPorTrabajador).map(([workerId, workerTasks]) => (
                <div key={workerId} className="mb-6 rounded-2xl overflow-hidden shadow-lg transition-transform transform hover:scale-[1.01] hover:shadow-xl">
                  <button
                    onClick={() => toggleWorker(workerId)}
                    className="w-full flex justify-between items-center px-5 py-3 bg-gradient-to-r from-[#B71C1C]/80 to-[#FFB300]/40 hover:from-[#B71C1C]/90 hover:to-[#FFB300]/50 transition-colors rounded-t-2xl font-bold text-[#FFEB99] text-lg drop-shadow-sm"
                  >
                    <span>👤 {workerId}</span>
                    <span className={`text-sm transform transition-transform duration-300 ${openWorkers[workerId] ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-500 ${openWorkers[workerId] ? "max-h-96 opacity-100 p-5" : "max-h-0 opacity-0 p-0"} bg-[#FFF9E6]/10`}>
                    <ul className="space-y-4 max-h-80 overflow-y-auto pr-2">
                      {workerTasks.map((t) => (
                        <li key={t.id} className={`p-4 rounded-xl border-l-4 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center transition-all duration-300 ${t.estado === "no realizada" ? "border-red-400 bg-red-100/20" : "border-green-400 bg-green-100/20"} hover:shadow-lg`}>
                          <div className="flex-1">
                            <h3 className="font-semibold text-[#FFEB99] text-lg mb-1">{t.titulo}</h3>
                            {t.descripcion && <p className="text-gray-200 text-sm mb-1">{t.descripcion}</p>}
                            {t.fecha && <p className="text-gray-300 text-xs">📅 {t.fecha}</p>}
                          </div>
                          <div className="mt-2 md:mt-0 flex items-center gap-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${t.estado === "no realizada" ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}>
                              {t.estado === "no realizada" ? "❌ No realizada" : "✅ Completada"}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
