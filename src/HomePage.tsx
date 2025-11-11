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
  onSnapshot, getDocs, setDoc, getDoc
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
  const [usuariosPendientes, setUsuariosPendientes] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mostrarUsuarios, setMostrarUsuarios] = useState(true);
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;
      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          name: currentUser.displayName || "Usuario",
          email: currentUser.email,
          role: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const cargarNotificaciones = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const q = query(collection(db, "tareas"), where("uid", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);
    const hoy = new Date().toISOString().split("T")[0];
    const pendientes = querySnapshot.docs
      .map(doc => doc.data())
      .filter((t: any) => t.fecha && t.fecha <= hoy && !t.completada);
    setHayNotificaciones(pendientes.length > 0);
  };

  useEffect(() => { cargarNotificaciones(); }, []);

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
      const scrollAmount = 200;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Fondo */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cowImage})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[3px]" />

      {/* Contenido principal */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row w-full transition-all duration-500">

        {/* Columna izquierda */}
        <div className={`flex flex-col items-center transition-all duration-500 ${mostrarUsuarios ? "md:flex-1" : "w-full"}`}>

          {/* Header */}
          <header className="w-full py-3 px-4 md:py-4 md:px-6 flex justify-between items-center shadow-md bg-black/5 backdrop-blur-md text-white relative z-20">
            <h1 className="text-lg md:text-2xl font-extrabold">AniManager</h1>

            {/* Botón menú (3 líneas) */}
            <div className="relative">
              <button
                className="text-white text-2xl focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <FaTimes /> : <FaBars />}
              </button>

              {/* Menú desplegable */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-md rounded-xl shadow-lg py-3 flex flex-col items-center gap-2 z-50 transition-all duration-300 animate-fadeIn">
              <button
                onClick={() => {
                  navigate("/home");
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 bg-blue-950 hover:bg-blue-700 font-semibold text-white hover:text-gray-300 w-full justify-center py-2 rounded-xl transition-all duration-300"
              >
                <FaHome /> Inicio
              </button>

              <Link
                to="/notificaciones"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 text-white w-full justify-center py-2 relative 
                          bg-blue-950 hover:bg-blue-700 font-semibold hover:text-white transition-all duration-300 rounded-xl"
              >
                <FaBell /> Notificaciones
                {hayNotificaciones && (
                  <span className="absolute right-4 -top-1 animate-bounce">🐄</span>
                )}
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-xl transition-all duration-300"
              >
                Cerrar sesión
              </button>
            </div>

              )}
            </div>
          </header>

          {/* Bienvenida */}
          <div className="mt-5 md:mt-9 text-white text-center font-semibold md:text-xl max-w-2xl px-5">
            ¡Bienvenido a AniManager {user?.name || ""}! Donde el bienestar de tus animales es primero. 
            Explora las opciones disponibles en el carrusel.
          </div>

          {/* Carrusel */}
          <div className="relative w-full max-w-4xl mt-6 md:mt-10 flex-1 px-4 md:px-6 transition-all duration-500">
            <button
              onClick={() => scroll("left")}
              className="absolute -left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 hidden md:flex"
            >
              <FaChevronLeft />
            </button>

            <div
              ref={carouselRef}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scroll-smooth"
            >
              {cards.map(
                (card, idx) =>
                  card.roles.includes(user?.role || "") && (
                    <Link
                      key={idx}
                      to={card.to}
                      className={`min-w-[12rem] md:min-w-[15rem] h-56 md:h-80 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0 text-white font-bold transform transition-all duration-300 ${card.color} ${card.hover} bg-opacity-70 backdrop-blur-sm hover:-translate-y-2 hover:shadow-2xl`}
                    >
                      <card.icon size={120} />
                      <p className="mt-3 text-md md:text-md text-center">{card.title}</p>
                    </Link>
                  )
              )}

              {user?.role === "admin" && (
                <Link
                  to="/usuarios"
                  className="min-w-[12rem] md:min-w-[15rem] h-56 md:h-80 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0 text-white font-bold bg-purple-500 hover:bg-purple-600"
                >
                  <FaUserPlus size={120} />
                  <p className="mt-3 text-md md:text-md text-center">Usuarios (Workers)</p>
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

        {/* Panel lateral de usuarios pendientes */}
        {user?.role === "admin" && (
          <aside className={`transition-all duration-500 ${mostrarUsuarios ? "w-full md:w-72 p-4" : "w-0 p-0 overflow-hidden"} 
            bg-white/10 backdrop-blur-md text-white border-t md:border-t-0 md:border-l border-white/30`}>
            {mostrarUsuarios && (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
                    <FaUserPlus /> Usuarios en espera
                  </h2>
                  <button
                    onClick={() => setMostrarUsuarios(false)}
                    className="text-sm md:text-base px-2 py-1 bg-white/40 rounded-xl hover:bg-white/30"
                  >
                    Ocultar
                  </button>
                </div>
                {usuariosPendientes.length === 0 ? (
                  <p className="text-sm text-gray-200">No hay usuarios en espera</p>
                ) : (
                  <ul className="space-y-3">
                    {usuariosPendientes.map((u) => (
                      <li key={u.id} className="bg-white/20 rounded-lg p-3 flex flex-col">
                        <span className="font-semibold text-sm md:text-base">{u.name}</span>
                        <span className="text-xs text-gray-200">{u.email}</span>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => asignarRol(u.id, "worker")}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded-xl"
                          >
                            Worker
                          </button>
                          <button
                            onClick={() => asignarRol(u.id, "admin")}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded-xl"
                          >
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

      {/* Botón para volver a mostrar usuarios */}
      {user?.role === "admin" && !mostrarUsuarios && (
        <button
          onClick={() => setMostrarUsuarios(true)}
          className="fixed top-20 right-2 md:right-4 bg-white/40 text-white px-3 py-1 rounded-xl hover:bg-white/30 z-50 transition-all duration-500"
        >
          Mostrar usuarios
        </button>
      )}

      <footer className="w-full bg-blue-900 py-3 md:py-4 text-center text-xs md:text-sm text-white fixed bottom-0 z-50">
        <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
