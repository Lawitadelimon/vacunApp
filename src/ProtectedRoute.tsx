import { Navigate } from "react-router-dom";
import { useUser } from "./UserContext";
import type { JSX } from "react";

export default function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) {
  const { user, loading } = useUser();

  // 1. Log de depuración: Ver qué está pasando en tiempo real
  console.log("--- PROTECTED ROUTE CHECK ---");
  console.log("Cargando:", loading);
  console.log("Usuario:", user);
  console.log("Rol detectado:", user?.role);
  console.log("Roles permitidos para esta ruta:", allowedRoles);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        <p className="ml-3">Verificando permisos...</p>
      </div>
    );
  }

  if (!user) {
    console.warn("No hay usuario, redirigiendo a /auth");
    return <Navigate to="/auth" replace />;
  }

  // Normalizamos para comparar sin errores de mayúsculas o espacios
  const userRole = user.role?.toLowerCase().trim();

  if (!userRole) {
    console.error("El usuario existe pero no tiene un rol asignado en Firestore.");
    return (
      <div className="text-center mt-20 p-6">
        <h2 className="text-2xl font-bold text-red-600">Registro Pendiente</h2>
        <p className="mt-2 text-gray-600">Tu cuenta aún no tiene un rol asignado. Contacta al administrador.</p>
        <button onClick={() => window.location.href = "/auth"} className="mt-4 text-blue-500 underline">Volver al login</button>
      </div>
    );
  }

  // Verificamos si el rol está en la lista de permitidos
  const isAllowed = allowedRoles.map(r => r.toLowerCase().trim()).includes(userRole);

  if (!isAllowed) {
    console.error(`Acceso denegado: El rol '${userRole}' no está en [${allowedRoles}]`);
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center bg-white">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
        <p className="text-gray-500">No tienes permisos para ver esta sección.</p>
        <button 
          onClick={() => window.location.href = "/home"}
          className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  console.log("Acceso concedido para el rol:", userRole);
  return children;
}