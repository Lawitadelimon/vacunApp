import React from "react";

export default function Reportes() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Reportes</h1>
      <p className="mb-4">Estadísticas de consumo de alimento, mortalidad y reproducción.</p>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="font-bold mb-2">Consumo de alimento por especie</h2>
          <p>Vacas: 1000 kg / mes</p>
          <p>Cerdos: 500 kg / mes</p>
          <p>Ovejas: 300 kg / mes</p>
        </div>

        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="font-bold mb-2">Mortalidad por especie</h2>
          <p>Vacas: 2%</p>
          <p>Cerdos: 1.5%</p>
          <p>Ovejas: 0.5%</p>
        </div>
      </div>
    </div>
  );
}
