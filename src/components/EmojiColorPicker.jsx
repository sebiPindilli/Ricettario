import { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F, EMOJI_CATEGORIES, COLOR_OPTIONS } from "../data/constants.js";
import { FOOD_ICON_GROUPS, FOOD_ICON_NAMES } from "../data/foodIcons.js";
import ScanLabel from "./ScanLabel.jsx";
import ChosenIcon from "./ChosenIcon.jsx";
import Icon from "./Icon.jsx";
import FoodIconGrid from "./FoodIconGrid.jsx";
import FiltersSheet from "./FiltersSheet.jsx";

// Nomi SVG suggeriti dal titolo della ricetta: ogni nome icona è una parola
// italiana (vedi data/foodIcons.js), quindi un confronto per parole/
// sottostringa sul titolo basta — nessuna libreria di fuzzy-match.
const suggestIconsFromTitle = (title, max = 6) => {
  if (!title) return [];
  const words = title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z]+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored = FOOD_ICON_NAMES.map(name => {
    const nameWords = name.split("-");
    let score = 0;
    words.forEach(w => nameWords.forEach(nw => {
      if (w === nw) score += 3;
      else if (w.length > 3 && (w.includes(nw) || nw.includes(w))) score += 1;
    }));
    return { name, score };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  return scored.slice(0, max).map(s => s.name);
};

// icon/onIcon: icona SVG scelta in alternativa all'emoji (vedi
// data/foodIcons.js) — icon ha sempre la precedenza su emoji quando
// presente (vedi ChosenIcon.jsx), ma emoji resta comunque salvata: se poi
// si sceglie di nuovo un'emoji, onIcon(undefined) la cancella e si torna a
// quella. Nessuna delle due scelte segue l'interruttore globale
// dell'admin (quello riguarda solo le icone fisse dell'interfaccia).
export default function EmojiColorPicker({ emoji, color, icon, onEmoji, onColor, onIcon, title = "" }) {
  const ui = useUiStyle();
  if (ui.id !== "classico") {
    return <EmojiColorPickerNew emoji={emoji} icon={icon} onEmoji={onEmoji} onIcon={onIcon} title={title} />;
  }
  return <EmojiColorPickerClassic emoji={emoji} color={color} icon={icon} onEmoji={onEmoji} onColor={onColor} onIcon={onIcon} />;
}

function EmojiColorPickerClassic({ emoji, color, icon, onEmoji, onColor, onIcon }) {
  const [mode, setMode] = useState(icon ? "svg" : "emoji"); // "emoji" | "svg"
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].label);
  const currentEmojis = EMOJI_CATEGORIES.find(c => c.label === activeCategory)?.emojis || [];

  return (
    <div style={{
      background:"#F7F2E8", border:`1px solid #EDE6D4`,
      borderRadius:14, padding:"12px 14px",
    }}>
      <ScanLabel text="Scegli icona e colore per la lista"/>

      {/* Preview + color row */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        {/* Live mini-card preview */}
        <div style={{
          width:46, height:46, borderRadius:10,
          background:color, flexShrink:0, color:"#fff",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 3px 10px ${color}55`,
          transition:"all 0.2s",
        }}><ChosenIcon emoji={emoji} icon={icon} size={24} /></div>
        {/* Color dots */}
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", flex:1 }}>
          {COLOR_OPTIONS.map(c => (
            <button key={c} onClick={() => onColor(c)} style={{
              width:22, height:22, borderRadius:"50%",
              background:c,
              border: color===c ? `2.5px solid ${"#2C2416"}` : "2.5px solid transparent",
              outline: color===c ? "2px solid #fff" : "none", outlineOffset:1,
              cursor:"pointer", padding:0, transition:"transform 0.1s",
            }}/>
          ))}
        </div>
      </div>

      {/* Primo livello: Emoji o SVG */}
      <div style={{ display:"flex", borderRadius:20, overflow:"hidden", border:"1.5px solid #EDE6D4", marginBottom:10, width:"fit-content" }}>
        {[["emoji","Emoji"],["svg","SVG"]].map(([id,label]) => (
          <button key={id} onClick={() => setMode(id)} style={{
            padding:"6px 16px", border:"none", cursor:"pointer",
            background: mode===id ? "#2C2416" : "transparent",
            color: mode===id ? "#fff" : "#7A6E5F",
            fontFamily:F.ui, fontSize:11, fontWeight:700,
          }}>{label}</button>
        ))}
      </div>

      {mode === "emoji" ? (
        <>
          {/* Category tabs */}
          <div style={{ display:"flex", gap:4, overflowX:"auto", marginBottom:8, scrollbarWidth:"none", paddingBottom:2 }}>
            {EMOJI_CATEGORIES.map(cat => (
              <button key={cat.label} onClick={() => setActiveCategory(cat.label)} style={{
                flexShrink:0, padding:"4px 10px", borderRadius:20, border:"none",
                background: activeCategory===cat.label ? "#2C2416" : "transparent",
                color: activeCategory===cat.label ? "#fff" : "#7A6E5F",
                fontFamily:F.ui, fontSize:10, fontWeight:600,
                cursor:"pointer", whiteSpace:"nowrap",
              }}>{cat.label}</button>
            ))}
          </div>

          {/* Emoji grid for active category */}
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {currentEmojis.map(e => (
              <button key={e} onClick={() => { onEmoji(e); onIcon && onIcon(undefined); }} style={{
                width:36, height:36, borderRadius:8,
                background: !icon && emoji===e ? color+"22" : "transparent",
                border:`1.5px solid ${!icon && emoji===e ? color : "transparent"}`,
                cursor:"pointer", fontSize:20,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.15s",
              }}>{e}</button>
            ))}
          </div>
        </>
      ) : (
        <FoodIconGrid value={icon} onSelect={n => onIcon && onIcon(n)} accent={color} />
      )}
    </div>
  );
}

// ── quaderno/schedario — foglio dal basso, tre livelli: ricerca → sei
// suggeriti dal nome della ricetta → famiglie richiudibili (la prima
// aperta, anche senza un suggerimento sensato). Niente scelta del colore:
// lo dà la sezione (vedi DECISIONI.md §Icona della ricetta).
function EmojiColorPickerNew({ emoji, icon, onEmoji, onIcon, title }) {
  const th = useTheme();
  const ui = useUiStyle();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(icon ? "svg" : "emoji");
  const [query, setQuery] = useState("");
  const [openFamily, setOpenFamily] = useState(0); // indice della famiglia aperta

  const suggested = mode === "svg" ? suggestIconsFromTitle(title) : [];
  const q = query.trim().toLowerCase();

  const chooseSvg = (name) => { onIcon && onIcon(name); };
  const chooseEmoji = (e) => { onEmoji(e); onIcon && onIcon(undefined); };

  return (
    <div>
      <button onClick={() => setOpen(true)} style={{
        display:"flex", alignItems:"center", gap:12, width:"100%",
        padding:"10px 12px", background:ui.card, border:`1px solid ${ui.border}`,
        borderRadius:ui.radius.control, cursor:"pointer", textAlign:"left",
      }}>
        <div style={{
          width:40, height:40, borderRadius:ui.radius.tile, flexShrink:0,
          background:`${th.appAccent}18`, color:th.appAccent,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}><ChosenIcon emoji={emoji} icon={icon} size={20} /></div>
        <span style={{ flex:1, fontFamily:F.ui, fontSize:12.5, color:ui.ink, fontWeight:600 }}>Icona della ricetta</span>
        <span style={{ fontFamily:F.ui, fontSize:11, color:ui.faded, textDecoration:"underline" }}>Cambia</span>
      </button>

      <FiltersSheet open={open} onClose={() => setOpen(false)} title="Icona della ricetta">
        <div style={{ display:"flex", borderRadius:ui.radius.chip, overflow:"hidden", border:`1px solid ${ui.border}`, marginBottom:12, width:"fit-content" }}>
          {[["emoji","Emoji"],["svg","SVG"]].map(([id,label]) => (
            <button key={id} onClick={() => setMode(id)} style={{
              padding:"6px 16px", border:"none", cursor:"pointer",
              background: mode===id ? th.appInk : "transparent",
              color: mode===id ? "#fff" : ui.faded,
              fontFamily:F.ui, fontSize:11, fontWeight:700,
            }}>{label}</button>
          ))}
        </div>

        {/* Ricerca testuale — solo SVG: le emoji non hanno un nome testuale da filtrare */}
        {mode === "svg" && (
          <div style={{ display:"flex", gap:8, alignItems:"center", background:ui.card, border:`1.5px solid ${query ? th.appAccent : ui.border}`, borderRadius:ui.radius.control, padding:"9px 14px", marginBottom:12 }}>
            <Icon name="cerca" size={15} style={{ color:ui.faded, flexShrink:0 }}/>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cerca un'icona…"
              style={{ flex:1, background:"none", border:"none", fontFamily:F.body, fontSize:14, color:ui.ink, outline:"none" }}
            />
          </div>
        )}

        {mode === "svg" ? (
          <>
            {/* Sei suggeriti dal nome della ricetta */}
            {!q && suggested.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:F.ui, fontSize:9.5, letterSpacing:1, color:ui.faded, textTransform:"uppercase", marginBottom:6 }}>Suggeriti</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6 }}>
                  {suggested.map(name => (
                    <button key={name} onClick={() => chooseSvg(name)} title={name} style={{
                      aspectRatio:"1", borderRadius:ui.radius.control-1, cursor:"pointer",
                      border:`1.5px solid ${icon===name ? th.appAccent : ui.border}`,
                      background: icon===name ? `${th.appAccent}18` : ui.card,
                      color: icon===name ? th.appAccent : ui.ink,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}><Icon name={name} size={19} /></button>
                  ))}
                </div>
              </div>
            )}

            {/* Famiglie richiudibili, filtrate dalla ricerca */}
            {FOOD_ICON_GROUPS.map((group, gi) => {
              const icons = q ? group.icons.filter(n => n.includes(q)) : group.icons;
              if (q && icons.length === 0) return null;
              const isOpenFamily = q ? true : openFamily === gi;
              return (
                <div key={group.label} style={{ marginBottom:8 }}>
                  <button onClick={() => setOpenFamily(o => o === gi ? -1 : gi)} style={{
                    width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"7px 2px", background:"none", border:"none", cursor:"pointer",
                    borderBottom:`1px solid ${ui.hairline}`,
                  }}>
                    <span style={{ fontFamily:F.ui, fontSize:12, color:ui.ink, fontWeight:600 }}>{group.label}</span>
                    <span style={{ color:ui.faded, fontSize:11 }}>{isOpenFamily ? "▾" : "▸"}</span>
                  </button>
                  {isOpenFamily && (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6, marginTop:8 }}>
                      {icons.map(name => (
                        <button key={name} onClick={() => chooseSvg(name)} title={name} style={{
                          aspectRatio:"1", borderRadius:ui.radius.control-1, cursor:"pointer",
                          border:`1.5px solid ${icon===name ? th.appAccent : ui.border}`,
                          background: icon===name ? `${th.appAccent}18` : ui.card,
                          color: icon===name ? th.appAccent : ui.ink,
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}><Icon name={name} size={19} /></button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          EMOJI_CATEGORIES.map((cat, ci) => {
            const isOpenFamily = openFamily === ci;
            return (
              <div key={cat.label} style={{ marginBottom:8 }}>
                <button onClick={() => setOpenFamily(o => o === ci ? -1 : ci)} style={{
                  width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"7px 2px", background:"none", border:"none", cursor:"pointer",
                  borderBottom:`1px solid ${ui.hairline}`,
                }}>
                  <span style={{ fontFamily:F.ui, fontSize:12, color:ui.ink, fontWeight:600 }}>{cat.label}</span>
                  <span style={{ color:ui.faded, fontSize:11 }}>{isOpenFamily ? "▾" : "▸"}</span>
                </button>
                {isOpenFamily && (
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>
                    {cat.emojis.map(e => (
                      <button key={e} onClick={() => chooseEmoji(e)} style={{
                        width:36, height:36, borderRadius:8,
                        background: !icon && emoji===e ? `${th.appAccent}18` : "transparent",
                        border:`1.5px solid ${!icon && emoji===e ? th.appAccent : "transparent"}`,
                        cursor:"pointer", fontSize:20,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>{e}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </FiltersSheet>
    </div>
  );
}
