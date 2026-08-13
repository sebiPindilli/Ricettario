import { useState, useEffect } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import {
  listMySharedRecipes, revokeSharedRecipe, deleteSharedRecipeFully, updateSharedRecipeAccess,
} from "../services/sharedRecipesStore.js";

const fmtDate = (ts) => {
  if (!ts?.toDate) return "";
  return ts.toDate().toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" });
};

// ══════════════════════════════════════════════════════════════
// SCREEN: MySharedLinksScreen — i propri link di condivisione ricetta:
// data, scadenza, cosa includono, visibilità, revoca. La pulizia reale dei
// link scaduti/revocati (documento + foto duplicate) avviene qui, ogni
// volta che si apre la schermata — non c'è pulizia schedulata lato server
// (nessuna Cloud Function), quindi un link scaduto che nessuno ha mai
// riaperto qui resta nel database (ma comunque illeggibile a chiunque,
// vedi firestore.rules) finché non si passa di qui una volta.
// ══════════════════════════════════════════════════════════════
export default function MySharedLinksScreen({ me, nav, onBack }) {
  const th = useTheme();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editVisibility, setEditVisibility] = useState("anyone");
  const [editEmailsText, setEditEmailsText] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const all = await listMySharedRecipes(me).catch(() => []);
      const now = Date.now();
      const active = [];
      const stale = [];
      all.forEach(s => {
        const expiresMs = s.expiresAt?.toMillis ? s.expiresAt.toMillis() : 0;
        const isExpired = expiresMs > 0 && expiresMs < now;
        (s.revoked || isExpired ? stale : active).push(s);
      });
      if (!cancelled) { setItems(active); setLoading(false); }
      // Pulizia in background: non blocca la UI, e un eventuale fallimento
      // (es. offline) non è grave — si ritenterà alla prossima visita.
      stale.forEach(s => deleteSharedRecipeFully(s.id).catch(() => {}));
    })();
    return () => { cancelled = true; };
  }, [me]);

  const doRevoke = async (id) => {
    setBusyId(id);
    try {
      await revokeSharedRecipe(id);
      setItems(prev => prev.filter(s => s.id !== id));
      deleteSharedRecipeFully(id).catch(() => {});
    } catch {
      // resta nella lista, revocabile di nuovo
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setEditVisibility(item.visibility);
    setEditEmailsText((item.allowedEmails || []).join("\n"));
  };
  const saveEdit = async (id) => {
    const allowedEmails = editVisibility === "restricted"
      ? Array.from(new Set(editEmailsText.split(/[,\n]/).map(e => e.trim().toLowerCase()).filter(Boolean)))
      : [];
    setBusyId(id);
    try {
      await updateSharedRecipeAccess(id, { visibility: editVisibility, allowedEmails });
      setItems(prev => prev.map(s => s.id === id ? { ...s, visibility: editVisibility, allowedEmails } : s));
      setEditingId(null);
    } catch {
      // l'utente può ritentare, resta in modifica
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}
      <div style={{ padding:"12px 20px 6px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
        <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>🔗 I miei link condivisi</div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"10px 18px 30px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:th.appFaded, fontFamily:F.ui, fontSize:13 }}>Caricamento…</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>
            Nessun link attivo.<br/>
            <span style={{ fontFamily:F.ui, fontSize:12 }}>Condividi una ricetta dalla sua scheda per crearne uno.</span>
          </div>
        ) : items.map(item => (
          <div key={item.id} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontFamily:F.display, fontSize:15, color:th.appInk, marginBottom:4 }}>{item.recipeTitle || "Ricetta"}</div>
            <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginBottom:8 }}>
              Condiviso il {fmtDate(item.sharedAt)} · scade il {fmtDate(item.expiresAt)}
            </div>

            {editingId === item.id ? (
              <div style={{ marginBottom:8 }}>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:F.ui, fontSize:12, color:th.appInk, marginBottom:6 }}>
                  <input type="radio" name={`vis_${item.id}`} checked={editVisibility === "anyone"} onChange={() => setEditVisibility("anyone")} />
                  Chiunque abbia il link
                </label>
                <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:F.ui, fontSize:12, color:th.appInk, marginBottom:6 }}>
                  <input type="radio" name={`vis_${item.id}`} checked={editVisibility === "restricted"} onChange={() => setEditVisibility("restricted")} />
                  Solo persone specifiche
                </label>
                {editVisibility === "restricted" && (
                  <textarea
                    value={editEmailsText}
                    onChange={e => setEditEmailsText(e.target.value)}
                    placeholder="Un'email per riga o separate da virgola"
                    style={{ width:"100%", height:56, padding:"8px 10px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.ui, fontSize:11.5, color:th.appInk, boxSizing:"border-box", resize:"none", marginBottom:8 }}
                  />
                )}
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => setEditingId(null)} disabled={busyId === item.id} style={{ flex:1, padding:"8px", borderRadius:9, border:`1.5px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:11.5, cursor:"pointer" }}>Annulla</button>
                  <button onClick={() => saveEdit(item.id)} disabled={busyId === item.id || (editVisibility === "restricted" && !editEmailsText.trim())} style={{ flex:2, padding:"8px", borderRadius:9, border:"none", background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer" }}>
                    {busyId === item.id ? "Salvataggio…" : "Salva"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontFamily:F.ui, fontSize:11.5, color:th.appFaded, marginBottom:10, lineHeight:1.6 }}>
                {item.visibility === "anyone"
                  ? "🔓 Chiunque abbia il link"
                  : `🔒 Solo: ${(item.allowedEmails || []).join(", ") || "nessuno (non apribile da nessuno)"}`}
                {(item.includedData?.ingredients || item.includedData?.photos) && (
                  <>
                    <br/>
                    {[item.includedData?.ingredients && "🧪 dati ingredienti", item.includedData?.photos && "📷 foto e ricordi"].filter(Boolean).join(" · ")}
                  </>
                )}
              </div>
            )}

            {editingId !== item.id && (
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={() => openEdit(item)} disabled={busyId === item.id} style={{ flex:1, padding:"9px", borderRadius:9, border:`1.5px solid ${th.appBorder}`, background:"transparent", color:th.appInk, fontFamily:F.ui, fontSize:11.5, fontWeight:600, cursor:"pointer" }}>✏️ Modifica destinatari</button>
                <button onClick={() => doRevoke(item.id)} disabled={busyId === item.id} style={{ flex:1, padding:"9px", borderRadius:9, border:"none", background:"#C4593A", color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer" }}>
                  {busyId === item.id ? "…" : "🚫 Revoca"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
