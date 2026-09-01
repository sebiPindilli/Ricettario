import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import { dishPhotoOf, hashPick } from "../utils/helpers.js";
import { alpha, ICON_PILL_ALPHA } from "../data/palettes.js";

// Le 4 chiavi di ui.sectionColor()/sectionColorFull() — vedi sotto.
const RANDOM_SECTION_IDS = ["basi", "salati", "dolci", "altro"];
import AppIcon from "./AppIcon.jsx";
import ChosenIcon from "./ChosenIcon.jsx";
import Icon from "./Icon.jsx";

export default function RecipeCardList({ recipe, onClick }) {
  const th = useTheme();
  const ui = useUiStyle();
  const photo = dishPhotoOf(recipe);

  if (ui.id === "classico") {
    return (
      <button onClick={onClick} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", textAlign:"left", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", width:"100%" }}>
        <div style={{ width:46, height:46, borderRadius:12, background:recipe.color, color:"#fff", flexShrink:0, position:"relative", overflow:"visible", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {photo ? (
            <img src={photo} alt="" style={{ width:"100%", height:"100%", borderRadius:12, objectFit:"cover" }} loading="lazy"/>
          ) : <ChosenIcon emoji={recipe.emoji} icon={recipe.icon} size={22} />}
          {photo && (
            <span style={{
              position:"absolute", bottom:-4, right:-4, width:18, height:18, borderRadius:"50%",
              background:recipe.color, color:"#fff", border:`1.5px solid ${th.appCard}`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}><ChosenIcon emoji={recipe.emoji} icon={recipe.icon} size={10} /></span>
          )}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:2 }}>
              {recipe.favorite && <span style={{ marginRight:4, display:"inline-flex", verticalAlign:"-2px" }}><AppIcon emoji="⭐" icon="preferito" size={13} /></span>}{recipe.title}
            </div>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{recipe.category} · {recipe.prepTime+recipe.cookTime} min · {recipe.servings} porzioni</div>
          <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
            {recipe.tags.slice(0,3).map(t => (
              <span key={t} style={{ padding:"2px 8px", borderRadius:10, background:th.appBorder, color:th.appFaded, fontFamily:F.ui, fontSize:10 }}>{t}</span>
            ))}
          </div>
        </div>
        <span style={{ color:th.appFaded, fontSize:18 }}>›</span>
      </button>
    );
  }

  // ── quaderno / schedario — colore decorativo, pseudo-casuale ma stabile
  // per ricetta (hashPick su recipe.id) ──
  // La lista (RecipesScreen) raggruppa già le ricette per la loro vera
  // macroSection: usarla anche qui per il colore sarebbe ridondante, quindi
  // ogni ricetta pesca uno dei 4 colori di sezione dello stile attivo in
  // base al proprio id, non alla propria sezione reale. ui.sectionColor
  // arriva comunque da colori(paletteId, temaScuro).sezioni — vedi
  // PALETTE.md. La pastiglia tenue si fa con alpha()/ICON_PILL_ALPHA, mai
  // un secondo esadecimale scritto a mano (altrimenti il contrasto tarato
  // per le etichette di sezione non vale più).
  const secColor = ui.sectionColor(hashPick(recipe.id, RANDOM_SECTION_IDS));
  const rule = ui.listRow === "rule"; // quaderno: riga su filetto, niente card
  const iconSize = ui.listIcon.size;
  const durationMin = recipe.prepTime + recipe.cookTime;

  return (
    <button onClick={onClick} style={{
      background: rule ? "transparent" : ui.card,
      border: rule ? "none" : `1px solid ${ui.border}`,
      borderBottom: rule ? `1px solid ${ui.hairline}` : `1px solid ${ui.border}`,
      borderRadius: rule ? 0 : ui.radius.card,
      padding: rule ? "15px 0" : "12px 14px",
      minHeight: ui.rowHeight,
      display:"flex", alignItems:"center", gap:12, cursor:"pointer", textAlign:"left", width:"100%",
      boxSizing:"border-box",
    }}>
      <div style={{
        width:iconSize, height:iconSize, borderRadius:ui.radius.tile, flexShrink:0,
        background: photo ? undefined : alpha(secColor, ICON_PILL_ALPHA),
        overflow:"hidden", position:"relative",
        display:"flex", alignItems:"center", justifyContent:"center",
        color: secColor,
      }}>
        {photo
          ? <img src={photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>
          : <ChosenIcon emoji={recipe.emoji} icon={recipe.icon} size={ui.listIcon.iconSize} />}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:F.display, fontSize: ui.id==="quaderno" ? 17 : 16.5, color:ui.ink,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
        }}>
          {recipe.favorite && <span style={{ marginRight:5, display:"inline-flex", verticalAlign:"-2px", color:th.appAccent2 }}><Icon name="preferito" size={13} /></span>}
          {recipe.title}
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap: ui.id==="quaderno" ? 8 : 10, marginTop:3,
          fontFamily:F.ui, fontSize: ui.id==="quaderno" ? 10.5 : 11,
          letterSpacing: ui.id==="quaderno" ? 0.8 : 0, textTransform: ui.id==="quaderno" ? "uppercase" : "none",
          color:ui.faded,
        }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:3 }}><Icon name="tempo" size={ui.id==="quaderno" ? 10 : 13} />{durationMin} min</span>
          <span style={{ display:"inline-flex", alignItems:"center", gap:3 }}><Icon name="porzioni" size={ui.id==="quaderno" ? 10 : 13} />{recipe.servings}</span>
        </div>
        {ui.id === "schedario" && recipe.tags.length > 0 && (
          <div style={{ display:"flex", gap:4, marginTop:5, flexWrap:"wrap" }}>
            {recipe.tags.slice(0,2).map(t => (
              <span key={t} style={{ padding:"2px 8px", borderRadius:ui.radius.chip, background:`${ui.border}66`, color:ui.faded, fontFamily:F.ui, fontSize:10 }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      <span style={{ color:ui.faded, fontSize:16, flexShrink:0 }}>›</span>
    </button>
  );
}
