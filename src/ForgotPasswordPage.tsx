import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import pastoImagen from "./assets/pastito.jpg";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage("❌ Ingresa tu correo para recuperar contraseña");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ Revisa tu correo para restablecer la contraseña");
    } catch (error: any) {
      setMessage(`❌ ${error.message}`);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Fondo */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${pastoImagen})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/50 backdrop-blur-[3px]" />

      {/* Contenido */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center justify-center w-[90%] max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl bg-white/80 backdrop-blur-md"
      >
        <h2 className="text-xl sm:text-2xl font-extrabold text-center text-[#000000] mb-4">
          Recuperar Contraseña
        </h2>

        {/* Mensaje dinámico */}
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mb-4 p-3 rounded-lg text-sm font-medium w-full text-center ${
              message.startsWith("❌")
                ? "bg-red-100 text-red-700 border border-red-400"
                : "bg-green-100 text-green-700 border border-green-400"
            }`}
          >
            {message}
          </motion.div>
        )}

        {/* Formulario */}
        <form onSubmit={handleReset} className="flex flex-col w-full gap-3">
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

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="bg-[#099757] text-white font-semibold py-2 sm:py-3 rounded-xl shadow-md hover:bg-[#077848] transition-all duration-300 text-sm sm:text-base"
          >
            Enviar enlace de recuperación
          </motion.button>
        </form>

        {/* Botón volver */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate("/auth")}
          className="mt-4 flex items-center gap-2 text-sm sm:text-base text-blue-700 hover:underline"
        >
          <FaArrowLeft /> Volver al login
        </motion.button>
      </motion.div>
    </div>
  );
}
