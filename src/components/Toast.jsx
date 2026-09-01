import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

// ── Toast notification ─────────────────────────────────────────
export default function Toast({ msg, visible }) {
  const th = useTheme();
  return (
    <div style={{
      position:"fixed", bottom:100, left:"50%", transform:`translateX(-50%) translateY(${visible?0:20}px)`,
      // Sempre scuro indipendente dal tema (th.darkChrome, come GlobalNav):
      // una notifica flottante deve leggersi come "chip scuro" in ogni caso.
      background:th.darkChrome.bg, color:"#fff",
      padding:"10px 20px", borderRadius:20,
      fontFamily:F.ui, fontSize:13,
      opacity: visible ? 1 : 0,
      transition:"all 0.3s",
      pointerEvents:"none",
      zIndex:999,
      whiteSpace:"nowrap",
      // display:flex invece del solo testo: showToast può ricevere un
      // frammento <AppIcon/> + testo (icona SVG, non solo emoji nuda) e
      // senza questo l'SVG (display:block) va a capo invece di stare in
      // riga con la scritta.
      display:"inline-flex", alignItems:"center", gap:6,
    }}>{msg}</div>
  );
}
