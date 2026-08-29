import React, { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F, INGREDIENT_CATEGORIES } from "../data/constants.js";
import AppIcon from "../components/AppIcon.jsx";
import Icon from "../components/Icon.jsx";
import SectionCategoryIcon from "../components/SectionCategoryIcon.jsx";
import ChosenIcon from "../components/ChosenIcon.jsx";
import FoodIconGrid from "../components/FoodIconGrid.jsx";
import BottomNav from "../components/BottomNav.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import { NUTRITION_DB } from "../data/nutrition.js";
import {
  buildIngredientDict, ingDictIndex, sortCategoriesBaseFirst,
  normName, uid, macroLine, resolveIngId, flattenIngredients,
  WEIGHT_UNITS, unitLabel, normUnit, fmtQty,
} from "../utils/helpers.js";
import { effectiveCategories, effectiveNutritionKey, effectiveEquivalenceKey, sourcePriorityFor, findSimilarIngredients } from "../utils/aggregates.js";

// ══════════════════════════════════════════════════════════════
// SCREEN: ORGANIZZA INGREDIENTI (sotto Svuota Frigo)
// ══════════════════════════════════════════════════════════════
// Sentinel per il filtro "fonte": lista spesa invece di una ricetta specifica.
export const SHOPPING_SOURCE = "shopping";

