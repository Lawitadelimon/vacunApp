export default function Notificaciones({ tareas }) {
  const hoy = new Date().toISOString().split('T')[0];

  const parseFecha = (fecha) => {
    if (fecha.toLowerCase() === 'hoy') return hoy;
    const [dia, mes, anio] = fecha.split('/');
    if (!dia || !mes || !anio) return '';
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  };

  const tareasPendientes = tareas.filter((t) => {
    const fechaNormalizada = parseFecha(t.fecha);
    return fechaNormalizada >= hoy;
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-yellow-700 mb-4">Tareas Pendientes</h2>

      {tareasPendientes.length === 0 ? (
        <p className="text-gray-600">No hay tareas pendientes.</p>
      ) : (
        <ul className="space-y-4">
          {tareasPendientes.map((t, index) => (
            <li
              key={index}
              className="p-3 bg-yellow-100 rounded shadow space-y-1"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{t.titulo}</span>
                <span className="text-sm text-yellow-700">{t.fecha}</span>
              </div>
              <div className="text-sm text-gray-700 italic">Para: {t.para}</div>
              {t.categoria && (
                <div className="text-sm text-gray-500">Categoría: {t.categoria}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
