import { useState, useRef } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import GlobalNav from "../components/GlobalNav.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import AppIcon from "../components/AppIcon.jsx";
import BookMembersPanel from "../components/BookMembersPanel.jsx";
import SuggestionHint from "../components/SuggestionHint.jsx";
import { guideLibri } from "../data/guideContent.jsx";
import { shouldRemindBackup } from "../utils/backupReminder.js";
import {
  ROLES, normalizeRole, roleLabelLong, MAX_MEMBERS,
} from "../utils/bookRoles.js";

// Etichette per i 4 ruoli — i nomi interni (bookRoles.js/firestore.rules,
// invariati per non richiedere migrazioni dati) restano "collaboratore" e
// "redattore"; a schermo diventano "co-proprietario" e "collaboratore",
// stesso approccio già usato per gli alias legacy "edit"/"read".
const ROLE_LABELS = { proprietario: "proprietario", collaboratore: "co-proprietario", redattore: "collaboratore", lettore: "lettore" };
const roleLabel = (r) => ROLE_LABELS[r] || r;
// Ruolo del/della utente corrente in un libro condiviso (o "proprietario"
// se è il suo). Non ha senso per il Beta (accesso per ruolo globale, non
// membership) — non va mai chiamata su b1.
const myRoleInBook = (b, me) => b.owner === me ? "proprietario" : normalizeRole((b.memberRoles || {})[me]);

