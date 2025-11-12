import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  FaCheckCircle,
  FaTimesCircle,
  
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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
  creadoEn?: any;
}


export default function Reportes() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"worker" | "admin" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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

  

  // 🔹 Cargar reportes y tareas
  useEffect(() => {
    if (!userId || !userRole) return;

    const reportesRef = collection(db, "reportes");
    const tareasRef = collection(db, "tareas");

    let qReportes;
    let qTareas;

    if (userRole === "worker") {
      qReportes = query(
        reportesRef,
        where("trabajadorId", "==", userId),
        orderBy("creadoEn", "desc")
      );
      qTareas = query(
        tareasRef,
        where("para", "==", userId),
        orderBy("fecha", "desc")
      );
    } else {
      qReportes = query(reportesRef, orderBy("creadoEn", "desc"));
      qTareas = query(tareasRef, orderBy("fecha", "desc"));
    }

    const unsubReportes = onSnapshot(qReportes, (snap) => {
      const rpts = snap.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Reporte)
      );
      setReportes(rpts);
    });

    const unsubTareas = onSnapshot(qTareas, (snap) => {
      const tareasData = snap.docs.map((doc) => {
        const t = doc.data();
        return {
          id: doc.id,
          titulo: t.titulo,
          categoria: t.categoria,
          trabajadorId: t.para,
          trabajadorNombre: t.paraNombre,
          fecha: t.fecha,
          estado: t.estado || "pendiente",
          reporte: t.reporte || "",
          creadoEn: t.fecha,
        } as Reporte;
      });

      setReportes((prev) => {
        const idsPrev = new Set(prev.map((r) => r.id));
        const nuevasTareas = tareasData.filter((t) => !idsPrev.has(t.id));
        return [...prev, ...nuevasTareas];
      });
    });

    return () => {
      unsubReportes();
      unsubTareas();
    };
  }, [userId, userRole]);

  // 🔹 Filtrado
  const reportesFiltrados = reportes.filter((r) => {
    const cumpleCategoria =
      filtroCategoria === "todas" || r.categoria === filtroCategoria;
    let cumpleFecha = true;
    if (filtroFechaInicio) cumpleFecha = cumpleFecha && r.fecha >= filtroFechaInicio;
    if (filtroFechaFin) cumpleFecha = cumpleFecha && r.fecha <= filtroFechaFin;
    return cumpleCategoria && cumpleFecha;
  });

  // 🔹 Utilidades
  const formatearReporteVisual = (r: any) => {
    if (!r || (typeof r === "string" && r.trim() === "")) {
      return <span className="italic text-gray-500">Sin reporte</span>;
    }

    if (typeof r === "string") {
      const texto = r.trim();
      if (texto.includes("\n") || texto.includes("-")) {
        const lineas = texto
          .split(/\r?\n|-/)
          .map((l) => l.trim())
          .filter((l) => l !== "");
        return (
          <ul className="list-disc list-inside space-y-1">
            {lineas.map((linea, idx) => (
              <li key={idx}>{linea}</li>
            ))}
          </ul>
        );
      }
      return <div className="whitespace-pre-line">{texto}</div>;
    }

    const entries = Object.entries(r).filter(
      ([_, v]) => v && v.toString().trim() !== ""
    );
    return entries.length === 0 ? (
      <span className="italic text-gray-500">Sin reporte</span>
    ) : (
      <ul className="list-disc list-inside space-y-1">
        {entries.map(([k, v]) => (
          <li key={k}>
            <strong className="capitalize">{k}:</strong> {String(v)}
          </li>
        ))}
      </ul>
    );
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
      <header className="w-screen py-3 px-4 md:py-4 md:px-6 flex justify-between items-center shadow-md bg-indigo-500 text-black relative z-20">
        <h1 className="text-xl md:text-2xl font-extrabold">
          Reportes de tareas
        </h1>

        {/* 🔹 Visible solo en escritorio */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => navigate("/home")}
            className="hover:text-indigo-300 transition"
          >
            <FaHome size={20} />
          </button>
         
          <button
            onClick={handleLogout}
            className="bg-indigo-600 text-black font-semibold px-3 py-1 rounded-xl hover:bg-indigo-300"
          >
            Cerrar sesión
          </button>
        </div>

        {/* 🔹 Menú hamburguesa solo móvil */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden hover:text-indigo-300"
        >
          {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        {/* 🔹 Menú desplegable móvil */}
        <div
          className={`absolute top-full right-0 bg-white/40 text-black w-52 rounded-b-2xl shadow-lg md:hidden flex flex-col items-center py-2 gap-2 transition-all duration-300 ${
            menuOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <button
            onClick={() => {
              navigate("/home");
              setMenuOpen(false);
            }}
            className="w-5/6 py-2 rounded-lg bg-indigo-400 hover:bg-indigo-500 flex items-center font-semibold justify-center gap-2"
          >
            <FaHome /> Inicio
          </button>
          
          <button
            onClick={() => {
              handleLogout();
              setMenuOpen(false);
            }}
            className="w-5/6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center font-semibold justify-center gap-2"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 p-6 md:p-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
          <h2 className="text-xl font-extrabold text-yellow-500 drop-shadow-md flex items-center gap-3">
            Reportes de trabajadores📋 
            <span className="text-sm text-yellow-100 bg-yellow-500/20 px-3 py-1 rounded-full">
              {reportesFiltrados.length} encontrados
            </span>
          </h2>

          {userRole === "admin" && (
            <div className="flex flex-wrap gap-3 mb-6 bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20">
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="p-2 rounded-xl font-semibold bg-indigo-500 text-white border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
              >
                <option value="todas">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c} value={c} className="   text-whithe ">
                    {c}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="p-2 rounded-xl bg-indigo-500 border border-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all text-white font-semibold"
              />

              <button
                onClick={() => {
                  setFiltroCategoria("todas");
                  setFiltroFechaInicio("");
                  setFiltroFechaFin("");
                }}
                className="px-4 py-2 bg-yellow-400/80 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-md transition-all"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {reportesFiltrados.length === 0 ? (
          <p className="text-center text-lg text-yellow-100 italic mt-10">
            No hay reportes disponibles por el momento 🐄
          </p>
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
                <li
                  key={r.id}
                  className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-indigo-600/40 to-indigo-400/30 border ${estadoColor} shadow-lg hover:shadow-2xl transition-all duration-300 backdrop-blur-md hover:scale-[1.03]`}
                >
                  <div
                    className={`absolute left-0 top-0 h-full w-1.5 ${
                      esRealizada
                        ? "bg-green-400"
                        : esNoRealizada
                        ? "bg-red-400"
                        : "bg-yellow-400"
                    }`}
                  />

                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white">{r.titulo}</h3>
                    {esRealizada && (
                      <FaCheckCircle className="text-green-400 text-2xl" />
                    )}
                    {esNoRealizada && (
                      <FaTimesCircle className="text-red-400 text-2xl" />
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-gray-100">
                    <div>
                      🏷️ Categoría:{" "}
                      <span className="font-semibold">{r.categoria}</span>
                    </div>
                    <div>
                      📅 Fecha: <span>{r.fecha}</span>
                    </div>
                    {userRole === "admin" && (
                      <div>
                        👷‍♂️ Trabajador:{" "}
                        <span className="font-semibold text-yellow-300">
                          {r.trabajadorNombre || r.trabajadorId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 bg-black/30 rounded-xl p-4 text-sm text-gray-100 leading-relaxed border border-white/10 shadow-inner">
                    {formatearReporteVisual(r.reporte)}
                  </div>

                  
                </li>
              );
            })}
          </ul>
        )}
      </main>

      
    </div>
  );
}
