import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

interface LoginFormProps {
  onValidation: (msg: string) => void;
}

export default function LoginForm({ onValidation }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", userCredential.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        onValidation("❌ Usuario no encontrado en Firestore.");
        return;
      }

      const data = userSnap.data() as any;

      if (!data.role) {
        onValidation("❌ Usuario creado, espera a que el admin le asigne acceso.");
        return;
      }

      onValidation("✅ Inicio de sesión exitoso.");
      navigate("/home");

    } catch (err: any) {
      onValidation(`❌ ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Correo electrónico"
        className="border rounded px-3 py-2 focus:outline-none"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        className="border rounded px-3 py-2 focus:outline-none"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="bg-[#ce8423] hover:bg-[#b0701d] text-white py-2 rounded">
        Iniciar sesión
      </button>
    </form>
  );
}
