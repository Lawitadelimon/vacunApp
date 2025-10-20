
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { getAuth, signOut } from "firebase/auth";
import { FaPlus, FaArrowLeft, FaHome, FaBell, FaTimes, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import cowsBackground from "./assets/cows2.jpg";

type Animal = {
  estado: string;
  id?: string;
  codigo: string;
  raza: string;
  sexo: "macho" | "hembra";
  fechaNacimiento: string;
  edad: string;
};

type VacunaGeneral = {
  id?: string;
  nombre: string;
  dosis: number;
  recordatorio: string;
};

type VacunaAsignada = {
  id?: string;
  vacunaId: string;
  dosisAplicadas: boolean[];
  fechasAplicacion: string[];
};

type Lote = {
  id: string;
  nombre: string;
};

export default function Salud() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(null);
  const [vacunasGenerales, setVacunasGenerales] = useState<VacunaGeneral[]>([]);
  const [vacunasAnimal, setVacunasAnimal] = useState<
    (VacunaGeneral & {
      asignada: boolean;
      asignacionId?: string;
      dosisAplicadas: boolean[];
      fechasAplicacion: string[];
    })[]
  >([]);
  const [vacunasPorAnimal, setVacunasPorAnimal] = useState<{
    [animalId: string]: (VacunaGeneral & {
      asignada: boolean;
      dosisAplicadas: boolean[];
    })[];
  }>({});

  const [nuevaVacunaGeneral, setNuevaVacunaGeneral] = useState<VacunaGeneral>({
    nombre: "",
    dosis: 1,
    recordatorio: "",
  });

  // Filtros y contadores
  const [filtroVacunas, setFiltroVacunas] = useState<"todos" | "completos" | "incompletos" | "sinAsignar">("todos");
  const [totalCompletos, setTotalCompletos] = useState(0);
  const [totalIncompletos, setTotalIncompletos] = useState(0);
  const [totalSinAsignar, setTotalSinAsignar] = useState(0);

  const [menuAbierto, setMenuAbierto] = useState(false);
  
    const handleLogout = async () => {
      await signOut(auth);
      navigate("/");
    };

  const inputClasses = "border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500";

  // 🔹 Cargar lotes
  const cargarLotes = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "lotes"), where("uid", "==", user.uid));
    const snaps = await getDocs(q);
    const listaLotes: Lote[] = snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    }));
    setLotes(listaLotes);
    if (listaLotes.length > 0 && !loteSeleccionado) setLoteSeleccionado(listaLotes[0]);
  };

  useEffect(() => {
    cargarLotes();
  }, []);

  // 🔹 Escuchar animales por lote
  useEffect(() => {
    if (!loteSeleccionado) return;
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "lotes", loteSeleccionado.id, "animales"),
      where("uid", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const lista: Animal[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Animal),
      }));
      setAnimales(lista);
      if (animalSeleccionado && !lista.find((a) => a.id === animalSeleccionado.id)) {
        setAnimalSeleccionado(null);
      }
    });

    return () => unsub();
  }, [loteSeleccionado]);

  // 🔹 Escuchar vacunas generales por lote
  useEffect(() => {
    if (!loteSeleccionado) return;

    const unsub = onSnapshot(
      collection(db, "lotes", loteSeleccionado.id, "vacunasGenerales"),
      (snapshot) => {
        const lista = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as VacunaGeneral),
        }));
        setVacunasGenerales(lista);
      }
    );

    return () => unsub();
  }, [loteSeleccionado]);

  // 🔹 Agregar vacuna general (por lote)
  const agregarVacunaGeneral = async () => {
    if (!loteSeleccionado) return;
    if (!nuevaVacunaGeneral.nombre || nuevaVacunaGeneral.dosis < 1) return;

    await addDoc(
      collection(db, "lotes", loteSeleccionado.id, "vacunasGenerales"),
      nuevaVacunaGeneral
    );
    setNuevaVacunaGeneral({ nombre: "", dosis: 1, recordatorio: "" });
  };

  // 🔹 Cargar vacunas de un animal
  const cargarVacunasAnimal = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    const snaps = await getDocs(
      collection(db, "lotes", loteSeleccionado.id, "animales", animal.id, "vacunas")
    );
    const asignadas = snaps.docs.map((d) => ({
      id: d.id,
      ...(d.data() as VacunaAsignada),
    }));

    const combinadas = vacunasGenerales.map((vg) => {
      const a = asignadas.find((x) => x.vacunaId === vg.id);
      return {
        ...vg,
        asignada: !!a,
        asignacionId: a?.id,
        dosisAplicadas: a?.dosisAplicadas || Array(vg.dosis).fill(false),
        fechasAplicacion: a?.fechasAplicacion || Array(vg.dosis).fill(""),
      };
    });

    setVacunasAnimal(combinadas);
    setAnimalSeleccionado(animal);

    // Guardar en el estado global de vacunas por animal
    setVacunasPorAnimal((prev) => ({ ...prev, [animal.id!]: combinadas }));
  };

  // 🔹 Asignar / Quitar vacuna
  const toggleAsignacion = async (v: any) => {
    if (!animalSeleccionado || !loteSeleccionado) return;

    if (v.asignada && v.asignacionId) {
      await deleteDoc(
        doc(
          db,
          "lotes",
          loteSeleccionado.id,
          "animales",
          animalSeleccionado.id!,
          "vacunas",
          v.asignacionId
        )
      );
    } else {
      await addDoc(
        collection(
          db,
          "lotes",
          loteSeleccionado.id,
          "animales",
          animalSeleccionado.id!,
          "vacunas"
        ),
        {
          vacunaId: v.id,
          dosisAplicadas: Array(v.dosis).fill(false),
          fechasAplicacion: Array(v.dosis).fill(""),
        }
      );
    }
    cargarVacunasAnimal(animalSeleccionado);
  };

  // 🔹 Marcar dosis aplicada
  const toggleDosis = async (v: any, index: number) => {
    if (!animalSeleccionado || !loteSeleccionado || !v.asignacionId) return;
    const nuevaLista = [...v.dosisAplicadas];
    nuevaLista[index] = !nuevaLista[index];

    await updateDoc(
      doc(
        db,
        "lotes",
        loteSeleccionado.id,
        "animales",
        animalSeleccionado.id!,
        "vacunas",
        v.asignacionId
      ),
      { dosisAplicadas: nuevaLista }
    );

    cargarVacunasAnimal(animalSeleccionado);
  };

  // 🔹 Actualizar fecha de dosis
  const actualizarFechaDosis = async (v: any, index: number, fecha: string) => {
    if (!animalSeleccionado || !loteSeleccionado || !v.asignacionId) return;
    const hoy = new Date().toISOString().split("T")[0];
    if (fecha > hoy) {
      alert("No puedes registrar una fecha futura.");
      return;
    }

    const nuevasFechas = [...v.fechasAplicacion];
    nuevasFechas[index] = fecha;

    await updateDoc(
      doc(
        db,
        "lotes",
        loteSeleccionado.id,
        "animales",
        animalSeleccionado.id!,
        "vacunas",
        v.asignacionId
      ),
      { fechasAplicacion: nuevasFechas }
    );

    cargarVacunasAnimal(animalSeleccionado);
  };

  // 🔹 Contadores por animal
  useEffect(() => {
    if (animales.length === 0) {
      setTotalCompletos(0);
      setTotalIncompletos(0);
      setTotalSinAsignar(0);
      return;
    }

    let completos = 0;
    let incompletos = 0;
    let sinAsignar = 0;

    animales.forEach((animal) => {
      const vacunas = vacunasPorAnimal[animal.id!] || [];
      const asignadas = vacunas.filter((v) => v.asignada);

      if (asignadas.length === 0) {
        sinAsignar++;
        return;
      }

      const todasAplicadas = asignadas.every((v) =>
        v.dosisAplicadas.every((d) => d)
      );

      if (todasAplicadas) completos++;
      else incompletos++;
    });

    setTotalCompletos(completos);
    setTotalIncompletos(incompletos);
    setTotalSinAsignar(sinAsignar);
  }, [animales, vacunasPorAnimal]);

    // 🔹 Interfaz
    return (
      <div className="relative min-h-screen">
        <div
          className="absolute inset-0 bg-cover bg-center blur-[2px]"
          style={{ backgroundImage: `url(${cowsBackground})` }}
        ></div>
        <div className="absolute inset-0 bg-white/20"></div>
  
       {/*barra de navegación */}
            <nav className="sticky top-0 z-50 bg-red-500 text-black flex items-center justify-between p-4 shadow-lg">
              <div className="flex items-center gap-4">
                
                <h1 className="text-2xl font-extrabold">Vacunas</h1>
              </div>
      
              <div className="flex items-center gap-4">
                <button onClick={() => navigate("/home")} className="hover:text-red-300 transition">
                  <FaHome size={20} />
                </button>
                <button onClick={() => navigate("/notificaciones")} className="hover:text-red-300 transition">
                  <FaBell size={20} />
                </button>
                <button onClick={() => setMenuAbierto(!menuAbierto)} className="md:hidden hover:text-red-300">
                {menuAbierto ? <FaTimes size={22} /> : <FaBars size={22} />}
                </button>
                <button onClick={handleLogout} className="hidden md:inline bg-red-400 text-black font-semibold px-3 py-1 rounded-xl hover:bg-red-600">
                  Cerrar sesión
                </button>
              </div>
              {menuAbierto && (
                <div className="absolute top-full right-0 bg-white text-black w-48 rounded-b-lg shadow-lg md:hidden">
                  <button onClick={() => navigate("/notificaciones")} className="w-full text-left px-4 py-2 hover:bg-gray-200">🔔 Notificaciones</button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-200">🚪 Cerrar sesión</button>
                </div>
              )}
            </nav>
      
        <div className="relative p-6 flex flex-col gap-6">
          {/* Vacunas generales */}
          <div className="bg-white/30 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow">
            <h2 className="text-xl font-bold mb-3 text-red-700">
              Vacunas del lote {loteSeleccionado?.nombre}
            </h2>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={nuevaVacunaGeneral.nombre}
                onChange={(e) => setNuevaVacunaGeneral((v) => ({ ...v, nombre: e.target.value }))}
                className={inputClasses}
              />
              <input
                type="number"
                placeholder="Dosis"
                value={nuevaVacunaGeneral.dosis}
                onChange={(e) =>
                  setNuevaVacunaGeneral((v) => ({ ...v, dosis: parseInt(e.target.value) }))
                }
                className={`${inputClasses} w-24`}
                min={1}
              />
              <input
                type="text"
                placeholder="Recordatorio"
                value={nuevaVacunaGeneral.recordatorio}
                onChange={(e) =>
                  setNuevaVacunaGeneral((v) => ({ ...v, recordatorio: e.target.value }))
                }
                className={`${inputClasses} flex-1`}
              />
              <button
                onClick={agregarVacunaGeneral}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition flex items-center gap-2"
              >
                <FaPlus /> Agregar
              </button>
            </div>
          </div>
  
          {/* Lotes */}
          <div className="flex gap-4 flex-wrap">
            {lotes.map((lote) => (
              <button
                key={lote.id}
                onClick={() => {
                  setLoteSeleccionado(lote);
                  setAnimalSeleccionado(null);
                }}
                className={`px-5 py-2 rounded-xl font-semibold ${
                  loteSeleccionado?.id === lote.id ? "bg-red-700 text-white" : "bg-red-500 text-white"
                }`}
              >
                {lote.nombre.toUpperCase()}
              </button>
            ))}
          </div>
  
          {/* Animales */}
          <div className="bg-white/30 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4 text-red-900">
              Animales del lote {loteSeleccionado?.nombre}
            </h2>
  
            {/* Filtro */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => setFiltroVacunas("todos")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filtroVacunas === "todos"
                    ? "bg-red-600 text-white"
                    : "bg-white/60 text-red-600 hover:bg-white/80"
                }`}
              >
                Todos ({animales.length})
              </button>
              <button
                onClick={() => setFiltroVacunas("completos")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filtroVacunas === "completos"
                    ? "bg-green-600 text-white"
                    : "bg-white/60 text-green-600 hover:bg-white/80"
                }`}
              >
                Completos ✅ ({totalCompletos})
              </button>
              <button
                onClick={() => setFiltroVacunas("incompletos")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filtroVacunas === "incompletos"
                    ? "bg-yellow-500 text-white"
                    : "bg-white/60 text-yellow-600 hover:bg-white/80"
                }`}
              >
                Incompletos ⚠ ({totalIncompletos})
              </button>
              <button
                onClick={() => setFiltroVacunas("sinAsignar")}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  filtroVacunas === "sinAsignar"
                    ? "bg_gray-600 text-white"
                    : "bg-white/60 text-gray-700 hover:bg-white/80"
                }`}
              >
                Sin asignar 🐮 ({totalSinAsignar})
              </button>
            </div>
  
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-red-500 text-white">
                  <th className="p-2 border">Código</th>
                  <th className="p-2 border">Raza</th>
                  <th className="p-2 border">Sexo</th>
                  <th className="p-2 border">Edad</th>
                  <th className="p-2 border">Vacunas</th>
                </tr>
              </thead>
              <tbody>
  {animales
    .filter((a) => {
      const vacunas = vacunasPorAnimal[a.id!] || [];
      const asignadas = vacunas.filter((v) => v.asignada);
      const todasAplicadas = asignadas.every((v) => v.dosisAplicadas.every((d) => d));

      if (filtroVacunas === "todos") return true;
      if (filtroVacunas === "completos") return asignadas.length > 0 && todasAplicadas;
      if (filtroVacunas === "incompletos") return asignadas.length > 0 && !todasAplicadas;
      if (filtroVacunas === "sinAsignar") return asignadas.length === 0;
      return true;
    })
    .map((a) => {
      const bloqueado = a.estado === "muerto" || a.estado === "vendido";
      return (
        <tr
          key={a.id}
          className={`border-b hover:bg-white/20 transition-all
            ${bloqueado ? "opacity-60 blur-[1px] line-through select-none" : ""}
          `}
        >
          <td className="p-2 border">{a.codigo}</td>
          <td className="p-2 border">{a.raza}</td>
          <td className="p-2 border">{a.sexo}</td>
          <td className="p-2 border">{a.edad}</td>
          <td className="p-2 border">
            <button
              className={`text-blue-600 hover:underline ${
                bloqueado ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
              }`}
              onClick={() => {
                if (bloqueado) return;
                cargarVacunasAnimal(a);
              }}
            >
              Ver / Editar Vacunas
            </button>
          </td>
        </tr>
      );
    })}
