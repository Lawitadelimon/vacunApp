import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaPaw, FaClipboardList, FaBell, FaHeartbeat, FaLeaf, FaStethoscope, FaBook, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "./firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import cowImage from "./assets/cows.jpg";

export default function HomePage() {
  const [hayNotificaciones, setHayNotificaciones] = useState(false);
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);

  const cargarNotificaciones = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "tareas"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const hoy = new Date().toISOString().split("T")[0];

    const pendientes = querySnapshot.docs
      .map(doc => doc.data())
      .filter((t: any) => t.fecha && t.fecha <= hoy && !t.completada);

    setHayNotificaciones(pendientes.length > 0);
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
    <div className="relative min-h-screen flex flex-col items-center">
      {}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${cowImage})` }}
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-full flex flex-col items-center">
        {}
        <header className="w-full py-4 px-6 flex justify-between items-center shadow-md">
          <button onClick={() => navigate("/home")} className="text-white">
            <FaHome size={24} />
          </button>
          <h1 className="text-white text-2xl font-extrabold">AniManager</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded"
          >
            Cerrar sesión
          </button>
        </header>

        {}
        <div className="w-full max-w-lg mt-6 px-4">
          <input
            type="text"
            placeholder="Todas las categorías"
            className="w-full px-4 py-2 backgroundImage rounded-lg border focus:outline-none shadow-md"
          />
        </div>

        {}
        <div className="relative w-full max-w-4xl mt-10 px-6">
          {}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20"
          >
            <FaChevronLeft />
          </button>

          {}
          <div
                ref={carouselRef}
                style={{
                  scrollbarWidth: "none", 
                  msOverflowStyle: "none", 
                }}
                className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
              >
            <Link
              to="/animales"
              className="min-w-[15rem] h-79 bg-teal-500 hover:bg-teal-600 rounded-xl shadow-lg flex flex-col items-center justify-center text-white font-bold flex-shrink-0"
            >
              <FaPaw size={60} />
              <p className="mt-2 text-sm text-center">Registros de animales</p>
            </Link>

            <Link
              to="/reproduccion"
              className="min-w-[15rem] h-79 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-lg flex flex-col items-center justify-center text-white font-bold flex-shrink-0"
            >
              <FaHeartbeat size={60} />
              <p className="mt-2 text-sm text-center">Reproducción</p>
            </Link>

            <Link
              to="/alimentacion"
              className="min-w-[15rem] h-79 bg-green-500 hover:bg-green-600 rounded-xl shadow-lg flex flex-col items-center justify-center text-white font-bold flex-shrink-0"
            >
              <FaLeaf size={60} />
              <p className="mt-2 text-sm text-center">Alimentación</p>
            </Link>

            <Link
              to="/salud"
              className="min-w-[15rem] h-79 bg-red-500 hover:bg-red-600 rounded-xl shadow-lg flex flex-col items-center justify-center text-white font-bold flex-shrink-0"
            >
              <FaStethoscope size={60} />
              <p className="mt-2 text-sm text-center">Salud</p>
            </Link>

            <Link
              to="/reportes"
              className="min-w-[15rem] h-79 bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-lg flex flex-col items-center justify-center text-white font-bold flex-shrink-0"
            >
              <FaClipboardList size={60} />
              <p className="mt-2 text-sm text-center">Reportes</p>
            </Link>

            <Link
              to="/pendientes"
              className="min-w-[15rem] h-79 bg-yellow-500 hover:bg-yellow-600 rounded-xl shadow-lg flex flex-col items-center justify-center text-white font-bold flex-shrink-0"
            >
              <FaBook size={60} />
              <p className="mt-2 text-sm text-center">Tareas del personal</p>
            </Link>
          </div>

          {}
          <button
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20"
          >
            <FaChevronRight />
          </button>
        </div>

        {}
        <div className="relative mt-10">
          <Link
            to="/notificaciones"
            className="bg-amber-700 hover:bg-yellow-900 text-white font-bold py-2 px-6 rounded-xl shadow flex items-center justify-center gap-2"
          >
            <FaBell /> Notificaciones
          </Link>
          {hayNotificaciones && (
            <span className="absolute -top-3 -right-3 text-2xl animate-bounce">
              🐄
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
