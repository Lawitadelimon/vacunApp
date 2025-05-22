export default function About() {
    return (
        <section className="bg-yellow-200 py-16 px-6 md:px-20">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-6">Acerca de Nosotros</h2>
                <p className="text-lg text-gray-600 mb-8">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quia, eum dolore provident beatae aspernatur consequatur laboriosam delectus saepe deleniti omnis? Tempore maiores quidem voluptas saepe veritatis, itaque iure aut non!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 text-left">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nuestra Misión</h3>
                        <p className="text-gray-600">
                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam facilis praesentium qui vel sit, eaque facere quo nulla omnis vero repellat earum? Deleniti voluptates natus quasi praesentium quis pariatur quibusdam!
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">Nuestra Visión</h3>
                        <p className="text-gray-600">
                            Lorem ipsum dolor sit amet consectetur, adipisicing elit. Eum id tempora voluptatem ipsa, saepe aut praesentium perspiciatis veniam rerum ducimus laudantium architecto dolores aperiam placeat nulla tenetur, sint maxime ab.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
