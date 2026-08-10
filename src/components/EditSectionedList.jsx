import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F, DEFAULT_UNIT_SUGGESTIONS } from "../data/constants.js";
import { moveItemsBetweenSections } from "../utils/helpers.js";
import AutocompleteInput from "./AutocompleteInput.jsx";
import SectionMovePicker from "./SectionMovePicker.jsx";
import Toast from "./Toast.jsx";

// ── Editable sectioned ingredient list ───────────────────────────
export default function EditSectionedList({ data, color, itemType, onUpdate, nameSuggestions = [], unitSuggestions = DEFAULT_UNIT_SUGGESTIONS }) {
  const th = useTheme();
  const sections = data;
  const [nutriOpen, setNutriOpen] = useState(null); // "si_ii" con la riga % aperta
  const [nutriInfo, setNutriInfo] = useState(false); // popup "i" mostrato mentre premuto
  const [toast, setToast] = useState({ msg:"", visible:false });
  const showToast = (msg) => {
    setToast({ msg, visible:true });
    setTimeout(() => setToast({ msg:"", visible:false }), 2000);
  };
  // Spostamento tra sottosezioni — stesso schema di EditSectionedSteps.jsx.
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

  const updateSection = (si, key, val) => {
    const next = sections.map((s,i) => i===si ? {...s,[key]:val} : s);
    onUpdate(next);
  };
  const updateItem = (si, ii, val) => {
    const next = sections.map((s,i) => i!==si ? s : {
      ...s, items: s.items.map((it,j) => j===ii ? val : it)
    });
    onUpdate(next);
  };
  const emptyItem = () => itemType === "ingredient" ? { name:"", qty:"", unit:"" } : "";
  const addItem = (si) => {
    const next = sections.map((s,i) => i!==si ? s : { ...s, items:[...s.items, emptyItem()] });
    onUpdate(next);
  };
  const removeItem = (si, ii) => {
    const next = sections.map((s,i) => i!==si ? s : {
      ...s, items: s.items.filter((_,j) => j!==ii)
    });
    onUpdate(next);
  };
  const addSection = () => onUpdate([...sections, { section:"", items:[emptyItem()] }]);
  const removeSection = (si) => onUpdate(sections.filter((_,i) => i!==si));

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <div style={{ flex:1, fontFamily:F.ui, fontSize:12, color:th.appFaded }}>
          Aggiungi ingredienti e, se vuoi, raggruppali in sottosezioni (es. "Pasta", "Sugo", "Guarnizione")
        </div>
        {selectMode && selected.size > 0 && (
          <button onClick={() => setMovePickerFor({ mode:"bulk" })} style={{
            flexShrink:0, padding:"6px 12px", border:"none", borderRadius:10,
            background:color, color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer",
          }}>📂 Sposta in… ({selected.size})</button>
        )}
        <button onClick={() => { if (selectMode) { exitSelectMode(); } else { setNutriOpen(null); setSelectMode(true); } }} style={{
          flexShrink:0, background:"none", border:"none", color:th.appFaded,
          fontFamily:F.ui, fontSize:11.5, fontWeight:600, textDecoration:"underline", textUnderlineOffset:2, cursor:"pointer",
        }}>{selectMode ? "Annulla" : "Seleziona"}</button>
      </div>
      {sections.map((sec, si) => (
        <div key={si} style={{ marginBottom:16 }}>
          {/* Section name row */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{ width:4, alignSelf:"stretch", borderRadius:2, background: sec.section ? color : th.appBorder, flexShrink:0 }}/>
            <input
              value={sec.section}
              onChange={e => updateSection(si, "section", e.target.value)}
              placeholder={sections.length > 1 ? "Nome sottosezione (es. Salsa)" : "Sottosezione (opzionale)"}
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
              }}>🗑️</button>
            )}
          </div>
          {sec.section && sec.items.length === 0 && (
            <div style={{ margin:"0 0 8px 12px", fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5 }}>
              Sottosezione vuota — puoi eliminarla con 🗑️ qui sopra, oppure lasciarla: se resterà vuota al salvataggio verrà rimossa automaticamente.
            </div>
          )}

          {/* Items */}
          {sec.items.map((item, ii) => {
            if (itemType === "ingredient") {
              // item è un oggetto { name, qty, unit, note? } — qty può essere
              // stringa durante la digitazione, numero dopo il salvataggio
              const ing = (typeof item === "string") ? { name:item, qty:"", unit:"" } : (item || { name:"", qty:"", unit:"" });
              const name = ing.name || "";
              const qty = ing.qty == null ? "" : String(ing.qty).replace(".", ",");
              const unit = ing.unit || "";
              const patch = (p) => updateItem(si, ii, { ...ing, ...p });
              const isQB = unit.toLowerCase() === "q.b.";
              const inputBase = {
                padding:"9px 10px",
                border:`1.5px solid ${th.appBorder}`,
                borderRadius:10, background:th.appCard,
                fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none",
              };
              const disabledStyle = { opacity:0.4, pointerEvents:"none" };
              const hasPct = typeof ing.nutriPct === "number" ? ing.nutriPct < 100 : (ing.nutriPct !== "" && ing.nutriPct != null && parseFloat(String(ing.nutriPct).replace(",", ".")) < 100);
              const pctOpen = nutriOpen === si+"_"+ii;
              return (
                <React.Fragment key={ii}>
                <div style={{ display:"flex", gap:5, marginBottom: pctOpen ? 4 : 6, alignItems:"center", paddingLeft:12 }}>
                  {selectMode ? (
                    <input
                      type="checkbox"
                      checked={selected.has(`${si}_${ii}`)}
                      onChange={() => toggleSelect(si, ii)}
                      style={{ width:18, height:18, flexShrink:0, cursor:"pointer" }}
                    />
                  ) : (
                    <span style={{ color:th.appAccent2, fontSize:12, flexShrink:0 }}>✦</span>
                  )}
                  <div style={{ display:"flex", gap:5, alignItems:"center", flex:1, minWidth:0, ...(selectMode ? disabledStyle : {}) }}>
                  <AutocompleteInput
                    value={name}
                    onChange={v => patch({ name: v })}
                    suggestions={nameSuggestions}
                    placeholder="Ingrediente"
                    wrapperStyle={{ flex:2.2, minWidth:0 }}
                    inputStyle={inputBase}
                  />
                  <input
                    value={isQB ? "" : qty}
                    onChange={e => patch({ qty: e.target.value })}
                    placeholder="Qtà"
                    inputMode="decimal"
                    disabled={isQB}
                    style={{ ...inputBase, flex:0.9, minWidth:0, textAlign:"center", ...(isQB ? disabledStyle : {}) }}
                  />
                  <AutocompleteInput
                    value={isQB ? "" : unit}
                    onChange={v => patch({ unit: v })}
                    suggestions={unitSuggestions}
                    placeholder="Unità"
                    wrapperStyle={{ flex:1.3, minWidth:0, ...(isQB ? disabledStyle : {}) }}
                    inputStyle={inputBase}
                  />
                  {/* Spunta q.b. — quanto basta */}
                  <button
                    onClick={() => patch(isQB ? { qty:"", unit:"" } : { qty:"", unit:"q.b." })}
                    title="Quanto basta"
                    style={{
                      display:"flex", flexDirection:"column", alignItems:"center", gap:1,
                      background:"none", border:"none", cursor:"pointer", flexShrink:0, padding:0,
                    }}
                  >
                    <span style={{
                      width:18, height:18, borderRadius:5,
                      border:`1.5px solid ${isQB ? th.appAccent : th.appBorder}`,
                      background: isQB ? th.appAccent : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#fff", fontSize:11, boxSizing:"border-box",
                    }}>{isQB && "✓"}</span>
                    <span style={{ fontFamily:F.ui, fontSize:8, color: isQB ? th.appAccent : th.appFaded, fontWeight:700 }}>q.b.</span>
                  </button>
                  {/* 🍎 percentuale nutrizionale */}
                  <button
                    onClick={() => setNutriOpen(o => o === si+"_"+ii ? null : si+"_"+ii)}
                    title="Quota nei valori nutrizionali"
                    style={{
                      display:"flex", flexDirection:"column", alignItems:"center", gap:1,
                      background:"none", border:"none", cursor:"pointer", flexShrink:0, padding:0,
                    }}
                  >
                    <span style={{ fontSize:14, filter: hasPct ? "none" : "grayscale(1) opacity(0.55)" }}>🍎</span>
                    <span style={{ fontFamily:F.ui, fontSize:8, color: hasPct ? th.appAccent : th.appFaded, fontWeight:700 }}>{hasPct ? String(ing.nutriPct).replace(".", ",")+"%" : "%"}</span>
                  </button>
                  </div>
                  {!selectMode && (
                    <>
                      <button onClick={() => setMovePickerFor({ mode:"single", si, ii })} title="Sposta in…" style={{
                        background:"none", border:"none", fontSize:15, cursor:"pointer", flexShrink:0, padding:0,
                      }}>📂</button>
                      <button onClick={() => removeItem(si, ii)} style={{
                        background:"none", border:"none", color:"#ccc",
                        fontSize:16, cursor:"pointer", flexShrink:0, padding:"0 2px",
                      }}>×</button>
                    </>
                  )}
                </div>
                {pctOpen && (() => {
                  const pctVal = ing.nutriPct === "" || ing.nutriPct == null ? 100 : Math.max(0, Math.min(100, parseFloat(String(ing.nutriPct).replace(",", ".")) || 0));
                  return (
                  <div style={{ margin:"0 0 8px 24px", padding:"10px 12px", background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <span style={{ fontFamily:F.ui, fontSize:11, color:th.appInk, fontWeight:700 }}>🍎 Quota nei valori nutrizionali</span>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontFamily:F.display, fontSize:16, color: hasPct ? th.appAccent : th.appInk, minWidth:44, textAlign:"right" }}>{pctVal}%</span>
                        {/* Pulsante info: popup mentre premuto */}
                        <div style={{ position:"relative", display:"inline-flex" }}>
                          <button
                            onMouseDown={() => setNutriInfo(true)}
                            onMouseUp={() => setNutriInfo(false)}
                            onMouseLeave={() => setNutriInfo(false)}
                            onTouchStart={(e) => { e.preventDefault(); setNutriInfo(true); }}
                            onTouchEnd={() => setNutriInfo(false)}
                            title="Tieni premuto per le informazioni"
                            style={{ width:22, height:22, borderRadius:"50%", border:`1.5px solid ${th.appBorder}`, background:th.appBg, color:th.appFaded, fontFamily:F.ui, fontSize:11, fontWeight:700, fontStyle:"italic", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}
                          >i</button>
                          {nutriInfo && (
                            <div style={{ position:"absolute", top:"120%", right:0, width:210, zIndex:50, background:th.appInk, color:th.appBg, fontFamily:F.ui, fontSize:10.5, lineHeight:1.45, padding:"9px 11px", borderRadius:9, boxShadow:"0 4px 14px rgba(0,0,0,0.28)" }}>
                              Indica quanta parte dell'ingrediente resta nel piatto e conta nei valori nutrizionali.<br/>
                              <b>100%</b> = tutto (predefinito). <b>0%</b> = non concorre al calcolo.<br/>
                              Es.: 100 ml d'olio per friggere di cui poco resta nel piatto → imposta ~10%.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={pctVal}
                      onChange={e => patch({ nutriPct: parseInt(e.target.value, 10) })}
                      style={{ width:"100%", accentColor:th.appAccent, cursor:"pointer" }}
                    />
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
                      <span style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded }}>0% · escluso</span>
                      <span style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded }}>100% · tutto</span>
                    </div>
                    {hasPct && (
                      <button onClick={() => { patch({ nutriPct: undefined }); setNutriOpen(null); setNutriInfo(false); }} style={{ marginTop:8, padding:"7px 11px", borderRadius:9, border:`1.5px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:11, cursor:"pointer" }}>Ripristina 100%</button>
                    )}
                  </div>
                  );
                })()}
                </React.Fragment>
              );
            }
            return (
              <div key={ii} style={{ display:"flex", gap:8, marginBottom:6, alignItems:"center", paddingLeft:12 }}>
                {selectMode ? (
                  <input
                    type="checkbox"
                    checked={selected.has(`${si}_${ii}`)}
                    onChange={() => toggleSelect(si, ii)}
                    style={{ width:18, height:18, flexShrink:0, cursor:"pointer" }}
                  />
                ) : (
                  <span style={{ color:th.appAccent2, fontSize:12, flexShrink:0 }}>✦</span>
                )}
                <input
                  value={item}
                  onChange={e => updateItem(si, ii, e.target.value)}
                  placeholder={`Elemento ${ii+1}…`}
                  disabled={selectMode}
                  style={{
                    flex:1, padding:"9px 12px",
                    border:`1.5px solid ${th.appBorder}`,
                    borderRadius:10, background:th.appCard,
                    fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none",
                    ...(selectMode ? { opacity:0.4 } : {}),
                  }}
                />
                {!selectMode && (
                  <>
                    <button onClick={() => setMovePickerFor({ mode:"single", si, ii })} title="Sposta in…" style={{
                      background:"none", border:"none", fontSize:15, cursor:"pointer", flexShrink:0, padding:0,
                    }}>📂</button>
                    <button onClick={() => removeItem(si, ii)} style={{
                      background:"none", border:"none", color:"#ccc",
                      fontSize:16, cursor:"pointer", flexShrink:0,
                    }}>×</button>
                  </>
                )}
              </div>
            );
          })}

          {!selectMode && (
            <button onClick={() => addItem(si)} style={{
              marginLeft:12, padding:"7px 14px",
              border:`1.5px dashed ${th.appBorder}`,
              borderRadius:10, background:"transparent",
              color:th.appFaded, fontFamily:F.ui, fontSize:12,
              cursor:"pointer",
            }}>+ Aggiungi {itemType === "ingredient" ? "ingrediente" : "elemento"}</button>
          )}
        </div>
      ))}

      {/* Add subsection */}
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
