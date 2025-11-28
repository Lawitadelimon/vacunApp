import { useState, useEffect } from "react"; 
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { getAuth, signOut } from "firebase/auth";
import { 
  FaTrash, FaEdit, FaPlus, FaAppleAlt, FaHeart, FaSkull, FaMoneyBillWave, 
  FaHome,  FaTimes, FaBars 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import cowsBackground from "./assets/cows2.jpg";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type Animal = {
  id?: string;
  especie: string;
  codigo: string;
  raza: string;
  sexo: "macho" | "hembra";
  fechaNacimiento: string;
  edad: string;
  enReproduccion?: boolean;
  enNutricion?: boolean;
  estado?: "vivo" | "muerto" | "vendido" | "en nutricion" | "en reproduccion" | "en reproduccion y nutricion";
  precio?: number;
  fechaReproduccion?: string;
  fechaNutricion?: string;
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

  // ---------- FUNCIONES DE ALERTAS ----------
  const showError = (title: string, text: string) => Swal.fire({ icon: "error", title, text, confirmButtonColor: "#DC2626" });
  const showSuccess = (title: string, text?: string) => Swal.fire({ icon: "success", title, text, confirmButtonColor: "#10B981" });
  const showInfo = (title: string, text?: string) => Swal.fire({ icon: "info", title, text, confirmButtonColor: "#6B7280" });
  const showConfirm = async (title: string, text: string) => {
    const result = await Swal.fire({ title, text, icon: "warning", showCancelButton: true, confirmButtonText: "Sí", cancelButtonText: "Cancelar", confirmButtonColor: "#DC2626", cancelButtonColor: "#64748B" });
    return result.isConfirmed;
  };

  // ---------- FUNCIONES CRUD ----------
  const guardarAnimal = async () => {
  if (!loteSeleccionado) return;
  const user = auth.currentUser; if (!user) return;

  if (!formData.especie || !formData.codigo || !formData.raza || !formData.sexo || !formData.fechaNacimiento) 
    return showError("Campos incompletos", "Completa todos los campos");

  if (new Date(formData.fechaNacimiento) > new Date()) 
    return showError("Fecha inválida", "La fecha de nacimiento no puede ser futura");

  const edad = calcularEdad(formData.fechaNacimiento);
  const datos: Animal & { uid: string } = { ...formData, edad, uid: user.uid, estado: formData.estado || "vivo" };

  try {
    // 🔹 Validar que el código no exista
    const q = query(
      collection(db, "lotes", loteSeleccionado.id!, "animales"),
      where("codigo", "==", formData.codigo)
    );
    const snap = await getDocs(q);

    if (snap.docs.length > 0 && !formData.id) {
      return showError("Animal duplicado", `Ya existe un animal con el código ${formData.codigo}`);
    }

    if (formData.id) {
      await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", formData.id), datos);
    } else {
      await addDoc(collection(db, "lotes", loteSeleccionado.id!, "animales"), datos);
    }

    setFormData({ especie: "", codigo: "", raza: "", sexo: "macho", fechaNacimiento: "", edad: "", estado: "vivo" });
    cargarAnimales();
    showSuccess("¡Animal registrado!", `${datos.codigo} se guardó correctamente`);
  } catch {
    showError("Error", "No se pudo guardar el animal");
  }
};


  const editarAnimal = (animal: Animal) => setFormData(animal);

  const eliminarAnimal = async (animal: Animal) => {
    if (!loteSeleccionado || !animal.id) return;
    const confirm = await showConfirm(`Eliminar ${animal.codigo}?`, "Esta acción no se puede deshacer");
    if (!confirm) return;
    await deleteDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id));
    cargarAnimales();
    showSuccess("¡Eliminado!", `${animal.codigo} fue eliminado correctamente`);
  };

 const marcarComoMuerto = async (animal: Animal) => {
  if (!loteSeleccionado || !animal.id) return;

  if (animal.estado === "muerto") return showError("Operación inválida", `${animal.codigo} ya está marcado como muerto`);
  if (animal.estado === "vendido") return showError("Operación inválida", `${animal.codigo} ya fue vendido`);

  const confirm = await showConfirm(`¿Marcar ${animal.codigo} como muerto?`, "");
  if (!confirm) return;

  await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), 
    { estado: "muerto", fechaMuerte: new Date().toISOString().split("T")[0] }, 
    { merge: true }
  );

  cargarAnimales();
  showInfo("Animal marcado como muerto");
};

  const marcarComoVendido = async (animal: Animal) => {
  if (!loteSeleccionado || !animal.id) return;

  if (animal.estado === "vendido") return showError("Operación inválida", `${animal.codigo} ya está vendido`);
  if (animal.estado === "muerto") return showError("Operación inválida", `${animal.codigo} está muerto y no se puede vender`);

  const confirm = await showConfirm(`¿Marcar ${animal.codigo} como vendido?`, "");
  if (!confirm) return;

  await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), 
    { estado: "vendido", fechaVenta: new Date().toISOString().split("T")[0] }, 
    { merge: true }
  );

  cargarAnimales();
  showSuccess("Animal vendido");
};

  const mandarAReproduccion = async (animal: Animal) => {
  if (!loteSeleccionado || !animal.id) return;
  if (animal.estado === "muerto" || animal.estado === "vendido") 
    return showError("Operación inválida", "No se puede modificar un animal muerto o vendido");
  if (animal.sexo !== "hembra") 
    return showError("Operación inválida", "Solo se puede mandar a reproducción a hembras");

  const nuevoEstado: Animal = {
    ...animal,
    enReproduccion: true,
    fechaReproduccion: new Date().toISOString().split("T")[0],
    // Mantener la información de nutrición si ya existe
    estado: animal.enNutricion ? "en reproduccion y nutricion" : "en reproduccion"
  };

  await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), nuevoEstado, { merge: true });
  setAnimales(prev => prev.map(a => a.id === animal.id ? nuevoEstado : a));
  showSuccess("Animal en reproducción");
};


  const mandarAAlimentacion = async (animal: Animal) => {
  if (!loteSeleccionado || !animal.id) return;
  if (animal.estado === "muerto" || animal.estado === "vendido") 
    return showError("Operación inválida", "No se puede modificar un animal muerto o vendido");

  const nuevoEstado: Animal = {
    ...animal,
    enNutricion: true,
    fechaNutricion: new Date().toISOString().split("T")[0],
    // Mantener la información de reproducción si ya existe
    estado: animal.enReproduccion ? "en reproduccion y nutricion" : "en nutricion"
  };
  await setDoc(doc(db, "lotes", loteSeleccionado.id!, "animales", animal.id), nuevoEstado, { merge: true });
  setAnimales(prev => prev.map(a => a.id === animal.id ? nuevoEstado : a));
  showSuccess("Animal en nutrición");
};

  // ---------- FILTRADO Y ORDEN ----------
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
      <nav className="sticky top-0 z-50 bg-teal-500 text-black  flex items-center justify-between px-4 py-3 shadow-lg">
        <h1 className="text-lg md:text-2xl font-extrabold">Gestión de Animales por Lote</h1>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="hover:text-teal-300 transition"><FaHome size={20} /></button>
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

  <h2 className="text-black text-xl font-bold mb-4">Lotes </h2>
  

  {lotes.map(lote => (
    <div
      key={lote.id}
      className={`flex items-center justify-between px-4 py-2 rounded-xl font-semibold ${loteSeleccionado?.id === lote.id ? "bg-teal-700 text-black" : "bg-teal-500 text-white"} hover:bg-teal-600 transition`}
    >
      <button
        className="text-left flex-1"
        onClick={() => { setLoteSeleccionado(lote); setPagina(1); }}
      >
        {lote.nombre}
      </button>
      
      <div className="flex gap-2">
        <button
          onClick={async () => {
            const { value: nombreNuevo } = await Swal.fire({
              title: 'Editar Lote',
              input: 'text',
              inputLabel: 'Nombre del lote',
              inputValue: lote.nombre,
              showCancelButton: true,
              confirmButtonText: 'Guardar',
              cancelButtonText: 'Cancelar',
              inputValidator: (value) => !value && 'El nombre no puede estar vacío'
            });
            if (nombreNuevo) {
              await setDoc(doc(db, "lotes", lote.id!), { nombre: nombreNuevo }, { merge: true });
              cargarLotes();
              Swal.fire('¡Editado!', 'El lote fue actualizado', 'success');
            }
          }}
          className="text-blue-600 hover:text-blue-800"
          title="Editar Lote"
        >
          <FaEdit />
        </button>

        <button
          onClick={async () => {
            const confirm = await Swal.fire({
              title: 'Eliminar lote',
              text: `¿Eliminar el lote ${lote.nombre}? Esta acción no se puede deshacer`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#DC2626',
              cancelButtonColor: '#64748B',
              confirmButtonText: 'Sí',
              cancelButtonText: 'Cancelar'
            });
            if (confirm.isConfirmed && lote.id) {
              await deleteDoc(doc(db, "lotes", lote.id));
              if (loteSeleccionado?.id === lote.id) setLoteSeleccionado(null);
              cargarLotes();
              Swal.fire('¡Eliminado!', 'El lote fue eliminado', 'success');
            }
          }}
          className="text-red-600 hover:text-red-800"
          title="Eliminar Lote"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  ))}

  <button
  onClick={async () => {
    const { value: nombreLote } = await Swal.fire({
      title: 'Nuevo Lote',
      input: 'text',
      inputLabel: 'Nombre del lote',
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => !value && 'El nombre no puede estar vacío'
    });

    if (nombreLote) {
      const user = auth.currentUser;
      if (!user) return;

      try {
        await addDoc(collection(db, "lotes"), { nombre: nombreLote, uid: user.uid });
        cargarLotes();
        Swal.fire('¡Creado!', 'El lote se creó correctamente', 'success');
      } catch (error) {
        Swal.fire('Error', 'No se pudo crear el lote', 'error');
      }
    }
  }}
  className="mt-2 bg-green-600 text-white font-semibold px-3 py-1 rounded-xl flex items-center gap-2 hover:bg-green-700 transition"
