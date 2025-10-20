import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import pastoImagen from "./assets/pastito.jpg"; // <-- importa la imagen

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
    <div className="relative min-h-screen flex flex-col">
      {/* Fondo */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${pastoImagen})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[3px]" />

      {/* Contenido */}
      <div className="relative z-10 flex items-center justify-center flex-1 p-4">
        <div
                className="rounded-3xl shadow-lg w-[90%] max-w-md p-6 flex flex-col items-center"
                style={{ backgroundColor: "#cae9caff" }}
                >
        <h2 className="text-2xl font-bold mb-4">Recuperar Contraseña</h2>

          {message && (
            <div
              className={`mb-4 p-3 rounded text-sm font-medium w-full text-center ${
                message.startsWith("❌")
                  ? "bg-red-100 text-red-700 border border-red-400"
                  : "bg-green-100 text-green-700 border border-green-400"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleReset} className="flex flex-col w-full gap-3">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border rounded p-2 w-full"
              required
            />
            <button
                type="submit"
                className="text-white rounded py-2 transition hover:opacity-90"
                style={{ backgroundColor: "#099757dc" }}
                >
                Enviar enlace de recuperación
                </button>
          </form>

          <button
            onClick={() => navigate("/auth")}
            className="mt-3 text-sm text-blue-700 hover:underline"
          >
            Volver al login
          </button>
        </div>
      </div>
    </div>
  );
}
//Ya esta responsivo
