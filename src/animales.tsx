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
};

type Lote = {
  id?: string;
  nombre: string;
};

export default function AnimalesPorLote() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [formData, setFormData] = useState<Animal>({
    especie: "",
    codigo: "",
    raza: "",
    sexo: "macho",
    fechaNacimiento: "",
    edad: "",
  });

  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<{ campo: keyof Animal | null; asc: boolean }>({ campo: null, asc: true });

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
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "lotes"), where("uid", "==", user.uid));
    const snaps = await getDocs(q);
    const lotesDB = snaps.docs.map(doc => ({ id: doc.id, ...(doc.data() as Lote) }));
    setLotes(lotesDB);
    if (lotesDB.length > 0 && !loteSeleccionado) setLoteSeleccionado(lotesDB[0]);
  };

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

  const guardarAnimal = async () => {
    if (!loteSeleccionado) return;
    const user = auth.currentUser;
    if (!user) return;
    if (!formData.especie || !formData.codigo || !formData.raza || !formData.sexo || !formData.fechaNacimiento)
      return alert("Completa todos los campos");
    if (new Date(formData.fechaNacimiento) > new Date()) return alert("La fecha no puede ser futura");

    const edad = calcularEdad(formData.fechaNacimiento);
    const datos: Animal & { uid: string } = { ...formData, edad, uid: user.uid };

    if (formData.id) {
      await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", formData.id), datos);
    } else {
      await addDoc(collection(db, "lotes", loteSeleccionado.id!, "animales"), datos);
    }

    setFormData({ especie: "", codigo: "", raza: "", sexo: "macho", fechaNacimiento: "", edad: "" });
    cargarAnimales();
  };

  const editarAnimal = (animal: Animal) => setFormData(animal);

  const eliminarAnimal = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    if (!confirm(`Eliminar ${animal.codigo}?`)) return;
    await deleteDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id));
    cargarAnimales();
  };

  // Calcular fecha probable de parto según especie
  const calcularFechaParto = (fechaInseminacion: string, especie: string) => {
    const duraciones: Record<string, number> = {
      Bovino: 283,
      Ovino: 147,
      Caprino: 150,
      Porcino: 115,
      Equino: 340,
    };
    const diasGestacion = duraciones[especie] || 0;
    if (!fechaInseminacion || diasGestacion === 0) return "";
    const fecha = new Date(fechaInseminacion);
    fecha.setDate(fecha.getDate() + diasGestacion);
    return fecha.toISOString().split("T")[0];
  };

  const mandarAReproduccion = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    const fechaPosibleParto = calcularFechaParto(new Date().toISOString().split("T")[0], animal.especie);
    await setDoc(
      doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id),
      { ...animal, enReproduccion: true, fechaPosibleParto },
      { merge: true }
    );
    cargarAnimales();
  };

  const animalesFiltrados = animales
    .filter(a =>
      a.especie.toLowerCase().includes(busqueda.toLowerCase()) ||
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
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${cowsBackground})` }}></div>
      <div className="absolute inset-0 bg-white/20"></div>

      <div className="sticky top-0 z-50 bg-teal-500 text-black p-4 flex items-center gap-4 shadow-md">
        <button onClick={() => navigate(-1)} className="hover:text-teal-700 transition"><FaArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold ">Gestión de Animales por Lote</h1>
      </div>

      <div className="relative p-6 md:p-9 flex flex-col md:flex-row gap-6 md:gap-9">
        {/* Lotes */}
        <div className="w-full md:w-1/6 bg-white/80 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow-xl h-auto md:h-[calc(100vh-6rem)] sticky top-24 flex flex-col gap-2 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Lotes</h2>
          {lotes.map(lote => (
            <button key={lote.id} className={`px-4 py-2 rounded-lg font-semibold text-left ${loteSeleccionado?.id === lote.id ? "bg-teal-700 text-white" : "bg-teal-500 text-white"}`} onClick={() => setLoteSeleccionado(lote)}>
              {lote.nombre}
            </button>
          ))}
          <button onClick={() => {}} className="mt-2 bg-green-600 text-white px-3 py-1 gap-1 rounded-lg flex items-center gap-2"><FaPlus /> Agregar Lote</button>
        </div>

        {/* Contenido principal */}
        <div className="w-full md:w-3/4 flex flex-col gap-6">
          {loteSeleccionado && (
            <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-bold mb-4">Registrar Animal</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <select value={formData.especie} onChange={e => setFormData(f => ({ ...f, especie: e.target.value }))} className="border px-4 py-2 rounded-lg">
                  <option value="">Selecciona especie</option>
                  <option value="Bovino">Bovino</option>
                  <option value="Ovino">Ovino</option>
                  <option value="Caprino">Caprino</option>
                  <option value="Porcino">Porcino</option>
                  <option value="Equino">Equino</option>
                </select>
                <input type="text" placeholder="Código del animal" value={formData.codigo} onChange={e => setFormData(f => ({ ...f, codigo: e.target.value }))} className="border px-4 py-2 rounded-lg" />
                <input type="text" placeholder="Raza del animal" value={formData.raza} onChange={e => setFormData(f => ({ ...f, raza: e.target.value }))} className="border px-4 py-2 rounded-lg" />
                <select value={formData.sexo} onChange={e => setFormData(f => ({ ...f, sexo: e.target.value as "macho" | "hembra" }))} className="border px-4 py-2 rounded-lg">
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
                <input type="date" max={new Date().toISOString().split("T")[0]} value={formData.fechaNacimiento} onChange={e => setFormData(f => ({ ...f, fechaNacimiento: e.target.value }))} className="border px-4 py-2 rounded-lg" />
              </div>
              <button onClick={guardarAnimal} className="mt-4 bg-teal-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-teal-700 transition">Guardar</button>
            </div>
          )}

          {loteSeleccionado && (
            <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-xl overflow-x-auto">
              <h2 className="text-xl font-bold mb-4">Lista de {loteSeleccionado.nombre}</h2>
              <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="border px-4 py-2 rounded-lg mb-4 w-full" />

              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-teal-500 text-white">
                    <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("codigo")}>Código</th>
                    <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("especie")}>Especie</th>
                    <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("raza")}>Raza</th>
                    <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("sexo")}>Sexo</th>
                    <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("fechaNacimiento")}>Fecha Nac.</th>
                    <th className="p-2 border cursor-pointer" onClick={() => toggleOrden("edad")}>Edad</th>
                    <th className="p-2 border text-center">Reproducción</th>
                    <th className="p-2 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginaActual.map((a, idx) => (
                    <tr key={a.id} className="border-b hover:bg-yellow-50">
                      <td className="p-2 border">{a.codigo}</td>
                      <td className="p-2 border">{a.especie}</td>
                      <td className="p-2 border">{a.raza}</td>
                      <td className="p-2 border">{a.sexo}</td>
                      <td className="p-2 border">{a.fechaNacimiento}</td>
                      <td className="p-2 border">{a.edad}</td>
                      <td className="p-2 border text-center">{a.enReproduccion ? "En Reproducción" : "-"}</td>
                      <td className="p-2 border flex gap-2 flex-wrap">
                        <button onClick={() => editarAnimal(a)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"><FaEdit /></button>
                        <button onClick={() => eliminarAnimal(a)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"><FaTrash /></button>
                        {!a.enReproduccion && a.sexo === "hembra" && (
                          <button onClick={() => mandarAReproduccion(a)} className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition">Mandar a Reproducción</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPaginas > 1 && (
                <div className="flex justify-center mt-4 gap-2 flex-wrap">
                  {Array.from({ length: totalPaginas }, (_, i) => (
                    <button key={i + 1} className={`px-3 py-1 rounded ${pagina === i + 1 ? "bg-teal-600 text-white" : "bg-teal-400"}`} onClick={() => setPagina(i + 1)}>{i + 1}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
