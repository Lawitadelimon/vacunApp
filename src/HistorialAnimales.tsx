import autoTable from "jspdf-autotable";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import logoRancho from "./assets/logo.jpg";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { FaHome, FaBell, FaTimes, FaBars } from "react-icons/fa";
import cowsBackground from "./assets/cows2.jpg";

interface Animal {
  id: string;
  codigo: string;
  fechaMuerte?: string;
  fechaVenta?: string;
}

interface DiaResumen {
  dia: string;
  muertos: number;
  vendidos: number;
  codigosMuertos: string;
  codigosVendidos: string;
}

export default function Estadisticas() {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState(() => new Date());
  const [resumen, setResumen] = useState<DiaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  useEffect(() => {
    cargarAnimales();
  }, []);

  useEffect(() => {
    procesarResumen();
  }, [animales, mesSeleccionado]);

  const cargarAnimales = async () => {
    setLoading(true);
    const colecciones = ["lotes", "lotesnuevos"];
    let todos: Animal[] = [];

    for (const col of colecciones) {
      const lotesSnap = await getDocs(collection(db, col));
      for (const loteDoc of lotesSnap.docs) {
        const animalesSnap = await getDocs(
          collection(db, col, loteDoc.id, "animales")
        );
        todos.push(
          ...animalesSnap.docs.map((a) => ({
            id: a.id,
            codigo: a.data().codigo,
            fechaMuerte: a.data().fechaMuerte,
            fechaVenta: a.data().fechaVenta,
          }))
        );
      }
    }

    setAnimales(todos);
    setLoading(false);
  };

  const procesarResumen = () => {
    const inicio = startOfMonth(mesSeleccionado);
    const fin = endOfMonth(mesSeleccionado);
    const dias = eachDayOfInterval({ start: inicio, end: fin });

    const resumenDias: DiaResumen[] = dias.map((d) => {
      const muertosArr = animales.filter(
        (a) =>
          a.fechaMuerte &&
          isWithinInterval(parseISO(a.fechaMuerte), { start: inicio, end: fin }) &&
          parseISO(a.fechaMuerte).getDate() === d.getDate()
      );
      const vendidosArr = animales.filter(
        (a) =>
          a.fechaVenta &&
          isWithinInterval(parseISO(a.fechaVenta), { start: inicio, end: fin }) &&
          parseISO(a.fechaVenta).getDate() === d.getDate()
      );

      return {
        dia: format(d, "dd MMM", { locale: es }),
        muertos: muertosArr.length,
        vendidos: vendidosArr.length,
        codigosMuertos: muertosArr.map((a) => a.codigo).join(", "),
        codigosVendidos: vendidosArr.map((a) => a.codigo).join(", "),
      };
    });

    setResumen(resumenDias);
  };

  const exportarPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const margin = 14;

    doc.addImage(logoRancho, "PNG", margin, 10, 25, 25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Rancho El Paraíso", margin + 30, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Reporte mensual de animales", margin + 30, 26);
    doc.setFontSize(10);
    doc.text(`Fecha: ${format(new Date(), "dd/MM/yyyy")}`, 195, 18, { align: "right" });

    doc.setFontSize(12);
    doc.text(`Mes: ${format(mesSeleccionado, "MMMM yyyy", { locale: es })}`, margin, 42);

    const tableData = resumen.map((r) => [
      r.dia,
      r.muertos,
      r.codigosMuertos,
      r.vendidos,
      r.codigosVendidos,
    ]);

    autoTable(doc, {
      head: [["Día", "Muertos", "Códigos Muertos", "Vendidos", "Códigos Vendidos"]],
      body: tableData,
      startY: 48,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [255, 145, 0], textColor: 255, halign: "center" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { halign: "center", cellWidth: 25 },
        1: { halign: "center", cellWidth: 20 },
        3: { halign: "center", cellWidth: 20 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 48;
    const totalMuertos = resumen.reduce((sum, r) => sum + r.muertos, 0);
    const totalVendidos = resumen.reduce((sum, r) => sum + r.vendidos, 0);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(
      `Totales del mes — Muertos: ${totalMuertos} | Vendidos: ${totalVendidos}`,
      margin,
      finalY + 10
    );

    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(
      `Generado automáticamente por Animanager – ${format(new Date(), "dd/MM/yyyy")}`,
      105,
      pageHeight - 10,
      { align: "center" }
    );

    doc.save(`Reporte_Rancho_${format(mesSeleccionado, "MM_yyyy")}.pdf`);
  };

  if (loading)
    return <div className="text-center py-10 text-white">Cargando...</div>;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-[2px]"
        style={{ backgroundImage: `url(${cowsBackground})` }}
      />
      <div className="absolute inset-0 bg-white/30" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-orange-500 text-black flex items-center justify-between p-4 shadow-lg">
        <h1 className="text-lg md:text-2xl font-extrabold text-center md:text-left">
          Estadísticas de animales 
        </h1>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="hover:text-orange-300 transition">
            <FaHome size={20} />
          </button>
          <button onClick={() => navigate("/notificaciones")} className="hover:text-orange-300 transition">
            <FaBell size={20} />
          </button>
          <button
            onClick={handleLogout}
            className="bg-orange-600 text-black font-semibold px-3 py-1 rounded-xl hover:bg-orange-300 transition"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="md:hidden hover:text-orange-300 transition"
        >
          {menuAbierto ? <FaTimes size={22} /> : <FaBars size={22} />}
        </button>

        {/* Mobile dropdown */}
        {menuAbierto && (
          <div className="absolute top-full right-2 bg-white/40 text-black rounded-xl shadow-lg md:hidden flex flex-col items-center py-3 gap-3 w-48 animate-fadeIn">
            <button
              onClick={() => {
                navigate("/home");
                setMenuAbierto(false);
              }}
              className="w-4/5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2 font-semibold"
            >
              <FaHome /> Inicio
            </button>
            <button
              onClick={() => {
                navigate("/notificaciones");
                setMenuAbierto(false);
              }}
              className="w-4/5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2 font-semibold"
            >
              <FaBell /> Notificaciones
            </button>
            <button
              onClick={() => {
                handleLogout();
                setMenuAbierto(false);
              }}
              className="w-4/5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-semibold"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>

      {/* Contenido */}
      <main className="relative flex-1 overflow-y-auto p-4 md:p-10 pb-20">
        <div className="bg-white/30 backdrop-blur-md border border-white/40 p-4 md:p-6 rounded-3xl shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-lg md:text-xl font-bold text-center md:text-left">
              Reporte mensual 📊
            </h2>
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <input
                type="month"
                value={format(mesSeleccionado, "yyyy-MM")}
                onChange={(e) => setMesSeleccionado(new Date(e.target.value + "-01"))}
                className="px-3 py-1 rounded text-black font-semibold bg-white/70"
              />
              <button
                onClick={exportarPDF}
                className="bg-orange-500 px-4 py-2 rounded-xl hover:bg-orange-600 text-white font-semibold transition"
              >
                📄 Descargar PDF
              </button>
            </div>
          </div>

          <div className="bg-gray-600 p-4 rounded mb-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={resumen}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="muertos" stroke="#ef4444" name="Muertos" />
                <Line type="monotone" dataKey="vendidos" stroke="#f97316" name="Vendidos" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-600 p-4 rounded overflow-x-auto">
            <table className="w-full min-w-[600px] text-white border-collapse text-sm md:text-base">
              <thead>
                <tr className="bg-orange-500 text-black">
                  <th className="p-2 border">Día</th>
                  <th className="p-2 border">Muertos</th>
                  <th className="p-2 border">Códigos Muertos</th>
                  <th className="p-2 border">Vendidos</th>
                  <th className="p-2 border">Códigos Vendidos</th>
                </tr>
              </thead>
              <tbody>
                {resumen.map((r) => (
                  <tr key={r.dia} className="even:bg-gray-700 text-center">
                    <td className="p-2 border">{r.dia}</td>
                    <td className="p-2 border">{r.muertos}</td>
                    <td className="p-2 border break-words">{r.codigosMuertos}</td>
                    <td className="p-2 border">{r.vendidos}</td>
                    <td className="p-2 border break-words">{r.codigosVendidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 text-right text-lg md:text-xl font-bold text-white">
              Total Muertos: {resumen.reduce((sum, r) => sum + r.muertos, 0)} | Total Vendidos:{" "}
              {resumen.reduce((sum, r) => sum + r.vendidos, 0)}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#099757dc] py-3 md:py-4 text-center text-xs md:text-sm text-white">
        © 2025 INNOVASYSTEM. Todos los derechos reservados.
      </footer>
    </div>
  );
}
