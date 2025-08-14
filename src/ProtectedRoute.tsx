import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";

export default function ProtectedRoute({ children }) {
const [user, loading] = useAuthState(auth);

if (loading) return <div>Cargando...</div>;

if (!user) {
    return <Navigate to="/" replace />;
}

return children;
}
