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
  const [numNotificaciones, setNumNotificaciones] = useState(0);
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


// 🔹 Escuchar notificaciones en tiempo real
useEffect(() => {
  if (!user) return; // Espera a que cargue el contexto
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  
  const q = query(
    collection(db, "notificaciones"),
    where("para", "==", user.role === "admin" ? "admin" : currentUser.uid)
  );

  const unsubscribe = onSnapshot(q, (snap) => {
    const data = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
    const noLeidas = data.filter((n: any) => !n.leido);
    setHayNotificaciones(noLeidas.length > 0);
    setNumNotificaciones(noLeidas.length);
  });

  return () => unsubscribe();
}, [user]);


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

            {/* Desktop: íconos fijos */}
  <div className="hidden md:flex items-center gap-4">
    <button onClick={() => navigate("/home")} className="hover:text-blue-500 transition">
      <FaHome size={22} />
    </button>

   <Link
  to="/notificaciones"
  className="relative hover:text-blue-500 transition"
>
  <FaBell size={22} />
  {hayNotificaciones && (
    <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white animate-pulse">
      {numNotificaciones > 9 ? "9+" : numNotificaciones}
    </span>
  )}
</Link>



    <button
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-xl transition"
    >
      Cerrar sesión
    </button>
  </div>

  {/* Mobile: 3 líneas */}
  <div className="md:hidden relative">
    <button
      className="text-white text-2xl focus:outline-none"
      onClick={() => setMenuOpen(!menuOpen)}
    >
      {menuOpen ? <FaTimes /> : <FaBars />}
    </button>

    {/* Menú desplegable mobile */}
    {menuOpen && (
      <div className="absolute right-0 mt-2 w-48 bg-white/40 backdrop-blur-md rounded-xl shadow-lg py-3 flex flex-col items-center gap-2 z-50">
        <button
          onClick={() => { navigate("/home"); setMenuOpen(false); }}
          className="w-5/7 py-2 rounded-xl bg-blue-400 hover:bg-blue-500  text-black flex items-center font-semibold justify-center gap-2"
        >
          <FaHome /> Inicio
        </button>

        <Link
  to="/notificaciones"
  onClick={() => setMenuOpen(false)}
  className="relative w-5/7 py-2 rounded-xl bg-blue-400 hover:bg-blue-500 text-black flex items-center font-semibold justify-center gap-2"
>
  <FaBell /> Notificaciones
  {hayNotificaciones && (
    <span className="absolute top-1 right-5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white animate-pulse">
      {numNotificaciones > 9 ? "9+" : numNotificaciones}
    </span>
  )}
</Link>


        <button
          onClick={() => { handleLogout(); setMenuOpen(false); }}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-xl"
        >
          Cerrar sesión
        </button>
      </div>
    )}
  </div>
</header>

          {/* Bienvenida */}
          <div className="mt-5 md:mt-9 text-white text-center font-semibold md:text-xl max-w-2xl px-5">
            ¡Bienvenido a AniManager {user?.name || ""}! 
          </div>

            {/* Botón scroll izquierdo */}
            <button
              onClick={() => scroll("left")}
              className="absolute -left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 hidden md:flex"
            >
              <FaChevronLeft />
            </button>
            

          {/* Bloque móvil: grid 2 columnas */}
<div className="md:hidden flex-1 overflow-y-auto pt-6 pb-6 px-3">
  <div className="grid grid-cols-2 gap-4 justify-center">
    {cards.map(
      (card, idx) =>
        card.roles.includes(user?.role || "") && (
          <Link
            key={idx}
            to={card.to}
            className={`w-full h-56 sm:h-64 rounded-2xl shadow-lg flex flex-col items-center justify-center text-white font-bold transform transition-all duration-300 
              ${card.color} ${card.hover} bg-opacity-70 backdrop-blur-sm
              hover:-translate-y-1 hover:shadow-xl
              active:translate-y-0.5 active:shadow-2xl`}
          >
            <card.icon size={60} />
            <p className="mt-2 text-sm text-center px-2">{card.title}</p>
          </Link>
        )
    )}

    {user?.role === "admin" && (
      <Link
        to="/usuarios"
        className={`w-full h-56 sm:h-64 rounded-2xl shadow-lg flex flex-col items-center justify-center text-white font-bold 
          bg-purple-500 hover:bg-purple-600 transform transition-all duration-300
          hover:-translate-y-1 hover:shadow-xl active:translate-y-0.5 active:shadow-2xl`}
      >
        <FaUserPlus size={60} />
        <p className="mt-2 text-sm text-center px-2">Usuarios (Workers)</p>
      </Link>
    )}
  </div>
</div>

{/* Bloque desktop: carrusel */}
<div className="hidden md:flex relative w-full max-w-4xl mt-6 md:mt-10 flex-1 px-4 md:px-6 transition-all duration-500">
  <button
    onClick={() => scroll("left")}
    className="absolute -left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20"
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
            className={`min-w-[15rem] h-80 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0 text-white font-bold transform transition-all duration-300 ${card.color} ${card.hover} bg-opacity-70 backdrop-blur-sm hover:-translate-y-2 hover:shadow-2xl`}
          >
            <card.icon size={120} />
            <p className="mt-3 text-md text-center">{card.title}</p>
          </Link>
        )
    )}

    {user?.role === "admin" && (
      <Link
        to="/usuarios"
        className="min-w-[15rem] h-80 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0 text-white font-bold bg-purple-500 hover:bg-purple-600"
      >
        <FaUserPlus size={120} />
        <p className="mt-3 text-md text-center">Usuarios (Workers)</p>
      </Link>
    )}
  </div>

  <button
    onClick={() => scroll("right")}
    className="absolute -right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20"
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
