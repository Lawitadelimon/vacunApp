import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import goats from "./assets/pastito.jpg";
import LoginForm from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { useNavigate } from "react-router-dom";
import { useUser } from "./UserContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user?.role) {
      navigate("/home"); // Redirige si el usuario ya tiene un rol
    }
  }, [user, loading, navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        Cargando usuario...
      </div>
    );

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#e99f55] to-[#fdd3a3]"
      style={{ backgroundImage: `url(${goats})`, backgroundSize: "cover" }}
    >
      <motion.div
        key={isLogin ? "login" : "register"}
        initial={{ opacity: 0, x: isLogin ? 100 : -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isLogin ? -100 : 100 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-lg w-[95%] max-w-4xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* Panel izquierdo */}
        <div className="w-full md:w-1/2 bg-[#ce8423] text-white p-8 md:p-10 flex flex-col justify-center items-center text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            {isLogin ? "¡Bienvenido a AniManager!" : "¡Hola!"}
          </h2>
          <p className="mb-6 text-sm md:text-base">
            {isLogin
              ? "Inicie sesión para utilizar todas las funciones del sitio"
              : "Regístrese con sus datos personales para utilizar todas las funciones del sitio"}
          </p>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="border border-white py-2 px-4 rounded hover:bg-white hover:text-[#813624] transition text-sm md:text-base"
          >
            {isLogin ? "REGISTRARSE" : "INICIAR SESIÓN"}
          </button>
        </div>

        {/* Panel derecho */}
        <div className="w-full md:w-1/2 p-6 md:p-10">
          <h2 className="text-xl md:text-2xl font-bold mb-6">
            {isLogin ? "Iniciar Sesión" : "Registro"}
          </h2>

          {isLogin ? (
            <LoginForm />
          ) : (
            <RegisterForm
              onRegisterSuccess={() => {
                setIsLogin(true);
              }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
