import { useState } from "react";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface RegisterFormProps {
  onRegisterSuccess: () => void;
  onValidation: (message: string) => void;
}

export function RegisterForm({ onRegisterSuccess, onValidation }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onValidation("❌ Por favor, ingresa tu nombre.");
      return;
    }

    if (!email || !password) {
      onValidation("❌ Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      // 📌 Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // 🆕 Guardar datos en Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        name,
        email,
        role: "", // <-- Importante: queda en espera
        createdAt: new Date().toISOString(),
      });

      onValidation("✅ Usuario creado correctamente. Contacta a tu administrador para obtener acceso.");
      onRegisterSuccess();
    } catch (error: any) {
      console.error("Error en registro:", error);
      onValidation("❌ Error al crear usuario: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Nombre completo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded"
        required
      />
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
        disabled={loading}
        className={`bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? "Creando cuenta..." : "Registrarse"}
      </button>
    </form>
  );
}