</tbody>

            </table>
  
            {/* Vacunas por animal */}
            {animalSeleccionado && (
              <div className="mt-6 bg-white/40 p-4 rounded-lg">
                <h3 className="text-lg font-bold mb-3">
                  Vacunas del animal {animalSeleccionado.codigo}
                </h3>
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 border">Vacuna</th>
                      <th className="p-2 border">Dosis</th>
                      <th className="p-2 border">Recordatorio</th>
                      <th className="p-2 border">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vacunasAnimal.map((v) => (
                      <tr key={v.id} className="border-b">
                        <td className="p-2 border">{v.nombre}</td>
                        <td className="p-2 border">
                          <div className="flex flex-wrap gap-2">
                            {v.dosisAplicadas.map((d, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={d}
                                  onChange={() => toggleDosis(v, i)}
                                />
                                <input
                                  type="date"
                                  value={v.fechasAplicacion[i] || ""}
                                  onChange={(e) => actualizarFechaDosis(v, i, e.target.value)}
                                  className="border rounded p-1 text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-2 border">{v.recordatorio}</td>
                        <td className="p-2 border text-center">
                          <button
                            onClick={() => toggleAsignacion(v)}
                            className={`px-3 py-1 rounded ${
                              v.asignada ? "bg-red-600 text-white" : "bg-green-600 text-white"
                            }`}
                          >
                            {v.asignada ? "Quitar" : "Asignar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
         <footer className="w-screen bg-[#094297dc] py-3 md:py-4 text-center text-xs md:text-sm text-white relative z-10">
          <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
        </footer>
      </div>
    );
  }
