import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export function RegisterForm({ onRegisterSuccess }: { onRegisterSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuario registrado con éxito");
      onRegisterSuccess(); // Cambia a la vista de login
    } catch (error) {
      console.error("Error al registrar usuario:", error);
    }
  };

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
        required
      />
      <button
        type="submit"
        className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700"
      >
        Registrarse
      </button>
    </form>
  );
}
