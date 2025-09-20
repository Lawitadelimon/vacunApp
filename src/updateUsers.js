import admin from "firebase-admin";

// Ruta a tu archivo de credenciales JSON de Firebase
import serviceAccount from "./serviceAccountKey.json";

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateUsers() {
  try {
    const usersSnapshot = await db.collection("users").get();

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();

      const updates = {};
      if (!data.name) updates.name = "Usuario"; // Nombre por defecto
      if (!data.role) updates.role = "worker";

      if (Object.keys(updates).length > 0) {
        await doc.ref.update(updates);
        console.log(`Usuario ${doc.id} actualizado con`, updates);
      }
    }

    console.log("Todos los usuarios actualizados correctamente.");
  } catch (error) {
    console.error("Error actualizando usuarios:", error);
  }
}

updateUsers();
