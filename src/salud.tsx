import React from "react";

export default function Salud() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Salud</h1>
      <p className="mb-4">Registro de vacunas, tratamientos y alertas sanitarias.</p>

      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-4 py-2">Especie</th>
            <th className="border px-4 py-2">Vacuna</th>
            <th className="border px-4 py-2">Fecha</th>
            <th className="border px-4 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">Vacas</td>
            <td className="border px-4 py-2">Brucelosis</td>
            <td className="border px-4 py-2">2025-09-15</td>
            <td className="border px-4 py-2">Completado</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Ovejas</td>
            <td className="border px-4 py-2">Fiebre aftosa</td>
            <td className="border px-4 py-2">2025-09-18</td>
            <td className="border px-4 py-2">Pendiente</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}