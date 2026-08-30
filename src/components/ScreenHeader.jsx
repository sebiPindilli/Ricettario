import { useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import Icon from "./Icon.jsx";
import InfoButton from "./InfoButton.jsx";

// ══════════════════════════════════════════════════════════════
// TESTA DI SCHERMATA — la stessa in tutte le sezioni.
//
// Sostituisce la seconda riga di GlobalNav. È l'unico posto dove si
// disegna un'intestazione: se una schermata se ne fa una propria, le
// altezze non tornano più fra una sezione e l'altra (era il difetto
// segnalato dopo la prima implementazione).
//
// Contenuto FISSO, sempre nello stesso ordine e nella stessa misura:
//
//   [ ‹ indietro ]  [ icona ]  Titolo      [ i ]  [ azioni ]  [ home ]
//                              occhiello
//
// - indietro: c'è solo se onBack è passato; occupa comunque il suo posto
//   (spacer invisibile) così il titolo non balla fra una schermata e l'altra.
// - icona: SEMPRE quella della sezione (ricette, ricordi, frigo, spesa,
//   organizza) — è ciò che dice "dove sono".
// - info: slot fisso se infoContent è passato, ogni sezione ne ha una —
//   non conta fra le azioni.
// - home: sempre presente, sempre ultimo a destra.
// - azioni: al massimo tre, icone 20px, mai testo.
//
// Altezza totale: 64px + safe area. Non parametrizzabile.
//
// Nota sull'icona home: il riferimento di design usa "casa", che non
// esiste nel set SVG (public/app-icons.svg) — uso "home", già presente
// con lo stesso significato, invece di disegnarne una nuova.
// ══════════════════════════════════════════════════════════════

const HEADER_H = 64;
const ICON_SLOT = 34;   // larghezza riservata a indietro/home

export default function ScreenHeader({
  section,          // "ricette" | "ricordi" | "frigo" | "spesa" | "organizza" | …
  title,
  subtitle,         // occhiello sotto il titolo (conteggi, stato)
  onBack,           // se assente, lo slot resta vuoto ma occupato
  onHome,
  infoContent,      // contenuto guida della sezione — slot fisso, non conta fra le azioni
  actions = [],     // [{ icon, label, onClick, tone }] — max 3
}) {
  const ui = useUiStyle();
  if (ui.header === "legacy") return null;   // classico: resta GlobalNav

  const onBar = ui.header === "bar";

  return (
    <div style={{
      flexShrink: 0,
      minHeight: HEADER_H,
      display: "flex",
      alignItems: "center",
      gap: 10,
      // Verticale simmetrico: prima era 2px/14px, con alignItems:center lo
      // sbilanciamento spingeva titolo/occhiello visibilmente verso l'alto
      // dentro il blocco di 64px invece di centrarli davvero.
      padding: `8px ${ui.padX}px`,
      background: onBar ? ui.card : "transparent",
      borderBottom: `1px solid ${onBar ? ui.border : ui.hairlineStrong}`,
    }}>
      {/* Lo slot indietro occupa spazio solo quando serve davvero: tenerlo
          sempre riservato (anche vuoto) rubava ~46px al titolo su OGNI
          schermata di primo livello (la maggioranza, senza onBack) per una
          coerenza di posizione che conta solo confrontando schermate
          annidate con quelle di primo livello — un compromesso peggiore
          del titolo troncato che causava. */}
      {onBack && (
        <div style={{ width: ICON_SLOT, flexShrink: 0, display: "flex" }}>
          <button onClick={onBack} title="Indietro" style={btn(ui.ink)}>
            <Icon name="indietro" size={21} />
          </button>
        </div>
      )}

      {section && (
        <span style={{ display: "flex", color: ui.faded, flexShrink: 0 }}>
          <Icon name={section} size={20} />
        </span>
      )}

      <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
        <div style={{
          fontFamily: F.display,
          fontSize: 19,
          color: ui.ink,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>{title}</div>
        {subtitle && (
          <div style={{
            fontFamily: F.ui,
            fontSize: 10.5,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: ui.muted,
            marginTop: 3,
          }}>{subtitle}</div>
        )}
      </div>

      {/* Guida della sezione — slot fisso, non una delle azioni: ogni
          sezione ne ha una (era raggiungibile solo dalla seconda riga di
          GlobalNav, soppressa qui). */}
      {infoContent && (
        <InfoButton triggerStyle={{ width: 30, height: 30 }}>{infoContent}</InfoButton>
      )}

      {actions.slice(0, 3).map((a, i) => (
        <button key={i} onClick={a.onClick} title={a.label}
          style={btn(a.tone === "accent" ? ui.accent : ui.faded)}>
          <Icon name={a.icon} size={20} />
        </button>
      ))}

      <button onClick={onHome} title="Menù" style={btn(ui.faded)}>
        <Icon name="home" size={20} />
      </button>
    </div>
  );
}

const btn = (color) => ({
  background: "none", border: "none", padding: 4, cursor: "pointer",
  color, display: "flex", alignItems: "center", justifyContent: "center",
  minWidth: 30, minHeight: 30,
});
