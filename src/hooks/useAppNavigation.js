// Cronologia di navigazione esplicita — sostituisce il vecchio meccanismo
// "a inferenza" (indovinare se un cambio di screen era avanti o indietro
// confrontando il valore prima/dopo in un useEffect), che non distingueva
// un vero pulsante Indietro in-app da una normale navigazione in avanti:
// entrambi finivano per fare un pushState, creando cronologie duplicate e
// percorsi circolari (es. nel flusso "Aggiungi ricetta").
//
// Qui invece ogni cambiamento passa da una delle tre funzioni esposte, e
// SOLO da quelle:
//   - navigate(location): un passo in avanti — push nella pila e nella
//     cronologia del browser. Se la location è identica a quella in cima
//     (stesso screen), non fa nulla: evita voci duplicate per un tocco
//     ripetuto sullo stesso pulsante.
//   - replace(location): un passo di lato, non un nuovo livello (es. il
//     tasto "+" globale premuto mentre si è già dentro il flusso di
//     aggiunta ricetta) — sostituisce la cima senza far crescere la pila.
//   - back(): torna indietro. Chiama SOLO window.history.back(): non
//     tocca mai la pila direttamente. Il pop vero avviene sempre e solo in
//     risposta al popstate che il browser genera di conseguenza — così un
//     pulsante "Indietro" disegnato nella UI e il tasto fisico del
//     telefono sono, per costruzione, la stessa identica azione: non
//     possono mai disallinearsi.
import { useState, useRef, useCallback, useEffect } from "react";

// Due location sono "la stessa voce di cronologia" se hanno lo stesso
// contenuto, anche se costruite come due oggetti letterali distinti.
export const sameLocation = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Logica pura della pila — separata dagli effetti collaterali su
// window.history così da poter essere testata senza DOM (vedi
// tests/appNavigation.test.js).
export const pushLocation = (stack, loc) =>
  stack.length > 0 && sameLocation(stack[stack.length - 1], loc) ? stack : [...stack, loc];
export const replaceLocation = (stack, loc) => [...stack.slice(0, -1), loc];
export const popLocation = (stack) => (stack.length > 1 ? stack.slice(0, -1) : stack);

// initialStack: array di location (o funzione lazy che la restituisce,
// stesso pattern di useState — utile per calcolarla una sola volta senza
// rifarlo ad ogni render). Quasi sempre un solo elemento; più di uno solo
// per un ingresso diretto già "profondo" (es. link condiviso), dove la
// prima voce resta comunque la base (landing) sotto a quella vera.
export function useAppNavigation(initialStack) {
  const [stack, setStack] = useState(initialStack);
  // Specchio sincrono di `stack`, aggiornato subito (non al prossimo
  // render): navigate/replace/back devono sempre ragionare sul valore più
  // recente, anche se chiamati più volte prima che React ri-renderizzi.
  const stackRef = useRef(stack);
  useEffect(() => { stackRef.current = stack; }, [stack]);

  // Semina la cronologia una sola volta (anche sotto lo StrictMode di
  // sviluppo, che invoca gli effect di mount due volte per diagnostica),
  // con tante voci REALI di window.history quante sono quelle della pila
  // iniziale: se non lo facessimo, con una pila iniziale di 2+ elementi
  // (link condiviso) il primo tasto Indietro non troverebbe un vero
  // popstate ad attenderlo (il browser ne avrebbe solo una), e uscirebbe
  // dall'app invece di risalire di un livello nella nostra pila.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    window.history.replaceState({ nav: true }, "");
    for (let i = 1; i < stackRef.current.length; i++) {
      window.history.pushState({ nav: true }, "");
    }
  }, []);

  useEffect(() => {
    const onPopState = (e) => {
      // Nessuno state nostro (nav:true): voce di cronologia precedente
      // all'app o non gestita da noi — non tocca la pila.
      if (!e.state?.nav) return;
      const next = popLocation(stackRef.current);
      stackRef.current = next;
      setStack(next);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((loc) => {
    const next = pushLocation(stackRef.current, loc);
    if (next === stackRef.current) return; // duplicato: nessuna voce nuova
    window.history.pushState({ nav: true }, "");
    stackRef.current = next;
    setStack(next);
  }, []);

  const replace = useCallback((loc) => {
    const next = replaceLocation(stackRef.current, loc);
    window.history.replaceState({ nav: true }, "");
    stackRef.current = next;
    setStack(next);
  }, []);

  const back = useCallback(() => {
    window.history.back();
  }, []);

  return { location: stack[stack.length - 1], stack, navigate, replace, back };
}
