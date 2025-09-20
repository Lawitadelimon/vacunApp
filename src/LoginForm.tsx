import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export default function LoginForm({ onValidation = () => {} }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({}); 
  const validateFields = () => {
    let newErrors = {};

    if (!email) {
      newErrors.email = "El correo es obligatorio.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Formato de correo inválido.";
    }

    if (!password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (password.length < 6) {
      newErrors.password = "Debe tener al menos 6 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateFields()) {
      onValidation("❌ Corrige los errores antes de continuar.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onValidation("✅ Sesión iniciada correctamente.");
    } catch (error) {
      onValidation("❌ Contraseña o usuario incorrectos.");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full border rounded px-3 py-2 ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      <div>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full border rounded px-3 py-2 ${
            errors.password ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-[#ce8423] text-white py-2 rounded hover:bg-[#a15d18] transition"
      >
        Iniciar Sesión
      </button>
    </form>
  );
}
