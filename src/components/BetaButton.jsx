import { useState, useRef, useLayoutEffect } from "react";
import html2canvas from "html2canvas";
import { useTheme, useRole } from "../context.js";
import { F, MOBILE_BREAKPOINT_CSS } from "../data/constants.js";
import { auth } from "../firebase.js";
import ReportFormOverlay from "./ReportFormOverlay.jsx";
import ReportsListOverlay from "./ReportsListOverlay.jsx";

// Cattura cosa c'è sullo schermo un attimo prima di aprire il form (non è
// uno screenshot reale — il browser non può farne uno senza il dialogo di
// sistema "condividi schermo", indisponibile su mobile — ma un ridisegno
// del DOM in immagine). useCORS tenta di includere anche le foto caricate
// da Storage; se fallisce (es. bucket senza CORS configurato, o qualunque
// altro errore) si rinuncia allo screenshot senza bloccare la segnalazione.
const captureScreenshot = async () => {
  const target = document.querySelector(".iphone-shell");
  if (!target) return null;
  try {
    const canvas = await html2canvas(target, { useCORS: true, backgroundColor: null, scale: 1 });
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return null;
  }
};

// ── Punto d'accesso alla modalità beta — visibile solo ad admin/tester ──
// Montato dentro IPhone come sibling del contenuto scrollabile: su desktop
// resta ancorato all'angolo del mockup (position:absolute), perché lì
// position:fixed uscirebbe dalla sagoma del telefono disegnato. Su mobile
// reale (stesso breakpoint di IPHONE_RESPONSIVE_CSS in ricettario-v23.jsx)
// il telefono ORA riempie il vero schermo, quindi passa a position:fixed:
// resta ancorato al viewport vero, immune a qualunque scroll (interno alla
// pagina o, più raro, esterno dell'intero shell).
const BETA_FAB_RESPONSIVE_CSS = `
  @media ${MOBILE_BREAKPOINT_CSS} {
    .beta-fab-button, .beta-fab-menu { position:fixed !important; }
  }
`;

const BTN_SIZE = 52;
const MENU_WIDTH = 230;
const MARGIN = 20;
const DRAG_THRESHOLD = 8; // px sotto cui il gesto resta un tap (apre il menu), non un trascinamento

