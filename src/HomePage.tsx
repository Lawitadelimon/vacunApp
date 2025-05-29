export default function HomePage() {
    return (
        <section className="bg-blue-100 py-16 px-6 md:px-20">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl font-bold text-blue-800 mb-6">
                    Bienvenido a Innova System
                </h1>
                <p className="text-lg text-gray-500 mb-8">
                    Descubre lo que tenemos para ofrecerte. Explora nuestras secciones, conoce más sobre nosotros y empieza a disfrutar de todas las funcionalidades que hemos creado especialmente para ti.
                </p>
                <div className="mt-10">
                    <a
                        href="#servicios"
                        className="inline-block bg-blue-800 text-white px-8 py-3 rounded-lg hover:bg-blue-500 transition"
                    >
                        Conoce nuestros servicios
                    </a>
                </div>
            </div>
        </section>
    );
}
