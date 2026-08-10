import React, { useState, useRef } from "react";
import { useTheme, useOnline } from "../context.js";
import { F } from "../data/constants.js";
import { stepPhotosOf, durationOf, parseStepDuration, stepNumbers, stepNumberLabel, MAX_STEP_PHOTOS, readImageFile, moveItemsBetweenSections } from "../utils/helpers.js";
import Toast from "./Toast.jsx";
import SectionMovePicker from "./SectionMovePicker.jsx";

// ── Editable sectioned steps ─────────────────────────────────────
export default function EditSectionedSteps({ data, color, onUpdate }) {
  const th = useTheme();
  const isOnline = useOnline();
  const fileInputRef = useRef(null);
  const [pendingTarget, setPendingTarget] = useState(null); // {si, ii} in attesa di una foto
  const [toast, setToast] = useState({ msg:"", visible:false });
  const showToast = (msg) => {
    setToast({ msg, visible:true });
    setTimeout(() => setToast({ msg:"", visible:false }), 2000);
  };
  // Spostamento tra sottosezioni: movePickerFor null=chiuso,
  // {mode:"single", si, ii} per un passo, {mode:"bulk"} per la selezione
  // multipla. selectMode/selected sono indipendenti dallo spostamento
  // singolo (sempre disponibile), attivabili dal bottone "Seleziona".
  const [movePickerFor, setMovePickerFor] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const toggleSelect = (si, ii) => setSelected(prev => {
    const key = `${si}_${ii}`;
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };
  // Difesa: normalizza sempre gli item a oggetti {text, photos}, qualunque
  // sia il formato di provenienza (stringa, vecchio photo singolo, o già photos)
  const sections = data.map(sec => ({
    ...sec,
    items: (sec.items || []).map(s => ({
      text: typeof s === "string" ? s : (s?.text ?? ""),
      photos: stepPhotosOf(s),
      duration: durationOf(s),
    })),
  }));

  const updateSection = (si, key, val) => onUpdate(sections.map((s,i) => i===si ? {...s,[key]:val} : s));
  const updateStep = (si, ii, field, val) => onUpdate(sections.map((s,i) => i!==si ? s : {
    ...s, items: s.items.map((it,j) => j===ii ? {...it,[field]:val} : it)
  }));
  // Il rilevamento automatico della durata è un suggerimento, non un'
  // imposizione: riempie il campo solo se è ancora vuoto. Una volta che ha
  // un valore (anche solo suggerito), altre modifiche al testo non lo
  // toccano più finché l'utente non lo svuota di nuovo.
  const updateStepText = (si, ii, text) => {
    const current = sections[si].items[ii];
    const suggested = current.duration == null ? parseStepDuration(text) : null;
    onUpdate(sections.map((s,i) => i!==si ? s : {
      ...s, items: s.items.map((it,j) => j!==ii ? it : {
        ...it, text,
        ...(suggested != null ? { duration: suggested } : {}),
      })
    }));
  };
  const addStep = (si) => onUpdate(sections.map((s,i) => i!==si ? s : {
    ...s, items:[...s.items, { text:"", photos:[], duration:null }]
  }));
  const removeStep = (si, ii) => onUpdate(sections.map((s,i) => i!==si ? s : {
    ...s, items: s.items.filter((_,j) => j!==ii)
  }));
  const addSection = () => onUpdate([...sections, { section:"", items:[{ text:"", photos:[] }] }]);
  const removeSection = (si) => onUpdate(sections.filter((_,i) => i!==si));
  const moveSection = (si, dir) => {
    const target = si + dir;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[si], next[target]] = [next[target], next[si]];
    onUpdate(next);
  };
  const moveStep = (si, ii, dir) => {
    const items = sections[si].items;
    const target = ii + dir;
    if (target < 0 || target >= items.length) return;
    const nextItems = [...items];
    [nextItems[ii], nextItems[target]] = [nextItems[target], nextItems[ii]];
    onUpdate(sections.map((s,i) => i!==si ? s : { ...s, items: nextItems }));
  };

  // Destinazione scelta nel picker → applica lo spostamento (singolo o
  // multiplo, stessa funzione pura) e chiude/pulisce lo stato transitorio.
  const handleMovePick = (destination) => {
    const positions = movePickerFor.mode === "single"
      ? [{ sectionIndex: movePickerFor.si, itemIndex: movePickerFor.ii }]
      : [...selected].map(key => {
          const [si, ii] = key.split("_").map(Number);
          return { sectionIndex: si, itemIndex: ii };
        });
    onUpdate(moveItemsBetweenSections(sections, positions, destination));
    const destLabel = destination.type === "new" ? (destination.name.trim() || "Sciolti") : (sections[destination.sectionIndex].section || "Sciolti");
    showToast(`📂 Spostat${positions.length === 1 ? "o" : "i"} in «${destLabel}»`);
    setMovePickerFor(null);
    exitSelectMode();
  };

  // Caricamento foto reale — stesso meccanismo dei Ricordi (input file
  // nascosto + FileReader → dataURL), condiviso da tutti i passaggi:
  // un solo input, il target (quale passaggio) è tenuto in pendingTarget.
  // Richiede connessione (Storage non ha una coda offline come Firestore).
  const openPhotoPicker = (si, ii) => {
    if (!isOnline) { showToast("📡 Serve una connessione per aggiungere una foto"); return; }
    setPendingTarget({ si, ii });
    fileInputRef.current && fileInputRef.current.click();
  };
  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // permette di riselezionare lo stesso file
    if (!file || !pendingTarget) return;
    const { si, ii } = pendingTarget;
    readImageFile(file, (dataUrl) => {
      const current = sections[si]?.items[ii]?.photos || [];
      if (current.length >= MAX_STEP_PHOTOS) return;
      updateStep(si, ii, "photos", [...current, dataUrl]);
    });
  };
  const removePhoto = (si, ii, pi) => {
    const current = sections[si].items[ii].photos;
    updateStep(si, ii, "photos", current.filter((_, k) => k !== pi));
  };

  // Numerazione gerarchica coerente con StepsView/CookingMode: passaggi
  // sciolti (sottosezione senza nome) numerati semplici, passaggi dentro
  // una sottosezione con nome numerati "N.M".
  const numbers = stepNumbers(sections);
  let flatI = 0;

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }}/>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, fontFamily:F.ui, fontSize:12, color:th.appFaded }}>
          Scrivi i passi e, se vuoi, raggruppali in sottosezioni (es. "Pasta", "Salsa", "Impiattamento")
        </div>
        {selectMode && selected.size > 0 && (
          <button onClick={() => setMovePickerFor({ mode:"bulk" })} style={{
            flexShrink:0, padding:"6px 12px", border:"none", borderRadius:10,
            background:color, color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer",
          }}>📂 Sposta in… ({selected.size})</button>
        )}
        <button onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)} style={{
          flexShrink:0, background:"none", border:"none", color:th.appFaded,
          fontFamily:F.ui, fontSize:11.5, fontWeight:600, textDecoration:"underline", textUnderlineOffset:2, cursor:"pointer",
        }}>{selectMode ? "Annulla" : "Seleziona"}</button>
      </div>
      {sections.map((sec, si) => (
        <div key={si} style={{ marginBottom:18 }}>
          {/* Section name */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom: sec.section ? 4 : 10 }}>
            <div style={{ width:4, alignSelf:"stretch", borderRadius:2, background: sec.section ? color : th.appBorder, flexShrink:0 }}/>
            <input
              value={sec.section}
              onChange={e => updateSection(si, "section", e.target.value)}
              placeholder={sections.length > 1 ? "Nome sottosezione (es. Preparazione salsa)" : "Sottosezione (opzionale)"}
              style={{
                flex:1, padding:"7px 12px",
                border:`1.5px solid ${sec.section ? color : th.appBorder}`,
                borderRadius:10,
                background: sec.section ? `${color}10` : th.appCard,
                fontFamily:F.ui, fontSize:12, fontWeight:600,
                color: sec.section ? color : th.appFaded,
                outline:"none",
              }}
            />
            <div style={{ display:"flex", flexDirection:"column", flexShrink:0 }}>
              <button onClick={() => moveSection(si, -1)} disabled={si === 0} title="Sposta su" style={{
                background:"none", border:"none", padding:0, height:14, lineHeight:"14px",
                fontSize:11, color: si === 0 ? "#ddd" : th.appFaded,
                cursor: si === 0 ? "default" : "pointer",
              }}>▲</button>
              <button onClick={() => moveSection(si, 1)} disabled={si === sections.length - 1} title="Sposta giù" style={{
                background:"none", border:"none", padding:0, height:14, lineHeight:"14px",
                fontSize:11, color: si === sections.length - 1 ? "#ddd" : th.appFaded,
                cursor: si === sections.length - 1 ? "default" : "pointer",
              }}>▼</button>
            </div>
            {sections.length > 1 && (
              <button onClick={() => removeSection(si)} style={{
                background:"none", border:"none", color:"#ccc",
                fontSize:16, cursor:"pointer", flexShrink:0,
              }}>🗑️</button>
            )}
          </div>
          {/* Linea che raggruppa visivamente i passaggi sotto la sottosezione
              con nome — stessa idea del divisore di SectionBadge in visualizzazione.
              Assente per i passaggi sciolti (sottosezione senza nome). */}
          {sec.section && (
            <div style={{ height:1, background:`${color}44`, margin:"0 0 10px 12px" }}/>
          )}
          {sec.section && sec.items.length === 0 && (
            <div style={{ margin:"0 0 10px 12px", fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5 }}>
              Sottosezione vuota — puoi eliminarla con 🗑️ qui sopra, oppure lasciarla: se resterà vuota al salvataggio verrà rimossa automaticamente.
            </div>
          )}

          {/* Steps */}
          {sec.items.map((step, ii) => {
            const { sectionIndex, indexInSection } = numbers[flatI++];
            const stepN = stepNumberLabel(sectionIndex, indexInSection);
            return (
              <div key={ii} style={{
                marginBottom:12, paddingLeft:12,
                background:th.appCard,
                border:`1px solid ${th.appBorder}`,
                borderRadius:14, overflow:"hidden",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px 6px" }}>
                  <div style={{
                    minWidth:24, height:24, padding:"0 5px", borderRadius:12,
                    background:color, color:"#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:F.ui, fontSize:11, fontWeight:700, flexShrink:0,
                  }}>{stepN}</div>
                  <div style={{ flex:1, fontFamily:F.ui, fontSize:11, color:th.appFaded }}>Passo {stepN}</div>
                  {selectMode ? (
                    <input
                      type="checkbox"
                      checked={selected.has(`${si}_${ii}`)}
                      onChange={() => toggleSelect(si, ii)}
                      style={{ width:18, height:18, flexShrink:0, cursor:"pointer" }}
                    />
                  ) : (
                    <>
                      <div style={{ display:"flex", flexDirection:"column", flexShrink:0 }}>
                        <button onClick={() => moveStep(si, ii, -1)} disabled={ii === 0} title="Sposta su" style={{
                          background:"none", border:"none", padding:0, height:14, lineHeight:"14px",
                          fontSize:11, color: ii === 0 ? "#ddd" : th.appFaded,
                          cursor: ii === 0 ? "default" : "pointer",
                        }}>▲</button>
                        <button onClick={() => moveStep(si, ii, 1)} disabled={ii === sec.items.length - 1} title="Sposta giù" style={{
                          background:"none", border:"none", padding:0, height:14, lineHeight:"14px",
                          fontSize:11, color: ii === sec.items.length - 1 ? "#ddd" : th.appFaded,
                          cursor: ii === sec.items.length - 1 ? "default" : "pointer",
                        }}>▼</button>
                      </div>
                      <button onClick={() => setMovePickerFor({ mode:"single", si, ii })} title="Sposta in…" style={{
                        background:"none", border:"none", fontSize:15, cursor:"pointer", flexShrink:0, padding:0,
                      }}>📂</button>
                      <button onClick={() => removeStep(si, ii)} style={{
                        background:"none", border:"none", color:"#ccc",
                        fontSize:16, cursor:"pointer",
                      }}>×</button>
                    </>
                  )}
                </div>
                <textarea
                  value={step.text}
                  onChange={e => updateStepText(si, ii, e.target.value)}
                  rows={3}
                  placeholder="Descrivi questo passo…"
                  style={{
                    width:"100%", padding:"4px 12px 10px",
                    border:"none", background:"transparent",
                    fontFamily:F.body, fontSize:13, color:th.appInk,
                    outline:"none", resize:"none", lineHeight:1.5,
                    boxSizing:"border-box",
                  }}
                />
                <div style={{ padding:"0 12px 10px", display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14 }}>⏱</span>
                  <input
                    type="number" min="0" inputMode="numeric"
                    value={step.duration ?? ""}
                    onChange={e => {
                      const v = e.target.value;
                      updateStep(si, ii, "duration", v === "" ? null : Math.max(0, parseInt(v, 10) || 0));
                    }}
                    placeholder="min"
                    style={{
                      width:56, padding:"5px 8px",
                      border:`1.5px solid ${th.appBorder}`, borderRadius:8,
                      background:th.appBg, fontFamily:F.ui, fontSize:12, color:th.appInk,
                      outline:"none",
                    }}
                  />
                  <span style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>
                    minuti — timer disponibile in Modalità Cucina
                  </span>
                </div>
                <div style={{ padding:"0 12px 12px" }}>
                  {step.photos.length > 0 && (
                    <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom: step.photos.length < MAX_STEP_PHOTOS ? 8 : 0 }}>
                      {step.photos.map((photo, pi) => (
                        <div key={pi} style={{ position:"relative", flexShrink:0 }}>
                          <img src={photo} alt={`Foto ${pi+1} del passo ${stepN}`} style={{ width:70, height:70, objectFit:"cover", borderRadius:10, display:"block" }}/>
                          <button onClick={() => removePhoto(si, ii, pi)} style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%", background:"rgba(0,0,0,0.6)", color:"#fff", border:"none", cursor:"pointer", fontSize:11, lineHeight:1 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.photos.length < MAX_STEP_PHOTOS && (
                    <button onClick={() => openPhotoPicker(si, ii)} style={{
                      width:"100%", padding:"7px",
                      border:`1.5px dashed ${th.appBorder}`,
                      borderRadius:10, background:"transparent",
                      color:th.appFaded, fontFamily:F.ui, fontSize:11, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      opacity: isOnline ? 1 : 0.5,
                    }}>📷 Aggiungi foto{step.photos.length > 0 ? ` (${step.photos.length}/${MAX_STEP_PHOTOS})` : ""}</button>
                  )}
                </div>
              </div>
            );
          })}

          {!selectMode && (
            <button onClick={() => addStep(si)} style={{
              marginLeft:12, padding:"7px 14px",
              border:`1.5px dashed ${th.appBorder}`,
              borderRadius:10, background:"transparent",
              color:th.appFaded, fontFamily:F.ui, fontSize:12,
              cursor:"pointer",
            }}>+ Aggiungi passo</button>
          )}
        </div>
      ))}

      {!selectMode && (
        <button onClick={addSection} style={{
          width:"100%", padding:"12px",
          border:`1.5px dashed ${color}`,
          borderRadius:12, background:`${color}08`,
          color:color, fontFamily:F.ui, fontSize:13, fontWeight:600,
          cursor:"pointer", marginTop:4,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}>＋ Aggiungi sottosezione</button>
      )}
      <Toast msg={toast.msg} visible={toast.visible}/>
      {movePickerFor && (
        <SectionMovePicker
          sections={sections}
          excludeSectionIndex={movePickerFor.mode === "single" ? movePickerFor.si : null}
          onPick={handleMovePick}
          onClose={() => setMovePickerFor(null)}
        />
      )}
    </div>
  );
}
