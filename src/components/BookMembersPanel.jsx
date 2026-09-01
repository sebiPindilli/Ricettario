import { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import {
  normalizeRole, assignableRoles, canAssignRole, canRemoveMember, canAddMember, MAX_MEMBERS,
} from "../utils/bookRoles.js";
import AppIcon from "./AppIcon.jsx";

// Stessa etichetta breve già usata in BooksScreen.jsx per le pillole di
// ruolo — duplicata qui (due righe) invece di condivisa per non introdurre
// un accoppiamento tra i due file per un dettaglio puramente di testo.
const ROLE_LABELS = { proprietario: "proprietario", collaboratore: "co-proprietario", redattore: "collaboratore", lettore: "lettore" };
const roleLabel = (r) => ROLE_LABELS[r] || r;
const myRoleInBook = (b, me) => b.owner === me ? "proprietario" : normalizeRole((b.memberRoles || {})[me]);

// Lista membri + invito per UN libro condiviso — estratta da BooksScreen.jsx
// (dove resta usata per ogni scheda libro) perché riusabile anche fuori da
// lì (popup "Aggiungi persona" della Landing): stessa identica logica di
// permessi/ruoli, stesse chiamate onAddMember/onRemoveMember/
// onChangeMemberPermission. Non include il bottone "Elimina ricettario" né
// il fallback per chi non può invitare — quelli restano solo in
// BooksScreen.jsx, fuori posto in un popup pensato solo per i membri.
export default function BookMembersPanel({ book, me, onAddMember, onRemoveMember, onChangeMemberPermission }) {
  const th = useTheme();
  const ui = useUiStyle();
  const [memberInput, setMemberInput] = useState("");
  const [inviteRole, setInviteRole] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const withBusy = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message || "Operazione non riuscita.");
    } finally {
      setBusy(false);
    }
  };

  const myRole = myRoleInBook(book, me);
  const canManageMembers = myRole === "proprietario" || myRole === "collaboratore";
  const roles = book.memberRoles || {};
  const memberCount = (book.memberEmails || []).length;
  const atMemberCap = !canAddMember(memberCount);
  const myInviteOptions = assignableRoles(myRole);
  const selectedInviteRole = myInviteOptions.includes(inviteRole) ? inviteRole : myInviteOptions[myInviteOptions.length - 1];

  const doInvite = () => {
    if (atMemberCap || busy) return;
    withBusy(() => onAddMember(book.id, memberInput || "", selectedInviteRole));
    setMemberInput("");
  };

  return (
    <div>
      <div style={{ fontFamily:F.ui, fontSize:9, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>Membri</div>
      <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:8 }}>
        <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appInk }}>{book.owner} <span style={{ color:th.appFaded, display:"inline-flex", alignItems:"center", gap:3 }}><AppIcon emoji="👑" icon="corona" size={10} /> proprietario</span></div>
        {(book.memberEmails || []).map(m => {
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
                      <button key={p} disabled={busy || targetRole === p} onClick={() => withBusy(() => onChangeMemberPermission(book.id, m, p))} style={{
                        padding:"4px 8px", border:"none", cursor: (busy || targetRole === p) ? "default" : "pointer",
                        background: targetRole === p ? th.appAccent : "transparent",
                        color: targetRole === p ? th.appOnAccent : th.appFaded,
                        fontFamily:F.ui, fontSize:9.5, fontWeight:600,
                      }}>{roleLabel(p)}</button>
                    ))}
                  </div>
                  {iCanRemove && (
                    <button disabled={busy} onClick={() => withBusy(() => onRemoveMember(book.id, m))} style={{ background:"none", border:"none", color:ui.danger, cursor: busy ? "default" : "pointer", fontSize:14, padding:0, flexShrink:0 }}>×</button>
                  )}
                </div>
              ) : (
                <span style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, flexShrink:0 }}>{roleLabel(targetRole)}</span>
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <div style={{ fontFamily:F.ui, fontSize:10.5, color:ui.danger, marginBottom:8 }}>{error}</div>
      )}
      {canManageMembers && (
        <>
          <div style={{ display:"flex", gap:6, marginBottom:6 }}>
            {myInviteOptions.map(r => (
              <button key={r} onClick={() => setInviteRole(r)} style={{
                padding:"4px 9px", borderRadius:20, border:`1.5px solid ${selectedInviteRole === r ? th.appAccent : th.appBorder}`,
                background: selectedInviteRole === r ? th.appAccent : "transparent",
                color: selectedInviteRole === r ? th.appOnAccent : th.appFaded,
                fontFamily:F.ui, fontSize:9.5, fontWeight:600, cursor:"pointer",
              }}>{roleLabel(r)}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <input
              value={memberInput}
              disabled={atMemberCap || busy}
              onChange={e => setMemberInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") doInvite(); }}
              placeholder={atMemberCap ? "limite membri raggiunto" : "email@esempio.it"}
              style={{ flex:1, padding:"8px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", minWidth:0 }}
            />
            <button disabled={atMemberCap || busy} onClick={doInvite} style={{
              background: (atMemberCap || busy) ? th.appBorder : th.appAccent, border:"none", borderRadius:9, padding:"8px 12px",
              color: atMemberCap ? th.appFaded : th.appOnAccent, fontFamily:F.ui, fontSize:12, fontWeight:700,
              cursor: (atMemberCap || busy) ? "default" : "pointer", flexShrink:0,
            }}>＋ Invita</button>
          </div>
          <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:6, fontStyle:"italic" }}>
            {atMemberCap ? `Limite di ${MAX_MEMBERS} membri raggiunto.` : "Puoi invitare solo email già abilitate da un admin in \"Gestione utenti\"."}
          </div>
        </>
      )}
    </div>
  );
}
