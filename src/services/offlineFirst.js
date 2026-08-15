// Lettura Firestore "offline-first": quando l'app riparte da zero già
// offline, getDoc/getDocs "normali" aspettano che Firestore si accorga da
// solo di non avere rete prima di ripiegare sulla cache locale — quel
// rilevamento non è istantaneo, e può metterci più del margine di tempo
// concesso all'avvio (vedi AuthGate.jsx e bootstrapBooks in
// ricettario-v23.jsx), risultando in un'app bloccata prima di entrare
// anche se i dati richiesti sono già salvati localmente. Qui invece, se si
// sa già di essere offline (navigator.onLine), si va dritti alla cache,
// senza alcuna attesa di rete.
import { getDoc, getDocFromCache, getDocs, getDocsFromCache } from "firebase/firestore";

// Offline e nulla in cache per questo riferimento (mai letto prima su
// questo dispositivo) — il chiamante la distingue da un errore di rete
// generico per mostrare un messaggio specifico invece di "riprova".
export class OfflineNoCacheError extends Error {
  constructor() {
    super("Nessun dato disponibile offline su questo dispositivo.");
    this.name = "OfflineNoCacheError";
  }
}

export const getDocOfflineFirst = async (ref) => {
  if (navigator.onLine) return getDoc(ref);
  try {
    return await getDocFromCache(ref);
  } catch {
    throw new OfflineNoCacheError();
  }
};

export const getDocsOfflineFirst = async (query) => {
  if (navigator.onLine) return getDocs(query);
  try {
    return await getDocsFromCache(query);
  } catch {
    throw new OfflineNoCacheError();
  }
};
