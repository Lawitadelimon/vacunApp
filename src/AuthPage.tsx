import { useState } from "react";
import LoginForm from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { motion } from "framer-motion";

export default function AuthPage() {
    console.log("Se esta renderizando");
const [isLogin, setIsLogin] = useState(true);

return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#c7a27c] to-[#e0c4a3]">
    <motion.div
        key={isLogin ? "login" : "register"}
        initial={{ opacity: 0, x: isLogin ? 100 : -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: isLogin ? -100 : 100 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-lg w-[90%] max-w-4xl flex overflow-hidden"
    >
        <div className="w-1/2 bg-[#458C74] text-white p-10 flex flex-col justify-center">
        <h2 className="text-3xl font-bold mb-4">
            {isLogin ? "¡Bienvenido a VacunApp!" : "¡Hola!"}
        </h2>
        <p className="mb-6">
            {isLogin
            ? "Ingrese sus datos personales para utilizar todas las funciones del sitio"
            : "Regístrese con sus datos personales para utilizar todas las funciones del sitio"}
        </p>
        <button
            onClick={() => setIsLogin(!isLogin)}
            className="border border-white py-2 px-4 rounded hover:bg-white hover:text-[#458C74] transition"
        >
            {isLogin ? "Registrarse" : "Iniciar sesión"}
        </button>
        </div>

        <div className="w-1/2 p-10">
        <h2 className="text-2xl font-bold mb-6">
            {isLogin ? "Iniciar Sesión" : "Registrarse"}
        </h2>
        {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>
    </motion.div>
    </div>
);
}
