import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { FaPlus, FaTrash } from "react-icons/fa";

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
  aplicada: boolean;
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
  const [vacunasAnimal, setVacunasAnimal] = useState<(VacunaGeneral & { aplicada: boolean; asignada: boolean })[]>([]);
  const [nuevaVacuna, setNuevaVacuna] = useState<VacunaGeneral>({ nombre: "", dosis: 1, recordatorio: "" });

  const auth = getAuth();

  // Cargar lotes del usuario
  const cargarLotes = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "lotes"), where("uid", "==", user.uid));
    const snaps = await getDocs(q);
    const listaLotes: Lote[] = snaps.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    setLotes(listaLotes);
    if (listaLotes.length > 0 && !loteSeleccionado) setLoteSeleccionado(listaLotes[0]);
  };

  useEffect(() => {
    cargarLotes();
  }, []);

  // Escuchar animales en tiempo real
  useEffect(() => {
    if (!loteSeleccionado) return;
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "lotes", loteSeleccionado.id, "animales"), where("uid", "==", user.uid));
    const unsub = onSnapshot(q, snapshot => {
      const lista: Animal[] = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as Animal) }));
      setAnimales(lista);

      if (animalSeleccionado && !lista.find(a => a.id === animalSeleccionado.id)) {
        setAnimalSeleccionado(null);
      }
    });

    return () => unsub();
  }, [loteSeleccionado]);

  // Escuchar vacunas generales en tiempo real
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "vacunasGenerales"), snapshot => {
      const lista = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as VacunaGeneral) }));
      setVacunasGenerales(lista);
    });
    return () => unsub();
  }, []);

  // Cargar vacunas asignadas de un animal
  const cargarVacunasAnimal = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    const snaps = await getDocs(collection(db, "lotes", loteSeleccionado.id, "animales", animal.id, "vacunas"));
    const asignadas: VacunaAsignada[] = snaps.docs.map(d => ({ id: d.id, ...(d.data() as VacunaAsignada) }));

    const combinadas = vacunasGenerales.map(vg => ({
      ...vg,
      aplicada: asignadas.find(a => a.vacunaId === vg.id)?.aplicada || false,
      asignada: !!asignadas.find(a => a.vacunaId === vg.id),
    }));

    setVacunasAnimal(combinadas);
    setAnimalSeleccionado(animal);
  };

  // CRUD de vacunas generales
  const agregarVacunaGeneral = async () => {
    if (!nuevaVacuna.nombre) return alert("Escribe el nombre de la vacuna");
    await addDoc(collection(db, "vacunasGenerales"), nuevaVacuna);
    setNuevaVacuna({ nombre: "", dosis: 1, recordatorio: "" });
  };

  const eliminarVacunaGeneral = async (v: VacunaGeneral) => {
    if (!v.id) return;
    if (!confirm(`¿Eliminar vacuna ${v.nombre}?`)) return;
    await deleteDoc(doc(db, "vacunasGenerales", v.id));
  };

  // Asignar o quitar vacuna a un animal
  const toggleAsignacion = async (v: VacunaGeneral & { asignada: boolean }) => {
    if (!animalSeleccionado || !loteSeleccionado || !v.id) return;

    if (v.asignada) {
      // Quitar
      const snaps = await getDocs(collection(db, "lotes", loteSeleccionado.id, "animales", animalSeleccionado.id!, "vacunas"));
      const docRef = snaps.docs.find(d => d.data().vacunaId === v.id);
      if (docRef) await deleteDoc(docRef.ref);
    } else {
      // Asignar
      await addDoc(collection(db, "lotes", loteSeleccionado.id, "animales", animalSeleccionado.id!, "vacunas"), {
        vacunaId: v.id,
        aplicada: false,
      });
    }

    cargarVacunasAnimal(animalSeleccionado);
  };

  // Marcar aplicada/no aplicada
  const toggleAplicada = async (v: VacunaGeneral & { asignada: boolean; aplicada: boolean }) => {
    if (!animalSeleccionado || !loteSeleccionado || !v.id) return;

    const snaps = await getDocs(collection(db, "lotes", loteSeleccionado.id, "animales", animalSeleccionado.id!, "vacunas"));
    const docRef = snaps.docs.find(d => d.data().vacunaId === v.id);
    if (docRef) await updateDoc(docRef.ref, { aplicada: !v.aplicada });

    cargarVacunasAnimal(animalSeleccionado);
  };

  return (
    <div className="min-h-screen bg-yellow-50 p-6">
      <h1 className="text-3xl font-bold text-yellow-700 mb-6">Salud - Control de Vacunas</h1>

      {/* Sección de vacunas generales */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-bold mb-4">Vacunas Generales</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Nombre"
            value={nuevaVacuna.nombre}
            onChange={e => setNuevaVacuna(v => ({ ...v, nombre: e.target.value }))}
            className="border px-3 py-2 rounded-lg"
          />
          <input
            type="number"
            min={1}
            placeholder="Dosis"
            value={nuevaVacuna.dosis}
            onChange={e => setNuevaVacuna(v => ({ ...v, dosis: parseInt(e.target.value) }))}
            className="border px-3 py-2 rounded-lg"
          />
          <input
            type="text"
            placeholder="Recordatorio"
            value={nuevaVacuna.recordatorio}
            onChange={e => setNuevaVacuna(v => ({ ...v, recordatorio: e.target.value }))}
            className="border px-3 py-2 rounded-lg"
          />
          <button
            onClick={agregarVacunaGeneral}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition flex items-center justify-center gap-2"
          >
            <FaPlus /> Agregar
          </button>
        </div>

        <ul className="space-y-2">
          {vacunasGenerales.map(v => (
            <li key={v.id} className="flex justify-between items-center bg-yellow-100 p-3 rounded-lg">
              <div>
                <p className="font-semibold">{v.nombre} ({v.dosis} dosis)</p>
                <p className="text-sm text-gray-700">{v.recordatorio}</p>
              </div>
              <button onClick={() => eliminarVacunaGeneral(v)} className="text-red-600 hover:text-red-800 text-xl">
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Selección de lote */}
      <div className="mb-6 flex gap-4 flex-wrap">
        {lotes.map(lote => (
          <button
            key={lote.id}
            onClick={() => setLoteSeleccionado(lote)}
            className={`px-5 py-2 rounded-xl font-semibold ${
              loteSeleccionado?.id === lote.id ? "bg-yellow-600 text-white" : "bg-yellow-200 text-yellow-800"
            }`}
          >
            {lote.nombre.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Lista de animales */}
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
            {animales.map(a => (
              <tr key={a.id} className="border-b hover:bg-yellow-50">
                <td className="p-2 border">{a.codigo}</td>
                <td className="p-2 border">{a.raza}</td>
                <td className="p-2 border">{a.sexo}</td>
                <td className="p-2 border">{a.edad}</td>
                <td className="p-2 border">
                  <button className="text-blue-600 hover:underline" onClick={() => cargarVacunasAnimal(a)}>
                    Ver / Editar Vacunas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de vacunas por animal */}
      {animalSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-yellow-700 mb-4">
              Vacunas de {animalSeleccionado.codigo}
            </h2>

            {vacunasAnimal.map(v => (
              <div key={v.id} className="flex justify-between items-center bg-yellow-100 p-3 rounded-lg mb-2">
                <div>
                  <p className="font-semibold">{v.nombre} ({v.dosis} dosis)</p>
                  <p className="text-sm">{v.recordatorio}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleAsignacion(v)}
                    className={`px-3 py-1 rounded ${v.asignada ? "bg-red-500" : "bg-blue-500"} text-white`}
                  >
                    {v.asignada ? "Quitar" : "Asignar"}
                  </button>
                  {v.asignada && (
                    <button
                      onClick={() => toggleAplicada(v)}
                      className={`px-3 py-1 rounded ${v.aplicada ? "bg-green-600" : "bg-gray-500"} text-white`}
                    >
                      {v.aplicada ? "Aplicada ✅" : "Pendiente ❌"}
                    </button>
                  )}
                </div>
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