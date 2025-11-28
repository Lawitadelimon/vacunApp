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
import { FaHome,  FaBars, FaTimes, FaBell } from "react-icons/fa";
import { db, auth } from "./firebase";
import cow2Image from "./assets/cows2.jpg";

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

interface Reporte {
  texto: string;
}

interface Notificacion {
  id: string;
  mensaje: string;
  para: string;
  leido: boolean;
  tareaId?: string;
  creadoEn: any;
  titulo?: string;
}

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
  const [workersConNotificaciones, setWorkersConNotificaciones] = useState<string[]>([]);
  

  // 🔹 Verificar autenticación
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

  // 🔹 Escuchar tareas
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
        where("estado", "in", ["realizada", "no realizada"]),
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

  // 🔹 Escuchar notificaciones (admin)
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

  // 🔹 Escuchar notificaciones (admin)
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

  useEffect(() => {
  if (rol !== "admin") return;

  const q = query(
    collection(db, "notificaciones"),
    where("para", "==", "admin"),
    where("leido", "==", false)
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => d.data());
    const workers = data
      .map((n) => n.de || n.deNombre) // ← Asegúrate que al crear la notificación guardes quién la envía (worker)
      .filter((id) => id); // eliminar nulos o undefined
    setWorkersConNotificaciones(workers);
  });

  return () => unsubscribe();
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
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${cow2Image})` }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-0" />

      {/* HEADER */}
      <header className="relative z-20 w-full py-3 px-4 md:px-6 flex justify-between items-center bg-amber-700 text-white shadow-lg">
        <h1 className="text-lg md:text-2xl font-extrabold">Notificaciones</h1>

        {/* Menú escritorio */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate("/home")}
            className="text-white hover:text-amber-500 transition"
          >
            <FaHome size={22} />
          </button>

          <div className="relative">
             <button
              onClick={() => setMenuNotificacionesOpen(!menuNotificacionesOpen)}
              className="relative text-white text-xl hover:text-amber-500 transition"
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

          <button
            onClick={handleLogout}
            className="bg-amber-600 hover:bg-amber-800 text-white font-semibold px-3 py-1 rounded-xl"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Menú móvil */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Menú desplegable móvil */}
        <div
          className={`absolute top-full right-0 bg-white/40 text-black w-48 rounded-b-2xl shadow-lg md:hidden flex flex-col items-center py-2 gap-2 transition-all duration-300 ${
            menuOpen ? "opacity-100 max-h-60" : "opacity-0 max-h-0"
          }`}
        >
          <button
            onClick={() => {
              navigate("/home");
              setMenuOpen(false);
            }}
            className="w-5/6 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 flex items-center justify-center gap-2 font-semibold"
          >
            <FaHome /> Inicio
          </button>

          <button
            onClick={() => {
              setMenuNotificacionesOpen(true);
              setMenuOpen(false);
            }}
            className="w-5/6 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 flex items-center justify-center gap-2 font-semibold"
          >
            <FaBell /> Notificaciones
          </button>

          

          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className="w-5/6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-semibold"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main className="relative z-10 flex-1 flex flex-col items-center w-full px-4 py-8 md:px-10 mb-16">
        {loading ? (
          <p className="text-center text-yellow-100">Cargando...</p>
        ) : rol === "worker" ? (
          // 🔹 Trabajador
          <div className="bg-[#FFF9E6]/10 backdrop-blur-md w-full max-w-3xl p-6 md:p-8 rounded-3xl border border-[#FFEB99]/30 shadow-2xl">
            <h2 className="text-3xl font-bold text-[#FFEB99] mb-6 flex items-center gap-2">
              📋 Mis tareas pendientes
            </h2>
            {tareas.length === 0 ? (
              <p className="text-center text-yellow-200 italic">
                No tienes tareas pendientes 🎉
              </p>
            ) : (
              <ul className="space-y-6">
                {tareas.map((t) => (
                  <li
                    key={t.id}
                    className="group p-4 md:p-6 rounded-3xl border border-[#FFEB99]/40 bg-amber-100 shadow-lg hover:shadow-[#FFEB99]/30 transition-all hover:scale-[1.02]"
                  >
                    <h3 className="font-bold text-black text-lg mb-2">
                      {t.titulo}
                    </h3>
                    {t.reporte && (
                      <div className="mt-2 bg-amber-600 p-3 rounded-xl text-sm text-black border border-[#FFEB99]/30">
                        📝 <strong>Reporte del trabajador:</strong>
                        <p className="mt-1 whitespace-pre-line">{t.reporte}</p>
                      </div>
                    )}

                    <textarea
                      value={reporte[t.id]?.texto || ""}
                      onChange={(e) =>
                        setReporte((prev) => ({
                          ...prev,
                          [t.id]: { texto: e.target.value },
                        }))
                      }
                      placeholder="Escribe tu reporte aquí..."
                      className="w-full p-2 rounded-md text-black text-md mb-3"
                    />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                          onClick={async () => {
                            await updateDoc(doc(db, "tareas", t.id), {
                              estado: "realizada",
                              completada: true,
                              reporte: reporte[t.id]?.texto || "Sin detalle",
                            });

                            const user = auth.currentUser;
                            const userSnap = await getDoc(doc(db, "users", user!.uid));
                            const userName = userSnap.exists() ? userSnap.data().name : "Trabajador";

                            await addDoc(collection(db, "notificaciones"), {
                              para: "admin",
                              de: user!.uid,          // 🔹 quién la envía
                              deNombre: userName,     // 🔹 nombre del trabajador
                              mensaje: `El trabajador completó la tarea "${t.titulo}".`,
                              tareaId: t.id,
                              leido: false,
                              creadoEn: serverTimestamp(),
                            });
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-xl text-sm font-semibold w-full sm:w-auto"
                        >
                          Completada ✅ 
                        </button>

                        <button
                          onClick={async () => {
                            await updateDoc(doc(db, "tareas", t.id), {
                              estado: "no realizada",
                              completada: false,
                              reporte: reporte[t.id]?.texto || "Sin detalle",
                            });

                            const user = auth.currentUser;
                            const userSnap = await getDoc(doc(db, "users", user!.uid));
                            const userName = userSnap.exists() ? userSnap.data().name : "Trabajador";

                            await addDoc(collection(db, "notificaciones"), {
                              para: "admin",
                              de: user!.uid,          // 🔹 quién la envía
                              deNombre: userName,     // 🔹 nombre del trabajador
                              mensaje: `El trabajador NO realizó la tarea "${t.titulo}".`,
                              tareaId: t.id,
                              leido: false,
                              creadoEn: serverTimestamp(),
                            });
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-xl text-sm font-semibold w-full sm:w-auto"
                        >
                          No realizada ❌ 
                        </button>

                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          // 🔹 Admin
          <div className="bg-[#FFF9E6]/10 backdrop-blur-md w-full max-w-5xl p-6 md:p-8 rounded-3xl border border-[#FFEB99]/30 shadow-2xl overflow-x-auto">
            <h2 className="text-3xl font-bold text-[#FFEB99] mb-6">
              📋 Tareas reportadas
            </h2>
            {Object.keys(tareasPorTrabajador).length === 0 ? (
              <p className="text-center text-yellow-200 italic">
                No hay tareas reportadas aún 🎉
              </p>
            ) : (
              Object.entries(tareasPorTrabajador).map(([workerId, workerTasks]) => (
                <div key={workerId} className="mb-8">
                                    <button
                      onClick={() => toggleWorker(workerId)}
                      className="w-full flex justify-between items-center px-5 py-3 bg-gradient-to-r from-[#B71C1C]/80 to-[#FFB300]/40 hover:from-[#B71C1C]/90 hover:to-[#FFB300]/50 transition rounded-t-2xl font-bold text-[#FFEB99] text-lg relative"
                    >
                      <div className="flex items-center gap-2">
                        👤 {workerId}
                        {workersConNotificaciones.includes(workerId) && (
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <span
                        className={`text-sm transform transition-transform ${
                          openWorkers[workerId] ? "rotate-180" : ""
                        }`}
                      >
                        ▼
                      </span>
                    </button>
                  {openWorkers[workerId] && (
                    <div className="bg-[#FFF9E6]/10 rounded-b-2xl overflow-hidden border border-[#FFEB99]/20">
                      <table className="w-full text-left border-collapse text-sm md:text-base">
                        <thead>
                          <tr className="bg-[#FFEB99]/20 text-[#FFEB99]">
                            <th className="px-4 py-2">Título</th>
                            <th className="px-4 py-2">Descripción</th>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Reporte</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workerTasks.map((t) => (
                            <tr
                              key={t.id}
                              className={`border-b border-[#FFEB99]/30 ${
                                t.estado === "no realizada"
                                  ? "bg-red-100/10"
                                  : "bg-green-100/10"
                              }`}
                            >
                              <td className="px-4 py-2 font-semibold text-[#FFEB99]">
                                {t.titulo}
                              </td>
                              <td className="px-4 py-2 text-gray-200">
                                {t.descripcion || "—"}
                              </td>
                              <td className="px-4 py-2 text-gray-300">
                                {t.fecha}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    t.estado === "no realizada"
                                      ? "bg-red-200 text-red-800"
                                      : "bg-green-200 text-green-800"
                                  }`}
                                >
                                  {t.estado === "no realizada"
                                    ? "❌ No realizada"
                                    : "✅ Completada"}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-gray-100 whitespace-pre-wrap">
                                {t.reporte || "Sin reporte"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      
    </div>
  );
}