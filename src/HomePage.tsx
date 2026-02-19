// === HomePage.tsx ===
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome, FaPaw, FaClipboardList, FaBell, FaLeaf, FaStethoscope,
  FaBook, FaChevronLeft, FaChevronRight, FaVenusMars, FaUserPlus,
  FaBars, FaTimes
} from "react-icons/fa";
import { GiBabyBottle } from "react-icons/gi";
import { BsFileEarmarkBarGraph } from "react-icons/bs";

import { auth, db } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, updateDoc, doc,
  onSnapshot, setDoc, getDoc
} from "firebase/firestore";

import cowImage from "./assets/cows.jpg";
import { useUser } from "./UserContext";

const cards = [
  { title: "Registros de animales", to: "/animales", icon: FaPaw, color: "bg-teal-500", hover: "hover:bg-teal-600", roles: ["admin"] },
  { title: "Nacidos en el rancho", to: "/nacimientos", icon: GiBabyBottle, color: "bg-pink-500", hover: "hover:bg-pink-600", roles: ["admin"] },
  { title: "Reproducción", to: "/reproduccion", icon: FaVenusMars, color: "bg-amber-400", hover: "hover:bg-amber-500", roles: ["admin"] },
  { title: "Alimentación y Salud", to: "/alimentacion", icon: FaLeaf, color: "bg-green-500", hover: "hover:bg-green-600", roles: ["admin"] },
  { title: "Vacunas", to: "/salud", icon: FaStethoscope, color: "bg-red-500", hover: "hover:bg-red-600", roles: ["admin"] },
  { title: "Estadísticas decesos", to: "/estadisticas", icon: BsFileEarmarkBarGraph, color: "bg-orange-500", hover: "hover:bg-orange-600", roles: ["admin"] },
  { title: "Reportes de tareas", to: "/reportes", icon: FaClipboardList, color: "bg-indigo-500", hover: "hover:bg-indigo-600", roles: ["admin", "worker"] },
  { title: "Notificaciones", to: "/notificaciones", icon: FaBell, color: "bg-amber-700", hover: "hover:bg-amber-800", roles: ["admin", "worker"] },
  { title: "Tareas del personal", to: "/pendientes", icon: FaBook, color: "bg-blue-500", hover: "hover:bg-blue-600", roles: ["admin"] },
];

