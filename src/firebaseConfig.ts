import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Pega aquí el código que copiaste de tu pantalla de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDszm0QJDCm4iaAJ9Z2okl3DrMQ3K7reig",
  authDomain: "baul-de-recuerdos-24471.firebaseapp.com",
  projectId: "baul-de-recuerdos-24471",
  storageBucket: "baul-de-recuerdos-24471.firebasestorage.app",
  messagingSenderId: "562614046779",
  appId: "1:562614046779:web:c5d5895c3ff9c53e828c1e",
  measurementId: "G-J41YL1B94P",
};

// Inicializamos los servicios
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
