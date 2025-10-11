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
  estado?: "vivo" | "muerto" | "vendido";
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
  fechaPartoReal?: string;
  fechaAbortoReal?: string;
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
  const [filtroEstado, setFiltroEstado] = useState<"todas" | "vivo" | "muerto" | "vendido">("todas");
  const ITEMS_PAGINA = 40;
  const navigate = useNavigate();
  const hoy = new Date().toISOString().split("T")[0];

  // --- Calcular fecha posible de parto según especie ---
  const calcularFechaParto = (fechaInseminacion: string, especie: string) => {
    const diasGestacion: { [key: string]: number } = {
      Bovino: 283,
      Ovino: 152,
      Caprino: 150,
      Porcino: 115,
      Equino: 340,
    };
    const dias = diasGestacion[especie] || 280;
    const fecha = new Date(fechaInseminacion);
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split("T")[0];
  };

  // --- Cargar hembras ---
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
              estado: data.estado || "vivo",
            });
          }
        }
      }
    }
    setHembras(hembrasTemp);
  };

  // --- Cargar registros ---
  const cargarRegistros = async () => {
    const snaps = await getDocs(collection(db, "reproduccion"));
    setRegistros(snaps.docs.map((doc) => ({ id: doc.id, ...(doc.data() as ReproduccionRegistro) })));
  };

  useEffect(() => {
    cargarHembras();
    cargarRegistros();
  }, []);

  // --- Guardar nuevo registro ---
  const guardarRegistro = async () => {
    if (!selectedHembra) return alert("Selecciona una hembra");
    if (!formData.fechaInseminacion || !formData.codigoToro || !formData.quienInsemino)
      return alert("Completa todos los campos obligatorios");
    if (formData.fechaInseminacion > hoy) return alert("La fecha de inseminación no puede ser futura");

    const registrosHembra = registros.filter((r) => r.hembraId === selectedHembra.id);
    const ultimo = registrosHembra.sort(
      (a, b) => new Date(b.fechaInseminacion).getTime() - new Date(a.fechaInseminacion).getTime()
    )[0];

    const fechaParto = calcularFechaParto(formData.fechaInseminacion, selectedHembra.especie);

    await addDoc(collection(db, "reproduccion"), {
      ...formData,
      hembraId: selectedHembra.id,
      hembraCodigo: selectedHembra.codigo,
      loteId: selectedHembra.loteId,
      loteNombre: selectedHembra.loteNombre,
      fechaPosibleParto: fechaParto,
      estado: "En reproducción",
      partosAnteriores: ultimo ? ultimo.partosAnteriores : 0,
      abortos: ultimo ? ultimo.abortos : 0,
    });

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

    cargarRegistros();
    cargarHembras();
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

  // --- Actualizar estado (Parió / Abortó) ---
  const actualizarEstado = async (r: ReproduccionRegistro, nuevoEstado: "Parió" | "Abortó") => {
    if (!r.id) return;
    if (!confirm(`¿Marcar registro como "${nuevoEstado}"?`)) return;

    const hoy = new Date().toISOString().split("T")[0];
    const nuevosDatos: Partial<ReproduccionRegistro> = { estado: nuevoEstado };

    if (nuevoEstado === "Parió") {
      nuevosDatos.partosAnteriores = (r.partosAnteriores || 0) + 1;
      nuevosDatos.fechaPartoReal = hoy;
    } else {
      nuevosDatos.abortos = (r.abortos || 0) + 1;
      nuevosDatos.fechaAbortoReal = hoy;
    }

    await setDoc(doc(db, "reproduccion", r.id), nuevosDatos, { merge: true });
    cargarRegistros();
  };

  // --- Quitar de reproducción ---
  const quitarDeReproduccion = async (hembra: Hembra) => {
    if (!confirm(`¿Quitar a ${hembra.codigo} de reproducción?`)) return;
    const colecciones = ["lotes", "lotesnuevos"];
    for (const col of colecciones) {
      const docRef = doc(db, col, hembra.loteId, "animales", hembra.id);
      await setDoc(docRef, { enReproduccion: false }, { merge: true });
    }
    cargarHembras();
  };

  // --- Filtrado por estado ---
  const hembrasFiltradas = hembras.filter(h => {
    if (filtroEstado === "todas") return true;
    return h.estado === filtroEstado;
  });

  const paginaActualHembras = hembrasFiltradas.slice((pagina - 1) * ITEMS_PAGINA, pagina * ITEMS_PAGINA);
  const totalPaginasHembras = Math.ceil(hembrasFiltradas.length / ITEMS_PAGINA);

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${cowsBackground})` }} />
      <div className="absolute inset-0 bg-white/20" />

      <div className="sticky top-0 z-50 bg-amber-400 text-black p-4 flex items-center gap-4 shadow-md">
        <button onClick={() => navigate(-1)} className="hover:text-amber-500 transition">
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Reproducción por Hembra</h1>
      </div>

      <div className="relative flex flex-col md:flex-row p-6 gap-6">
        {/* Lista de hembras */}
        <div className="w-full md:w-1/6 bg-white/30 backdrop-blur-md border border-white/50 p-4 rounded-xl shadow-xl h-auto md:h-[calc(100vh-6rem)] sticky top-24 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Hembras</h2>

          <div className="mb-4">
            <select
              value={filtroEstado}
              onChange={(e) => { setFiltroEstado(e.target.value as any); setPagina(1); }}
              className="w-full px-2 py-1 rounded border"
            >
              <option value="todas">Todas</option>
              <option value="vivo">Vivas/Activas</option>
              <option value="muerto">Muertas</option>
              <option value="vendido">Vendidas</option>
            </select>
          </div>

          {paginaActualHembras.map((h) => {
            const estaViva = h.estado === "vivo";
            return (
              <div
                key={h.id}
                className={`w-full text-left px-4 py-2 mb-2 rounded-lg flex flex-col ${!estaViva ? "bg-gray-300 text-gray-700 line-through" : "bg-amber-400 text-black"}`}
              >
                <span className="font-bold">{h.codigo} - {h.loteNombre} ({h.especie})</span>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSelectedHembra(h)}
                    className={`bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition`}
                  >
                    Ver registros
                  </button>
                  <button
                    onClick={() => quitarDeReproduccion(h)}
                    disabled={!estaViva}
                    className={`px-2 py-1 rounded transition ${estaViva ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-600 text-white opacity-50 cursor-not-allowed"}`}
                  >
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}

          {totalPaginasHembras > 1 && (
            <div className="flex justify-center mt-4 gap-2 flex-wrap">
              <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="px-3 py-1 bg-amber-400 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50">Anterior</button>
              <span className="px-3 py-1 bg-white rounded-lg">{pagina} / {totalPaginasHembras}</span>
              <button disabled={pagina === totalPaginasHembras} onClick={() => setPagina(p => p + 1)} className="px-3 py-1 bg-amber-400 text-white rounded-lg hover:bg-yellow-500 disabled:opacity-50">Siguiente</button>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="w-full md:w-3/4 flex flex-col gap-6">
          {selectedHembra && (
            <>
              {/* Formulario */}
              <div className={`bg-white/30 backdrop-blur-md border border-white/40 p-8 rounded-3xl shadow-lg ${selectedHembra.estado !== "vivo" ? "opacity-50 pointer-events-none" : ""}`}>
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Registrar Gestación - {selectedHembra.codigo}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-800">Método</label>
                    <select
                      value={formData.metodo}
                      onChange={(e) => setFormData(f => ({ ...f, metodo: e.target.value as any }))}
                      className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="Monta">Monta</option>
                      <option value="Inseminación">Inseminación</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-800">Fecha de inseminación</label>
                    <input
                      type="date"
                      max={hoy}
                      value={formData.fechaInseminacion}
                      onChange={(e) => setFormData(f => ({ ...f, fechaInseminacion: e.target.value }))}
                      className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-800">Código del toro</label>
                    <input
                      type="text"
                      value={formData.codigoToro}
                      onChange={(e) => setFormData(f => ({ ...f, codigoToro: e.target.value }))}
                      className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-2 font-medium text-gray-800">Quién inseminó</label>
                    <input
                      type="text"
                      value={formData.quienInsemino}
                      onChange={(e) => setFormData(f => ({ ...f, quienInsemino: e.target.value }))}
                      className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="flex flex-col md:col-span-2">
                    <label className="mb-2 font-medium text-gray-800">Observaciones</label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData(f => ({ ...f, observaciones: e.target.value }))}
                      className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none h-24"
                      placeholder="Añadir comentarios o detalles adicionales..."
                    />
                  </div>
                </div>

                <button
                  onClick={guardarRegistro}
                  disabled={selectedHembra.estado !== "vivo"}
                  className={`mt-6 w-full md:w-auto bg-amber-400 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-yellow-500 transition-shadow shadow-md hover:shadow-xl ${selectedHembra.estado !== "vivo" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Guardar Registro
                </button>
              </div>

              {/* Historial */}
              <div className="bg-white/30 backdrop-blur-md border border-white/40 p-6 rounded-xl shadow-xl overflow-x-auto">
                <h2 className="text-xl font-bold mb-4">Historial de Gestación</h2>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="border px-4 py-2 rounded-lg mb-4 w-full"
                />
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-amber-400 text-white">
                      <th className="p-2 border">#</th>
                      <th className="p-2 border">Método</th>
                      <th className="p-2 border">Fecha Insem.</th>
                      <th className="p-2 border">Código Toro</th>
                      <th className="p-2 border">Partos</th>
                      <th className="p-2 border">Abortos</th>
                      <th className="p-2 border">Posible Parto</th>
                      <th className="p-2 border">Fecha Real</th>
                      <th className="p-2 border">Estado</th>
                      <th className="p-2 border">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros
                      .filter(r => r.hembraId === selectedHembra.id && (r.hembraCodigo.toLowerCase().includes(busqueda.toLowerCase()) || r.loteNombre.toLowerCase().includes(busqueda.toLowerCase())))
                      .map((r, idx) => (
                        <tr key={r.id} className="border-b hover:bg-yellow-50">
                          <td className="p-2 border">{idx + 1}</td>
                          <td className="p-2 border">{r.metodo}</td>
                          <td className="p-2 border">{r.fechaInseminacion}</td>
                          <td className="p-2 border">{r.codigoToro}</td>
                          <td className="p-2 border">{r.partosAnteriores}</td>
                          <td className="p-2 border">{r.abortos}</td>
                          <td className="p-2 border">{r.fechaPosibleParto}</td>
                          <td className="p-2 border">{r.fechaPartoReal || r.fechaAbortoReal || "-"}</td>
                          <td className="p-2 border">{r.estado}</td>
                          <td className="p-2 border flex flex-wrap gap-2">
                            <button
                              onClick={() => editarRegistro(r)}
                              disabled={selectedHembra.estado !== "vivo"}
                              className={`bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition ${selectedHembra.estado !== "vivo" ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => eliminarRegistro(r)}
                              disabled={selectedHembra.estado !== "vivo"}
                              className={`bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition ${selectedHembra.estado !== "vivo" ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <FaTrash />
                            </button>
                            {r.estado === "En reproducción" && selectedHembra.estado === "vivo" && (
                              <>
                                <button
                                  onClick={() => actualizarEstado(r, "Parió")}
                                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                                >
                                  Parió
                                </button>
                                <button
                                  onClick={() => actualizarEstado(r, "Abortó")}
                                  className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 text-sm"
                                >
                                  Abortó
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
