import React, { useState } from "react";
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
export default function ExportFlow({ current, allRecipes = [], sectionList = MACRO_SECTIONS, onExportPDF, onExportCode, onClose }) {
  const th = useTheme();
  const [step, setStep] = useState("scope");      // scope | select | format
  const [selected, setSelected] = useState([current.id]);
  const [scope, setScope] = useState("single");   // single | multi
  const [resultCode, setResultCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const allIds = allRecipes.map(r => r.id);
  const allSelected = selected.length === allRecipes.length && allRecipes.length > 0;
  const toggleAll = () => setSelected(allSelected ? [] : allIds);

  const finalIds = scope === "single" ? [current.id] : selected;

  const doPDF = () => { onExportPDF(finalIds); onClose(); };
  const doCode = () => { const code = onExportCode(finalIds); setResultCode(code || ""); };

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
        <Primary onClick={doCode}>🔗 Genera link (per copiarle in un altro ricettario)</Primary>
        <Ghost onClick={doPDF}>📄 Genera PDF (da stampare o inviare)</Ghost>
        <Ghost onClick={() => setStep(scope === "multi" ? "select" : "scope")} style={{ border:"none", color:th.appFaded }}>‹ Indietro</Ghost>
      </div>
    </Panel>
  );
}
