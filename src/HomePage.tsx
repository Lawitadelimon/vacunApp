import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome, FaPaw, FaClipboardList, FaBell, FaLeaf, FaStethoscope,
  FaBook, FaChevronLeft, FaChevronRight, FaVenusMars, FaUserPlus
} from "react-icons/fa";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import {
  collection, query, where, updateDoc, doc,
  onSnapshot, getDocs
} from "firebase/firestore";
import cowImage from "./assets/cows.jpg";
import { useUser } from "./UserContext";

const cards = [
  { title: "Registros de animales", to: "/animales", icon: FaPaw, color: "bg-teal-500", hover: "hover:bg-teal-600", roles: ["admin", "worker"] },
  { title: "Reproducción", to: "/reproduccion", icon: FaVenusMars, color: "bg-amber-400", hover: "hover:bg-amber-500", roles: ["admin", "worker"] },
  { title: "Alimentación", to: "/alimentacion", icon: FaLeaf, color: "bg-green-500", hover: "hover:bg-green-600", roles: ["admin", "worker"] },
  { title: "Salud", to: "/salud", icon: FaStethoscope, color: "bg-red-500", hover: "hover:bg-red-600", roles: ["admin", "worker"] },
  { title: "Reportes", to: "/reportes", icon: FaClipboardList, color: "bg-indigo-500", hover: "hover:bg-indigo-600", roles: ["admin"] },
  { title: "Tareas del personal", to: "/pendientes", icon: FaBook, color: "bg-yellow-500", hover: "hover:bg-yellow-600", roles: ["admin", "worker"] },
];

export default function HomePage() {
  const [hayNotificaciones, setHayNotificaciones] = useState(false);
  const [usuariosPendientes, setUsuariosPendientes] = useState<any[]>([]);
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

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

    const q = query(collection(db, "users"), where("role", "==", ""));
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
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${cowImage})` }} />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[3px]" />

      {/* Contenido */}
      <div className="relative z-10 flex-1 flex w-full">
        {/* Columna principal */}
        <div className="flex-1 flex flex-col items-center">
          {/* Header */}
          <header className="w-full py-4 px-6 flex justify-between items-center shadow-md">
            <button onClick={() => navigate("/home")} className="text-white">
              <FaHome size={24} />
            </button>
            <h1 className="text-white text-2xl font-extrabold">
              AniManager - {user?.name || "Usuario"}
            </h1>
            <div className="flex items-center gap-4">
              <Link to="/notificaciones" className="text-white text-2xl relative">
                <FaBell />
                {hayNotificaciones && <span className="absolute -top-2 -right-2 text-xl animate-bounce">🐄</span>}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Cerrar sesión
              </button>
            </div>
          </header>

          {/* Bienvenida */}
          <div className="mt-6 text-white text-center text-xl max-w-2xl">
            ¡Bienvenido {user?.name || "a AniManager"}! Explora las opciones disponibles en el carrusel.
          </div>

          {/* Carrusel */}
          <div className="relative w-full max-w-4xl mt-10 flex-1 px-6">
            <button
              onClick={() => scroll("left")}
              className="absolute -left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20"
            >
              <FaChevronLeft />
            </button>

            <div
              ref={carouselRef}
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
            >
              {cards.map((card, idx) =>
                card.roles.includes(user?.role || "") && (
                  <Link
                    key={idx}
                    to={card.to}
                    className={`min-w-[15rem] h-80 rounded-2xl shadow-lg flex flex-col items-center justify-center flex-shrink-0 text-white font-bold transform transition-all duration-300 ${card.color} ${card.hover} bg-opacity-70 backdrop-blur-sm hover:-translate-y-2 hover:shadow-2xl`}
                  >
                    <card.icon size={60} />
                    <p className="mt-2 text-sm text-center">{card.title}</p>
                  </Link>
                )
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

        {/* Columna derecha: usuarios pendientes */}
        {user?.role === "admin" && (
          <aside className="w-72 bg-white/10 backdrop-blur-md text-white p-4 border-l border-white/30">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaUserPlus /> Usuarios en espera
            </h2>
            {usuariosPendientes.length === 0 ? (
              <p className="text-sm text-gray-200">No hay usuarios en espera</p>
            ) : (
              <ul className="space-y-3">
                {usuariosPendientes.map((u) => (
                  <li key={u.id} className="bg-white/20 rounded-lg p-3 flex flex-col">
                    <span className="font-semibold">{u.name}</span>
                    <span className="text-xs text-gray-200">{u.email}</span>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => asignarRol(u.id, "worker")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded"
                      >
                        Asignar Worker
                      </button>
                      <button
                        onClick={() => asignarRol(u.id, "admin")}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded"
                      >
                        Asignar Admin
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
      <footer className="w-full bg-[#094297dc] py-4 text-center text-white relative z-10">
        <p>© 2025 AniManager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
