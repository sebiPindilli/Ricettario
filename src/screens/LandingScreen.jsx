import React from "react";
import { useTheme, useRole, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import { normalizeRole, roleLabelLong } from "../utils/bookRoles.js";
import OrganizeIcon from "../components/OrganizeIcon.jsx";
import AppIcon from "../components/AppIcon.jsx";
import Icon from "../components/Icon.jsx";
import BottomNav from "../components/BottomNav.jsx";

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

export default function LandingScreen({ recipes = [], bookName = "Il mio Ricettario", activeBook = null, me = null, onBooks, onRecipes, onBook, onMemories, onAdd, onAddMemory, onFridge, onShopping, onOrganize, onTheme, onUiStyle, onCover, onGuide, onAdminUsers, onMySharedLinks }) {
  const th = useTheme();
  const ui = useUiStyle();
  const role = useRole();
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
    { emoji:"🔑", label:"Gestione utenti", desc:"Whitelist e ruoli", fn:onAdminUsers, color:"#555F6B" },
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

    return (
      <div style={{ background:ui.bg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 20px 0" }}>
          <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:3, color:ui.faded, textTransform:"uppercase" }}>Il mio</div>
          <div style={{ fontFamily:F.display, fontSize:32, color:ui.ink, fontStyle:"italic" }}>Ricettario</div>
        </div>

        <div style={{ padding:"0 20px 40px", flex:1, overflowY:"auto" }}>
          {/* Ricettario attivo — card con dorso, non una riga come le altre */}
          <button onClick={onBooks} style={{
            width:"100%", marginTop:14, display:"flex", alignItems:"center", gap:12,
            padding:"10px 12px", ...ui.cardStyle, cursor:"pointer", textAlign:"left",
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

          <LandingGroupLabel ui={ui} text="Da qui puoi"/>
          <div style={{ ...ui.cardStyle, overflow:"hidden" }}>
            <LandingRow ui={ui} th={th} icon="ricette" label="Ricette" desc="Sfoglia, modifica o cucina una ricetta" fn={onRecipes}/>
            <LandingRow ui={ui} th={th} icon="ricordi" label="Ricordi" desc="Rivedi i ricordi legati alle tue ricette" fn={onMemories}/>
            <LandingRow ui={ui} th={th} icon="frigo" label="Frigo" desc="Scegli cosa cucinare con quello che hai in casa" fn={onFridge}/>
            <LandingRow ui={ui} th={th} icon="spesa" label="Spesa" desc="Tieni pronta la lista della spesa" fn={onShopping}/>
            <LandingRow ui={ui} th={th} icon="organizza" label="Organizza" desc="Metti ordine tra ingredienti e dati dell'app" fn={onOrganize}/>
          </div>

          <LandingGroupLabel ui={ui} text="Il libro"/>
          <div style={{ ...ui.cardStyle, overflow:"hidden" }}>
            <LandingRow ui={ui} th={th} swatch label="Stile del libro" fn={onTheme}/>
            <LandingRow ui={ui} th={th} icon="schede" label="Stile dell'interfaccia" fn={onUiStyle}/>
          </div>

          <LandingGroupLabel ui={ui} text="Condivisione"/>
          <div style={{ ...ui.cardStyle, overflow:"hidden" }}>
            <LandingRow ui={ui} th={th} icon="libro" label="I miei ricettari" fn={onBooks}/>
            <LandingRow ui={ui} th={th} icon="esporta" label="Link condivisi da me" fn={onMySharedLinks}/>
          </div>

          <LandingGroupLabel ui={ui} text="Aiuto"/>
          <div style={{ ...ui.cardStyle, overflow:"hidden" }}>
            <LandingRow ui={ui} th={th} icon="info" label="Guida" fn={onGuide}/>
            {role === "admin" && <LandingRow ui={ui} th={th} icon="altro" label="Gestione utenti" fn={onAdminUsers}/>}
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
            <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>stile libro</span>
          </button>
          <button onClick={onUiStyle} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
            <span style={{ width:26, height:26, borderRadius:7, background:th.appCard, border:`1.5px solid ${th.appBorder}`, display:"flex", alignItems:"center", justifyContent:"center", color:th.appFaded, boxSizing:"border-box" }}><AppIcon emoji="🧭" icon="schede" size={15} /></span>
            <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>stile app</span>
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
