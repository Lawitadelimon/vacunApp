import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { FaTrash, FaEdit, FaPlus, FaSort } from "react-icons/fa";

type Animal = {
  id?: string;
  codigo: string;
  raza: string;
  sexo: "macho" | "hembra";
  fechaNacimiento: string;
  edad: string;
};

type Lote = {
  id?: string;
  nombre: string;
};

export default function AnimalesPorLote() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [formData, setFormData] = useState<{id?: string, codigo: string, raza: string, sexo: "macho" | "hembra", fechaNacimiento: string}>({ codigo: "", raza: "", sexo: "macho", fechaNacimiento: "" });
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<{ campo: keyof Animal | null; asc: boolean }>({ campo: null, asc: true });

  const auth = getAuth();
  const ITEMS_PAGINA = 40;

  const calcularEdad = (fecha: string) => {
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    if (nacimiento > hoy) return "Fecha inválida";
    const diffMs = hoy.getTime() - nacimiento.getTime();
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const años = Math.floor(dias / 365.25);
    const meses = Math.floor((dias % 365.25) / 30.44);
    const diasRest = Math.floor((dias % 365.25) % 30.44);
    return `${años} años ${meses} meses ${diasRest} días`;
  };

  // Cargar lotes
  const cargarLotes = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "lotes"), where("uid", "==", user.uid));
    const snaps = await getDocs(q);
    const lotesDB = snaps.docs.map(doc => ({ id: doc.id, ...(doc.data() as Lote) }));
    setLotes(lotesDB);
    if (lotesDB.length > 0 && !loteSeleccionado) setLoteSeleccionado(lotesDB[0]);
  };

  // Cargar animales
  const cargarAnimales = async () => {
    if (!loteSeleccionado) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      const q = query(collection(db, "lotes", loteSeleccionado.id!, "animales"), where("uid", "==", user.uid));
      const snaps = await getDocs(q);
      const lista: Animal[] = snaps.docs.map(doc => ({ id: doc.id, ...(doc.data() as Animal) }));
      setAnimales(lista);
    } catch (error) {
      console.error("Error cargando animales:", error);
    }
  };

  useEffect(() => { cargarLotes(); }, []);
  useEffect(() => { cargarAnimales(); }, [loteSeleccionado]);

  // Guardar o actualizar animal
  const guardarAnimal = async () => {
    if (!loteSeleccionado) return;
    const user = auth.currentUser;
    if (!user) return;
    if (!formData.codigo || !formData.raza || !formData.sexo || !formData.fechaNacimiento) return alert("Completa todos los campos");
    if (new Date(formData.fechaNacimiento) > new Date()) return alert("La fecha no puede ser futura");

    const edad = calcularEdad(formData.fechaNacimiento);
    const datos: Animal & { uid: string } = { ...formData, edad, uid: user.uid };

    if (formData.id) {
      // Actualizar registro existente
      await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", formData.id), datos);
    } else {
      // Crear nuevo registro
      await addDoc(collection(db, "lotes", loteSeleccionado.id!, "animales"), datos);
    }

    setFormData({ codigo: "", raza: "", sexo: "macho", fechaNacimiento: "" });
    cargarAnimales();
  };

  // Preparar animal para edición
  const editarAnimal = (animal: Animal) => {
    setFormData({ 
      id: animal.id,
      codigo: animal.codigo, 
      raza: animal.raza, 
      sexo: animal.sexo, 
      fechaNacimiento: animal.fechaNacimiento 
    });
  };

  const eliminarAnimal = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    if (!confirm(`Eliminar ${animal.codigo}?`)) return;
    await deleteDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id));
    cargarAnimales();
  };

  const agregarLote = async () => {
    const nombre = prompt("Nombre del lote");
    if (!nombre) return;
    const user = auth.currentUser;
    if (!user) return;
    const ref = await addDoc(collection(db, "lotes"), { nombre, uid: user.uid });
    const nuevoLote = { id: ref.id, nombre };
    setLotes(prev => [...prev, nuevoLote]);
    setLoteSeleccionado(nuevoLote);
  };

  const editarLote = async (lote: Lote) => {
    const nombre = prompt("Nuevo nombre del lote", lote.nombre);
    if (!nombre || !lote.id) return;
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, "lotes", lote.id), { nombre, uid: user.uid });
    setLotes(prev => prev.map(l => l.id === lote.id ? { ...l, nombre } : l));
    if (loteSeleccionado?.id === lote.id) setLoteSeleccionado({ ...lote, nombre });
  };

  const eliminarLote = async (lote: Lote) => {
    if (!lote.id) return;
    if (!confirm(`Eliminar lote ${lote.nombre}?`)) return;
    await deleteDoc(doc(db, "lotes", lote.id));
    setLotes(prev => prev.filter(l => l.id !== lote.id));
    if (loteSeleccionado?.id === lote.id) setLoteSeleccionado(null);
  };

  // Filtrado y orden
  const animalesFiltrados = animales
    .filter(a =>
      a.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.raza.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.sexo.toLowerCase().includes(busqueda.toLowerCase()) ||
      a.fechaNacimiento.includes(busqueda) ||
      a.edad.includes(busqueda)
    )
    .sort((a, b) => {
      if (!orden.campo) return 0;
      const campo = orden.campo;
      const valA = a[campo] || "";
      const valB = b[campo] || "";
      return orden.asc ? valA.toString().localeCompare(valB.toString()) : valB.toString().localeCompare(valA.toString());
    });

  const paginaActual = animalesFiltrados.slice((pagina - 1) * ITEMS_PAGINA, pagina * ITEMS_PAGINA);
  const totalPaginas = Math.ceil(animalesFiltrados.length / ITEMS_PAGINA);
  const toggleOrden = (campo: keyof Animal) => setOrden(prev => ({ campo, asc: prev.campo === campo ? !prev.asc : true }));

  return (
    <div className="min-h-screen bg-yellow-50 p-6">
      <h1 className="text-3xl font-bold text-yellow-700 mb-6">Animales por Lote</h1>

      <div className="mb-4 flex gap-2 flex-wrap">
        {lotes.map(lote => (
          <div key={lote.id} className="flex items-center gap-2">
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${loteSeleccionado?.id === lote.id ? "bg-yellow-600 text-white" : "bg-yellow-200"}`}
              onClick={() => setLoteSeleccionado(lote)}
            >
              {lote.nombre}
            </button>
            <button onClick={() => editarLote(lote)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"><FaEdit /></button>
            <button onClick={() => eliminarLote(lote)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"><FaTrash /></button>
          </div>
        ))}
        <button onClick={agregarLote} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <FaPlus /> Agregar Lote
        </button>
      </div>

      {loteSeleccionado && (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Registrar Animal</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="Código" value={formData.codigo} onChange={e => setFormData(f => ({ ...f, codigo: e.target.value }))} className="border px-4 py-2 rounded-lg" />
            <input type="text" placeholder="Raza" value={formData.raza} onChange={e => setFormData(f => ({ ...f, raza: e.target.value }))} className="border px-4 py-2 rounded-lg" />
            <select value={formData.sexo} onChange={e => setFormData(f => ({ ...f, sexo: e.target.value as "macho" | "hembra" }))} className="border px-4 py-2 rounded-lg">
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
            <input type="date" max={new Date().toISOString().split("T")[0]} value={formData.fechaNacimiento} onChange={e => setFormData(f => ({ ...f, fechaNacimiento: e.target.value }))} className="border px-4 py-2 rounded-lg" />
          </div>
          <button onClick={guardarAnimal} className="mt-4 bg-yellow-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-yellow-700 transition">
            Guardar
          </button>
        </div>
      )}

      {loteSeleccionado && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-4">Lista de {loteSeleccionado.nombre}</h2>

          <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="border px-4 py-2 rounded-lg mb-4 w-full" />

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-yellow-200">
                <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("codigo")}># <FaSort /></th>
                <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("codigo")}>Código <FaSort /></th>
                <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("raza")}>Raza <FaSort /></th>
                <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("sexo")}>Sexo <FaSort /></th>
                <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("fechaNacimiento")}>Fecha Nac. <FaSort /></th>
                <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("edad")}>Edad <FaSort /></th>
                <th className="p-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginaActual.map((a, idx) => (
                <tr key={a.id} className="border-b hover:bg-yellow-50">
                  <td className="p-2 border">{(pagina - 1) * ITEMS_PAGINA + idx + 1}</td>
                  <td className="p-2 border">{a.codigo}</td>
                  <td className="p-2 border">{a.raza}</td>
                  <td className="p-2 border">{a.sexo}</td>
                  <td className="p-2 border">{a.fechaNacimiento}</td>
                  <td className="p-2 border">{a.edad}</td>
                  <td className="p-2 border flex gap-2">
                    <button onClick={() => editarAnimal(a)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"><FaEdit /></button>
                    <button onClick={() => eliminarAnimal(a)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"><FaTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPaginas > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i + 1}
                  className={`px-3 py-1 rounded ${pagina === i + 1 ? "bg-yellow-600 text-white" : "bg-yellow-200"}`}
                  onClick={() => setPagina(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
