import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBars, FaBell, FaHome, FaSave, FaTimes } from "react-icons/fa";
import { db } from "./firebase";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDocs, setDoc, collection } from "firebase/firestore";
import cowsBackground from "./assets/cows2.jpg";

type Animal = {
  loteId?: string | null;
  id?: string;
  especie: string;
  codigo: string;
  raza: string;
  sexo: string;
  edad: string;
  estado?: string;
};

export default function Alimentacion() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();

  const animalParam = location.state?.animal as Animal | undefined;
  const loteIdParam = location.state?.loteId as string | undefined;

  const [animal, setAnimal] = useState<Animal | null>(animalParam || null);
  const [loteId, setLoteId] = useState<string | null>(loteIdParam || null);
  const [planPersonalizado, setPlanPersonalizado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [animalesDisponibles, setAnimalesDisponibles] = useState<Animal[]>([]);

  const [menuAbierto, setMenuAbierto] = useState(false);
  
    const handleLogout = async () => {
      await signOut(auth);
      navigate("/");
    };

  const planes: Record<string, string> = {
    Bovino: "10 kg de pasto + 2 kg de concentrado diario",
    Porcino: "5 kg de maíz + 1 kg de suplemento diario",
    Ovino: "4 kg de pasto + 0.5 kg de concentrado diario",
    Caprino: "4 kg de forraje + 0.5 kg de suplemento diario",
    Equino: "12 kg de heno + 3 kg de avena diario",
  };

  const cargarAnimalesEnNutricion = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const lotesSnap = await getDocs(collection(db, "lotes"));
    let animalesNutricion: Animal[] = [];

    for (const loteDoc of lotesSnap.docs) {
      const animSnap = await getDocs(collection(db, "lotes", loteDoc.id, "animales"));
      animalesNutricion.push(
        ...animSnap.docs
          .map(d => ({ id: d.id, ...(d.data() as Animal), loteId: loteDoc.id }))
          .filter(a => a.estado === "en nutricion")
      );
    }

    setAnimalesDisponibles(animalesNutricion);

    if (animalesNutricion.length > 0) {
      setAnimal(animalesNutricion[0]);
      setLoteId(animalesNutricion[0].loteId!);
      setPlanPersonalizado(planes[animalesNutricion[0].especie] || "");
    } else {
      setAnimal(null);
      setLoteId(null);
      setPlanPersonalizado("");
    }
  };

  useEffect(() => { cargarAnimalesEnNutricion(); }, []);

  const guardarPlan = async () => {
    if (!animal?.id || !loteId) return;
    const user = auth.currentUser;
    if (!user) return;

    setGuardando(true);
    try {
      const ref = doc(db, "lotes", loteId, "animales", animal.id);
      await setDoc(ref, { planAlimentacion: planPersonalizado }, { merge: true });
      setMensaje("✅ Plan guardado correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error al guardar el plan.");
    } finally {
      setGuardando(false);
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  const quitarDeAlimentacion = async () => {
    if (!animal?.id || !loteId) return;
    const ref = doc(db, "lotes", loteId, "animales", animal.id);
    await setDoc(ref, { estado: "vivo" }, { merge: true });
    await cargarAnimalesEnNutricion();
  };

  const planBase = animal?.especie ? planes[animal.especie] : null;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${cowsBackground})` }} />
      <div className="absolute inset-0 bg-white/20" />

      <nav className="sticky top-0 z-50 bg-green-500 text-black flex items-center justify-between p-4 shadow-lg">
              <div className="flex items-center gap-4">
                
                <h1 className="text-2xl font-extrabold">Alimentacion</h1>
              </div>
      
              <div className="flex items-center gap-4">
                <button onClick={() => navigate("/home")} className="hover:text-green-300 transition">
                  <FaHome size={20} />
                </button>
                <button onClick={() => navigate("/notificaciones")} className="hover:text-green-300 transition">
                  <FaBell size={20} />
                </button>
                <button onClick={() => setMenuAbierto(!menuAbierto)} className="md:hidden hover:text-green-300">
                  {menuAbierto ? <FaTimes size={22} /> : <FaBars size={22} />}
                </button>
                <button onClick={handleLogout} className="hidden md:inline bg-green-400 text-black font-semibold px-3 py-1 rounded-xl hover:bg-green-600">
                  Cerrar sesión
                </button>
              </div>
      
              {menuAbierto && (
                <div className="absolute top-full right-0 bg-white text-black w-48 rounded-b-lg shadow-lg md:hidden">
                  <button onClick={() => navigate("/notificaciones")} className="w-full text-left px-4 py-2 hover:bg-gray-200">🔔 Notificaciones</button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-200">🚪 Cerrar sesión</button>
                </div>
              )}
            </nav>
      

      <div className="relative p-6 md:p-9 flex flex-col gap-6">
        {animal ? (
          <div className="bg-white/30 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">🐾 Animal en nutrición</h2>

            {animalesDisponibles.length > 1 && (
              <div className="mb-4">
                <label className="mr-2 font-medium">Selecciona animal:</label>
                <select
                  value={animal.id}
                  onChange={e => {
                    const sel = animalesDisponibles.find(a => a.id === e.target.value);
                    if (sel) {
                      setAnimal(sel);
                      setLoteId(sel.loteId!);
                      setPlanPersonalizado(planes[sel.especie] || "");
                    }
                  }}
                  className="border border-white/50 bg-white/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {animalesDisponibles.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.codigo} - {a.especie} - {a.raza}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-gray-800 mb-4">
              <p><strong>Código:</strong> {animal.codigo}</p>
              <p><strong>Especie:</strong> {animal.especie}</p>
              <p><strong>Raza:</strong> {animal.raza}</p>
              <p><strong>Sexo:</strong> {animal.sexo}</p>
              <p><strong>Edad:</strong> {animal.edad}</p>
              <p><strong>Estado:</strong> {animal.estado}</p>
            </div>

            <textarea
              value={planPersonalizado}
              onChange={e => setPlanPersonalizado(e.target.value)}
              rows={5}
              className="w-full border border-white/50 bg-white/50 rounded-2xl p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
            />

            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={guardarPlan}
                disabled={guardando}
                className={`flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-2xl transition ${guardando ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <FaSave /> {guardando ? "Guardando..." : "Guardar Plan"}
              </button>

              <button
                onClick={quitarDeAlimentacion}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-2xl transition"
              >
                Quitar de nutrición
              </button>

              {mensaje && <span className="text-sm text-gray-800 font-medium">{mensaje}</span>}
            </div>

            {planBase && (
              <p className="mt-4 text-gray-800 text-sm">
                📋 Plan base sugerido para esta especie: <em>{planBase}</em>
              </p>
            )}
          </div>
        ) : (
          <p className="text-black mb-6">No hay animales en nutrición disponibles.</p>
        )}
      </div>
       <footer className="w-screen bg-[#094297dc] py-3 md:py-4 text-center text-xs md:text-sm text-white relative z-10">
          <p>© 2025 INNOVASYSTEM. Todos los derechos reservados.</p>
        </footer>
    </div>
  );
}