export default function BooksScreen({
  books, activeBookId, me,
  onSwitch, onCreate, onRename, onDelete, onAddMember, onRemoveMember, onChangeMemberPermission,
  onDownloadBackup, onRestoreBackup, onTransferAll, onTransferBookData,
  defaultBookId, onSetDefault,
  onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping,
}) {
  const th = useTheme();
  const ui = useUiStyle();
  const isNew = ui.booksLayout === "list";
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmails, setNewEmails] = useState("");
  const [createError, setCreateError] = useState(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [renaming, setRenaming] = useState(null); // book id
  const [renameVal, setRenameVal] = useState("");
  const [roleFilter, setRoleFilter] = useState(null); // null = tutti i libri
  // Azioni non permesse dal ruolo, visibili ma spente: mostra il perché al
  // tocco invece di sparire del tutto (IMPLEMENTATION_PLAN Fase 10, bullet
  // 42) — solo negli stili nuovi, book id per cui è aperta la spiegazione.
  const [roleExplainFor, setRoleExplainFor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null); // book id
  // trasferimento completo di un libro (tutte le ricette + Organizza
  // Ingredienti) in un altro proprio libro — annidato nella scheda del
  // libro attivo, non più una fase/schermata a sé (l'esportazione di una
  // selezione di ricette passa ora da UnifiedExportFlow.jsx).
  const [pendingTransferTarget, setPendingTransferTarget] = useState(null); // bookId
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferMsg, setTransferMsg] = useState(null);
  // backup — annidato nella scheda di ogni ricettario, non più una fase a sé
  const [remindBackup, setRemindBackup] = useState(shouldRemindBackup);
  const [backupDoneMsg, setBackupDoneMsg] = useState(null);
  const [restoreTargetId, setRestoreTargetId] = useState(null); // bookId per cui si sta ripristinando
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const [restoreSuccess, setRestoreSuccess] = useState(null);
  const fileInputRef = useRef(null);
  const [pendingBackupCopyId, setPendingBackupCopyId] = useState(null); // backup id in conferma copia
  const [backupCopyBusyId, setBackupCopyBusyId] = useState(null);
  const [backupCopyMsg, setBackupCopyMsg] = useState({}); // backup id → {ok, text}

  const otherBooks = books.filter(b => b.id !== activeBookId);
  const ownedCount = books.filter(b => b.owner === me && b.id !== "b1").length;
  const atBookLimit = ownedCount >= 10;

  // Filtro per ruolo: pillole solo se l'utente ha davvero più di un ruolo
  // tra i propri libri (altrimenti sarebbe un filtro inutile) — il Beta
  // non entra nel calcolo (accesso per ruolo globale, non membership) e
  // resta sempre visibile, filtro o no.
  const distinctRoles = ROLES.filter(r => books.some(b => b.id !== "b1" && myRoleInBook(b, me) === r));
  // Un backup "orfano" (il ricettario a cui era associato è stato eliminato)
  // torna a comparire come voce normale della lista invece di sparire nel
  // nulla — è comunque eliminabile da lì con lo stesso pulsante degli altri
  // ricettari personali (vedi più sotto), non serve UI dedicata.
  const isOrphanBackup = (b) => b.isBackup && !books.some(x => x.id === b.backupForBookId);
  const visibleBooks = books
    .filter(b => b.id === "b1" || !roleFilter || myRoleInBook(b, me) === roleFilter)
    .filter(b => !b.isBackup || isOrphanBackup(b));

  const handleDownloadBackup = () => {
    onDownloadBackup();
    setRemindBackup(false);
    setBackupDoneMsg("Backup scaricato");
    setTimeout(() => setBackupDoneMsg(null), 2500);
  };

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // consente di riselezionare subito lo stesso file
    const targetId = restoreTargetId;
    if (!file || !targetId) return;
    setRestoreError(null);
    setRestoreSuccess(null);
    setRestoreBusy(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (payload.app !== "ricettario" || !payload.data) throw new Error("Questo file non è un backup valido di Ricettario.");
      await onRestoreBackup(payload, targetId);
      setRestoreSuccess("Backup ripristinato e associato a questo ricettario.");
    } catch (err) {
      setRestoreError(err.message || "Ripristino non riuscito.");
    } finally {
      setRestoreBusy(false);
    }
  };

  const doBackupCopy = async (backupId, targetId, targetName) => {
    setBackupCopyBusyId(backupId);
    try {
      await onTransferBookData(backupId, targetId);
      setPendingBackupCopyId(null);
      setBackupCopyMsg(p => ({ ...p, [backupId]: { ok: true, text: `Copiato in "${targetName}"` } }));
    } catch (err) {
      setBackupCopyMsg(p => ({ ...p, [backupId]: { ok: false, text: err.message || "Copia non riuscita." } }));
    } finally {
      setBackupCopyBusyId(null);
      setTimeout(() => setBackupCopyMsg(p => ({ ...p, [backupId]: null })), 3000);
    }
  };

  const doTransferAll = async (targetId, targetName) => {
    setTransferBusy(true);
    try {
      await onTransferAll(targetId);
      setPendingTransferTarget(null);
      setTransferMsg({ ok: true, text: `Tutti i dati trasferiti in "${targetName}"` });
      setTimeout(() => setTransferMsg(null), 3000);
    } catch (err) {
      setTransferMsg({ ok: false, text: err.message || "Trasferimento non riuscito." });
      setTimeout(() => setTransferMsg(null), 3000);
    } finally {
      setTransferBusy(false);
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
      bottomNavActive
    />
  );

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}
      {ui.header === "legacy" && (
        <div style={{ padding:"14px 20px 6px" }}>
          <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk }}>📚 I miei Ricettari</div>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:3 }}>
            account: {me}
          </div>
        </div>
      )}
      <ScreenHeader
        title="I miei Ricettari"
        subtitle={`account: ${me}`}
        onHome={onLanding}
      />

      {/* Input file nascosto e condiviso da tutte le schede: quale libro
          riceve il ripristino è deciso da restoreTargetId, impostato dal
          pulsante "Ripristina backup qui" della scheda cliccata. */}
      <input ref={fileInputRef} type="file" accept="application/json" style={{ display:"none" }} onChange={handleFileChosen} />

      {remindBackup && (
        <div style={{ padding:"0 18px 4px" }}>
          <SuggestionHint>
            <span style={{ fontFamily:F.ui, fontSize:11.5, color:th.appInk }}>
              Non hai ancora un backup locale recente. Scaricalo dalla scheda del ricettario attivo qui sotto ("⬇️ Scarica backup").
            </span>
          </SuggestionHint>
        </div>
      )}

      {distinctRoles.length > 1 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", padding:"0 18px 10px" }}>
          {[{ id:null, label:"tutti" }, ...distinctRoles.map(r => ({ id:r, label:roleLabel(r) }))].map(opt => (
            <button key={opt.label} onClick={() => setRoleFilter(opt.id)} style={{
              padding:"5px 11px", borderRadius:20, border:`1.5px solid ${roleFilter === opt.id ? th.appAccent : th.appBorder}`,
              background: roleFilter === opt.id ? th.appAccent : "transparent",
              color: roleFilter === opt.id ? th.appOnAccent : th.appFaded,
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
          const linkedBackups = books.filter(x => x.isBackup && x.backupForBookId === b.id);
          // Un libro personale vero è eliminabile come qualunque altro, ma
          // solo se ne resta almeno un altro accessibile — altrimenti l'app
          // resterebbe senza ricettario attivo a metà sessione (il server
          // rifiuta comunque questo caso, vedi api/delete-book.js: qui si
          // evita solo di mostrare un pulsante che fallirebbe sempre).
          const canDeletePersonal = !isBeta && b.type === "personale" && !b.isBackup && isOwner && books.length > 1;
          return (
            <div key={b.id} style={{
              position:"relative", overflow:"hidden",
              background:th.appCard,
              border:`1.5px solid ${active ? th.appAccent : th.appBorder}`,
              borderRadius:14, padding:"12px 14px", marginBottom:10,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {isNew && (
                  // Dorso del libro 44×58, gradiente del tema + filetto chiaro
                  // a sinistra (IMPLEMENTATION_PLAN Fase 10, bullet 42) —
                  // elenco, non scaffale di copertine (DECISIONI.md §Ricettari).
                  <div style={{
                    width:44, height:58, borderRadius:4, background:th.coverBg,
                    position:"relative", overflow:"hidden", flexShrink:0,
                    boxShadow: active ? `0 0 0 2px ${th.appAccent}` : "none",
                  }}>
                    <div style={{ position:"absolute", left:6, top:0, bottom:0, width:1, background:th.spineColor }}/>
                  </div>
                )}
                {!isNew && (
                  isBeta ? <AppIcon emoji="🧪" icon="beta" size={20} />
                  : b.isBackup ? <span style={{ fontSize:20 }}>📦</span>
                  : b.type === "personale" ? <AppIcon emoji="🔒" icon="privato" size={20} />
                  : <span style={{ fontSize:20 }}>👥</span>
                )}
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
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk }}>{b.name}</div>
                      {isNew && active && (
                        <span style={{ flexShrink:0, fontFamily:F.ui, fontSize:8.5, fontWeight:700, letterSpacing:0.5, color:th.appOnAccent, background:th.appAccent, borderRadius:6, padding:"2px 6px", textTransform:"uppercase" }}>Attivo</span>
                      )}
                    </div>
                    <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, display:"flex", alignItems:"center", gap:6, marginTop: isNew ? 3 : 0 }}>
                      {!isNew && (
                        <span>
                          {isBeta ? "Ricettario Beta" : b.isBackup ? "backup senza ricettario associato" : b.type === "personale" ? "personale" : `condiviso · ${(b.memberEmails || []).length + 1}/${MAX_MEMBERS} membri`}
                          {!isBeta && b.type === "condiviso" && !isOwner && <> · tu: {roleLabel(myRole)}</>}
                          {active && <span style={{ color:th.appAccent, fontWeight:700 }}> · attivo</span>}
                        </span>
                      )}
                      {isNew && (
                        <>
                          <span>
                            {isBeta ? "Ricettario Beta" : b.isBackup ? "backup senza ricettario associato" : b.type === "personale" ? "personale" : `${(b.memberEmails || []).length + 1} persone`}
                            {/* Ruolo per esteso, ui.muted 10.5px (IMPLEMENTATION_PLAN Fase 10, bullet 42) */}
                            {!isBeta && b.type === "condiviso" && (
                              <span style={{ color:ui.muted, fontSize:10.5 }}> · {isOwner ? roleLabelLong("proprietario") : roleLabelLong(myRole)}</span>
                            )}
                          </span>
                          {!isBeta && b.type === "condiviso" && (
                            <div style={{ display:"flex" }}>
                              {[b.owner, ...(b.memberEmails || [])].slice(0, 4).map((email, i) => (
                                <span key={email} title={email} style={{
                                  width:16, height:16, borderRadius:"50%", flexShrink:0,
                                  marginLeft: i === 0 ? 0 : -5,
                                  // accent2 non va usato come fondo pieno di
                                  // testo (PALETTE.md): non ha un "onAccent2"
                                  // a contrasto garantito. Qui l'accento
                                  // primario, che invece ce l'ha.
                                  background:th.appAccent, color:th.appOnAccent,
                                  border:`1.5px solid ${th.appCard}`,
                                  fontSize:7.5, fontWeight:700, fontFamily:F.ui,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                }}>{email.slice(0,2).toUpperCase()}</span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                {isRen ? (
                  <button onClick={() => { onRename(b.id, renameVal.trim() || b.name); setRenaming(null); }} style={{ background:th.appAccent, border:"none", borderRadius:9, padding:"7px 11px", color:th.appOnAccent, fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>✓</button>
                ) : (
                  <button onClick={() => { setRenaming(b.id); setRenameVal(b.name); }} title="Rinomina" style={{ background:"none", border:"none", fontSize:15, cursor:"pointer", color:th.appFaded, flexShrink:0, padding:"4px 6px", display:"flex" }}><AppIcon emoji="✏️" icon="modifica" size={15} /></button>
                )}
                {!active && !isRen && (
                  <button onClick={() => onSwitch(b.id)} style={{ background:th.appInk, border:"none", borderRadius:9, padding:"8px 13px", color:th.appBg, fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Apri</button>
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
                  ? <><AppIcon emoji="⭐" icon="preferito" size={11} /> Predefinito all'avvio dell'app</>
                  : <><span style={{ opacity:0.5, display:"flex" }}><AppIcon emoji="☆" icon="preferito-vuoto" size={11} /></span> <span style={{ textDecoration:"underline", textUnderlineOffset:2 }}>Imposta come predefinito all'avvio</span></>}
              </button>

              {/* Backup orfano (il ricettario a cui era associato non esiste
                  più): resta comunque eliminabile, stesso overlay di conferma
                  usato per gli altri ricettari (vedi confirmingDelete sotto). */}
              {b.isBackup && (
                <button onClick={() => setPendingDelete(b.id)} style={{ marginTop:8, background:"none", border:"none", color:ui.danger, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:5 }}><AppIcon emoji="🗑️" icon="elimina" size={12} /> Elimina ricettario di backup</button>
              )}

              {/* Libro personale vero: eliminabile come i condivisi, stesso
                  overlay di conferma (confirmingDelete sotto). */}
              {canDeletePersonal && (
                <button onClick={() => setPendingDelete(b.id)} style={{ marginTop:8, background:"none", border:"none", color:ui.danger, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:5 }}><AppIcon emoji="🗑️" icon="elimina" size={12} /> Elimina ricettario</button>
              )}

              {/* Backup: scarica (solo libro attivo) e ripristina-qui (tutti i
                  libri, compresi i backup orfani) — non sul Beta. */}
              {!isBeta && (
                <div style={{ marginTop:8, display:"flex", gap:6, flexWrap:"wrap" }}>
                  {active && (
                    <button onClick={handleDownloadBackup} style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:10, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                      {backupDoneMsg
                        ? <><AppIcon emoji="✓" icon="fatto" size={11} /> {backupDoneMsg}</>
                        : <><AppIcon emoji="⬇️" icon="scarica" size={11} /> Scarica backup</>}
                    </button>
                  )}
                  <button disabled={restoreBusy && restoreTargetId === b.id} onClick={() => { setRestoreTargetId(b.id); setRestoreError(null); setRestoreSuccess(null); fileInputRef.current?.click(); }} style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:10, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
                    {restoreBusy && restoreTargetId === b.id ? "Ripristino…" : <><AppIcon emoji="📥" icon="importa" size={11} /> Ripristina backup qui</>}
                  </button>
                </div>
              )}
              {restoreTargetId === b.id && restoreError && (
                <div style={{ fontFamily:F.ui, fontSize:10.5, color:ui.danger, marginTop:5 }}>{restoreError}</div>
              )}
              {restoreTargetId === b.id && restoreSuccess && (
                <div style={{ fontFamily:F.ui, fontSize:10.5, color:"#6B8C6E", marginTop:5, display:"flex", alignItems:"center", gap:5 }}><AppIcon emoji="✓" icon="fatto" size={11} /> {restoreSuccess}</div>
              )}

              {/* Trasferisci tutto questo ricettario (solo libro attivo, non
                  Beta): copia tutte le ricette e le impostazioni di Organizza
                  Ingredienti in un altro proprio libro, senza doverle
                  selezionare una per una — non elimina né sovrascrive nulla
                  nel libro di destinazione. Diverso dall'esportazione di una
                  selezione di ricette (vedi UnifiedExportFlow.jsx). */}
              {active && !isBeta && otherBooks.length > 0 && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${th.appBorder}` }}>
                  <div style={{ fontFamily:F.ui, fontSize:9, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6, display:"flex", alignItems:"center", gap:4 }}><AppIcon emoji="🔀" icon="trasferisci" size={10} /> Trasferisci tutto questo ricettario</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {otherBooks.map(ob => (
                      pendingTransferTarget === ob.id ? (
                        <div key={ob.id} style={{ display:"flex", alignItems:"center", gap:6, background:th.appBg, border:`1.5px solid ${th.appAccent}`, borderRadius:11, padding:"6px 8px" }}>
                          <span style={{ fontFamily:F.ui, fontSize:10.5, color:th.appInk }}>Confermi in "{ob.name}"?</span>
                          <button disabled={transferBusy} onClick={() => doTransferAll(ob.id, ob.name)} style={{ padding:"5px 9px", borderRadius:8, border:"none", background:th.appAccent, color:th.appOnAccent, fontFamily:F.ui, fontSize:10.5, fontWeight:700, cursor:"pointer" }}>{transferBusy ? "…" : "✓ Conferma"}</button>
                          <button disabled={transferBusy} onClick={() => setPendingTransferTarget(null)} style={{ padding:"5px 9px", borderRadius:8, border:`1px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:10.5, cursor:"pointer" }}>Annulla</button>
                        </div>
                      ) : (
                        <button key={ob.id} disabled={transferBusy} onClick={() => setPendingTransferTarget(ob.id)} style={{ padding:"5px 9px", borderRadius:8, border:`1px solid ${th.appBorder}`, background:"transparent", color:th.appInk, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer" }}>{ob.name}</button>
                      )
                    ))}
                  </div>
                  {transferMsg && <div style={{ fontFamily:F.ui, fontSize:10.5, color: transferMsg.ok ? "#6B8C6E" : ui.danger, marginTop:6, display:"flex", alignItems:"center", gap:5 }}>{transferMsg.ok && <AppIcon emoji="✓" icon="fatto" size={11} />} {transferMsg.text}</div>}
                </div>
              )}

              {/* Backup associati a questo ricettario (ripristinati da file) */}
              {linkedBackups.length > 0 && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${th.appBorder}` }}>
                  <div style={{ fontFamily:F.ui, fontSize:9, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>📦 Backup associati</div>
                  {linkedBackups.map(bk => (
                    <div key={bk.id} style={{ marginBottom:6 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontFamily:F.ui, fontSize:11, color:th.appInk, flex:1, minWidth:0 }}>{bk.name}</span>
                        {pendingDelete === bk.id ? (
                          <>
                            <span style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded }}>Eliminare?</span>
                            <button onClick={() => { onDelete(bk.id); setPendingDelete(null); }} style={{ padding:"5px 9px", borderRadius:8, border:"none", background:ui.danger, color:"#fff", fontFamily:F.ui, fontSize:10.5, fontWeight:700, cursor:"pointer" }}>Sì</button>
                            <button onClick={() => setPendingDelete(null)} style={{ padding:"5px 9px", borderRadius:8, border:`1px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:10.5, cursor:"pointer" }}>No</button>
                          </>
                        ) : pendingBackupCopyId === bk.id ? (
                          <>
                            <span style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded }}>Copiare tutto in "{b.name}"?</span>
                            <button disabled={backupCopyBusyId === bk.id} onClick={() => doBackupCopy(bk.id, b.id, b.name)} style={{ padding:"5px 9px", borderRadius:8, border:"none", background:th.appAccent, color:th.appOnAccent, fontFamily:F.ui, fontSize:10.5, fontWeight:700, cursor:"pointer" }}>{backupCopyBusyId === bk.id ? "…" : "✓ Conferma"}</button>
                            <button disabled={backupCopyBusyId === bk.id} onClick={() => setPendingBackupCopyId(null)} style={{ padding:"5px 9px", borderRadius:8, border:`1px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:10.5, cursor:"pointer" }}>Annulla</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setPendingBackupCopyId(bk.id)} style={{ padding:"5px 9px", borderRadius:8, border:"none", background:th.appAccent, color:th.appOnAccent, fontFamily:F.ui, fontSize:10.5, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}><AppIcon emoji="🔀" icon="trasferisci" size={11} /> Copia tutto qui</button>
                            <button onClick={() => setPendingDelete(bk.id)} title="Elimina backup" style={{ padding:"5px 9px", borderRadius:8, border:`1px solid ${th.appBorder}`, background:"transparent", color:ui.danger, fontFamily:F.ui, fontSize:10.5, cursor:"pointer", display:"flex", alignItems:"center" }}><AppIcon emoji="🗑️" icon="elimina" size={13} /></button>
                          </>
                        )}
                      </div>
                      {backupCopyMsg[bk.id] && (
                        <div style={{ fontFamily:F.ui, fontSize:10, color: backupCopyMsg[bk.id].ok ? "#6B8C6E" : ui.danger, marginTop:3, display:"flex", alignItems:"center", gap:4 }}>{backupCopyMsg[bk.id].ok && <AppIcon emoji="✓" icon="fatto" size={10} />} {backupCopyMsg[bk.id].text}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Ricettario Beta: accesso automatico per ruolo, nessuna gestione membri */}
              {isBeta && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${th.appBorder}`, fontFamily:F.ui, fontSize:10.5, color:th.appFaded, fontStyle:"italic" }}>
                  🧪 Ricettario Beta — accesso automatico per tutti i tester/admin, non richiede inviti.
                </div>
              )}

              {/* Membri (solo condivisi, non Beta) */}
              {!isBeta && b.type === "condiviso" && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${th.appBorder}` }}>
                  <BookMembersPanel book={b} me={me} onAddMember={onAddMember} onRemoveMember={onRemoveMember} onChangeMemberPermission={onChangeMemberPermission}/>
                  {/* Ruolo che non permette di invitare: visibile ma spenta,
                      il perché compare al tocco invece di sparire del tutto
                      (IMPLEMENTATION_PLAN Fase 10, bullet 42) — solo stili nuovi. */}
                  {isNew && !canManageMembers && !isOwner && (
                    <>
                      <button
                        onClick={() => setRoleExplainFor(o => o === b.id ? null : b.id)}
                        style={{
                          width:"100%", padding:"8px 11px", borderRadius:9,
                          border:`1px dashed ${ui.border}`, background:"transparent",
                          opacity:0.45, cursor:"pointer", textAlign:"left",
                          fontFamily:F.ui, fontSize:11, fontWeight:600, color:ui.ink,
                        }}
                      >＋ Invita</button>
                      {roleExplainFor === b.id && (
                        <div style={{ fontFamily:F.ui, fontSize:10.5, color:ui.faded, marginTop:6, fontStyle:"italic" }}>
                          {myRole === "lettore" ? "Hai accesso in sola lettura." : "Il tuo ruolo non permette di invitare membri."}
                        </div>
                      )}
                    </>
                  )}
                  {isOwner && (
                    <button onClick={() => setPendingDelete(b.id)} style={{ marginTop:10, background:"none", border:"none", color:ui.danger, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", padding:0, display:"flex", alignItems:"center", gap:5 }}><AppIcon emoji="🗑️" icon="elimina" size={12} /> Elimina ricettario</button>
                  )}
                </div>
              )}

              {confirmingDelete && (
                <div style={{ position:"absolute", inset:0, background:`${th.appBg}f2`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, padding:12 }}>
                  <div style={{ fontFamily:F.ui, fontSize:12, color:th.appInk, textAlign:"center" }}>Eliminare <b>{b.name}</b>?<br/>Ricette e dati andranno persi per sempre.</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => setPendingDelete(null)} style={{ padding:"8px 14px", borderRadius:9, border:`1.5px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Annulla</button>
                    <button onClick={() => { onDelete(b.id); setPendingDelete(null); }} style={{ padding:"8px 14px", borderRadius:9, border:"none", background:ui.danger, color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer" }}>Elimina definitivamente</button>
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
            {createError && <div style={{ fontFamily:F.ui, fontSize:11, color:ui.danger, marginBottom:8 }}>{createError}</div>}
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
              }} disabled={!newName.trim() || createBusy} style={{ flex:2, padding:"11px", border:"none", borderRadius:11, background: newName.trim() ? th.appAccent : th.appBorder, color: newName.trim() ? th.appOnAccent : th.appFaded, fontFamily:F.ui, fontSize:12, fontWeight:700, cursor: newName.trim() ? "pointer" : "default" }}>
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

      </div>
    </div>
  );
}
