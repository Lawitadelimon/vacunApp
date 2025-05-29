export default function About() {
    return (
        <section className="bg-gray-200 py-16 px-6 md:px-20">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-6">Acerca de Nosotros</h2>
                <p className="text-lg text-gray-600 mb-8">
                    Desarrollo de software innovador y de alta calidad que mejore la eficiencia y productividad de los negocios. 
                    Ofrecer soluciones tecnológicas personalizadas que se adapten a las necesidades específicas de cada cliente. 
                    Aumentar la competitividad de las empresas a través de la implementación de tecnologías de vanguardia. 
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 text-left">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nuestra Misión</h3>
                        <p className="text-gray-600">
                            Ser un proveedor líder de soluciones tecnológicas que transformen la forma en que las empresas operan, mejorando su eficiencia, productividad y competitividad. 
                            Desarrollar y ofrecer soluciones de software que cumplan con las necesidades de los clientes, garantizando la calidad y el cumplimiento de los plazos. 
                            Promover la innovación tecnológica y la mejora continua de nuestros procesos y productos. 
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nuestra Visión</h3>
                        <p className="text-gray-600">
                            Ser reconocidos como la empresa de desarrollo de software más innovadora y confiable a nivel regional/nacional/internacional, liderando el mercado con soluciones tecnológicas de vanguardia.
                            Contribuir al desarrollo de una sociedad más eficiente y próspera a través de la tecnología.
                            Ser una empresa de referencia en el sector tecnológico, conocida por su compromiso con la calidad, la innovación y la satisfacción del cliente.                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
