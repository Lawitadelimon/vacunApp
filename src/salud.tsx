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
import { getAuth } from "firebase/auth";
import { FaPlus, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import cowsBackground from "./assets/cows2.jpg";

type Animal = {
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
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [animalSeleccionado, setAnimalSeleccionado] = useState<Animal | null>(null);
  const [vacunasGenerales, setVacunasGenerales] = useState<VacunaGeneral[]>([]);
  const [vacunasAnimal, setVacunasAnimal] = useState<
    (VacunaGeneral & { asignada: boolean; asignacionId?: string; dosisAplicadas: boolean[]; fechasAplicacion: string[] })[]
  >([]);
  const [nuevaVacunaGeneral, setNuevaVacunaGeneral] = useState<VacunaGeneral>({
    nombre: "",
    dosis: 1,
    recordatorio: "",
  });

  const auth = getAuth();

  const inputClasses = "border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500";

  // 🔹 Cargar lotes
  const cargarLotes = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "lotes"), where("uid", "==", user.uid));
    const snaps = await getDocs(q);
    const listaLotes: Lote[] = snaps.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    setLotes(listaLotes);
    if (listaLotes.length > 0 && !loteSeleccionado) setLoteSeleccionado(listaLotes[0]);
  };

  useEffect(() => {
    cargarLotes();
  }, []);

  // 🔹 Escuchar animales en tiempo real
  useEffect(() => {
    if (!loteSeleccionado) return;
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "lotes", loteSeleccionado.id, "animales"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const lista: Animal[] = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Animal) }));
      setAnimales(lista);
      if (animalSeleccionado && !lista.find((a) => a.id === animalSeleccionado.id)) {
        setAnimalSeleccionado(null);
      }
    });

    return () => unsub();
  }, [loteSeleccionado]);

  // 🔹 Escuchar vacunas generales
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vacunasGenerales"), (snapshot) => {
      const lista = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as VacunaGeneral) }));
      setVacunasGenerales(lista);
    });
    return () => unsub();
  }, []);

  // 🔹 Agregar vacuna general
  const agregarVacunaGeneral = async () => {
    if (!nuevaVacunaGeneral.nombre || nuevaVacunaGeneral.dosis < 1) return;
    await addDoc(collection(db, "vacunasGenerales"), nuevaVacunaGeneral);
    setNuevaVacunaGeneral({ nombre: "", dosis: 1, recordatorio: "" });
  };

  // 🔹 Cargar vacunas de un animal
  const cargarVacunasAnimal = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    const snaps = await getDocs(collection(db, "lotes", loteSeleccionado.id, "animales", animal.id, "vacunas"));
    const asignadas = snaps.docs.map((d) => ({ id: d.id, ...(d.data() as VacunaAsignada) }));

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
  };

  // 🔹 Asignar / Quitar vacuna
  const toggleAsignacion = async (v: any) => {
    if (!animalSeleccionado || !loteSeleccionado) return;

    if (v.asignada && v.asignacionId) {
      await deleteDoc(doc(db, "lotes", loteSeleccionado.id, "animales", animalSeleccionado.id!, "vacunas", v.asignacionId));
    } else {
      await addDoc(collection(db, "lotes", loteSeleccionado.id, "animales", animalSeleccionado.id!, "vacunas"), {
        vacunaId: v.id,
        dosisAplicadas: Array(v.dosis).fill(false),
        fechasAplicacion: Array(v.dosis).fill(""),
      });
    }
    cargarVacunasAnimal(animalSeleccionado);
  };

  // 🔹 Marcar dosis aplicada
  const toggleDosis = async (v: any, index: number) => {
    if (!animalSeleccionado || !loteSeleccionado || !v.asignacionId) return;
    const nuevaLista = [...v.dosisAplicadas];
    nuevaLista[index] = !nuevaLista[index];

    await updateDoc(doc(db, "lotes", loteSeleccionado.id, "animales", animalSeleccionado.id!, "vacunas", v.asignacionId), {
      dosisAplicadas: nuevaLista,
    });

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

    await updateDoc(doc(db, "lotes", loteSeleccionado.id, "animales", animalSeleccionado.id!, "vacunas", v.asignacionId), {
      fechasAplicacion: nuevasFechas,
    });

    cargarVacunasAnimal(animalSeleccionado);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background imagen */}
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${cowsBackground})` }}></div>
      <div className="absolute inset-0 bg-white/20"></div>

      {/* Barra de navegación */}
      <div className="sticky top-0 z-50 bg-red-500 text-white p-4 flex items-center gap-4 shadow-md">
        <button onClick={() => navigate(-1)} className="hover:text-red-200 transition">
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Salud - Control de Vacunas</h1>
      </div>

      {/* Contenido */}
      <div className="relative p-6 flex flex-col gap-6">
        {/* Vacunas generales */}
        <div className="bg-white/30 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-3 text-red-700">Vacunas Generales</h2>
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
              onChange={(e) => setNuevaVacunaGeneral((v) => ({ ...v, dosis: parseInt(e.target.value) }))}
              className={`${inputClasses} w-24`}
              min={1}
            />
            <input
              type="text"
              placeholder="Recordatorio"
              value={nuevaVacunaGeneral.recordatorio}
              onChange={(e) => setNuevaVacunaGeneral((v) => ({ ...v, recordatorio: e.target.value }))}
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

        {/* Selección de lote */}
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

        {/* Lista de animales */}
        <div className="bg-white/30 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4 text-red-700">Animales del lote {loteSeleccionado?.nombre}</h2>
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
              {animales.map((a) => {
                const todasDosis = vacunasAnimal
                  .filter((v) => v.asignada)
                  .every((v) => v.dosisAplicadas.every((d) => d));
                return (
                  <tr key={a.id} className="border-b hover:bg-white/20">
                    <td className="p-2 border">{a.codigo}</td>
                    <td className="p-2 border">{a.raza}</td>
                    <td className="p-2 border">{a.sexo}</td>
                    <td className="p-2 border">{a.edad}</td>
                    <td className="p-2 border">
                      <button
                        className={`${todasDosis ? "text-green-600" : "text-red-600"} hover:underline`}
                        onClick={() => cargarVacunasAnimal(a)}
                      >
                        Ver / Editar Vacunas
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
