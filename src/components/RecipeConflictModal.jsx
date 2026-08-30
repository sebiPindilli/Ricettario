import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import AppIcon from "./AppIcon.jsx";
import { flattenIngredients, ingredientToText, relativeTimeLabel } from "../utils/helpers.js";

// Estrae il testo di ogni passaggio, piatto o a sottosezioni — solo testo,
// nessuna foto: qui serve capire "cosa cambia", non riprodurre la ricetta.
const flattenStepTexts = (steps) => {
  if (!Array.isArray(steps)) return [];
  if (steps.length > 0 && typeof steps[0] === "object" && "section" in steps[0]) {
    return steps.flatMap(s => (s.items || []).map(st => typeof st === "string" ? st : st.text));
  }
  return steps.map(st => typeof st === "string" ? st : st.text);
};

// Campi semplici da confrontare — etichetta leggibile + come estrarne il
// testo da mostrare. Volutamente non tutti i campi della ricetta (es. id,
// dishPhoto in base64 non avrebbe senso mostrarlo come testo): solo quelli
// che un cambiamento renderebbe leggibile e utile da confrontare.
const SIMPLE_FIELDS = [
  { key: "title", label: "Titolo" },
  { key: "source", label: "Fonte" },
  { key: "category", label: "Categoria" },
  { key: "note", label: "Nota" },
  { key: "prepTime", label: "Tempo di preparazione", fmt: (v) => `${v} min` },
  { key: "cookTime", label: "Tempo di cottura", fmt: (v) => `${v} min` },
  { key: "servings", label: "Porzioni" },
  { key: "favorite", label: "Preferita", fmt: (v) => v ? "sì" : "no" },
];

// Costruisce l'elenco dei campi davvero diversi tra le due versioni —
// usato per "Confronta": prima dice COSA è cambiato, poi mostra il
// contenuto completo solo di quei campi (mai un editor di merge, solo
// visibilità per copiare a mano ciò che serve).
const describeRecipeDiff = (local, server) => {
  const diffs = [];
  SIMPLE_FIELDS.forEach(({ key, label, fmt }) => {
    const a = local?.[key], b = server?.[key];
    if (a === b) return;
    const f = fmt || ((v) => (v == null || v === "" ? "—" : String(v)));
    diffs.push({ key, label, mine: f(a), theirs: f(b) });
  });
  const myIng = flattenIngredients(local?.ingredients).map(ingredientToText);
  const theirIng = flattenIngredients(server?.ingredients).map(ingredientToText);
  if (JSON.stringify(myIng) !== JSON.stringify(theirIng)) {
    diffs.push({ key: "ingredients", label: "Ingredienti", mineList: myIng, theirsList: theirIng });
  }
  const mySteps = flattenStepTexts(local?.steps);
  const theirSteps = flattenStepTexts(server?.steps);
  if (JSON.stringify(mySteps) !== JSON.stringify(theirSteps)) {
    diffs.push({ key: "steps", label: "Passaggi", mineList: mySteps, theirsList: theirSteps });
  }
  if ((local?.dishPhoto || null) !== (server?.dishPhoto || null)) {
    diffs.push({ key: "dishPhoto", label: "Foto piatto", mine: "la tua foto", theirs: "un'altra foto" });
  }
  return diffs;
};

