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
import { FaPlus } from "react-icons/fa";

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

  // 🔹 Función para determinar color de "Ver / Editar Vacunas"
  const colorBotonVacunas = (a: Animal) => {
    const vacunaAnimal = vacunasAnimal.find((v) => v.asignada && a.id === animalSeleccionado?.id);
    if (!vacunaAnimal) return "text-red-600";
    const todasAplicadas = vacunaAnimal.dosisAplicadas.every((d) => d);
    return todasAplicadas ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="min-h-screen bg-yellow-50 p-6">
      <h1 className="text-3xl font-bold text-yellow-700 mb-6">Salud - Control de Vacunas</h1>

      {/* 🔹 Vacunas generales */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-xl font-bold mb-3">Vacunas Generales</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Nombre"
            value={nuevaVacunaGeneral.nombre}
            onChange={(e) => setNuevaVacunaGeneral((v) => ({ ...v, nombre: e.target.value }))}
            className="border px-3 py-2 rounded-lg"
          />
          <input
            type="number"
            placeholder="Dosis"
            value={nuevaVacunaGeneral.dosis}
            onChange={(e) => setNuevaVacunaGeneral((v) => ({ ...v, dosis: parseInt(e.target.value) }))}
            className="border px-3 py-2 rounded-lg w-24"
            min={1}
          />
          <input
            type="text"
            placeholder="Recordatorio"
            value={nuevaVacunaGeneral.recordatorio}
            onChange={(e) => setNuevaVacunaGeneral((v) => ({ ...v, recordatorio: e.target.value }))}
            className="border px-3 py-2 rounded-lg flex-1"
          />
          <button
            onClick={agregarVacunaGeneral}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition flex items-center gap-2"
          >
            <FaPlus /> Agregar
          </button>
        </div>
      </div>

      {/* 🔹 Selección de lote */}
      <div className="mb-6 flex gap-4 flex-wrap">
        {lotes.map((lote) => (
          <button
            key={lote.id}
            onClick={() => {
              setLoteSeleccionado(lote);
              setAnimalSeleccionado(null); // cerrar modal al cambiar lote
            }}
            className={`px-5 py-2 rounded-xl font-semibold ${
              loteSeleccionado?.id === lote.id ? "bg-yellow-600 text-white" : "bg-yellow-200 text-yellow-800"
            }`}
          >
            {lote.nombre.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 🔹 Lista de animales */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">Animales del lote {loteSeleccionado?.nombre}</h2>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-yellow-200">
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
                <tr key={a.id} className="border-b hover:bg-yellow-50">
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

      {/* 🔹 Modal vacunas */}
      {animalSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-yellow-700 mb-4">Vacunas de {animalSeleccionado.codigo}</h2>

            {vacunasAnimal.map((v) => (
              <div key={v.id} className="bg-yellow-100 p-3 rounded-lg mb-3">
                <p className="font-semibold">{v.nombre} ({v.dosis} dosis)</p>
                <p className="text-sm text-gray-600 mb-2">{v.recordatorio}</p>

                {v.asignada ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: v.dosis }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <button
                          onClick={() => toggleDosis(v, i)}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                            v.dosisAplicadas[i] ? "bg-green-500 text-white" : "bg-gray-200"
                          }`}
                        >
                          {i + 1}
                        </button>
                        <input
                          type="date"
                          value={v.fechasAplicacion[i] || ""}
                          onChange={(e) => actualizarFechaDosis(v, i, e.target.value)}
                          className={`border rounded px-2 py-1 text-sm ${
                            v.dosisAplicadas[i] ? "bg-white" : "bg-gray-100 text-gray-400"
                          }`}
                          disabled={!v.dosisAplicadas[i]}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No asignada</p>
                )}

                <button
                  onClick={() => toggleAsignacion(v)}
                  className={`mt-3 px-3 py-1 rounded ${v.asignada ? "bg-red-500" : "bg-blue-500"} text-white`}
                >
                  {v.asignada ? "Quitar" : "Asignar"}
                </button>
              </div>
            ))}

            <button
              onClick={() => setAnimalSeleccionado(null)}
              className="mt-4 w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-4 py-2 rounded-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
