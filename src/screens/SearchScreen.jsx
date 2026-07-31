import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F, TAG_GROUPS } from "../data/constants.js";
import BackBtn from "../components/BackBtn.jsx";
import RecipeCardList from "../components/RecipeCardList.jsx";

export default function SearchScreen({ recipes, onBack, onRecipe }) {
  const th = useTheme();
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [openGroup, setOpenGroup] = useState(null);

  const toggleTag = (tag) => setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]
  );

  const results = recipes.filter(r => {
    const matchQuery = !query || r.title.toLowerCase().includes(query.toLowerCase());
    const matchTags = selectedTags.length === 0 || selectedTags.every(t => r.tags.includes(t));
    return matchQuery && matchTags;
  });

  return (
    <div style={{ background:th.appBg, minHeight:"100%" }}>
      <div style={{ padding:"8px 20px 0", display:"flex", alignItems:"center", gap:12 }}>
        <BackBtn onBack={onBack} label="Indietro"/>
        <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>Cerca</div>
      </div>

      {/* Search input */}
      <div style={{ padding:"12px 20px 0" }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", background:th.appCard, border:`1.5px solid ${query ? th.appAccent : th.appBorder}`, borderRadius:12, padding:"10px 14px" }}>
          <span style={{ fontSize:16 }}>🔍</span>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Cerca per nome…"
            autoFocus
            style={{ flex:1, background:"none", border:"none", fontFamily:F.body, fontSize:15, color:th.appInk, outline:"none" }}
          />
          {query && <button onClick={() => setQuery("")} style={{ background:"none", border:"none", color:th.appFaded, cursor:"pointer", fontSize:16 }}>×</button>}
        </div>
      </div>

      {/* Tag filters by group */}
      <div style={{ padding:"12px 20px 0" }}>
        <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", marginBottom:8 }}>Filtra per tag</div>
        {TAG_GROUPS.map(group => (
          <div key={group.group} style={{ marginBottom:6 }}>
            <button onClick={() => setOpenGroup(openGroup===group.group ? null : group.group)} style={{
              width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"8px 12px", background:th.appCard, border:`1px solid ${th.appBorder}`,
              borderRadius:10, cursor:"pointer", fontFamily:F.ui, fontSize:13, color:th.appInk,
            }}>
              <span>{group.group}
                {group.tags.filter(t => selectedTags.includes(t)).length > 0 &&
                  <span style={{ marginLeft:8, background:th.appAccent, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:10 }}>
                    {group.tags.filter(t => selectedTags.includes(t)).length}
                  </span>
                }
              </span>
              <span style={{ color:th.appFaded }}>{openGroup===group.group ? "▲" : "▼"}</span>
            </button>
            {openGroup===group.group && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"8px 4px 4px" }}>
                {group.tags.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} style={{
                    padding:"5px 12px", borderRadius:20,
                    border:`1.5px solid ${selectedTags.includes(tag) ? th.appAccent : th.appBorder}`,
                    background: selectedTags.includes(tag) ? th.appAccent : "transparent",
                    color: selectedTags.includes(tag) ? "#fff" : th.appFaded,
                    fontFamily:F.ui, fontSize:11, cursor:"pointer",
                  }}>{tag}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Results */}
      <div style={{ padding:"16px 20px 40px" }}>
        <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginBottom:10 }}>
          {results.length} {results.length===1 ? "ricetta trovata" : "ricette trovate"}
          {selectedTags.length > 0 && <button onClick={() => setSelectedTags([])} style={{ marginLeft:8, background:"none", border:"none", color:th.appAccent, cursor:"pointer", fontFamily:F.ui, fontSize:12 }}>Azzera filtri</button>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {results.map(r => <RecipeCardList key={r.id} recipe={r} onClick={() => onRecipe(r)}/>)}
        </div>
      </div>
    </div>
  );
}
