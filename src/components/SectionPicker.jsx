import React, { useState } from "react";
import { F, MACRO_SECTIONS, PICKER_EMOJIS } from "../data/constants.js";
import { uid, sortSectionsAltroLast } from "../utils/helpers.js";
import SectionCategoryIcon from "./SectionCategoryIcon.jsx";
import ChosenIcon from "./ChosenIcon.jsx";
import FoodIconGrid from "./FoodIconGrid.jsx";
import AppIcon from "./AppIcon.jsx";

// Primo livello Emoji/SVG condiviso dai due popup sotto (nuova sezione,
// modifica icona di una sezione esistente).
const ModeToggle = ({ mode, onChange }) => (
  <div style={{ display:"flex", borderRadius:20, overflow:"hidden", border:"1.5px solid #EDE6D4", marginBottom:10, width:"fit-content" }}>
    {[["emoji","Emoji"],["svg","SVG"]].map(([id,label]) => (
      <button key={id} onClick={() => onChange(id)} style={{
        padding:"6px 16px", border:"none", cursor:"pointer",
        background: mode===id ? "#2C2416" : "transparent",
        color: mode===id ? "#fff" : "#7A6E5F",
        fontFamily:F.ui, fontSize:11, fontWeight:700,
      }}>{label}</button>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════
// SECTION PICKER — selettore sezione ricettario con aggiunta custom
// ══════════════════════════════════════════════════════════════
export default function SectionPicker({ value, onChange, sections = MACRO_SECTIONS, onAddSection, onUpdateSection, onDeleteSection, showDefaultHint = true }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [newIcon, setNewIcon] = useState(undefined);
  const [pickEmoji, setPickEmoji] = useState(false);
  const [newMode, setNewMode] = useState("emoji"); // "emoji" | "svg", per il popup icona qui sotto
  const [managing, setManaging] = useState(false);       // popup modifica sezioni
  const [editEmojiFor, setEditEmojiFor] = useState(null); // id sezione di cui cambiare icona
  const [editMode, setEditMode] = useState("emoji");      // idem, per il popup di modifica
  const [confirmDelId, setConfirmDelId] = useState(null);  // id sezione in attesa di conferma eliminazione

  const ordered = sortSectionsAltroLast(sections);

  const saveNew = () => {
    const label = newName.trim();
    if (!label || !onAddSection) return;
    const id = uid("sec");
    onAddSection({ id, label, emoji: newEmoji, desc: "", ...(newIcon ? { icon: newIcon } : {}) });
    onChange(id);
    setAdding(false); setNewName(""); setNewEmoji("📁"); setNewIcon(undefined); setNewMode("emoji");
  };

  return (
    <div>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {ordered.map(sec => {
          const on = value === sec.id;
          return (
            <button key={sec.id} onClick={() => onChange(sec.id)} style={{
              flex:"1 1 28%", minWidth:90, padding:"10px 6px", borderRadius:12, cursor:"pointer",
              border:`1.5px solid ${on ? "#C4593A" : "#EDE6D4"}`,
              background: on ? "#C4593A15" : "#F7F2E8",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            }}>
              <SectionCategoryIcon item={sec} size={18} />
              <span style={{ fontFamily:F.ui, fontSize:10, fontWeight:700, color: on ? "#C4593A" : "#7A6E5F", textAlign:"center" }}>{sec.label}</span>
            </button>
          );
        })}
        {onAddSection && (
          <button onClick={() => setAdding(true)} style={{
            flex:"1 1 28%", minWidth:90, padding:"10px 6px", borderRadius:12, cursor:"pointer",
            border:"1.5px dashed #C9BDA5", background:"transparent",
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
          }}>
            <span style={{ fontSize:18 }}>＋</span>
            <span style={{ fontFamily:F.ui, fontSize:10, fontWeight:700, color:"#7A6E5F" }}>Nuova sezione</span>
          </button>
        )}
      </div>
      {onUpdateSection && (
        <button onClick={() => setManaging(true)} style={{
          marginTop:8, background:"none", border:"none", cursor:"pointer",
          fontFamily:F.ui, fontSize:11, color:"#7A6E5F",
          textDecoration:"underline", textUnderlineOffset:3, padding:0,
          display:"flex", alignItems:"center", gap:4,
        }}><AppIcon emoji="✏️" icon="modifica" size={11} /> Modifica sezioni esistenti</button>
      )}

      {/* Popup nuova sezione */}
      {adding && (
        <div onClick={() => setAdding(false)} style={{ position:"absolute", inset:0, zIndex:500, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", background:"#FAF7F0", borderRadius:18, padding:"18px 16px", boxShadow:"0 10px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ fontFamily:F.display, fontSize:16, color:"#2C2416", textAlign:"center", marginBottom:12 }}>Nuova sezione</div>
            {!pickEmoji ? (
              <>
                <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                  <button onClick={() => setPickEmoji(true)} style={{ width:48, padding:"8px 4px", textAlign:"center", border:"1.5px solid #EDE6D4", borderRadius:10, background:"#F7F2E8", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}><ChosenIcon emoji={newEmoji} icon={newIcon} size={18} /></button>
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveNew()}
                    placeholder="Nome sezione…"
                    autoFocus
                    style={{ flex:1, padding:"10px 12px", border:"1.5px solid #EDE6D4", borderRadius:10, background:"#F7F2E8", fontFamily:F.body, fontSize:14, color:"#2C2416", outline:"none", minWidth:0 }}
                  />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => setAdding(false)} style={{ flex:1, padding:"11px", border:"1.5px solid #EDE6D4", borderRadius:12, background:"transparent", color:"#7A6E5F", fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Annulla</button>
                  <button onClick={saveNew} disabled={!newName.trim()} style={{ flex:2, padding:"11px", border:"none", borderRadius:12, background: newName.trim() ? "#C4593A" : "#EDE6D4", color: newName.trim() ? "#fff" : "#7A6E5F", fontFamily:F.ui, fontSize:12, fontWeight:700, cursor: newName.trim() ? "pointer" : "default" }}>Crea</button>
                </div>
              </>
            ) : (
              <>
                <ModeToggle mode={newMode} onChange={setNewMode} />
                {newMode === "emoji" ? (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6 }}>
                    {PICKER_EMOJIS.map(e => (
                      <button key={e} onClick={() => { setNewEmoji(e); setNewIcon(undefined); setPickEmoji(false); }} style={{
                        aspectRatio:"1", borderRadius:10, border:"1px solid #EDE6D4",
                        background:"#F7F2E8", fontSize:20, cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>{e}</button>
                    ))}
                  </div>
                ) : (
                  <FoodIconGrid value={newIcon} onSelect={name => { setNewIcon(name); setPickEmoji(false); }} />
                )}
                <button onClick={() => setPickEmoji(false)} style={{ width:"100%", marginTop:12, padding:"11px", border:"1.5px solid #EDE6D4", borderRadius:12, background:"transparent", color:"#7A6E5F", fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>‹ Indietro</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Popup modifica sezioni esistenti */}
      {managing && (
        <div onClick={() => { setManaging(false); setEditEmojiFor(null); }} style={{ position:"absolute", inset:0, zIndex:500, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxHeight:"85%", overflowY:"auto", background:"#FAF7F0", borderRadius:18, padding:"18px 16px", boxShadow:"0 10px 40px rgba(0,0,0,0.4)" }}>
            <div style={{ fontFamily:F.display, fontSize:16, color:"#2C2416", textAlign:"center", marginBottom:4 }}>Modifica sezioni</div>
            <div style={{ fontFamily:F.ui, fontSize:10.5, color:"#7A6E5F", textAlign:"center", marginBottom:12 }}>"Altro" è fissa e resta in fondo</div>

            {editEmojiFor ? (
              <>
                <ModeToggle mode={editMode} onChange={setEditMode} />
                {editMode === "emoji" ? (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6 }}>
                    {PICKER_EMOJIS.map(e => (
                      <button key={e} onClick={() => {
                        const sec = sections.find(s => s.id === editEmojiFor);
                        // icon rimosso del tutto (non messo a undefined:
                        // Firestore rifiuta i campi undefined) — se aveva
                        // un'icona SVG fissa (sezione predefinita), scegliere
                        // qui una propria emoji la sostituisce del tutto.
                        if (sec) onUpdateSection(Object.fromEntries(Object.entries({ ...sec, emoji: e }).filter(([k]) => k !== "icon")));
                        setEditEmojiFor(null); setEditMode("emoji");
                      }} style={{
                        aspectRatio:"1", borderRadius:10, border:"1px solid #EDE6D4",
                        background:"#F7F2E8", fontSize:20, cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>{e}</button>
                    ))}
                  </div>
                ) : (
                  <FoodIconGrid onSelect={name => {
                    const sec = sections.find(s => s.id === editEmojiFor);
                    if (sec) onUpdateSection({ ...sec, icon: name });
                    setEditEmojiFor(null); setEditMode("emoji");
                  }} />
                )}
                <button onClick={() => { setEditEmojiFor(null); setEditMode("emoji"); }} style={{ width:"100%", marginTop:12, padding:"11px", border:"1.5px solid #EDE6D4", borderRadius:12, background:"transparent", color:"#7A6E5F", fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>‹ Indietro</button>
              </>
            ) : (
              <>
                {ordered.map(sec => {
                  const isFixed = sec.id === "altro";
                  return (
                    <div key={sec.id} style={{
                      display:"flex", alignItems:"center", gap:8, marginBottom:8,
                      opacity: isFixed ? 0.7 : 1,
                    }}>
                      <button
                        onClick={() => !isFixed && setEditEmojiFor(sec.id)}
                        disabled={isFixed}
                        style={{ width:44, padding:"8px 4px", textAlign:"center", border:"1.5px solid #EDE6D4", borderRadius:10, background:"#F7F2E8", cursor: isFixed ? "default" : "pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}
                      ><SectionCategoryIcon item={sec} size={16} /></button>
                      <input
                        value={sec.label}
                        onChange={e => !isFixed && onUpdateSection({ ...sec, label: e.target.value })}
                        disabled={isFixed}
                        style={{ flex:1, padding:"9px 12px", border:"1.5px solid #EDE6D4", borderRadius:10, background:"#F7F2E8", fontFamily:F.body, fontSize:13, color:"#2C2416", outline:"none", minWidth:0 }}
                      />
                      {isFixed ? (
                        <span style={{ fontFamily:F.ui, fontSize:9, color:"#7A6E5F", flexShrink:0 }}>fissa</span>
                      ) : onDeleteSection && (
                        confirmDelId === sec.id ? (
                          <button onClick={() => { onDeleteSection(sec.id); if (value === sec.id) onChange("altro"); setConfirmDelId(null); }} style={{ flexShrink:0, padding:"8px 10px", border:"none", borderRadius:10, background:"#D93025", color:"#fff", fontFamily:F.ui, fontSize:10, fontWeight:700, cursor:"pointer" }}>Confermi?</button>
                        ) : (
                          <button onClick={() => setConfirmDelId(sec.id)} title="Elimina sezione" style={{ flexShrink:0, background:"none", border:"none", color:"#ccc", fontSize:15, cursor:"pointer", padding:"0 2px", display:"flex" }}><AppIcon emoji="🗑️" icon="elimina" size={14} /></button>
                        )
                      )}
                    </div>
                  );
                })}
                {onDeleteSection && (
                  <div style={{ fontFamily:F.ui, fontSize:9.5, color:"#7A6E5F", margin:"2px 0 6px", lineHeight:1.4 }}>
                    🗑️ elimina la sezione: le sue ricette passano in "Altro".
                  </div>
                )}
                <button onClick={() => { setManaging(false); setConfirmDelId(null); }} style={{ width:"100%", marginTop:8, padding:"12px", border:"none", borderRadius:12, background:"#C4593A", color:"#fff", fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer" }}>Fatto ✓</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
