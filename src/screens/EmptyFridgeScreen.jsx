import React, { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F, INGREDIENT_CATEGORIES, MACRO_SECTIONS } from "../data/constants.js";
import {
  buildFridgeItems, ingDictIndex, flattenIngredients, ingredientToText,
  resolveIngId, sortCategoriesBaseFirst,
} from "../utils/helpers.js";
import GlobalNav from "../components/GlobalNav.jsx";
import BottomNav from "../components/BottomNav.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import AppIcon from "../components/AppIcon.jsx";
import RecipeFilterBar from "../components/RecipeFilterBar.jsx";
import SuggestionHint from "../components/SuggestionHint.jsx";
import SectionCategoryIcon from "../components/SectionCategoryIcon.jsx";
import ChosenIcon from "../components/ChosenIcon.jsx";
import ServingsDialog from "../components/ServingsDialog.jsx";
import ShoppingMode from "../components/ShoppingMode.jsx";
import CookingMode from "./CookingMode.jsx";
import { guideFrigo } from "../data/guideContent.jsx";

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
  // Fase ("select"|"results") e ingredienti posseduti sollevati al genitore:
  // così se si apre una ricetta dai risultati e si torna indietro, si
  // ritrova la stessa schermata invece di ripartire dalla selezione.
  phase, setPhase,
  ownedMembers, setOwnedMembers,
  suggestedAggregates = [],
  onManageAggregates, onManageCategories, onManageCategoriesDb,
}) {
  const th = useTheme();
  const ui = useUiStyle();
  const [navHeight, setNavHeight] = useState(0);
  const [search, setSearch] = useState("");
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

  const analyzedById = React.useMemo(() => new Map(analyzed.map(a => [a.recipe.id, a])), [analyzed]);

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
      infoContent={guideFrigo}
      bottomNavActive
    />
  );

  const bottomNav = ui.navPosition === "bottom" && (
    <BottomNav
      activeScreen="fridge"
      onRecipes={onRecipes}
      onMemories={onMemories}
      onFridge={() => {}}
      onShopping={onShopping}
      onHeightChange={setNavHeight}
    />
  );

  // ══════════════════════════════════════════════════════════
  // FASE: SELEZIONE INGREDIENTI
  // ══════════════════════════════════════════════════════════
  if (phase === "select") {
    // Raggruppa le voci per categoria (una voce può comparire in più categorie).
    // "Altro" è una categoria come le altre: ci finisce solo chi l'ha scelta
    // volutamente. Chi non ha nessuna categoria assegnata non compare qui.
    const byCategory = sortCategoriesBaseFirst(categoryList).map(cat => ({
      ...cat,
      items: filterItems(fridgeItems)
        .filter(it => it.categories.includes(cat.id))
        .sort((a, b) => a.display.localeCompare(b.display, "it")),
    })).filter(c => c.items.length > 0);
    // Sezione a parte, sempre in fondo, per chi non ha nessuna categoria.
    const uncategorizedItems = filterItems(fridgeItems)
      .filter(it => it.uncategorized)
      .sort((a, b) => a.display.localeCompare(b.display, "it"));

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
            padding:"7px 12px", borderRadius: ui.id==="classico" ? 20 : ui.radius.chip,
            border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
            background: sel ? (ui.id==="classico" ? th.appAccent : ui.ink) : "transparent",
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
        <ScreenHeader section="frigo" title="Svuota Frigo" onHome={onLanding} />
        <div style={{ padding:"14px 20px 6px", display:"flex", alignItems:"flex-start", gap:10 }}>
          <div style={{ flex:1 }}>
            {ui.id !== "classico" && (
              <div style={{ fontFamily:F.ui, fontSize:ui.sectionLabel.size, letterSpacing:ui.sectionLabel.spacing, fontWeight:ui.sectionLabel.weight, textTransform:"uppercase", color:ui.muted, marginBottom:2 }}>Passo 1 di 2</div>
            )}
            <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk }}>{ui.id==="classico" ? "🧊 Svuota Frigo" : "Cosa hai in casa?"}</div>
            <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:3, lineHeight:1.5 }}>
              Seleziona gli ingredienti che hai in casa. Quelli <b>base</b> sono già selezionati (puoi deselezionarli).
            </div>
          </div>
        </div>

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

        {/* Suggerimenti verso Organizza Ingredienti: entrambi fissi in cima, tendine collassabili */}
        {(suggestedAggregates.length > 0 && onManageAggregates) || (uncategorizedItems.length > 0 && (onManageCategories || onManageCategoriesDb)) ? (
          <div style={{ padding:"6px 18px 0" }}>
            {suggestedAggregates.length > 0 && onManageAggregates && (
              <SuggestionHint onClick={() => onManageAggregates()}>
                <span style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5 }}>
                  💡 Sono stati rilevati ingredienti con nomi simili. Per un funzionamento ottimale{" "}
                  <span style={{ color:th.appAccent, fontWeight:700, textDecoration:"underline" }}>raggruppali in aggregati o ignora le similitudini</span>.
                </span>
              </SuggestionHint>
            )}
            {uncategorizedItems.length > 0 && (onManageCategories || onManageCategoriesDb) && (
              <SuggestionHint>
                <span style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5 }}>
                  💡 Sono stati rilevati degli ingredienti senza categoria. Per un funzionamento ottimale{" "}
                  {onManageCategories && (
                    <span onClick={() => onManageCategories()} style={{ color:th.appAccent, fontWeight:700, cursor:"pointer", textDecoration:"underline" }}>assegnali a delle categorie esistenti</span>
                  )}
                  {onManageCategories && onManageCategoriesDb && " "}
                  {onManageCategoriesDb && (
                    <>oppure{" "}
                      <span onClick={() => onManageCategoriesDb()} style={{ color:th.appAccent, fontWeight:700, cursor:"pointer", textDecoration:"underline" }}>creane di nuove</span>
                    </>
                  )}
                  .
                </span>
              </SuggestionHint>
            )}
          </div>
        ) : null}

        {/* Lista per categoria */}
        <div onScroll={() => tooltipKey && setTooltipKey(null)} style={{ flex:1, overflowY:"auto", padding:"8px 18px 100px" }}>
          {byCategory.length === 0 && uncategorizedItems.length === 0 ? (
            <div style={{ textAlign:"center", padding:"30px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>
              Nessun ingrediente trovato
            </div>
          ) : (
            <>
              {byCategory.map(cat => (
                <div key={cat.id} style={{ marginBottom:16 }}>
                  <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appAccent, textTransform:"uppercase", margin:"4px 0 8px", fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                    <SectionCategoryIcon item={cat} size={10} /> {cat.label}
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {cat.items.map(renderItemBtn)}
                  </div>
                </div>
              ))}

              {/* Senza categoria: sempre in fondo, sezione a sé rispetto alle categorie vere e proprie */}
              {uncategorizedItems.length > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appAccent, textTransform:"uppercase", margin:"4px 0 8px", fontWeight:700 }}>
                    ❓ Senza categoria
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {uncategorizedItems.map(renderItemBtn)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        <div style={{ position:"absolute", bottom:navHeight, left:0, right:0, padding:"14px 18px 22px", background:`linear-gradient(transparent, ${th.appBg} 30%)` }}>
          {ui.id !== "classico" && ownedMembers.length > 0 && (() => {
            const complete = analyzed.filter(a => a.ratio === 1).length;
            const near = analyzed.filter(a => a.ratio >= 0.6 && a.ratio < 1).length;
            return (
              <div style={{ fontFamily:F.ui, fontSize:11, color:ui.faded, textAlign:"center", marginBottom:8 }}>
                {complete} ricett{complete===1?"a":"e"} complet{complete===1?"a":"e"}{near>0 ? ` · e ${near} quasi` : ""}
              </div>
            );
          })()}
          <button
            onClick={() => setPhase("results")}
            disabled={ownedMembers.length === 0}
            style={{
              width:"100%", padding:"15px",
              background: ownedMembers.length===0 ? th.appBorder : th.appAccent,
              color: ownedMembers.length===0 ? th.appFaded : "#fff",
              border:"none", borderRadius: ui.id==="classico" ? 14 : ui.radius.control+1,
              fontFamily:F.ui, fontSize:14, fontWeight:700,
              cursor: ownedMembers.length===0 ? "default" : "pointer",
            }}
          >
            {ownedMembers.length===0 ? "Seleziona almeno un ingrediente" : ui.id==="classico" ? "Mostra ricette →" : "Vedi"}
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

        {bottomNav}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // FASE: RISULTATI
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <RecipeFilterBar
        recipes={recipes}
        extraTagGroups={extraTagGroups}
        sectionList={sectionList}
        renderNav={() => (
          <>
            {nav}
            <ScreenHeader
              section="frigo"
              title="Ricette per te"
              subtitle={`${ownedMembers.length} ingredienti in casa`}
              onBack={() => setPhase("select")}
              onHome={onLanding}
            />
          </>
        )}
        topAction={ui.id === "classico" ? (
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
        ) : null}
      >
        {(displayRecipes) => {
          const results = displayRecipes
            .map(r => analyzedById.get(r.id))
            .filter(Boolean)
            .sort((a, b) => b.ratio - a.ratio);
          return (
            <div style={{ background:th.appBg, padding:"12px 18px 40px", display:"flex", flexDirection:"column", gap:12 }}>
              {results.map(({ recipe, present, missing, total, ratio }) => (
                <div key={recipe.id} style={{
                  background:th.appCard, border:`1px solid ${th.appBorder}`,
                  borderRadius:16, overflow:"hidden",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px" }}>
                    <div style={{ width:44, height:44, borderRadius:12, background: ui.sectionColor(recipe.macroSection) ?? recipe.color, color:"#fff", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>{recipe.dishPhoto ? <span style={{ fontSize:22 }}>📸</span> : <ChosenIcon emoji={recipe.emoji} icon={recipe.icon} size={22} />}</div>
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
                    {ui.id === "classico" ? (
                      <>
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
                      </>
                    ) : (
                      // Una sola riga "Manca: …" invece dei due elenchi (README §5)
                      missing.length > 0 ? (
                        <div>
                          <span style={{ fontFamily:F.ui, fontSize:10, color:"#C4593A", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>Manca: </span>
                          <span style={{ fontFamily:F.ui, fontSize:11, color:ui.faded }}>{missing.map(m => m.text).join(", ")}</span>
                        </div>
                      ) : (
                        <div style={{ fontFamily:F.ui, fontSize:11, color:"#6B8C6E", fontWeight:600 }}>Hai tutto per questa ricetta</div>
                      )
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
                      <AppIcon emoji="📖" icon="libro" size={15} />
                      Ricetta
                    </button>
                    {(ui.id === "classico" || missing.length > 0) && (
                      <button
                        onClick={() => setServingsDialog({ mode:"shopping", recipe, missingClean: missing.map(m => m.clean) })}
                        style={{
                          flex:1, padding:"9px 4px", borderRadius:10,
                          border:`1.5px solid ${th.appAccent}`,
                          background:`${th.appAccent}12`, color:th.appAccent,
                          fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
                          display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                        }}>
                        <AppIcon emoji="🛒" icon="spesa" size={15} />
                        {ui.id === "classico" ? "Spesa" : `Compra i ${missing.length}`}
                      </button>
                    )}
                    {(ui.id === "classico" || missing.length === 0) && (
                    <button
                      onClick={() => setServingsDialog({ mode:"cooking", recipe, missingClean: null })}
                      style={{
                        flex:1, padding:"9px 4px", borderRadius:10, border:"none",
                        background:th.appInk, color:"#fff",
                        fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                      }}>
                      <AppIcon emoji="👨‍🍳" icon="cottura" size={15} />
                      Cucina
                    </button>
                    )}
                  </div>
                </div>
              ))}
              {results.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>
                  Nessuna ricetta con questi filtri
                </div>
              )}
            </div>
          );
        }}
      </RecipeFilterBar>

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
      {bottomNav}
    </>
  );
}
