import { useEffect, useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import GlobalNav from "../components/GlobalNav.jsx";
import Toast from "../components/Toast.jsx";
import AppIcon from "../components/AppIcon.jsx";
import {
  loadAllowlist, addAllowlistEntry, setAllowlistRole, removeAllowlistEntry,
  loadBetaConfig, setBetaEnabled as setBetaEnabledRemote,
  loadIconStyleConfig, setIconStyle as setIconStyleRemote,
} from "../services/authStore.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const ASSIGNABLE_ROLES = ["base", "tester"];
const DANGER = "#C4593A";
const PROD_URL = "https://ricettario-ruddy.vercel.app";

const buildInviteMessage = () => `Ciao! Ti ho aggiunto a Il mio Ricettario 🍝 — l'app dove teniamo le nostre ricette.

Apri questo link e accedi con il tuo account Google:
${PROD_URL}

📱 Per averla a portata di tocco sulla schermata home (facoltativo):
• iPhone: apri il link in Safari, tocca l'icona Condividi (il quadrato con la freccia in su), poi "Aggiungi alla schermata Home".
• Android: apri il link in Chrome, tocca i tre puntini in alto a destra, poi "Aggiungi a schermata Home" (o "Installa app" se disponibile).`;

export default function AdminUsersScreen({ onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping }) {
  const th = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("base");
  const [addError, setAddError] = useState(null);
  const [addBusy, setAddBusy] = useState(false);
  const [pendingRemove, setPendingRemove] = useState(null);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [lastAdded, setLastAdded] = useState(null);
  const [betaEnabled, setBetaEnabled] = useState(true);
  const [betaBusy, setBetaBusy] = useState(false);
  const [iconStyle, setIconStyleState] = useState("emoji");
  const [iconStyleBusy, setIconStyleBusy] = useState(false);

  useEffect(() => {
    loadAllowlist()
      .then((list) => { setUsers(list); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
    loadBetaConfig().then(({ enabled }) => setBetaEnabled(enabled));
    loadIconStyleConfig().then(({ style }) => setIconStyleState(style));
  }, []);

  const toggleBeta = async () => {
    const next = !betaEnabled;
    setBetaBusy(true);
    try {
      await setBetaEnabledRemote(next);
      setBetaEnabled(next);
      showToast(next ? "🟢 Beta riattivata" : "⚪ Beta disattivata");
    } catch {
      showToast(<><AppIcon emoji="⚠️" icon="avviso" size={13} /> Cambio stato beta non riuscito</>);
    } finally {
      setBetaBusy(false);
    }
  };

  // Vale per l'interfaccia fissa di TUTTI gli utenti (non una preferenza
  // personale) — icone scelte liberamente su ricette/sezioni/categorie
  // personalizzate non sono toccate da questo interruttore.
  const changeIconStyle = async (next) => {
    if (next === iconStyle || iconStyleBusy) return;
    setIconStyleBusy(true);
    try {
      await setIconStyleRemote(next);
      setIconStyleState(next);
      showToast(next === "svg"
        ? <><AppIcon emoji="🎨" icon="stile" size={13} /> Icone SVG attivate per tutti</>
        : <><AppIcon emoji="🎨" icon="stile" size={13} /> Emoji ripristinate per tutti</>);
    } catch {
      showToast(<><AppIcon emoji="⚠️" icon="avviso" size={13} /> Cambio stile icone non riuscito</>);
    } finally {
      setIconStyleBusy(false);
    }
  };

  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: "", visible: false }), 2000);
  };

  const handleAdd = async () => {
    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { setAddError("Email non valida."); return; }
    const existing = users.find((u) => u.email === email);
    if (existing) { setAddError(`Email già presente (ruolo: ${existing.role}).`); return; }
    setAddBusy(true);
    try {
      await addAllowlistEntry(email, newRole);
      setUsers((list) => [...list, { email, role: newRole }].sort((a, b) => a.email.localeCompare(b.email)));
      setAdding(false); setNewEmail(""); setNewRole("base"); setAddError(null);
      setLastAdded(email);
      showToast(<><AppIcon emoji="✅" icon="fatto" size={13} /> Utente aggiunto</>);
    } catch {
      setAddError("Aggiunta non riuscita. Riprova.");
    } finally {
      setAddBusy(false);
    }
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(buildInviteMessage());
      showToast(<><AppIcon emoji="✓" icon="fatto" size={13} /> Copiato negli appunti</>);
    } catch {
      showToast(<><AppIcon emoji="⚠️" icon="avviso" size={13} /> Copia non riuscita</>);
    }
  };

  const handleRoleChange = async (email, role) => {
    try {
      await setAllowlistRole(email, role);
      setUsers((list) => list.map((u) => (u.email === email ? { ...u, role } : u)));
    } catch {
      showToast(<><AppIcon emoji="⚠️" icon="avviso" size={13} /> Cambio ruolo non riuscito</>);
    }
  };

  const handleRemove = async (email) => {
    try {
      await removeAllowlistEntry(email);
      setUsers((list) => list.filter((u) => u.email !== email));
      setPendingRemove(null);
      showToast(<><AppIcon emoji="🗑️" icon="elimina" size={13} /> Utente rimosso</>);
    } catch {
      setPendingRemove(null);
      showToast(<><AppIcon emoji="⚠️" icon="avviso" size={13} /> Rimozione non riuscita</>);
    }
  };

  return (
    <div style={{ background: th.appBg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <GlobalNav
        activeScreen="adminUsers"
        onRecipes={onRecipes}
        onBook={onBook}
        onMemories={onMemories}
        onAdd={onAdd}
        onFridge={onFridge}
        onShopping={onShopping}
        onLanding={onLanding}
        activeLabel="Gestione utenti"
      />

      <div style={{ padding: "14px 20px 6px" }}>
        <div style={{ fontFamily: F.display, fontSize: 22, color: th.appInk, display: "flex", alignItems: "center", gap: 8 }}><AppIcon emoji="🔑" icon="chiave" size={20} /> Gestione utenti</div>
        <div style={{ fontFamily: F.ui, fontSize: 11, color: th.appFaded, marginTop: 3 }}>
          Whitelist — solo i ruoli base e tester sono gestibili da qui
        </div>
      </div>

      <div style={{ margin: "8px 20px 0", background: th.appCard, border: `1.5px solid ${th.appBorder}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: th.appInk }}>β Pulsante beta</div>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appFaded, marginTop: 2 }}>
            {betaEnabled ? "Attivo per admin e tester" : "Disattivato — segnalazioni esistenti restano intatte"}
          </div>
        </div>
        <button onClick={toggleBeta} disabled={betaBusy} style={{
          padding: "7px 14px", borderRadius: 20, border: "none", flexShrink: 0,
          background: betaEnabled ? th.appAccent : th.appBorder,
          color: betaEnabled ? "#fff" : th.appFaded,
          fontFamily: F.ui, fontSize: 11.5, fontWeight: 700,
          cursor: betaBusy ? "default" : "pointer", opacity: betaBusy ? 0.7 : 1,
        }}>{betaEnabled ? "Disattiva" : "Attiva"}</button>
      </div>

      <div style={{ margin: "8px 20px 0", background: th.appCard, border: `1.5px solid ${th.appBorder}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: th.appInk, display: "flex", alignItems: "center", gap: 6 }}><AppIcon emoji="🎨" icon="stile" size={13} /> Stile icone</div>
          <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appFaded, marginTop: 2 }}>
            Vale per l'interfaccia di tutti gli utenti
          </div>
        </div>
        <div style={{ display: "flex", borderRadius: 20, overflow: "hidden", border: `1.5px solid ${th.appBorder}`, flexShrink: 0 }}>
          {[["emoji", "Emoji"], ["svg", "SVG"]].map(([id, label]) => (
            <button key={id} disabled={iconStyleBusy} onClick={() => changeIconStyle(id)} style={{
              padding: "7px 14px", border: "none", cursor: iconStyleBusy ? "default" : "pointer",
              background: iconStyle === id ? th.appAccent : "transparent",
              color: iconStyle === id ? "#fff" : th.appFaded,
              fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, opacity: iconStyleBusy ? 0.7 : 1,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 18px 40px" }}>
        {loading && (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, textAlign: "center", marginTop: 20 }}>Caricamento…</div>
        )}
        {!loading && loadError && (
          <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, textAlign: "center", marginTop: 20 }}>Impossibile caricare la whitelist.</div>
        )}

        {!loading && !loadError && users.map((u) => {
          const isAdminRow = u.role === "admin";
          const confirming = pendingRemove === u.email;
          return (
            <div key={u.email} style={{ position: "relative", background: th.appCard, border: `1.5px solid ${th.appBorder}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0, fontFamily: F.body, fontSize: 13, color: th.appInk, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                <RoleBadge role={u.role} th={th} />
              </div>

              {isAdminRow ? (
                <div style={{ marginTop: 8, fontFamily: F.ui, fontSize: 10, color: th.appFaded, fontStyle: "italic", display: "flex", alignItems: "center", gap: 4 }}>
                  <AppIcon emoji="🔒" icon="privato" size={10} /> gestibile solo da Firebase Console
                </div>
              ) : (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: `1px solid ${th.appBorder}` }}>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <button key={r} disabled={u.role === r} onClick={() => handleRoleChange(u.email, r)} style={{
                        padding: "6px 12px", border: "none", cursor: u.role === r ? "default" : "pointer",
                        background: u.role === r ? th.appAccent : "transparent",
                        color: u.role === r ? "#fff" : th.appFaded,
                        fontFamily: F.ui, fontSize: 11, fontWeight: 600,
                      }}>{r}</button>
                    ))}
                  </div>
                  <button onClick={() => setPendingRemove(u.email)} style={{ marginLeft: "auto", background: "none", border: "none", color: DANGER, fontFamily: F.ui, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Rimuovi</button>
                </div>
              )}

              {confirming && (
                <div style={{ position: "absolute", inset: 0, background: `${th.appBg}f2`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 12 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appInk, textAlign: "center" }}>Confermi la rimozione di<br /><b>{u.email}</b>?</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setPendingRemove(null)} style={{ padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${th.appBorder}`, background: "transparent", color: th.appFaded, fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>Annulla</button>
                    <button onClick={() => handleRemove(u.email)} style={{ padding: "8px 14px", borderRadius: 9, border: "none", background: DANGER, color: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Conferma rimozione</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && !loadError && (
          adding ? (
            <div style={{ background: th.appCard, border: `1.5px dashed ${th.appAccent}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", marginBottom: 6 }}>Nuovo utente</div>
              <input
                value={newEmail}
                autoFocus
                onChange={(e) => { setNewEmail(e.target.value); setAddError(null); }}
                placeholder="email@esempio.it"
                style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appBg, fontFamily: F.body, fontSize: 13, color: th.appInk, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 8, marginBottom: addError ? 8 : 10 }}>
                {ASSIGNABLE_ROLES.map((r) => (
                  <button key={r} onClick={() => setNewRole(r)} style={{
                    flex: 1, padding: "8px", borderRadius: 9,
                    border: `1.5px solid ${newRole === r ? th.appAccent : th.appBorder}`,
                    background: newRole === r ? th.appAccent : "transparent",
                    color: newRole === r ? "#fff" : th.appFaded,
                    fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>{r}</button>
                ))}
              </div>
              {addError && <div style={{ fontFamily: F.ui, fontSize: 11, color: DANGER, marginBottom: 8 }}>{addError}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setAdding(false); setNewEmail(""); setNewRole("base"); setAddError(null); }} style={{ flex: 1, padding: "11px", border: `1.5px solid ${th.appBorder}`, borderRadius: 11, background: "transparent", color: th.appFaded, fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>Annulla</button>
                <button onClick={handleAdd} disabled={!newEmail.trim() || addBusy} style={{ flex: 2, padding: "11px", border: "none", borderRadius: 11, background: newEmail.trim() ? th.appAccent : th.appBorder, color: newEmail.trim() ? "#fff" : th.appFaded, fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: newEmail.trim() ? "pointer" : "default" }}>
                  {addBusy ? "Aggiunta…" : "Aggiungi utente"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setAdding(true); setLastAdded(null); }} style={{
              width: "100%", padding: "13px", borderRadius: 14,
              border: `1.5px dashed ${th.appBorder}`, background: "transparent",
              color: th.appFaded, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 10,
            }}>＋ Aggiungi utente</button>
          )
        )}

        {!loading && !loadError && lastAdded && (
          <div style={{ background: `${th.appAccent}12`, border: `1.5px solid ${th.appAccent}`, borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appInk, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <AppIcon emoji="✅" icon="fatto" size={13} /> <b>{lastAdded}</b> aggiunto. Invito pronto da inviare:
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setLastAdded(null)} style={{ flex: 1, padding: "10px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: "transparent", color: th.appFaded, fontFamily: F.ui, fontSize: 12, cursor: "pointer" }}>Chiudi</button>
              <button onClick={copyInvite} style={{ flex: 2, padding: "10px", border: "none", borderRadius: 10, background: th.appAccent, color: th.appOnAccent, fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><AppIcon emoji="📋" icon="copia" size={13} /> Copia messaggio d'invito</button>
            </div>
          </div>
        )}
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}

function RoleBadge({ role, th }) {
  const styles = {
    admin: { bg: th.appBorder, color: th.appFaded },
    tester: { bg: `${th.appAccent}22`, color: th.appAccent },
    base: { bg: th.appBorder, color: th.appInk },
  };
  const s = styles[role] || styles.base;
  return (
    <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 10, background: s.bg, color: s.color, textTransform: "uppercase", flexShrink: 0 }}>{role}</span>
  );
}
