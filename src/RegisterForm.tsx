import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onValidation?: (message: string) => void; 
}

export function RegisterForm({ onRegisterSuccess, onValidation = () => {} }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateFields = () => {
    let newErrors: { email?: string; password?: string } = {};

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      onValidation("❌ Corrige los errores antes de continuar.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      onValidation("✅ Registro exitoso. Ahora puede iniciar sesión.");
      onRegisterSuccess();
    } catch (error: any) {
      onValidation("❌ Error al registrar usuario ");
    }
  };

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      <div>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full border p-2 rounded ${errors.email ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>

      <div>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full border p-2 rounded ${errors.password ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
      </div>

      <button
        type="submit"
        className="bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 transition"
      >
        Registrarse
      </button>
    </form>
  );
}
