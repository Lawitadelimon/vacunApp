import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { FaTrash, FaEdit, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import cowsBackground from "./assets/cows2.jpg";

type Hembra = {
  id: string;
  codigo: string;
  loteId: string;
  loteNombre: string;
  especie: "Bovino" | "Ovino" | "Caprino" | "Porcino" | "Equino";
  enReproduccion?: boolean;
};

type ReproduccionRegistro = {
  id?: string;
  hembraId: string;
  hembraCodigo: string;
  loteId: string;
  loteNombre: string;
  metodo: "Monta" | "Inseminación";
  fechaInseminacion: string;
  codigoToro: string;
  quienInsemino: string;
  partosAnteriores: number;
  abortos: number;
  fechaPosibleParto: string;
  observaciones: string;
  estado?: "En reproducción" | "Parió" | "Abortó";
};

export default function ReproduccionPorHembra() {
  const [hembras, setHembras] = useState<Hembra[]>([]);
  const [selectedHembra, setSelectedHembra] = useState<Hembra | null>(null);
  const [registros, setRegistros] = useState<ReproduccionRegistro[]>([]);
  const [formData, setFormData] = useState<ReproduccionRegistro>({
    hembraId: "",
    hembraCodigo: "",
    loteId: "",
    loteNombre: "",
    metodo: "Monta",
    fechaInseminacion: "",
    codigoToro: "",
    quienInsemino: "",
    partosAnteriores: 0,
    abortos: 0,
    fechaPosibleParto: "",
    observaciones: "",
    estado: "En reproducción",
  });
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const ITEMS_PAGINA = 40;
  const navigate = useNavigate();
  const hoy = new Date().toISOString().split("T")[0];

  // --- Función para calcular fecha posible de parto según especie ---
  const calcularFechaParto = (fechaInseminacion: string, especie: string) => {
    const diasGestacion: { [key: string]: number } = {
      "Bovino": 283,
      "Ovino": 152,
      "Caprino": 150,
      "Porcino": 115,
      "Equino": 340,
    };
    const dias = diasGestacion[especie] || 280;
    const fecha = new Date(fechaInseminacion);
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split("T")[0];
  };

  // --- Cargar hembras en reproducción ---
  const cargarHembras = async () => {
    const hembrasTemp: Hembra[] = [];
    const colecciones = ["lotes", "lotesnuevos"];
    for (const col of colecciones) {
      const lotesSnap = await getDocs(collection(db, col));
      for (const loteDoc of lotesSnap.docs) {
        const loteNombre = loteDoc.data().nombre;
        const animalesSnap = await getDocs(collection(db, col, loteDoc.id, "animales"));
        for (const docA of animalesSnap.docs) {
          const data = docA.data() as any;
          if (data.sexo?.toLowerCase() === "hembra" && data.enReproduccion) {
            hembrasTemp.push({
              id: docA.id,
              codigo: data.codigo,
              loteId: loteDoc.id,
              loteNombre,
              especie: data.especie,
              enReproduccion: data.enReproduccion,
            });
          }
        }
      }
    }
    setHembras(hembrasTemp);
  };

  // --- Cargar registros de reproducción ---
  const cargarRegistros = async () => {
    const snaps = await getDocs(collection(db, "reproduccion"));
    setRegistros(snaps.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ReproduccionRegistro) })));
  };

  useEffect(() => {
    cargarHembras();
    cargarRegistros();
  }, []);

  // --- Guardar registro de reproducción ---
  const guardarRegistro = async () => {
    if (!selectedHembra) return alert("Selecciona una hembra");
    if (!formData.fechaInseminacion || !formData.codigoToro || !formData.quienInsemino)
      return alert("Completa todos los campos obligatorios");
    
    if (formData.fechaInseminacion > hoy) return alert("La fecha de inseminación no puede ser futura");

    // Calcular fecha posible de parto automáticamente
    const fechaParto = calcularFechaParto(formData.fechaInseminacion, selectedHembra.especie);

    await addDoc(collection(db, "reproduccion"), {
      ...formData,
      hembraId: selectedHembra.id,
      hembraCodigo: selectedHembra.codigo,
      loteId: selectedHembra.loteId,
      loteNombre: selectedHembra.loteNombre,
      fechaPosibleParto: fechaParto,
      estado: "En reproducción",
    });

    // Marcar la hembra como en reproducción
    await setDoc(doc(db, "lotes", selectedHembra.loteId, "animales", selectedHembra.id), { enReproduccion: true }, { merge: true });

    // Limpiar formulario
    setFormData({
      hembraId: "",
      hembraCodigo: "",
      loteId: "",
      loteNombre: "",
      metodo: "Monta",
      fechaInseminacion: "",
      codigoToro: "",
      quienInsemino: "",
      partosAnteriores: 0,
      abortos: 0,
      fechaPosibleParto: "",
      observaciones: "",
      estado: "En reproducción",
    });

    cargarHembras();
    cargarRegistros();
  };

  // --- Editar registro ---
  const editarRegistro = (r: ReproduccionRegistro) => setFormData(r);

  // --- Eliminar registro ---
  const eliminarRegistro = async (r: ReproduccionRegistro) => {
    if (!r.id) return;
    if (!confirm("¿Eliminar este registro de reproducción?")) return;
    await deleteDoc(doc(db, "reproduccion", r.id));
    cargarRegistros();
  };

  // --- Quitar hembra de lista ---
  const quitarDeReproduccion = async (h: Hembra) => {
    if (!confirm(`¿Quitar a ${h.codigo} de la reproducción?`)) return;
    await setDoc(doc(db, "lotes", h.loteId, "animales", h.id), { enReproduccion: false }, { merge: true });
    cargarHembras();
  };

  const registrosHembra = registros.filter(r => selectedHembra && r.hembraId === selectedHembra.id);
  const registrosFiltrados = registrosHembra.filter(
    r => r.hembraCodigo.toLowerCase().includes(busqueda.toLowerCase()) || r.loteNombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const paginaActual = registrosFiltrados.slice((pagina - 1) * ITEMS_PAGINA, pagina * ITEMS_PAGINA);
  const totalPaginas = Math.ceil(registrosFiltrados.length / ITEMS_PAGINA);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${cowsBackground})` }} />
      <div className="absolute inset-0 bg-white/20" />

      <div className="sticky top-0 z-50 bg-amber-400 text-black p-4 flex items-center gap-4 shadow-md">
        <button onClick={() => navigate(-1)} className="hover:text-amber-500 transition"><FaArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold">Reproducción por Hembra</h1>
      </div>

      <div className="relative flex flex-col md:flex-row p-6 gap-6">
        {/* Lista de hembras en reproducción */}
        <div className="w-full md:w-1/6 bg-amber-400 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow-xl h-auto md:h-[calc(100vh-6rem)] sticky top-24 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Hembras en reproducción</h2>
          {hembras.map(h => (
            <div key={h.id} className={`w-full text-left px-4 py-2 mb-2 rounded-lg bg-white text-black flex flex-col`}>
              <span className="font-bold">{h.codigo} - {h.loteNombre} ({h.especie})</span>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setSelectedHembra(h)} className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition">Registros</button>
                <button onClick={() => quitarDeReproduccion(h)} className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition">Quitar</button>
              </div>
            </div>
          ))}
        </div>

        {/* Contenido principal */}
        <div className="w-full md:w-3/4 flex flex-col gap-6">
          {selectedHembra && (
            <>
              {/* Formulario */}
              <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-xl">
                <h2 className="text-xl font-bold mb-4">Registrar Gestación - {selectedHembra.codigo}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label>Método</label>
                    <select value={formData.metodo} onChange={e => setFormData(f => ({ ...f, metodo: e.target.value as "Monta"|"Inseminación" }))} className="border px-4 py-2 rounded-lg">
                      <option value="Monta">Monta</option>
                      <option value="Inseminación">Inseminación</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label>Fecha de inseminación</label>
                    <input type="date" max={hoy} value={formData.fechaInseminacion} onChange={e => setFormData(f => ({ ...f, fechaInseminacion: e.target.value }))} className="border px-4 py-2 rounded-lg" />
                  </div>

                  <div className="flex flex-col">
                    <label>Código del toro</label>
                    <input type="text" value={formData.codigoToro} onChange={e => setFormData(f => ({ ...f, codigoToro: e.target.value }))} className="border px-4 py-2 rounded-lg" />
                  </div>

                  <div className="flex flex-col">
                    <label>Quién inseminó</label>
                    <input type="text" value={formData.quienInsemino} onChange={e => setFormData(f => ({ ...f, quienInsemino: e.target.value }))} className="border px-4 py-2 rounded-lg" />
                  </div>

                  <div className="flex flex-col">
                    <label>Partos anteriores</label>
                    <input type="number" value={formData.partosAnteriores} onChange={e => setFormData(f => ({ ...f, partosAnteriores: parseInt(e.target.value)||0 }))} className="border px-4 py-2 rounded-lg" />
                  </div>

                  <div className="flex flex-col">
                    <label>Abortos</label>
                    <input type="number" value={formData.abortos} onChange={e => setFormData(f => ({ ...f, abortos: parseInt(e.target.value)||0 }))} className="border px-4 py-2 rounded-lg" />
                  </div>

                  <div className="flex flex-col">
                    <label>Observaciones</label>
                    <input type="text" value={formData.observaciones} onChange={e => setFormData(f => ({ ...f, observaciones: e.target.value }))} className="border px-4 py-2 rounded-lg" />
                  </div>
                </div>

                <button onClick={guardarRegistro} className="mt-4 bg-amber-400 text-white px-6 py-2 rounded-xl font-semibold hover:bg-yellow-500 transition">
                  Guardar
                </button>
              </div>

              {/* Tabla de historial */}
              <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-xl shadow-xl overflow-x-auto">
                <h2 className="text-xl font-bold mb-4">Historial de Gestación</h2>
                <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="border px-4 py-2 rounded-lg mb-4 w-full" />
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-amber-400 text-white">
                      <th className="p-2 border">#</th>
                      <th className="p-2 border">Método</th>
                      <th className="p-2 border">Fecha Inseminación</th>
                      <th className="p-2 border">Código Toro</th>
                      <th className="p-2 border">Quién Inseminó</th>
                      <th className="p-2 border">Partos Ant.</th>
                      <th className="p-2 border">Abortos</th>
                      <th className="p-2 border">Fecha Posible Parto</th>
                      <th className="p-2 border">Observaciones</th>
                      <th className="p-2 border">Estado</th>
                      <th className="p-2 border">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginaActual.map((r, idx) => (
                      <tr key={r.id} className="border-b hover:bg-yellow-50">
                        <td className="p-2 border">{(pagina-1)*ITEMS_PAGINA+idx+1}</td>
                        <td className="p-2 border">{r.metodo}</td>
                        <td className="p-2 border">{r.fechaInseminacion}</td>
                        <td className="p-2 border">{r.codigoToro}</td>
                        <td className="p-2 border">{r.quienInsemino}</td>
                        <td className="p-2 border">{r.partosAnteriores}</td>
                        <td className="p-2 border">{r.abortos}</td>
                        <td className="p-2 border">{r.fechaPosibleParto}</td>
                        <td className="p-2 border">{r.observaciones}</td>
                        <td className="p-2 border">{r.estado}</td>
                        <td className="p-2 border flex gap-2">
                          <button onClick={() => editarRegistro(r)} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"><FaEdit /></button>
                          <button onClick={() => eliminarRegistro(r)} className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"><FaTrash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPaginas>1 && (
                  <div className="flex justify-center mt-4 gap-2">
                    {Array.from({length:totalPaginas},(_,i)=>(
                      <button key={i+1} className={`px-3 py-1 rounded ${pagina===i+1?"bg-yellow-600 text-white":"bg-yellow-200"}`} onClick={()=>setPagina(i+1)}>{i+1}</button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
