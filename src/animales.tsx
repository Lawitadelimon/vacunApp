import { useState, useEffect } from "react"; 
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth } from "firebase/auth";
import { FaTrash, FaEdit, FaPlus, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import cowsBackground from "./assets/cows2.jpg";

type Animal = {
  id?: string;
  especie: string;
  codigo: string;
  raza: string;
  sexo: "macho" | "hembra";
  fechaNacimiento: string;
  edad: string;
  enReproduccion?: boolean;
  estado?: "vivo" | "muerto" | "vendido";
  precio?: number;
};

type Lote = { id?: string; nombre: string };

export default function AnimalesPorLote() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [formData, setFormData] = useState<Animal>({
    especie: "", codigo: "", raza: "", sexo: "macho", fechaNacimiento: "", edad: "", estado: "vivo"
  });
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<{ campo: keyof Animal | null; asc: boolean }>({ campo: null, asc: true });
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "vivo" | "muerto" | "vendido">("todos");

  const auth = getAuth();
  const navigate = useNavigate();
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

  const cargarLotes = async () => {
    const user = auth.currentUser; if (!user) return;
    const snaps = await getDocs(query(collection(db, "lotes"), where("uid", "==", user.uid)));
    const lotesDB = snaps.docs.map(doc => ({ id: doc.id, ...(doc.data() as Lote) }));
    setLotes(lotesDB);
    if (lotesDB.length > 0 && !loteSeleccionado) setLoteSeleccionado(lotesDB[0]);
  };

  const cargarAnimales = async () => {
    if (!loteSeleccionado) return;
    const user = auth.currentUser; if (!user) return;
    const snaps = await getDocs(query(collection(db, "lotes", loteSeleccionado.id!, "animales"), where("uid", "==", user.uid)));
    setAnimales(snaps.docs.map(doc => ({ id: doc.id, ...(doc.data() as Animal) })));
  };

  useEffect(() => { cargarLotes(); }, []);
  useEffect(() => { cargarAnimales(); setPagina(1); }, [loteSeleccionado]);

  const guardarAnimal = async () => {
    if (!loteSeleccionado) return;
    const user = auth.currentUser; if (!user) return;
    if (!formData.especie || !formData.codigo || !formData.raza || !formData.sexo || !formData.fechaNacimiento) return alert("Completa todos los campos");
    if (new Date(formData.fechaNacimiento) > new Date()) return alert("La fecha no puede ser futura");

    const edad = calcularEdad(formData.fechaNacimiento);
    const datos: Animal & { uid: string } = { ...formData, edad, uid: user.uid, estado: formData.estado || "vivo" };

    if (formData.id) await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", formData.id), datos);
    else await addDoc(collection(db, "lotes", loteSeleccionado.id!, "animales"), datos);

    setFormData({ especie: "", codigo: "", raza: "", sexo: "macho", fechaNacimiento: "", edad: "", estado: "vivo" });
    cargarAnimales();
  };

  const editarAnimal = (animal: Animal) => setFormData(animal);

  const eliminarAnimal = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    if (!confirm(`Eliminar ${animal.codigo}?`)) return;
    await deleteDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id));
    cargarAnimales();
  };

  const marcarComoMuerto = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    if (!confirm(`¿Marcar ${animal.codigo} como muerto?`)) return;
    await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), { estado: "muerto" }, { merge: true });
    await addDoc(collection(db, "lotes", loteSeleccionado.id!, "historial"), { ...animal, estado: "muerto", fechaAccion: new Date().toISOString() });
    cargarAnimales();
  };

  const marcarComoVendido = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    if (!confirm(`¿Marcar ${animal.codigo} como vendido?`)) return;
    await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), { estado: "vendido" }, { merge: true });
    await addDoc(collection(db, "lotes", loteSeleccionado.id!, "historial"), { ...animal, estado: "vendido", precio: animal.precio || 0, fechaAccion: new Date().toISOString() });
    cargarAnimales();
  };

  const mandarAReproduccion = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    const duraciones: Record<string, number> = { Bovino: 283, Ovino: 147, Caprino: 150, Porcino: 115, Equino: 340 };
    const dias = duraciones[animal.especie] || 0;
    if (!dias) return;
    const fecha = new Date(); fecha.setDate(fecha.getDate() + dias);
    await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), { ...animal, enReproduccion: true, fechaPosibleParto: fecha.toISOString().split("T")[0] }, { merge: true });
    cargarAnimales();
  };

  const toggleOrden = (campo: keyof Animal) => setOrden(prev => ({ campo, asc: prev.campo === campo ? !prev.asc : true }));
  const mostrarFlecha = (campo: keyof Animal) => orden.campo !== campo ? "⇅" : orden.asc ? "▲" : "▼";

  const animalesFiltrados = animales
    .filter(a => (filtroEstado === "todos" || a.estado === filtroEstado) &&
      [a.especie, a.codigo, a.raza, a.sexo, a.fechaNacimiento, a.edad].some(c => c.toLowerCase().includes(busqueda.toLowerCase()))
    )
    .sort((a, b) => {
      if (!orden.campo) return 0;
      const valA = a[orden.campo!] || "", valB = b[orden.campo!] || "";
      return orden.asc ? valA.toString().localeCompare(valB.toString()) : valB.toString().localeCompare(valA.toString());
    });

  const paginaActual = animalesFiltrados.slice((pagina - 1) * ITEMS_PAGINA, pagina * ITEMS_PAGINA);
  const totalPaginas = Math.ceil(animalesFiltrados.length / ITEMS_PAGINA);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${cowsBackground})` }} />
      <div className="absolute inset-0 bg-white/20" />

      <div className="sticky top-0 z-50 bg-teal-500 text-black p-4 flex items-center gap-4 shadow-md">
        <button onClick={() => navigate(-1)} className="hover:text-teal-700 transition"><FaArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">Gestión de Animales por Lote</h1>
      </div>

      <div className="relative p-6 md:p-9 flex flex-col md:flex-row gap-6 md:gap-9">
        {/* Lotes */}
        <div className="w-full md:w-1/6 bg-white/30 backdrop-blur-md border border-white/40 p-4 rounded-3xl shadow-lg h-auto md:h-[calc(100vh-6rem)] sticky top-24 flex flex-col gap-2 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Lotes</h2>
          {lotes.map(lote => (
            <div key={lote.id} className="flex items-center justify-between gap-2">
              <button className={`flex-1 px-4 py-2 rounded-lg font-semibold text-left ${loteSeleccionado?.id === lote.id ? "bg-teal-700 text-white" : "bg-teal-500 text-white"} hover:bg-teal-600 transition`} 
                onClick={() => { setLoteSeleccionado(lote); setPagina(1); }}>
                {lote.nombre}
              </button>
              <button onClick={() => {
                const nuevoNombre = prompt("Nuevo nombre:", lote.nombre);
                if (nuevoNombre && lote.id) setDoc(doc(db, "lotes", lote.id), { nombre: nuevoNombre }, { merge: true }).then(cargarLotes);
              }} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"><FaEdit /></button>
              <button onClick={async () => {
                if (!lote.id) return; if (!confirm(`Eliminar "${lote.nombre}"?`)) return;
                await deleteDoc(doc(db, "lotes", lote.id)); cargarLotes(); if (loteSeleccionado?.id === lote.id) setLoteSeleccionado(null);
              }} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"><FaTrash /></button>
            </div>
          ))}
          <button className="mt-2 bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 hover:bg-green-700 transition"><FaPlus /> Agregar Lote</button>
        </div>

        {/* Contenido */}
        <div className="w-full md:w-3/4 flex flex-col gap-6">
          {loteSeleccionado && (
            <div className="bg-white/30 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Registrar Animal</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <select value={formData.especie} onChange={e => setFormData(f => ({ ...f, especie: e.target.value }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Selecciona especie</option>
                  <option value="Bovino">Bovino</option>
                  <option value="Ovino">Ovino</option>
                  <option value="Caprino">Caprino</option>
                  <option value="Porcino">Porcino</option>
                  <option value="Equino">Equino</option>
                </select>
                <input type="text" placeholder="Código" value={formData.codigo} onChange={e => setFormData(f => ({ ...f, codigo: e.target.value }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2" />
                <input type="text" placeholder="Raza" value={formData.raza} onChange={e => setFormData(f => ({ ...f, raza: e.target.value }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2" />
                <select value={formData.sexo} onChange={e => setFormData(f => ({ ...f, sexo: e.target.value as "macho" | "hembra" }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2">
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
                <input type="date" max={new Date().toISOString().split("T")[0]} value={formData.fechaNacimiento} onChange={e => setFormData(f => ({ ...f, fechaNacimiento: e.target.value }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2" />
              </div>
              <button onClick={guardarAnimal} className="mt-4 bg-teal-500 text-white px-6 py-2 rounded-2xl font-semibold hover:bg-teal-700 transition-shadow shadow-md hover:shadow-xl">Guardar</button>
            </div>
          )}

          {loteSeleccionado && (
            <div className="bg-white/30 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-lg overflow-x-auto">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Lista de Animales - {loteSeleccionado.nombre}</h2>

              <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full mb-4 px-4 py-2 rounded-lg border border-white/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400" />

              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-teal-500 text-white rounded-t-xl">
                    <th className="p-3 border text-center">#</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("codigo")}>Código {mostrarFlecha("codigo")}</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("especie")}>Especie {mostrarFlecha("especie")}</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("raza")}>Raza {mostrarFlecha("raza")}</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("sexo")}>Sexo {mostrarFlecha("sexo")}</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("fechaNacimiento")}>Fecha Nac. {mostrarFlecha("fechaNacimiento")}</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("edad")}>Edad {mostrarFlecha("edad")}</th>
                    <th className="p-3 border text-center">
                      Estado
                      <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value as any); setPagina(1); }} className="ml-2 rounded px-1 text-black">
                        <option value="todos">Todos</option>
                        <option value="vivo">Vivo</option>
                        <option value="muerto">Muerto</option>
                        <option value="vendido">Vendido</option>
                      </select>
                    </th>
                    <th className="p-3 border text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginaActual.map((a, i) => {
                    const estaVivo = a.estado === "vivo";
                    const numero = (pagina - 1) * ITEMS_PAGINA + i + 1;
                    return (
                      <tr key={a.id} className={`border-b hover:bg-yellow-50 transition-colors ${!estaVivo ? "line-through text-gray-500" : ""}`}>
                        <td className="p-3 border text-center">{numero}</td>
                        <td className="p-3 border">{a.codigo}</td>
                        <td className="p-3 border">{a.especie}</td>
                        <td className="p-3 border">{a.raza}</td>
                        <td className="p-3 border">{a.sexo}</td>
                        <td className="p-3 border">{a.fechaNacimiento}</td>
                        <td className="p-3 border">{a.edad}</td>
                        <td className="p-3 border text-center">{a.estado}</td>
                        <td className="p-3 border flex flex-wrap gap-2 justify-center">
                          <button onClick={() => editarAnimal(a)} disabled={!estaVivo} className={`bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 ${!estaVivo ? "opacity-50 cursor-not-allowed" : ""}`}><FaEdit /></button>
                          <button onClick={() => eliminarAnimal(a)} disabled={!estaVivo} className={`bg-red-600 text-white p-2 rounded-full hover:bg-red-700 ${!estaVivo ? "opacity-50 cursor-not-allowed" : ""}`}><FaTrash /></button>
                          {!a.enReproduccion && a.sexo === "hembra" && <button onClick={() => mandarAReproduccion(a)} disabled={!estaVivo} className={`bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 text-sm ${!estaVivo ? "opacity-50 cursor-not-allowed" : ""}`}>Reproducción</button>}
                          {estaVivo && <>
                            <button onClick={() => marcarComoMuerto(a)} className="bg-gray-700 text-white px-2 py-1 rounded-lg hover:bg-gray-900 text-sm">Muerto</button>
                            <button onClick={() => marcarComoVendido(a)} className="bg-yellow-500 text-black px-2 py-1 rounded-lg hover:bg-yellow-600 text-sm">Vendido</button>
                          </>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPaginas > 1 && (
                <div className="flex justify-center mt-4 gap-2 flex-wrap">
                  <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="px-3 py-1 bg-teal-500 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Anterior</button>
                  <span className="px-3 py-1 bg-white rounded-lg">{pagina} / {totalPaginas}</span>
                  <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} className="px-3 py-1 bg-teal-500 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">Siguiente</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
