import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import GlobalNav from "../components/GlobalNav.jsx";
import { guideLibri } from "../data/guideContent.jsx";
import {
  ROLES, normalizeRole, assignableRoles, canAssignRole, canRemoveMember,
  canAddMember, MAX_MEMBERS,
} from "../utils/bookRoles.js";

const DANGER = "#C4593A";
// Etichette per i 4 ruoli — i nomi interni (bookRoles.js/firestore.rules)
// restano questi; qui è solo la resa a schermo.
const ROLE_LABELS = { proprietario: "proprietario", collaboratore: "collaboratore", redattore: "redattore", lettore: "lettore" };
const roleLabel = (r) => ROLE_LABELS[r] || r;
// Ruolo del/della utente corrente in un libro condiviso (o "proprietario"
// se è il suo). Non ha senso per il Beta (accesso per ruolo globale, non
// membership) — non va mai chiamata su b1.
const myRoleInBook = (b, me) => b.owner === me ? "proprietario" : normalizeRole((b.memberRoles || {})[me]);

export default function BooksScreen({
  books, activeBookId, me, activeRecipes,
  onSwitch, onCreate, onRename, onDelete, onAddMember, onRemoveMember, onChangeMemberPermission,
  onCopyRecipes, onExportCode, onImportCode,
  defaultBookId, onSetDefault,
  onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping,
}) {
  const th = useTheme();
  const [phase, setPhase] = useState("list"); // "list" | "transfer"
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmails, setNewEmails] = useState("");
  const [createError, setCreateError] = useState(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [renaming, setRenaming] = useState(null); // book id
  const [renameVal, setRenameVal] = useState("");
  const [memberInput, setMemberInput] = useState({}); // bookId → email
  const [inviteRole, setInviteRole] = useState({}); // bookId → ruolo scelto per il prossimo invito
  const [memberError, setMemberError] = useState({}); // bookId → messaggio d'errore
  const [memberBusy, setMemberBusy] = useState({}); // bookId → true mentre una chiamata è in corso
  const [roleFilter, setRoleFilter] = useState(null); // null = tutti i libri
  const [pendingDelete, setPendingDelete] = useState(null); // book id
  const [importOpen, setImportOpen] = useState(false);
  const [importVal, setImportVal] = useState("");
  const [importMsg, setImportMsg] = useState(null);
  // transfer phase
  const [selIds, setSelIds] = useState([]);
  const [shareCode, setShareCode] = useState(null);
  const [copiedMsg, setCopiedMsg] = useState(null);

  const activeBook = books.find(b => b.id === activeBookId);
  const otherBooks = books.filter(b => b.id !== activeBookId);
  const ownedCount = books.filter(b => b.owner === me && b.id !== "b1").length;
  const atBookLimit = ownedCount >= 10;

  // Filtro per ruolo: pillole solo se l'utente ha davvero più di un ruolo
  // tra i propri libri (altrimenti sarebbe un filtro inutile) — il Beta
  // non entra nel calcolo (accesso per ruolo globale, non membership) e
  // resta sempre visibile, filtro o no.
  const distinctRoles = ROLES.filter(r => books.some(b => b.id !== "b1" && myRoleInBook(b, me) === r));
  const visibleBooks = books.filter(b => b.id === "b1" || !roleFilter || myRoleInBook(b, me) === roleFilter);

  const setMemberErr = (bookId, msg) => setMemberError(p => ({ ...p, [bookId]: msg }));
  const withMemberBusy = async (bookId, fn) => {
    setMemberBusy(p => ({ ...p, [bookId]: true }));
    setMemberErr(bookId, null);
    try {
      await fn();
    } catch (err) {
      setMemberErr(bookId, err.message || "Operazione non riuscita.");
    } finally {
      setMemberBusy(p => ({ ...p, [bookId]: false }));
    }
  };

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
      infoContent={guideLibri}
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

      {distinctRoles.length > 1 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", padding:"0 18px 10px" }}>
          {[{ id:null, label:"tutti" }, ...distinctRoles.map(r => ({ id:r, label:roleLabel(r) }))].map(opt => (
            <button key={opt.label} onClick={() => setRoleFilter(opt.id)} style={{
              padding:"5px 11px", borderRadius:20, border:`1.5px solid ${roleFilter === opt.id ? th.appAccent : th.appBorder}`,
              background: roleFilter === opt.id ? th.appAccent : "transparent",
              color: roleFilter === opt.id ? "#fff" : th.appFaded,
              fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
            }}>{opt.label}</button>
          ))}
        </div>
      )}

      <div style={{ flex:1, overflowY:"auto", padding:"10px 18px 40px" }}>
        {visibleBooks.map(b => {
          const active = b.id === activeBookId;
          const isRen = renaming === b.id;
          const isBeta = b.id === "b1";
          const isOwner = b.owner === me;
          const myRole = isBeta ? null : myRoleInBook(b, me);
          const canManageMembers = myRole === "proprietario" || myRole === "collaboratore";
          const confirmingDelete = pendingDelete === b.id;
          return (
            <div key={b.id} style={{
              position:"relative", overflow:"hidden",
              background:th.appCard,
              border:`1.5px solid ${active ? th.appAccent : th.appBorder}`,
              borderRadius:14, padding:"12px 14px", marginBottom:10,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:20 }}>{isBeta ? "🧪" : b.type === "personale" ? "🔒" : "👥"}</span>
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
                      {isBeta ? "Ricettario Beta" : b.type === "personale" ? "personale" : `condiviso · ${(b.memberEmails || []).length + 1}/${MAX_MEMBERS} membri`}
                      {!isBeta && b.type === "condiviso" && !isOwner && <> · tu: {roleLabel(myRole)}</>}
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

              {/* Ricettario Beta: accesso automatico per ruolo, nessuna gestione membri */}
              {isBeta && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${th.appBorder}`, fontFamily:F.ui, fontSize:10.5, color:th.appFaded, fontStyle:"italic" }}>
                  🧪 Ricettario Beta — accesso automatico per tutti i tester/admin, non richiede inviti.
                </div>
              )}

              {/* Membri (solo condivisi, non Beta) */}
              {!isBeta && b.type === "condiviso" && (() => {
                const roles = b.memberRoles || {};
                const memberCount = (b.memberEmails || []).length;
                const atMemberCap = !canAddMember(memberCount);
                const busy = !!memberBusy[b.id];
                const myInviteOptions = assignableRoles(myRole);
                const selectedInviteRole = myInviteOptions.includes(inviteRole[b.id]) ? inviteRole[b.id] : myInviteOptions[myInviteOptions.length - 1];
                return (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${th.appBorder}` }}>
                  <div style={{ fontFamily:F.ui, fontSize:9, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>Membri</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
                    <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appInk }}>{b.owner} <span style={{ color:th.appFaded }}>👑 proprietario</span></div>
                    {(b.memberEmails || []).map(m => {
                      const targetRole = normalizeRole(roles[m]);
                      const emails = { actorEmail: me, targetEmail: m };
                      const assignablePills = canManageMembers ? myInviteOptions.filter(r => canAssignRole(myRole, targetRole, r, emails)) : [];
                      const iCanRemove = canManageMembers && canRemoveMember(myRole, targetRole, emails);
                      return (
                      <div key={m} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                        <span style={{ fontFamily:F.ui, fontSize:10.5, color:th.appInk, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m}</span>
                        {assignablePills.length > 0 ? (
                          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                            <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:`1px solid ${th.appBorder}` }}>
                              {assignablePills.map(p => (
                                <button key={p} disabled={busy || targetRole === p} onClick={() => withMemberBusy(b.id, () => onChangeMemberPermission(b.id, m, p))} style={{
                                  padding:"4px 8px", border:"none", cursor: (busy || targetRole === p) ? "default" : "pointer",
                                  background: targetRole === p ? th.appAccent : "transparent",
                                  color: targetRole === p ? "#fff" : th.appFaded,
                                  fontFamily:F.ui, fontSize:9.5, fontWeight:600,
                                }}>{roleLabel(p)}</button>
                              ))}
                            </div>
                            {iCanRemove && (
                              <button disabled={busy} onClick={() => withMemberBusy(b.id, () => onRemoveMember(b.id, m))} style={{ background:"none", border:"none", color:DANGER, cursor: busy ? "default" : "pointer", fontSize:14, padding:0, flexShrink:0 }}>×</button>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, flexShrink:0 }}>{roleLabel(targetRole)}</span>
                        )}
                      </div>
                      );
                    })}
                  </div>
                  {memberError[b.id] && (
                    <div style={{ fontFamily:F.ui, fontSize:10.5, color:DANGER, marginBottom:8 }}>{memberError[b.id]}</div>
                  )}
                  {canManageMembers && (
                    <>
                      <div style={{ display:"flex", gap:6, marginBottom:6 }}>
                        {myInviteOptions.map(r => (
                          <button key={r} onClick={() => setInviteRole(p => ({ ...p, [b.id]: r }))} style={{
                            padding:"4px 9px", borderRadius:20, border:`1.5px solid ${selectedInviteRole === r ? th.appAccent : th.appBorder}`,
                            background: selectedInviteRole === r ? th.appAccent : "transparent",
                            color: selectedInviteRole === r ? "#fff" : th.appFaded,
                            fontFamily:F.ui, fontSize:9.5, fontWeight:600, cursor:"pointer",
                          }}>{roleLabel(r)}</button>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:6 }}>
                        <input
                          value={memberInput[b.id] || ""}
                          disabled={atMemberCap || busy}
                          onChange={e => setMemberInput(p => ({ ...p, [b.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter" && !atMemberCap) { withMemberBusy(b.id, () => onAddMember(b.id, memberInput[b.id] || "", selectedInviteRole)); setMemberInput(p => ({ ...p, [b.id]: "" })); } }}
                          placeholder={atMemberCap ? "limite membri raggiunto" : "email@esempio.it"}
                          style={{ flex:1, padding:"8px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", minWidth:0 }}
                        />
                        <button disabled={atMemberCap || busy} onClick={() => { withMemberBusy(b.id, () => onAddMember(b.id, memberInput[b.id] || "", selectedInviteRole)); setMemberInput(p => ({ ...p, [b.id]: "" })); }} style={{
                          background: (atMemberCap || busy) ? th.appBorder : th.appAccent, border:"none", borderRadius:9, padding:"8px 12px",
                          color: atMemberCap ? th.appFaded : "#fff", fontFamily:F.ui, fontSize:12, fontWeight:700,
                          cursor: (atMemberCap || busy) ? "default" : "pointer", flexShrink:0,
                        }}>＋ Invita</button>
                      </div>
                      <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:6, fontStyle:"italic" }}>
                        {atMemberCap ? `Limite di ${MAX_MEMBERS} membri raggiunto.` : "Puoi invitare solo email già abilitate da un admin in \"Gestione utenti\"."}
                      </div>
                    </>
                  )}
                  {isOwner && (
                    <button onClick={() => setPendingDelete(b.id)} style={{ marginTop:10, background:"none", border:"none", color:DANGER, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", padding:0 }}>🗑️ Elimina ricettario</button>
                  )}
                </div>
                );
              })()}

              {confirmingDelete && (
                <div style={{ position:"absolute", inset:0, background:`${th.appBg}f2`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:12 }}>
                  <div style={{ fontFamily:F.ui, fontSize:12, color:th.appInk, textAlign:"center" }}>Eliminare <b>{b.name}</b>?<br/>Ricette e dati andranno persi per sempre.</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setPendingDelete(null)} style={{ padding:"8px 14px", borderRadius:9, border:`1.5px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Annulla</button>
                    <button onClick={() => { onDelete(b.id); setPendingDelete(null); }} style={{ padding:"8px 14px", borderRadius:9, border:"none", background:DANGER, color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer" }}>Elimina definitivamente</button>
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
            {createError && <div style={{ fontFamily:F.ui, fontSize:11, color:DANGER, marginBottom:8 }}>{createError}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setCreating(false); setNewName(""); setNewEmails(""); setCreateError(null); }} style={{ flex:1, padding:"11px", border:`1.5px solid ${th.appBorder}`, borderRadius:11, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Annulla</button>
              <button onClick={async () => {
                setCreateBusy(true); setCreateError(null);
                try {
                  await onCreate(newName, newEmails.split(",").map(s => s.trim().toLowerCase()).filter(Boolean));
                  setCreating(false); setNewName(""); setNewEmails("");
                } catch (err) {
                  setCreateError(err.message || "Creazione non riuscita.");
                } finally {
                  setCreateBusy(false);
                }
              }} disabled={!newName.trim() || createBusy} style={{ flex:2, padding:"11px", border:"none", borderRadius:11, background: newName.trim() ? th.appAccent : th.appBorder, color: newName.trim() ? "#fff" : th.appFaded, fontFamily:F.ui, fontSize:12, fontWeight:700, cursor: newName.trim() ? "pointer" : "default" }}>
                {createBusy ? "Creazione…" : "Crea ricettario"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => setCreating(true)} disabled={atBookLimit} style={{
              width:"100%", padding:"13px", borderRadius:14,
              border:`1.5px dashed ${th.appBorder}`, background:"transparent",
              color: atBookLimit ? th.appBorder : th.appFaded, fontFamily:F.ui, fontSize:13, fontWeight:600,
              cursor: atBookLimit ? "default" : "pointer", marginBottom:4,
            }}>＋ Nuovo ricettario condiviso</button>
            <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, textAlign:"center", marginBottom:10 }}>
              {ownedCount}/10 ricettari di tua proprietà{atBookLimit ? " — limite raggiunto" : ""}
            </div>
          </>
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
