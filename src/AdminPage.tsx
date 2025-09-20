import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        role: "worker"
      });
      setMsg("✅ Trabajador creado con éxito");
      setEmail("");
      setPassword("");
    } catch {
      setMsg("❌ Error al crear trabajador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form onSubmit={handleCreateWorker} className="flex flex-col gap-4 bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-2">Crear Trabajador</h2>
        {msg && <p className="text-center">{msg}</p>}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo del trabajador"
          className="border p-2 rounded"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          type="password"
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-600 text-white py-2 rounded hover:bg-yellow-700"
        >
          {loading ? "Creando..." : "Crear Trabajador"}
        </button>
      </form>
    </div>
  );
}