>
  <FaPlus /> Agregar Lote
</button>

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
      className={`text-blue-600 hover:text-blue-800 ${a.estado === "muerto" || a.estado === "vendido" ? "opacity-50 cursor-not-allowed" : ""}`}
      title="Editar"
      disabled={a.estado === "muerto" || a.estado === "vendido"}
    >
      <FaEdit />
    </button>

    <button
      onClick={() => eliminarAnimal(a)}
      className={`text-red-600 hover:text-red-800 ${a.estado === "muerto" || a.estado === "vendido" ? "opacity-50 cursor-not-allowed" : ""}`}
      title="Eliminar"
      disabled={a.estado === "muerto" || a.estado === "vendido"}
    >
      <FaTrash />
    </button>

    <button
      onClick={() => mandarAReproduccion(a)}
      className={`text-pink-600 hover:text-pink-800 ${a.estado === "muerto" || a.estado === "vendido" ? "opacity-50 cursor-not-allowed" : ""}`}
      title="Mandar a reproducción"
      disabled={a.estado === "muerto" || a.estado === "vendido"}
    >
      <FaHeart />
    </button>

    <button
      onClick={() => marcarComoMuerto(a)}
      className={`text-gray-700 hover:text-gray-900 ${a.estado === "muerto" || a.estado === "vendido" ? "opacity-50 cursor-not-allowed" : ""}`}
      title="Marcar como muerto"
      disabled={a.estado === "muerto" || a.estado === "vendido"}
    >
      <FaSkull />
    </button>

    <button
      onClick={() => marcarComoVendido(a)}
      className={`text-green-700 hover:text-green-900 ${a.estado === "muerto" || a.estado === "vendido" ? "opacity-50 cursor-not-allowed" : ""}`}
      title="Marcar como vendido"
      disabled={a.estado === "muerto" || a.estado === "vendido"}
    >
      <FaMoneyBillWave />
    </button>

    <button
      onClick={() => mandarAAlimentacion(a)}
      className={`text-orange-600 hover:text-orange-800 ${a.estado === "muerto" || a.estado === "vendido" ? "opacity-50 cursor-not-allowed" : ""}`}
      title="Mandar a nutricion"
      disabled={a.estado === "muerto" || a.estado === "vendido"}
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
