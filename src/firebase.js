import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <--- Importamos la base de datos

// Tus credenciales reales de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDK4ghbDA6QQCXOynevd5f5A0tykZK1fNA",
  authDomain: "estacionamiento-d303f.firebaseapp.com",
  projectId: "estacionamiento-d303f",
  storageBucket: "estacionamiento-d303f.firebasestorage.app",
  messagingSenderId: "982340640074",
  appId: "1:982340640074:web:d23a716661623af29735b3",
  measurementId: "G-P290XHJBEM"
};

// Inicializamos la app y la base de datos
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // <--- Exportamos 'db' para usarla en tus componentes