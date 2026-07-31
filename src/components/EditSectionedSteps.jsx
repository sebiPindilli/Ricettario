import React from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { stepPhotosOf, stepNumbers, stepNumberLabel } from "../utils/helpers.js";

// ── Editable sectioned steps ─────────────────────────────────────
export default function EditSectionedSteps({ data, color, onUpdate }) {
  const th = useTheme();
  // Difesa: normalizza sempre gli item a oggetti {text, photos}, qualunque
  // sia il formato di provenienza (stringa, vecchio photo singolo, o già photos)
  const sections = data.map(sec => ({
    ...sec,
    items: (sec.items || []).map(s => ({
      text: typeof s === "string" ? s : (s?.text ?? ""),
      photos: stepPhotosOf(s),
    })),
  }));

  const updateSection = (si, key, val) => onUpdate(sections.map((s,i) => i===si ? {...s,[key]:val} : s));
  const updateStep = (si, ii, field, val) => onUpdate(sections.map((s,i) => i!==si ? s : {
    ...s, items: s.items.map((it,j) => j===ii ? {...it,[field]:val} : it)
  }));
  const addStep = (si) => onUpdate(sections.map((s,i) => i!==si ? s : {
    ...s, items:[...s.items, { text:"", photos:[] }]
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

  // Numerazione gerarchica coerente con StepsView/CookingMode: passaggi
  // sciolti (sottosezione senza nome) numerati semplici, passaggi dentro
  // una sottosezione con nome numerati "N.M".
  const numbers = stepNumbers(sections);
  let flatI = 0;

  return (
    <div>
      <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginBottom:12 }}>
        Scrivi i passi e, se vuoi, raggruppali in sottosezioni (es. "Pasta", "Salsa", "Impiattamento")
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
              }}>🗑</button>
            )}
          </div>
          {/* Linea che raggruppa visivamente i passaggi sotto la sottosezione
              con nome — stessa idea del divisore di SectionBadge in visualizzazione.
              Assente per i passaggi sciolti (sottosezione senza nome). */}
          {sec.section && (
            <div style={{ height:1, background:`${color}44`, margin:"0 0 10px 12px" }}/>
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
                  <button onClick={() => removeStep(si, ii)} style={{
                    background:"none", border:"none", color:"#ccc",
                    fontSize:16, cursor:"pointer",
                  }}>×</button>
                </div>
                <textarea
                  value={step.text}
                  onChange={e => updateStep(si, ii, "text", e.target.value)}
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
                {step.photos.length > 0 ? (
                  <div style={{ margin:"0 12px 12px", position:"relative" }}>
                    <div style={{ width:"100%", height:90, borderRadius:10, background:`${color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>📸</div>
                    <button onClick={() => updateStep(si, ii, "photos", [])} style={{ position:"absolute", top:6, right:6, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.5)", color:"#fff", border:"none", cursor:"pointer", fontSize:11 }}>×</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:6, padding:"0 12px 12px" }}>
                    {["📷 Scatta","🖼 Libreria"].map(lbl => (
                      <button key={lbl} onClick={() => updateStep(si, ii, "photos", ["PHOTO_PLACEHOLDER"])} style={{
                        flex:1, padding:"7px", border:`1.5px dashed ${th.appBorder}`,
                        borderRadius:10, background:"transparent",
                        color:th.appFaded, fontFamily:F.ui, fontSize:11, cursor:"pointer",
                      }}>{lbl}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={() => addStep(si)} style={{
            marginLeft:12, padding:"7px 14px",
            border:`1.5px dashed ${th.appBorder}`,
            borderRadius:10, background:"transparent",
            color:th.appFaded, fontFamily:F.ui, fontSize:12,
            cursor:"pointer",
          }}>+ Aggiungi passo</button>
        </div>
      ))}

      <button onClick={addSection} style={{
        width:"100%", padding:"12px",
        border:`1.5px dashed ${color}`,
        borderRadius:12, background:`${color}08`,
        color:color, fontFamily:F.ui, fontSize:13, fontWeight:600,
        cursor:"pointer", marginTop:4,
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      }}>＋ Aggiungi sottosezione</button>
    </div>
  );
}
