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
  const [errores, setErrores] = useState({
  codigo: "",
  codigoMadre: "",
  codigoPadre: "",
  fechaNacimiento: "",
  raza: "",
  peso: "",
  estadoSalud: ""
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
  const formularioInvalido = () => {
  // Campos obligatorios vacíos
  if (
    !formData.codigo ||
    !formData.codigoMadre ||
    !formData.codigoPadre ||
    !formData.fechaNacimiento ||
    !formData.raza ||
    !formData.peso ||
    !formData.estadoSalud
  ) {
    return true;
  }

  // Si hay errores activos
  if (Object.values(errores).some(e => e !== "")) {
    return true;
  }

  // Si está editando y no hubo cambios
  if (formData.id) {
    const original = nacimientos.find(n => n.id === formData.id);
    if (original && JSON.stringify(original) === JSON.stringify(formData)) {
      return true;
    }
  }

  return false;
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
  const user = auth.currentUser;
  if (!user) return;

  const snaps = await getDocs(
    collection(db, "usuarios", user.uid, "lotes")
  );

  const lista: Lote[] = snaps.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Lote),
  }));

  setLotes(lista);

  if (lista.length > 0 && !loteSeleccionado)
    setLoteSeleccionado(lista[0]);
};

  const cargarNacimientos = async () => {
  const user = auth.currentUser;
  if (!user || !loteSeleccionado?.id) return;

  const snaps = await getDocs(
    collection(
      db,
      "usuarios",
      user.uid,
      "lotes",
      loteSeleccionado.id,
      "nacimientos"
    )
  );

  setNacimientos(
    snaps.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Nacimiento),
    }))
  );
};
  useEffect(() => { cargarLotes(); }, []);
  useEffect(() => { cargarNacimientos(); setPagina(1); }, [loteSeleccionado]);

  const validarCampo = (campo: string, valor: string) => {
  let error = "";

  // Solo letras, números y guiones, sin espacios
  if (campo === "codigo" || campo === "codigoMadre" || campo === "codigoPadre") {
    if (!valor) error = "Campo obligatorio";
    else if (!/^[A-Za-z0-9-]+$/.test(valor))
      error = "Solo letras, números y guion medio (sin espacios)";
  }

  // Solo letras
  if (campo === "raza" || campo === "estadoSalud") {
    if (!valor) error = "Campo obligatorio";
    else if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(valor))
      error = "Solo letras permitidas";
  }

  // Solo números
  if (campo === "peso") {
    if (!valor) error = "Campo obligatorio";
    else if (!/^[0-9]+$/.test(valor))
      error = "Solo números permitidos";
  }

  // Fecha no futura
  if (campo === "fechaNacimiento") {
    if (!valor) error = "Campo obligatorio";
    else if (new Date(valor) > new Date())
      error = "No puede ser una fecha futura";
  }

  setErrores(prev => ({ ...prev, [campo]: error }));
};
  // ---------- CRUD Nacimientos ----------
  const guardarNacimiento = async () => {
  const user = auth.currentUser;
  if (!user || !loteSeleccionado?.id) return;

  if (Object.values(formData).some(v => v === ""))
    return showError("Campos incompletos", "Completa todos los campos");

  try {
    if (formData.id) {
      await setDoc(
        doc(
          db,
          "usuarios",
          user.uid,
          "lotes",
          loteSeleccionado.id,
          "nacimientos",
          formData.id
        ),
        formData
      );
    } else {
      await addDoc(
        collection(
          db,
          "usuarios",
          user.uid,
          "lotes",
          loteSeleccionado.id,
          "nacimientos"
        ),
        formData
      );
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
    showSuccess("Guardado correctamente");

  } catch {
    showError("Error", "No se pudo guardar");
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
  const user = auth.currentUser;
  if (!user) return;

  const { value: nombre } = await Swal.fire({
    title: "Agregar lote",
    input: "text",
    confirmButtonText: "Guardar",
    inputValidator: value => {
      if (!value) return "Nombre obligatorio";

      if (!/^[AZaz09]+$/.test(value))
        return "Solo letras y números";

      if (lotes.some(l =>
        l.nombre.toLowerCase() === value.toLowerCase()
      ))
        return "Ya existe ese lote";

      return null;
    }
  });

  if (!nombre) return;

  const ref = await addDoc(
    collection(db, "usuarios", user.uid, "lotes"),
    { nombre }
  );

  setLotes(prev => [...prev, { id: ref.id, nombre }]);
};
  const editarLote = async (lote: Lote) => {
  const user = auth.currentUser;
  if (!user || !lote.id) return;

  const { value: nombre } = await Swal.fire({
    title: "Editar lote",
    input: "text",
    inputValue: lote.nombre,
    confirmButtonText: "Guardar",
    inputValidator: value => {
      if (!value) return "Nombre obligatorio";

      if (value === lote.nombre)
        return "No hubo cambios";

      return null;
    }
  });

  if (!nombre) return;

  await setDoc(
    doc(db, "usuarios", user.uid, "lotes", lote.id),
    { nombre }
  );

  setLotes(prev =>
    prev.map(l =>
      l.id === lote.id ? { ...l, nombre } : l
    )
  );

  showSuccess("Lote actualizado");
};

  const eliminarLote = async (lote: Lote) => {
  const user = auth.currentUser;
  if (!user || !lote.id) return;

  const confirm = await showConfirm(
    "Eliminar lote",
    "¿Seguro?"
  );

  if (!confirm) return;

  await deleteDoc(
    doc(db, "usuarios", user.uid, "lotes", lote.id)
  );

  setLotes(prev => prev.filter(l => l.id !== lote.id));

  if (loteSeleccionado?.id === lote.id)
    setLoteSeleccionado(null);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-black mb-1">Código</label>
    <input
  type="text"
  value={formData.codigo}
  onChange={(e) => {
    const valor = e.target.value
      .replace(/\s/g, "")
      .replace(/[^A-Za-z0-9-]/g, "");

    setFormData(f => ({ ...f, codigo: valor }));
    validarCampo("codigo", valor);
  }}
  className={`${inputClasses} ${errores.codigo ? "border-red-500" : ""}`}
/>
{errores.codigo && <p className="text-red-600 text-sm">{errores.codigo}</p>}
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-black mb-1">Código Madre</label>
    <input
  type="text"
  value={formData.codigoMadre}
  onChange={(e) => {
    const valor = e.target.value
      .replace(/\s/g, "")
      .replace(/[^A-Za-z0-9-]/g, "");

    setFormData(f => ({ ...f, codigoMadre: valor }));
    validarCampo("codigoMadre", valor);
  }}
  className={`${inputClasses} ${errores.codigoMadre ? "border-red-500" : ""}`}
/>
{errores.codigoMadre && <p className="text-red-600 text-sm">{errores.codigoMadre}</p>}
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-black mb-1">Código Padre</label>
    <input
  type="text"
  value={formData.codigoPadre}
  onChange={(e) => {
    const valor = e.target.value
      .replace(/\s/g, "")
      .replace(/[^A-Za-z0-9-]/g, "");

    setFormData(f => ({ ...f, codigoPadre: valor }));
    validarCampo("codigoPadre", valor);
  }}
  className={`${inputClasses} ${errores.codigoPadre ? "border-red-500" : ""}`}
/>
{errores.codigoPadre && <p className="text-red-600 text-sm">{errores.codigoPadre}</p>}
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-black mb-1">
      Fecha de Nacimiento
    </label>
    <input
  type="date"
  max={new Date().toISOString().split("T")[0]}
  value={formData.fechaNacimiento}
  onChange={(e) => {
    setFormData(f => ({ ...f, fechaNacimiento: e.target.value }));
    validarCampo("fechaNacimiento", e.target.value);
  }}
  className={`${inputClasses} ${errores.fechaNacimiento ? "border-red-500" : ""}`}
/>
{errores.fechaNacimiento && (
  <p className="text-red-600 text-sm">{errores.fechaNacimiento}</p>
)}
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-black mb-1">Raza</label>
    <input
  type="text"
  value={formData.raza}
  onChange={(e) => {
    const valor = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ\s]/g, "");
    setFormData(f => ({ ...f, raza: valor }));
    validarCampo("raza", valor);
  }}
  className={`${inputClasses} ${errores.raza ? "border-red-500" : ""}`}
/>
{errores.raza && <p className="text-red-600 text-sm">{errores.raza}</p>}
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-black mb-1">Sexo</label>
    <select
      value={formData.sexo}
      onChange={(e) =>
        setFormData(f => ({ ...f, sexo: e.target.value as "Macho" | "Hembra" }))
      }
      className={inputClasses}
    >
      <option value="Macho">Macho</option>
      <option value="Hembra">Hembra</option>
    </select>
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-black mb-1">
      Peso al Nacer (kg)
    </label>
    <input
  type="text"
  value={formData.peso}
  onChange={(e) => {
    const valor = e.target.value.replace(/[^0-9]/g, "");
    setFormData(f => ({ ...f, peso: valor }));
    validarCampo("peso", valor);
  }}
  className={`${inputClasses} ${errores.peso ? "border-red-500" : ""}`}
/>
{errores.peso && <p className="text-red-600 text-sm">{errores.peso}</p>}
  </div>

  <div className="flex flex-col">
    <label className="text-sm font-semibold text-black mb-1">
      Estado de Salud
    </label>
    <input
  type="text"
  value={formData.estadoSalud}
  onChange={(e) => {
    const valor = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ\s]/g, "");
    setFormData(f => ({ ...f, estadoSalud: valor }));
    validarCampo("estadoSalud", valor);
  }}
  className={`${inputClasses} ${errores.estadoSalud ? "border-red-500" : ""}`}
/>
{errores.estadoSalud && (
  <p className="text-red-600 text-sm">{errores.estadoSalud}</p>
)}
  </div>
 <button
  onClick={guardarNacimiento}
  disabled={formularioInvalido()}
  className={`
    mt-4 px-6 py-2 rounded-2xl font-semibold transition-all shadow-md
    ${
      formularioInvalido()
        ? "bg-gray-400 cursor-not-allowed text-white"
        : "bg-pink-600 hover:bg-pink-700 text-white hover:shadow-xl"
    }
  `}
>
  {formData.id ? "Actualizar Nacimiento" : "Guardar Nacimiento"}
</button>
    
  

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

      
    </div>
  );
}
