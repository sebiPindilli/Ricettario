import React, { useState } from "react";
import { useTheme, useRole, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import { normalizeRole, roleLabelLong, assignableRoles } from "../utils/bookRoles.js";
import OrganizeIcon from "../components/OrganizeIcon.jsx";
import AppIcon from "../components/AppIcon.jsx";
import Icon from "../components/Icon.jsx";
import BottomNav from "../components/BottomNav.jsx";
import AddMemberOverlay from "../components/AddMemberOverlay.jsx";
import SwitchBookOverlay from "../components/SwitchBookOverlay.jsx";

// Menù del contorno (Fase 11) — componenti a livello di modulo, non
// dichiarati dentro il render: react-hooks/static-components li rifiuta
// altrimenti (reset dello stato a ogni render). ui/th passati come prop.
const LandingGroupLabel = ({ ui, text }) => (
  <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:ui.muted, textTransform:"uppercase", margin:"18px 0 6px" }}>{text}</div>
);
const LandingRow = ({ ui, th, icon, label, desc, fn, swatch }) => (
  <button onClick={fn} style={{
    width:"100%", display:"flex", alignItems:"center", gap:12,
    padding:"11px 12px", background:"none", border:"none", borderBottom:`1px solid ${ui.hairline}`,
    cursor:"pointer", textAlign:"left",
  }}>
    {swatch ? (
      <span style={{ width:30, height:30, borderRadius:8, background:th.coverBg, border:`1px solid ${ui.border}`, flexShrink:0, boxSizing:"border-box" }}/>
    ) : (
      <span style={{ width:30, height:30, borderRadius:8, background:ui.card, border:`1px solid ${ui.border}`, color:ui.faded, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxSizing:"border-box" }}>
        <Icon name={icon} size={15}/>
      </span>
    )}
    <span style={{ flex:1, minWidth:0 }}>
      <span style={{ display:"block", fontFamily:F.body, fontSize:14, color:ui.ink, fontWeight: desc ? 600 : 400 }}>{label}</span>
      {desc && (
        <span style={{ display:"block", fontFamily:F.ui, fontSize:11, color:ui.faded, marginTop:2, lineHeight:1.4 }}>{desc}</span>
      )}
    </span>
    <span style={{ color:ui.faded, fontSize:16, flexShrink:0 }}>›</span>
  </button>
);
// Card enfatizzata per le funzioni principali nel blocco "Cosa puoi fare"
// (Quaderno/Schedario) — stessa resa delle card del ramo classico più sotto,
// duplicata apposta invece di condivisa: il ramo classico non va toccato.
const LandingItemCard = ({ th, item }) => (
  <button onClick={item.fn} style={{
    width:"100%", padding:"16px 18px",
    background:th.appCard, border:`1px solid ${th.appBorder}`,
    borderRadius:18, cursor:"pointer", textAlign:"left",
    display:"flex", alignItems:"center", gap:14,
    boxShadow:`0 2px 12px rgba(0,0,0,0.05)`,
  }}>
    <div style={{ width:48, height:48, borderRadius:13, background:item.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <AppIcon emoji={item.emoji} icon={item.icon} size={24} />
    </div>
    <div>
      <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:2 }}>{item.label}</div>
      <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{item.desc}</div>
    </div>
    <span style={{ marginLeft:"auto", color:th.appFaded, fontSize:18 }}>›</span>
  </button>
);

