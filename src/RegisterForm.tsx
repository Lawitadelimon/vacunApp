import { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Swal from "sweetalert2";

interface RegisterFormProps {
  onRegisterSuccess: () => void;
}

export function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      Swal.fire("Error", "❌ Por favor, ingresa tu nombre.", "warning");
      return;
    }

    if (!email || !password) {
      Swal.fire("Error", "❌ Completa todos los campos.", "warning");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      const usersSnapshot = await getDocs(collection(db, "users"));
      const isFirstUser = usersSnapshot.empty;

      await setDoc(doc(db, "users", newUser.uid), {
        name,
        email,
        role: isFirstUser ? "admin" : "pending",
        createdAt: new Date().toISOString(),
      });

      await Swal.fire(
        "Usuario creado",
        "✅ Usuario creado correctamente. Contacta a tu administrador para obtener acceso.",
        "success"
      );

      await signOut(auth);
      onRegisterSuccess();
    } catch (error: any) {
      Swal.fire("Error", "❌ Error al crear usuario: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleRegister}
      className="flex flex-col gap-4 bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-sm mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Nombre */}
      <div className="relative">
        <FaUser className="absolute left-3 top-3 text-gray-500" />
        <input
          type="text"
          placeholder="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#099757] transition text-sm sm:text-base"
          required
        />
      </div>

      {/* Correo */}
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

      {/* Contraseña */}
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
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* Botón */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={loading}
        className={`${
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#077848]"
        } bg-[#099757] text-white font-semibold py-2 sm:py-3 rounded-xl shadow-md transition-all duration-300 text-sm sm:text-base`}
      >
        {loading ? "Creando cuenta..." : "Registrarse"}
      </motion.button>
    </motion.form>
  );
}
