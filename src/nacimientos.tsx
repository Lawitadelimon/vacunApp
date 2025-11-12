import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { FaTrash, FaEdit, FaPlus, FaHome,  FaTimes, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import cowsBackground from "./assets/cows2.jpg";
import { getAuth, signOut } from "firebase/auth";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type Nacimiento = {
  id?: string;
  codigo: string;
  codigoMadre: string;
  codigoPadre: string;
  fechaNacimiento: string;
  raza: string;
  sexo: "Macho" | "Hembra";
  peso: string;
  estadoSalud: string;
};

type Lote = { id?: string; nombre: string };

export default function NacimientosPorLote() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [nacimientos, setNacimientos] = useState<Nacimiento[]>([]);
  const [formData, setFormData] = useState<Nacimiento>({
    codigo: "",
    codigoMadre: "",
    codigoPadre: "",
    fechaNacimiento: "",
    raza: "",
    sexo: "Macho",
    peso: "",
    estadoSalud: "",
  });
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const ITEMS_PAGINA = 40;
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const auth = getAuth();

  // ---------- SweetAlert2 helpers ----------
  const showError = (title: string, text: string) =>
    Swal.fire({ icon: "error", title, text, confirmButtonColor: "#DC2626" });
  const showSuccess = (title: string, text?: string) =>
    Swal.fire({ icon: "success", title, text, confirmButtonColor: "#10B981" });
  const showConfirm = async (title: string, text: string) => {
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#64748B",
    });
    return result.isConfirmed;
  };
  const showInput = async (title: string, inputLabel: string, inputValue: string = "") => {
    const { value } = await Swal.fire({
      title,
      input: "text",
      inputLabel,
      inputValue,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => !value && "El valor no puede estar vacío",
    });
    return value;
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // ---------- Carga de lotes y nacimientos ----------
  const cargarLotes = async () => {
    const snaps = await getDocs(collection(db, "lotes_nuevos"));
    const lista: Lote[] = snaps.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Lote) }));
    setLotes(lista);
    if (lista.length > 0 && !loteSeleccionado) setLoteSeleccionado(lista[0]);
  };

  const cargarNacimientos = async () => {
    if (!loteSeleccionado?.id) return;
    const snaps = await getDocs(collection(db, "lotes_nuevos", loteSeleccionado.id, "nacimientos"));
    const lista: Nacimiento[] = snaps.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Nacimiento) }));
    setNacimientos(lista);
  };

  useEffect(() => { cargarLotes(); }, []);
  useEffect(() => { cargarNacimientos(); setPagina(1); }, [loteSeleccionado]);

  // ---------- CRUD Nacimientos ----------
  const guardarNacimiento = async () => {
    if (!loteSeleccionado?.id) return;

    const campos = Object.values(formData);
    if (campos.some((c) => c === "")) return showError("Campos incompletos", "Completa todos los campos");

    try {
      if (formData.id) {
        await setDoc(doc(db, "lotes_nuevos", loteSeleccionado.id, "nacimientos", formData.id), formData);
        showSuccess("¡Nacimiento actualizado!", `Código: ${formData.codigo}`);
      } else {
        await addDoc(collection(db, "lotes_nuevos", loteSeleccionado.id, "nacimientos"), formData);
        showSuccess("¡Nacimiento registrado!", `Código: ${formData.codigo}`);
      }

      setFormData({
        codigo: "",
        codigoMadre: "",
        codigoPadre: "",
        fechaNacimiento: "",
        raza: "",
        sexo: "Macho",
        peso: "",
        estadoSalud: "",
      });

      cargarNacimientos();
    } catch {
      showError("Error", "No se pudo guardar el nacimiento");
    }
  };

  const editarNacimiento = (nac: Nacimiento) => setFormData(nac);

  const eliminarNacimiento = async (nac: Nacimiento) => {
    if (!loteSeleccionado?.id || !nac.id) return;
    const confirmado = await showConfirm("Eliminar nacimiento", `¿Eliminar nacimiento ${nac.codigo}?`);
    if (!confirmado) return;
    await deleteDoc(doc(db, "lotes_nuevos", loteSeleccionado.id, "nacimientos", nac.id));
    cargarNacimientos();
    showSuccess("¡Nacimiento eliminado!", nac.codigo);
  };

  // ---------- CRUD Lotes ----------
  const agregarLote = async () => {
    const nombre = await showInput("Agregar lote", "Nombre del lote");
    if (!nombre) return;
    const ref = await addDoc(collection(db, "lotes_nuevos"), { nombre });
    const nuevoLote = { id: ref.id, nombre };
    setLotes((prev) => [...prev, nuevoLote]);
    setLoteSeleccionado(nuevoLote);
    showSuccess("¡Lote agregado!", nombre);
  };

  const editarLote = async (lote: Lote) => {
    const nombre = await showInput("Editar lote", "Nuevo nombre del lote", lote.nombre);
    if (!nombre || !lote.id) return;
    await setDoc(doc(db, "lotes_nuevos", lote.id), { nombre });
    setLotes((prev) => prev.map((l) => (l.id === lote.id ? { ...l, nombre } : l)));
    if (loteSeleccionado?.id === lote.id) setLoteSeleccionado({ ...lote, nombre });
    showSuccess("¡Lote editado!", nombre);
  };

  const eliminarLote = async (lote: Lote) => {
    if (!lote.id) return;
    const confirmado = await showConfirm("Eliminar lote", `¿Eliminar lote ${lote.nombre}?`);
    if (!confirmado) return;
    await deleteDoc(doc(db, "lotes_nuevos", lote.id));
    setLotes((prev) => prev.filter((l) => l.id !== lote.id));
    if (loteSeleccionado?.id === lote.id) setLoteSeleccionado(null);
    showSuccess("¡Lote eliminado!", lote.nombre);
  };

  // ---------- Filtrado y paginación ----------
  const nacimientosFiltrados = nacimientos.filter((n) =>
    Object.values(n).some((val) => val.toString().toLowerCase().includes(busqueda.toLowerCase()))
  );
  const totalPaginas = Math.ceil(nacimientosFiltrados.length / ITEMS_PAGINA);
  const paginaActual = nacimientosFiltrados.slice((pagina - 1) * ITEMS_PAGINA, pagina * ITEMS_PAGINA);

  const inputClasses = "border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white/50";

  // ---------- Render ----------
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${cowsBackground})` }}></div>
      <div className="absolute inset-0 bg-white/20"></div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-pink-500 text-black flex items-center justify-between px-4 py-3 md:px-8 shadow-lg">
  <h1 className="text-xl md:text-2xl font-extrabold">Nacimientos</h1>

  {/* Desktop */}
  <div className="hidden md:flex items-center gap-4">
    <button onClick={() => navigate("/home")} className="hover:text-pink-300 transition">
      <FaHome size={20} />
    </button>
    <button
      onClick={handleLogout}
      className="bg-pink-600 text-black font-semibold px-3 py-1 rounded-xl hover:bg-pink-300"
    >
      Cerrar sesión
    </button>
  </div>

  {/* Mobile */}
  <div className="md:hidden relative">
    <button onClick={() => setMenuAbierto(!menuAbierto)} className="hover:text-pink-300">
      {menuAbierto ? <FaTimes size={22}/> : <FaBars size={22}/>}
    </button>

    {menuAbierto && (
      <div className="absolute right-0 mt-2 w-48 bg-white/40 rounded-xl shadow-lg py-3 flex flex-col items-center gap-2 z-50">
        <button onClick={() => { navigate("/home"); setMenuAbierto(false); }} className="w-5/7 py-2 rounded-xl bg-pink-400 hover:bg-pink-500 flex items-center font-semibold justify-center gap-2"> 
          <FaHome /> Inicio
        </button>
        
        <button onClick={() => { handleLogout(); setMenuAbierto(false); }} className="w-5/7 py-2 rounded-xl text-white bg-red-500 hover:bg-red-600 flex items-center font-semibold justify-center gap-2">
          Cerrar sesión
        </button>
      </div>
    )}
  </div>
</nav>


      {/* CONTENIDO */}
      <div className="relative p-4 md:p-9 flex flex-col md:flex-row gap-6 md:gap-9">
        {/* Lotes */}
        <div className="w-full md:w-1/6 bg-white/30 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow-xl h-auto md:h-[calc(100vh-6rem)] sticky top-24 flex flex-col gap-2 overflow-y-auto">
          <h2 className="text-black text-xl font-bold mb-4">Lotes</h2>
          {lotes.map((lote) => (
            <div key={lote.id} className="flex items-center justify-between gap-2">
              <button
                className={`flex-1 px-4 py-2 rounded-xl font-semibold text-center ${loteSeleccionado?.id === lote.id ? "bg-pink-600 text-black" : "bg-pink-500 text-white"} hover:bg-pink-600 transition`}
                onClick={() => setLoteSeleccionado(lote)}
              >
                {lote.nombre}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => editarLote(lote)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"><FaEdit size={14} /></button>
                <button onClick={() => eliminarLote(lote)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"><FaTrash size={14} /></button>
              </div>
            </div>
          ))}
          <button onClick={agregarLote} className="mt-2 bg-green-600 text-white px-3 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition"><FaPlus /> Agregar Lote</button>
        </div>

        {/* Nacimientos */}
        <div className="w-full md:w-5/6 flex flex-col gap-6">
          {/* Formulario */}
          {loteSeleccionado && (
            <div className="bg-white/30 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-xl">
              <h2 className="text-black text-xl font-bold mb-4">Registrar Nacimiento - {loteSeleccionado.nombre}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <input type="text" placeholder="Código" value={formData.codigo} onChange={(e) => setFormData(f => ({ ...f, codigo: e.target.value }))} className={inputClasses} />
                <input type="text" placeholder="Código madre" value={formData.codigoMadre} onChange={(e) => setFormData(f => ({ ...f, codigoMadre: e.target.value }))} className={inputClasses} />
                <input type="text" placeholder="Código padre" value={formData.codigoPadre} onChange={(e) => setFormData(f => ({ ...f, codigoPadre: e.target.value }))} className={inputClasses} />
                <input type="date" max={new Date().toISOString().split("T")[0]} value={formData.fechaNacimiento} onChange={(e) => setFormData(f => ({ ...f, fechaNacimiento: e.target.value }))} className={inputClasses} />
                <input type="text" placeholder="Raza" value={formData.raza} onChange={(e) => setFormData(f => ({ ...f, raza: e.target.value }))} className={inputClasses} />
                <select value={formData.sexo} onChange={(e) => setFormData(f => ({ ...f, sexo: e.target.value as "Macho" | "Hembra" }))} className={inputClasses}>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
                <input type="text" placeholder="Peso al nacer" value={formData.peso} onChange={(e) => setFormData(f => ({ ...f, peso: e.target.value }))} className={inputClasses} />
                <input type="text" placeholder="Estado de salud" value={formData.estadoSalud} onChange={(e) => setFormData(f => ({ ...f, estadoSalud: e.target.value }))} className={inputClasses} />
              </div>
              <button onClick={guardarNacimiento} className="mt-4 bg-pink-500 text-white px-6 py-2 rounded-2xl font-semibold hover:bg-pink-600 transition">Guardar</button>
            </div>
          )}

          {/* Tabla */}
          {loteSeleccionado && (
            <div className="bg-white/30 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-xl overflow-x-auto">
              <h2 className="text-black text-xl font-bold mb-4">Lista de nacimientos</h2>
              <input type="text" placeholder="Buscar..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${inputClasses} mb-4 w-full`} />

              <table className="w-full border-collapse text-left text-sm md:text-base">
                <thead>
                  <tr className="bg-pink-500 text-white">
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Código</th>
                    <th className="p-2 border">Madre</th>
                    <th className="p-2 border">Padre</th>
                    <th className="p-2 border">Fecha</th>
                    <th className="p-2 border">Raza</th>
                    <th className="p-2 border">Sexo</th>
                    <th className="p-2 border">Peso</th>
                    <th className="p-2 border">Estado</th>
                    <th className="p-2 border">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginaActual.map((nac, idx) => (
                    <tr key={nac.id} className="border-b hover:bg-yellow-50 transition">
                      <td className="p-2 border">{(pagina - 1) * ITEMS_PAGINA + idx + 1}</td>
                      <td className="p-2 border">{nac.codigo}</td>
                      <td className="p-2 border">{nac.codigoMadre}</td>
                      <td className="p-2 border">{nac.codigoPadre}</td>
                      <td className="p-2 border">{nac.fechaNacimiento}</td>
                      <td className="p-2 border">{nac.raza}</td>
                      <td className="p-2 border">{nac.sexo}</td>
                      <td className="p-2 border">{nac.peso}</td>
                      <td className="p-2 border">{nac.estadoSalud}</td>
                      <td className="p-2 border flex gap-2 justify-center flex-wrap">
                        <button onClick={() => editarNacimiento(nac)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"><FaEdit /></button>
                        <button onClick={() => eliminarNacimiento(nac)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"><FaTrash /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPaginas > 1 && (
                <div className="flex justify-center mt-4 gap-2 flex-wrap">
                  {Array.from({ length: totalPaginas }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1 rounded ${pagina === i + 1 ? "bg-pink-500 text-white" : "bg-pink-200 hover:bg-pink-300"}`}
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
      </div>

      {/* FOOTER */}
      <footer className="w-full bg-[#099757dc] py-3 md:py-4 text-center text-xs md:text-sm text-white fixed bottom-0 z-50">
        <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
