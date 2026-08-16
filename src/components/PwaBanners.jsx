// ── Avvisi PWA globali, fuori da AuthGate (visibili anche prima del login) ──
// Stesso pattern di TopStack.jsx (più banner condizionali in un unico
// contenitore fixed, per non sovrapporsi se capitano insieme), ma in
// fondo allo schermo: qui il contenuto è "azionabile" (un pulsante), non
// solo informativo.
import { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

const IOS_DISMISS_KEY = "ricettario:iosInstallDismissed";

// iPadOS 13+ si presenta come Macintosh nello user agent — va distinto da
// un vero Mac tramite il touch, altrimenti l'avviso non comparirebbe mai
// su iPad.
const isIos = () => {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
};
const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

function UpdateBanner() {
  const th = useTheme();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Controllo periodico: senza, un'app installata rimasta aperta o in
      // background per giorni potrebbe non controllare mai un aggiornamento
      // da sola — il browser lo fa solo alla navigazione/reload, che con
      // l'app installata può non capitare per molto tempo.
      setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      background:th.appInk, color:th.appBg, borderRadius:14, padding:"11px 14px",
      display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
    }}>
      <span style={{ flex:1, minWidth:0, fontFamily:F.ui, fontSize:12.5 }}>🔄 Nuova versione disponibile.</span>
      <button onClick={() => updateServiceWorker(true)} style={{
        flexShrink:0, padding:"8px 14px", borderRadius:10, border:"none",
        background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer",
      }}>Ricarica</button>
      <button onClick={() => setNeedRefresh(false)} title="Ignora" style={{
        flexShrink:0, background:"none", border:"none", color:th.appBg, opacity:0.7,
        cursor:"pointer", fontSize:15, lineHeight:1, padding:2,
      }}>✕</button>
    </div>
  );
}

function IosInstallBanner() {
  const th = useTheme();
  // Calcolato una sola volta al primo render (lazy initializer): sono
  // tutti controlli sincroni (user agent, localStorage), non serve un
  // effect — evita anche un render in più.
  const [visible, setVisible] = useState(() => {
    let dismissed = false;
    try { dismissed = !!localStorage.getItem(IOS_DISMISS_KEY); } catch { /* ignorato di proposito */ }
    return !dismissed && isIos() && !isStandalone();
  });

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(IOS_DISMISS_KEY, "1"); } catch { /* ignorato di proposito */ }
    setVisible(false);
  };

  return (
    <div style={{
      background:th.appCard, border:`1.5px solid ${th.appBorder}`, borderRadius:14, padding:"11px 14px",
      display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
    }}>
      <span style={{ flex:1, minWidth:0, fontFamily:F.ui, fontSize:12, color:th.appInk, lineHeight:1.4 }}>
        📲 Installa Ricettario: tocca <b>Condividi</b> (⬆️) e poi <b>"Aggiungi a Home"</b>.
      </span>
      <button onClick={dismiss} title="Ignora" style={{
        flexShrink:0, background:"none", border:"none", color:th.appFaded,
        cursor:"pointer", fontSize:15, lineHeight:1, padding:2,
      }}>✕</button>
    </div>
  );
}

export default function PwaBanners() {
  return (
    <div style={{
      position:"fixed", left:12, right:12, bottom:12, zIndex:10000,
      display:"flex", flexDirection:"column", gap:8,
      maxWidth:420, marginLeft:"auto", marginRight:"auto",
    }}>
      <UpdateBanner/>
      <IosInstallBanner/>
    </div>
  );
}
