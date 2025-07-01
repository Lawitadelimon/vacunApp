import React from 'react';

type Tarea = {
  titulo: string;
  para: string;
  categoria?: string;
  fecha: string;
};

type Props = {
  tareas: Tarea[];
};

export default function Notificaciones({ tareas }: Props) {
  const hoy = new Date();

  const tareasRelevantes = tareas.filter((t) => {
    const fechaTarea = new Date(t.fecha);
    if (isNaN(fechaTarea.getTime())) return false;
    const diff = (fechaTarea.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 3; // Dentro de 3 días o vencidas
  });

  if (tareasRelevantes.length === 0) {
    return (
      <div className="text-center text-gray-600">
        <p className="text-lg font-semibold mb-2">Sin notificaciones por ahora 💤</p>
        <p>Todo está al día. ¡Buen trabajo!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-yellow-800 mb-4 text-center">
        Notificaciones
      </h2>
      <ul className="space-y-4">
        {tareasRelevantes.map((tarea, index) => {
          const fechaTarea = new Date(tarea.fecha);
          const vencida = fechaTarea < hoy;
          return (
            <li
              key={index}
              className={`p-4 rounded-lg shadow ${
                vencida ? 'bg-red-100' : 'bg-yellow-100'
              }`}
            >
              <h3 className="text-yellow-700 font-semibold">{tarea.titulo}</h3>
              <p className="text-gray-700">Asignado para: {tarea.para}</p>
              {tarea.categoria && (
                <p className="text-gray-600 italic">Categoría: {tarea.categoria}</p>
              )}
              <p
                className={`text-sm font-medium ${
                  vencida ? 'text-red-700' : 'text-yellow-800'
                }`}
              >
                {vencida ? '¡Vencida! ' : 'Fecha límite: '}
                {tarea.fecha}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
