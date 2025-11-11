import { useState, useEffect } from "react"; 
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth, signOut } from "firebase/auth";
import { 
  FaTrash, FaEdit, FaPlus, FaAppleAlt, FaHeart, FaSkull, FaMoneyBillWave, 
  FaHome, FaBell, FaTimes, FaBars 
} from "react-icons/fa";
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
  estado?: "vivo" | "muerto" | "vendido" | "en nutricion";
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
  const [filtroEstado, setFiltroEstado] = useState<string>("");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();
  const ITEMS_PAGINA = 40;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

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
    await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), { estado: "muerto", fechaMuerte: new Date().toISOString().split("T")[0] }, { merge: true });
    cargarAnimales();
  };

  const marcarComoVendido = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    if (!confirm(`¿Marcar ${animal.codigo} como vendido?`)) return;
    await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), { estado: "vendido", fechaVenta: new Date().toISOString().split("T")[0] }, { merge: true });
    cargarAnimales();
  };

  const mandarAReproduccion = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), { ...animal, enReproduccion: true }, { merge: true });
    cargarAnimales();
  };

  const mandarAAlimentacion = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), { ...animal, estado: "en nutricion" }, { merge: true });
    setAnimales(prev => prev.map(a => (a.id === animal.id ? { ...a, estado: "en nutricion" } : a)));
  };

  const toggleOrden = (campo: keyof Animal) => setOrden(prev => ({ campo, asc: prev.campo === campo ? !prev.asc : true }));
  const mostrarFlecha = (campo: keyof Animal) => orden.campo !== campo ? "⇅" : orden.asc ? "▲" : "▼";

  const animalesFiltrados = animales
    .filter(a => filtroEstado === "" || 
      (filtroEstado === "en reproduccion" && a.enReproduccion) ||
      (filtroEstado === "en nutricion" && a.estado === "en nutricion") ||
      a.estado === filtroEstado
    )
    .filter(a => [a.especie, a.codigo, a.raza, a.sexo, a.fechaNacimiento, a.edad].some(c => c.toLowerCase().includes(busqueda.toLowerCase())))
    .sort((a, b) => {
      if (!orden.campo) return 0;
      const valA = a[orden.campo!] || "", valB = b[orden.campo!] || "";
      return orden.asc ? valA.toString().localeCompare(valB.toString()) : valB.toString().localeCompare(valA.toString());
    });

  const paginaActual = animalesFiltrados.slice((pagina - 1) * ITEMS_PAGINA, pagina * ITEMS_PAGINA);
  const totalPaginas = Math.ceil(animalesFiltrados.length / ITEMS_PAGINA);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Fondo */}
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${cowsBackground})` }} />
      <div className="absolute inset-0 bg-white/20" />

      {/* Barra de navegación */}
      <nav className="sticky top-0 z-50 bg-teal-500 text-black flex items-center justify-between px-4 py-3 shadow-lg">
        <h1 className="text-lg md:text-2xl font-extrabold">Gestión de Animales por Lote</h1>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="hover:text-teal-300 transition"><FaHome size={20} /></button>
          <button onClick={() => navigate("/notificaciones")} className="hover:text-teal-300 transition"><FaBell size={20} /></button>
          <button onClick={() => navigate("/estadisticas")} className="bg-teal-400 text-black font-semibold px-3 py-1 rounded-xl shadow-inner hover:bg-teal-600 transition">
            📊 Estadísticas
          </button>
          <button onClick={handleLogout} className="bg-teal-400 text-black font-semibold px-3 py-1 rounded-xl hover:bg-teal-600 transition">
            Cerrar sesión
          </button>
        </div>

        {/* Menú móvil */}
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="md:hidden hover:text-teal-200 transition">
          {menuAbierto ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        {menuAbierto && (
          <div className="absolute top-full right-0 bg-white/40 text-black w-56 rounded-b-2xl shadow-lg md:hidden flex flex-col items-center py-2 gap-2 animate-fadeIn">
            <button onClick={() => { navigate("/home"); setMenuAbierto(false); }} className="w-5/7 py-2 rounded-lg bg-teal-300 hover:bg-teal-400 flex items-center font-semibold justify-center gap-2">
              <FaHome /> Inicio
            </button>
            <button onClick={() => { navigate("/notificaciones"); setMenuAbierto(false); }} className="w-5/7 py-2 rounded-xl bg-teal-300 hover:bg-teal-400 flex items-center font-semibold justify-center gap-2">
              <FaBell /> Notificaciones
            </button>
            <button onClick={() => { navigate("/estadisticas"); setMenuAbierto(false); }} className="w-5/7 py-2 rounded-xl bg-teal-300 hover:bg-teal-400 flex items-center font-semibold justify-center gap-2">
              📊 Estadísticas
            </button>
            <button onClick={() => { handleLogout(); setMenuAbierto(false); }} className="w-5/7 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center font-semibold justify-center gap-2">
                Cerrar sesión
            </button>
          </div>
        )}
      </nav>

      {/* Contenido principal */}
      <div className="relative flex flex-col md:flex-row gap-6 p-4 md:p-9 flex-1 overflow-hidden">
        {/* Lotes */}
        <div className="w-full md:w-1/6 bg-white/30 backdrop-blur-md border border-white/40 p-4 rounded-3xl shadow-lg flex flex-col gap-2 overflow-y-auto">
        
          <h2 className="  text-black text-xl font-bold mb-4">Lotes </h2>
          {lotes.map(lote => (
            <button
              key={lote.id}
              className={` px-4 py-2 rounded-xl font-semibold text-left ${loteSeleccionado?.id === lote.id ? "bg-teal-700 text-black  " : "bg-teal-500 text-white"} hover:bg-teal-600 transition`}
              onClick={() => { setLoteSeleccionado(lote); setPagina(1); }}
            >
              {lote.nombre}
            </button>
          ))}
          <button className=" w-6/24 mt-2 bg-green-600 text-white font-semibold px-3 py-1 rounded-xl flex items-center gap-2 hover:bg-green-700 transition"><FaPlus /> Agregar Lote</button>
        </div>

        {/* Contenido derecho */}
        <div className="w-full md:w-3/4 flex flex-col gap-6 overflow-y-auto pb-20">
          {/* Formulario */}
          {loteSeleccionado && (
            <div className="bg-white/30 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-black">Registrar Animal</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <select value={formData.especie} onChange={e => setFormData(f => ({ ...f, especie: e.target.value }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Selecciona especie</option>
                  <option value="Bovino">Bovino</option>
                  <option value="Ovino">Ovino</option>
                  <option value="Caprino">Caprino</option>
                  <option value="Porcino">Porcino</option>
                  <option value="Equino">Equino</option>
                </select>
                <input type="text" placeholder="Código" value={formData.codigo} onChange={e => setFormData(f => ({ ...f, codigo: e.target.value }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"/>
                <input type="text" placeholder="Raza" value={formData.raza} onChange={e => setFormData(f => ({ ...f, raza: e.target.value }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"/>
                <select value={formData.sexo} onChange={e => setFormData(f => ({ ...f, sexo: e.target.value as "macho" | "hembra" }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="macho">Macho</option>
                  <option value="hembra">Hembra</option>
                </select>
                <input type="date" max={new Date().toISOString().split("T")[0]} value={formData.fechaNacimiento} onChange={e => setFormData(f => ({ ...f, fechaNacimiento: e.target.value }))} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"/>
              </div>
              <button onClick={guardarAnimal} className="mt-4 bg-teal-500 text-white px-6 py-2 rounded-2xl font-semibold hover:bg-teal-700 transition-shadow shadow-md hover:shadow-xl">Guardar</button>
            </div>
          )}

          {/* Filtro y tabla */}
          {loteSeleccionado && (
            <div className="bg-white/30 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-lg overflow-x-auto">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-xl font-bold text-black">Lista de Animales - {loteSeleccionado.nombre}</h2>
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="">Todos</option>
                  <option value="vivo">Vivo</option>
                  <option value="en nutricion">En nutrición</option>
                  <option value="en reproduccion">En reproducción</option>
                  <option value="muerto">Muerto</option>
                  <option value="vendido">Vendido</option>
                </select>
              </div>

              <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full mb-4 px-4 py-2 rounded-lg border border-white/50 bg-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400"/>

              <table className="min-w-[600px] w-full border-collapse text-left">
                <thead>
                  <tr className="bg-teal-500 text-white rounded-t-xl">
                    <th className="p-3 border text-center">#</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("codigo")}>Código {mostrarFlecha("codigo")}</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("especie")}>Especie {mostrarFlecha("especie")}</th>
                    <th className="p-3 border cursor-pointer" onClick={() => toggleOrden("raza")}>Raza {mostrarFlecha("raza")}</th>
                    <th className="p-3 border">Sexo</th>
                    <th className="p-3 border">Edad</th>
                    <th className="p-3 border">Estado</th>
                    <th className="p-3 border text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
  {paginaActual.map((a, i) => (
    <tr
      key={a.id}
      className={`hover:bg-teal-100 transition text-black ${
        a.estado === "muerto" || a.estado === "vendido"
          ? "line-through opacity-60"
          : ""
      }`}
    >
      <td className="p-3 border text-center">
        {(pagina - 1) * ITEMS_PAGINA + i + 1}
      </td>
      <td className="p-3 border">{a.codigo}</td>
      <td className="p-3 border">{a.especie}</td>
      <td className="p-3 border">{a.raza}</td>
      <td className="p-3 border text-center">{a.sexo}</td>
      <td className="p-3 border">{a.edad}</td>
      <td className="p-3 border text-center capitalize">{a.estado}</td>
      <td className="p-3 border text-center">
        <div className="flex flex-wrap gap-1 justify-center">
          <button
            onClick={() => editarAnimal(a)}
            className="text-blue-600 hover:text-blue-800"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => eliminarAnimal(a)}
            className="text-red-600 hover:text-red-800"
          >
            <FaTrash />
          </button>
          <button
            onClick={() => mandarAReproduccion(a)}
            className="text-pink-600 hover:text-pink-800"
          >
            <FaHeart />
          </button>
          <button
            onClick={() => marcarComoMuerto(a)}
            className="text-gray-700 hover:text-gray-900"
          >
            <FaSkull />
          </button>
          <button
            onClick={() => marcarComoVendido(a)}
            className="text-green-700 hover:text-green-900"
          >
            <FaMoneyBillWave />
          </button>
          <button
            onClick={() => mandarAAlimentacion(a)}
            className="text-orange-600 hover:text-orange-800"
          >
            <FaAppleAlt />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>

              </table>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button disabled={pagina === 1} onClick={() => setPagina(pagina - 1)} className="bg-teal-500 text-white px-3 py-1 rounded-xl disabled:opacity-50 hover:bg-teal-700">Anterior</button>
                  <span className="text-black font-semibold">Página {pagina} de {totalPaginas}</span>
                  <button disabled={pagina === totalPaginas} onClick={() => setPagina(pagina + 1)} className="bg-teal-500 text-white px-3 py-1 rounded-xl disabled:opacity-50 hover:bg-teal-700">Siguiente</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
