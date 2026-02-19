import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const OUTBOX_KEY = "offline_outbox";

export default function useOfflineSync() {
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      console.log("🌐 Volviendo a estar en línea — sincronizando...");
      setOnline(true);

      const outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
      if (outbox.length > 0) {
        console.log(`📡 Sincronizando ${outbox.length} cambios pendientes...`);
        for (const item of outbox) {
          try {
            await addDoc(collection(db, item.collection), item.data);
          } catch (err) {
            console.error("❌ Error al sincronizar:", err);
          }
        }
        localStorage.removeItem(OUTBOX_KEY);
        console.log("✅ Sincronización completada");
      }
    };

    const handleOffline = () => {
      console.log("📴 Sin conexión — guardando datos localmente...");
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

/**
 * 📦 Guarda un cambio localmente si no hay conexión
 */
export function saveOfflineChange(collectionName: string, data: any) {
  const outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
  outbox.push({ collection: collectionName, data });
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
  console.log("📥 Cambio guardado offline:", data);
}
