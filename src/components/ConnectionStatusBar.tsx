import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { useEffect, useState } from "react";

export default function ConnectionStatusBar() {
  const online = useOnlineStatus();
  const [show, setShow] = useState(false);

  // Controla cuánto tiempo mostrar la barra verde
  useEffect(() => {
    if (!online) {
      setShow(true);
    } else {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000); // ⏱️ 3 segundos
      return () => clearTimeout(timer);
    }
  }, [online]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className={`fixed top-0 left-0 w-full text-white text-center py-2 z-50 shadow-md ${
            online ? "bg-green-500" : "bg-red-600"
          }`}
        >
          {online
            ? "✅ Conexión restaurada"
            : "⚠️ Sin conexión a Internet. Algunos datos pueden no guardarse."}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
