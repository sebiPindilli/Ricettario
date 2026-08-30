import React, { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F, INGREDIENT_CATEGORIES } from "../data/constants.js";
import {
  normName, fmtQty, resolveIngId, ingDictIndex, normUnit, unitLabel, gramsPerUnitFor,
} from "../utils/helpers.js";
import { effectiveCategories } from "../utils/aggregates.js";
import GlobalNav from "../components/GlobalNav.jsx";
import BottomNav from "../components/BottomNav.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import SuggestionHint from "../components/SuggestionHint.jsx";
import SectionCategoryIcon from "../components/SectionCategoryIcon.jsx";
import { guideSpesa } from "../data/guideContent.jsx";

const fmtNum = (n) => String(Math.round(n * 100) / 100).replace(".", ",");
// L'unità "vuota" (conteggio senza unità, es. le uova) non mostra mai
// un'etichetta: coerente in ogni vista, "separate" o convertita.
const fmtUnitTxt = (u) => u ? (["g","kg","ml","l","cl","dl"].includes(u) ? u : " " + unitLabel(u)) : "";
// Ordina le unità di una riga multi-unità mettendo per prima quella "vuota"
// (il conteggio semplice, es. "3 uova"), le altre a seguire.
const orderUnitsForDisplay = (units) => [...units].sort((a, b) => (a === "" ? -1 : 0) - (b === "" ? -1 : 0));

