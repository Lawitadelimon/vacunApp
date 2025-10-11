import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { getAuth } from "firebase/auth";

type AnimalHistorial = {
  id?: string;
  codigo: string;
  especie: string;
  raza: string;
  sexo: string;
  fechaNacimiento: string;
  edad: string;
  estado: "muerto" | "vendido";
  precio?: number;
  fechaAccion: string;
};

function getSemana(fechaStr: string) {
  const fecha = new Date(fechaStr);
  const primerDia = new Date(fecha.getFullYear(), 0, 1);
  const dia = Math.floor((fecha.getTime() - primerDia.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil((dia + primerDia.getDay() + 1) / 7);
}

export default function HistorialAnimales() {
  const [animales, setAnimales] = useState<AnimalHistorial[]>([]);
  const [filtro, setFiltro] = useState<"muerto" | "vendido">("muerto");
  const [datosGrafica, setDatosGrafica] = useState<any[]>([]);

  const auth = getAuth();

  useEffect(() => {
    const cargarDatos = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const lotesSnap = await getDocs(query(collection(db, "lotes"), where("uid", "==", user.uid)));
      const lotes = lotesSnap.docs.map(doc => ({ id: doc.id }));

      let todosHistorial: AnimalHistorial[] = [];

      for (const lote of lotes) {
        const historialSnap = await getDocs(collection(db, "lotes", lote.id!, "historial"));
        const historial = historialSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as AnimalHistorial) }));
        todosHistorial = todosHistorial.concat(historial);
      }

      setAnimales(todosHistorial);
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    const animalesFiltrados = animales.filter(a => a.estado === filtro);
    const porSemana: Record<number, any> = {};

    animalesFiltrados.forEach(a => {
      const semana = getSemana(a.fechaAccion); 
      if (!porSemana[semana]) porSemana[semana] = { semana, cantidad: 0, total: 0 };
      porSemana[semana].cantidad += 1;
      if (filtro === "vendido" && a.precio) porSemana[semana].total += a.precio;
    });

    // Ordenar semanas y acumular
    const semanasOrdenadas = Object.values(porSemana).sort((a, b) => a.semana - b.semana);
    let acumulado = 0;
    semanasOrdenadas.forEach(s => {
      acumulado += s.cantidad;
      s.acumulado = acumulado;
      if (filtro === "vendido") {
        s.totalAcumulado = (s.totalAcumulado || 0) + s.total;
      }
    });

    setDatosGrafica(semanasOrdenadas);
  }, [animales, filtro]);

  const animalesTabla = animales.filter(a => a.estado === filtro);

  return (
    <div className="p-6 bg-white/80 backdrop-blur-md rounded-3xl shadow-lg space-y-6">
      <h2 className="text-2xl font-bold mb-2">Historial de Animales</h2>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Mostrar:</label>
        <select
          value={filtro}
          onChange={e => setFiltro(e.target.value as "muerto" | "vendido")}
          className="border rounded px-2 py-1"
        >
          <option value="muerto">Muertos</option>
          <option value="vendido">Vendidos</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-md">
        <table className="w-full border-collapse text-left">
          <thead className="bg-teal-500 text-white">
            <tr>
              <th className="p-2 border">Código</th>
              <th className="p-2 border">Especie</th>
              <th className="p-2 border">Raza</th>
              <th className="p-2 border">Sexo</th>
              <th className="p-2 border">Fecha Nac.</th>
              <th className="p-2 border">Edad</th>
              <th className="p-2 border">Fecha Acción</th>
              {filtro === "vendido" && <th className="p-2 border">Precio</th>}
            </tr>
          </thead>
          <tbody>
            {animalesTabla.map(a => (
              <tr key={a.id} className="border-b hover:bg-yellow-50 transition-colors">
                <td className="p-2 border">{a.codigo}</td>
                <td className="p-2 border">{a.especie}</td>
                <td className="p-2 border">{a.raza}</td>
                <td className="p-2 border">{a.sexo}</td>
                <td className="p-2 border">{a.fechaNacimiento}</td>
                <td className="p-2 border">{a.edad}</td>
                <td className="p-2 border">{new Date(a.fechaAccion).toLocaleDateString()}</td>
                {filtro === "vendido" && <td className="p-2 border">{a.precio}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white/50 p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-2 text-gray-700">
          {filtro === "muerto" ? "Muertes Semanales (Acumuladas)" : "Ventas Semanales (Acumuladas)"}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={datosGrafica} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semana" label={{ value: "Semana", position: "insideBottom", offset: -5 }} />
            <YAxis label={{ value: "Cantidad", angle: -90, position: "insideLeft" }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cantidad" stroke={filtro === "muerto" ? "#f87171" : "#34d399"} name="Cantidad" />
            <Line type="monotone" dataKey="acumulado" stroke="#0d9488" name="Acumulado" />
            {filtro === "vendido" && <Line type="monotone" dataKey="totalAcumulado" stroke="#059669" name="Monto Total Acumulado" />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
