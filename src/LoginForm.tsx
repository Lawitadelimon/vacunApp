import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

interface Props {
  onValidation: (msg: string) => void;
}

export default function LoginForm({ onValidation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Revisar role
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        if (!data.role) {
          onValidation("❌ Usuario pendiente de aprobación por admin.");
          return;
        }
      }

      onValidation("✅ Inicio de sesión exitoso");
    } catch (err: any) {
      onValidation("❌ " + err.message);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-2 border rounded"
        required
      />
      <button
        type="submit"
        className="bg-green-500 hover:bg-green-700 text-white py-2 rounded"
      >
        Iniciar Sesión
      </button>
    </form>
  );
}
