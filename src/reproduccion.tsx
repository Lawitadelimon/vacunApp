import React from "react";

export default function Reproduccion() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Reproducción</h1>
      <p className="mb-4">Aquí puedes ver y gestionar los ciclos reproductivos de los animales.</p>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Especie</th>
            <th className="border px-4 py-2">Fecha de celo</th>
            <th className="border px-4 py-2">Inseminación</th>
            <th className="border px-4 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">Vacas</td>
            <td className="border px-4 py-2">2025-09-19</td>
            <td className="border px-4 py-2">Artificial</td>
            <td className="border px-4 py-2">Pendiente</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Ovejas</td>
            <td className="border px-4 py-2">2025-09-20</td>
            <td className="border px-4 py-2">Natural</td>
            <td className="border px-4 py-2">Completo</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
