import { useState, type SetStateAction } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import backgroundImage from './assets/cows2.jpg'; // Cambia el path si es necesario

export default function Animales() {
  const [categorias, setCategorias] = useState(['Vacas', 'Caballos', 'Cerdos']);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [filtro, setFiltro] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [categoriaAnterior, setCategoriaAnterior] = useState('');
  const [categoriaEditada, setCategoriaEditada] = useState('');
  const [animales, setAnimales] = useState({
    Vacas: [
      { id: 1, codigo: '123ABC', raza: 'Suiza', fecha: '2023-12-20', edad: '1.4 M', sexo: 'H', salud: 'Buena', peso: 500 },
      { id: 2, codigo: '234DEF', raza: 'Brahman', fecha: '2023-12-21', edad: '1.4 M', sexo: 'M', salud: 'Buena', peso: 500 },
      { id: 3, codigo: '345GHI', raza: 'Angus', fecha: '2023-12-22', edad: '1.4 M', sexo: 'M', salud: 'Buena', peso: 500 },
    ],
    Caballos: [],
    Cerdos: [],
  });

  const [formData, setFormData] = useState({
    id: '', codigo: '', raza: '', fecha: '', edad: '', sexo: '', salud: '', peso: '',
  });
  const [modo, setModo] = useState('');
  const [editarIndex, setEditarIndex] = useState(null);

  const animalesFiltrados = animales[categoriaSeleccionada]?.filter((a) =>
    Object.values(a).some((val) => val.toString().toLowerCase().includes(filtro.toLowerCase()))
  );

  const abrirFormulario = (modoNuevo, index = null) => {
    setModo(modoNuevo);
    if (modoNuevo === 'editar' && index !== null) {
      setFormData(animales[categoriaSeleccionada][index]);
      setEditarIndex(index);
    } else {
      setFormData({ id: '', raza: '', fecha: '', edad: '', sexo: '', salud: '', peso: '' });
    }
  };

  const guardarAnimal = () => {
    if (!categoriaSeleccionada) return;
    const actual = [...animales[categoriaSeleccionada]];
    if (modo === 'crear') {
      actual.push({ ...formData, id: actual.length + 1 });
    } else if (modo === 'editar') {
      actual[editarIndex] = formData;
    }
    setAnimales({ ...animales, [categoriaSeleccionada]: actual });
    setFormData({ id: '', raza: '', fecha: '', edad: '', sexo: '', salud: '', peso: '' });
    setModo('');
  };

  const eliminarAnimal = (index) => {
    const copia = [...animales[categoriaSeleccionada]];
    copia.splice(index, 1);
    setAnimales({ ...animales, [categoriaSeleccionada]: copia });
  };

  const agregarCategoria = () => {
    if (!nuevaCategoria.trim()) return;
    const nueva = nuevaCategoria.trim();
    if (categorias.includes(nueva)) return;
    const nuevasCategorias = [...categorias, nueva];
    setCategorias(nuevasCategorias);
    setAnimales({ ...animales, [nueva]: [] });
    setNuevaCategoria('');
  };

  const eliminarCategoria = (nombre) => {
    const nuevasCategorias = categorias.filter((cat) => cat !== nombre);
    const nuevasEntradas = { ...animales };
    delete nuevasEntradas[nombre];
    setCategorias(nuevasCategorias);
    setAnimales(nuevasEntradas);
    if (categoriaSeleccionada === nombre) setCategoriaSeleccionada('');
  };

  const editarCategoria = (nombre: SetStateAction<string>) => {
    setCategoriaAnterior(nombre);
    setCategoriaEditada(nombre);
  };

  const guardarEdicionCategoria = () => {
    if (!categoriaEditada.trim()) return;
    const actualizadas = categorias.map((cat) =>
      cat === categoriaAnterior ? categoriaEditada : cat
    );
    const nuevasEntradas = { ...animales };
    nuevasEntradas[categoriaEditada] = animales[categoriaAnterior];
    delete nuevasEntradas[categoriaAnterior];
    setCategorias(actualizadas);
    setAnimales(nuevasEntradas);
    if (categoriaSeleccionada === categoriaAnterior) setCategoriaSeleccionada(categoriaEditada);
    setCategoriaAnterior('');
    setCategoriaEditada('');
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center">
  
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-xs"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center-safe w-full">
      
        <header className="bg-yellow-600 w-full py-4 text-center shadow-md">
          <h1 className="text-white text-3xl font-extrabold">Animales</h1>
        </header>

        <div className="flex items-center gap-2 mt-6 mb-4">
          <input
            type="text"
            placeholder="Nueva categoría"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            className="bg-gray-200 border px-4 py-2 rounded w-full max-w-xs"
          />
          <button
            onClick={agregarCategoria}
            className="bg-yellow-600 text-white px-4 py-2 rounded"
          >
            <FaPlus />
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {categorias.map((cat) => (
            <div key={cat} className="bg-gray-200 px-4 py-2 rounded flex items-center gap-2">
              <button
                onClick={() => setCategoriaSeleccionada(cat)}
                className="font-semibold text-black"
              >
                {cat}
              </button>
              <FaEdit onClick={() => editarCategoria(cat)} className="text-blue-600 cursor-pointer" />
              <FaTrash onClick={() => eliminarCategoria(cat)} className="text-red-600 cursor-pointer" />
            </div>
          ))}
        </div>

        {categoriaAnterior && (
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              value={categoriaEditada}
              onChange={(e) => setCategoriaEditada(e.target.value)}
              className="border px-3 py-2 rounded w-full max-w-sm"
            />
            <button onClick={guardarEdicionCategoria} className="bg-blue-500 text-white px-4 py-2 rounded">
              Guardar
            </button>
          </div>
        )}

        {categoriaSeleccionada && (
          <>
            <div className="flex justify-end items-center gap-2 mb-4">
              <input
                type="text"
                placeholder="Buscar..."
                className="bg-gray-200 border px-4 py-2 rounded w-full max-w-md"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              />
              <FaSearch className="text-amber-900" />
            </div>

            <div className="min-w-[800px] w-full overflow-x-auto max-w-screen-xl mx-auto">
              <table className="w-full border border-gray-300 text-center text-sm mb-6 bg-white/90 rounded shadow">
                <thead className="bg-yellow-600 font-bold">
                  <tr>
                    <th>ID</th>
                    <th>Codigo</th>
                    <th>Raza</th>
                    <th>Fecha Nac.</th>
                    <th>Edad</th>
                    <th>Sexo</th>
                    <th>Salud</th>
                    <th>Peso (kg)</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {animalesFiltrados?.map((animal, index) => (
                    <tr key={index} className="border-t">
                      <td>{animal.id}</td>
                      <td>{animal.codigo}</td>
                      <td>{animal.raza}</td>
                      <td>{animal.fecha}</td>
                      <td>{animal.edad}</td>
                      <td>{animal.sexo}</td>
                      <td>{animal.salud}</td>
                      <td>{animal.peso}</td>
                      <td className="flex gap-2 justify-center py-2">
                        <button onClick={() => abrirFormulario('editar', index)} className="text-blue-600 hover:text-blue-800">
                          <FaEdit />
                        </button>
                        <button onClick={() => eliminarAnimal(index)} className="text-red-600 hover:text-red-800">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {animalesFiltrados?.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-gray-500 py-4">No hay registros.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button onClick={() => abrirFormulario('crear')} className="bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded flex items-center gap-2">
              <FaPlus /> Añadir Animal
            </button>
          </>
        )}

        {modo && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-gray-200 border-rounded p-6 rounded shadow-lg w-full max-w-2xl">
              <h3 className="text-xl font-bold items-center mb-4">
                {modo === 'crear' ? 'Agregar Animal' : 'Editar Animal'}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input placeholder="Codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="bg-gray-300 border rounded px-3 py-2" />
                <input placeholder="Raza" value={formData.raza} onChange={(e) => setFormData({ ...formData, raza: e.target.value })} className="bg-gray-300 border rounded px-3 py-2" />
                <input placeholder="Fecha Nac." type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="bg-gray-300 border rounded px-3 py-2" />
                <input placeholder="Edad" value={formData.edad} onChange={(e) => setFormData({ ...formData, edad: e.target.value })} className="bg-gray-300 border rounded px-3 py-2" />
                <input placeholder="Sexo" value={formData.sexo} onChange={(e) => setFormData({ ...formData, sexo: e.target.value })} className="bg-gray-300 border rounded px-3 py-2" />
                <input placeholder="Salud" value={formData.salud} onChange={(e) => setFormData({ ...formData, salud: e.target.value })} className="bg-gray-300 border rounded px-3 py-2" />
                <input placeholder="Peso" type="number" value={formData.peso} onChange={(e) => setFormData({ ...formData, peso: e.target.value })} className="bg-gray-300 border rounded px-3 py-2" />
                
              </div>
              <div className="flex justify-end gap-4">
                <button onClick={() => setModo('')} className="text-gray-700 hover:text-gray-900">Cancelar</button>
                <button onClick={guardarAnimal} className="bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-2 rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
