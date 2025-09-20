import { Navigate } from "react-router-dom";
import { useUser } from "./UserContext";
import type { JSX } from "react";

export default function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) {
  const { user, loading } = useUser();

  if (loading) return <div>Cargando...</div>;

  if (!user) return <Navigate to="/auth" replace />;
  if (!user.role) return <div className="text-center mt-20 text-xl text-red-600">Usuario creado, espera la aprobación del admin.</div>;
  if (!allowedRoles.includes(user.role)) return <div className="text-center mt-20 text-red-600">Acceso denegado</div>;

  return children;
}
