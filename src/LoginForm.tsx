import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";

interface LoginFormProps {
  onValidation: (msg: string) => void;
}

export default function LoginForm({ onValidation }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <motion.form
      onSubmit={handleLogin}
      className="flex flex-col gap-4 bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Email */}
      <div className="relative">
        <FaEnvelope className="absolute left-3 top-3 text-gray-500" />
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#099757] transition text-sm sm:text-base"
          required
        />
      </div>

      {/* Password con mostrar/ocultar */}
      <div className="relative">
        <FaLock className="absolute left-3 top-3 text-gray-500" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-10 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#099757] transition text-sm sm:text-base"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-2.5 text-gray-500 hover:text-[#099757] transition"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* Botón principal */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        className="bg-[#099757] text-white font-semibold py-2 sm:py-3 rounded-xl shadow-md hover:bg-[#077848] transition-all duration-300 text-sm sm:text-base"
      >
        Iniciar Sesión
      </motion.button>

      {/* Recuperar contraseña */}
      <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        className="text-xs sm:text-sm text-blue-700 hover:underline mt-1 self-center"
      >
        ¿Olvidaste tu contraseña?
      </button>
    </motion.form>
  );
}
