import { useLayoutEffect, useRef, useState } from "react";
import { useTheme, useUiStyle, useNavActions } from "../context.js";
import { F, MOBILE_BREAKPOINT_CSS } from "../data/constants.js";
import Icon from "./Icon.jsx";

// ══════════════════════════════════════════════════════════════
// BARRA DI NAVIGAZIONE IN BASSO — stili "quaderno" e "schedario".
//
// Sostituisce la barra scura a due righe di GlobalNav: le stesse cinque
// destinazioni, a portata di pollice, e la testa della schermata torna
// disponibile per titolo e contenuto (vedi ScreenHeader.jsx).
//
// Come GlobalNav, su mobile reale passa a `fixed` (stesso breakpoint, stesso
// motivo: sticky annidato dentro lo scroll dell'IPhone shell può scorrere
// via). Lo spazio nel flusso lo riserva lo spacer misurato qui sotto, così
// nessun contenuto finisce coperto — e i CTA fissi delle schermate
// (ShoppingListScreen, EmptyFridgeScreen) vanno sollevati della stessa
// altezza: la ricevono da onHeightChange.
// ══════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: "recipes",  icon: "ricette",   label: "Ricette" },
  { id: "memories", icon: "ricordi",   label: "Ricordi" },
  { id: "fridge",   icon: "frigo",     label: "Frigo" },
  { id: "shopping", icon: "spesa",     label: "Spesa" },
  { id: "organize", icon: "organizza", label: "Organizza" },
];

export default function BottomNav({
  activeScreen,
  onRecipes, onMemories, onFridge, onShopping,
  bookView = false,
  onHeightChange,
}) {
  const th = useTheme();
  const ui = useUiStyle();
  const navActions = useNavActions();
  const barRef = useRef(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const update = () => {
      const h = el.offsetHeight;
      setHeight(h);
      onHeightChange && onHeightChange(h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onHeightChange]);

  const dark = ui.navTone === "dark";
  const bg = dark ? th.appInk : ui.bg;
  const activeColor = dark ? th.appAccent2 : th.appInk;
  const idleColor = dark ? "rgba(255,255,255,0.5)" : ui.muted;

  const handlers = {
    recipes: onRecipes,
    memories: onMemories,
    fridge: onFridge,
    shopping: onShopping,
    organize: () => navActions.onOrganize && navActions.onOrganize(),
  };

  const responsiveCss = `
    .bottomnav-bar { position:sticky; bottom:0; }
    @media ${MOBILE_BREAKPOINT_CSS} {
      .bottomnav-bar { position:fixed !important; bottom:0 !important; left:0 !important; right:0 !important; }
      .bottomnav-spacer { display:block !important; }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
      <div
        ref={barRef}
        className="bottomnav-bar"
        style={{
          zIndex: 100,
          background: bg,
          borderTop: dark ? "none" : `1px solid ${ui.hairlineStrong}`,
          display: "flex",
          alignItems: "flex-end",
          // 24px extra in fondo per la home bar iOS (safe area)
          padding: dark ? "10px 6px 24px" : "10px 8px 26px",
        }}
      >
        {NAV_ITEMS.map(item => {
          const active =
            activeScreen === item.id ||
            (item.id === "recipes" && (activeScreen === "recipes" || bookView));
          return (
            <button
              key={item.id}
              onClick={handlers[item.id]}
              title={item.label}
              style={{
                flex: 1,
                minHeight: 44,
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: dark ? 5 : 6,
                color: active ? activeColor : idleColor,
                padding: "2px 0",
              }}
            >
              <Icon name={item.icon} size={dark ? 22 : 23} />
              <span
                style={{
                  fontFamily: F.ui,
                  fontSize: 9,
                  letterSpacing: dark ? 0.5 : 0.8,
                  textTransform: dark ? "none" : "uppercase",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="bottomnav-spacer" style={{ display: "none", height }} />
    </>
  );
}
