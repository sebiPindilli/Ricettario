import React, { useState } from "react";
import { useTheme, useNavActions } from "../context.js";
import { F, INGREDIENT_CATEGORIES, MACRO_SECTIONS, TAG_GROUPS } from "../data/constants.js";
import {
  buildFridgeItems, ingDictIndex, flattenIngredients, ingredientToText,
  resolveIngId, sortCategoriesAltroLast, sortSectionsAltroLast,
} from "../utils/helpers.js";
import GlobalNav from "../components/GlobalNav.jsx";
import ServingsDialog from "../components/ServingsDialog.jsx";
import ShoppingMode from "../components/ShoppingMode.jsx";
import CookingMode from "./CookingMode.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: SVUOTA FRIGO — seleziona ingredienti in casa → ricette
// ══════════════════════════════════════════════════════════════
export default function EmptyFridgeScreen({
  recipes, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge,
  onStartCooking, onAddToShoppingList, onShopping, extraTagGroups = [],
  aggregates = [], ingredientCategories = {},
  categoryList = INGREDIENT_CATEGORIES,
  ingredientDict = null,
  sectionList = MACRO_SECTIONS,
}) {
  const th = useTheme();
  const navActions = useNavActions();
  const [phase, setPhase] = useState("select"); // "select" | "results"
  const [ownedMembers, setOwnedMembers] = useState([]); // nomi puliti reali posseduti
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [activeMacro, setActiveMacro] = useState("tutte"); // "tutte"|"basi"|"salati"|"dolci"
  const [openTagGroup, setOpenTagGroup] = useState(null);
  const [servingsDialog, setServingsDialog] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const [tooltipKey, setTooltipKey] = useState(null); // key dell'aggregato di cui mostrare i membri
  const pressTimer = React.useRef(null);
  const suppressClick = React.useRef(false);

  // Voci selezionabili (aggregati + singoli)
  const fridgeItems = React.useMemo(
    () => buildFridgeItems(recipes, aggregates, ingredientCategories, ingredientDict),
    [recipes, aggregates, ingredientCategories, ingredientDict]
  );
  const dictIdx = React.useMemo(() => ingredientDict ? ingDictIndex(ingredientDict) : null, [ingredientDict]);

  // Gli ingredienti "base" sono considerati presenti in dispensa di default.
  // Vengono preselezionati automaticamente; teniamo traccia di quali abbiamo
  // aggiunto noi, così un ingrediente reso "base" più tardi viene incluso,
  // ma se l'utente ne deseleziona uno non lo ri-aggiungiamo.
  const autoAddedBase = React.useRef(new Set());
  const removedBase = React.useRef(new Set());
  React.useEffect(() => {
    const baseMembers = fridgeItems
      .filter(it => it.categories.includes("base"))
      .flatMap(it => it.members);
    const toAdd = baseMembers.filter(m =>
      !ownedMembers.includes(m) && !removedBase.current.has(m)
    );
    if (toAdd.length > 0) {
      toAdd.forEach(m => autoAddedBase.current.add(m));
      setOwnedMembers(prev => [...prev, ...toAdd.filter(m => !prev.includes(m))]);
    }
  }, [fridgeItems]);

  // Una voce è selezionata se TUTTI i suoi membri sono posseduti
  const isItemOwned = (item) => item.members.every(m => ownedMembers.includes(m));

  const toggleItem = (item) => {
    const owned = isItemOwned(item);
    setOwnedMembers(prev => {
      if (owned) {
        // se l'utente deseleziona un base auto-aggiunto, ricordalo per non ri-aggiungerlo
        item.members.forEach(m => {
          if (autoAddedBase.current.has(m)) removedBase.current.add(m);
        });
        return prev.filter(m => !item.members.includes(m));
      }
      // ri-selezionando manualmente, togli dai "rimossi"
      item.members.forEach(m => removedBase.current.delete(m));
      const add = item.members.filter(m => !prev.includes(m));
      return [...prev, ...add];
    });
  };

  const filterItems = (list) => search.trim()
    ? list.filter(i => i.display.toLowerCase().includes(search.toLowerCase()))
    : list;

  // ── Analisi ricette in base ai membri posseduti ──
  const analyzed = React.useMemo(() => {
    return recipes.map(r => {
      const ings = flattenIngredients(r.ingredients).map(ing => ({
        text: ingredientToText(ing), clean: resolveIngId(dictIdx, ing.name),
      }));
      const present = ings.filter(i => ownedMembers.includes(i.clean));
      const missing = ings.filter(i => !ownedMembers.includes(i.clean));
      const total = ings.length || 1;
      return { recipe: r, present, missing, total, ratio: present.length / total };
    }).sort((a, b) => b.ratio - a.ratio);
  }, [recipes, ownedMembers, dictIdx]);

  const allTagGroupsWithExtra = [...TAG_GROUPS, ...extraTagGroups];
  const relevantTagGroups = allTagGroupsWithExtra.map(g => ({
    ...g,
    tags: g.tags.filter(t => recipes.some(r => r.tags.includes(t)))
  })).filter(g => g.tags.length > 0);

  const toggleTag = (tag) => setActiveTags(prev =>
    prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
  );

  const filteredResults = analyzed.filter(a => {
    if (activeMacro !== "tutte" && a.recipe.macroSection !== activeMacro) return false;
    if (activeTags.length > 0 && !activeTags.every(t => a.recipe.tags.includes(t))) return false;
    return true;
  });

  const nav = (
    <GlobalNav
      activeScreen="fridge"
      onRecipes={onRecipes}
      onBook={onBook}
      onMemories={onMemories}
      onAdd={onAdd}
      onFridge={() => {}}
      onShopping={onShopping}
      onLanding={onLanding}
      onSearch={() => {}}
      onFavorites={() => {}}
      showSearch={false}
      showFavorites={false}
      activeLabel="Svuota Frigo"
    />
  );

  // ══════════════════════════════════════════════════════════
  // FASE: SELEZIONE INGREDIENTI
  // ══════════════════════════════════════════════════════════
  if (phase === "select") {
    // Raggruppa le voci per categoria (una voce può comparire in più categorie)
    const byCategory = sortCategoriesAltroLast(categoryList).map(cat => ({
      ...cat,
      items: filterItems(fridgeItems)
        .filter(it => it.categories.includes(cat.id))
        .sort((a, b) => a.display.localeCompare(b.display, "it")),
    })).filter(c => c.items.length > 0);

    const renderItemBtn = (item) => {
      const sel = isItemOwned(item);

      const openTip = (el) => {
        if (!item.isAggregate || !el) return;
        const r = el.getBoundingClientRect();
        const vw = window.innerWidth || 400;
        const below = r.top < 110; // se troppo vicino al bordo alto, mostra sotto
        setTooltipKey({
          key: item.key,
          members: item.members,
          x: Math.min(Math.max(r.left + r.width / 2, 95), vw - 95),
          y: below ? r.bottom : r.top,
          below,
        });
        suppressClick.current = true; // il rilascio dopo long-press non deve selezionare
      };
      const startPress = (e) => {
        if (!item.isAggregate) return;
        suppressClick.current = false;
        const el = e.currentTarget;
        pressTimer.current = setTimeout(() => openTip(el), 350);
      };
      // Rilascio / uscita / scroll col dito → chiudi subito il popup
      const endPress = () => {
        if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
        setTooltipKey(null);
      };

      return (
        <button
          key={item.key}
          onClick={() => {
            if (suppressClick.current) { suppressClick.current = false; return; }
            toggleItem(item);
          }}
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          onTouchMove={endPress}
          onTouchCancel={endPress}
          style={{
            padding:"7px 12px", borderRadius:20,
            border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
            background: sel ? th.appAccent : "transparent",
            color: sel ? "#fff" : th.appFaded,
            fontFamily:F.ui, fontSize:12, cursor:"pointer",
            display:"flex", alignItems:"center", gap:5,
          }}
        >
          {sel && <span style={{ fontSize:11 }}>✓</span>}
          {item.display}
          {item.isAggregate && <span style={{ fontSize:10, opacity:0.7 }}>⊕</span>}
        </button>
      );
    };

    const selectedCount = fridgeItems.filter(isItemOwned).length;

    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"14px 20px 6px", display:"flex", alignItems:"flex-start", gap:10 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk }}>🧊 Svuota Frigo</div>
            <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:3, lineHeight:1.5 }}>
              Seleziona gli ingredienti che hai in casa. Quelli <b>base</b> sono già selezionati (puoi deselezionarli).
            </div>
          </div>
        </div>

        {/* Suggerimento tappabile: apre Organizza */}
        <button onClick={() => navActions.onOrganize && navActions.onOrganize()} style={{ display:"block", width:"calc(100% - 36px)", textAlign:"left", margin:"6px 18px 0", padding:"8px 12px", background:th.appCard, border:`1px dashed ${th.appBorder}`, borderRadius:10, cursor:"pointer" }}>
          <span style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, lineHeight:1.5 }}>
            💡 Per un funzionamento ottimale (categorie, aggregati, equivalenze) compila la sezione <b>🍎 Organizza</b> → <span style={{ color:th.appAccent, fontWeight:700 }}>tocca qui per aprirla</span>.
          </span>
        </button>

        {/* Search */}
        <div style={{ padding:"8px 18px 4px" }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", background:th.appCard, border:`1.5px solid ${search ? th.appAccent : th.appBorder}`, borderRadius:12, padding:"9px 14px" }}>
            <span style={{ fontSize:15 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca un ingrediente…"
              style={{ flex:1, background:"none", border:"none", fontFamily:F.body, fontSize:14, color:th.appInk, outline:"none" }}
            />
            {search && <button onClick={() => setSearch("")} style={{ background:"none", border:"none", color:th.appFaded, cursor:"pointer", fontSize:16 }}>×</button>}
          </div>
        </div>

        {selectedCount > 0 && (
          <div style={{ padding:"4px 20px", fontFamily:F.ui, fontSize:11, color:th.appAccent, fontWeight:600 }}>
            {selectedCount} selezionat{selectedCount===1?"o":"i"}
            <button onClick={() => setOwnedMembers([])} style={{ marginLeft:8, background:"none", border:"none", color:th.appFaded, cursor:"pointer", fontFamily:F.ui, fontSize:11, textDecoration:"underline" }}>azzera</button>
          </div>
        )}

        {/* Lista per categoria */}
        <div onScroll={() => tooltipKey && setTooltipKey(null)} style={{ flex:1, overflowY:"auto", padding:"8px 18px 100px" }}>
          {byCategory.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>
              Nessun ingrediente trovato
            </div>
          ) : byCategory.map(cat => (
            <div key={cat.id} style={{ marginBottom:16 }}>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appAccent, textTransform:"uppercase", margin:"4px 0 8px", fontWeight:700 }}>
                {cat.emoji} {cat.label}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {cat.items.map(renderItemBtn)}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 18px 22px", background:`linear-gradient(transparent, ${th.appBg} 30%)` }}>
          <button
            onClick={() => setPhase("results")}
            disabled={ownedMembers.length === 0}
            style={{
              width:"100%", padding:"15px",
              background: ownedMembers.length===0 ? th.appBorder : th.appAccent,
              color: ownedMembers.length===0 ? th.appFaded : "#fff",
              border:"none", borderRadius:14,
              fontFamily:F.ui, fontSize:14, fontWeight:700,
              cursor: ownedMembers.length===0 ? "default" : "pointer",
            }}
          >
            {ownedMembers.length===0 ? "Seleziona almeno un ingrediente" : "Mostra ricette →"}
          </button>
        </div>

        {/* Popup nuvola — visibile solo mentre si tiene premuto */}
        {tooltipKey && (
          <div style={{
            position:"fixed",
            left: tooltipKey.x,
            top: tooltipKey.below ? tooltipKey.y + 10 : tooltipKey.y - 10,
            transform: tooltipKey.below ? "translate(-50%, 0)" : "translate(-50%, -100%)",
            zIndex:601, minWidth:140, maxWidth:"min(240px, 80vw)",
            background:th.appInk, color:"#fff",
            borderRadius:12, padding:"10px 13px",
            boxShadow:"0 10px 34px rgba(0,0,0,0.5)",
            pointerEvents:"none",
          }}>
            <div style={{ fontFamily:F.ui, fontSize:9, letterSpacing:1, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", marginBottom:4 }}>Include</div>
            <div style={{ fontFamily:F.body, fontSize:12, lineHeight:1.5 }}>
              {tooltipKey.members.length > 0 ? tooltipKey.members.join(", ") : "nessun ingrediente"}
            </div>
            {/* codina: sotto se il popup è sopra il pulsante, sopra se è sotto */}
            {tooltipKey.below ? (
              <div style={{ position:"absolute", bottom:"100%", left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderBottom:`6px solid ${th.appInk}` }}/>
            ) : (
              <div style={{ position:"absolute", top:"100%", left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:`6px solid ${th.appInk}` }}/>
            )}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // FASE: RISULTATI
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}
      <div style={{ padding:"12px 20px 6px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={() => setPhase("select")} style={{
          background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10,
          padding:"6px 12px", cursor:"pointer", color:th.appInk,
          fontFamily:F.ui, fontSize:12,
        }}>‹ Ingredienti</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>Ricette per te</div>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{ownedMembers.length} ingredienti in casa</div>
        </div>
      </div>

      {/* Macro section pills (Tutte / Base / Salati / Dolci) */}
      <div style={{ display:"flex", gap:6, padding:"4px 16px 8px", overflowX:"auto", scrollbarWidth:"none", flexShrink:0 }}>
        {[{ id:"tutte", label:"Tutte", emoji:"🍽️" }, ...sortSectionsAltroLast(sectionList).map(s => ({ id:s.id, label:s.label, emoji:s.emoji }))].map(sec => {
          const on = activeMacro === sec.id;
          return (
            <button key={sec.id} onClick={() => setActiveMacro(sec.id)} style={{
              flexShrink:0, padding:"6px 14px", borderRadius:20,
              border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
              background: on ? th.appAccent : "transparent",
              color: on ? "#fff" : th.appFaded,
              fontFamily:F.ui, fontSize:12, fontWeight:600, cursor:"pointer",
              whiteSpace:"nowrap",
            }}>{sec.emoji} {sec.label}</button>
          );
        })}
      </div>

      {/* Tag filter */}
      <div style={{ borderBottom:`1px solid ${th.appBorder}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 16px", overflowX:"auto", scrollbarWidth:"none" }}>
          <button
            onClick={() => setOpenTagGroup(g => g ? null : "open")}
            style={{
              flexShrink:0, padding:"5px 12px", borderRadius:20,
              border:`1.5px solid ${activeTags.length > 0 ? th.appAccent : th.appBorder}`,
              background: activeTags.length > 0 ? `${th.appAccent}15` : "transparent",
              color: activeTags.length > 0 ? th.appAccent : th.appFaded,
              fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
              display:"flex", alignItems:"center", gap:5,
            }}
          >
            🏷 Filtra
            {activeTags.length > 0 && <span style={{ background:th.appAccent, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{activeTags.length}</span>}
            <span style={{ fontSize:10, opacity:0.6 }}>{openTagGroup ? "▲" : "▼"}</span>
          </button>
          {activeTags.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)} style={{
              flexShrink:0, padding:"4px 10px", borderRadius:20,
              background:th.appAccent, color:"#fff", border:"none",
              fontFamily:F.ui, fontSize:10, cursor:"pointer",
              display:"flex", alignItems:"center", gap:4,
            }}>{tag} <span style={{ opacity:0.7 }}>×</span></button>
          ))}
        </div>
        {openTagGroup && (
          <div style={{ padding:"0 16px 10px", maxHeight:200, overflowY:"auto" }}>
            {relevantTagGroups.map(group => (
              <div key={group.group} style={{ marginBottom:6 }}>
                <button
                  onClick={() => setOpenTagGroup(g => g === group.group ? "open" : group.group)}
                  style={{
                    width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
                    padding:"7px 10px", background:th.appCard,
                    border:`1px solid ${th.appBorder}`, borderRadius:10,
                    cursor:"pointer", fontFamily:F.ui, fontSize:12, color:th.appInk,
                  }}
                >
                  <span>{group.group}</span>
                  <span style={{ color:th.appFaded, fontSize:11 }}>{openTagGroup === group.group ? "▲" : "▼"}</span>
                </button>
                {openTagGroup === group.group && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, padding:"6px 4px 2px" }}>
                    {group.tags.map(tag => {
                      const sel = activeTags.includes(tag);
                      return (
                        <button key={tag} onClick={() => toggleTag(tag)} style={{
                          padding:"5px 10px", borderRadius:20,
                          border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                          background: sel ? th.appAccent : "transparent",
                          color: sel ? "#fff" : th.appFaded,
                          fontFamily:F.ui, fontSize:11, cursor:"pointer",
                        }}>{tag}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risultati */}
      <div style={{ flex:1, overflowY:"auto", padding:"12px 18px 40px", display:"flex", flexDirection:"column", gap:12 }}>
        {filteredResults.map(({ recipe, present, missing, total, ratio }) => (
          <div key={recipe.id} style={{
            background:th.appCard, border:`1px solid ${th.appBorder}`,
            borderRadius:16, overflow:"hidden",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:recipe.color, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{recipe.dishPhoto ? "📸" : recipe.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk }}>{recipe.title}</div>
                <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{recipe.category} · {recipe.prepTime+recipe.cookTime} min</div>
              </div>
              <div style={{ textAlign:"center", flexShrink:0 }}>
                <div style={{
                  fontFamily:F.display, fontSize:18, fontWeight:700,
                  color: ratio === 1 ? "#6B8C6E" : ratio >= 0.6 ? th.appAccent2 : th.appFaded,
                }}>{present.length}/{total}</div>
                <div style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded }}>ingredienti</div>
              </div>
            </div>

            <div style={{ height:4, background:th.appBorder, margin:"0 14px" }}>
              <div style={{ height:"100%", width:`${ratio*100}%`, background: ratio===1 ? "#6B8C6E" : th.appAccent, borderRadius:2 }}/>
            </div>

            <div style={{ padding:"10px 14px" }}>
              {present.length > 0 && (
                <div style={{ marginBottom:6 }}>
                  <span style={{ fontFamily:F.ui, fontSize:10, color:"#6B8C6E", fontWeight:700 }}>✓ HAI: </span>
                  <span style={{ fontFamily:F.ui, fontSize:11, color:th.appInk }}>
                    {present.map(p => p.text).join(", ")}
                  </span>
                </div>
              )}
              {missing.length > 0 ? (
                <div>
                  <span style={{ fontFamily:F.ui, fontSize:10, color:"#C4593A", fontWeight:700 }}>✗ MANCA: </span>
                  <span style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>
                    {missing.map(m => m.text).join(", ")}
                  </span>
                </div>
              ) : (
                <div style={{ fontFamily:F.ui, fontSize:11, color:"#6B8C6E", fontWeight:600 }}>
                  🎉 Hai tutto per questa ricetta!
                </div>
              )}
            </div>

            <div style={{ display:"flex", gap:6, padding:"0 14px 12px" }}>
              <button onClick={() => onStartCooking(recipe)} style={{
                flex:1, padding:"9px 4px", borderRadius:10,
                border:`1.5px solid ${th.appBorder}`,
                background:"transparent", color:th.appInk,
                fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
                display:"flex", flexDirection:"column", alignItems:"center", gap:2,
              }}>
                <span style={{ fontSize:15 }}>📖</span>
                Ricetta
              </button>
              <button
                onClick={() => setServingsDialog({ mode:"shopping", recipe, missingClean: missing.map(m => m.clean) })}
                style={{
                  flex:1, padding:"9px 4px", borderRadius:10,
                  border:`1.5px solid ${th.appAccent}`,
                  background:`${th.appAccent}12`, color:th.appAccent,
                  fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                }}>
                <span style={{ fontSize:15 }}>🛒</span>
                Spesa
              </button>
              <button
                onClick={() => setServingsDialog({ mode:"cooking", recipe, missingClean: null })}
                style={{
                  flex:1, padding:"9px 4px", borderRadius:10, border:"none",
                  background:th.appInk, color:"#fff",
                  fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
                  display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                }}>
                <span style={{ fontSize:15 }}>👨‍🍳</span>
                Cucina
              </button>
            </div>
          </div>
        ))}
        {filteredResults.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>
            Nessuna ricetta con questi filtri
          </div>
        )}
      </div>

      {servingsDialog && (
        <ServingsDialog
          recipe={servingsDialog.recipe}
          title={servingsDialog.mode === "shopping" ? "Modalità Spesa" : "Modalità Cucina"}
          emoji={servingsDialog.mode === "shopping" ? "🛒" : "👨‍🍳"}
          onConfirm={(scale) => { setActiveMode({ ...servingsDialog, scale }); setServingsDialog(null); }}
          onClose={() => setServingsDialog(null)}
        />
      )}
      {activeMode?.mode === "shopping" && (
        <ShoppingMode recipe={activeMode.recipe} scale={activeMode.scale} onAddToList={onAddToShoppingList} preselectClean={activeMode.missingClean} onClose={() => setActiveMode(null)}/>
      )}
      {activeMode?.mode === "cooking" && (
        <CookingMode recipe={activeMode.recipe} scale={activeMode.scale} onClose={() => setActiveMode(null)}/>
      )}
    </div>
  );
}
