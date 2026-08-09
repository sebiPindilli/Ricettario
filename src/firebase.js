import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
// Cache persistente su IndexedDB (non solo in memoria): i dati letti
// restano disponibili offline anche dopo un ricaricamento della pagina, e
// le scritture fatte offline (setDoc/deleteDoc) si accodano da sole e
// partono alla riconnessione, senza bisogno di codice a mano — vedi
// flushXNow in ricettario-v23.jsx, che si appoggiano a questo.
// persistentMultipleTabManager: se l'app resta aperta in più schede sullo
// stesso dispositivo (stesso indirizzo), Firestore altrimenti ottiene
// accesso esclusivo alla cache solo nella prima scheda e ricade in
// silenzio su una cache solo in memoria in tutte le altre (verificato
// durante lo sviluppo: due schede sulla stessa origine bastano a
// disattivare la persistenza senza nessun errore visibile in app).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
