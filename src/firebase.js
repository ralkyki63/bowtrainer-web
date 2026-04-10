import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Die Firebase-Konfiguration wird aus den Umgebungsvariablen (.env) geladen
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialisiere Firebase App
const app = initializeApp(firebaseConfig);

// Initialisiere Authentication und wähle Google als Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
