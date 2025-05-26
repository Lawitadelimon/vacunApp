import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
    <h1 className="text-3xl font-extrabold mb-4 text-blue-700">Contactanos</h1>
    <p className="text-gray-700 mb-4">
        Innova System es una empresa dedicada a la innovación tecnológica.
    </p>
    <p className="text-gray-700 mb-4">
        Que esperas para contactarnos !!!
    </p>
    <div className="space-y-3 text-gray-700">
        <div className="flex items-center gap-2">
        <Mail className="w-5 h-5 text-blue-500" />
        <span>inovasystem4@gmail.com</span>
        </div>
        <div className="flex items-center gap-2">
        <Phone className="w-5 h-5 text-blue-500" />
        <span>2471084653</span>
        </div>
        <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-500" />
        <span>Huamantla, El Carmen Xalpatlahuaya</span>
        </div>
    </div>
    </div>
);
}
