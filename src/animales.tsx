import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import backgroundImage from './assets/cows2.jpg';
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import './Animales.css';
import { useNavigate } from "react-router-dom";



export default function Animales() {

  
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [filtro, setFiltro] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [categoriaAnterior, setCategoriaAnterior] = useState('');
  const [categoriaEditada, setCategoriaEditada] = useState('');
  const [animales, setAnimales] = useState<Record<string, any[]>>({});
  const [modo, setModo] = useState('');
  const [animalVacunasModal, setAnimalVacunasModal] = useState(null);
  const [editarIndex, setEditarIndex] = useState<number | null>(null);
  const [vacunas, setVacunas] = useState<{ nombre: string; aplicada: boolean; fecha: string }[]>([]);
  const [formData, setFormData] = useState({
    codigo: '', raza: '', fecha: '', edad: '', sexo: '', salud: '', peso: ''
  });

  const calcularEdad = (fechaNac: string): string => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    const diffMs = hoy.getTime() - nacimiento.getTime();
    if (diffMs < 0) return "Fecha inválida";
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const años = Math.floor(diffDias / 365.25);
    const meses = Math.floor((diffDias % 365.25) / 30.44);
    const dias = Math.floor((diffDias % 365.25) % 30.44);
    if (años === 0 && meses === 0) return  `${dias} ${dias === 1 ? "día" : "días"} `;
    if (años === 0) return  `${meses} ${meses === 1 ? "mes" : "meses"} `;
    return  `${años} ${años === 1 ? "año" : "años"} `;
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const q = await getDocs(collection(db, 'categorias'));
      const cats: string[] = [];
      const data: Record<string, any[]> = {};
      for (const d of q.docs) {
        const cat = d.id;
        cats.push(cat);
        const snaps = await getDocs(collection(db, 'categorias', cat, 'animales'));
        const conVacunas = await Promise.all(
          snaps.docs.map(async x => {
            const vSnap = await getDocs(collection(db, 'categorias', cat, 'animales', x.id, 'vacunas'));
            return { id: x.id, ...x.data(), vacunas: vSnap.docs.map(v => v.data()) };
          })
        );
        data[cat] = conVacunas;
      }
      setCategorias(cats);
      setAnimales(data);
    };
    cargarDatos();
  }, []);

  const animalesFiltrados = animales[categoriaSeleccionada]?.filter(a =>
    Object.values(a).some(val => val.toString().toLowerCase().includes(filtro.toLowerCase()))
  ) || [];

  const abrirFormulario = async (modoNuevo: string, index: number | null = null) => {
    setModo(modoNuevo);
    if (modoNuevo === 'editar' && index !== null) {
      const animal = animales[categoriaSeleccionada][index];
      setFormData({
        codigo: animal.codigo ?? '',
        raza: animal.raza ?? '',
        fecha: animal.fecha ?? '',
        edad: calcularEdad(animal.fecha ?? ''),
        sexo: animal.sexo ?? '',
        salud: animal.salud ?? '',
        peso: animal.peso ?? ''
      });
      setEditarIndex(index);
      setVacunas(animal.vacunas || []);
    } else {
      setFormData({ codigo: '', raza: '', fecha: '', edad: '', sexo: '', salud: '', peso: '' });
      setVacunas([]);
      setEditarIndex(null);
    }
  };


  const handlePrint = () => {
  if (!animalVacunasModal || !animalVacunasModal.vacunas || animalVacunasModal.vacunas.length === 0) {
    alert("No hay vacunas para imprimir");
    return;
  }

  const printContent = `
    <html>
      <head>
        <title>Cartilla Oficial de Vacunación</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet" />
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            margin: 40px;
            color: #333;
            background: #fff;
          }
          header {
            text-align: center;
            margin-bottom: 40px;
          }
          header h1 {
            font-weight: 700;
            font-size: 28px;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          header p {
            font-size: 14px;
            color: #7f8c8d;
          }
          .vacuna-card {
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 20px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .vacuna-card.aplicada {
            background-color: #dff0d8;
            border-left: 6px solid #3c763d;
          }
          .vacuna-card.no-aplicada {
            background-color: #f2dede;
            border-left: 6px solid #a94442;
          }
          .vacuna-info {
            max-width: 80%;
          }
          .vacuna-nombre {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 6px;
          }
          .vacuna-fecha {
            font-size: 14px;
            color: #555;
          }
          .vacuna-icon {
            font-size: 30px;
            margin-left: 15px;
          }
          footer {
            position: fixed;
            bottom: 30px;
            width: 100%;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>Cartilla Oficial de Vacunación</h1>
          <p>Código Animal: ${animalVacunasModal.codigo}</p>
        </header>
        ${animalVacunasModal.vacunas.map(v => `
          <div class="vacuna-card ${v.aplicada ? "aplicada" : "no-aplicada"}">
            <div class="vacuna-info">
              <div class="vacuna-nombre">💉 ${v.nombre}</div>
              <div class="vacuna-fecha">Fecha: ${v.fecha}</div>
            </div>
            <div class="vacuna-icon">${v.aplicada ? "✅" : "❌"}</div>
          </div>
        `).join('')}
        <footer>
          Impreso el ${new Date().toLocaleString()}
        </footer>
      </body>
    </html>
  `;

  const printWindow = window.open("", "", "width=800,height=700");

  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  } else {
    alert("Por favor, permite ventanas emergentes para imprimir.");
  }
};



  const recargarConVacunas = async () => {
    const refAnimales = collection(db, 'categorias', categoriaSeleccionada, 'animales');
    const snaps = await getDocs(refAnimales);
    const actualizados = await Promise.all(
      snaps.docs.map(async x => {
        const vSnap = await getDocs(collection(db, 'categorias', categoriaSeleccionada, 'animales', x.id, 'vacunas'));
        return { id: x.id, ...x.data(), vacunas: vSnap.docs.map(v => v.data()) };
      })
    );
    setAnimales(prev => ({ ...prev, [categoriaSeleccionada]: actualizados }));
  };

  const guardarAnimal = async () => {
    if (!categoriaSeleccionada) return;

    const edad = calcularEdad(formData.fecha);
    const datos = { ...formData, edad };
    const campos = [datos.codigo, datos.raza, datos.fecha, edad, datos.sexo, datos.salud, datos.peso];

    if (campos.some(v => !v)) {
      alert("Completa todos los campos.");
      return;
    }

    const sexoNorm = datos.sexo.trim().toLowerCase();
    if (!['macho', 'hembra'].includes(sexoNorm)) {
      alert('Sexo debe ser "macho" o "hembra".');
      return;
    }

    const codigo = datos.codigo.trim();
    if (!codigo) {
      alert("Código del animal no puede estar vacío.");
      return;
    }

    if (vacunas.some(v => v.nombre.trim() === '' || v.fecha.trim() === '')) {
      alert("Todas las vacunas deben tener nombre y fecha completas.");
      return;
    }

    const refAnimalDoc = doc(db, 'categorias', categoriaSeleccionada, 'animales', codigo);

    await setDoc(refAnimalDoc, { ...datos, sexo: sexoNorm });

    const refVac = collection(db, 'categorias', categoriaSeleccionada, 'animales', codigo, 'vacunas');
    const exist = await getDocs(refVac);
    await Promise.all(exist.docs.map(d => deleteDoc(doc(refVac, d.id))));
    await Promise.all(vacunas.map(v => addDoc(refVac, v)));

    await recargarConVacunas();
    setModo('');
  };

  const eliminarAnimal = async (idx: number) => {
    const a = animales[categoriaSeleccionada][idx];
    if (!confirm(`Eliminar  ${a.codigo} ?`)) return;
    await deleteDoc(doc(db, 'categorias', categoriaSeleccionada, 'animales', a.codigo));
    setAnimales(prev => {
      const arr = [...prev[categoriaSeleccionada]];
      arr.splice(idx, 1);
      return { ...prev, [categoriaSeleccionada]: arr };
    });
  };

  const agregarCategoria = async () => {
    const nueva = nuevaCategoria.trim();
    if (!nueva || categorias.some(c => c.toLowerCase() === nueva.toLowerCase())) {
      alert("Nombre vacío o repetido.");
      return;
    }
    await setDoc(doc(db, 'categorias', nueva), {});
    setCategorias(prev => [...prev, nueva]);
    setAnimales(prev => ({ ...prev, [nueva]: [] }));
    setNuevaCategoria('');
  };

  const eliminarCategoria = async (cat: string) => {
    if (!confirm(`Eliminar categoría ${cat}?`)) return;
    const snaps = await getDocs(collection(db, 'categorias', cat, 'animales'));
    for (const d of snaps.docs) await deleteDoc(doc(db, 'categorias', cat, 'animales', d.id));
    await deleteDoc(doc(db, 'categorias', cat));
    setCategorias(prev => prev.filter(c => c !== cat));
    setAnimales(prev => { const n = { ...prev }; delete n[cat]; return n; });
    if (categoriaSeleccionada === cat) setCategoriaSeleccionada('');
  };

  const editarCategoria = (cat: string) => {
    setCategoriaAnterior(cat);
    setCategoriaEditada(cat);
  };

  const guardarEdicionCategoria = async () => {
    const newCat = categoriaEditada.trim();
    if (!newCat || newCat.toLowerCase() === categoriaAnterior.toLowerCase() || categorias.some(c => c.toLowerCase() === newCat.toLowerCase())) {
      alert("Nombre inválido o repetido.");
      return;
    }
    if (!confirm(`Renombrar ${categoriaAnterior} → ${newCat}?`)) return;
    const snaps = await getDocs(collection(db, 'categorias', categoriaAnterior, 'animales'));
    await setDoc(doc(db, 'categorias', newCat), {});
    for (const d of snaps.docs) {
      await setDoc(doc(db, 'categorias', newCat, 'animales', d.id), d.data());
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

    
  <div className="relative min-h-screen flex flex-col items-center bg-gradient-to-b from-yellow-100 to-yellow-50">
    <div
      className="absolute inset-0 bg-cover bg-center filter blur-sm opacity-100"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    />
    <div className="relative z-10 w-full max-w-7xl flex flex-col items-center px-4 sm:px-0.5">
      <header className="bg-yellow-500 w-full py-5 text-center shadow-lg rounded-b-lg">
        
      <button
        onClick={() => navigate('/')}
        aria-label="Ir al Home"
        className="text-white hover:text-yellow-200 transition cursor-pointer absolute left-6 "
      >
         <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"
      />
    </svg>
  </button>
        <h1 className="text-white text-4xl font-extrabold tracking-wide drop-shadow-lg">
          Animales
        </h1>
      </header>

      <div className="mt-8 mb-6 flex gap-3 max-w-md w-full">
        <input
          value={nuevaCategoria}
          onChange={e => setNuevaCategoria(e.target.value)}
          placeholder="Nueva categoría"
          className="flex-grow bg-white border border-yellow-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-300 transition rounded-xl px-5 py-3 shadow-sm placeholder-yellow-400 text-yellow-900 font-semibold"
        />
        <button
          onClick={agregarCategoria}
          className="bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 transition text-white px-5 py-3 rounded-xl shadow-md flex items-center justify-center"
          aria-label="Agregar categoría"
        >
          <FaPlus />
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 max-w-3xl justify-center">
        {categorias.map(cat => (
          <div
            key={cat}
            className="bg-yellow-100 border border-yellow-300 hover:border-yellow-500 transition rounded-2xl flex items-center gap-3 px-5 py-2 shadow-sm"
          >
            <button
              onClick={() => setCategoriaSeleccionada(cat)}
              className="font-semibold text-yellow-900 hover:text-yellow-700 transition"
            >
              {cat}
            </button>
            <FaEdit
              onClick={() => editarCategoria(cat)}
              className="cursor-pointer text-yellow-600 hover:text-yellow-800 transition"
              title="Editar categoría"
            />
            <FaTrash
              onClick={() => eliminarCategoria(cat)}
              className="cursor-pointer text-red-500 hover:text-red-700 transition"
              title="Eliminar categoría"
            />
          </div>
        ))}
      </div>

      {categoriaAnterior && (
        <div className="mb-8 flex gap-3 max-w-md w-full justify-center">
          <input
            value={categoriaEditada}
            onChange={e => setCategoriaEditada(e.target.value)}
            className="flex-grow bg-white border border-yellow-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-300 transition rounded-xl px-5 py-3 shadow-sm text-yellow-900 font-semibold"
          />
          <button
            onClick={guardarEdicionCategoria}
            className="bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 transition text-white px-6 py-3 rounded-xl shadow-md"
          >
            Guardar
          </button>
        </div>
      )}

      {categoriaSeleccionada && (
        <>
          <div className="mb-6 flex gap-3 max-w-md w-full items-center">
            <input
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar..."
              className="flex-grow bg-white border border-yellow-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-300 transition rounded-xl px-5 py-3 shadow-sm text-yellow-900 font-semibold"
            />
            <FaSearch className="text-yellow-500 w-6 h-6" />
          </div>

          <div className="overflow-x-auto w-full max-w-screen-xl mx-auto mb-8 rounded-lg shadow-lg border border-yellow-200 bg-white/95">
            <table className="w-full border-collapse text-center text-sm">
              <thead className="bg-yellow-500 text-white font-semibold text-lg rounded-t-lg">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Raza</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Edad</th>
                  <th className="py-3 px-4">Sexo</th>
                  <th className="py-3 px-4">Salud</th>
                  <th className="py-3 px-4">Peso</th>
                  <th className="py-3 px-4 text-left">Vacunas</th>
                  <th className="py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {animalesFiltrados.map((anim, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-yellow-200 hover:bg-yellow-50 transition"
                  >
                    <td className="py-2 px-3">{anim.id}</td>
                    <td className="py-2 px-3">{anim.codigo}</td>
                    <td className="py-2 px-3">{anim.raza}</td>
                    <td className="py-2 px-3">{anim.fecha}</td>
                    <td className="py-2 px-3">{anim.edad}</td>
                    <td className="py-2 px-3">{anim.sexo}</td>
                    <td className="py-2 px-3">{anim.salud}</td>
                    <td className="py-2 px-3">{anim.peso}</td>
                    <td className="py-2 px-3 text-left text-sm">

  <button
    onClick={() => setAnimalVacunasModal(anim)}
    className={`underline font-medium ${
      anim.vacunas?.length > 0 && anim.vacunas.every(v => v.aplicada)
        ? "text-green-600 hover:text-green-800"
        : "text-red-600 hover:text-red-800"
    }`}
  >
    Ver vacunas
  </button>
</td>


                    <td className="py-2 px-3 flex justify-center gap-4">
                      <FaEdit
                        onClick={() => abrirFormulario("editar", idx)}
                        className="cursor-pointer text-yellow-600 hover:text-yellow-800 transition"
                        title="Editar animal"
                      />
                      <FaTrash
                        onClick={() => eliminarAnimal(idx)}
                        className="cursor-pointer text-red-500 hover:text-red-700 transition"
                        title="Eliminar animal"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                    {/* Código */}
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
                    {/* Raza */}
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
                    {/* Fecha */}
                    <div>
                      <label className="block text-yellow-800 text-sm font-semibold mb-2">
                        Fecha de Nacimiento
                      </label>
                     <input
  type="date"
  value={formData.fecha}
  max={new Date().toISOString().split('T')[0]}  // ← esto es lo nuevo
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
                    {/* Edad */}
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
                    {/* Sexo */}
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
                    {/* Salud */}
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
                    {/* Peso */}
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

                  {/* Vacunas */}
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
      {/* ENCABEZADO */}
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
          {animalVacunasModal.vacunas.map((v, i) => (
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
    </div>
  </div>
);
}
