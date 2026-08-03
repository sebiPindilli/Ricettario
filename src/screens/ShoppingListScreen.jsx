import React, { useState } from "react";
import { useTheme, useNavActions } from "../context.js";
import { F } from "../data/constants.js";
import {
  normName, fmtQty, resolveIngId, ingDictIndex, normUnit,
  UNIT_ALIASES, unitLabel,
} from "../utils/helpers.js";
import GlobalNav from "../components/GlobalNav.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: LISTA SPESA — ingredienti aggregati da più ricette
// ══════════════════════════════════════════════════════════════
export default function ShoppingListScreen({
  entries, onRemoveEntry, onRemoveRecipe, onRemoveItem, onClearAll, aggregates = [],
  equivalences = {}, ingredientDict = null,
  onLanding, onRecipes, onBook, onMemories, onAdd, onFridge,
  onShopping = () => {},
}) {
  const th = useTheme();
  const navActions = useNavActions();
  const [copied, setCopied] = useState(false);

  // ── Aggrega gli ingredienti di tutte le entry ──
  // Raggruppa per (nome pulito + unità); somma le quantità quando possibile.
  const aggregated = React.useMemo(() => {
    // Se un ingrediente appartiene a un aggregato, la voce si raggruppa sotto
    // il nome dell'aggregato (es. "Zucchero" per bianco + di canna) e ogni
    // riga di dettaglio indica il sotto-ingrediente e la ricetta.
    const dictIdx = ingredientDict ? ingDictIndex(ingredientDict) : null;
    const findAggregate = (ingId) =>
      aggregates.find(a => (a.members || []).includes(ingId));

    const map = new Map(); // key → { display, unit, total, hasNumbers, isAggregate, parts:[{recipe, amount, member}] }
    // Unità normalizzata (plurali → singolare) per raggruppare ed equivalenze
    entries.forEach(entry => {
      entry.items.forEach(it => {
        // it = { name, qty (già scalata), unit, note? } — nessun parsing necessario
        const clean = normName(it.name);
        const ingId = resolveIngId(dictIdx, clean); // ID dizionario per aggregati/equivalenze
        const displayName = (it.name || "").trim();
        let qty = it.qty;
        let unit = normUnit(it.unit);
        if (unit === "q.b.") unit = "";
        // Testo originale per il dettaglio
        const rawAmount = qty != null
          ? `${fmtQty(qty)}${it.unit && it.unit !== "q.b." ? " " + it.unit : ""}`.trim()
          : (it.unit === "q.b." ? "q.b." : "—");
        // ── Equivalenze: converti nell'unità di visualizzazione scelta ──
        const eq = equivalences[ingId];
        if (qty != null && eq && eq.display && eq.display !== "separate") {
          const fOf = (u) => u === eq.base ? 1 : (eq.factors && eq.factors[u] > 0 ? eq.factors[u] : null);
          const fIn = fOf(unit), fOut = fOf(eq.display);
          if (fIn && fOut) {
            qty = qty * fIn / fOut;
            unit = eq.display;
          }
        }
        const agg = findAggregate(ingId);
        const groupName = agg ? agg.name : displayName;
        const key = (agg ? "agg_" + agg.id : "ing_" + clean) + "|" + (qty != null ? unit : "");
        if (!map.has(key)) {
          map.set(key, {
            display: groupName.charAt(0).toUpperCase() + groupName.slice(1),
            unit, total: 0, hasNumbers: false, isAggregate: !!agg, parts: [],
          });
        }
        const g = map.get(key);
        const member = agg ? displayName.toLowerCase() : null;
        const partRef = { recipe: entry.recipeTitle, amount: rawAmount, member, entryId: entry.id, ingName: it.name };
        if (qty != null) {
          g.total += qty;
          g.hasNumbers = true;
          g.parts.push(partRef);
        } else {
          g.parts.push(partRef);
        }
      });
    });
    return Array.from(map.values()).sort((a,b) => a.display.localeCompare(b.display, "it"));
  }, [entries, aggregates, equivalences]);

  const copyAll = () => {
    const lines = aggregated.map(g => {
      const unitTxt = g.unit ? (["g","kg","ml","l","cl","dl"].includes(g.unit) ? g.unit : " " + unitLabel(g.unit)) : "";
      const tot = g.hasNumbers ? ` ${String(Math.round(g.total*100)/100).replace(".",",")}${unitTxt}` : "";
      const detail = g.parts.length > 1
        ? ` (${g.parts.map(p => `${p.amount}${p.member ? " di " + p.member : ""} per ${p.recipe}`).join(", ")})`
        : g.parts[0]?.member ? ` (${g.parts[0].member} per ${g.parts[0].recipe})` : "";
      return `• ${g.display}${tot}${detail}`;
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
    />
  );

  // ── Organizza ingredienti (stessa schermata di Svuota Frigo) ──
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}

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

      {/* Suggerimento tappabile: apre Organizza */}
      <button onClick={() => navActions.onOrganize && navActions.onOrganize()} style={{ display:"block", width:"calc(100% - 36px)", textAlign:"left", margin:"4px 18px 0", padding:"8px 12px", background:th.appCard, border:`1px dashed ${th.appBorder}`, borderRadius:10, cursor:"pointer" }}>
        <span style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, lineHeight:1.5 }}>
          💡 Aggregazioni e conversioni si basano sulla sezione <b>🍎 Organizza</b> → <span style={{ color:th.appAccent, fontWeight:700 }}>tocca qui per aprirla</span>.
        </span>
      </button>

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

          {/* Ingredienti aggregati */}
          <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", margin:"16px 0 8px", fontWeight:700 }}>
            Ingredienti
          </div>
          {aggregated.map((g, i) => (
            <div key={i} style={{
              background:th.appCard, border:`1px solid ${th.appBorder}`,
              borderRadius:12, padding:"11px 14px", marginBottom:8,
            }}>
              <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                <span style={{ fontFamily:F.body, fontSize:14, color:th.appInk, fontWeight:600, flex:1 }}>{g.display}</span>
                {g.hasNumbers && (
                  <span style={{ fontFamily:F.display, fontSize:15, color:th.appAccent, fontWeight:700 }}>
                    {String(Math.round(g.total*100)/100).replace(".",",")}{g.unit && !UNIT_ALIASES[g.unit] ? g.unit : g.unit ? (["g","kg","ml","l","cl","dl"].includes(g.unit) ? g.unit : " " + unitLabel(g.unit)) : ""}
                  </span>
                )}
                {g.parts.length === 1 && (
                  <button onClick={() => onRemoveItem && onRemoveItem(g.parts[0].entryId, g.parts[0].ingName)} title="Rimuovi dalla lista" style={{
                    background:"none", border:"none", color:th.appFaded, cursor:"pointer",
                    fontSize:17, lineHeight:1, padding:"0 2px", flexShrink:0,
                  }}>×</button>
                )}
              </div>
              {g.parts.length > 1 ? (
                <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:4, lineHeight:1.7 }}>
                  {g.parts.map((p, j) => (
                    <div key={j} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ flex:1 }}>{p.amount}{p.member ? <> di <b>{p.member}</b></> : null} per <i>{p.recipe}</i></span>
                      <button onClick={() => onRemoveItem && onRemoveItem(p.entryId, p.ingName)} title="Rimuovi questo" style={{
                        background:"none", border:"none", color:th.appFaded, cursor:"pointer",
                        fontSize:14, lineHeight:1, padding:"0 2px", flexShrink:0,
                      }}>×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginTop:3 }}>
                  {g.parts[0].member ? <><b>{g.parts[0].member}</b> · </> : (!g.hasNumbers && g.parts[0].amount !== "q.b." ? g.parts[0].amount + " · " : null)}per <i>{g.parts[0].recipe}</i>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Copia tutto */}
      {entries.length > 0 && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 18px 22px", background:`linear-gradient(transparent, ${th.appBg} 30%)` }}>
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
    </div>
  );
}