export default function LandingScreen({ recipes = [], bookName = "Il mio Ricettario", activeBook = null, books = [], me = null, onBooks, onSwitch, onAddMember, onRemoveMember, onChangeMemberPermission, onRecipes, onBook, onMemories, onAdd, onAddMemory, onFridge, onShopping, onOrganize, onTheme, onCover, onGuide, onAdminUsers, onMySharedLinks, onExport }) {
  const th = useTheme();
  const ui = useUiStyle();
  const role = useRole();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showSwitchBook, setShowSwitchBook] = useState(false);
  // Negli stili nuovi la Landing si riduce al menù del contorno (DECISIONI.md
  // §Navigazione e chrome): le cinque destinazioni principali non si
  // duplicano più, sono già nella barra in basso — restano solo le voci di
  // contorno (ricettario attivo/copertina/stile/guida, già nella testa
  // sopra) e quelle non coperte dalla nav in basso (Gestione utenti).
  const primaryItems = [
    { emoji:"🍽️", icon:"ricette",   label:"Libro Ricette",         desc:"Sfoglia, cerca e aggiungi",   fn:onRecipes, color:th.appAccent },
    { emoji:"📒", icon:"ricordi",   label:"Libro dei Ricordi",     desc:"Tutte le fotografie",         fn:onMemories,color:"#6B8C6E" },
    { emoji:"🧊", icon:"frigo",     label:"Svuota Frigo",          desc:"Cosa cucino con ciò che ho",  fn:onFridge,  color:"#5B7FA6" },
    { emoji:"🛒", icon:"spesa",     label:"Lista Spesa",           desc:"Gli ingredienti da comprare", fn:onShopping,color:"#8C6E4A" },
    { emoji:<OrganizeIcon/>, icon:"organizza", label:"Organizza Ingredienti", desc:"Aggregati, categorie, nutrizione", fn:onOrganize, color:"#7A5EA6" },
  ];
  const adminItems = role === "admin" ? [
    { emoji:"🔑", icon:"chiave", label:"Gestione utenti", desc:"Whitelist e ruoli", fn:onAdminUsers, color:"#555F6B" },
  ] : [];
  const mainItems = ui.navPosition === "bottom" ? adminItems : [...primaryItems, ...adminItems];

  // Negli stili nuovi la Landing diventa il "menù del contorno" in quattro
  // gruppi (IMPLEMENTATION_PLAN Fase 11, bullet 45): le cinque destinazioni
  // principali non compaiono più qui, sono nella barra in basso. Ramo
  // completamente separato da quello classico qui sotto, mai condiviso.
  if (ui.navPosition === "bottom") {
    const bookRole = activeBook
      ? (activeBook.owner === me ? "proprietario" : normalizeRole((activeBook.memberRoles || {})[me]))
      : null;
    const roleText = activeBook?.type === "condiviso" && bookRole ? roleLabelLong(bookRole) : null;
    // Azione rapida "Aggiungi persona": solo su un ricettario condiviso e
    // solo se il mio ruolo può davvero invitare/assegnare ruoli (stessa
    // regola del server, vedi bookRoles.js) — altrimenti il pulsante
    // porterebbe a un modulo membri che non posso comunque usare.
    const canInvite = activeBook?.type === "condiviso" && bookRole && assignableRoles(bookRole).length > 0;

    return (
      <div style={{ background:ui.bg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 20px 0" }}>
          <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:3, color:ui.faded, textTransform:"uppercase" }}>Il mio</div>
          <div style={{ fontFamily:F.display, fontSize:32, color:ui.ink, fontStyle:"italic" }}>Ricettario</div>
        </div>

        <div style={{ padding:"0 20px 40px", flex:1, overflowY:"auto" }}>
          {/* a) Ricettario attivo — card con dorso, nome/membri/ruolo. Il tap
              sulla card apre "I miei ricettari" (rinomina/backup/elimina/
              dorso); "Aggiungi persona" e "Cambia ricettario" aprono invece
              due popup leggeri qui sulla Landing (AddMemberOverlay.jsx/
              SwitchBookOverlay.jsx), che riusano la stessa logica membri/
              cambio libro già scritta per BooksScreen.jsx. */}
          <div style={{ marginTop:14, ...ui.cardStyle, padding:"12px" }}>
            <button onClick={onBooks} style={{
              width:"100%", display:"flex", alignItems:"center", gap:12,
              background:"none", border:"none", padding:0, cursor:"pointer", textAlign:"left",
            }}>
              <span style={{ width:44, height:58, borderRadius:4, background:th.coverBg, position:"relative", overflow:"hidden", flexShrink:0 }}>
                <span style={{ position:"absolute", left:6, top:0, bottom:0, width:1, background:th.spineColor }}/>
              </span>
              <span style={{ flex:1, minWidth:0 }}>
                <span style={{ display:"block", fontFamily:F.display, fontSize:16, color:ui.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{bookName}</span>
                <span style={{ display:"block", fontFamily:F.ui, fontSize:11, color:ui.faded, marginTop:2 }}>
                  {recipes.length} ricett{recipes.length===1?"a":"e"}{roleText ? ` · ${roleText}` : ""}
                </span>
              </span>
              <span style={{ color:ui.faded, fontSize:16 }}>›</span>
            </button>
            <div style={{ display:"flex", gap:8, marginTop:10, paddingTop:10, borderTop:`1px solid ${ui.hairline}` }}>
              {canInvite && (
                <button onClick={() => setShowAddMember(true)} style={{
                  flex:1, padding:"8px 10px", borderRadius:ui.radius.control, border:"none",
                  background:th.appPillBg, color:th.appAccent,
                  fontFamily:F.ui, fontSize:11.5, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5,
                }}><AppIcon emoji="➕" icon="persona" size={12} /> Aggiungi persona</button>
              )}
              <button onClick={() => setShowSwitchBook(true)} style={{
                flex:1, padding:"8px 10px", borderRadius:ui.radius.control,
                border:`1px solid ${ui.border}`, background:"transparent", color:ui.faded,
                fontFamily:F.ui, fontSize:11.5, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5,
              }}><AppIcon emoji="🔀" icon="ricettari" size={12} /> Cambia ricettario</button>
            </div>
          </div>

          {/* b) Cosa puoi fare — le 5 funzioni principali, presentate come le
              card del ramo classico (icona 48px, titolo, descrizione): sono
              già raggiungibili dalla nav in basso, qui sono presentazione. */}
          <LandingGroupLabel ui={ui} text="Cosa puoi fare"/>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {primaryItems.map(item => <LandingItemCard key={item.label} th={th} item={item}/>)}
          </div>

          {/* c) Condivisione */}
          <LandingGroupLabel ui={ui} text="Condivisione"/>
          <div style={{ ...ui.cardStyle, overflow:"hidden" }}>
            <LandingRow ui={ui} th={th} icon="libro" label="I miei ricettari" fn={onBooks}/>
            <LandingRow ui={ui} th={th} icon="link" label="Link condivisi da me" fn={onMySharedLinks}/>
            {onExport && <LandingRow ui={ui} th={th} icon="esporta" label="Esporta ricettario" fn={onExport}/>}
          </div>

          {/* d) Altro */}
          <LandingGroupLabel ui={ui} text="Altro"/>
          <div style={{ ...ui.cardStyle, overflow:"hidden" }}>
            <LandingRow ui={ui} th={th} swatch label="Aspetto dell'app" desc="Colore, tema e stile" fn={onTheme}/>
            <LandingRow ui={ui} th={th} icon="info" label="Guida" fn={onGuide}/>
            {role === "admin" && <LandingRow ui={ui} th={th} icon="chiave" label="Gestione utenti" fn={onAdminUsers}/>}
          </div>
        </div>

        {/* Landing non è una delle 5 destinazioni, ma senza questa barra qui
            non c'era alcun modo di raggiungerle: il menù del contorno non
            collega più a Ricette/Ricordi/Frigo/Spesa/Organizza (erano nella
            vecchia Landing, ora solo nella nav in basso) — un vicolo cieco
            di navigazione. Nessuna voce risulta "attiva" qui. */}
        <BottomNav
          onRecipes={onRecipes}
          onMemories={onMemories}
          onFridge={onFridge}
          onShopping={onShopping}
        />

        {showAddMember && (
          <AddMemberOverlay
            book={activeBook}
            me={me}
            onAddMember={onAddMember}
            onRemoveMember={onRemoveMember}
            onChangeMemberPermission={onChangeMemberPermission}
            onClose={() => setShowAddMember(false)}
          />
        )}
        {showSwitchBook && (
          <SwitchBookOverlay
            books={books}
            activeBookId={activeBook?.id}
            onSwitch={onSwitch}
            onClose={() => setShowSwitchBook(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>

      {/* Top row: copertina · info · stile — icone uniformi */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"8px 20px 0" }}>
        <button onClick={onCover} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
          <span style={{ width:26, height:26, borderRadius:7, background:th.appCard, border:`1.5px solid ${th.appBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, boxSizing:"border-box" }}>📕</span>
          <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>copertina</span>
        </button>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onGuide} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
            <span style={{ width:26, height:26, borderRadius:7, background:th.appCard, border:`1.5px solid ${th.appBorder}`, display:"flex", alignItems:"center", justifyContent:"center", color:th.appFaded, boxSizing:"border-box" }}><AppIcon emoji="ℹ️" icon="info" size={15} /></span>
            <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>info</span>
          </button>
          <button onClick={onTheme} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
            <span style={{ width:26, height:26, borderRadius:7, background:th.coverBg, border:`1.5px solid ${th.appBorder}`, display:"block", boxSizing:"border-box" }}/>
            <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>aspetto</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign:"center", padding:"20px 24px 8px" }}>
        <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:3, color:th.appFaded, textTransform:"uppercase" }}>Il mio</div>
        <div style={{ fontFamily:F.display, fontSize:36, color:th.appInk, fontStyle:"italic" }}>Ricettario</div>
        {/* Selettore ricettario attivo */}
        <div style={{ marginTop:8 }}>
          <button onClick={onBooks} style={{
            background:th.appCard, border:`1.5px solid ${th.appBorder}`,
            borderRadius:20, padding:"7px 14px", cursor:"pointer",
            fontFamily:F.ui, fontSize:11, color:th.appInk,
            display:"inline-flex", alignItems:"center", gap:6,
            maxWidth:"88%",
          }}>
            📚 <span style={{ color:th.appFaded }}>Ricettario attivo:</span>
            <span style={{ fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{bookName}</span>
            <span style={{ color:th.appFaded }}>▾</span>
          </button>
        </div>
        {/* Sottotitolo: apri in modalità libro */}
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"10px 0" }}>
          <div style={{ flex:1, height:1, background:th.appBorder }}/>
          <span style={{ color:th.appAccent2, fontSize:12 }}>✦</span>
          <div style={{ flex:1, height:1, background:th.appBorder }}/>
        </div>
      </div>

      {/* Main navigation cards */}
      <div style={{ padding:"0 24px", display:"flex", flexDirection:"column", gap:12, flex:1 }}>
        {mainItems.map(item => (
          <button key={item.label} onClick={item.fn} style={{
            width:"100%", padding:"16px 18px",
            background:th.appCard, border:`1px solid ${th.appBorder}`,
            borderRadius:18, cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", gap:14,
            boxShadow:`0 2px 12px rgba(0,0,0,0.05)`,
          }}>
            <div style={{ width:48, height:48, borderRadius:13, background:item.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <AppIcon emoji={item.emoji} icon={item.icon} size={24} />
            </div>
            <div>
              <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:2 }}>{item.label}</div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{item.desc}</div>
            </div>
            <span style={{ marginLeft:"auto", color:th.appFaded, fontSize:18 }}>›</span>
          </button>
        ))}

      </div>

      <div style={{ height:32 }}/>
    </div>
  );
}
