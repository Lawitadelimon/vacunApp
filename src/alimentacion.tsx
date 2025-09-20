import React from "react";

export default function Alimentacion() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Alimentación</h1>
      <p className="mb-4">Plan de dietas y control de consumo de alimentos por especie/lote.</p>

      <ul className="list-disc ml-6">
        <li>Vacas: 10 kg de pasto + 2 kg de concentrado diario</li>
        <li>Cerdos: 5 kg de maíz + 1 kg de suplemento diario</li>
        <li>Ovejas: 4 kg de pasto + 0.5 kg de concentrado diario</li>
      </ul>
    </div>
  );
}
