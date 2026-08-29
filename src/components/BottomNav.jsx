import { useLayoutEffect, useRef, useState } from "react";
import { useTheme, useUiStyle, useNavActions, useCookingTimers } from "../context.js";
import { F, MOBILE_BREAKPOINT_CSS } from "../data/constants.js";
import { navPadBottom } from "../data/uiStyles.js";
import { remainingMs, isExpired, formatRemaining, formatOverdue } from "../utils/timers.js";
import Icon from "./Icon.jsx";
import TimersPopup from "./TimersPopup.jsx";

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
  const { timers, now, cookingModeActive } = useCookingTimers();
  const [timerPopupOpen, setTimerPopupOpen] = useState(false);
  const barRef = useRef(null);
  const [height, setHeight] = useState(0);

  // Fase 7 (DECISIONI.md §Timer): su ui.timer==="strip" il FAB/la barra in
  // cima (CookingTimerBar, TopStack.jsx) spariscono — l'indicatore vive qui,
  // appena sopra la barra di navigazione. Nulla dentro la Modalità Cucina
  // (ha già la propria striscia, vedi CookingMode.jsx).
  const showTimerStrip = ui.timer === "strip" && timers.length > 0 && !cookingModeActive;
  const anyExpired = timers.some(t => isExpired(t, now));
  // Con zero timer non c'è nulla da ordinare: calcolarlo comunque (anche se
  // showTimerStrip=false non lo mostra) faceva leggere .endAt di un elemento
  // undefined da un array vuoto ordinato — crash ad ogni schermata senza
  // timer attivi, il caso normale. timers.length<=1 copre sia 0 sia 1.
  const timerStripText = timers.length <= 1
    ? null // nome passo a sinistra / conto a destra, resi separatamente
    : `${timers.length} timer · ${(() => {
        // timer più vicino alla scadenza — la cifra unica quando sono più di uno
        const soonest = [...timers].sort((a, b) => remainingMs(a, now) - remainingMs(b, now))[0];
        const rem = remainingMs(soonest, now);
        return isExpired(soonest, now) ? formatOverdue(-rem) : formatRemaining(rem);
      })()}`;

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
      <div ref={barRef} className="bottomnav-bar" style={{ zIndex: 100 }}>
        {showTimerStrip && (
          <button
            onClick={() => setTimerPopupOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              height: 36, padding: "0 14px", border: "none", cursor: "pointer",
              background: anyExpired ? "#C0524A" : ui.ink, color: "#F6F1E6",
              fontFamily: F.ui, fontSize: 11, fontWeight: 600, textAlign: "left",
            }}
          >
            <Icon name="timer" size={15} />
            {timers.length === 1 ? (
              <>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{timers[0].label}</span>
                <span style={{ flexShrink: 0, fontFamily: F.mono, fontSize: 14 }}>
                  {isExpired(timers[0], now) ? formatOverdue(-remainingMs(timers[0], now)) : formatRemaining(remainingMs(timers[0], now))}
                </span>
              </>
            ) : (
              <span style={{ flex: 1, fontFamily: F.mono, fontSize: 14 }}>«{timerStripText}»</span>
            )}
          </button>
        )}
        {timerPopupOpen && <TimersPopup onClose={() => setTimerPopupOpen(false)} />}
        <div
          style={{
            background: bg,
            borderTop: dark ? "none" : `1px solid ${ui.hairlineStrong}`,
            display: "flex",
            alignItems: "flex-end",
            // top/orizzontale da ui.navPad, il fondo è SEMPRE navPadBottom
            // (10px + safe area) — solo punto di verità, mai un valore fisso
            // duplicato qui (vedi Rischi noti in IMPLEMENTATION_PLAN.md).
            padding: `${ui.navPad.split(" ").slice(0, 2).join(" ")} ${navPadBottom}`,
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
      </div>
      <div className="bottomnav-spacer" style={{ display: "none", height }} />
    </>
  );
}
