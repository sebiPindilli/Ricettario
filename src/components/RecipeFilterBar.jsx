import React, { useState } from "react";
import { useTheme } from "../context.js";
import { sortSectionsAltroLast } from "../utils/helpers.js";
import { F, MACRO_SECTIONS, TAG_GROUPS } from "../data/constants.js";

// COMPONENT: RecipeFilterBar — barra filtri condivisa (schede + libro)
// Gestisce ricerca, sezioni, tag, preferiti; espone la lista filtrata
// tramite render-prop: <RecipeFilterBar ...>{(list) => (...)}</RecipeFilterBar>
export default function RecipeFilterBar({ recipes, extraTagGroups = [], sectionList = MACRO_SECTIONS, compact = false, bookMode = false, renderNav = null, topAction = null, children }) {
  const th = useTheme();
  const [activeSection, setActiveSection] = useState(null);
  const [activeTags, setActiveTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [openTagGroup, setOpenTagGroup] = useState(null);

  const goSection = (id) => {
    setActiveSection(id === activeSection ? null : id);
    setOpenTagGroup(null);
    setShowFavorites(false);
  };
  const goFavorites = () => setShowFavorites(f => !f);
  const toggleTag = (tag) => setActiveTags(prev =>
    prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]
  );

  const sectionFiltered = activeSection
    ? recipes.filter(r => r.macroSection === activeSection)
    : recipes;
  const tagFiltered = activeTags.length > 0
    ? sectionFiltered.filter(r => activeTags.every(t => r.tags.includes(t)))
    : sectionFiltered;
  const favFiltered = showFavorites ? tagFiltered.filter(r => r.favorite) : tagFiltered;
  const displayRecipes = searchQuery.trim()
    ? favFiltered.filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : favFiltered;

  const allTagGroupsWithExtra = [ ...TAG_GROUPS, ...extraTagGroups ];
  const relevantTagGroups = allTagGroupsWithExtra.map(g => ({
    ...g,
    tags: g.tags.filter(t => sectionFiltered.some(r => r.tags.includes(t)))
  })).filter(g => g.tags.length > 0);

  return (
    <>
      {renderNav && renderNav()}
      {topAction}
      {/* Ricerca */}
      <div style={{ padding:"8px 16px 4px" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", background:th.appCard, border:`1.5px solid ${searchQuery ? th.appAccent : th.appBorder}`, borderRadius:12, padding:"9px 14px" }}>
          <span style={{ fontSize:15 }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cerca ricetta…"
            style={{ flex:1, background:"none", border:"none", fontFamily:F.body, fontSize:14, color:th.appInk, outline:"none" }}
          />
          {searchQuery && <button onClick={() => setSearchQuery("")} style={{ background:"none", border:"none", color:th.appFaded, cursor:"pointer", fontSize:16 }}>×</button>}
        </div>
      </div>

      {/* Pillole sezione */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"8px 16px 8px", borderBottom:`1px solid ${th.appBorder}`, flexShrink:0 }}>
        <button onClick={() => goSection(null)} style={{
          padding:"6px 14px", borderRadius:20, border:"none", flexShrink:0,
          background: !activeSection && !showFavorites ? th.appInk : th.appBorder,
          color: !activeSection && !showFavorites ? "#fff" : th.appFaded,
          fontFamily:F.ui, fontSize:12, fontWeight:600, cursor:"pointer",
        }}>Tutte</button>
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
              <span>{sec.emoji}</span>
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
        }}>⭐ Preferiti</button>
      </div>

      {/* Tag (accordion) */}
      <div style={{ borderBottom:`1px solid ${th.appBorder}`, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 16px", overflowX:"auto", scrollbarWidth:"none" }}>
          <button onClick={() => setOpenTagGroup(g => g ? null : "open")} style={{
            flexShrink:0, padding:"5px 12px", borderRadius:20,
            border:`1.5px solid ${activeTags.length > 0 ? th.appAccent : th.appBorder}`,
            background: activeTags.length > 0 ? `${th.appAccent}15` : "transparent",
            color: activeTags.length > 0 ? th.appAccent : th.appFaded,
            fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
            display:"flex", alignItems:"center", gap:5,
          }}>
            🏷️ Filtra per tag
            {activeTags.length > 0 && (
              <span style={{ background:th.appAccent, color:"#fff", borderRadius:10, padding:"1px 6px", fontSize:10 }}>{activeTags.length}</span>
            )}
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
          {activeTags.length > 0 && (
            <button onClick={() => setActiveTags([])} style={{
              flexShrink:0, padding:"4px 10px", borderRadius:20,
              background:"none", border:`1px solid ${th.appBorder}`,
              color:th.appFaded, fontFamily:F.ui, fontSize:10, cursor:"pointer",
            }}>Azzera</button>
          )}
        </div>
        {openTagGroup && (
          <div style={{ padding:"0 16px 10px", maxHeight:240, overflowY:"auto" }}>
            {relevantTagGroups.map(group => (
              <div key={group.group} style={{ marginBottom:6 }}>
                <button onClick={() => setOpenTagGroup(g => g === group.group ? "open" : group.group)} style={{
                  width:"100%", display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"7px 10px",
                  background: th.appCard, border:`1px solid ${th.appBorder}`,
                  borderRadius:10, cursor:"pointer",
                  fontFamily:F.ui, fontSize:12, color:th.appInk,
                }}>
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
                        }}>{tag} <span style={{ fontSize:9, opacity:0.7 }}>({count})</span></button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render-prop: la lista filtrata */}
      {children(displayRecipes, { activeSection, activeTags, showFavorites, searchQuery })}
    </>
  );
}