export default function OrganizeIngredientsScreen({
  nav, recipes, aggregates, ingredientCategories, sourceByIngredient = {}, onSetSourcePriority,
  onSetIngredientCats, onSaveAggregate, onDeleteAggregate, onBack,
  onLanding, onRecipes, onMemories, onFridge, onShopping,
  suggestedAggregates = [], ignoredSimilarities = [], onIgnoreSimilarity, onRestoreSimilarity,
  categoryList = INGREDIENT_CATEGORIES, onSaveCategory, onDeleteCategory,
  equivalences = {}, onSaveEquivalence,
  customUnits = {}, onSaveCustomUnit, onDeleteCustomUnit,
  nutritionMap = {}, onSaveNutritionMapping,
  customFoods = [], onSaveCustomFood, onDeleteCustomFood,
  ingredientDict = null, onRenameIngredient, onDeleteIngredients,
  shoppingList = [],
  initialFilterRecipeId = null, initialAlertTypes = null, initialManageAggs = false, initialManageCats = false,
  initialAggScope = "all",
}) {
  const th = useTheme();
  const ui = useUiStyle();
  const [editing, setEditing] = useState(null); // null | {kind:"ingredient"|"aggregate", ...}
  const [manageCats, setManageCats] = useState(!!initialManageCats); // gestione categorie (nome/icona)
  const [manageEq, setManageEq] = useState(false);     // gestione equivalenze unità
  const [manageNutri, setManageNutri] = useState(false); // sfoglia database alimenti (ufficiale + personalizzati)
  const [nutriSearch, setNutriSearch] = useState({});    // nome ingrediente → testo ricerca aperta
  const [dbSearch, setDbSearch] = useState("");          // ricerca nel database alimenti
  const [manageAggs, setManageAggs] = useState(!!initialManageAggs); // database aggregati (lista)
  const [aggSuggestionScope, setAggSuggestionScope] = useState(initialAggScope); // "all" | "shopping" — filtro suggerimenti aggregati
  const [openAggSections, setOpenAggSections] = useState(() => // tendine Database aggregati
    initialManageAggs ? { existing:false, suggested:true } : { existing:false, suggested:false }
  );
  const [editingFrom, setEditingFrom] = useState(null);   // null | "manageAggs" — dove tornare dopo l'editor aggregato
  const [unusedOpen, setUnusedOpen] = useState(false);       // tendina "Ingredienti non utilizzati"
  const [selectedUnused, setSelectedUnused] = useState(() => new Set()); // ingId selezionati lì dentro
  const [confirmDeleteUnused, setConfirmDeleteUnused] = useState(false); // conferma eliminazione a 2 passaggi
  const [foodForm, setFoodForm] = useState(null);        // form alimento personalizzato {id?, name, ...}
  const [foodFormLinkTo, setFoodFormLinkTo] = useState(null); // dataKey dell'ingrediente da collegare al nuovo alimento, se aperto da lì
  const [expanded, setExpanded] = useState({});          // nome → "cat"|"nutri"|"eq"|null (editor inline aperto)
  // Bozze locali per gli editor inline categorie/nutrizione/equivalenze: le
  // modifiche restano qui finché non premi "Salva" (così una card con issue
  // non sparisce dalla lista filtrata mentre stai ancora scrivendo/scegliendo).
  // Scaricate ad ogni apertura/chiusura di sezione: senza Salva si perdono.
  const [catDraft, setCatDraft] = useState({});     // key → string[] (categorie scelte)
  const [nutriDraft, setNutriDraft] = useState({}); // key → {foodId}|{custom}|null (bozza collegamento) — assente = usa il valore salvato
  const [eqDraft, setEqDraft] = useState({});       // key → { unità: grammi }
  const [newCat, setNewCat] = useState({ emoji:"", label:"", icon:undefined });
  const [iconPickerMode, setIconPickerMode] = useState("emoji"); // "emoji" | "svg", per il popup icona categoria
  const [renameDraft, setRenameDraft] = useState({});   // ingId → testo in modifica (stato nel parent: ItemCard viene rimontata)
  const [renameErr, setRenameErr] = useState(null);     // ingId con nome rifiutato
  const [emojiPickerFor, setEmojiPickerFor] = useState(null); // cat.id | "new" | null
  const [priorityPopupFor, setPriorityPopupFor] = useState(null); // ingId di cui è aperto il popup ordine priorità, o null
  const [customUnitForm, setCustomUnitForm] = useState(null); // null | {editKey, name, base, value, error} — form conversione di sistema personalizzata

  const CATEGORY_EMOJIS = [
    "🧂","🌾","🥕","🥩","🧀","🫘","🫒","🌿","🍷","🍫","📦","🏷️",
    "🍞","🥖","🍝","🍚","🥔","🍅","🥦","🥬","🍎","🍋","🍇","🍓",
    "🥚","🐟","🦐","🍗","🥓","🥛","🧈","🍯","🍬","🍰","☕","🍵",
    "🥜","🌰","🧄","🧅","🌶","🥫","🍄","🫙","🧊","🍾","🥤","🍪",
    "🥐","🥧","🍩","🥯","🫓","🦀","🦑","🌱",
  ];
  const [search, setSearch] = useState("");
  const [filterRecipeId, setFilterRecipeId] = useState(initialFilterRecipeId != null ? String(initialFilterRecipeId) : "");
  const [issueMode, setIssueMode] = useState(!!(initialAlertTypes && initialAlertTypes.length)); // "Tutti" | "Da gestire"
  const [alertFilter, setAlertFilter] = useState(initialAlertTypes && initialAlertTypes.length ? initialAlertTypes : ["cat","nutri","eq"]); // sottoinsieme di "cat"|"nutri"|"eq", attivo solo in issueMode

  // R2 — fonte unica: il dizionario ingredienti (id → nome visualizzato)
  const dictM = React.useMemo(
    () => ingredientDict || buildIngredientDict(recipes),
    [ingredientDict, recipes]
  );
  const dictIdx = React.useMemo(() => ingDictIndex(dictM), [dictM]);
  const dictName = (id) => dictM[id] || id;
  // Unità usate per ingrediente (per l'editor equivalenze inline e il
  // controllo d'impatto quando si cancella una conversione di sistema
  // personalizzata) — keyed per ID. Calcolato qui (prima delle viste
  // "manageXxx" con return anticipato) così è disponibile ovunque serva.
  const unitsByIng = React.useMemo(() => {
    const m = new Map();
    recipes.forEach(r => flattenIngredients(r.ingredients).forEach(ing => {
      if (ing.qty == null) return;
      const k = resolveIngId(dictIdx, ing.name);
      if (!m.has(k)) m.set(k, new Set());
      m.get(k).add(normUnit(ing.unit));
    }));
    return m;
  }, [recipes, dictIdx]);
  // Se un ingrediente è già finito in un aggregato vero, mostra il nome
  // dell'aggregato invece del suo — usato nelle card "ignorate": se A e B
  // sono stati aggregati e C no, "A · B · C" diventa "Aggregato AB · C".
  const aggregateNameFor = (id) => aggregates.find(a => (a.members || []).includes(id))?.name;
  const memberOrAggName = (id) => aggregateNameFor(id) || dictName(id);
  // Suggerimenti aggregati: quelli attivi arrivano già pronti come prop
  // (suggestedAggregates); qui calcoliamo anche l'insieme completo, senza
  // filtro sugli ignorati, per poter mostrare le card "ignorate" attenuate
  // — un gruppo è ignorato se non è tra gli attivi e tutte le sue coppie
  // sono in ignoredSimilarities.
  const allSuggestedGroups = React.useMemo(
    () => findSimilarIngredients(dictM, aggregates, []),
    [dictM, aggregates]
  );
  const ignoredSuggestedGroups = React.useMemo(() => {
    const activeKeys = new Set(suggestedAggregates.map(g => g.key));
    const isPairIgnored = (a, b) => ignoredSimilarities.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    return allSuggestedGroups.filter(g => !activeKeys.has(g.key) && g.pairs.every(([a, b]) => isPairIgnored(a, b)));
  }, [allSuggestedGroups, suggestedAggregates, ignoredSimilarities]);
  // ID ingrediente presenti nella lista spesa corrente — per marcare/filtrare
  // i suggerimenti rilevanti per la spesa (🛒 e switch "Solo lista spesa").
  const shoppingIngIds = React.useMemo(() => {
    const ids = new Set();
    shoppingList.forEach(entry => entry.items.forEach(it => ids.add(resolveIngId(dictIdx, normName(it.name)))));
    return ids;
  }, [shoppingList, dictIdx]);
  const isShoppingRelevant = (g) => g.members.filter(id => shoppingIngIds.has(id)).length >= 2;
  const visibleSuggestedAggregates = aggSuggestionScope === "shopping"
    ? suggestedAggregates.filter(isShoppingRelevant)
    : suggestedAggregates;
  const visibleIgnoredSuggestedGroups = aggSuggestionScope === "shopping"
    ? ignoredSuggestedGroups.filter(isShoppingRelevant)
    : ignoredSuggestedGroups;
  // Numero di card mostrate in "Da decidere" — un gruppo "join" con più
  // membri liberi produce una card per membro (vedi sotto), quindi non
  // coincide più con visibleSuggestedAggregates.length.
  const decideCardCount = visibleSuggestedAggregates.reduce((n, g) => n + (g.type === "join" ? g.newMembers.length : 1), 0);
  // Voci del dizionario ordinate per nome (name = ID, display = nome)
  const allDictEntries = React.useMemo(
    () => Object.entries(dictM)
      .map(([id, display]) => ({ name: id, display }))
      .sort((a, b) => a.display.localeCompare(b.display, "it")),
    [dictM]
  );

  const catLabel = (id) => categoryList.find(c => c.id === id);
  const orderedCats = sortCategoriesBaseFirst(categoryList);
  // Ingredienti referenziati da almeno una ricetta del libro attivo — il
  // resto del dizionario (accumulato nel tempo da buildIngredientDict, che
  // non rimuove mai le voci diventate orfane) finisce nella sezione
  // "Ingredienti non utilizzati" invece che nella lista principale. Calcolato
  // qui (prima degli early return delle viste "manageXxx") per rispettare le
  // regole degli hook — va chiamato sempre, non condizionatamente.
  const usedIngIds = React.useMemo(() => {
    const s = new Set();
    recipes.forEach(r => flattenIngredients(r.ingredients).forEach(ing => s.add(resolveIngId(dictIdx, ing.name))));
    return s;
  }, [recipes, dictIdx]);

  // Una card di suggerimento aggregato — estratta perché un gruppo "join"
  // con più membri liberi produce ora una card per ciascuno (vedi sotto),
  // invece di una sola card con "aggiungi N ingredienti insieme": l'utente
  // deve poter decidere ingrediente per ingrediente.
  const renderAggSuggestionCard = (key, { shopping, title, subtitle, addLabel, onAdd, onIgnore }) => (
    <div key={key} style={{ background:th.appCard, border:`1.5px solid ${th.appAccent}55`, borderRadius:12, padding:"11px 13px", marginBottom:8 }}>
      <div style={{ fontFamily:F.body, fontSize:14, fontWeight:700, color:th.appInk }}>
        {shopping && <span title="Rilevante per la lista spesa">🛒 </span>}
        {title}
      </div>
      <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:2, marginBottom:9 }}>
        {subtitle}
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        <button onClick={onAdd} style={{ background:th.appAccent, border:"none", borderRadius:9, padding:"7px 11px", color:"#fff", fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer" }}>{addLabel}</button>
        <button onClick={onIgnore} style={{ background:"transparent", border:`1.5px solid ${th.appBorder}`, borderRadius:9, padding:"7px 11px", color:th.appFaded, fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer" }}>Ignora</button>
      </div>
    </div>
  );

  // ── Database aggregati: lista + crea/modifica ──
  if (manageAggs) {
    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => initialManageAggs ? (onBack && onBack()) : setManageAggs(false)} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>⊕ Database aggregati</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>gruppi di ingredienti equivalenti</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"4px 18px 40px" }}>
          <button onClick={() => { setManageAggs(false); setEditingFrom("manageAggs"); setEditing({ kind:"aggregate", name:"", members:[], categories:[] }); }} style={{
            width:"100%", padding:"12px", borderRadius:12, border:`1.5px dashed ${th.appBorder}`,
            background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12.5, fontWeight:600, cursor:"pointer", marginBottom:18,
          }}>＋ Nuovo aggregato</button>

          {/* ── Aggregati esistenti (tendina) ── */}
          <button onClick={() => setOpenAggSections(p => ({ ...p, existing: !p.existing }))} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
            background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12,
            padding:"10px 12px", marginBottom:8, cursor:"pointer",
          }}>
            <span style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appAccent, textTransform:"uppercase", fontWeight:700 }}>
              📋 Aggregati esistenti ({aggregates.length})
            </span>
            <span style={{ color:th.appFaded, fontSize:12 }}>{openAggSections.existing ? "▾" : "▸"}</span>
          </button>
          {openAggSections.existing && (
            <div style={{ marginBottom:8 }}>
              {aggregates.map(agg => (
                <div key={agg.id} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12, padding:"11px 13px", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:F.body, fontSize:14.5, fontWeight:700, color:th.appInk }}>⊕ {agg.name}</div>
                      <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:2 }}>{(agg.members||[]).map(dictName).join(" · ")}</div>
                    </div>
                    <button onClick={() => { setManageAggs(false); setEditingFrom("manageAggs"); setEditing({ kind:"aggregate", id:agg.id, name:agg.name, members:[...(agg.members||[])], categories:[...(agg.categories||[])] }); }} style={{ background:th.appInk, border:"none", borderRadius:9, padding:"7px 11px", color:"#fff", fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>✏️ Modifica</button>
                  </div>
                </div>
              ))}
              {aggregates.length === 0 && (
                <div style={{ textAlign:"center", padding:"26px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>Nessun aggregato ancora creato</div>
              )}
            </div>
          )}

          {/* ── Aggregati suggeriti (tendina unica: Da decidere + Ignorati) ── */}
          <button onClick={() => setOpenAggSections(p => ({ ...p, suggested: !p.suggested }))} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
            background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12,
            padding:"10px 12px", marginBottom:8, cursor:"pointer",
          }}>
            <span style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appAccent, textTransform:"uppercase", fontWeight:700 }}>
              🔎 Aggregati suggeriti{(decideCardCount + visibleIgnoredSuggestedGroups.length) > 0 ? ` (${decideCardCount + visibleIgnoredSuggestedGroups.length})` : ""}
            </span>
            <span style={{ color:th.appFaded, fontSize:12 }}>{openAggSections.suggested ? "▾" : "▸"}</span>
          </button>
          {openAggSections.suggested && (
            <div style={{ marginBottom:18 }}>
              {(suggestedAggregates.length > 0 || ignoredSuggestedGroups.length > 0) && (
                <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                  {[["all","Tutti"],["shopping","🛒 Solo lista spesa"]].map(([val, label]) => {
                    const on = aggSuggestionScope === val;
                    return (
                      <button key={val} onClick={() => setAggSuggestionScope(val)} style={{
                        flex:1, padding:"7px 10px", borderRadius:20,
                        border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
                        background: on ? th.appAccent + "18" : "transparent",
                        color: on ? th.appAccent : th.appFaded,
                        fontFamily:F.ui, fontSize:11.5, fontWeight:600, cursor:"pointer",
                      }}>{label}</button>
                    );
                  })}
                </div>
              )}

              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", margin:"4px 0 8px", fontWeight:700 }}>
                Da decidere
              </div>
              {visibleSuggestedAggregates.length === 0 ? (
                <div style={{ textAlign:"center", padding:"16px 0", color:th.appFaded, fontFamily:F.ui, fontSize:11.5, fontStyle:"italic" }}>
                  Nessun suggerimento{aggSuggestionScope === "shopping" ? " nella lista spesa" : ""}.
                </div>
              ) : visibleSuggestedAggregates.flatMap(g => g.type === "join"
                  // Un gruppo "join" può avere più membri liberi da aggiungere allo
                  // stesso aggregato esistente: una card per ciascuno, non una sola
                  // con "aggiungi N insieme" — l'utente deve poter scegliere caso per
                  // caso. "Ignora" su una card tocca solo le coppie che riguardano
                  // quel singolo membro, non l'intero gruppo.
                  ? g.newMembers.map(m => renderAggSuggestionCard(`${g.key}:${m}`, {
                      shopping: isShoppingRelevant(g),
                      title: <>Aggiungi «{dictName(m)}» a un aggregato esistente</>,
                      subtitle: <>{g.aggregate.name} ({(g.aggregate.members || []).map(dictName).join(", ")})</>,
                      addLabel: <>⊕ Aggiungi a «{g.label}»</>,
                      onAdd: () => onSaveAggregate && onSaveAggregate({ ...g.aggregate, members:[...(g.aggregate.members || []), m] }),
                      onIgnore: () => g.pairs.filter(([a, b]) => a === m || b === m).forEach(([a, b]) => onIgnoreSimilarity && onIgnoreSimilarity(a, b)),
                    }))
                  : [renderAggSuggestionCard(g.key, {
                      shopping: isShoppingRelevant(g),
                      title: g.label,
                      subtitle: g.members.map(dictName).join(" · "),
                      addLabel: "⊕ Crea aggregato",
                      onAdd: () => { setManageAggs(false); setEditingFrom("manageAggs"); setEditing({ kind:"aggregate", name:g.label, members:[...g.members], categories:[] }); },
                      onIgnore: () => g.pairs.forEach(([a, b]) => onIgnoreSimilarity && onIgnoreSimilarity(a, b)),
                    })]
              )}

              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", margin:"14px 0 8px", fontWeight:700 }}>
                Ignorati
              </div>
              {visibleIgnoredSuggestedGroups.length === 0 ? (
                <div style={{ textAlign:"center", padding:"16px 0", color:th.appFaded, fontFamily:F.ui, fontSize:11.5, fontStyle:"italic" }}>Nessun aggregato ignorato.</div>
              ) : visibleIgnoredSuggestedGroups.map(g => (
                <div key={g.key} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12, padding:"11px 13px", marginBottom:8 }}>
                  <div style={{ opacity:0.55 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ fontFamily:F.body, fontSize:14, fontWeight:700, color:th.appInk, flex:1 }}>
                        {isShoppingRelevant(g) && <span title="Rilevante per la lista spesa">🛒 </span>}
                        {g.label}
                      </div>
                      <span style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded, textTransform:"uppercase", letterSpacing:0.5 }}>ignorato</span>
                    </div>
                    <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:2, marginBottom:9 }}>
                      {Array.from(new Set(g.members.map(memberOrAggName))).join(" · ")}
                    </div>
                  </div>
                  <button onClick={() => g.pairs.forEach(([a, b]) => onRestoreSimilarity && onRestoreSimilarity(a, b))} style={{ background:"transparent", border:`1.5px solid ${th.appBorder}`, borderRadius:9, padding:"7px 11px", color:th.appFaded, fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer" }}>🔄 Ripristina</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Database alimenti: sfoglia database ufficiale + personalizzati ──
  // (il collegamento ingrediente → alimento si fa da Organizza ingredienti,
  // nell'editor nutrizionale di ciascuna scheda: qui si gestisce solo il
  // database di riferimento, non le singole associazioni.)
  if (manageNutri) {
    const q = dbSearch.trim().toLowerCase();
    const filtered = q ? NUTRITION_DB.filter(f => f.name.toLowerCase().includes(q)) : NUTRITION_DB;
    const filteredCustom = q ? customFoods.filter(f => f.name.toLowerCase().includes(q)) : customFoods;

    // ── Form alimento personalizzato ──
    if (foodForm) {
      const fields = [
        ["kcal","Energia (kcal)"], ["carb","Carboidrati (g)"], ["sug","di cui zuccheri (g)"],
        ["prot","Proteine (g)"], ["fat","Grassi (g)"], ["sat","di cui saturi (g)"],
        ["fib","Fibre (g)"], ["salt","Sale (g)"],
      ];
      const setF = (k, v) => setFoodForm(p => ({ ...p, [k]: v }));
      const canSaveFood = (foodForm.name || "").trim() && foodForm.kcal !== "";
      // Se il form è stato aperto dall'editor nutrizionale di un ingrediente
      // (foodFormLinkTo), annullare o salvare riporta a Organizza Ingredienti
      // invece che al Database valori nutrizionali, che l'utente non ha scelto di visitare.
      const closeFoodForm = () => {
        setFoodForm(null);
        if (foodFormLinkTo) { setManageNutri(false); setFoodFormLinkTo(null); }
      };
      const saveFood = () => {
        const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };
        const foodId = foodForm.id || uid("cf");
        onSaveCustomFood({
          id: foodId,
          cat: "Personalizzati",
          custom: true,
          name: foodForm.name.trim(),
          source: (foodForm.source || "").trim() || "personalizzata",
          kcal: num(foodForm.kcal), carb: num(foodForm.carb), sug: num(foodForm.sug),
          prot: num(foodForm.prot), fat: num(foodForm.fat), sat: num(foodForm.sat),
          fib: num(foodForm.fib), salt: num(foodForm.salt),
        });
        // Collega automaticamente il nuovo alimento all'ingrediente di partenza,
        // come se l'utente l'avesse cercato e selezionato dal database.
        if (foodFormLinkTo) onSaveNutritionMapping(foodFormLinkTo, { foodId });
        closeFoodForm();
      };
      return (
        <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
          {nav}
          <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={closeFoodForm} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Annulla</button>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>{foodForm.id ? "✏️ Modifica alimento" : "＋ Nuovo alimento"}</div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>valori per 100 g · fonte personalizzata</div>
            </div>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"6px 18px 40px" }}>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:0.5, color:th.appFaded, textTransform:"uppercase", marginBottom:5 }}>Nome alimento *</div>
            <input value={foodForm.name || ""} autoFocus onChange={e => setF("name", e.target.value)} placeholder="es. Philadelphia light"
              style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appCard, fontFamily:F.body, fontSize:13.5, color:th.appInk, outline:"none", boxSizing:"border-box", marginBottom:12 }}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 10px", marginBottom:12 }}>
              {fields.map(([k, label]) => (
                <div key={k}>
                  <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginBottom:3 }}>{label}{k === "kcal" ? " *" : ""}</div>
                  <input type="text" inputMode="decimal" value={foodForm[k] ?? ""} onChange={e => setF(k, e.target.value)} placeholder="0"
                    style={{ width:"100%", padding:"9px 10px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appCard, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", boxSizing:"border-box", textAlign:"center" }}/>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:0.5, color:th.appFaded, textTransform:"uppercase", marginBottom:5 }}>Fonte dei valori</div>
            <input value={foodForm.source || ""} onChange={e => setF("source", e.target.value)} placeholder="es. etichetta del prodotto"
              style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appCard, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", boxSizing:"border-box", marginBottom:16 }}/>
            <button onClick={saveFood} disabled={!canSaveFood} style={{
              width:"100%", padding:"13px", border:"none", borderRadius:12,
              background: canSaveFood ? th.appAccent : th.appBorder,
              color: canSaveFood ? "#fff" : th.appFaded,
              fontFamily:F.ui, fontSize:13, fontWeight:700, cursor: canSaveFood ? "pointer" : "default",
            }}>Salva alimento</button>
          </div>
        </div>
      );
    }
    // raggruppa per categoria mantenendo l'ordine del database
    const groups = [];
    filtered.forEach(f => {
      let g = groups[groups.length - 1];
      if (!g || g.cat !== f.cat) { g = { cat: f.cat, foods: [] }; groups.push(g); }
      g.foods.push(f);
    });
    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => { setManageNutri(false); setDbSearch(""); }} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>📖 Database alimenti</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{NUTRITION_DB.length} voci · valori per 100 g</div>
          </div>
        </div>
        <div style={{ padding:"0 18px 8px" }}>
          <input
            value={dbSearch}
            onChange={e => setDbSearch(e.target.value)}
            placeholder="🔍 Cerca un alimento…"
            style={{ width:"100%", padding:"10px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:11, background:th.appCard, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", boxSizing:"border-box" }}
          />
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"0 18px 40px" }}>
          {/* Personalizzati */}
          {(filteredCustom.length > 0 || !q) && (
            <div>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appAccent, textTransform:"uppercase", fontWeight:700, margin:"14px 0 6px" }}>Personalizzati · fonte utente</div>
              {filteredCustom.map(f => (
                <div key={f.id} style={{ background:th.appCard, border:`1.5px dashed ${th.appBorder}`, borderRadius:10, padding:"9px 12px", marginBottom:5 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:F.body, fontSize:13, color:th.appInk }}>{f.name}</div>
                      <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:2 }}>
                        {macroLine(f)} · sale {String(f.salt).replace(".",",")} g
                      </div>
                      <div style={{ fontFamily:F.ui, fontSize:9, color:th.appAccent, marginTop:2 }}>fonte: {f.source || "personalizzata"}</div>
                    </div>
                    <button onClick={() => setFoodForm({ ...f, kcal:String(f.kcal), carb:String(f.carb), sug:String(f.sug), prot:String(f.prot), fat:String(f.fat), sat:String(f.sat), fib:String(f.fib), salt:String(f.salt) })} style={{ background:"none", border:"none", fontSize:13, cursor:"pointer", color:th.appFaded, flexShrink:0, padding:"2px 4px" }}>✏️</button>
                    <button onClick={() => onDeleteCustomFood(f.id)} style={{ background:"none", border:"none", fontSize:14, cursor:"pointer", color:"#C4593A", flexShrink:0, padding:"2px 4px" }}>×</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setFoodForm({ name:"", source:"" })} style={{
                width:"100%", padding:"11px", borderRadius:11, border:`1.5px dashed ${th.appBorder}`,
                background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:11.5, fontWeight:600, cursor:"pointer", marginTop:2,
              }}>＋ Aggiungi alimento personalizzato</button>
            </div>
          )}
          {groups.map(g => (
            <div key={g.cat}>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appAccent, textTransform:"uppercase", fontWeight:700, margin:"14px 0 6px" }}>{g.cat}</div>
              {g.foods.map(f => (
                <div key={f.id} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"9px 12px", marginBottom:5 }}>
                  <div style={{ fontFamily:F.body, fontSize:13, color:th.appInk }}>{f.name}</div>
                  <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:2 }}>
                    {macroLine(f)} · sale {String(f.salt).replace(".",",")} g
                  </div>
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && filteredCustom.length === 0 && q && (
            <div style={{ textAlign:"center", padding:"30px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>Nessun alimento trovato</div>
          )}
          <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, textAlign:"center", marginTop:14, lineHeight:1.5 }}>
            Valori indicativi per 100 g, elaborati dalle Tabelle di Composizione degli Alimenti<br/>CREA — alimentinutrizione.it
          </div>
        </div>
      </div>
    );
  }

  // ── Conversioni di sistema: unità di peso/volume fisse, sola lettura ──
  // Sono la base su cui si appoggiano tutte le equivalenze specifiche degli
  // ingredienti (che convertono verso i grammi partendo da qui). Fisse per
  // definizione (1 kg è sempre 1000 g): non ha senso renderle modificabili.
  if (manageEq) {
    const rows = Object.entries(WEIGHT_UNITS).sort(([,a], [,b]) => a - b);
    const customRows = Object.entries(customUnits).sort(([a], [b]) => a.localeCompare(b, "it"));

    // Vero solo se esiste almeno un ingrediente che usa questa unità e non ha
    // (né lui né l'aggregato da cui eredita, in ordine di priorità) un'equivalenza
    // specifica che vinca sul default: solo allora la cancellazione ha un impatto reale.
    const isCustomUnitInUse = (unitKey) => {
      for (const [ingId, units] of unitsByIng) {
        if (!units.has(unitKey)) continue;
        const effKey = effectiveEquivalenceKey(ingId, aggregates, equivalences, sourceByIngredient);
        if (!(equivalences[effKey]?.factors?.[unitKey] > 0)) return true;
      }
      return false;
    };

    const startAdd = () => setCustomUnitForm({ editKey:null, name:"", base:"g", value:"", error:null });
    const startEdit = (unitKey, def) => setCustomUnitForm({ editKey:unitKey, name:unitKey, base:def.base, value:String(def.value), error:null });
    const cancelForm = () => setCustomUnitForm(null);

    const submitForm = () => {
      const name = (customUnitForm.name || "").trim().toLowerCase();
      const value = parseFloat(String(customUnitForm.value).replace(",", "."));
      if (!name) { setCustomUnitForm(f => ({ ...f, error:"Serve un nome per l'unità" })); return; }
      if (name in WEIGHT_UNITS) { setCustomUnitForm(f => ({ ...f, error:"Nome riservato a un'unità di sistema fissa" })); return; }
      if (!(value > 0)) { setCustomUnitForm(f => ({ ...f, error:"Serve un valore maggiore di zero" })); return; }
      // Rinomina durante una modifica: la vecchia chiave va rimossa, altrimenti resta duplicata
      if (customUnitForm.editKey && customUnitForm.editKey !== name) onDeleteCustomUnit(customUnitForm.editKey);
      onSaveCustomUnit(name, { base: customUnitForm.base, value, grams: value * WEIGHT_UNITS[customUnitForm.base] });
      setCustomUnitForm(null);
    };

    const requestDelete = (unitKey) => {
      if (isCustomUnitInUse(unitKey)) {
        const ok = window.confirm(`"${unitKey}" è usata come conversione di default da almeno un ingrediente senza un'equivalenza specifica propria. Eliminandola, quell'ingrediente perderà la conversione in grammi finché non ne definisci una sulla sua scheda. Procedere?`);
        if (!ok) return;
      }
      onDeleteCustomUnit(unitKey);
      if (customUnitForm?.editKey === unitKey) setCustomUnitForm(null);
    };

    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setManageEq(false)} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>⚖️ Conversioni di sistema</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>unità di peso e volume, applicate sempre di default</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"8px 18px 40px" }}>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5, marginBottom:14 }}>
            Queste conversioni sono fisse e valgono per qualsiasi ingrediente — non servono equivalenze per g, kg, ml, l, cl, dl. Per le altre unità (cucchiai, pizzichi, unità intere…) definisci l'equivalenza specifica sulla singola voce, dalla scheda dell'ingrediente, oppure creane una qui sotto valida come default per tutti.
          </div>
          {rows.map(([unit, grams]) => (
            <div key={unit} style={{ display:"flex", alignItems:"center", gap:8, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12, padding:"11px 14px", marginBottom:8 }}>
              <span style={{ fontFamily:F.body, fontSize:14, color:th.appInk, flex:1 }}>1 {unitLabel(unit)}</span>
              <span style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded }}>=</span>
              <span style={{ fontFamily:F.display, fontSize:15, color:th.appAccent, fontWeight:700 }}>{grams} g</span>
            </div>
          ))}

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:24, marginBottom:8 }}>
            <div style={{ fontFamily:F.display, fontSize:15, color:th.appInk }}>➕ Le tue conversioni</div>
            {!customUnitForm && (
              <button onClick={startAdd} style={{ background:th.appAccent, border:"none", borderRadius:9, padding:"6px 12px", color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer" }}>+ Aggiungi</button>
            )}
          </div>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5, marginBottom:12 }}>
            Definisci una nuova unità (es. "bicchiere") esprimendola in una delle unità fisse qui sopra: diventa il default per ogni ingrediente che la usa. Se poi personalizzi l'equivalenza sulla singola voce, quella vince sempre.
          </div>

          {customUnitForm && (
            <div style={{ background:th.appCard, border:`1.5px solid ${th.appAccent}`, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
              <input
                value={customUnitForm.name}
                onChange={e => setCustomUnitForm(f => ({ ...f, name:e.target.value, error:null }))}
                placeholder="Nome unità (es. bicchiere)"
                style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", marginBottom:8 }}
              />
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, flexShrink:0 }}>=</span>
                <input
                  type="number"
                  value={customUnitForm.value}
                  onChange={e => setCustomUnitForm(f => ({ ...f, value:e.target.value, error:null }))}
                  placeholder="200"
                  style={{ width:80, padding:"8px 10px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", textAlign:"center" }}
                />
                <select
                  value={customUnitForm.base}
                  onChange={e => setCustomUnitForm(f => ({ ...f, base:e.target.value }))}
                  style={{ padding:"8px 10px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none" }}
                >
                  {Object.keys(WEIGHT_UNITS).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {customUnitForm.error && <div style={{ fontFamily:F.ui, fontSize:10.5, color:"#C4593A", marginTop:8 }}>{customUnitForm.error}</div>}
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={submitForm} style={{ padding:"7px 14px", borderRadius:9, border:"none", background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer" }}>💾 Salva</button>
                <button onClick={cancelForm} style={{ padding:"7px 14px", borderRadius:9, border:`1px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:11.5, cursor:"pointer" }}>Annulla</button>
              </div>
            </div>
          )}

          {customRows.length === 0 && !customUnitForm && (
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, fontStyle:"italic", marginBottom:8 }}>Nessuna conversione personalizzata ancora.</div>
          )}
          {customRows.map(([unit, def]) => (
            <div key={unit} style={{ display:"flex", alignItems:"center", gap:8, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12, padding:"11px 14px", marginBottom:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontFamily:F.body, fontSize:14, color:th.appInk }}>1 {unitLabel(unit)}</span>
                <span style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}> = {fmtQty(def.value)} {unitLabel(def.base)}</span>
              </div>
              <span style={{ fontFamily:F.display, fontSize:15, color:th.appAccent, fontWeight:700, flexShrink:0 }}>{fmtQty(def.grams)} g</span>
              <button onClick={() => startEdit(unit, def)} style={{ background:"none", border:"none", fontSize:13, cursor:"pointer", color:th.appFaded, flexShrink:0, padding:"2px 4px" }}>✏️</button>
              <button onClick={() => requestDelete(unit)} style={{ background:"none", border:"none", fontSize:14, cursor:"pointer", color:"#C4593A", flexShrink:0, padding:"2px 4px" }}>🗑️</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Gestione categorie: nome, icona, aggiunta, eliminazione ──
  if (manageCats) {
    const addNewCat = () => {
      const label = newCat.label.trim();
      if (!label) return;
      const id = uid("cat");
      onSaveCategory({ id, label, emoji: newCat.emoji.trim() || "🏷️", ...(newCat.icon ? { icon: newCat.icon } : {}) });
      setNewCat({ emoji:"", label:"", icon:undefined });
    };

    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => initialManageCats ? (onBack && onBack()) : setManageCats(false)} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>Gestisci categorie</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>nome e icona · "Ingredienti base" è l'unica categoria fissa</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"8px 20px 40px" }}>
          {orderedCats.map(cat => {
            const isFixed = cat.id === "base"; // unica categoria fissa
            // Ingredienti che hanno effettivamente questa categoria (propria
            // o ereditata da un aggregato) — stessa logica di Svuota Frigo.
            const catIngredients = allDictEntries
              .filter(({ name }) => effectiveCategories(name, aggregates, ingredientCategories, sourceByIngredient).categories.includes(cat.id))
              .map(({ display }) => display)
              .sort((a, b) => a.localeCompare(b, "it"));
            return (
              <div key={cat.id} style={{
                background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12,
                padding:"10px 12px", marginBottom:8,
                opacity: isFixed ? 0.75 : 1,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button
                    onClick={() => { if (!isFixed) { setEmojiPickerFor(cat.id); setIconPickerMode("emoji"); } }}
                    disabled={isFixed}
                    style={{ width:44, padding:"8px 4px", textAlign:"center", border:`1.5px solid ${emojiPickerFor===cat.id ? th.appAccent : th.appBorder}`, borderRadius:10, background:th.appBg, cursor: isFixed ? "default" : "pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}
                  ><SectionCategoryIcon item={cat} size={16} /></button>
                  <input
                    value={cat.label}
                    onChange={e => !isFixed && onSaveCategory({ ...cat, label: e.target.value })}
                    disabled={isFixed}
                    style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", minWidth:0 }}
                  />
                  {isFixed ? (
                    <span style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded, flexShrink:0 }}>fissa</span>
                  ) : (
                    <button onClick={() => onDeleteCategory(cat.id)} style={{
                      background:"none", border:"none", color:"#C4593A",
                      fontSize:17, cursor:"pointer", flexShrink:0, padding:"4px 6px",
                    }}>🗑️</button>
                  )}
                </div>
                <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:8, lineHeight:1.6 }}>
                  {catIngredients.length > 0 ? catIngredients.join(", ") : <span style={{ fontStyle:"italic" }}>nessun ingrediente</span>}
                </div>
              </div>
            );
          }).flatMap((row, i) => {
            // Nota informativa sotto la categoria fissa
            const cat = orderedCats[i];
            if (cat && cat.id === "base") {
              return [row, (
                <div key="base-note" style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, lineHeight:1.5, margin:"-2px 2px 10px 2px", fontStyle:"italic" }}>
                  ℹ️ Gli ingredienti di questa categoria vengono considerati di default come <b>presenti in dispensa</b>: in Svuota Frigo risultano già selezionati.
                </div>
              )];
            }
            return [row];
          })}

          {/* Nuova categoria */}
          <div style={{ marginTop:14, paddingTop:12, borderTop:`1px dashed ${th.appBorder}` }}>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:8 }}>Nuova categoria</div>
            <div style={{ display:"flex", gap:8 }}>
              <button
                onClick={() => { setEmojiPickerFor("new"); setIconPickerMode("emoji"); }}
                style={{ width:44, padding:"8px 4px", textAlign:"center", border:`1.5px solid ${emojiPickerFor==="new" ? th.appAccent : th.appBorder}`, borderRadius:10, background:th.appCard, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}
              ><ChosenIcon emoji={newCat.emoji || "🏷️"} icon={newCat.icon} size={16} /></button>
              <input
                value={newCat.label}
                onChange={e => setNewCat(p => ({ ...p, label: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addNewCat()}
                placeholder="Nome categoria…"
                style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appCard, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", minWidth:0 }}
              />
              <button onClick={addNewCat} disabled={!newCat.label.trim()} style={{
                padding:"9px 14px", borderRadius:10, border:"none",
                background: newCat.label.trim() ? th.appAccent : th.appBorder,
                color: newCat.label.trim() ? "#fff" : th.appFaded,
                fontFamily:F.ui, fontSize:12, fontWeight:700,
                cursor: newCat.label.trim() ? "pointer" : "default", flexShrink:0,
              }}>＋</button>
            </div>
          </div>
        </div>

        {/* Popup scelta icona */}
        {emojiPickerFor && (
          <div
            onClick={() => setEmojiPickerFor(null)}
            style={{ position:"absolute", inset:0, zIndex:500, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
          >
            <div onClick={e => e.stopPropagation()} style={{
              width:"100%", background:th.appBg, borderRadius:18, padding:"16px",
              boxShadow:"0 10px 40px rgba(0,0,0,0.4)",
            }}>
              <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:10, textAlign:"center" }}>
                Scegli un'icona
              </div>
              <div style={{ display:"flex", borderRadius:20, overflow:"hidden", border:`1.5px solid ${th.appBorder}`, marginBottom:10, width:"fit-content" }}>
                {[["emoji","Emoji"],["svg","SVG"]].map(([id,label]) => (
                  <button key={id} onClick={() => setIconPickerMode(id)} style={{
                    padding:"6px 16px", border:"none", cursor:"pointer",
                    background: iconPickerMode===id ? th.appInk : "transparent",
                    color: iconPickerMode===id ? "#fff" : th.appFaded,
                    fontFamily:F.ui, fontSize:11, fontWeight:700,
                  }}>{label}</button>
                ))}
              </div>
              {iconPickerMode === "emoji" ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6 }}>
                  {CATEGORY_EMOJIS.map(e => (
                    <button key={e} onClick={() => {
                      if (emojiPickerFor === "new") setNewCat(p => ({ ...p, emoji: e, icon: undefined }));
                      else {
                        const cat = categoryList.find(c => c.id === emojiPickerFor);
                        // icon rimosso del tutto (non messo a undefined:
                        // Firestore rifiuta i campi undefined) — un'emoji
                        // scelta qui sostituisce del tutto un'eventuale
                        // icona SVG fissa della categoria predefinita.
                        if (cat) onSaveCategory(Object.fromEntries(Object.entries({ ...cat, emoji: e }).filter(([k]) => k !== "icon")));
                      }
                      setEmojiPickerFor(null);
                    }} style={{
                      aspectRatio:"1", borderRadius:10, border:`1px solid ${th.appBorder}`,
                      background:th.appCard, fontSize:20, cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>{e}</button>
                  ))}
                </div>
              ) : (
                <FoodIconGrid
                  value={emojiPickerFor === "new" ? newCat.icon : categoryList.find(c => c.id === emojiPickerFor)?.icon}
                  onSelect={name => {
                    if (emojiPickerFor === "new") setNewCat(p => ({ ...p, icon: name }));
                    else {
                      const cat = categoryList.find(c => c.id === emojiPickerFor);
                      if (cat) onSaveCategory({ ...cat, icon: name });
                    }
                    setEmojiPickerFor(null);
                  }}
                  accent={th.appAccent} inkColor={th.appInk} fadedColor={th.appFaded} borderColor={th.appBorder} bgColor={th.appCard}
                />
              )}
              <button onClick={() => setEmojiPickerFor(null)} style={{
                width:"100%", marginTop:12, padding:"11px",
                border:`1.5px solid ${th.appBorder}`, borderRadius:12,
                background:"transparent", color:th.appFaded,
                fontFamily:F.ui, fontSize:12, cursor:"pointer",
              }}>Annulla</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Editor (categorie + composizione) ──
  if (editing) {
    const isAgg = editing.kind === "aggregate";
    const currentCats = editing.categories || [];
    const toggleCat = (cid) => {
      const next = currentCats.includes(cid)
        ? currentCats.filter(c => c !== cid)
        : [...currentCats, cid];
      setEditing({ ...editing, categories: next });
    };

    const toggleMember = (name) => {
      const members = editing.members || [];
      const next = members.includes(name) ? members.filter(m => m !== name) : [...members, name];
      setEditing({ ...editing, members: next });
    };

    // Per un aggregato il salvataggio richiede nome e almeno un ingrediente incluso.
    const canSaveAgg = !isAgg || ((editing.name || "").trim() && (editing.members || []).length > 0);

    // Chiude l'editor tornando a "Database aggregati" se è da lì che si è
    // aperto (nuovo/modifica/da suggerimento), altrimenti alla vista principale.
    const closeEditor = () => {
      setEditing(null);
      if (editingFrom === "manageAggs") setManageAggs(true);
      setEditingFrom(null);
    };

    const save = () => {
      if (isAgg) {
        // salva aggregato
        const agg = {
          id: editing.id || uid("agg"),
          name: (editing.name || "").trim(),
          members: editing.members || [],
          categories: editing.categories || [],
        };
        if (!agg.name || agg.members.length === 0) return;
        onSaveAggregate(agg);
      } else {
        // salva categorie del singolo ingrediente
        onSetIngredientCats(editing.name, editing.categories || []);
      }
      closeEditor();
    };

    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={closeEditor} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1, fontFamily:F.display, fontSize:18, color:th.appInk }}>
            {isAgg ? (editing.id ? "Modifica aggregato" : "Nuovo aggregato") : "Categorie ingrediente"}
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"8px 20px 40px" }}>
          {/* Nome */}
          {isAgg ? (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>Nome aggregato</div>
              <input
                value={editing.name || ""}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
                placeholder="es. Zucchero, Olio da frittura…"
                style={{ width:"100%", padding:"10px 14px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appCard, fontFamily:F.body, fontSize:14, color:th.appInk, outline:"none", boxSizing:"border-box" }}
              />
            </div>
          ) : (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:F.display, fontSize:20, color:th.appInk }}>{editing.display}</div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>ingrediente singolo</div>
            </div>
          )}

          {/* Categorie — solo per il singolo ingrediente: per l'aggregato
              si gestiscono dalla sua scheda (ItemCard), non da qui */}
          {!isAgg && (
            <>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:8 }}>Categorie (multiple)</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
                {orderedCats.map(cat => {
                  const sel = currentCats.includes(cat.id);
                  return (
                    <button key={cat.id} onClick={() => toggleCat(cat.id)} style={{
                      padding:"6px 12px", borderRadius:20,
                      border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                      background: sel ? th.appAccent : "transparent",
                      color: sel ? "#fff" : th.appFaded,
                      fontFamily:F.ui, fontSize:11, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:4,
                    }}><SectionCategoryIcon item={cat} size={11} /> {cat.label}</button>
                  );
                })}
              </div>
            </>
          )}

          {/* Composizione aggregato */}
          {isAgg && (
            <>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:8 }}>
                Ingredienti inclusi ({(editing.members || []).length})
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {allDictEntries.map(({ name, display }) => {
                  const sel = (editing.members || []).includes(name);
                  return (
                    <button key={name} onClick={() => toggleMember(name)} style={{
                      padding:"6px 12px", borderRadius:20,
                      border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                      background: sel ? th.appAccent : "transparent",
                      color: sel ? "#fff" : th.appFaded,
                      fontFamily:F.ui, fontSize:11, cursor:"pointer",
                      display:"flex", alignItems:"center", gap:4,
                    }}>{sel && <span style={{ fontSize:10 }}>✓</span>}{display}</button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Save */}
        <div style={{ padding:"12px 18px 22px", display:"flex", gap:8, borderTop:`1px solid ${th.appBorder}` }}>
          {isAgg && editing.id && (
            <button onClick={() => { onDeleteAggregate(editing.id); closeEditor(); }} style={{
              padding:"14px 16px", borderRadius:12, border:`1.5px solid #C4593A`,
              background:"transparent", color:"#C4593A",
              fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer",
            }}>🗑️</button>
          )}
          <button onClick={save} disabled={!canSaveAgg} style={{
            flex:1, padding:"14px", borderRadius:12, border:"none",
            background: canSaveAgg ? th.appAccent : th.appBorder,
            color: canSaveAgg ? "#fff" : th.appFaded,
            fontFamily:F.ui, fontSize:14, fontWeight:700,
            cursor: canSaveAgg ? "pointer" : "default",
          }}>Salva</button>
        </div>
      </div>
    );
  }

  // ══ VISTA PRINCIPALE: 4 database + schede ingrediente/aggregato ══
  const allFoods = [...NUTRITION_DB, ...customFoods];
  const dbById = new Map(allFoods.map(f => [f.id, f]));
  const dbByName = new Map(allFoods.map(f => [normName(f.name), f]));
  const catsSorted = sortCategoriesBaseFirst(categoryList);
  const catOf = (id) => catsSorted.find(c => c.id === id);

  const allIngs = allDictEntries.filter(i => usedIngIds.has(i.name)); // [{name: ID, display: nome}] ordinati, solo usati
  const recipesFor = (ids) => recipes.filter(r =>
    flattenIngredients(r.ingredients).some(i => ids.includes(resolveIngId(dictIdx, i.name))));

  // Apre/chiude una sezione (categorie/nutrizione/equivalenze/rinomina) e
  // scarica sempre le bozze non salvate di quella card: sia chiudendo la
  // sezione aperta, sia passando a un'altra sezione della stessa card.
  const toggleExpand = (key, kind) => {
    setExpanded(p => ({ ...p, [key]: p[key] === kind ? null : kind }));
    setCatDraft(p => { if (!(key in p)) return p; const n = { ...p }; delete n[key]; return n; });
    setNutriDraft(p => { if (!(key in p)) return p; const n = { ...p }; delete n[key]; return n; });
    setEqDraft(p => { if (!(key in p)) return p; const n = { ...p }; delete n[key]; return n; });
    setNutriSearch(p => { if (!(key in p)) return p; const n = { ...p }; delete n[key]; return n; });
  };

  const nutriStatusOf = (ingId) => {
    const mapping = nutritionMap[ingId];
    if (mapping?.custom) return { ok:true, label:"valori manuali", values: mapping.custom };
    const food = mapping?.foodId ? dbById.get(mapping.foodId) : dbByName.get(normName(dictName(ingId)));
    return food ? { ok:true, label:food.name, values:food, auto: !mapping } : { ok:false };
  };
  const q = search.trim().toLowerCase();
  const filterIsShopping = filterRecipeId === SHOPPING_SOURCE;
  const filterRecipe = (filterRecipeId && !filterIsShopping) ? recipes.find(r => String(r.id) === filterRecipeId) : null;
  const recipeIngIds = filterRecipe
    ? new Set(flattenIngredients(filterRecipe.ingredients).map(ing => resolveIngId(dictIdx, ing.name)))
    : filterIsShopping
      ? new Set(shoppingList.flatMap(entry => entry.items.map(it => resolveIngId(dictIdx, normName(it.name)))))
      : null;
  // Unità rilevanti (book-wide) per un ingrediente/aggregato che non sono già
  // convertibili di default (unità di sistema): quelle per cui potrebbe servire
  // un'equivalenza specifica. Condivisa da EqEditor, dal riepilogo in ItemCard
  // e da eqIssueFor, così le tre viste restano sempre coerenti tra loro.
  const nonWeightUnitsFor = (memberIds) => {
    const set = new Set(memberIds.flatMap(m => Array.from(unitsByIng.get(m) || [])));
    return Array.from(set).filter(u => !(u in WEIGHT_UNITS)).sort();
  };
  // Unica definizione di "serve un'equivalenza": una delle unità sopra non ha
  // un fattore verso i grammi definito per questa voce. Vale ovunque,
  // indipendentemente dal filtro attivo (ricetta / lista spesa / nessuno) —
  // il filtro decide solo quali ingredienti mostrare, mai il criterio dell'alert.
  const eqIssueFor = (dataKey, memberIds) => {
    const factors = equivalences[dataKey]?.factors || {};
    return nonWeightUnitsFor(memberIds).some(u => !(factors[u] > 0) && !(customUnits[u]?.grams > 0));
  };

  // Stesse regole di segnalazione usate dalla ItemCard (categoria/nutrizione/equivalenze mancanti)
  const issuesFor = (itemId, isAgg, agg) => {
    const dataKey = isAgg ? agg.id : itemId;
    const cats = isAgg ? (agg.categories || []) : effectiveCategories(itemId, aggregates, ingredientCategories, sourceByIngredient).categories;
    const nutriKey = !isAgg ? effectiveNutritionKey(itemId, aggregates, nutritionMap, sourceByIngredient) : dataKey;
    const nutri = nutriStatusOf(nutriKey);
    const memberIds = isAgg ? (agg.members || []) : [itemId];
    return { cat: cats.length === 0, nutri: !nutri.ok, eq: eqIssueFor(dataKey, memberIds) };
  };
  const matchesAlertFilter = (itemId, isAgg, agg) => {
    if (!issueMode) return true;
    const issues = issuesFor(itemId, isAgg, agg);
    return alertFilter.some(type => issues[type]);
  };

  const visibleAggs = aggregates.filter(a =>
    (!q || a.name.toLowerCase().includes(q) || (a.members||[]).some(m => dictName(m).toLowerCase().includes(q))) &&
    (!recipeIngIds || (a.members||[]).some(m => recipeIngIds.has(m))) &&
    matchesAlertFilter(a.id, true, a)
  );
  const visibleIngs = allIngs.filter(i =>
    (!q || i.display.toLowerCase().includes(q)) &&
    (!recipeIngIds || recipeIngIds.has(i.name)) &&
    matchesAlertFilter(i.name, false, null)
  );
  const unusedIngs = allDictEntries.filter(i => !usedIngIds.has(i.name) && (!q || i.display.toLowerCase().includes(q)));

  // ── Editor inline: categorie ──
  // Bozza locale (catDraft) finché non premi Salva: evita che la card sparisca
  // dalla lista filtrata al primo toggle, prima di aver finito di scegliere.
  const CatEditor = ({ draftKey, dataKey, current, isAgg, agg }) => {
    const draft = catDraft[draftKey] ?? current;
    const toggle = (catId) => {
      const next = draft.includes(catId) ? draft.filter(c => c !== catId) : [...draft, catId];
      setCatDraft(p => ({ ...p, [draftKey]: next }));
    };
    const save = () => {
      if (isAgg) onSaveAggregate({ ...agg, categories: draft });
      else onSetIngredientCats(dataKey, draft);
      toggleExpand(draftKey, "cat");
    };
    return (
      <div style={{ marginTop:8 }}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
          {catsSorted.map(c => {
            const on = draft.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggle(c.id)} style={{
                padding:"5px 10px", borderRadius:14,
                border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
                background: on ? th.appAccent : "transparent",
                color: on ? "#fff" : th.appFaded,
                fontFamily:F.ui, fontSize:10.5, cursor:"pointer",
                display:"flex", alignItems:"center", gap:4,
              }}><SectionCategoryIcon item={c} size={10.5} /> {c.label}</button>
            );
          })}
        </div>
        <button onClick={save} style={{ marginTop:9, padding:"7px 14px", borderRadius:9, border:"none", background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer" }}>💾 Salva</button>
      </div>
    );
  };

  // ── Editor inline: collegamento nutrizionale ──
  // Bozza locale (nutriDraft) finché non premi Salva: scegliere un risultato
  // di ricerca o "Scollega" aggiorna solo la bozza, non il collegamento vero.
  const NutriEditor = ({ draftKey, dataKey, displayName }) => {
    const mapping = nutritionMap[dataKey]; // valore salvato
    const draftMapping = nutriDraft[draftKey]; // undefined = nessuna bozza, usa mapping
    const effMapping = draftMapping !== undefined ? draftMapping : mapping;
    const statusFor = (m) => {
      if (m?.custom) return { ok:true, label:"valori manuali", values:m.custom };
      const food = m?.foodId ? dbById.get(m.foodId) : dbByName.get(normName(dictName(dataKey)));
      return food ? { ok:true, label:food.name, values:food, auto: !m } : { ok:false };
    };
    const status = statusFor(effMapping);
    const searching = nutriSearch[draftKey] !== undefined;
    const s = nutriSearch[draftKey] ?? "";
    const results = searching && s.trim() ? allFoods.filter(f => f.name.toLowerCase().includes(s.trim().toLowerCase())).slice(0, 5) : [];
    const startSearch = () => setNutriSearch(p => ({ ...p, [draftKey]: "" }));
    const stopSearch = () => setNutriSearch(p => (({ [draftKey]:_, ...rest }) => rest)(p));
    const save = () => {
      onSaveNutritionMapping(dataKey, effMapping);
      toggleExpand(draftKey, "nutri");
    };

    return (
      <div style={{ marginTop:8 }}>
        {/* ── Già collegato (o selezionato in bozza): mostra a cosa, con possibilità di scollegare o cambiare ── */}
        {!searching && status.ok ? (
          <div style={{ background:th.appBg, border:`1px solid ${th.appBorder}`, borderRadius:9, padding:"9px 11px" }}>
            <div style={{ fontFamily:F.body, fontSize:12.5, color:th.appInk, fontWeight:600 }}>
              {status.label}{status.auto ? <span style={{ fontFamily:F.ui, fontSize:9.5, color:th.appAccent, fontWeight:400 }}> · match automatico</span> : null}
            </div>
            <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:2 }}>{macroLine(status.values, {fib:false})}</div>
            <div style={{ display:"flex", gap:14, marginTop:8 }}>
              {effMapping && (
                <button onClick={() => setNutriDraft(p => ({ ...p, [draftKey]: null }))} style={{ background:"none", border:"none", color:"#C4593A", fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", padding:0, textDecoration:"underline" }}>× Scollega</button>
              )}
              <button onClick={startSearch} style={{ background:"none", border:"none", color:th.appAccent, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", padding:0, textDecoration:"underline" }}>Cambia collegamento</button>
            </div>
          </div>
        ) : (
          /* ── Non collegato (o si sta cambiando collegamento): barra di ricerca ── */
          <div>
            <input
              value={s}
              autoFocus
              onChange={e => setNutriSearch(p => ({ ...p, [draftKey]: e.target.value }))}
              placeholder="Cerca nel database (es. farina, pollo…)"
              style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12.5, color:th.appInk, outline:"none", boxSizing:"border-box" }}
            />
            <button onClick={() => { setFoodFormLinkTo(dataKey); setFoodForm({ name: displayName }); setManageNutri(true); }} style={{ marginTop:6, background:"none", border:"none", color:th.appAccent, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", textDecoration:"underline", padding:0 }}>Oppure aggiungi valori nutrizionali personalizzati</button>
            {results.map(f => (
              <button key={f.id} onClick={() => {
                setNutriDraft(p => ({ ...p, [draftKey]: { foodId: f.id } }));
                stopSearch();
              }} style={{
                display:"block", width:"100%", textAlign:"left", padding:"8px 11px", marginTop:4,
                background:th.appBg, border:`1px solid ${th.appBorder}`, borderRadius:9,
                cursor:"pointer", fontFamily:F.body, fontSize:12, color:th.appInk,
              }}>
                {f.name}{f.custom && <span style={{ fontFamily:F.ui, fontSize:9, color:th.appAccent }}> · personalizzato</span>}
                <span style={{ display:"block", fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:1 }}>{macroLine(f, {fib:false})}</span>
              </button>
            ))}
            {status.ok && (
              <button onClick={stopSearch} style={{ marginTop:6, background:"none", border:"none", color:th.appFaded, fontFamily:F.ui, fontSize:10.5, cursor:"pointer", textDecoration:"underline", padding:0 }}>Annulla</button>
            )}
          </div>
        )}
        <button onClick={save} style={{ marginTop:9, padding:"7px 14px", borderRadius:9, border:"none", background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer" }}>💾 Salva</button>
      </div>
    );
  };

  // ── Editor inline: equivalenze ──
  // I grammi sono l'hub unico: ogni unità non di peso/volume rilevata nel
  // ricettario per questa voce (ingrediente singolo, o unione dei membri
  // per un aggregato) ha la propria riga "1 unità = X g". Le unità di
  // sistema (g/kg/ml/l/cl/dl) non compaiono: sono già convertibili senza
  // bisogno di un'equivalenza (vedi ⚖️ Conversioni di sistema).
  // Bozza locale (eqDraft) finché non premi Salva: digitare un fattore non
  // scrive subito in equivalences, altrimenti la card sparirebbe dalla lista
  // filtrata "Da gestire" al primo carattere, prima di finire di scrivere.
  const EqEditor = ({ draftKey, dataKey, isAgg, members }) => {
    const units = nonWeightUnitsFor(isAgg ? (members || []) : [dataKey]);
    const committedFactors = equivalences[dataKey]?.factors || {};
    const factors = eqDraft[draftKey] ?? committedFactors;
    const setFactor = (u, raw) => {
      const v = parseFloat(raw);
      const next = { ...factors };
      if (isNaN(v) || v <= 0) delete next[u]; else next[u] = v;
      setEqDraft(p => ({ ...p, [draftKey]: next }));
    };
    const save = () => {
      onSaveEquivalence(dataKey, { factors });
      toggleExpand(draftKey, "eq");
    };
    if (units.length === 0) {
      return (
        <div style={{ marginTop:8 }}>
          <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>Nessuna unità da convertire: questa voce usa solo unità di peso/volume già convertibili di default.</div>
        </div>
      );
    }
    return (
      <div style={{ marginTop:8 }}>
        {units.map(u => {
          const overridden = factors[u] > 0;
          const sysDefault = customUnits[u]?.grams;
          const displayValue = factors[u] ?? (sysDefault > 0 ? sysDefault : "");
          return (
            <div key={u} style={{ marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:F.ui, fontSize:12, color:th.appInk }}>
                <span style={{ flexShrink:0 }}>1 {unitLabel(u)} =</span>
                <input
                  type="number"
                  value={displayValue}
                  onChange={e => setFactor(u, e.target.value)}
                  placeholder="?"
                  style={{ width:70, padding:"7px 9px", border:`1.5px solid ${overridden ? th.appAccent : th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", textAlign:"center" }}
                />
                <span style={{ flexShrink:0 }}>g</span>
              </div>
              {!overridden && sysDefault > 0 && (
                <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:2 }}>predefinito di sistema — modifica per personalizzarlo qui</div>
              )}
            </div>
          );
        })}
        <button onClick={save} style={{ marginTop:3, padding:"7px 14px", borderRadius:9, border:"none", background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:11.5, fontWeight:700, cursor:"pointer" }}>💾 Salva</button>
      </div>
    );
  };

  // ── Scheda unificata (ingrediente o aggregato) ──
  const ItemCard = ({ name, display, isAgg, agg, selectable, selected, onToggleSelect }) => {
    const key = isAgg ? "agg_" + agg.id : name;
    // Chiave per nutrizione/equivalenze: agg.id per un aggregato (MAI il
    // nome normalizzato, per non collidere con un ingrediente omonimo),
    // altrimenti l'ID ingrediente come oggi.
    const dataKey = isAgg ? agg.id : name;
    // Come per nutrizione/equivalenze: categorie proprie se ci sono,
    // altrimenti ereditate dall'aggregato di appartenenza (se ne ha).
    const catsResult = isAgg
      ? { categories: agg.categories || [], inheritedFrom: null }
      : effectiveCategories(name, aggregates, ingredientCategories, sourceByIngredient);
    const cats = catsResult.categories;
    const catsInheritedFrom = catsResult.inheritedFrom;
    // Chiave nutrizionale secondo l'ordine di priorità delle fonti: se
    // punta a un aggregato invece che all'ingrediente stesso, la card
    // deve indicare da dove eredita invece di segnalare un falso allarme.
    const nutriKey = !isAgg ? effectiveNutritionKey(name, aggregates, nutritionMap, sourceByIngredient) : dataKey;
    const nutriInheritedFrom = (!isAgg && nutriKey !== name) ? (aggregates || []).find(a => a.id === nutriKey) : null;
    const nutri = nutriStatusOf(nutriKey);
    // Ordine di priorità delle fonti (ingrediente + suoi aggregati): solo
    // per un ingrediente che appartiene ad almeno un aggregato (priority
    // ha più di un elemento).
    const priority = !isAgg ? sourcePriorityFor(name, aggregates, sourceByIngredient) : [];
    const sourceLabel = (src) => src === "ingredient" ? display : ((aggregates || []).find(a => a.id === src)?.name || "?");
    const moveSource = (idx, dir) => {
      const target = idx + dir;
      if (target < 0 || target >= priority.length) return;
      const next = [...priority];
      [next[idx], next[target]] = [next[target], next[idx]];
      onSetSourcePriority(name, next);
    };
    const linked = recipesFor(isAgg ? (agg.members || []) : [name]);
    const exp = expanded[key];
    // ── Segnalazioni: dove è utile agire ──
    const RED = "#C4593A";
    const issueNoCat = cats.length === 0;
    const issueNoNutri = !nutri.ok;
    // Vedi eqIssueFor: un'unità con cui l'ingrediente compare da qualche
    // parte nel ricettario non è un'unità di sistema e non ha un fattore
    // verso i grammi definito qui.
    const memberIds = isAgg ? (agg.members || []) : [name];
    const issueNoEq = eqIssueFor(dataKey, memberIds);
    const hasIssues = issueNoCat || issueNoNutri || issueNoEq;
    // Unità rilevanti per il riepilogo ⚖️ compatto: tutte, non solo quelle già definite,
    // così un'unità mancante si vede subito senza dover aprire l'editor.
    const eqUnits = nonWeightUnitsFor(memberIds);
    const eqFactors = equivalences[dataKey]?.factors || {};

    const attrBtn = (label, kind, active) => (
      <button onClick={() => toggleExpand(key, kind)} style={{
        padding:"6px 10px", borderRadius:10,
        border:`1.5px solid ${exp === kind ? th.appAccent : th.appBorder}`,
        background: exp === kind ? th.appAccent + "18" : "transparent",
        color: exp === kind ? th.appAccent : th.appFaded,
        fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer",
      }}>{label}</button>
    );

    return (
      <>
      <div style={{ background:th.appCard, border:`1.5px solid ${hasIssues ? RED + "66" : th.appBorder}`, borderRadius:13, padding:"12px 13px", marginBottom:9 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {selectable && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              style={{ width:18, height:18, flexShrink:0, cursor:"pointer" }}
            />
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:F.body, fontSize:14.5, fontWeight:700, color:th.appInk, textAlign:"center" }}>
              {isAgg && <span style={{ color:th.appAccent }}>⊕ </span>}
              {display.charAt(0).toUpperCase() + display.slice(1)}
              {hasIssues && <span style={{ fontSize:11, marginLeft:5 }}>⚠️</span>}
            </div>
            {isAgg && <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:1 }}>{(agg.members||[]).map(dictName).join(" · ")}</div>}
          </div>
          {ui.id === "schedario" && (
            // Tre pastiglie di stato — verdi se il dato c'è, tratteggiate se
            // manca (README §Screens 8). Leggono gli stessi issueNoCat/
            // issueNoNutri/issueNoEq già calcolati sopra: nessuna regola nuova.
            <div style={{ display:"flex", gap:3, flexShrink:0 }}>
              {[["tag", !issueNoCat], ["nutrizione", !issueNoNutri], ["bilancia", !issueNoEq]].map(([icon, ok], i) => (
                <span key={i} title={icon} style={{
                  width:22, height:22, borderRadius:7,
                  border: ok ? "none" : `1.5px dashed ${th.appAccent}`,
                  background: ok ? "#6B8C6E29" : "transparent",
                  color: ok ? "#6B8C6E" : th.appAccent,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}><Icon name={icon} size={12}/></span>
              ))}
            </div>
          )}
          {isAgg ? (
            <button onClick={() => setEditing({ kind:"aggregate", id:agg.id, name:agg.name, members:[...(agg.members||[])], categories:[...(agg.categories||[])] })} style={{ background:"none", border:"none", fontSize:14, cursor:"pointer", color:th.appFaded, flexShrink:0, padding:"2px 4px" }}>✏️</button>
          ) : (onRenameIngredient && (
            <button
              title="Rinomina ingrediente"
              onClick={() => {
                setRenameDraft(p => ({ ...p, [name]: display }));
                setRenameErr(null);
                toggleExpand(key, "rename");
              }}
              style={{ background:"none", border:"none", fontSize:14, cursor:"pointer", color:th.appFaded, flexShrink:0, padding:"2px 4px" }}
            >✏️</button>
          ))}
        </div>

        {/* Appartenenza ad aggregati (sola lettura) + accesso all'ordine di priorità */}
        {priority.length > 1 && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, lineHeight:1.4 }}>
              È presente nei seguenti aggregati:{" "}
              <span style={{ color:th.appInk, fontWeight:600 }}>
                {priority.filter(src => src !== "ingredient")
                  .map(src => (aggregates || []).find(a => a.id === src)?.name)
                  .filter(Boolean).join(", ")}
              </span>
            </div>
            <button
              onClick={() => setPriorityPopupFor(name)}
              style={{
                display:"inline-flex", alignItems:"center", gap:6, marginTop:6,
                padding:"6px 10px", borderRadius:10,
                border:`1.5px solid ${th.appBorder}`, background:"transparent",
                color:th.appFaded, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer",
              }}
            >
              <span style={{ display:"flex", flexDirection:"column", alignItems:"center", lineHeight:1 }}>
                <span style={{ fontSize:7 }}>1</span>
                <span style={{ fontSize:12, margin:"-1px 0" }}>↕</span>
                <span style={{ fontSize:7 }}>2</span>
              </span>
              Gestisci priorità
            </button>
          </div>
        )}

        {/* Attributi */}
        <div style={{ marginTop:7, display:"flex", flexDirection:"column", gap:3 }}>
          <div style={{ fontFamily:F.ui, fontSize:10.5, color: issueNoCat ? RED : th.appFaded, fontWeight: issueNoCat ? 600 : 400 }}>
            <AppIcon emoji="🏷️" icon="tag" size={10.5} /> {cats.length > 0 ? (
              <>{catsInheritedFrom && <>eredita da «{catsInheritedFrom.name}» · </>}{cats.map((c, i) => {
                const cc = catOf(c);
                return (
                  <span key={c}>
                    {i > 0 && " · "}
                    {cc ? <span style={{ display:"inline-flex", alignItems:"center", gap:3 }}><SectionCategoryIcon item={cc} size={10.5} />{cc.label}</span> : c}
                  </span>
                );
              })}</>
            ) : "senza categoria — assegnane una"}
          </div>
          <div style={{ fontFamily:F.ui, fontSize:10.5, color: nutri.ok ? th.appFaded : RED, fontWeight: nutri.ok ? 400 : 600 }}>
            🍎 {nutri.ok ? (
              nutriInheritedFrom ? (
                <>eredita da «{nutriInheritedFrom.name}» · <span style={{ opacity:0.8 }}>{macroLine(nutri.values, {fib:false})}</span></>
              ) : (
                <>{nutri.label}{nutri.auto ? " (auto)" : ""} · <span style={{ opacity:0.8 }}>{macroLine(nutri.values, {fib:false})}</span></>
              )
            ) : "non collegato al database valori nutrizionali"}
          </div>
          <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>
            ⚖️ {eqUnits.length === 0 ? "nessuna equivalenza da definire" : eqUnits.map((u, i) => {
              const overridden = eqFactors[u] > 0;
              const f = overridden ? eqFactors[u] : customUnits[u]?.grams;
              return (
                <span key={u} style={{ color: f > 0 ? th.appFaded : RED, fontWeight: f > 0 ? 400 : 700 }}>
                  {i > 0 && " · "}1 {unitLabel(u)} = {f > 0 ? `${String(f).replace(".", ",")} g${!overridden ? " (default)" : ""}` : "?"}
                </span>
              );
            })}
          </div>
          <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>
            📖 {linked.length > 0 ? linked.map(r => r.title).join(", ") : "in nessuna ricetta"}
          </div>
        </div>

        {/* Pulsanti modifica */}
        <div style={{ display:"flex", gap:6, marginTop:9, flexWrap:"wrap" }}>
          {attrBtn("🏷️ Categorie", "cat")}
          {attrBtn("🍎 Nutrizione", "nutri")}
          {attrBtn("⚖️ Equivalenze", "eq")}
        </div>

        {exp === "cat" && CatEditor({ draftKey:key, dataKey, current:cats, isAgg, agg })}
        {exp === "nutri" && NutriEditor({ draftKey:key, dataKey, displayName:display })}
        {exp === "eq" && EqEditor({ draftKey:key, dataKey, isAgg, members:agg?.members })}
        {exp === "rename" && !isAgg && (
          <div style={{ marginTop:8 }}>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:0.5, color:th.appFaded, textTransform:"uppercase", marginBottom:5 }}>Nuovo nome — aggiornato in tutte le ricette</div>
            <div style={{ display:"flex", gap:6 }}>
              <input
                value={renameDraft[name] ?? display}
                autoFocus
                onChange={e => { setRenameDraft(p => ({ ...p, [name]: e.target.value })); setRenameErr(null); }}
                onKeyDown={e => {
                  if (e.key !== "Enter") return;
                  if (onRenameIngredient(name, renameDraft[name] ?? display)) toggleExpand(key, "rename");
                  else setRenameErr(name);
                }}
                style={{ flex:1, padding:"9px 11px", border:`1.5px solid ${renameErr === name ? "#C4593A" : th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", minWidth:0 }}
              />
              <button
                onClick={() => {
                  if (onRenameIngredient(name, renameDraft[name] ?? display)) toggleExpand(key, "rename");
                  else setRenameErr(name);
                }}
                style={{ padding:"9px 14px", borderRadius:9, border:"none", background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}
              >Salva</button>
            </div>
            {renameErr === name && (
              <div style={{ fontFamily:F.ui, fontSize:10.5, color:"#C4593A", marginTop:5, fontWeight:600 }}>Nome non valido o già in uso da un altro ingrediente.</div>
            )}
            <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:5, lineHeight:1.4 }}>Categorie, nutrizione ed equivalenze restano collegate: sono agganciate all'ingrediente, non al nome.</div>
          </div>
        )}
      </div>

      {/* Popup: ordine di priorità delle fonti */}
      {priorityPopupFor === name && (
        <div
          onClick={() => setPriorityPopupFor(null)}
          style={{ position:"absolute", inset:0, zIndex:500, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            width:"100%", maxWidth:360, background:th.appBg, borderRadius:18, padding:"18px",
            boxShadow:"0 10px 40px rgba(0,0,0,0.4)",
          }}>
            <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:4 }}>Ordine di priorità</div>
            <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginBottom:14, lineHeight:1.4 }}>
              Per categoria, nutrizione ed equivalenze si usa la prima fonte di questa lista che possiede il dato.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {priority.map((src, i) => (
                <div key={src} style={{
                  display:"flex", alignItems:"center", gap:8,
                  border:`1.5px solid ${i === 0 ? th.appAccent : th.appBorder}`,
                  borderRadius:11, padding:"9px 11px", background:th.appCard,
                }}>
                  <span style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, flexShrink:0, width:14 }}>{i + 1}.</span>
                  <span style={{
                    flex:1, minWidth:0, overflowWrap:"break-word", wordBreak:"break-word",
                    fontFamily:F.body, fontSize:13.5, fontWeight: i === 0 ? 700 : 500,
                    color: i === 0 ? th.appAccent : th.appInk,
                  }}>
                    {src !== "ingredient" && <span style={{ color: i === 0 ? th.appAccent : th.appFaded }}>⊕ </span>}
                    {sourceLabel(src).charAt(0).toUpperCase() + sourceLabel(src).slice(1)}
                  </span>
                  <button
                    onClick={() => moveSource(i, -1)}
                    disabled={i === 0}
                    style={{ background:"none", border:"none", fontSize:14, padding:"4px 6px", color:th.appFaded, flexShrink:0, cursor: i === 0 ? "default" : "pointer", opacity: i === 0 ? 0.3 : 1 }}
                  >▲</button>
                  <button
                    onClick={() => moveSource(i, 1)}
                    disabled={i === priority.length - 1}
                    style={{ background:"none", border:"none", fontSize:14, padding:"4px 6px", color:th.appFaded, flexShrink:0, cursor: i === priority.length - 1 ? "default" : "pointer", opacity: i === priority.length - 1 ? 0.3 : 1 }}
                  >▼</button>
                </div>
              ))}
            </div>
            <button onClick={() => setPriorityPopupFor(null)} style={{
              width:"100%", marginTop:14, padding:"11px",
              border:`1.5px solid ${th.appBorder}`, borderRadius:12,
              background:"transparent", color:th.appFaded,
              fontFamily:F.ui, fontSize:12, cursor:"pointer",
            }}>Fatto</button>
          </div>
        </div>
      )}
      </>
    );
  };

  // ── Ingredienti non utilizzati: selezione + eliminazione a due passaggi ──
  const toggleUnusedSelect = (ingId) => setSelectedUnused(prev => {
    const next = new Set(prev);
    if (next.has(ingId)) next.delete(ingId); else next.add(ingId);
    return next;
  });
  const confirmDeleteSelectedUnused = () => {
    onDeleteIngredients && onDeleteIngredients(Array.from(selectedUnused));
    setSelectedUnused(new Set());
    setConfirmDeleteUnused(false);
  };

  // ── Riepilogo in cima (quaderno/schedario, vedi README §Screens 8) —
  // riusa issuesFor, la STESSA regola di segnalazione di ItemCard e dei
  // filtri "Da gestire": non è un doppione, sono gli stessi tre contatori.
  const summaryCounts = { cat:0, nutri:0, eq:0, any:0 };
  aggregates.forEach(a => {
    const iss = issuesFor(a.id, true, a);
    if (iss.cat) summaryCounts.cat++;
    if (iss.nutri) summaryCounts.nutri++;
    if (iss.eq) summaryCounts.eq++;
    if (iss.cat || iss.nutri || iss.eq) summaryCounts.any++;
  });
  allIngs.forEach(i => {
    const iss = issuesFor(i.name, false, null);
    if (iss.cat) summaryCounts.cat++;
    if (iss.nutri) summaryCounts.nutri++;
    if (iss.eq) summaryCounts.eq++;
    if (iss.cat || iss.nutri || iss.eq) summaryCounts.any++;
  });
  const summaryTotal = aggregates.length + allIngs.length;

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}

      <ScreenHeader
        section="organizza"
        title="Organizza Ingredienti"
        subtitle={`${summaryTotal} ingredienti`}
        onBack={onBack}
        onHome={onLanding}
      />

      {ui.id === "classico" && onBack && (
        <div style={{ padding:"12px 20px 0" }}>
          <button onClick={onBack} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
        </div>
      )}

      {/* ── Riepilogo (quaderno/schedario) — i tre contatori SONO i filtri
          "Da gestire" già esistenti, non un doppione: toccarne uno attiva
          issueMode + quel solo alertFilter. ── */}
      {ui.id !== "classico" && (
        <div style={{ padding:"14px 20px 0" }}>
          <div style={{ fontFamily:F.ui, fontSize:12, color:ui.faded, marginBottom:10 }}>
            Su <b style={{ color:ui.ink }}>{summaryTotal}</b> ingredienti, <b style={{ color:ui.ink }}>{summaryCounts.any}</b> hanno un dato mancante
          </div>
          <div style={{ display:"flex", gap:8, marginBottom:4 }}>
            {[["cat","Categoria",summaryCounts.cat],["nutri","Nutrizione",summaryCounts.nutri],["eq","Unità",summaryCounts.eq]].map(([type, label, count]) => (
              <button key={type} onClick={() => { setIssueMode(true); setAlertFilter([type]); }} style={{
                flex:1, padding:"8px 6px", borderRadius:ui.radius.control,
                border:`1px solid ${ui.hairlineStrong}`, background: ui.id==="schedario" ? ui.card : "transparent",
                cursor:"pointer", textAlign:"center",
              }}>
                <div style={{ fontFamily:F.mono, fontSize:16, fontWeight:700, color: count>0 ? th.appAccent : ui.faded }}>{count}</div>
                <div style={{ fontFamily:F.ui, fontSize:9, color:ui.faded, textTransform:"uppercase", letterSpacing:0.5, marginTop:1 }}>{label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── GESTISCI DATABASE ── */}
      <div style={{ padding:"14px 20px 0" }}>
        <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appAccent, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>Gestisci database</div>
      </div>
      {ui.id === "classico" ? (
        <div style={{ padding:"0 18px 4px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {[
            ["🍇", "Database aggregati", "#5A8C3A", () => { setManageAggs(true); setOpenAggSections({ existing:true, suggested:false }); }],
            ["🏷️", "Database categorie", "#5A3A9A", () => setManageCats(true)],
            ["⚖️", "Conversioni di sistema", "#2D8C6B", () => setManageEq(true)],
            ["🍎", "Database valori nutrizionali", "#C4593A", () => setManageNutri(true)],
          ].map(([icon, title, color, go]) => (
            <button key={title} onClick={go} style={{
              background:th.appCard, border:`1.5px solid ${th.appBorder}`, borderRadius:14,
              padding:"13px 8px", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:7,
            }}>
              <span style={{
                width:40, height:40, borderRadius:"50%",
                border:`1.5px solid ${color}55`, background:`${color}1C`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:20, lineHeight:1,
              }}>{icon}</span>
              <span style={{ fontFamily:F.ui, fontSize:10.5, fontWeight:700, color:th.appInk, textAlign:"center", lineHeight:1.3 }}>{title}</span>
            </button>
          ))}
        </div>
      ) : (
        // quaderno/schedario: niente colori arbitrari — icone SVG monocromatiche,
        // conteggio a destra. Indice di righe in quaderno, griglia 2×2 in schedario.
        <div style={{
          padding:"0 18px 4px",
          display: ui.id==="schedario" ? "grid" : "flex",
          gridTemplateColumns: ui.id==="schedario" ? "1fr 1fr" : undefined,
          flexDirection: ui.id==="quaderno" ? "column" : undefined,
          gap: ui.id==="schedario" ? 8 : 0,
        }}>
          {[
            ["uva", "Database aggregati", aggregates.length, () => { setManageAggs(true); setOpenAggSections({ existing:true, suggested:false }); }],
            ["tag", "Database categorie", categoryList.length, () => setManageCats(true)],
            ["bilancia", "Conversioni di sistema", Object.keys(customUnits).length, () => setManageEq(true)],
            ["nutrizione", "Valori nutrizionali", customFoods.length, () => setManageNutri(true)],
          ].map(([icon, title, count, go]) => (
            ui.id === "schedario" ? (
              <button key={title} onClick={go} style={{
                ...ui.cardStyle, padding:"13px 10px", cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"flex-start", gap:8,
              }}>
                <Icon name={icon} size={18} style={{ color:ui.ink }}/>
                <span style={{ fontFamily:F.ui, fontSize:11, fontWeight:700, color:ui.ink, textAlign:"left", lineHeight:1.3 }}>{title}</span>
                <span style={{ fontFamily:F.mono, fontSize:11, color:ui.faded }}>{count}</span>
              </button>
            ) : (
              <button key={title} onClick={go} style={{
                display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"11px 0", background:"none", border:"none", borderBottom:`1px solid ${ui.hairline}`,
                cursor:"pointer", textAlign:"left",
              }}>
                <Icon name={icon} size={17} style={{ color:ui.faded, flexShrink:0 }}/>
                <span style={{ flex:1, fontFamily:F.ui, fontSize:13, color:ui.ink }}>{title}</span>
                <span style={{ fontFamily:F.mono, fontSize:11, color:ui.faded }}>{count}</span>
                <span style={{ color:ui.faded, fontSize:14 }}>›</span>
              </button>
            )
          ))}
        </div>
      )}

      {/* ── GESTISCI INGREDIENTI ── */}
      <div style={{ padding:"16px 20px 0" }}>
        <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appAccent, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>Gestisci ingredienti</div>
      </div>
      {/* Ricerca */}
      <div style={{ padding:"0 18px 0" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", background:th.appCard, border:`1.5px solid ${search ? th.appAccent : th.appBorder}`, borderRadius:12, padding:"9px 14px" }}>
          <span style={{ fontSize:15 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca ingrediente o aggregato…"
            style={{ flex:1, border:"none", background:"transparent", outline:"none", fontFamily:F.body, fontSize:13.5, color:th.appInk, minWidth:0 }}
          />
          {search && <button onClick={() => setSearch("")} style={{ background:"none", border:"none", color:th.appFaded, cursor:"pointer", fontSize:14, padding:0 }}>×</button>}
        </div>
      </div>

      {/* Filtro per fonte: una ricetta specifica, o la lista spesa corrente */}
      <div style={{ padding:"8px 18px 0" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", background:th.appCard, border:`1.5px solid ${filterRecipeId ? th.appAccent : th.appBorder}`, borderRadius:12, padding:"9px 14px" }}>
          <span style={{ fontSize:15 }}>{filterIsShopping ? "🛒" : "📖"}</span>
          <select
            value={filterRecipeId}
            onChange={e => setFilterRecipeId(e.target.value)}
            style={{ flex:1, border:"none", background:"transparent", outline:"none", fontFamily:F.body, fontSize:13.5, color: filterRecipeId ? th.appInk : th.appFaded, minWidth:0 }}
          >
            <option value="">Filtra per fonte…</option>
            <option value={SHOPPING_SOURCE}>🛒 Lista spesa</option>
            {[...recipes].sort((a, b) => a.title.localeCompare(b.title, "it")).map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
          {filterRecipeId && <button onClick={() => setFilterRecipeId("")} style={{ background:"none", border:"none", color:th.appFaded, cursor:"pointer", fontSize:14, padding:0 }}>×</button>}
        </div>
      </div>

      {/* Filtro: tutti / solo da gestire */}
      <div style={{ padding:"8px 18px 0", display:"flex", gap:6 }}>
        {[[false, "Tutti"], [true, "⚠️ Da gestire"]].map(([val, label]) => {
          const on = issueMode === val;
          return (
            <button
              key={label}
              onClick={() => {
                setIssueMode(val);
                if (val) setAlertFilter(["cat","nutri","eq"]);
              }}
              style={{
                flex:1, padding:"8px 10px", borderRadius:20,
                border:`1.5px solid ${on ? (val ? "#C4593A" : th.appAccent) : th.appBorder}`,
                background: on ? (val ? "#C4593A18" : th.appAccent + "18") : "transparent",
                color: on ? (val ? "#C4593A" : th.appAccent) : th.appFaded,
                fontFamily:F.ui, fontSize:12, fontWeight:600, cursor:"pointer",
              }}
            >{label}</button>
          );
        })}
      </div>

      {/* Filtro per tipo di alert — visibile solo in "Da gestire" */}
      {issueMode && (
        <div style={{ padding:"8px 18px 0", display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", justifyContent:"center" }}>
          {[["cat","🏷️ Categoria"],["nutri","🍎 Nutrizione"],["eq","⚖️ Equivalenze"]].map(([type, label]) => {
            const on = alertFilter.includes(type);
            return (
              <button
                key={type}
                onClick={() => setAlertFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                style={{
                  flexShrink:0, padding:"7px 11px", borderRadius:20,
                  border:`1.5px solid ${on ? "#C4593A" : th.appBorder}`,
                  background: on ? "#C4593A18" : "transparent",
                  color: on ? "#C4593A" : th.appFaded,
                  fontFamily:F.ui, fontSize:11.5, fontWeight:600, cursor:"pointer",
                }}
              >{label}</button>
            );
          })}
        </div>
      )}

      {/* Lista ingredienti/aggregati */}
      <div style={{ flex:1, overflowY:"auto", padding:"10px 18px 40px" }}>
        {visibleAggs.length > 0 && (
          <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appAccent, textTransform:"uppercase", fontWeight:700, margin:"2px 0 7px" }}>Aggregati</div>
        )}
        {visibleAggs.map(agg => (
          <React.Fragment key={"agg_"+agg.id}>
            {ItemCard({ name:normName(agg.name), display:agg.name, isAgg:true, agg })}
          </React.Fragment>
        ))}
        {visibleIngs.length > 0 && (
          <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appFaded, textTransform:"uppercase", fontWeight:700, margin:"10px 0 7px" }}>Ingredienti</div>
        )}
        {visibleIngs.map(({ name, display }) => (
          <React.Fragment key={name}>
            {ItemCard({ name, display, isAgg:false })}
          </React.Fragment>
        ))}
        {visibleAggs.length === 0 && visibleIngs.length === 0 && (
          <div style={{ textAlign:"center", padding:"30px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>Nessun risultato</div>
        )}

        {/* Ingredienti non referenziati da nessuna ricetta del libro attivo —
            dati collegati (categorie/nutrizione/equivalenze/aggregati) intatti,
            solo spostati qui finché non tornano usati o vengono eliminati. */}
        {unusedIngs.length > 0 && (
          <div style={{ marginTop:18 }}>
            <button onClick={() => setUnusedOpen(o => !o)} style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
              background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12,
              padding:"10px 12px", marginBottom:8, cursor:"pointer",
            }}>
              <span style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appFaded, textTransform:"uppercase", fontWeight:700 }}>
                🗑️ Ingredienti non utilizzati ({unusedIngs.length})
              </span>
              <span style={{ color:th.appFaded, fontSize:12 }}>{unusedOpen ? "▾" : "▸"}</span>
            </button>
            {unusedOpen && (
              <>
                {unusedIngs.map(({ name, display }) => (
                  <React.Fragment key={name}>
                    {ItemCard({
                      name, display, isAgg:false,
                      selectable:true, selected:selectedUnused.has(name),
                      onToggleSelect:() => toggleUnusedSelect(name),
                    })}
                  </React.Fragment>
                ))}
                {selectedUnused.size > 0 && (
                  confirmDeleteUnused ? (
                    <div style={{ background:"#C4593A18", border:"1.5px solid #C4593A66", borderRadius:12, padding:"12px 14px", marginTop:6, textAlign:"center" }}>
                      <div style={{ fontFamily:F.ui, fontSize:12.5, color:th.appInk, marginBottom:10 }}>
                        Confermi l'eliminazione di {selectedUnused.size} ingrediente{selectedUnused.size === 1 ? "" : "i"}? L'azione non è reversibile.
                      </div>
                      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
                        <button onClick={() => setConfirmDeleteUnused(false)} style={{ padding:"9px 16px", borderRadius:10, border:`1.5px solid ${th.appBorder}`, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, fontWeight:600, cursor:"pointer" }}>Annulla</button>
                        <button onClick={confirmDeleteSelectedUnused} style={{ padding:"9px 16px", borderRadius:10, border:"none", background:"#C4593A", color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer" }}>Conferma eliminazione</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteUnused(true)} style={{ width:"100%", marginTop:6, padding:"11px", border:"1.5px solid #C4593A66", borderRadius:12, background:"#C4593A18", color:"#C4593A", fontFamily:F.ui, fontSize:12.5, fontWeight:700, cursor:"pointer" }}>
                      🗑️ Elimina selezionati ({selectedUnused.size})
                    </button>
                  )
                )}
              </>
            )}
          </div>
        )}
      </div>

      {ui.navPosition === "bottom" && (
        <BottomNav
          activeScreen="organize"
          onRecipes={onRecipes}
          onMemories={onMemories}
          onFridge={onFridge}
          onShopping={onShopping}
        />
      )}
    </div>
  );
}
