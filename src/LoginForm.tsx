import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onValidation: (msg: string) => void;
}

export default function LoginForm({ onValidation }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onValidation("✅ Inicio de sesión exitoso");
    } catch (error: any) {
      onValidation(`❌ ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border rounded p-2"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border rounded p-2"
        required
      />

      <button
        type="submit"
        className="text-white rounded py-2 hover:bg-blue-600 transition"
        style={{ backgroundColor: "#099757dc" }}
      >
        Iniciar Sesión
      </motion.button>

      <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        className="text-xs sm:text-sm text-blue-700 hover:underline mt-1 self-center"
      >
        ¿Olvidaste tu contraseña?
      </button>

      {/* Redirigir a pantalla de recuperación */}
      <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        className="text-sm text-blue-700 hover:underline mt-1 self-start"
      >
        ¿Olvidaste tu contraseña?
      </button>
    </form>
  );
}
