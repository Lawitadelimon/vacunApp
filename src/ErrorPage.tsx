export default function ErrorPage() {
return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
    <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500">Acceso denegado</h1>
        <p className="mt-2 text-gray-700">
            No tienes permiso para acceder a esta página. Por favor, inicia sesión o contacta al administrador.
        </p>
    </div>
    </div>
);
}
