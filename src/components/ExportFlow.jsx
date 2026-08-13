import { useState } from "react";
import { useTheme } from "../context.js";
import { F, MACRO_SECTIONS } from "../data/constants.js";
import { sortSectionsAltroLast } from "../utils/helpers.js";
import InfoButton from "./InfoButton.jsx";
import { guideEsporta } from "../data/guideContent.jsx";

// ══════════════════════════════════════════════════════════════
// COMPONENT: ExportFlow — overlay a passi per esportare ricette
// Passo 1: solo questa ricetta o più ricette?
// Passo 2 (se più): selezione multipla con "seleziona tutto"
// Passo 3: link (codice) o PDF?
// ══════════════════════════════════════════════════════════════
export default function ExportFlow({ current, allRecipes = [], sectionList = MACRO_SECTIONS, onExportPDF, onExportCode, onShareLink, onClose }) {
  const th = useTheme();
  const [step, setStep] = useState("scope");      // scope | select | format
  const [selected, setSelected] = useState([current.id]);
  const [scope, setScope] = useState("single");   // single | multi
  const [resultCode, setResultCode] = useState(null);
  const [copied, setCopied] = useState(false);

  // Condivisione con link — solo quando è selezionata esattamente una
  // ricetta: il modello dati di sharedRecipes è per singola ricetta.
  const [shareOpen, setShareOpen] = useState(false);
  const [shareIncludeIngredients, setShareIncludeIngredients] = useState(false);
  const [shareIncludePhotos, setShareIncludePhotos] = useState(false);
  const [shareVisibility, setShareVisibility] = useState("anyone"); // anyone | restricted
  const [shareEmailsText, setShareEmailsText] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState(null);
  const [shareResult, setShareResult] = useState(null); // shareId una volta creato
  const [linkCopied, setLinkCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const allIds = allRecipes.map(r => r.id);
  const allSelected = selected.length === allRecipes.length && allRecipes.length > 0;
  const toggleAll = () => setSelected(allSelected ? [] : allIds);

  const finalIds = scope === "single" ? [current.id] : selected;
  const shareRecipe = finalIds.length === 1
    ? (scope === "single" ? current : allRecipes.find(r => r.id === finalIds[0]))
    : null;

  const doPDF = () => { onExportPDF(finalIds); onClose(); };
  const doCode = () => { const code = onExportCode(finalIds); setResultCode(code || ""); };

  const shareAllowedEmails = () => Array.from(new Set(
    shareEmailsText.split(/[,\n]/).map(e => e.trim().toLowerCase()).filter(Boolean)
  ));
  const shareCanSubmit = shareVisibility === "anyone" || shareAllowedEmails().length > 0;
  const doShare = async () => {
    if (!onShareLink || !shareRecipe || shareBusy) return;
    setShareBusy(true); setShareError(null);
    try {
      const shareId = await onShareLink(shareRecipe.id, {
        includeIngredients: shareIncludeIngredients,
        includePhotos: shareIncludePhotos,
        visibility: shareVisibility,
        allowedEmails: shareVisibility === "restricted" ? shareAllowedEmails() : [],
      });
      setShareResult(shareId);
    } catch (e) {
      console.warn("Creazione link di condivisione non riuscita", e);
      setShareError("Non sono riuscito a creare il link. Riprova.");
    } finally {
      setShareBusy(false);
    }
  };
  const shareUrl = shareResult ? `${window.location.origin}/?shared=${shareResult}` : "";
  const shareMessage = shareResult ? `Ti mando la ricetta di ${shareRecipe?.title || ""} — aprila qui: ${shareUrl}` : "";
  const copyToClipboard = (text, setFlag) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
    setFlag(true); setTimeout(() => setFlag(false), 1500);
  };

  const Panel = ({ children }) => (
    <div style={{ position:"absolute", inset:0, zIndex:600, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:18 }}>
      <div style={{ width:"100%", maxHeight:"88%", background:th.appBg, borderRadius:20, padding:"20px 18px", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
        <InfoButton triggerStyle={{ position:"absolute", top:14, right:14 }}>{guideEsporta}</InfoButton>
        {children}
      </div>
    </div>
  );
  const Title = ({ children }) => (
    <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk, textAlign:"center", marginBottom:4 }}>{children}</div>
  );
  const Sub = ({ children }) => (
    <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, textAlign:"center", marginBottom:16, lineHeight:1.5 }}>{children}</div>
  );
  const Primary = (props) => (
    <button {...props} style={{ padding:"13px", borderRadius:12, border:"none", background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer", ...(props.style||{}) }}/>
  );
  const Ghost = (props) => (
    <button {...props} style={{ padding:"13px", borderRadius:12, border:`1.5px solid ${th.appBorder}`, background:"transparent", color:th.appInk, fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer", ...(props.style||{}) }}/>
  );

  // Condivisione con link — risultato
  if (shareOpen && shareResult) {
    return (
      <Panel>
        <Title>🔗 Link creato</Title>
        <Sub>Valido 30 giorni. Chi lo apre deve avere accesso all'app.</Sub>
        <textarea readOnly value={shareUrl} onClick={e => e.target.select()} style={{
          width:"100%", height:60, resize:"none", borderRadius:12, padding:"10px 12px",
          border:`1.5px solid ${th.appBorder}`, background:th.appCard, color:th.appInk,
          fontFamily:"monospace", fontSize:12, marginBottom:10,
        }}/>
        <Primary onClick={() => copyToClipboard(shareUrl, setLinkCopied)}>{linkCopied ? "✓ Copiato" : "📋 Copia link"}</Primary>
        <Ghost onClick={() => copyToClipboard(shareMessage, setMsgCopied)} style={{ marginTop:8 }}>
          {msgCopied ? "✓ Copiato" : "💬 Copia messaggio pronto per la chat"}
        </Ghost>
        <Ghost onClick={onClose} style={{ marginTop:8, border:"none", color:th.appFaded }}>Chiudi</Ghost>
      </Panel>
    );
  }

  // Condivisione con link — opzioni
  if (shareOpen) {
    return (
      <Panel>
        <Title>🔗 Condividi con link</Title>
        <Sub>«{shareRecipe?.title}» — valido 30 giorni, revocabile in ogni momento da "I miei link condivisi".</Sub>
        <div style={{ flex:1, overflowY:"auto", marginBottom:12 }}>
          <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", margin:"4px 0 8px" }}>Cosa includere</div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:F.ui, fontSize:12, color:th.appInk, marginBottom:8 }}>
            <input type="checkbox" checked={shareIncludeIngredients} onChange={e => setShareIncludeIngredients(e.target.checked)} />
            Dati ingredienti (categorie, nutrizione, equivalenze di questa ricetta)
          </label>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:F.ui, fontSize:12, color:th.appInk, marginBottom:14 }}>
            <input type="checkbox" checked={shareIncludePhotos} onChange={e => setShareIncludePhotos(e.target.checked)} />
            Foto (piatto, step) e ricordi collegati
          </label>

          <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", margin:"4px 0 8px" }}>Chi può aprirlo</div>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:F.ui, fontSize:12, color:th.appInk, marginBottom:8 }}>
            <input type="radio" name="shareVisibility" checked={shareVisibility === "anyone"} onChange={() => setShareVisibility("anyone")} />
            Chiunque abbia il link (e accesso all'app)
          </label>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:F.ui, fontSize:12, color:th.appInk, marginBottom:8 }}>
            <input type="radio" name="shareVisibility" checked={shareVisibility === "restricted"} onChange={() => setShareVisibility("restricted")} />
            Solo persone specifiche
          </label>
          {shareVisibility === "restricted" && (
            <>
              <textarea
                value={shareEmailsText}
                onChange={e => setShareEmailsText(e.target.value)}
                placeholder="Un'email per riga o separate da virgola"
                style={{ width:"100%", height:64, padding:"9px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.ui, fontSize:12, color:th.appInk, boxSizing:"border-box", resize:"none", marginBottom:6 }}
              />
              <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, lineHeight:1.5, marginBottom:6 }}>
                Solo chi ha già accesso all'app potrà aprirlo, anche se l'email è tra queste.
              </div>
            </>
          )}
        </div>
        {shareError && (
          <div style={{ fontFamily:F.ui, fontSize:11.5, color:"#C4593A", marginBottom:8, textAlign:"center" }}>{shareError}</div>
        )}
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <Ghost onClick={() => setShareOpen(false)} style={{ flex:1 }} disabled={shareBusy}>‹ Indietro</Ghost>
          <Primary onClick={doShare} disabled={shareBusy || !shareCanSubmit} style={{ flex:2, opacity: shareBusy || !shareCanSubmit ? 0.6 : 1 }}>
            {shareBusy ? "Creazione…" : "Crea link"}
          </Primary>
        </div>
      </Panel>
    );
  }

  // Risultato codice/link
  if (resultCode !== null) {
    return (
      <Panel>
        <Title>🔗 Link di condivisione</Title>
        <Sub>Copia questo codice e invialo. Chi lo riceve lo incolla in "Importa da codice" per aggiungere le ricette al suo ricettario.</Sub>
        <textarea readOnly value={resultCode} style={{
          width:"100%", height:110, resize:"none", borderRadius:12, padding:"10px 12px",
          border:`1.5px solid ${th.appBorder}`, background:th.appCard, color:th.appInk,
          fontFamily:"monospace", fontSize:11, marginBottom:12,
        }}/>
        <Primary onClick={() => {
          if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(resultCode).catch(()=>{}); }
          setCopied(true); setTimeout(()=>setCopied(false), 1500);
        }}>{copied ? "✓ Copiato" : "📋 Copia il codice"}</Primary>
        <Ghost onClick={onClose} style={{ marginTop:8 }}>Chiudi</Ghost>
      </Panel>
    );
  }

  // Passo 1 — ambito
  if (step === "scope") {
    return (
      <Panel>
        <Title>📤 Esporta</Title>
        <Sub>Vuoi esportare solo questa ricetta o sceglierne più di una?</Sub>
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          <Primary onClick={() => { setScope("single"); setStep("format"); }}>
            📄 Solo «{current.title}»
          </Primary>
          <Ghost onClick={() => { setScope("multi"); setStep("select"); }}>
            ✔️ Scegli più ricette
          </Ghost>
          <Ghost onClick={onClose} style={{ border:"none", color:th.appFaded }}>Annulla</Ghost>
        </div>
      </Panel>
    );
  }

  // Passo 2 — selezione multipla
  if (step === "select") {
    return (
      <Panel>
        <Title>Scegli le ricette</Title>
        <Sub>{selected.length} selezionate</Sub>
        <button onClick={toggleAll} style={{
          padding:"9px", borderRadius:10, border:`1.5px solid ${th.appAccent}`,
          background: allSelected ? th.appAccent : "transparent",
          color: allSelected ? "#fff" : th.appAccent,
          fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer", marginBottom:10, flexShrink:0,
        }}>{allSelected ? "✓ Tutto il ricettario selezionato" : "Seleziona tutto il ricettario"}</button>
        <div style={{ flex:1, overflowY:"auto", marginBottom:12 }}>
          {sortSectionsAltroLast(sectionList).map(sec => {
            const inSec = allRecipes.filter(r => r.macroSection === sec.id);
            if (inSec.length === 0) return null;
            return (
              <div key={sec.id} style={{ marginBottom:8 }}>
                <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, textTransform:"uppercase", letterSpacing:0.5, margin:"4px 2px" }}>{sec.emoji} {sec.label}</div>
                {inSec.map(r => {
                  const sel = selected.includes(r.id);
                  return (
                    <button key={r.id} onClick={() => toggle(r.id)} style={{
                      width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 11px",
                      borderRadius:10, marginBottom:4, cursor:"pointer", textAlign:"left",
                      background: sel ? `${th.appAccent}18` : th.appCard,
                      border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                    }}>
                      <span style={{
                        width:20, height:20, borderRadius:6, flexShrink:0,
                        border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                        background: sel ? th.appAccent : "transparent",
                        color:"#fff", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center",
                      }}>{sel ? "✓" : ""}</span>
                      <span style={{ fontFamily:F.body, fontSize:13, color:th.appInk }}>{r.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <Ghost onClick={() => setStep("scope")} style={{ flex:1 }}>‹ Indietro</Ghost>
          <Primary onClick={() => selected.length > 0 && setStep("format")} style={{ flex:2, opacity: selected.length ? 1 : 0.5 }}>Continua →</Primary>
        </div>
      </Panel>
    );
  }

  // Passo 3 — formato
  return (
    <Panel>
      <Title>Come vuoi esportare?</Title>
      <Sub>{finalIds.length === 1 ? "1 ricetta" : `${finalIds.length} ricette`}</Sub>
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        {onShareLink && shareRecipe && (
          <Primary onClick={() => setShareOpen(true)}>🔗 Condividi con link</Primary>
        )}
        <Ghost onClick={doCode}>🔠 Genera codice (per copiarle in un altro ricettario)</Ghost>
        <Ghost onClick={doPDF}>📄 Genera PDF (da stampare o inviare)</Ghost>
        <Ghost onClick={() => setStep(scope === "multi" ? "select" : "scope")} style={{ border:"none", color:th.appFaded }}>‹ Indietro</Ghost>
      </div>
    </Panel>
  );
}