// COMPONENT: RecipeConflictModal — mostrato quando un salvataggio (o
// un'eliminazione) di ricetta trova sul server una versione diversa da
// quella da cui l'utente era partito (vedi flushRecipesNow in
// ricettario-v23.jsx). Tre scelte esplicite, mai una sovrascrittura o uno
// scarto in silenzio. Chiudere senza scegliere (onClose) non perde nulla:
// le modifiche restano nello stato locale, il conflitto si ripresenta al
// prossimo salvataggio.
export default function RecipeConflictModal({ conflict, onKeepMine, onDiscardMine, onClose }) {
  const th = useTheme();
  const [comparing, setComparing] = useState(false);
  const { recipeTitle, localValue, serverValue, intent } = conflict;

  const editedByLabel = serverValue?.lastEditedBy
    ? `${serverValue.lastEditedBy.split("@")[0]}${serverValue.lastEditedAt ? `, ${relativeTimeLabel(serverValue.lastEditedAt)}` : ""}`
    : null;

  const diffs = describeRecipeDiff(localValue, serverValue);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      <div style={{ width: "100%", maxHeight: "88%", background: th.appBg, borderRadius: 20, padding: "20px 18px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ fontSize: 26, textAlign: "center", marginBottom: 6 }}>⚠️</div>
        <div style={{ fontFamily: F.display, fontSize: 17, color: th.appInk, textAlign: "center", marginBottom: 4 }}>
          {intent === "delete" ? "Conflitto durante l'eliminazione" : "Conflitto di modifica"}
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, textAlign: "center", marginBottom: 4 }}>
          "{recipeTitle}"
        </div>
        <div style={{ fontFamily: F.ui, fontSize: 11.5, color: th.appFaded, textAlign: "center", marginBottom: 14 }}>
          {editedByLabel ? `Modificata da ${editedByLabel}` : "Modificata da qualcun altro nel frattempo"}
          {intent === "delete" ? " — non è stata eliminata." : " — le tue modifiche non sono state salvate."}
        </div>

        {!comparing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
            <button onClick={onKeepMine} style={{
              padding: "12px 14px", borderRadius: 12, border: "none", cursor: "pointer",
              background: th.appAccent, color: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 700, textAlign: "left",
            }}>
              {intent === "delete" ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}><AppIcon emoji="🗑️" icon="elimina" size={13} /> Elimina comunque</span>
              ) : "✓ Tieni le mie modifiche"}
              <div style={{ fontWeight: 400, fontSize: 11, opacity: 0.9, marginTop: 2 }}>
                {intent === "delete" ? "La versione modificata da altri viene eliminata." : "Sovrascrive la versione sul server con la tua."}
              </div>
            </button>
            <button onClick={onDiscardMine} style={{
              padding: "12px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left",
              border: `1.5px solid ${th.appBorder}`, background: "transparent", color: th.appInk, fontFamily: F.ui, fontSize: 13, fontWeight: 700,
            }}>
              {intent === "delete" ? "↩️ Annulla l'eliminazione" : "⤺ Scarta le mie e usa la versione aggiornata"}
              <div style={{ fontWeight: 400, fontSize: 11, color: th.appFaded, marginTop: 2 }}>
                {intent === "delete" ? "La ricetta resta, con le modifiche fatte da altri." : "Le tue modifiche vengono perse."}
              </div>
            </button>
            {diffs.length > 0 && (
              <button onClick={() => setComparing(true)} style={{
                padding: "10px 14px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                border: `1.5px dashed ${th.appBorder}`, background: "transparent", color: th.appFaded, fontFamily: F.ui, fontSize: 12.5,
              }}>
                🔍 Confronta le due versioni prima di decidere
              </button>
            )}
            <button onClick={onClose} style={{
              padding: "9px", border: "none", background: "transparent", color: th.appFaded, fontFamily: F.ui, fontSize: 11.5, cursor: "pointer",
            }}>
              Decido dopo — non fare nulla ora
            </button>
          </div>
        ) : (
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", marginBottom: 10 }}>
              Cosa è cambiato: {diffs.map(d => d.label).join(", ")}
            </div>
            {diffs.map(d => (
              <div key={d.key} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${th.appBorder}` }}>
                <div style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 700, color: th.appInk, marginBottom: 6 }}>{d.label}</div>
                {d.mineList ? (
                  <>
                    <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appAccent, marginBottom: 2 }}>La tua versione</div>
                    <ul style={{ margin: "0 0 8px", paddingLeft: 18, fontFamily: F.body, fontSize: 12, color: th.appInk }}>
                      {d.mineList.length === 0 ? <li style={{ color: th.appFaded }}>(vuoto)</li> : d.mineList.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                    <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appFaded, marginBottom: 2 }}>Versione sul server</div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.body, fontSize: 12, color: th.appFaded }}>
                      {d.theirsList.length === 0 ? <li>(vuoto)</li> : d.theirsList.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                  </>
                ) : (
                  <div style={{ fontFamily: F.body, fontSize: 12.5 }}>
                    <div style={{ color: th.appAccent, marginBottom: 2 }}>Tua: {d.mine}</div>
                    <div style={{ color: th.appFaded }}>Server: {d.theirs}</div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={() => setComparing(false)} style={{
              width: "100%", padding: "10px", borderRadius: 12, cursor: "pointer",
              border: `1.5px solid ${th.appBorder}`, background: "transparent", color: th.appInk, fontFamily: F.ui, fontSize: 12.5, marginTop: 4,
            }}>
              ‹ Torna alla scelta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