export default function BetaButton() {
  const role = useRole();
  const th = useTheme();
  const [view, setView] = useState(null); // null | "menu" | "form-bug" | "form-improvement" | "list"
  const [screenshot, setScreenshot] = useState(null);
  const [capturing, setCapturing] = useState(false);
  // Posizione del FAB dopo un trascinamento — null = posizione di default
  // (basso a destra). Solo stato in memoria (nessuna persistenza): torna
  // sempre al default a ogni riavvio dell'app, come richiesto.
  const [pos, setPos] = useState(null); // {top, left} px, relativi a .iphone-shell
  const btnRef = useRef(null);
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, startY: 0, origTop: 0, origLeft: 0, shellRect: null });
  const [shellSize, setShellSize] = useState({ width: 0, height: 0 });
  const menuRef = useRef(null);
  const [menuHeight, setMenuHeight] = useState(0);

  // Misura .iphone-shell (il "contenitore" a cui il bottone è ancorato, sia
  // in position:absolute su desktop sia in position:fixed su mobile reale —
  // vedi il commento sopra) per calcolare i limiti di trascinamento e la
  // posizione del menu, tenendola aggiornata su resize/rotazione.
  useLayoutEffect(() => {
    const shell = btnRef.current?.closest(".iphone-shell");
    if (!shell) return;
    const update = () => setShellSize({ width: shell.clientWidth, height: shell.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(shell);
    return () => ro.disconnect();
  }, []);

  // Altezza reale del menu (misurata, non stimata): il numero di voci può
  // cambiare in futuro, una costante scritta a mano si disallineerebbe in
  // silenzio. Si rimisura ogni volta che il menu si monta (view passa a
  // "menu") — prima del paint, così non c'è flicker visibile.
  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const update = () => setMenuHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  if (role !== "admin" && role !== "tester") return null;

  const me = auth.currentUser?.email || "";
  const close = () => { setView(null); setScreenshot(null); };

  const openBugReport = async () => {
    setCapturing(true);
    setScreenshot(await captureScreenshot());
    setCapturing(false);
    setView("form-bug");
  };

  // ── Trascinamento del FAB — mouse e touch unificati via Pointer Events.
  // Sotto la soglia di movimento resta un tap normale (onClick apre/chiude
  // il menu); sopra, il click successivo viene soppresso (flag "moved" su
  // un ref, non su state, per non causare re-render ad ogni pixel di drag).
  const onPointerDown = (e) => {
    const btn = btnRef.current;
    const shell = btn?.closest(".iphone-shell");
    if (!btn || !shell) return;
    const shellRect = shell.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    dragRef.current = {
      dragging: true, moved: false,
      startX: e.clientX, startY: e.clientY,
      origTop: btnRect.top - shellRect.top, origLeft: btnRect.left - shellRect.left,
      shellRect,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.dragging) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    if (!d.moved) return;
    const top = Math.max(0, Math.min(d.origTop + dy, d.shellRect.height - BTN_SIZE));
    const left = Math.max(0, Math.min(d.origLeft + dx, d.shellRect.width - BTN_SIZE));
    setPos({ top, left });
  };
  const onPointerUp = () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    dragRef.current.dragging = false;
  };
  const onButtonClick = () => {
    if (dragRef.current.moved) { dragRef.current.moved = false; return; } // era un trascinamento, non un tap
    setView((v) => (v === "menu" ? null : "menu"));
  };

  // Posizione effettiva del bottone (default = basso a destra, stessi 20px
  // di sempre) — lo segue ovunque sia stato trascinato.
  const btnTop = pos ? pos.top : shellSize.height - MARGIN - BTN_SIZE;
  const btnLeft = pos ? pos.left : shellSize.width - MARGIN - BTN_SIZE;

  // Direzione di apertura del menu, per asse indipendente: si confronta lo
  // spazio disponibile sui due lati (non solo "c'è abbastanza spazio nella
  // direzione preferita?", ma "quale dei due lati ne ha di più?"), poi si
  // blocca (clamp) la posizione finale dentro i bordi della shell. Così,
  // anche nella fascia centrale dove né il lato preferito né il suo
  // opposto hanno spazio pieno, il menu resta comunque tutto visibile —
  // solo scostato dal bottone invece che perfettamente allineato.
  const spaceAbove = btnTop;
  const spaceBelow = shellSize.height - (btnTop + BTN_SIZE);
  const openUp = spaceAbove >= spaceBelow; // preferenza di default: verso l'alto
  const desiredTop = openUp ? btnTop - menuHeight - 8 : btnTop + BTN_SIZE + 8;
  const menuTop = Math.max(MARGIN, Math.min(desiredTop, shellSize.height - menuHeight - MARGIN));

  const spaceLeft = btnLeft;
  const spaceRight = shellSize.width - (btnLeft + BTN_SIZE);
  const openLeft = spaceLeft >= spaceRight; // preferenza di default: verso sinistra
  const desiredLeft = openLeft ? btnLeft + BTN_SIZE - MENU_WIDTH : btnLeft;
  const menuLeft = Math.max(MARGIN, Math.min(desiredLeft, shellSize.width - MENU_WIDTH - MARGIN));

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BETA_FAB_RESPONSIVE_CSS }} />
      <button
        ref={btnRef}
        className="beta-fab-button"
        onPointerDown={onPointerDown}
        onClick={onButtonClick}
        aria-label="Modalità beta"
        style={{
          position: "absolute",
          ...(pos
            ? { top: pos.top, left: pos.left, bottom: "auto", right: "auto" }
            : { bottom: MARGIN, right: MARGIN, top: "auto", left: "auto" }),
          zIndex: 150,
          width: BTN_SIZE, height: BTN_SIZE, borderRadius: "50%",
          border: "none", background: th.appAccent, color: "#fff",
          fontFamily: F.display, fontSize: 22, fontWeight: 700,
          boxShadow: "0 6px 16px rgba(0,0,0,0.3)", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          touchAction: "none",
        }}
      >β</button>

      {view === "menu" && (
        <div onClick={close} style={{ position: "absolute", inset: 0, zIndex: 160 }}>
          <div ref={menuRef} className="beta-fab-menu" onClick={(e) => e.stopPropagation()} style={{
            position: "absolute", top: menuTop, left: menuLeft,
            background: th.appBg, borderRadius: 14, minWidth: MENU_WIDTH,
            border: `1px solid ${th.appBorder}`, overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}>
            <MenuItem th={th} icon="🐛" label={capturing ? "Cattura schermata…" : "Segnala un bug"} onClick={openBugReport} disabled={capturing} />
            <MenuItem th={th} icon="💡" label="Proponi un miglioramento" onClick={() => setView("form-improvement")} disabled={capturing} />
            <MenuItem th={th} icon="📋" label="Visualizza segnalazioni" onClick={() => setView("list")} disabled={capturing} last />
          </div>
        </div>
      )}

      {(view === "form-bug" || view === "form-improvement") && (
        <ReportFormOverlay
          type={view === "form-bug" ? "bug" : "improvement"}
          me={me}
          onClose={close}
          initialScreenshot={view === "form-bug" ? screenshot : null}
        />
      )}

      {view === "list" && (
        <ReportsListOverlay role={role} me={me} onClose={close} />
      )}
    </>
  );
}

function MenuItem({ th, icon, label, onClick, last = false, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%", boxSizing: "border-box",
      padding: "14px 16px", border: "none", background: "none",
      borderBottom: last ? "none" : `1px solid ${th.appBorder}`,
      fontFamily: F.ui, fontSize: 13, color: disabled ? th.appFaded : th.appInk, textAlign: "left",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.7 : 1,
    }}>
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
