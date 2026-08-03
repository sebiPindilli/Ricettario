import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F, INGREDIENT_CATEGORIES } from "../data/constants.js";
import { NUTRITION_DB } from "../data/nutrition.js";
import {
  buildIngredientDict, ingDictIndex, sortCategoriesAltroLast,
  normName, uid, macroLine, resolveIngId, flattenIngredients,
  UNIT_ALIASES, WEIGHT_UNITS, unitLabel, normUnit,
} from "../utils/helpers.js";
import { effectiveCategories, effectiveNutritionKey, sourcePriorityFor } from "../utils/aggregates.js";

// ══════════════════════════════════════════════════════════════
// SCREEN: ORGANIZZA INGREDIENTI (sotto Svuota Frigo)
// ══════════════════════════════════════════════════════════════
export default function OrganizeIngredientsScreen({
  nav, recipes, aggregates, ingredientCategories, sourceByIngredient = {}, onSetSourcePriority,
  onSetIngredientCats, onSaveAggregate, onDeleteAggregate, onBack,
  categoryList = INGREDIENT_CATEGORIES, onSaveCategory, onDeleteCategory,
  equivalences = {}, onSaveEquivalence,
  nutritionMap = {}, onSaveNutritionMapping,
  customFoods = [], onSaveCustomFood, onDeleteCustomFood,
  ingredientDict = null, onRenameIngredient,
  initialFilterRecipeId = null, initialOnlyIssues = false,
}) {
  const th = useTheme();
  const [editing, setEditing] = useState(null); // null | {kind:"ingredient"|"aggregate", ...}
  const [manageCats, setManageCats] = useState(false); // gestione categorie (nome/icona)
  const [manageEq, setManageEq] = useState(false);     // gestione equivalenze unità
  const [manageNutri, setManageNutri] = useState(false); // sfoglia database alimenti (ufficiale + personalizzati)
  const [nutriSearch, setNutriSearch] = useState({});    // nome ingrediente → testo ricerca aperta
  const [dbSearch, setDbSearch] = useState("");          // ricerca nel database alimenti
  const [manageAggs, setManageAggs] = useState(false);   // database aggregati (lista)
  const [foodForm, setFoodForm] = useState(null);        // form alimento personalizzato {id?, name, ...}
  const [expanded, setExpanded] = useState({});          // nome → "cat"|"nutri"|"eq"|null (editor inline aperto)
  const [newCat, setNewCat] = useState({ emoji:"", label:"" });
  const [renameDraft, setRenameDraft] = useState({});   // ingId → testo in modifica (stato nel parent: ItemCard viene rimontata)
  const [renameErr, setRenameErr] = useState(null);     // ingId con nome rifiutato
  const [emojiPickerFor, setEmojiPickerFor] = useState(null); // cat.id | "new" | null
  const [priorityPopupFor, setPriorityPopupFor] = useState(null); // ingId di cui è aperto il popup ordine priorità, o null

  const CATEGORY_EMOJIS = [
    "🧂","🌾","🥕","🥩","🧀","🫘","🫒","🌿","🍷","🍫","📦","🏷️",
    "🍞","🥖","🍝","🍚","🥔","🍅","🥦","🥬","🍎","🍋","🍇","🍓",
    "🥚","🐟","🦐","🍗","🥓","🥛","🧈","🍯","🍬","🍰","☕","🍵",
    "🥜","🌰","🧄","🧅","🌶","🥫","🍄","🫙","🧊","🍾","🥤","🍪",
  ];
  const [search, setSearch] = useState("");
  const [filterRecipeId, setFilterRecipeId] = useState(initialFilterRecipeId != null ? String(initialFilterRecipeId) : "");
  const [onlyIssues, setOnlyIssues] = useState(!!initialOnlyIssues);

  // R2 — fonte unica: il dizionario ingredienti (id → nome visualizzato)
  const dictM = React.useMemo(
    () => ingredientDict || buildIngredientDict(recipes),
    [ingredientDict, recipes]
  );
  const dictIdx = React.useMemo(() => ingDictIndex(dictM), [dictM]);
  const dictName = (id) => dictM[id] || id;
  // Voci del dizionario ordinate per nome (name = ID, display = nome)
  const allDictEntries = React.useMemo(
    () => Object.entries(dictM)
      .map(([id, display]) => ({ name: id, display }))
      .sort((a, b) => a.display.localeCompare(b.display, "it")),
    [dictM]
  );

  const catLabel = (id) => categoryList.find(c => c.id === id);
  const orderedCats = sortCategoriesAltroLast(categoryList);

  // ── Database aggregati: lista + crea/modifica ──
  if (manageAggs) {
    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setManageAggs(false)} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>⊕ Database aggregati</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>gruppi di ingredienti equivalenti</div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"4px 18px 40px" }}>
          {aggregates.map(agg => (
            <div key={agg.id} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12, padding:"11px 13px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:F.body, fontSize:14.5, fontWeight:700, color:th.appInk }}>⊕ {agg.name}</div>
                  <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:2 }}>{(agg.members||[]).map(dictName).join(" · ")}</div>
                </div>
                <button onClick={() => { setManageAggs(false); setEditing({ kind:"aggregate", id:agg.id, name:agg.name, members:[...(agg.members||[])], categories:[...(agg.categories||[])] }); }} style={{ background:th.appInk, border:"none", borderRadius:9, padding:"7px 11px", color:"#fff", fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>✏️ Modifica</button>
              </div>
            </div>
          ))}
          {aggregates.length === 0 && (
            <div style={{ textAlign:"center", padding:"26px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>Nessun aggregato ancora creato</div>
          )}
          <button onClick={() => { setManageAggs(false); setEditing({ kind:"aggregate", name:"", members:[], categories:[] }); }} style={{
            width:"100%", padding:"12px", borderRadius:12, border:`1.5px dashed ${th.appBorder}`,
            background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12.5, fontWeight:600, cursor:"pointer", marginTop:4,
          }}>＋ Nuovo aggregato</button>
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
      const saveFood = () => {
        const num = (v) => { const n = parseFloat(String(v).replace(",", ".")); return isNaN(n) ? 0 : n; };
        onSaveCustomFood({
          id: foodForm.id || uid("cf"),
          cat: "Personalizzati",
          custom: true,
          name: foodForm.name.trim(),
          source: (foodForm.source || "").trim() || "personalizzata",
          kcal: num(foodForm.kcal), carb: num(foodForm.carb), sug: num(foodForm.sug),
          prot: num(foodForm.prot), fat: num(foodForm.fat), sat: num(foodForm.sat),
          fib: num(foodForm.fib), salt: num(foodForm.salt),
        });
        setFoodForm(null);
      };
      return (
        <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
          {nav}
          <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setFoodForm(null)} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Annulla</button>
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

  // ── Gestione equivalenze: ingredienti con unità diverse tra ricette ──
  if (manageEq) {
    // Rileva automaticamente: nome pulito → insieme delle unità trovate
    const unitScan = new Map();
    recipes.forEach(r => {
      flattenIngredients(r.ingredients).forEach(ing => {
        if (ing.qty == null) return; // senza quantità: non serve equivalenza
        const clean = resolveIngId(ingDictIndex(dictM), ing.name); // ID dizionario
        const unit = UNIT_ALIASES[(ing.unit || "").toLowerCase()] || (ing.unit || "").toLowerCase();
        if (!unitScan.has(clean)) unitScan.set(clean, new Set());
        unitScan.get(clean).add(unit);
      });
    });
    // Mostra: (a) ingredienti con 2+ unità diverse, (b) ingredienti con
    // qualsiasi unità non di peso (serve il fattore per lista spesa e nutrizione)
    const isWeight = (u) => u in WEIGHT_UNITS;
    const multiUnit = Array.from(unitScan.entries())
      .filter(([, units]) => units.size >= 2 || Array.from(units).some(u => !isWeight(u)))
      .map(([name, units]) => {
        const arr = Array.from(units).sort();
        // se serve la conversione a peso ma nessuna unità di peso è presente,
        // aggiungi "g" alle opzioni di base disponibili
        if (!arr.some(isWeight)) arr.unshift("g");
        return { name, units: arr };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "it"));

    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setManageEq(false)} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>⚖️ Equivalenze</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>ingredienti con unità diverse o da convertire in grammi</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"8px 18px 40px" }}>
          {multiUnit.length === 0 ? (
            <div style={{ textAlign:"center", padding:"36px 20px", color:th.appFaded, fontFamily:F.display, fontStyle:"italic", lineHeight:1.6 }}>
              Nessun ingrediente con unità diverse.<br/>
              <span style={{ fontFamily:F.ui, fontSize:11, fontStyle:"normal" }}>Quando la stessa cosa apparirà come "100g" in una ricetta e "2 cucchiai" in un'altra, la troverai qui.</span>
            </div>
          ) : multiUnit.map(({ name, units }) => {
            const eq = equivalences[name] || {};
            const base = eq.base && units.includes(eq.base) ? eq.base : (units.includes("g") ? "g" : units.includes("ml") ? "ml" : units[0]);
            const factors = eq.factors || {};
            const display = eq.display || "separate";
            const others = units.filter(u => u !== base);
            const save = (patch) => onSaveEquivalence(name, { base, factors, display, ...patch });

            return (
              <div key={name} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:F.body, fontSize:15, color:th.appInk, fontWeight:700 }}>{dictName(name).charAt(0).toUpperCase() + dictName(name).slice(1)}</span>
                  <span style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded }}>unità trovate: {units.map(unitLabel).join(" · ")}</span>
                </div>

                {/* Unità base */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontFamily:F.ui, fontSize:10, letterSpacing:0.5, color:th.appFaded, textTransform:"uppercase", flexShrink:0 }}>Unità base</span>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {units.map(u => (
                      <button key={u} onClick={() => save({ base:u, factors:{}, display:"separate" })} style={{
                        padding:"4px 10px", borderRadius:14,
                        border:`1.5px solid ${base===u ? th.appAccent : th.appBorder}`,
                        background: base===u ? th.appAccent : "transparent",
                        color: base===u ? "#fff" : th.appFaded,
                        fontFamily:F.ui, fontSize:10.5, cursor:"pointer",
                      }}>{unitLabel(u)}</button>
                    ))}
                  </div>
                </div>

                {/* Fattori di conversione */}
                {others.map(u => (
                  <div key={u} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6, fontFamily:F.ui, fontSize:12, color:th.appInk }}>
                    <span style={{ flexShrink:0 }}>1 {unitLabel(u)} =</span>
                    <input
                      type="number"
                      value={factors[u] ?? ""}
                      onChange={e => {
                        const v = parseFloat(e.target.value);
                        const next = { ...factors };
                        if (isNaN(v) || v <= 0) delete next[u]; else next[u] = v;
                        save({ factors: next });
                      }}
                      placeholder="?"
                      style={{ width:70, padding:"7px 9px", border:`1.5px solid ${factors[u] ? th.appAccent : th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", textAlign:"center" }}
                    />
                    <span style={{ flexShrink:0 }}>{unitLabel(base)}</span>
                  </div>
                ))}

                {/* Visualizzazione in lista spesa */}
                <div style={{ marginTop:8, paddingTop:8, borderTop:`1px dashed ${th.appBorder}` }}>
                  <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:0.5, color:th.appFaded, textTransform:"uppercase", marginBottom:5 }}>Mostra in Lista Spesa come</div>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {units.map(u => {
                      const enabled = u === base || factors[u] > 0;
                      const on = display === u;
                      return (
                        <button key={u} disabled={!enabled} onClick={() => save({ display:u })} title={!enabled ? "inserisci prima il fattore di conversione" : ""} style={{
                          padding:"5px 11px", borderRadius:14,
                          border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
                          background: on ? th.appAccent : "transparent",
                          color: on ? "#fff" : enabled ? th.appInk : th.appFaded,
                          fontFamily:F.ui, fontSize:10.5, fontWeight:600,
                          cursor: enabled ? "pointer" : "default",
                          opacity: enabled ? 1 : 0.5,
                        }}>{unitLabel(u)}</button>
                      );
                    })}
                    <button onClick={() => save({ display:"separate" })} style={{
                      padding:"5px 11px", borderRadius:14,
                      border:`1.5px solid ${display==="separate" ? th.appAccent : th.appBorder}`,
                      background: display==="separate" ? th.appAccent : "transparent",
                      color: display==="separate" ? "#fff" : th.appInk,
                      fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer",
                    }}>entrambe (senza conversione)</button>
                  </div>
                </div>
              </div>
            );
          })}
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
      onSaveCategory({ id, label, emoji: newCat.emoji.trim() || "🏷️" });
      setNewCat({ emoji:"", label:"" });
    };

    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setManageCats(false)} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>Gestisci categorie</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>nome e icona · "Ingredienti base" fissa in cima, "Altro" in fondo</div>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"8px 20px 40px" }}>
          {orderedCats.map(cat => {
            const isAltro = cat.id === "altro" || cat.id === "base"; // categorie fisse
            return (
              <div key={cat.id} style={{
                background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12,
                padding:"10px 12px", marginBottom:8,
                display:"flex", alignItems:"center", gap:8,
                opacity: isAltro ? 0.75 : 1,
              }}>
                <button
                  onClick={() => !isAltro && setEmojiPickerFor(cat.id)}
                  disabled={isAltro}
                  style={{ width:44, padding:"8px 4px", textAlign:"center", border:`1.5px solid ${emojiPickerFor===cat.id ? th.appAccent : th.appBorder}`, borderRadius:10, background:th.appBg, fontSize:16, cursor: isAltro ? "default" : "pointer", flexShrink:0 }}
                >{cat.emoji}</button>
                <input
                  value={cat.label}
                  onChange={e => !isAltro && onSaveCategory({ ...cat, label: e.target.value })}
                  disabled={isAltro}
                  style={{ flex:1, padding:"9px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", minWidth:0 }}
                />
                {isAltro ? (
                  <span style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded, flexShrink:0 }}>fissa</span>
                ) : (
                  <button onClick={() => onDeleteCategory(cat.id)} style={{
                    background:"none", border:"none", color:"#C4593A",
                    fontSize:17, cursor:"pointer", flexShrink:0, padding:"4px 6px",
                  }}>🗑️</button>
                )}
              </div>
            );
          }).flatMap((row, i, arr) => {
            // Note informative sotto le categorie fisse
            const cat = orderedCats[i];
            if (cat && cat.id === "base") {
              return [row, (
                <div key="base-note" style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, lineHeight:1.5, margin:"-2px 2px 10px 2px", fontStyle:"italic" }}>
                  ℹ️ Gli ingredienti di questa categoria vengono considerati di default come <b>presenti in dispensa</b>: in Svuota Frigo risultano già selezionati.
                </div>
              )];
            }
            if (cat && cat.id === "altro") {
              return [row, (
                <div key="altro-note" style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, lineHeight:1.5, margin:"-2px 2px 10px 2px", fontStyle:"italic" }}>
                  ℹ️ Gli ingredienti <b>senza categoria</b> vengono raggruppati qui in automatico.
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
                onClick={() => setEmojiPickerFor("new")}
                style={{ width:44, padding:"8px 4px", textAlign:"center", border:`1.5px solid ${emojiPickerFor==="new" ? th.appAccent : th.appBorder}`, borderRadius:10, background:th.appCard, fontSize:16, cursor:"pointer", flexShrink:0 }}
              >{newCat.emoji || "🏷️"}</button>
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:6 }}>
                {CATEGORY_EMOJIS.map(e => (
                  <button key={e} onClick={() => {
                    if (emojiPickerFor === "new") setNewCat(p => ({ ...p, emoji: e }));
                    else {
                      const cat = categoryList.find(c => c.id === emojiPickerFor);
                      if (cat) onSaveCategory({ ...cat, emoji: e });
                    }
                    setEmojiPickerFor(null);
                  }} style={{
                    aspectRatio:"1", borderRadius:10, border:`1px solid ${th.appBorder}`,
                    background:th.appCard, fontSize:20, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>{e}</button>
                ))}
              </div>
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
      setEditing(null);
    };

    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 8px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => setEditing(null)} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
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
                    }}>{cat.emoji} {cat.label}</button>
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
            <button onClick={() => { onDeleteAggregate(editing.id); setEditing(null); }} style={{
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
  const catsSorted = sortCategoriesAltroLast(categoryList);
  const catOf = (id) => catsSorted.find(c => c.id === id);

  const allIngs = allDictEntries; // [{name: ID, display: nome}] ordinati
  // unità usate per ingrediente (per l'editor equivalenze inline) — keyed per ID
  const unitsByIng = new Map();
  recipes.forEach(r => flattenIngredients(r.ingredients).forEach(ing => {
    if (ing.qty == null) return;
    const k = resolveIngId(dictIdx, ing.name);
    if (!unitsByIng.has(k)) unitsByIng.set(k, new Set());
    unitsByIng.get(k).add(normUnit(ing.unit));
  }));
  const recipesFor = (ids) => recipes.filter(r =>
    flattenIngredients(r.ingredients).some(i => ids.includes(resolveIngId(dictIdx, i.name))));

  const toggleExpand = (key, kind) => setExpanded(p => ({ ...p, [key]: p[key] === kind ? null : kind }));

  const nutriStatusOf = (ingId) => {
    const mapping = nutritionMap[ingId];
    if (mapping?.custom) return { ok:true, label:"valori manuali", values: mapping.custom };
    const food = mapping?.foodId ? dbById.get(mapping.foodId) : dbByName.get(normName(dictName(ingId)));
    return food ? { ok:true, label:food.name, values:food, auto: !mapping } : { ok:false };
  };
  const eqSummary = (name) => {
    const eq = equivalences[name];
    if (!eq || !eq.factors || Object.keys(eq.factors).length === 0) return null;
    return Object.entries(eq.factors).map(([u,f]) => `1 ${unitLabel(u)} = ${String(f).replace(".",",")} ${unitLabel(eq.base)}`).join(" · ");
  };
  // Stesse regole di segnalazione usate dalla ItemCard (categoria/nutrizione/equivalenze mancanti)
  const hasIssuesFor = (itemId, isAgg, agg) => {
    const dataKey = isAgg ? agg.id : itemId;
    const cats = isAgg ? (agg.categories || []) : effectiveCategories(itemId, aggregates, ingredientCategories, sourceByIngredient).categories;
    const nutriKey = !isAgg ? effectiveNutritionKey(itemId, aggregates, nutritionMap, sourceByIngredient) : dataKey;
    const nutri = nutriStatusOf(nutriKey);
    const eqS = eqSummary(dataKey);
    const relevantUnits = isAgg
      ? new Set((agg.members || []).flatMap(m => Array.from(unitsByIng.get(m) || [])))
      : (unitsByIng.get(itemId) || new Set());
    const multiUnits = relevantUnits.size >= 2;
    return cats.length === 0 || !nutri.ok || (multiUnits && !eqS);
  };

  const q = search.trim().toLowerCase();
  const filterRecipe = filterRecipeId ? recipes.find(r => String(r.id) === filterRecipeId) : null;
  const recipeIngIds = filterRecipe
    ? new Set(flattenIngredients(filterRecipe.ingredients).map(ing => resolveIngId(dictIdx, ing.name)))
    : null;
  const visibleAggs = aggregates.filter(a =>
    (!q || a.name.toLowerCase().includes(q) || (a.members||[]).some(m => dictName(m).toLowerCase().includes(q))) &&
    (!recipeIngIds || (a.members||[]).some(m => recipeIngIds.has(m))) &&
    (!onlyIssues || hasIssuesFor(a.id, true, a))
  );
  const visibleIngs = allIngs.filter(i =>
    (!q || i.display.toLowerCase().includes(q)) &&
    (!recipeIngIds || recipeIngIds.has(i.name)) &&
    (!onlyIssues || hasIssuesFor(i.name, false, null))
  );

  // ── Editor inline: categorie ──
  const CatEditor = ({ current, onToggle }) => (
    <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
      {catsSorted.map(c => {
        const on = current.includes(c.id);
        return (
          <button key={c.id} onClick={() => onToggle(c.id)} style={{
            padding:"5px 10px", borderRadius:14,
            border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
            background: on ? th.appAccent : "transparent",
            color: on ? "#fff" : th.appFaded,
            fontFamily:F.ui, fontSize:10.5, cursor:"pointer",
          }}>{c.emoji} {c.label}</button>
        );
      })}
    </div>
  );

  // ── Editor inline: collegamento nutrizionale ──
  const NutriEditor = ({ name }) => {
    const mapping = nutritionMap[name];
    const status = nutriStatusOf(name); // {ok, label, values, auto}
    const searching = nutriSearch[name] !== undefined;
    const s = nutriSearch[name] ?? "";
    const results = searching && s.trim() ? allFoods.filter(f => f.name.toLowerCase().includes(s.trim().toLowerCase())).slice(0, 5) : [];
    const startSearch = () => setNutriSearch(p => ({ ...p, [name]: "" }));
    const stopSearch = () => setNutriSearch(p => (({ [name]:_, ...rest }) => rest)(p));

    // ── Già collegato: mostra a cosa, con possibilità di scollegare o cambiare ──
    if (!searching && status.ok) {
      return (
        <div style={{ marginTop:8, background:th.appBg, border:`1px solid ${th.appBorder}`, borderRadius:9, padding:"9px 11px" }}>
          <div style={{ fontFamily:F.body, fontSize:12.5, color:th.appInk, fontWeight:600 }}>
            {status.label}{status.auto ? <span style={{ fontFamily:F.ui, fontSize:9.5, color:th.appAccent, fontWeight:400 }}> · match automatico</span> : null}
          </div>
          <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:2 }}>{macroLine(status.values, {fib:false})}</div>
          <div style={{ display:"flex", gap:14, marginTop:8 }}>
            {mapping && (
              <button onClick={() => onSaveNutritionMapping(name, null)} style={{ background:"none", border:"none", color:"#C4593A", fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", padding:0, textDecoration:"underline" }}>× Scollega</button>
            )}
            <button onClick={startSearch} style={{ background:"none", border:"none", color:th.appAccent, fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer", padding:0, textDecoration:"underline" }}>Cambia collegamento</button>
          </div>
        </div>
      );
    }

    // ── Non collegato (o si sta cambiando collegamento): barra di ricerca ──
    return (
      <div style={{ marginTop:8 }}>
        <input
          value={s}
          autoFocus
          onChange={e => setNutriSearch(p => ({ ...p, [name]: e.target.value }))}
          placeholder="Cerca nel database (es. farina, pollo…)"
          style={{ width:"100%", padding:"9px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12.5, color:th.appInk, outline:"none", boxSizing:"border-box" }}
        />
        {results.map(f => (
          <button key={f.id} onClick={() => {
            onSaveNutritionMapping(name, { foodId: f.id });
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
    );
  };

  // ── Editor inline: equivalenze ──
  // Mostra solo le unità realmente usate nel ricettario: per un
  // ingrediente singolo quelle rilevate in unitsByIng; per un aggregato
  // l'unione delle unità rilevate per ciascuno dei suoi membri (un
  // aggregato non compare mai direttamente in una ricetta, quindi non
  // ha unità proprie da rilevare).
  const EqEditor = ({ name, isAgg, members }) => {
    const units = isAgg
      ? Array.from(new Set((members || []).flatMap(m => Array.from(unitsByIng.get(m) || []))))
      : Array.from(unitsByIng.get(name) || []);
    const eq = equivalences[name] || {};
    const base = eq.base && units.includes(eq.base) ? eq.base : (units.includes("g") ? "g" : units[0]);
    const factors = eq.factors || {};
    const display = eq.display || "separate";
    const others = units.filter(u => u !== base);
    const save = (patch) => onSaveEquivalence(name, { base, factors, display, ...patch });
    return (
      <div style={{ marginTop:8 }}>
        {units.length > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
            <span style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, textTransform:"uppercase" }}>Unità base</span>
            {units.map(u => (
              <button key={u} onClick={() => save({ base:u, factors:{}, display:"separate" })} style={{
                padding:"4px 10px", borderRadius:14,
                border:`1.5px solid ${base===u ? th.appAccent : th.appBorder}`,
                background: base===u ? th.appAccent : "transparent",
                color: base===u ? "#fff" : th.appFaded,
                fontFamily:F.ui, fontSize:10.5, cursor:"pointer",
              }}>{unitLabel(u)}</button>
            ))}
          </div>
        )}
        {others.map(u => (
          <div key={u} style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6, fontFamily:F.ui, fontSize:12, color:th.appInk }}>
            <span style={{ flexShrink:0 }}>1 {unitLabel(u)} =</span>
            <input
              type="number"
              value={factors[u] ?? ""}
              onChange={e => {
                const v = parseFloat(e.target.value);
                const next = { ...factors };
                if (isNaN(v) || v <= 0) delete next[u]; else next[u] = v;
                save({ factors: next });
              }}
              placeholder="?"
              style={{ width:70, padding:"7px 9px", border:`1.5px solid ${factors[u] ? th.appAccent : th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", textAlign:"center" }}
            />
            <span style={{ flexShrink:0 }}>{unitLabel(base)}</span>
          </div>
        ))}
        {others.length === 0 && (
          <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>Nessuna unità alternativa usata nel ricettario per questa voce.</div>
        )}
      </div>
    );
  };

  // ── Scheda unificata (ingrediente o aggregato) ──
  const ItemCard = ({ name, display, isAgg, agg }) => {
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
    const eqS = eqSummary(dataKey);
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
    // L'alert equivalenze scatta solo se servirebbe davvero una
    // conversione (2+ unità diverse in uso) e manca. Per un ingrediente
    // singolo si guardano le sue unità; per un aggregato l'unione delle
    // unità usate dai suoi membri (stessa logica di EqEditor).
    const relevantUnits = isAgg
      ? new Set((agg.members || []).flatMap(m => Array.from(unitsByIng.get(m) || [])))
      : (unitsByIng.get(name) || new Set());
    const multiUnits = relevantUnits.size >= 2;
    const issueNoEq = multiUnits && !eqS;
    const hasIssues = issueNoCat || issueNoNutri || issueNoEq;
    const toggleCat = (catId) => {
      if (isAgg) {
        const next = cats.includes(catId) ? cats.filter(c => c !== catId) : [...cats, catId];
        onSaveAggregate({ ...agg, categories: next });
      } else {
        const next = cats.includes(catId) ? cats.filter(c => c !== catId) : [...cats, catId];
        onSetIngredientCats(name, next);
      }
    };

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
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:F.body, fontSize:14.5, fontWeight:700, color:th.appInk, textAlign:"center" }}>
              {isAgg && <span style={{ color:th.appAccent }}>⊕ </span>}
              {display.charAt(0).toUpperCase() + display.slice(1)}
              {hasIssues && <span style={{ fontSize:11, marginLeft:5 }}>⚠️</span>}
            </div>
            {isAgg && <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:1 }}>{(agg.members||[]).map(dictName).join(" · ")}</div>}
          </div>
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
            🏷️ {cats.length > 0 ? (
              <>{catsInheritedFrom && <>eredita da «{catsInheritedFrom.name}» · </>}{cats.map(c => { const cc = catOf(c); return cc ? `${cc.emoji} ${cc.label}` : c; }).join(" · ")}</>
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
          <div style={{ fontFamily:F.ui, fontSize:10.5, color: issueNoEq ? RED : th.appFaded, fontWeight: issueNoEq ? 600 : 400 }}>
            ⚖️ {eqS || (issueNoEq ? (isAgg ? "nessuna equivalenza definita — definiscila" : "più unità in uso senza equivalenze — definiscile") : "nessuna equivalenza da definire")}
          </div>
          <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>
            📖 {linked.length > 0
              ? linked.slice(0, 3).map(r => r.title).join(", ") + (linked.length > 3 ? ` +${linked.length - 3}` : "")
              : "in nessuna ricetta"}
          </div>
        </div>

        {/* Pulsanti modifica */}
        <div style={{ display:"flex", gap:6, marginTop:9, flexWrap:"wrap" }}>
          {attrBtn("🏷️ Categorie", "cat")}
          {attrBtn("🍎 Nutrizione", "nutri")}
          {attrBtn("⚖️ Equivalenze", "eq")}
        </div>

        {exp === "cat" && CatEditor({ current:cats, onToggle:toggleCat })}
        {exp === "nutri" && NutriEditor({ name:dataKey })}
        {exp === "eq" && EqEditor({ name:dataKey, isAgg, members:agg?.members })}
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

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}

      {/* ── GESTISCI DATABASE ── */}
      <div style={{ padding:"14px 20px 0" }}>
        <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.2, color:th.appAccent, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>Gestisci database</div>
      </div>
      <div style={{ padding:"0 18px 4px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        {[
          ["🍇", "Database aggregati", "#5A8C3A", () => setManageAggs(true)],
          ["🏷️", "Database categorie", "#5A3A9A", () => setManageCats(true)],
          ["⚖️", "Database equivalenze", "#2D8C6B", () => setManageEq(true)],
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

      {/* Filtro per ricetta */}
      <div style={{ padding:"8px 18px 0" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", background:th.appCard, border:`1.5px solid ${filterRecipeId ? th.appAccent : th.appBorder}`, borderRadius:12, padding:"9px 14px" }}>
          <span style={{ fontSize:15 }}>📖</span>
          <select
            value={filterRecipeId}
            onChange={e => setFilterRecipeId(e.target.value)}
            style={{ flex:1, border:"none", background:"transparent", outline:"none", fontFamily:F.body, fontSize:13.5, color: filterRecipeId ? th.appInk : th.appFaded, minWidth:0 }}
          >
            <option value="">Filtra per ricetta…</option>
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
          const on = onlyIssues === val;
          return (
            <button key={label} onClick={() => setOnlyIssues(val)} style={{
              flex:1, padding:"8px 10px", borderRadius:20,
              border:`1.5px solid ${on ? (val ? "#C4593A" : th.appAccent) : th.appBorder}`,
              background: on ? (val ? "#C4593A18" : th.appAccent + "18") : "transparent",
              color: on ? (val ? "#C4593A" : th.appAccent) : th.appFaded,
              fontFamily:F.ui, fontSize:12, fontWeight:600, cursor:"pointer",
            }}>{label}</button>
          );
        })}
      </div>

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
      </div>
    </div>
  );
}
