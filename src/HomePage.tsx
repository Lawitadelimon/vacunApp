import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome, FaPaw, FaClipboardList, FaBell, FaLeaf, FaStethoscope,
  FaBook, FaChevronLeft, FaChevronRight, FaVenusMars, FaUserPlus,
  FaBars, FaTimes
} from "react-icons/fa";
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
  { title: "Reproducción", to: "/reproduccion", icon: FaVenusMars, color: "bg-amber-400", hover: "hover:bg-amber-500", roles: ["admin"] },
  { title: "Alimentación", to: "/alimentacion", icon: FaLeaf, color: "bg-green-500", hover: "hover:bg-green-600", roles: ["admin"] },
  { title: "Salud", to: "/salud", icon: FaStethoscope, color: "bg-red-500", hover: "hover:bg-red-600", roles: ["admin"] },
  { title: "Reportes", to: "/reportes", icon: FaClipboardList, color: "bg-indigo-500", hover: "hover:bg-indigo-600", roles: ["admin", "worker"] },
  { title: "Tareas del personal", to: "/pendientes", icon: FaBook, color: "bg-yellow-500", hover: "hover:bg-yellow-600", roles: ["admin"] },
  { title: "Notificaciones", to: "/notificaciones", icon: FaBell, color: "bg-amber-700", hover: "hover:bg-amber-800", roles: ["admin", "worker"] },
];

export default function HomePage() {
  const [hayNotificaciones, setHayNotificaciones] = useState(false);
  const [usuariosPendientes, setUsuariosPendientes] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // 🔑 Crear usuario en Firestore si no existe
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) return;

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // 📌 Guardar con role: "pending"
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

  // 🔔 Cargar notificaciones
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

  // 👥 Escuchar usuarios en espera en tiempo real
  useEffect(() => {
    if (user?.role !== "admin") return;

    const q = query(collection(db, "users"), where("role", "==", "pending"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuariosPendientes(lista);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ Asignar rol
  const asignarRol = async (id: string, rol: "admin" | "worker") => {
    await updateDoc(doc(db, "users", id), { role: rol });
  };

  useEffect(() => {
    cargarNotificaciones();
  }, []);

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

      {/* Contenido */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row w-full">
        {/* Columna principal */}
        <div className="flex-1 flex flex-col items-center">
          {/* Header */}
          <header className="w-full py-3 px-4 md:py-4 md:px-6 flex justify-between items-center shadow-md bg-black/5 backdrop-blur-md text-white relative z-20">
            <h1 className="text-lg md:text-2xl font-extrabold">AniManager</h1>

            {}
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate("/home")} className="text-white hover:text-yellow-400 transition">
                <FaHome size={22} />
              </button>

              <Link to="/notificaciones" className="text-white text-xl relative">
                <FaBell />
                {hayNotificaciones && (
                  <span className="absolute -top-2 -right-2 text-lg animate-bounce">🐄</span>
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              >
                Cerrar sesión
              </button>
            </div>

            {}
            <button
              className="md:hidden text-white text-2xl"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>

            {}
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
                    <span className="absolute right-2 text-lg animate-bounce">🐄</span>
                  )}
                </Link>

                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-600"
                >
                  🚪 Cerrar sesión
                </button>
              </div>
            )}
          </header>

          {/* Bienvenida */}
          <div className="mt-4 md:mt-6 text-white text-center text-base md:text-xl max-w-2xl px-3">
            ¡Bienvenido {user?.name || "a AniManager"}! Explora las opciones disponibles en el carrusel.
          </div>

          {/* Carrusel */}
          <div className="relative w-full max-w-4xl mt-6 md:mt-10 flex-1 px-4 md:px-6">
            {/* Botón scroll left */}
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
                      <card.icon size={50} className="md:size-30" />
                      <p className="mt-2 text-xs md:text-sm text-center">
                        {card.title}
                      </p>
                    </Link>
                  )
              )}

              {/* 👉 Tarjeta de Usuarios solo admin */}
              {user?.role === "admin" && (
                <Link
                  to="/usuarios"
                  className="min-w-[12rem] md:min-w-[15rem] h-56 md:h-80 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0 text-white font-bold bg-purple-500 hover:bg-purple-600"
                >
                  <FaUserPlus size={50} className="md:size-30" />
                  <p className="mt-2 text-xs md:text-sm text-center">Usuarios (Workers)</p>
                </Link>
              )}
            </div>

            {/* Botón scroll right */}
            <button
              onClick={() => scroll("right")}
              className="absolute -right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 hidden md:flex"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Columna derecha: usuarios pendientes */}
        {user?.role === "admin" && (
          <aside className="w-full md:w-72 bg-white/10 backdrop-blur-md text-white p-4 border-t md:border-t-0 md:border-l border-white/30">
            <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
              <FaUserPlus /> Usuarios en espera
            </h2>
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
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded"
                      >
                        Worker
                      </button>
                      <button
                        onClick={() => asignarRol(u.id, "admin")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded"
                      >
                        Admin
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#094297dc] py-3 md:py-4 text-center text-xs md:text-sm text-white relative z-10">
        <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
//Ya es responsiv