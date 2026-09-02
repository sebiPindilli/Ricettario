import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import AppIcon from "./AppIcon.jsx";

// COMPONENT: AllergenSuggestionModal — mostrato al salvataggio di una
// ricetta (vedi checkRecipeAllergenSuggestions in ricettario-v23.jsx) quando
// un suo ingrediente somiglia a un membro di un'allergia/intolleranza già
// definita, ma non ne fa ancora parte. Stesso ruolo/posizione nell'albero
// (overlay globale) del dialogo R6 per la lista spesa, ma per una scelta
// diversa: aggiungere subito l'ingrediente al gruppo o ignorare il
// suggerimento (recuperabile poi da "Allergie suggerite" in Organizza
// Ingredienti — vedi OrganizeIngredientsScreen.jsx).
export default function AllergenSuggestionModal({ suggestion, ingredientName, onAccept, onIgnore }) {
  const th = useTheme();
  return (
    <div style={{ position:"absolute", inset:0, zIndex:500, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", background:th.appBg, borderRadius:20, padding:"22px 20px", textAlign:"center", maxHeight:"90%", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"center", marginBottom:6 }}><AppIcon emoji="⚠️" icon="avviso" size={30} /></div>
        <div style={{ fontFamily:F.display, fontSize:19, color:th.appInk, marginBottom:6 }}>Allergia/intolleranza?</div>
        <div style={{ fontFamily:F.ui, fontSize:12.5, color:th.appFaded, lineHeight:1.5, marginBottom:18 }}>
          Questa ricetta contiene «<b style={{ color:th.appInk }}>{ingredientName}</b>». Vuoi aggiungerla all'allergia «<b style={{ color:th.appInk }}>{suggestion.groupLabel}</b>»?
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          <button onClick={onAccept} style={{
            padding:"13px", borderRadius:12, border:"none", background:th.appAccent,
            color:th.appOnAccent, fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}><AppIcon emoji="✓" icon="fatto" size={14} /> Sì, aggiungi</button>
          <button onClick={onIgnore} style={{
            padding:"13px", borderRadius:12, border:`1.5px solid ${th.appBorder}`, background:"transparent",
            color:th.appFaded, fontFamily:F.ui, fontSize:12.5, fontWeight:600, cursor:"pointer",
          }}>Ignora</button>
        </div>
      </div>
    </div>
  );
}
