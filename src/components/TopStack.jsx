import { Fragment, useRef, useLayoutEffect } from "react";
import { useCookingTimers, useScanExtraction } from "../context.js";
import CookingTimerBar from "./CookingTimerBar.jsx";
import ScanStatusBanner from "./ScanStatusBanner.jsx";

// ── Stack condiviso in cima allo schermo — banner offline, barra timer
// (fuori dalla Modalità Cucina, nulla se non ci sono timer attivi: dentro
// c'è il FAB dedicato) e banner di completamento estrazione AI (nulla se
// non c'è un job concluso o se si è già sullo screen che l'ha avviata).
// L'altezza TOTALE viene scritta in topStackHeight. Essendo position:fixed
// (sia su desktop-mock che su mobile reale), lo stack esce dal flusso: lo
// spacer subito sotto gli lascia il posto in OGNI schermata, che ci sia
// GlobalNav o no (bug preesistente: solo GlobalNav.jsx riservava spazio
// per topStackHeight, quindi le schermate senza GlobalNav — es. Home,
// Aggiungi ricetta — restavano coperte). GlobalNav.jsx non aggiunge più
// topStackHeight al proprio spacer per non contarlo due volte.
export default function TopStack({ isOnline, isOnExtractionScreen, onOpenExtractionResult, onOpenExtractionScreen }) {
  const { topStackHeight, setTopStackHeight, timers, cookingModeActive } = useCookingTimers();
  const { job } = useScanExtraction();
  const wrapRef = useRef(null);
  const showTimerBar = timers.length > 0 && !cookingModeActive;
  const showScanBanner = !!job && !isOnExtractionScreen;

  // ResizeObserver come rete di sicurezza per variazioni di altezza NON
  // legate a isOnline/showTimerBar (es. il testo della barra timer che
  // passa da fermo a scorrevole) — montato una sola volta.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTopStackHeight(el.offsetHeight));
    ro.observe(el);
    return () => { ro.disconnect(); setTopStackHeight(0); };
  }, [setTopStackHeight]);

  // Rimisura SINCRONA ad ogni cambio che fa apparire/sparire un elemento
  // dello stack — non ci si affida solo alla ResizeObserver (la cui
  // tempistica non è garantita, e in alcuni contesti — es. una scheda non
  // "visibile" al compositor del browser — può non scattare affatto).
  useLayoutEffect(() => {
    if (wrapRef.current) setTopStackHeight(wrapRef.current.offsetHeight);
  }, [isOnline, showTimerBar, showScanBanner, setTopStackHeight]);

  return (
    <Fragment>
    <div ref={wrapRef} style={{ position:"fixed", top:0, left:0, right:0, zIndex:9999 }}>
      {!isOnline && (
        <div style={{
          background:"#B8973A", color:"#fff", textAlign:"center",
          fontFamily:"sans-serif", fontSize:11, padding:"5px 10px",
        }}>
          Sei offline — le modifiche verranno salvate alla riconnessione
        </div>
      )}
      {showTimerBar && <CookingTimerBar/>}
      {showScanBanner && (
        <ScanStatusBanner
          isOnExtractionScreen={isOnExtractionScreen}
          onOpenResult={onOpenExtractionResult}
          onOpenScreen={onOpenExtractionScreen}
        />
      )}
    </div>
    {/* Spacer universale: rimpiazza lo spazio "rubato" dal fixed qui sopra, in ogni schermata */}
    <div style={{ height: topStackHeight }}/>
    </Fragment>
  );
}
