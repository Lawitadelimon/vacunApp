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

  const editarCategoria = (cat: string) => {
    setCategoriaAnterior(cat);
    setCategoriaEditada(cat);
  };

  const guardarEdicionCategoria = async () => {
    const user = getAuth().currentUser;
    if (!user) return;

    const newCat = categoriaEditada.trim();
    if (!newCat || newCat.toLowerCase() === categoriaAnterior.toLowerCase() || categorias.some(c => c.toLowerCase() === newCat.toLowerCase())) {
      alert("Nombre inválido o repetido.");
      return;
    }
    if (!confirm(`Renombrar ${categoriaAnterior} → ${newCat}?`)) return;

    const snaps = await getDocs(collection(db, 'categorias', categoriaAnterior, 'animales'));

    //Esto es parte de lo anterior
    await setDoc(doc(db, 'categorias', newCat), { uid: user.uid });

    for (const d of snaps.docs) {
      await setDoc(doc(db, 'categorias', newCat, 'animales', d.id), { uid: user.uid, ...d.data() });
      await deleteDoc(doc(db, 'categorias', categoriaAnterior, 'animales', d.id));
    }

    await deleteDoc(doc(db, 'categorias', categoriaAnterior));

    setCategorias(prev => prev.map(c => c === categoriaAnterior ? newCat : c));
    setAnimales(prev => {
      const n = { ...prev, [newCat]: prev[categoriaAnterior] };
      delete n[categoriaAnterior];
      return n;
    });
    setCategoriaSeleccionada(newCat);
    setCategoriaAnterior('');
    setCategoriaEditada('');
  };

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

            <button
              onClick={() => abrirFormulario("nuevo")}
              className="mb-8 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 transition px-12 py-4 rounded-3xl text-white font-extrabold shadow-lg flex items-center justify-center gap-3 max-w-xs mx-auto"
            >
              <FaPlus /> Agregar
            </button>

            {modo && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl max-w-3xl w-full p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
                  <h2 className="text-3xl font-extrabold mb-6 text-yellow-700 tracking-wide">
                    {modo === "nuevo" ? "Agregar" : "Editar"}
                  </h2>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      guardarAnimal();
                    }}
                    className="space-y-6 bg-yellow-50 p-8 rounded-xl shadow-inner"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-yellow-800 text-sm font-semibold mb-2">
                          Código
                        </label>
                        <input
                          type="text"
                          placeholder="Código"
                          maxLength={6}
                          value={formData.codigo}
                          onChange={e =>
                            setFormData(f => ({ ...f, codigo: e.target.value }))
                          }
                          disabled={modo === "editar"}
                          required
                          className="w-full border border-yellow-300 px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-yellow-800 text-sm font-semibold mb-2">
                          Raza
                        </label>
                        <input
                          type="text"
                          placeholder="Raza"
                          value={formData.raza}
                          onChange={e =>
                            setFormData(f => ({ ...f, raza: e.target.value }))
                          }
                          required
                          className="w-full border border-yellow-300 px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-yellow-800 text-sm font-semibold mb-2">
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="date"
                          value={formData.fecha}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={e =>
                            setFormData(f => ({
                              ...f,
                              fecha: e.target.value,
                              edad: calcularEdad(e.target.value),
                            }))
                          }
                          required
                          className="w-full border border-yellow-300 px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-yellow-800 text-sm font-semibold mb-2">
                          Edad
                        </label>
                        <input
                          type="text"
                          value={formData.edad}
                          disabled
                          className="w-full border border-yellow-200 px-4 py-3 rounded-lg bg-yellow-100 text-yellow-900 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-yellow-800 text-sm font-semibold mb-2">
                          Sexo
                        </label>
                        <input
                          type="text"
                          placeholder="macho / hembra"
                          value={formData.sexo}
                          onChange={e =>
                            setFormData(f => ({ ...f, sexo: e.target.value }))
                          }
                          required
                          className="w-full border border-yellow-300 px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-yellow-800 text-sm font-semibold mb-2">
                          Salud
                        </label>
                        <input
                          type="text"
                          value={formData.salud}
                          onChange={e =>
                            setFormData(f => ({ ...f, salud: e.target.value }))
                          }
                          required
                          className="w-full border border-yellow-300 px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-yellow-800 text-sm font-semibold mb-2">
                          Peso
                        </label>
                        <input
                          type="text"
                          value={formData.peso}
                          onChange={e =>
                            setFormData(f => ({ ...f, peso: e.target.value }))
                          }
                          required
                          className="w-full border border-yellow-300 px-4 py-3 rounded-lg bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-yellow-700 text-xl font-semibold mb-4">
                        Vacunas
                      </h3>
                      <div className="space-y-4">
                        {vacunas.map((v, i) => (
                          <div
                            key={i}
                            className="flex flex-col md:flex-row gap-3 items-center bg-yellow-100 rounded-lg p-4 border border-yellow-300 shadow-sm"
                          >
                            <input
                              type="text"
                              placeholder="Nombre vacuna"
                              value={v.nombre}
                              onChange={e => {
                                const nv = [...vacunas];
                                nv[i].nombre = e.target.value;
                                setVacunas(nv);
                              }}
                              className="flex-1 border border-yellow-400 px-4 py-2 rounded-md bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition"
                            />
                            <input
                              type="date"
                              value={v.fecha}
                              onChange={e => {
                                const nv = [...vacunas];
                                nv[i].fecha = e.target.value;
                                setVacunas(nv);
                              }}
                              className="w-44 border border-yellow-400 px-4 py-2 rounded-md bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 transition"
                            />
                            <label className="inline-flex items-center space-x-2 text-yellow-800 text-sm">
                              <input
                                type="checkbox"
                                checked={v.aplicada}
                                onChange={e => {
                                  const nv = [...vacunas];
                                  nv[i].aplicada = e.target.checked;
                                  setVacunas(nv);
                                }}
                                className="form-checkbox text-yellow-600 w-5 h-5"
                              />
                              <span>Aplicada</span>
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setVacunas(vacunas.filter((_, idx) => idx !== i))
                              }
                              className="text-red-600 hover:text-red-800 text-xl px-2"
                              title="Eliminar vacuna"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() =>
                            setVacunas([...vacunas, { nombre: "", aplicada: false, fecha: "" }])
                          }
                          className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-md shadow-md flex items-center justify-center gap-2 transition"
                        >
                          <FaPlus /> Añadir Vacuna
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-5 mt-8">
                      <button
                        type="button"
                        onClick={() => setModo("")}
                        className="bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 transition text-white px-8 py-3 rounded-md font-semibold shadow-md"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 transition text-white px-8 py-3 rounded-md font-semibold shadow-md"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {animalVacunasModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 overflow-y-auto max-h-[90vh] relative border-2 border-yellow-300 printable">
                  <div className="text-center mb-6 border-b pb-4">
                    <h2 className="text-3xl font-extrabold text-yellow-700 tracking-wide flex items-center justify-center gap-3">
                      🩺 Cartilla Oficial de Vacunación
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Código Animal: <span className="font-bold text-gray-900">{animalVacunasModal.codigo}</span>
                    </p>
                  </div>

                  {animalVacunasModal.vacunas && animalVacunasModal.vacunas.length > 0 ? (
                    <div className="grid gap-3 mt-4">
                      {animalVacunasModal.vacunas.map((v: any, i: number) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${
                            v.aplicada ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-gray-800 text-lg">💉 {v.nombre}</p>
                            <p className="text-sm text-gray-600">Fecha: {v.fecha}</p>
                          </div>
                          <div className="text-3xl">
                            {v.aplicada ? "✅" : "❌"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 italic mt-6">
                      Este animal no tiene vacunas registradas.
                    </p>
                  )}

                  <div className="mt-10 flex justify-between gap-4 no-print">
                    <button
                      onClick={() => setAnimalVacunasModal(null)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow-md w-full"
                    >
                      Cerrar
                    </button>
                    <button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-md w-full">
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {/* Footer */}
        <footer className="w-full bg-[#094297dc] py-4 text-center text-white relative z-10">
          <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
        </footer>
      </div> 
        
    </div>
  );
}