import React, { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { sortSectionsAltroLast } from "../utils/helpers.js";
import { F, MACRO_SECTIONS, TAG_GROUPS } from "../data/constants.js";
import GlobalNav from "../components/GlobalNav.jsx";
import BottomNav from "../components/BottomNav.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import FiltersSheet from "../components/FiltersSheet.jsx";
import RecipeCardList from "../components/RecipeCardList.jsx";
import { guideRicette } from "../data/guideContent.jsx";
import AppIcon from "../components/AppIcon.jsx";
import Icon from "../components/Icon.jsx";
import SectionCategoryIcon from "../components/SectionCategoryIcon.jsx";

export default function RecipesScreen({ recipes, onRecipe, onLanding, onBook, onMemories, onAdd, onFridge, onShopping, onExport, extraTagGroups=[], sectionList=MACRO_SECTIONS }) {
  const th = useTheme();
  const ui = useUiStyle();
  const [activeSection, setActiveSection] = useState(null);
  const [activeTags, setActiveTags] = useState([]);
  const [openTagGroup, setOpenTagGroup] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeOpen, setTimeOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const prepBound = Math.max(180, ...recipes.map(r => r.prepTime || 0));
  const cookBound = Math.max(180, ...recipes.map(r => r.cookTime || 0));
  // prepRange/cookRange sono i valori APPLICATI (usati per filtrare); gli
  // slider scrivono invece in draftPrepRange/draftCookRange e si applicano
  // solo al tocco di "Applica" — altrimenti ogni pixel di trascinamento
  // rifiltrerebbe subito tutta la lista, con lag percepibile.
  const [prepRange, setPrepRange] = useState([0, prepBound]);
  const [cookRange, setCookRange] = useState([0, cookBound]);
  const [draftPrepRange, setDraftPrepRange] = useState(prepRange);
  const [draftCookRange, setDraftCookRange] = useState(cookRange);

  const goSection = (id) => {
    setActiveSection(id === activeSection ? null : id);
    setOpenTagGroup(null);
    setShowFavorites(false);
  };
  const goFavorites = () => setShowFavorites(f => !f);
  const toggleTag = (tag) => setActiveTags(prev =>
    prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]
  );
  const resetTime = () => {
    setPrepRange([0, prepBound]); setCookRange([0, cookBound]);
    setDraftPrepRange([0, prepBound]); setDraftCookRange([0, cookBound]);
  };
  const resetAllFilters = () => {
    setActiveSection(null); setActiveTags([]); setShowFavorites(false); resetTime();
  };

  // ── Hierarchical filter ──────────────────────────────────────
  // Level 1: section (macroSection)
  const sectionFiltered = activeSection
    ? recipes.filter(r => r.macroSection === activeSection)
    : recipes;

  // Level 2: tags (within section)
  const tagFiltered = activeTags.length > 0
    ? sectionFiltered.filter(r => activeTags.every(t => r.tags.includes(t)))
    : sectionFiltered;

  // Level 2b: tempo di preparazione/cottura
  const prepActive = prepRange[0] > 0 || prepRange[1] < prepBound;
  const cookActive = cookRange[0] > 0 || cookRange[1] < cookBound;
  const timeActive = prepActive || cookActive;
  const timeFiltered = timeActive
    ? tagFiltered.filter(r => {
        const p = r.prepTime || 0, c = r.cookTime || 0;
        return p >= prepRange[0] && p <= prepRange[1] && c >= cookRange[0] && c <= cookRange[1];
      })
    : tagFiltered;

  // Level 3: preferiti e ricerca (sempre attiva, combinabili)
  const favFiltered = showFavorites ? timeFiltered.filter(r => r.favorite) : timeFiltered;
  const displayRecipes = searchQuery.trim()
    ? favFiltered.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : favFiltered;

  // Only show tag groups that have at least one recipe in current section
  const allTagGroupsWithExtra = [
    ...TAG_GROUPS,
    ...extraTagGroups,
  ];
  const relevantTagGroups = allTagGroupsWithExtra.map(g => ({
    ...g,
    tags: g.tags.filter(t => sectionFiltered.some(r => r.tags.includes(t)))
  })).filter(g => g.tags.length > 0);

  const activeSectionLabel = activeSection ? MACRO_SECTIONS.find(s=>s.id===activeSection)?.label : null;
  const activeFilterCount = (activeSection?1:0) + activeTags.length + (timeActive?1:0) + (showFavorites?1:0);

  // ── Controlli filtro — stesso markup/stessa logica in ogni stile: in
  // "classico" restano aperti sotto la ricerca (com'era), negli stili
  // nuovi si spostano dentro <FiltersSheet> invariati (vedi in fondo).
  const filterControls = (
    <>
      {/* ── Level 1: Section filter pills ── */}
      <div style={{
        display:"flex", flexWrap:"wrap", gap:6, padding: ui.filters==="expanded" ? "8px 16px 8px" : "0 0 12px",
        borderBottom: ui.filters==="expanded" ? `1px solid ${th.appBorder}` : "none", flexShrink:0,
      }}>
        <button
          onClick={() => goSection(null)}
          style={{
            padding:"6px 14px", borderRadius:20, border:"none", flexShrink:0,
            background: !activeSection && !showFavorites ? th.appInk : th.appBorder,
            color: !activeSection && !showFavorites ? "#fff" : th.appFaded,
            fontFamily:F.ui, fontSize:12, fontWeight:600, cursor:"pointer",
          }}
        >Tutte</button>
        {sortSectionsAltroLast(sectionList).map(sec => {
          const active = activeSection === sec.id;
          const count = recipes.filter(r => r.macroSection === sec.id).length;
          return (
            <button key={sec.id} onClick={() => goSection(sec.id)} style={{
              padding:"6px 12px", borderRadius:20, flexShrink:0,
              border:`1.5px solid ${active ? th.appAccent : th.appBorder}`,
              background: active ? th.appAccent : "transparent",
              color: active ? "#fff" : th.appFaded,
              fontFamily:F.ui, fontSize:12, fontWeight:600, cursor:"pointer",
              display:"flex", alignItems:"center", gap:4, transition:"all 0.2s",
            }}>
              <SectionCategoryIcon item={sec} size={13} />
              <span>{sec.label.split(" ").slice(-1)[0]}</span>
              <span style={{ fontSize:10, background: active ? "rgba(255,255,255,0.25)" : th.appBorder, borderRadius:10, padding:"1px 5px", color: active ? "#fff" : th.appFaded }}>{count}</span>
            </button>
          );
        })}
        <button onClick={goFavorites} style={{
          padding:"6px 12px", borderRadius:20, flexShrink:0,
          border:`1.5px solid ${showFavorites ? th.appAccent : th.appBorder}`,
          background: showFavorites ? th.appAccent : "transparent",
          color: showFavorites ? "#fff" : th.appFaded,
          fontFamily:F.ui, fontSize:12, fontWeight:600, cursor:"pointer",
          display:"flex", alignItems:"center", gap:4,
        }}><AppIcon emoji="⭐" icon="preferito" size={12} /> Preferiti</button>
      </div>

      {/* ── Level 2: Tag filter (accordion) ── */}
      <div style={{ borderBottom: ui.filters==="expanded" ? `1px solid ${th.appBorder}` : "none", flexShrink:0 }}>
        {/* Active tags summary row */}
        <div style={{ display:"flex", alignItems:"center", gap:6, padding: ui.filters==="expanded" ? "6px 16px" : "0 0 10px", overflowX:"auto", scrollbarWidth:"none" }}>
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
            <AppIcon emoji="🏷️" icon="tag" size={11} /> Filtra per tag
            {activeTags.length > 0 && (
              <span style={{ background:th.appAccent, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{activeTags.length}</span>
            )}
            <span style={{ fontSize:10, opacity:0.6 }}>{openTagGroup ? "▲" : "▼"}</span>
          </button>

          {/* Active tag chips */}
          {activeTags.map(tag => (
            <button key={tag} onClick={() => toggleTag(tag)} style={{
              flexShrink:0, padding:"4px 10px", borderRadius:20,
              background:th.appAccent, color:"#fff",
              border:"none", fontFamily:F.ui, fontSize:10, cursor:"pointer",
              display:"flex", alignItems:"center", gap:4,
            }}>
              {tag} <span style={{ opacity:0.7 }}>×</span>
            </button>
          ))}

          {activeTags.length > 0 && (
            <button onClick={() => setActiveTags([])} style={{
              flexShrink:0, padding:"4px 10px", borderRadius:20,
              background:"none", border:`1px solid ${th.appBorder}`,
              color:th.appFaded, fontFamily:F.ui, fontSize:10, cursor:"pointer",
            }}>Azzera</button>
          )}
        </div>

        {/* Tag group accordion */}
        {openTagGroup && (
          <div style={{ padding: ui.filters==="expanded" ? "0 16px 10px" : "0 0 10px", maxHeight:240, overflowY:"auto" }}>
            {relevantTagGroups.map(group => (
              <div key={group.group} style={{ marginBottom:6 }}>
                <button
                  onClick={() => setOpenTagGroup(g => g === group.group ? "open" : group.group)}
                  style={{
                    width:"100%", display:"flex", justifyContent:"space-between",
                    alignItems:"center", padding:"7px 10px",
                    background: th.appCard, border:`1px solid ${th.appBorder}`,
                    borderRadius:10, cursor:"pointer",
                    fontFamily:F.ui, fontSize:12, color:th.appInk,
                  }}
                >
                  <span>
                    {group.group}
                    {group.tags.filter(t => activeTags.includes(t)).length > 0 && (
                      <span style={{ marginLeft:6, background:th.appAccent, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>
                        {group.tags.filter(t => activeTags.includes(t)).length}
                      </span>
                    )}
                  </span>
                  <span style={{ color:th.appFaded, fontSize:11 }}>{openTagGroup === group.group ? "▲" : "▼"}</span>
                </button>

                {openTagGroup === group.group && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, padding:"6px 4px 2px" }}>
                    {group.tags.map(tag => {
                      const sel = activeTags.includes(tag);
                      const count = sectionFiltered.filter(r => r.tags.includes(tag)).length;
                      return (
                        <button key={tag} onClick={() => toggleTag(tag)} style={{
                          padding:"5px 10px", borderRadius:20,
                          border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                          background: sel ? th.appAccent : "transparent",
                          color: sel ? "#fff" : th.appFaded,
                          fontFamily:F.ui, fontSize:11, cursor:"pointer",
                          display:"flex", alignItems:"center", gap:4,
                        }}>
                          {tag}
                          <span style={{ fontSize:9, opacity:0.7 }}>({count})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Level 2b: Filtro tempo di preparazione/cottura (accordion, applicato solo su "Applica") ── */}
      <div style={{ borderBottom: ui.filters==="expanded" ? `1px solid ${th.appBorder}` : "none", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding: ui.filters==="expanded" ? "6px 16px" : "0 0 6px", overflowX:"auto", scrollbarWidth:"none" }}>
          <button onClick={() => setTimeOpen(o => {
            if (!o) { setDraftPrepRange(prepRange); setDraftCookRange(cookRange); }
            return !o;
          })} style={{
            flexShrink:0, padding:"5px 12px", borderRadius:20,
            border:`1.5px solid ${timeActive ? th.appAccent : th.appBorder}`,
            background: timeActive ? `${th.appAccent}15` : "transparent",
            color: timeActive ? th.appAccent : th.appFaded,
            fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
            display:"flex", alignItems:"center", gap:5,
          }}>
            <AppIcon emoji="⏱️" icon="tempo" size={11} /> Tempo
            {timeActive && (
              <span style={{ background:th.appAccent, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:9.5, fontWeight:700, display:"inline-flex", alignItems:"center", gap:5 }}>
                {[
                  prepActive && <span key="prep" style={{ display:"inline-flex", alignItems:"center", gap:2 }}><AppIcon emoji="🍳" icon="preparazione" size={9.5} />{prepRange[0]}–{prepRange[1] >= prepBound ? prepBound+"+" : prepRange[1]}</span>,
                  cookActive && <span key="cook" style={{ display:"inline-flex", alignItems:"center", gap:2 }}><AppIcon emoji="🔥" icon="cottura" size={9.5} />{cookRange[0]}–{cookRange[1] >= cookBound ? cookBound+"+" : cookRange[1]}</span>,
                ].filter(Boolean)}
              </span>
            )}
            <span style={{ fontSize:10, opacity:0.6 }}>{timeOpen ? "▲" : "▼"}</span>
          </button>
          {timeActive && (
            <button onClick={resetTime} style={{
              flexShrink:0, padding:"4px 10px", borderRadius:20,
              background:"none", border:`1px solid ${th.appBorder}`,
              color:th.appFaded, fontFamily:F.ui, fontSize:10, cursor:"pointer",
            }}>Azzera</button>
          )}
        </div>
        {timeOpen && (
          <div style={{ padding: ui.filters==="expanded" ? "2px 16px 12px" : "2px 0 12px", display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { emoji:"🍳", icon:"preparazione", label:"Preparazione", range:draftPrepRange, setRange:setDraftPrepRange, bound:prepBound },
              { emoji:"🔥", icon:"cottura", label:"Cottura", range:draftCookRange, setRange:setDraftCookRange, bound:cookBound },
            ].map(({ emoji, icon, label, range, setRange, bound }) => (
              <div key={label}>
                <div style={{ display:"flex", justifyContent:"space-between", fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:4 }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}><AppIcon emoji={emoji} icon={icon} size={11} />{label}</span>
                  <span>{range[0]}–{range[1] >= bound ? `${bound}+` : range[1]} min</span>
                </div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <div style={{ flex:1 }}>
                    <input type="range" min={0} max={bound} step={5} value={range[0]}
                      onChange={e => setRange([Math.min(Number(e.target.value), range[1]), range[1]])}
                      style={{ width:"100%", accentColor:th.appAccent }}
                    />
                    <div style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded, textAlign:"center" }}>min</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <input type="range" min={0} max={bound} step={5} value={range[1]}
                      onChange={e => setRange([range[0], Math.max(Number(e.target.value), range[0])])}
                      style={{ width:"100%", accentColor:th.appAccent }}
                    />
                    <div style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded, textAlign:"center" }}>max</div>
                  </div>
                </div>
              </div>
            ))}
            {ui.filters==="expanded" && (
              <button onClick={() => { setPrepRange(draftPrepRange); setCookRange(draftCookRange); setTimeOpen(false); }} style={{
                padding:"9px", borderRadius:10, border:"none",
                background:th.appAccent, color:"#fff",
                fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer",
              }}>✓ Applica</button>
            )}
          </div>
        )}
      </div>
    </>
  );

  // ── Riepilogo filtri attivi (solo stili "sheet"), sotto la ricerca ──
  const filterSummaryChip = (label, onRemove) => (
    <button key={label} onClick={onRemove} style={{
      flexShrink:0, display:"flex", alignItems:"center", gap:5,
      padding: ui.id==="quaderno" ? "2px 0" : "4px 10px",
      borderRadius: ui.id==="quaderno" ? 0 : 20,
      border: ui.id==="quaderno" ? "none" : `1px solid ${th.appAccent}`,
      background: ui.id==="quaderno" ? "none" : `${th.appAccent}12`,
      color: th.appAccent, cursor:"pointer",
      fontFamily:F.ui, fontSize: ui.id==="quaderno" ? 10 : 10.5, fontWeight:700,
      textTransform: ui.id==="quaderno" ? "uppercase" : "none", letterSpacing: ui.id==="quaderno" ? 0.6 : 0,
    }}>{label} <span style={{ opacity:0.7 }}>×</span></button>
  );

  return (
    <div style={{ background:th.appBg, minHeight:"100%", position:"relative", display:"flex", flexDirection:"column" }}>
      <GlobalNav
        activeScreen="recipes"
        onRecipes={() => {}}
        onBook={onBook}
        onMemories={onMemories}
        onAdd={onAdd}
        onFridge={onFridge}
        onShopping={onShopping}
        onLanding={onLanding}
        onExport={onExport}
        activeLabel={activeSectionLabel || "Libro Ricette"}
        infoContent={guideRicette}
        bottomNavActive
      />

      <ScreenHeader
        section="ricette"
        title={activeSectionLabel || "Libro Ricette"}
        subtitle={`${displayRecipes.length} ricett${displayRecipes.length===1?"a":"e"}`}
        onHome={onLanding}
        infoContent={guideRicette}
        actions={[
          { icon:"libro", label:"Vista libro", onClick:onBook },
          ...(onExport ? [{ icon:"esporta", label:"Esporta ricettario", onClick:onExport }] : []),
        ]}
      />

      {/* ── Pulsante nuova ricetta (solo classico: negli altri stili è nella testa) ── */}
      {ui.navPosition !== "bottom" && (
        <div style={{ padding:"10px 24px 2px", textAlign:"center" }}>
          <button onClick={() => onAdd("recipe")} title="Nuova ricetta" style={{
            padding:"9px 20px", borderRadius:20,
            background:th.appAccent, border:"none", cursor:"pointer",
            color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700,
          }}>＋ Nuova ricetta</button>
        </div>
      )}

      {/* ── Nuova ricetta, negli stili nuovi: non più un'icona nell'header
          (troppo poco evidente), un pulsante pieno in cima alla lista,
          prima della ricerca. ── */}
      {ui.navPosition === "bottom" && (
        <div style={{ padding:`10px ${ui.padX}px 2px` }}>
          <button onClick={() => onAdd("recipe")} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            padding:"13px", borderRadius:ui.radius.control, border:"none",
            background:ui.accent, color:"#fff", cursor:"pointer",
            fontFamily:F.ui, fontSize:14, fontWeight:700,
          }}>
            <Icon name="aggiungi" size={18} /> Nuova ricetta
          </button>
        </div>
      )}

      {/* ── Ricerca sempre visibile (come nelle altre sezioni); negli stili
          nuovi condivide la riga con il pulsante Filtri (80/20). ── */}
      <div style={{ padding: ui.navPosition==="bottom" ? `4px ${ui.padX}px 4px` : "8px 16px 4px", display:"flex", gap:8 }}>
        <div style={{ flex:1, minWidth:0, display:"flex", gap:8, alignItems:"center", background:th.appCard, border:`1.5px solid ${searchQuery ? th.appAccent : th.appBorder}`, borderRadius: ui.radius.control, padding:"9px 14px" }}>
          <span style={{ color:th.appFaded }}><AppIcon emoji="🔍" icon="cerca" size={15} /></span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca ricetta…"
            style={{ flex:1, background:"none", border:"none", fontFamily:F.body, fontSize:14, color:th.appInk, outline:"none" }}
          />
          {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background:"none", border:"none", color:th.appFaded, cursor:"pointer", fontSize:16 }}>×</button>}
        </div>
        {ui.filters !== "expanded" && (
          <button onClick={() => setSheetOpen(true)} title="Filtri" style={{
            position:"relative", flexShrink:0, width:44,
            display:"flex", alignItems:"center", justifyContent:"center",
            border:`1.5px solid ${activeFilterCount>0 ? th.appAccent : th.appBorder}`,
            borderRadius: ui.radius.control,
            background: activeFilterCount>0 ? `${th.appAccent}12` : th.appCard,
            color: activeFilterCount>0 ? th.appAccent : ui.faded,
            cursor:"pointer",
          }}>
            <Icon name="altro" size={18} />
            {activeFilterCount>0 && (
              <span style={{ position:"absolute", top:-5, right:-5, background:th.appAccent, color:"#fff", borderRadius:8, minWidth:16, height:16, fontSize:9, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 3px" }}>{activeFilterCount}</span>
            )}
          </button>
        )}
      </div>

      {ui.filters === "expanded" ? (
        filterControls
      ) : (
        <>
          {/* Riepilogo filtri attivi — il pulsante Filtri è sulla riga della ricerca, qui sopra */}
          {(activeSectionLabel || showFavorites || activeTags.length > 0 || timeActive) && (
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", padding:`2px ${ui.padX}px 10px` }}>
              {activeSectionLabel && filterSummaryChip(activeSectionLabel, () => setActiveSection(null))}
              {showFavorites && filterSummaryChip("Preferiti", () => setShowFavorites(false))}
              {activeTags.map(tag => filterSummaryChip(tag, () => toggleTag(tag)))}
              {timeActive && filterSummaryChip("Tempo", resetTime)}
              {activeFilterCount > 0 && (
                <button onClick={resetAllFilters} style={{
                  background:"none", border:"none", cursor:"pointer",
                  fontFamily:F.ui, fontSize:11, color:ui.faded, textDecoration:"underline",
                }}>azzera</button>
              )}
            </div>
          )}

          <FiltersSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            onApply={() => { setPrepRange(draftPrepRange); setCookRange(draftCookRange); setTimeOpen(false); }}
            onReset={resetAllFilters}
            activeCount={activeFilterCount}
            title="Filtri"
          >
            {filterControls}
          </FiltersSheet>
        </>
      )}

      {/* Results count (solo classico: negli altri stili il conteggio è già nella testa) */}
      {ui.navPosition !== "bottom" && (
        <div style={{ padding:"6px 20px 2px", fontFamily:F.ui, fontSize:11, color:th.appFaded }}>
          {displayRecipes.length} ricett{displayRecipes.length===1?"a":"e"}
          {activeSectionLabel && ` · ${activeSectionLabel}`}
          {activeTags.length > 0 && ` · ${activeTags.length} tag`}
          {timeActive && <> · <AppIcon emoji="⏱️" icon="tempo" size={11} style={{ verticalAlign:"-1px" }} /> tempo</>}
          {showFavorites && <> · <AppIcon emoji="⭐" icon="preferito" size={11} style={{ verticalAlign:"-1px" }} /> Preferiti</>}
        </div>
      )}

      {/* Recipe list — negli stili nuovi flex:1+overflowY riempie lo spazio
          rimasto sotto ricerca/filtri, così <BottomNav> (sticky bottom:0,
          sibling qui sotto) resta ancorato in fondo anche con pochi
          risultati, invece di comparire subito dopo un elenco corto.
          Classico non tocca questo ramo: scroll di pagina naturale come
          sempre, nessun contenitore interno. */}
      <div style={{
        padding: ui.navPosition==="bottom" ? `6px ${ui.padX}px 60px` : "6px 20px 60px",
        display:"flex", flexDirection:"column", gap:10,
        ...(ui.navPosition==="bottom" ? { flex:1, overflowY:"auto" } : {}),
      }}>
        {displayRecipes.length === 0
          ? <div style={{ textAlign:"center", padding:"40px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>
              Nessuna ricetta trovata
            </div>
          : displayRecipes.map(r => (
              <RecipeCardList key={r.id} recipe={r} onClick={() => onRecipe(r)}/>
            ))
        }
      </div>

      {ui.navPosition === "bottom" && (
        <BottomNav
          activeScreen="recipes"
          onRecipes={() => {}}
          onMemories={onMemories}
          onFridge={onFridge}
          onShopping={onShopping}
        />
      )}
    </div>
  );
}
