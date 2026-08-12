import { useState, useRef, useLayoutEffect } from "react";
import { useTheme, useNavActions, useCookingTimers } from "../context.js";
import { F, MOBILE_BREAKPOINT_CSS } from "../data/constants.js";
import OrganizeIcon from "./OrganizeIcon.jsx";
import InfoButton from "./InfoButton.jsx";

const NAV_ITEMS = [
  { id:"recipes",   icon:"🍽️", label:"Ricette" },
  { id:"memories",  icon:"📒", label:"Ricordi" },
  { id:"fridge",    icon:"🧊", label:"Frigo" },
  { id:"shopping",  icon:"🛒", label:"Spesa" },
  { id:"organize",  icon:<OrganizeIcon/>, label:"Organizza" },
];

export default function GlobalNav({
  activeScreen,
  onRecipes, onBook, onMemories, onAdd, onFridge, onShopping,
  onLanding, onSearch, onFavorites,
  showSearch, showFavorites,
  activeLabel, extraAction, bookView = false, viewToggle = null,
  infoContent = null, onExport = null,
}) {
  const th = useTheme();
  const navActions = useNavActions();
  const { topStackHeight } = useCookingTimers();
  const barRef = useRef(null);
  const [spacerHeight, setSpacerHeight] = useState(0);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => setSpacerHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Su mobile reale (vedi IPHONE_RESPONSIVE_CSS in ricettario-v23.jsx, stesso
  // breakpoint) il banner passa da "sticky" a "fixed" — su alcuni browser
  // mobile, sticky annidato dentro lo scroll interno dell'IPhone shell può
  // scorrere via invece di restare fermo. Da fixed, il banner esce dal
  // flusso: il div .globalnav-spacer subito sotto (altezza misurata dal
  // banner stesso via ResizeObserver) gli lascia il posto nel contenuto
  // sotto — lo spazio per topStackHeight (banner offline e/o barra timer
  // sopra di lui) lo riserva già lo spacer universale in TopStack.jsx, qui
  // non va sommato di nuovo. topStackHeight entra comunque nel `top` (sia
  // sticky desktop sia fixed mobile, quest'ultimo tramite CSS !important)
  // così questa barra si posiziona sempre SOTTO quello stack invece di
  // esserne coperta.
  const globalNavResponsiveCss = `
    .globalnav-spacer { display:none; }
    @media ${MOBILE_BREAKPOINT_CSS} {
      .globalnav-bar { position:fixed !important; top:${topStackHeight}px !important; left:0 !important; right:0 !important; }
      .globalnav-spacer { display:block !important; }
    }
  `;

  // "recipes" e la vista libro condividono la stessa tab attiva (Ricette) e lo stesso banner.
  const inRecipes = activeScreen === "recipes" || bookView;
  // Interruttore schede/libro: nel Libro Ricette (recipes/book) o quando fornito esplicitamente (viewToggle)
  const showViewToggle = activeScreen === "recipes" || bookView || !!viewToggle;
  // Esporta ricettario: stesso ambito del pulsante vista schede/libro (sezione Libro Ricette)
  const showExport = showViewToggle && !!onExport;

  const handlers = {
    recipes: () => onRecipes(),
    book:    () => onBook(),
    memories:() => onMemories(),
    fridge:  () => onFridge && onFridge(),
    shopping:() => onShopping && onShopping(),
    organize:() => { navActions.onOrganize && navActions.onOrganize(); },
  };

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: globalNavResponsiveCss }} />
    <div ref={barRef} className="globalnav-bar" style={{ position:"sticky", top:topStackHeight, zIndex:100, boxShadow:"0 2px 16px rgba(0,0,0,0.2)" }}>
      {/* Row 1 — 4 tabs */}
      <div style={{ display:"flex", background:th.appInk, borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        {NAV_ITEMS.map(item => {
          const active = activeScreen === item.id
            || (item.id==="recipes" && inRecipes)
            || (item.id==="add" && ["addRecipe","addMemory","addRecipeHub","new","scan"].includes(activeScreen));
          return (
            <button
              key={item.id}
              onClick={handlers[item.id]}
              style={{
                flex:1, padding:"10px 4px 8px",
                background: active ? "rgba(255,255,255,0.15)" : "none",
                border:"none",
                borderBottom: active ? `2px solid ${th.appAccent2}` : "2px solid transparent",
                cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                transition:"all 0.2s",
              }}
            >
              <span style={{ fontSize:item.id==="add" ? 24 : 18, background: item.id==="add" && !active ? `${th.appAccent}55` : "none", borderRadius: item.id==="add" ? "50%" : 0, width: item.id==="add" ? 32 : "auto", height: item.id==="add" ? 32 : "auto", display:"flex", alignItems:"center", justifyContent:"center" }}>{item.icon}</span>
              <span style={{
                fontFamily:F.ui, fontSize:9, fontWeight:600,
                color: active ? th.appAccent2 : "rgba(255,255,255,0.5)",
                letterSpacing:0.5,
              }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Row 2 — utility bar */}
      <div style={{
        display:"flex", alignItems:"center",
        background:`${th.appInk}ee`,
        padding:"6px 12px", gap:8,
      }}>
        <button onClick={onLanding} style={{
          background:"rgba(255,255,255,0.1)", border:"none",
          borderRadius:8, padding:"5px 8px", cursor:"pointer",
          color:"rgba(255,255,255,0.85)", fontSize:14, flexShrink:0,
        }}>🏠</button>

        {/* Spaziatore sinistro: 🏠(≈34) + questo ≈ larghezza interruttore/export a destra, così il titolo è centrato */}
        {showViewToggle && <div style={{ width: 28 + (showExport ? 30 : 0), flexShrink:0 }}/>}

        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, minWidth:0 }}>
          <span style={{
            fontFamily:F.display, fontSize:13, fontStyle:"italic",
            color:"rgba(255,255,255,0.8)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>{activeLabel || "Il mio Ricettario"}</span>
          <InfoButton dark>
            {infoContent || (
              <div>📝 Istruzioni per «{activeLabel || "questa sezione"}» in arrivo.</div>
            )}
          </InfoButton>
        </div>

        {/* Esporta ricettario + interruttore schede/libro — posizione fissa all'estrema destra */}
        {showViewToggle ? (
          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
            {showExport && (
              <button onClick={onExport} title="Esporta ricettario" style={{
                background:"rgba(255,255,255,0.1)", border:"none",
                borderRadius:8, padding:"5px 8px", cursor:"pointer",
                color:"rgba(255,255,255,0.85)", fontSize:14, flexShrink:0,
              }}>📤</button>
            )}
            <div style={{ display:"flex", borderRadius:8, overflow:"hidden", border:"1px solid rgba(255,255,255,0.2)", flexShrink:0 }}>
              <button onClick={viewToggle ? viewToggle.onCards : onRecipes} title="Vista schede" style={{
                padding:"5px 9px", border:"none", cursor:"pointer", fontSize:13,
                background: (viewToggle ? !viewToggle.isBook : !bookView) ? th.appAccent : "rgba(255,255,255,0.08)",
                color: (viewToggle ? !viewToggle.isBook : !bookView) ? "#fff" : "rgba(255,255,255,0.7)",
              }}>▦</button>
              <button onClick={viewToggle ? viewToggle.onBook : onBook} title="Sfoglia come libro" style={{
                padding:"5px 9px", border:"none", cursor:"pointer", fontSize:13,
                background: (viewToggle ? viewToggle.isBook : bookView) ? th.appAccent : "rgba(255,255,255,0.08)",
                color: (viewToggle ? viewToggle.isBook : bookView) ? "#fff" : "rgba(255,255,255,0.7)",
              }}>📖</button>
            </div>
          </div>
        ) : (
          <div style={{ width:34, flexShrink:0 }}/> // bilancia 🏠 sugli altri schermi
        )}
      </div>
    </div>
    <div className="globalnav-spacer" style={{ height: spacerHeight }} />
    </>
  );
}