// ══════════════════════════════════════════════════════════════
// SCREEN: LISTA SPESA — ingredienti aggregati da più ricette
// ══════════════════════════════════════════════════════════════
export default function ShoppingListScreen({
  entries, onRemoveEntry, onRemoveRecipe, onRemoveItem, onClearAll, aggregates = [],
  ingredientCategories = {}, sourceByIngredient = {},
  equivalences = {}, customUnits = {}, ingredientDict = null,
  suggestedAggregates = [],
  onLanding, onRecipes, onBook, onMemories, onAdd, onFridge,
  onShopping = () => {},
  onManageAggregates, onManageEquivalences,
}) {
  const th = useTheme();
  const ui = useUiStyle();
  const [copied, setCopied] = useState(false);
  // Altezza reale di <BottomNav>, per sollevare della stessa misura il CTA
  // "Copia tutto" fisso in fondo — altrimenti la nav in basso lo coprirebbe.
  const [navHeight, setNavHeight] = useState(0);
  // Scelta di visualizzazione per riga (separate | unità di conversione) — non persistita, solo per la sessione corrente.
  const [unitChoice, setUnitChoice] = useState({});
  // Ingredienti base spostati manualmente in lista spesa vera ("non ce l'ho")
  // — non persistito, vale solo per questa visualizzazione della lista.
  const [movedToBuy, setMovedToBuy] = useState(new Set());
  // Spunta "presa" (quaderno/schedario, vedi DECISIONI.md): stato locale di
  // sessione, nessun ritardo, non persistito — solo per gli ingredienti da
  // comprare, non per "Controlla in dispensa" (che ha già ce l'ho/non ce l'ho).
  const [checkedIds, setCheckedIds] = useState(new Set());
  const toggleChecked = (id) => setCheckedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // ── Aggrega gli ingredienti di tutte le entry ──
  // Raggruppa per ingrediente/aggregato (non più per unità): ogni riga tiene
  // i sotto-totali per unità realmente usata, e la conversione in un'unica
  // unità è scelta a video (vedi rowInfo), non più salvata nei dati.
  const aggregated = React.useMemo(() => {
    // Se un ingrediente appartiene a un aggregato, la voce si raggruppa sotto
    // il nome dell'aggregato (es. "Zucchero" per bianco + di canna) e ogni
    // riga di dettaglio indica il sotto-ingrediente e la ricetta.
    const dictIdx = ingredientDict ? ingDictIndex(ingredientDict) : null;
    const findAggregate = (ingId) =>
      aggregates.find(a => (a.members || []).includes(ingId));

    const map = new Map(); // key → { id, display, isAggregate, eqKey, byUnit: Map<unit, totale>, parts:[{recipe, amount, member}] }
    entries.forEach(entry => {
      entry.items.forEach(it => {
        // it = { name, qty (già scalata), unit, note? } — nessun parsing necessario
        const clean = normName(it.name);
        const ingId = resolveIngId(dictIdx, clean); // ID dizionario per aggregati/equivalenze
        const displayName = (it.name || "").trim();
        const qty = it.qty;
        let unit = normUnit(it.unit);
        if (unit === "q.b.") unit = "";
        // Testo originale per il dettaglio — senza quantità è sempre "q.b."
        // (anche i pochi casi limite in cui manca senza essere stata scritta esplicitamente).
        const rawAmount = qty != null
          ? `${fmtQty(qty)}${it.unit && it.unit !== "q.b." ? " " + it.unit : ""}`.trim()
          : "q.b.";
        const agg = findAggregate(ingId);
        const groupName = agg ? agg.name : displayName;
        const key = agg ? "agg_" + agg.id : "ing_" + clean;
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            display: groupName.charAt(0).toUpperCase() + groupName.slice(1),
            isAggregate: !!agg,
            agg, // riferimento diretto, utile per leggere le categorie dell'aggregato
            eqKey: agg ? agg.id : ingId, // chiave con cui leggere equivalences per questa riga
            byUnit: new Map(),
            parts: [],
          });
        }
        const g = map.get(key);
        const member = agg ? displayName.toLowerCase() : null;
        g.parts.push({ recipe: entry.recipeTitle, amount: rawAmount, member, entryId: entry.id, ingName: it.name });
        if (qty != null) g.byUnit.set(unit, (g.byUnit.get(unit) || 0) + qty);
      });
    });
    // Con quantità prima, senza quantità in fondo; a parità, ordine alfabetico.
    return Array.from(map.values()).sort((a, b) => {
      const aHas = a.byUnit.size > 0, bHas = b.byUnit.size > 0;
      if (aHas !== bHas) return aHas ? -1 : 1;
      return a.display.localeCompare(b.display, "it");
    });
  }, [entries, aggregates, ingredientDict]);

  // ID ingrediente presenti nella lista spesa corrente — per filtrare i
  // suggerimenti di aggregati (globali, su tutto il ricettario) su quelli
  // effettivamente rilevanti qui.
  const shoppingIngIds = React.useMemo(() => {
    const dictIdx = ingredientDict ? ingDictIndex(ingredientDict) : null;
    const ids = new Set();
    entries.forEach(entry => entry.items.forEach(it => ids.add(resolveIngId(dictIdx, normName(it.name)))));
    return ids;
  }, [entries, ingredientDict]);
  // Un gruppo suggerito è rilevante per la lista spesa solo se almeno due
  // dei suoi membri compaiono davvero qui (altrimenti è "vero" ma altrove).
  const shoppingSuggestedAggregates = React.useMemo(
    () => suggestedAggregates.filter(g => g.members.filter(id => shoppingIngIds.has(id)).length >= 2),
    [suggestedAggregates, shoppingIngIds]
  );

  // Un ingrediente "base" (🧂 sale, olio, farina…) si presume già in dispensa:
  // finché non lo sposti manualmente, va nella sezione "controlla in dispensa"
  // invece che nella lista spesa vera.
  const isBaseRow = (g) => g.isAggregate
    ? (g.agg?.categories || []).includes("base")
    : effectiveCategories(g.eqKey, aggregates, ingredientCategories, sourceByIngredient).categories.includes("base");
  // Categorie di una riga (un ingrediente può appartenere a più di una,
  // stesso principio già usato in EmptyFridgeScreen) — per il
  // raggruppamento "per categoria" della lista spesa in schedario.
  const rowCategoryIds = (g) => g.isAggregate
    ? (g.agg?.categories || [])
    : effectiveCategories(g.eqKey, aggregates, ingredientCategories, sourceByIngredient).categories;
  const baseRows = aggregated.filter(g => isBaseRow(g) && !movedToBuy.has(g.id));
  const shoppingRows = aggregated.filter(g => !isBaseRow(g) || movedToBuy.has(g.id));
  // "Ce l'ho": rimuove tutte le occorrenze della riga dalla lista spesa.
  const removeWholeRow = (g) => g.parts.forEach(p => onRemoveItem && onRemoveItem(p.entryId, p.ingName));

  // Dati derivati per il render/l'export di una riga: unità presenti, se sono
  // tutte convertibili tra loro (via grammi), le unità target proponibili e
  // il testo del totale da mostrare secondo la scelta corrente (o il default).
  const rowInfo = (g) => {
    const units = Array.from(g.byUnit.keys());
    const factors = equivalences[g.eqKey]?.factors || {};
    const multiUnit = units.length >= 2;
    const allConvertible = multiUnit && units.every(u => gramsPerUnitFor(u, factors, customUnits) != null);
    const targets = allConvertible
      ? Array.from(new Set(["g", ...units])).filter(u => gramsPerUnitFor(u, factors, customUnits) != null)
      : [];
    // unitChoice[g.id] può legittimamente essere "" (l'unità "vuota" scelta
    // come conversione): con "||" una stringa vuota è falsy e ricadrebbe
    // sempre su "separate", quindi va distinta da "non ancora scelto nulla".
    const choice = (multiUnit && allConvertible)
      ? (unitChoice[g.id] !== undefined ? unitChoice[g.id] : "separate")
      : "separate";
    let totalText = null;
    if (units.length === 1) {
      totalText = `${fmtNum(g.byUnit.get(units[0]))}${fmtUnitTxt(units[0])}`;
    } else if (multiUnit) {
      if (allConvertible && choice !== "separate") {
        const totalGrams = units.reduce((s, u) => s + g.byUnit.get(u) * gramsPerUnitFor(u, factors, customUnits), 0);
        const converted = totalGrams / gramsPerUnitFor(choice, factors, customUnits);
        totalText = `${fmtNum(converted)}${fmtUnitTxt(choice)}`;
      } else {
        // Separate (o non tutte le unità sono convertibili tra loro): elenca
        // i sotto-totali partendo dall'unità "vuota", uniti da " + ".
        totalText = orderUnitsForDisplay(units)
          .map(u => `${fmtNum(g.byUnit.get(u))}${fmtUnitTxt(u)}`)
          .join(" + ");
      }
    }
    return { units, multiUnit, allConvertible, targets, choice, totalText };
  };

  const pillStyle = (active) => ({
    padding:"4px 10px", borderRadius:14,
    border:`1.5px solid ${active ? th.appAccent : th.appBorder}`,
    background: active ? th.appAccent : "transparent",
    color: active ? "#fff" : th.appFaded,
    fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer",
  });

  // Card di una riga: in modalità "base" mostra le due azioni per gestire la
  // dispensa (ce l'ho / non ce l'ho) invece del selettore unità e della ×.
  const RenderRow = (g, { base }) => {
    const info = rowInfo(g);
    const checkable = ui.id !== "classico" && !base;
    const checked = checkable && checkedIds.has(g.id);
    return (
      <div key={g.id} style={{
        background: ui.id==="classico" ? th.appCard : ui.card,
        border:`1px solid ${ui.id==="classico" ? th.appBorder : ui.border}`,
        borderRadius: ui.id==="classico" ? 12 : ui.radius.card,
        padding:"11px 14px", marginBottom:8,
        opacity: checked ? 0.6 : 1,
      }}>
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"baseline", gap:8 }}>
          {checkable && (
            // Nessun simbolo "spunta/check" nel set SVG: il segno di stato
            // è il solo riempimento del controllo (nessuna icona nuova
            // disegnata) — segnalato nel riepilogo finale.
            <button onClick={() => toggleChecked(g.id)} title={checked ? "Segna da comprare" : "Segna come presa"} style={{
              width:20, height:20, flexShrink:0, padding:0, cursor:"pointer",
              border:`1.5px solid ${checked ? "#6B8C6E" : ui.faded}`,
              borderRadius: ui.id==="schedario" ? 6 : "50%",
              background: checked ? "#6B8C6E" : "transparent",
              marginRight:2,
            }}/>
          )}
          <span style={{ fontFamily:F.body, fontSize:14, color: checked ? "#B0A694" : (ui.id==="classico" ? th.appInk : ui.ink), fontWeight:600, flex:1, textDecoration: checked ? "line-through" : "none" }}>{g.display}</span>
          {info.totalText && (
            <span style={{ fontFamily:F.display, fontSize:15, color: checked ? "#B0A694" : th.appAccent, fontWeight:700, textAlign:"right", textDecoration: checked ? "line-through" : "none" }}>
              {info.totalText}
            </span>
          )}
        </div>

        {base ? (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
            <button onClick={() => removeWholeRow(g)} title="Segna come già presente e rimuovi dalla lista" style={{
              padding:"6px 10px", borderRadius:9, border:`1.5px solid ${th.appBorder}`,
              background:"transparent", color:th.appFaded,
              fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer",
            }}>✅ Ce l'ho</button>
            <button onClick={() => setMovedToBuy(p => new Set(p).add(g.id))} style={{
              padding:"6px 10px", borderRadius:9, border:`1.5px solid ${th.appAccent}`,
              background:"transparent", color:th.appAccent,
              fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer",
            }}>🛒 Non ce l'ho — aggiungi alla spesa</button>
          </div>
        ) : (
          <>
            {/* Selettore Separate | Converti in… — solo con 2+ unità tutte convertibili tra loro */}
            {info.multiUnit && info.allConvertible && (
              <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                <button onClick={() => setUnitChoice(p => ({ ...p, [g.id]: "separate" }))} style={pillStyle(info.choice === "separate")}>Separate</button>
                {info.targets.map(u => (
                  <button key={u} onClick={() => setUnitChoice(p => ({ ...p, [g.id]: u }))} style={pillStyle(info.choice === u)}>→ {unitLabel(u)}</button>
                ))}
              </div>
            )}
            {/* Unità non tutte convertibili tra loro: alert invece del selettore */}
            {info.multiUnit && !info.allConvertible && (
              <div style={{ marginTop:6, padding:"8px 10px", background:`${th.appAccent}10`, border:`1px dashed ${th.appAccent}55`, borderRadius:9 }}>
                <span style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, lineHeight:1.5 }}>
                  ⚖️ Unità diverse senza un'equivalenza in grammi che le colleghi tutte: per un funzionamento ottimale{" "}
                  <span onClick={() => onManageEquivalences && onManageEquivalences()} style={{ color:th.appAccent, fontWeight:700, cursor:"pointer", textDecoration:"underline" }}>gestisci le equivalenze mancanti</span>.
                </span>
              </div>
            )}
          </>
        )}

        <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:4, lineHeight:1.7 }}>
          {g.parts.map((p, j) => (
            <div key={j} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ flex:1 }}>{p.amount}{p.member ? <> di <b>{p.member}</b></> : null} per <i>{p.recipe}</i></span>
              {!base && (
                <button onClick={() => onRemoveItem && onRemoveItem(p.entryId, p.ingName)} title="Rimuovi questo" style={{
                  background:"none", border:"none", color:th.appFaded, cursor:"pointer",
                  fontSize:14, lineHeight:1, padding:"0 2px", flexShrink:0,
                }}>×</button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const copyAll = () => {
    const lines = aggregated.map(g => {
      const info = rowInfo(g);
      const nameLower = g.display.charAt(0).toLowerCase() + g.display.slice(1);
      // Quantità in testa: "3 uova" se l'unità è quella "vuota" (conteggio,
      // senza nome), "150g di cipolle" se invece c'è un'unità di misura vera.
      let head = g.display;
      if (info.totalText) {
        const expressedUnit = !info.multiUnit
          ? info.units[0]
          : (info.choice !== "separate" ? info.choice : undefined);
        head = expressedUnit === ""
          ? `${info.totalText} ${nameLower}`
          : `${info.totalText} di ${nameLower}`;
      }
      // Il nome del membro si mostra solo se aggiunge un'informazione reale
      // (cioè differisce dal nome del gruppo/aggregato) — altrimenti è
      // ridondante con la testa della riga, che lo riporta già.
      const memberDiffers = (p) => !!(p?.member && normName(p.member) !== normName(g.display));
      const detail = g.parts.length > 1
        ? ` (${g.parts.map(p => `${p.amount}${memberDiffers(p) ? " di " + p.member : ""} per ${p.recipe}`).join(", ")})`
        : memberDiffers(g.parts[0]) ? ` (${g.parts[0].member})` : "";
      return `• ${head}${detail}`;
    });
    const full = `🛒 Lista della spesa\n\n${lines.join("\n")}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(full).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nav = (
    <GlobalNav
      activeScreen="shopping"
      onRecipes={onRecipes}
      onBook={onBook}
      onMemories={onMemories}
      onAdd={onAdd}
      onFridge={onFridge}
      onShopping={onShopping}
      onLanding={onLanding}
      onSearch={() => {}}
      onFavorites={() => {}}
      showSearch={false}
      showFavorites={false}
      activeLabel="Lista Spesa"
      infoContent={guideSpesa}
      bottomNavActive
    />
  );

  // ── Organizza ingredienti (stessa schermata di Svuota Frigo) ──
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}

      <ScreenHeader
        section="spesa"
        title="Lista Spesa"
        subtitle={entries.length === 0 ? "vuota" : `da ${entries.length} ricett${entries.length===1?"a":"e"}`}
        onHome={onLanding}
        infoContent={guideSpesa}
        actions={entries.length > 0 ? [{ icon:"elimina", label:"Svuota", onClick:onClearAll }] : []}
      />

      {ui.id === "classico" && (
        <div style={{ padding:"14px 20px 6px", display:"flex", alignItems:"flex-start", gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk }}>🛒 Lista Spesa</div>
            <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:3 }}>
              {entries.length === 0 ? "vuota" : `da ${entries.length} ricett${entries.length===1?"a":"e"}`}
            </div>
          </div>
          {entries.length > 0 && (
            <button onClick={onClearAll} style={{
              background:"transparent", border:`1.5px solid #C4593A`, borderRadius:10,
              padding:"7px 12px", cursor:"pointer", color:"#C4593A",
              fontFamily:F.ui, fontSize:11, fontWeight:600, flexShrink:0,
            }}>🗑️ Svuota</button>
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"0 40px", textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🛒</div>
          <div style={{ fontFamily:F.display, fontSize:17, color:th.appInk, fontStyle:"italic", marginBottom:6 }}>La lista è vuota</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, lineHeight:1.5 }}>
            Apri una ricetta, tocca 🛒 Spesa e aggiungi gli ingredienti che ti servono.
          </div>
        </div>
      ) : (
        <div style={{ flex:1, overflowY:"auto", padding:"8px 18px 110px" }}>
          {shoppingSuggestedAggregates.length > 0 && onManageAggregates && (
            <SuggestionHint onClick={() => onManageAggregates()}>
              <span style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5 }}>
                💡 Sono stati rilevati ingredienti con nomi simili nella tua lista spesa. Per un funzionamento ottimale{" "}
                <span style={{ color:th.appAccent, fontWeight:700, textDecoration:"underline" }}>raggruppali in aggregati o ignora le similitudini</span>.
              </span>
            </SuggestionHint>
          )}
          {/* Ricette attive nella lista — rimozione in un clic di tutti gli ingredienti */}
          <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", margin:"4px 0 8px", fontWeight:700 }}>
            Ricette attive
          </div>
          {(() => {
            // Raggruppa le entry per ricetta (più aggiunte della stessa ricetta = una riga)
            const byRecipe = [];
            const idx = {};
            entries.forEach(entry => {
              if (idx[entry.recipeId] == null) { idx[entry.recipeId] = byRecipe.length; byRecipe.push({ recipeId: entry.recipeId, title: entry.recipeTitle, count: 0, labels: [] }); }
              const g = byRecipe[idx[entry.recipeId]];
              g.count += entry.items.length;
              if (!g.labels.includes(entry.scaleLabel)) g.labels.push(entry.scaleLabel);
            });
            return byRecipe.map(g => (
              <div key={g.recipeId} style={{
                background:`${th.appBorder}44`, border:`1px solid ${th.appBorder}`,
                borderRadius:12, padding:"10px 12px", marginBottom:6,
                display:"flex", alignItems:"center", gap:10,
              }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:F.body, fontSize:13, color:th.appInk, fontWeight:600 }}>{g.title}</div>
                  <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded }}>{g.count} ingredienti · {g.labels.join(" + ")}</div>
                </div>
                <button onClick={() => onRemoveRecipe(g.recipeId)} title={`Rimuovi tutti gli ingredienti di ${g.title}`} style={{
                  background:"none", border:`1px solid #C4593A`, color:"#C4593A",
                  fontFamily:F.ui, fontSize:10.5, fontWeight:700, cursor:"pointer",
                  flexShrink:0, padding:"6px 10px", borderRadius:9, display:"flex", alignItems:"center", gap:5,
                }}>🗑️ Rimuovi</button>
              </div>
            ));
          })()}

          {/* Ingredienti base: si presumono già in dispensa, da confermare o spostare */}
          {baseRows.length > 0 && (
            <>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", margin:"16px 0 4px", fontWeight:700 }}>
                🧂 Controlla in dispensa
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:8, lineHeight:1.4 }}>
                Controlla di avere in dispensa i seguenti ingredienti base:
              </div>
              {baseRows.map(g => RenderRow(g, { base:true }))}
            </>
          )}

          {/* Ingredienti da comprare */}
          <div style={{ display:"flex", alignItems:"center", gap:8, margin:"16px 0 8px" }}>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", fontWeight:700, flex:1 }}>
              Ingredienti
            </div>
            {ui.id !== "classico" && shoppingRows.length > 0 && (
              <div style={{ fontFamily:F.mono, fontSize:10.5, color:"#6B8C6E", fontWeight:700 }}>
                {shoppingRows.filter(g => checkedIds.has(g.id)).length} di {shoppingRows.length}
              </div>
            )}
          </div>
          {ui.id !== "classico" && shoppingRows.length > 0 && (
            <div style={{ height:4, borderRadius:2, background:ui.hairlineStrong, marginBottom:12, overflow:"hidden" }}>
              <div style={{
                height:"100%", borderRadius:2, background:"#6B8C6E",
                width:`${(shoppingRows.filter(g => checkedIds.has(g.id)).length / shoppingRows.length) * 100}%`,
                transition:"width 0.2s",
              }}/>
            </div>
          )}
          {shoppingRows.length === 0 ? (
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, fontStyle:"italic", padding:"6px 0" }}>Nessun altro ingrediente da comprare.</div>
          ) : ui.id === "schedario" ? (
            // schedario: raggruppato per categoria ingrediente (INGREDIENT_CATEGORIES);
            // un ingrediente può comparire in più gruppi, come in Svuota Frigo.
            (() => {
              const grouped = INGREDIENT_CATEGORIES.map(cat => ({
                cat, rows: shoppingRows.filter(g => rowCategoryIds(g).includes(cat.id)),
              })).filter(x => x.rows.length > 0);
              const categorizedIds = new Set(grouped.flatMap(x => x.rows.map(g => g.id)));
              const uncategorized = shoppingRows.filter(g => !categorizedIds.has(g.id));
              return (
                <>
                  {grouped.map(({ cat, rows }) => (
                    <div key={cat.id} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5, fontFamily:F.ui, fontSize:9.5, letterSpacing:1.2, color:ui.faded, textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>
                        <SectionCategoryIcon item={cat} size={11} /> {cat.label}
                      </div>
                      {rows.map(g => RenderRow(g, { base:false }))}
                    </div>
                  ))}
                  {uncategorized.length > 0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontFamily:F.ui, fontSize:9.5, letterSpacing:1.2, color:ui.faded, textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>
                        Senza categoria
                      </div>
                      {uncategorized.map(g => RenderRow(g, { base:false }))}
                    </div>
                  )}
                </>
              );
            })()
          ) : shoppingRows.map(g => RenderRow(g, { base:false }))}
        </div>
      )}

      {/* Copia tutto */}
      {entries.length > 0 && (
        <div style={{ position:"absolute", bottom:navHeight, left:0, right:0, padding:"14px 18px 22px", background:`linear-gradient(transparent, ${th.appBg} 30%)` }}>
          <button onClick={copyAll} style={{
            width:"100%", padding:"15px",
            background: copied ? "#6B8C6E" : th.appAccent,
            color:"#fff", border:"none", borderRadius:14,
            fontFamily:F.ui, fontSize:14, fontWeight:700, cursor:"pointer",
            transition:"background 0.2s",
          }}>
            {copied ? "✓ Copiato negli appunti!" : "📋 Copia tutto negli appunti"}
          </button>
        </div>
      )}

      {ui.navPosition === "bottom" && (
        <BottomNav
          activeScreen="shopping"
          onRecipes={onRecipes}
          onMemories={onMemories}
          onFridge={onFridge}
          onShopping={() => {}}
          onHeightChange={setNavHeight}
        />
      )}
    </div>
  );
}
