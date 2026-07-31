import React from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

// ── Editable sectioned steps ─────────────────────────────────────
export default function EditSectionedSteps({ data, color, onUpdate }) {
  const th = useTheme();
  // Difesa: normalizza sempre gli item a oggetti {text, photo}
  const sections = data.map(sec => ({
    ...sec,
    items: (sec.items || []).map(s =>
      typeof s === "string" ? { text:s, photo:null } : (s || { text:"", photo:null })
    ),
  }));

  const updateSection = (si, key, val) => onUpdate(sections.map((s,i) => i===si ? {...s,[key]:val} : s));
  const updateStep = (si, ii, field, val) => onUpdate(sections.map((s,i) => i!==si ? s : {
    ...s, items: s.items.map((it,j) => j===ii ? {...it,[field]:val} : it)
  }));
  const addStep = (si) => onUpdate(sections.map((s,i) => i!==si ? s : {
    ...s, items:[...s.items, { text:"", photo:null }]
  }));
  const removeStep = (si, ii) => onUpdate(sections.map((s,i) => i!==si ? s : {
    ...s, items: s.items.filter((_,j) => j!==ii)
  }));
  const addSection = () => onUpdate([...sections, { section:"", items:[{ text:"", photo:null }] }]);
  const removeSection = (si) => onUpdate(sections.filter((_,i) => i!==si));

  // running step count across sections
  let globalIdx = 0;

  return (
    <div>
      <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginBottom:12 }}>
        Scrivi i passi e, se vuoi, raggruppali in sottosezioni (es. "Pasta", "Salsa", "Impiattamento")
      </div>
      {sections.map((sec, si) => (
        <div key={si} style={{ marginBottom:18 }}>
          {/* Section name */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
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
            {sections.length > 1 && (
              <button onClick={() => removeSection(si)} style={{
                background:"none", border:"none", color:"#ccc",
                fontSize:16, cursor:"pointer", flexShrink:0,
              }}>🗑</button>
            )}
          </div>

          {/* Steps */}
          {sec.items.map((step, ii) => {
            const stepN = ++globalIdx;
            return (
              <div key={ii} style={{
                marginBottom:12, paddingLeft:12,
                background:th.appCard,
                border:`1px solid ${th.appBorder}`,
                borderRadius:14, overflow:"hidden",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px 6px" }}>
                  <div style={{
                    width:24, height:24, borderRadius:"50%",
                    background:color, color:"#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:F.ui, fontSize:11, fontWeight:700, flexShrink:0,
                  }}>{stepN}</div>
                  <div style={{ flex:1, fontFamily:F.ui, fontSize:11, color:th.appFaded }}>Passo {stepN}</div>
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
                {step.photo ? (
                  <div style={{ margin:"0 12px 12px", position:"relative" }}>
                    <div style={{ width:"100%", height:90, borderRadius:10, background:`${color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>📸</div>
                    <button onClick={() => updateStep(si, ii, "photo", null)} style={{ position:"absolute", top:6, right:6, width:22, height:22, borderRadius:"50%", background:"rgba(0,0,0,0.5)", color:"#fff", border:"none", cursor:"pointer", fontSize:11 }}>×</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:6, padding:"0 12px 12px" }}>
                    {["📷 Scatta","🖼 Libreria"].map(lbl => (
                      <button key={lbl} onClick={() => updateStep(si, ii, "photo", "PHOTO_PLACEHOLDER")} style={{
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