export default function HomePage() {
  const [hayNotificaciones, setHayNotificaciones] = useState(false);
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [usuariosPendientes, setUsuariosPendientes] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mostrarUsuarios, setMostrarUsuarios] = useState(window.innerWidth >= 768);

  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // 🔔 Escuchar notificaciones en tiempo real
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notificaciones"),
      where("para", "==", user.role === "admin" ? "admin" : user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotificaciones(data);
      // Solo contar las no leídas
      setHayNotificaciones(data.filter(n => !n.leido).length > 0);
    });

    return () => unsubscribe();
  }, [user]);

    return () => unsub();
  }, [user]);

  // ==============================
  // LISTENER DE USUARIOS PENDIENTES (ADMIN)
  // ==============================
  useEffect(() => {
    if (user?.role !== "admin") return;

    const q = query(collection(db, "users"), where("role", "==", "pending"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuariosPendientes(lista);
    });

    return () => unsubscribe();
  }, [user]);

  const asignarRol = async (id: string, rol: "admin" | "worker") => {
    await updateDoc(doc(db, "users", id), { role: rol });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const amount = 200;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">

      {/* FONDO */}
      <div className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cowImage})` }} />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[3px]" />

      {/* Contenido */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row w-full">
        <div className="flex-1 flex flex-col items-center">
          {/* Header */}
          <header className="w-full py-3 px-4 md:py-4 md:px-6 flex justify-between items-center shadow-md bg-black/5 backdrop-blur-md text-white relative z-20">
            <h1 className="text-lg md:text-2xl font-extrabold">AniManager</h1>

            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate("/home")}><FaHome size={22} /></button>

              <Link to="/notificaciones" className="relative">
                <FaBell size={22} />
                {hayNotificaciones && (
                  <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                )}
              </Link>

              <button onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-xl">
                Cerrar sesión
              </button>
            </div>

            <button
              className="md:hidden text-white text-2xl"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>

            {menuOpen && (
              <div className="absolute top-full right-2 mt-2 w-48 bg-black/90 backdrop-blur-md rounded-lg shadow-lg flex flex-col p-3 space-y-2 md:hidden">
                <button
                  onClick={() => { navigate("/home"); setMenuOpen(false); }}
                  className="flex items-center gap-2 text-white hover:text-gray-300"
                >
                  <FaHome /> Inicio
                </button>

                <Link
                  to="/notificaciones"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 text-white hover:text-gray-300 relative"
                >
                  <FaBell /> Notificaciones
                  {hayNotificaciones && (
                    <span className="absolute right-2 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  )}
                </Link>

                  <Link to="/notificaciones" onClick={() => setMenuOpen(false)}
                    className="relative w-full py-2 bg-blue-400 rounded-xl text-black font-semibold flex gap-2 justify-center">
                    <FaBell /> Notificaciones

                    {hayNotificaciones && (
                      <span className="absolute right-4 top-1 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex justify-center items-center">
                        {numNotificaciones > 9 ? "9+" : numNotificaciones}
                      </span>
                    )}
                  </Link>

                  <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="bg-red-600 text-white px-3 py-1 rounded-xl w-full mt-2">
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* BIENVENIDA */}
          <div className="mt-5 text-white text-center font-semibold md:text-xl">
            ¡Bienvenido a AniManager {user?.name}!
          </div>

          {/* Carrusel */}
          <div className="relative w-full max-w-4xl mt-6 md:mt-10 flex-1 px-4 md:px-6">
            <button
              onClick={() => scroll("left")}
              className="absolute -left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 hidden md:flex"
            >
              <FaChevronLeft />
            </button>

            <div ref={carouselRef} className="flex gap-6 overflow-x-auto scroll-smooth pb-4">
              {cards.map(
                (card, i) =>
                  card.roles.includes(user?.role || "") && (
                    <Link key={i} to={card.to}
                      className={`min-w-[15rem] h-80 rounded-2xl shadow-lg text-white flex flex-col items-center justify-center ${card.color}`}>
                      <card.icon size={120} />
                      <p className="mt-3 text-md">{card.title}</p>
                    </Link>
                  )
              )}

              {user?.role === "admin" && (
                <Link to="/usuarios"
                  className="min-w-[15rem] h-80 rounded-2xl shadow-lg bg-purple-500 text-white flex flex-col items-center justify-center">
                  <FaUserPlus size={120} />
                  <p className="mt-3 text-md">Usuarios</p>
                </Link>
              )}
            </div>

            <button
              onClick={() => scroll("right")}
              className="absolute -right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 hidden md:flex"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* PANEL DE USUARIOS (ADMIN) */}
        {user?.role === "admin" && (
          <aside className={`transition-all duration-500 ${mostrarUsuarios ? "fixed inset-0 md:relative md:w-72 p-4" : "fixed left-full md:w-0"} bg-white/20 backdrop-blur-md text-white`}>
            {mostrarUsuarios && (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <FaUserPlus /> Usuarios en espera
                  </h2>
                  <button onClick={() => setMostrarUsuarios(false)}
                    className="bg-white/40 px-2 py-1 rounded-xl">
                    Ocultar
                  </button>
                </div>

                {usuariosPendientes.length === 0 ? (
                  <p className="text-gray-200">No hay usuarios en espera</p>
                ) : (
                  <ul className="space-y-3">
                    {usuariosPendientes.map((u) => (
                      <li key={u.id} className="bg-white/20 rounded-lg p-3">
                        <span className="font-semibold">{u.name}</span>
                        <span className="text-xs text-gray-200">{u.email}</span>

                        <div className="flex gap-2 mt-2">
                          <button onClick={() => asignarRol(u.id, "worker")}
                            className="flex-1 bg-green-600 py-1 rounded-xl text-white text-xs">
                            Worker
                          </button>
                          <button onClick={() => asignarRol(u.id, "admin")}
                            className="flex-1 bg-blue-600 py-1 rounded-xl text-white text-xs">
                            Admin
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </aside>
        )}
      </div>

      <footer className="w-full bg-[#094297dc] py-3 md:py-4 text-center text-xs md:text-sm text-white relative z-10">
        <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

