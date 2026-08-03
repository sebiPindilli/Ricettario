import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import GlobalNav from "../components/GlobalNav.jsx";

export default function BooksScreen({
  books, activeBookId, me, activeRecipes,
  onSwitch, onCreate, onRename, onAddMember, onRemoveMember,
  onCopyRecipes, onExportCode, onImportCode,
  defaultBookId, onSetDefault,
  onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping,
}) {
  const th = useTheme();
  const [phase, setPhase] = useState("list"); // "list" | "transfer"
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmails, setNewEmails] = useState("");
  const [renaming, setRenaming] = useState(null); // book id
  const [renameVal, setRenameVal] = useState("");
  const [memberInput, setMemberInput] = useState({}); // bookId → email
  const [importOpen, setImportOpen] = useState(false);
  const [importVal, setImportVal] = useState("");
  const [importMsg, setImportMsg] = useState(null);
  // transfer phase
  const [selIds, setSelIds] = useState([]);
  const [shareCode, setShareCode] = useState(null);
  const [copiedMsg, setCopiedMsg] = useState(null);

  const activeBook = books.find(b => b.id === activeBookId);
  const otherBooks = books.filter(b => b.id !== activeBookId);

  const nav = (
    <GlobalNav
      activeScreen="books"
      onRecipes={onRecipes}
      onBook={onBook}
      onMemories={onMemories}
      onAdd={onAdd}
      onFridge={onFridge}
      onShopping={onShopping}
      onLanding={onLanding}
      onSearch={() => {}}
      onFavorites={() => {}}
      showSearch={false}
      showFavorites={false}
      activeLabel="I miei Ricettari"
    />
  );

  // ══ FASE TRASFERIMENTO / CONDIVISIONE ══
  if (phase === "transfer") {
    const toggle = (id) => setSelIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 6px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => { setPhase("list"); setSelIds([]); setShareCode(null); }} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>Esporta ricette</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>da: {activeBook?.name}</div>
          </div>
        </div>

        {shareCode ? (
          <div style={{ flex:1, overflowY:"auto", padding:"12px 20px 40px" }}>
            <div style={{ fontFamily:F.ui, fontSize:12, color:th.appInk, marginBottom:10, lineHeight:1.5 }}>
              🔗 <b>Codice di condivisione</b> per {selIds.length} ricett{selIds.length===1?"a":"e"}. Invialo a chi vuoi (WhatsApp, email…): dal suo ricettario potrà importarle con "Importa da codice".
            </div>
            <textarea
              readOnly
              value={shareCode}
              onClick={e => e.target.select()}
              style={{ width:"100%", height:140, padding:"10px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:12, background:th.appCard, fontFamily:"monospace", fontSize:10, color:th.appInk, boxSizing:"border-box", resize:"none" }}
            />
            <button onClick={() => {
              if (navigator.clipboard?.writeText) navigator.clipboard.writeText(shareCode).catch(()=>{});
              setCopiedMsg("✓ Codice copiato!");
              setTimeout(() => setCopiedMsg(null), 2000);
            }} style={{ width:"100%", marginTop:10, padding:"13px", border:"none", borderRadius:12, background: copiedMsg ? "#6B8C6E" : th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {copiedMsg || "📋 Copia codice"}
            </button>
            <button onClick={() => setShareCode(null)} style={{ width:"100%", marginTop:8, padding:"11px", border:`1.5px solid ${th.appBorder}`, borderRadius:12, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>‹ Torna alla selezione</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, padding:"4px 20px 8px" }}>
              Seleziona una o più ricette, poi scegli dove copiarle.
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"0 18px 150px" }}>
              {activeRecipes.map(r => {
                const on = selIds.includes(r.id);
                return (
                  <button key={r.id} onClick={() => toggle(r.id)} style={{
                    width:"100%", display:"flex", alignItems:"center", gap:10,
                    background:th.appCard, border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
                    borderRadius:12, padding:"10px 12px", marginBottom:7, cursor:"pointer", textAlign:"left",
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:6, flexShrink:0,
                      border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
                      background: on ? th.appAccent : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#fff", fontSize:12,
                    }}>{on && "✓"}</div>
                    <div style={{ width:34, height:34, borderRadius:9, background:r.color, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>{r.emoji}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:F.display, fontSize:14, color:th.appInk, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.title}</div>
                      <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded }}>{r.category}</div>
                    </div>
                  </button>
                );
              })}
              {activeRecipes.length === 0 && (
                <div style={{ textAlign:"center", padding:"30px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>Nessuna ricetta in questo ricettario</div>
              )}
            </div>

            {/* Azioni fisse in basso */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 18px 20px", background:`linear-gradient(transparent, ${th.appBg} 25%)` }}>
              {copiedMsg && (
                <div style={{ textAlign:"center", fontFamily:F.ui, fontSize:12, color:"#6B8C6E", fontWeight:700, marginBottom:8 }}>{copiedMsg}</div>
              )}
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>
                Copia in un altro tuo ricettario
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {otherBooks.map(b => (
                  <button key={b.id} disabled={selIds.length===0} onClick={() => {
                    onCopyRecipes(b.id, selIds);
                    setCopiedMsg(`✓ ${selIds.length} ricett${selIds.length===1?"a copiata":"e copiate"} in "${b.name}"`);
                    setSelIds([]);
                    setTimeout(() => setCopiedMsg(null), 2500);
                  }} style={{
                    padding:"9px 13px", borderRadius:11, border:"none",
                    background: selIds.length===0 ? th.appBorder : th.appAccent,
                    color: selIds.length===0 ? th.appFaded : "#fff",
                    fontFamily:F.ui, fontSize:12, fontWeight:700,
                    cursor: selIds.length===0 ? "default" : "pointer",
                  }}>📚 {b.name}</button>
                ))}
                {otherBooks.length === 0 && (
                  <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>crea prima un altro ricettario</div>
                )}
              </div>
              <button disabled={selIds.length===0} onClick={() => setShareCode(onExportCode(selIds))} style={{
                width:"100%", padding:"13px", borderRadius:12,
                border:`1.5px solid ${selIds.length===0 ? th.appBorder : th.appInk}`,
                background:"transparent",
                color: selIds.length===0 ? th.appFaded : th.appInk,
                fontFamily:F.ui, fontSize:13, fontWeight:700,
                cursor: selIds.length===0 ? "default" : "pointer",
              }}>🔗 Genera codice per esterni ({selIds.length})</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ══ FASE LISTA RICETTARI ══
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}
      <div style={{ padding:"14px 20px 6px" }}>
        <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk }}>📚 I miei Ricettari</div>
        <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:3 }}>
          account: {me} <span style={{ opacity:0.6 }}>(simulato — arriverà dal login Google)</span>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"10px 18px 40px" }}>
        {books.map(b => {
          const active = b.id === activeBookId;
          const isRen = renaming === b.id;
          return (
            <div key={b.id} style={{
              background:th.appCard,
              border:`1.5px solid ${active ? th.appAccent : th.appBorder}`,
              borderRadius:14, padding:"12px 14px", marginBottom:10,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:20 }}>{b.type === "personale" ? "🔒" : "👥"}</span>
                {isRen ? (
                  <input
                    value={renameVal}
                    autoFocus
                    onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { onRename(b.id, renameVal.trim() || b.name); setRenaming(null); } if (e.key === "Escape") setRenaming(null); }}
                    style={{ flex:1, padding:"7px 10px", border:`1.5px solid ${th.appAccent}`, borderRadius:9, background:th.appBg, fontFamily:F.display, fontSize:15, color:th.appInk, outline:"none", minWidth:0 }}
                  />
                ) : (
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk }}>{b.name}</div>
                    <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded }}>
                      {b.type === "personale" ? "personale" : `condiviso · ${b.members.length} membri`}
                      {active && <span style={{ color:th.appAccent, fontWeight:700 }}> · attivo</span>}
                    </div>
                  </div>
                )}
                {isRen ? (
                  <button onClick={() => { onRename(b.id, renameVal.trim() || b.name); setRenaming(null); }} style={{ background:th.appAccent, border:"none", borderRadius:9, padding:"7px 11px", color:"#fff", fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>✓</button>
                ) : (
                  <button onClick={() => { setRenaming(b.id); setRenameVal(b.name); }} title="Rinomina" style={{ background:"none", border:"none", fontSize:15, cursor:"pointer", color:th.appFaded, flexShrink:0, padding:"4px 6px" }}>✏️</button>
                )}
                {!active && !isRen && (
                  <button onClick={() => onSwitch(b.id)} style={{ background:th.appInk, border:"none", borderRadius:9, padding:"8px 13px", color:"#fff", fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Apri</button>
                )}
              </div>

              {/* Predefinito all'avvio */}
              <button
                onClick={() => b.id !== defaultBookId && onSetDefault(b.id)}
                style={{
                  marginTop:8, background:"none", border:"none",
                  cursor: b.id === defaultBookId ? "default" : "pointer",
                  fontFamily:F.ui, fontSize:10.5, padding:0,
                  color: b.id === defaultBookId ? th.appAccent : th.appFaded,
                  display:"flex", alignItems:"center", gap:4,
                }}
              >
                {b.id === defaultBookId
                  ? <><span>⭐</span> Predefinito all'avvio dell'app</>
                  : <><span style={{ opacity:0.5 }}>☆</span> <span style={{ textDecoration:"underline", textUnderlineOffset:2 }}>Imposta come predefinito all'avvio</span></>}
              </button>

              {/* Membri (solo condivisi) */}
              {b.type === "condiviso" && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${th.appBorder}` }}>
                  <div style={{ fontFamily:F.ui, fontSize:9, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>Membri (sincronizzati)</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                    {b.members.map(m => (
                      <span key={m} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:F.ui, fontSize:10.5, color:th.appInk, background:th.appBg, border:`1px solid ${th.appBorder}`, borderRadius:14, padding:"4px 9px" }}>
                        {m}{m === b.owner && " 👑"}
                        {m !== b.owner && (
                          <button onClick={() => onRemoveMember(b.id, m)} style={{ background:"none", border:"none", color:"#C4593A", cursor:"pointer", fontSize:12, padding:0 }}>×</button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <input
                      value={memberInput[b.id] || ""}
                      onChange={e => setMemberInput(p => ({ ...p, [b.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") { onAddMember(b.id, memberInput[b.id] || ""); setMemberInput(p => ({ ...p, [b.id]: "" })); } }}
                      placeholder="email@esempio.it"
                      style={{ flex:1, padding:"8px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", minWidth:0 }}
                    />
                    <button onClick={() => { onAddMember(b.id, memberInput[b.id] || ""); setMemberInput(p => ({ ...p, [b.id]: "" })); }} style={{ background:th.appAccent, border:"none", borderRadius:9, padding:"8px 12px", color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>＋ Invita</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Crea nuovo condiviso */}
        {creating ? (
          <div style={{ background:th.appCard, border:`1.5px dashed ${th.appAccent}`, borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>Nuovo ricettario condiviso</div>
            <input
              value={newName}
              autoFocus
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome (es. Ricette di famiglia)"
              style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", boxSizing:"border-box", marginBottom:8 }}
            />
            <input
              value={newEmails}
              onChange={e => setNewEmails(e.target.value)}
              placeholder="Email membri, separate da virgola (opzionale)"
              style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", boxSizing:"border-box", marginBottom:10 }}
            />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setCreating(false); setNewName(""); setNewEmails(""); }} style={{ flex:1, padding:"11px", border:`1.5px solid ${th.appBorder}`, borderRadius:11, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Annulla</button>
              <button onClick={() => {
                onCreate(newName, newEmails.split(",").map(s => s.trim().toLowerCase()).filter(Boolean));
                setCreating(false); setNewName(""); setNewEmails("");
              }} disabled={!newName.trim()} style={{ flex:2, padding:"11px", border:"none", borderRadius:11, background: newName.trim() ? th.appAccent : th.appBorder, color: newName.trim() ? "#fff" : th.appFaded, fontFamily:F.ui, fontSize:12, fontWeight:700, cursor: newName.trim() ? "pointer" : "default" }}>Crea ricettario</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} style={{
            width:"100%", padding:"13px", borderRadius:14,
            border:`1.5px dashed ${th.appBorder}`, background:"transparent",
            color:th.appFaded, fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:10,
          }}>＋ Nuovo ricettario condiviso</button>
        )}

        {/* Azioni: trasferisci / importa */}
        <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${th.appBorder}` }}>
          <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", marginBottom:8, fontWeight:700 }}>Condivisione ricette</div>
          <button onClick={() => setPhase("transfer")} style={{
            width:"100%", padding:"13px", borderRadius:12, border:"none",
            background:th.appAccent, color:"#fff",
            fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:8,
          }}>📤 Esporta ricette da "{activeBook?.name}"</button>

          {importOpen ? (
            <div style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12, padding:"12px" }}>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:8 }}>
                Incolla il codice ricevuto: le ricette verranno copiate in "{activeBook?.name}".
              </div>
              <textarea
                value={importVal}
                onChange={e => setImportVal(e.target.value)}
                placeholder="Incolla qui il codice…"
                style={{ width:"100%", height:80, padding:"9px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:"monospace", fontSize:10, color:th.appInk, boxSizing:"border-box", resize:"none", marginBottom:8 }}
              />
              {importMsg && (
                <div style={{ fontFamily:F.ui, fontSize:11.5, fontWeight:700, color: importMsg.ok ? "#6B8C6E" : "#C4593A", marginBottom:8 }}>
                  {importMsg.ok ? `✓ ${importMsg.count} ricett${importMsg.count===1?"a importata":"e importate"}!` : "⚠️ Codice non valido"}
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => { setImportOpen(false); setImportVal(""); setImportMsg(null); }} style={{ flex:1, padding:"10px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Chiudi</button>
                <button onClick={() => {
                  const res = onImportCode(importVal);
                  setImportMsg(res);
                  if (res.ok) setImportVal("");
                }} disabled={!importVal.trim()} style={{ flex:2, padding:"10px", border:"none", borderRadius:10, background: importVal.trim() ? th.appInk : th.appBorder, color: importVal.trim() ? "#fff" : th.appFaded, fontFamily:F.ui, fontSize:12, fontWeight:700, cursor: importVal.trim() ? "pointer" : "default" }}>Importa</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setImportOpen(true)} style={{
              width:"100%", padding:"13px", borderRadius:12,
              border:`1.5px solid ${th.appInk}`, background:"transparent",
              color:th.appInk, fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer",
            }}>📥 Importa da codice</button>
          )}
        </div>
      </div>
    </div>
  );
}
