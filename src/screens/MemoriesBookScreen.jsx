import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { memorySortKey, memoryPeriodLabel } from "../utils/helpers.js";
import MemoryPhoto from "../components/MemoryPhoto.jsx";
import PhotoLightbox from "../components/PhotoLightbox.jsx";
import GlobalNav from "../components/GlobalNav.jsx";
import { guideRicordi } from "../data/guideContent.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: MEMORIES BOOK — all photos, each linked to recipes
// ══════════════════════════════════════════════════════════════
// Vista "ricordo aperto" a piena pagina — modalità libro, due ricordi per pagina
const MemoryOpenPage = ({ mems, linkedFor, onRecipe, th, confirmDeleteId, onRequestDelete, onConfirmDelete, onCancelDelete }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:14, padding:"6px 4px" }}>
    {mems.map(mem => {
      const linked = linkedFor(mem);
      return (
        <div key={mem.id} style={{ position:"relative", background:th.bookBg || "#f5efe2", borderRadius:16, overflow:"hidden", border:`1px solid ${th.bookBorder || th.appBorder}`, boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
          <MemoryPhoto mem={mem} height={190}/>
          <button
            onClick={() => onRequestDelete(mem.id)}
            style={{
              position:"absolute", top:8, right:8,
              width:24, height:24, borderRadius:"50%",
              background:"rgba(0,0,0,0.45)", color:"#fff",
              border:"none", cursor:"pointer",
              fontSize:12, display:"flex", alignItems:"center", justifyContent:"center",
            }}>×</button>
          {confirmDeleteId === mem.id && (
            <div style={{
              position:"absolute", inset:0,
              background:"rgba(0,0,0,0.75)",
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              gap:8, padding:10,
            }}>
              <div style={{ fontFamily:F.ui, fontSize:12, color:"#fff", textAlign:"center" }}>
                Eliminare questo ricordo?
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={onCancelDelete} style={{
                  padding:"6px 14px", borderRadius:8,
                  background:"rgba(255,255,255,0.2)", color:"#fff",
                  border:"none", fontFamily:F.ui, fontSize:12, cursor:"pointer",
                }}>Annulla</button>
                <button onClick={() => onConfirmDelete(mem.id)} style={{
                  padding:"6px 14px", borderRadius:8,
                  background:"#D93025", color:"#fff",
                  border:"none", fontFamily:F.ui, fontSize:12, cursor:"pointer", fontWeight:700,
                }}>Elimina</button>
              </div>
            </div>
          )}
          <div style={{ padding:"12px 16px 16px" }}>
            <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, marginBottom:5 }}>📅 {mem.date}</div>
            {mem.caption && <div style={{ fontFamily:F.display, fontSize:17, color:th.appInk, fontStyle:"italic", marginBottom:7, lineHeight:1.3 }}>"{mem.caption}"</div>}
            {mem.story && <div style={{ fontFamily:F.body, fontSize:13, color:th.appInk, lineHeight:1.6, marginBottom:10 }}>{mem.story}</div>}
            <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:4 }}>
              {linked.map(r => (
                <button key={r.id} onClick={() => onRecipe(r)} style={{
                  display:"flex", alignItems:"center", gap:5,
                  background:`${r.color}18`, border:`1px solid ${r.color}30`,
                  borderRadius:9, padding:"5px 10px", cursor:"pointer",
                }}>
                  <span style={{ fontSize:13 }}>{r.emoji}</span>
                  <span style={{ fontFamily:F.ui, fontSize:11, color:r.color, fontWeight:600 }}>{r.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default function MemoriesBookScreen({ recipes, onBack, onRecipe, onRecipes, onBook, onAdd, onFridge, onShopping, onDeleteMemory }) {
  const th = useTheme();
  const [lightbox, setLightbox] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "book"
  const [pageIndex, setPageIndex] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const handleConfirmDelete = (memId) => { onDeleteMemory(memId); setConfirmDeleteId(null); };

  // Raccoglie tutti i ricordi da tutte le ricette, deduplica per id
  const allMemories = [];
  const seen = new Set();
  recipes.forEach(r => {
    (r.memories||[]).forEach(m => {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        allMemories.push({ ...m, recipeIds: m.recipeIds || [r.id] });
      }
    });
  });
  // Ordine cronologico dal più recente
  allMemories.sort((a, b) => memorySortKey(b).localeCompare(memorySortKey(a)));

  const getRecipesForMemory = (mem) =>
    (mem.recipeIds||[]).map(rid => recipes.find(r => r.id === rid)).filter(Boolean);

  // Raggruppa per periodo (per le intestazioni del diario)
  const groups = [];
  let lastPeriod = null;
  allMemories.forEach(mem => {
    const p = memoryPeriodLabel(mem.dateISO);
    if (p !== lastPeriod) { groups.push({ period:p, items:[] }); lastPeriod = p; }
    groups[groups.length-1].items.push(mem);
  });

  // Pagine per la vista libro: 2 ricordi per pagina
  const pages = [];
  for (let i=0; i<allMemories.length; i+=2) pages.push(allMemories.slice(i, i+2));
  const safePage = Math.min(pageIndex, Math.max(0, pages.length-1));

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {lightbox && <PhotoLightbox photo={lightbox.photo} caption={lightbox.caption} date={lightbox.date} isImage={lightbox.isImage} onClose={() => setLightbox(null)}/>}
      <GlobalNav
        activeScreen="memories"
        onRecipes={onRecipes}
        onBook={onBook}
        onMemories={() => {}}
        onAdd={onAdd}
        onFridge={onFridge}
        onShopping={onShopping}
        onLanding={onBack}
        activeLabel="Libro dei Ricordi"
        infoContent={guideRicordi}
        viewToggle={allMemories.length > 0 ? {
          isBook: viewMode === "book",
          onCards: () => setViewMode("cards"),
          onBook: () => setViewMode("book"),
        } : null}
      />

      {/* Nuovo ricordo */}
      <div style={{ padding:"10px 24px 2px", textAlign:"center" }}>
        <button onClick={() => onAdd("memory")} style={{
          padding:"9px 20px", borderRadius:20,
          background:th.appAccent, border:"none", cursor:"pointer",
          color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700,
        }}>＋ Nuovo ricordo</button>
      </div>

      {allMemories.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 24px", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>
          Nessun ricordo ancora — aggiungine uno da qui o dalla scheda di una ricetta!
        </div>
      ) : viewMode === "cards" ? (
        // ─────────── VISTA SCHEDE (diario per periodo) ───────────
        <div style={{ flex:1, overflowY:"auto", padding:"6px 16px 40px" }}>
          {groups.map(group => (
            <div key={group.period} style={{ marginBottom:18 }}>
              <div style={{ fontFamily:F.display, fontSize:14, color:th.appAccent, fontStyle:"italic", margin:"6px 2px 10px", display:"flex", alignItems:"center", gap:8 }}>
                {group.period}
                <span style={{ flex:1, height:1, background:th.appBorder }}/>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {group.items.map(mem => {
                  const linked = getRecipesForMemory(mem);
                  return (
                    <div key={mem.id} style={{
                      position:"relative",
                      background:th.appCard, border:`1px solid ${th.appBorder}`,
                      borderRadius:14, overflow:"hidden",
                    }}>
                      <div onClick={() => setLightbox({ photo:mem.photo, caption:mem.caption, date:mem.date, isImage:mem.photoIsImage })}
                        style={{ cursor:"pointer", position:"relative" }}>
                        <MemoryPhoto mem={mem} height={110}/>
                        <div style={{ position:"absolute", bottom:4, right:6, fontSize:12, opacity:0.55, color:"#fff", textShadow:"0 1px 2px rgba(0,0,0,0.5)" }}>⤢</div>
                      </div>
                      <button
                        onClick={() => setConfirmDeleteId(mem.id)}
                        style={{
                          position:"absolute", top:6, right:6,
                          width:22, height:22, borderRadius:"50%",
                          background:"rgba(0,0,0,0.45)", color:"#fff",
                          border:"none", cursor:"pointer",
                          fontSize:11, display:"flex", alignItems:"center", justifyContent:"center",
                        }}>×</button>
                      {confirmDeleteId === mem.id && (
                        <div style={{
                          position:"absolute", inset:0,
                          background:"rgba(0,0,0,0.75)",
                          display:"flex", flexDirection:"column",
                          alignItems:"center", justifyContent:"center",
                          gap:8, padding:10,
                        }}>
                          <div style={{ fontFamily:F.ui, fontSize:11, color:"#fff", textAlign:"center" }}>
                            Eliminare questo ricordo?
                          </div>
                          <div style={{ display:"flex", gap:6 }}>
                            <button onClick={() => setConfirmDeleteId(null)} style={{
                              padding:"5px 12px", borderRadius:8,
                              background:"rgba(255,255,255,0.2)", color:"#fff",
                              border:"none", fontFamily:F.ui, fontSize:11, cursor:"pointer",
                            }}>Annulla</button>
                            <button onClick={() => handleConfirmDelete(mem.id)} style={{
                              padding:"5px 12px", borderRadius:8,
                              background:"#D93025", color:"#fff",
                              border:"none", fontFamily:F.ui, fontSize:11, cursor:"pointer", fontWeight:700,
                            }}>Elimina</button>
                          </div>
                        </div>
                      )}
                      <div style={{ padding:"8px 10px 10px" }}>
                        {mem.caption && <div style={{ fontFamily:F.body, fontSize:12, color:th.appInk, fontStyle:"italic", lineHeight:1.4, marginBottom:4 }}>"{mem.caption}"</div>}
                        {mem.story && <div style={{ fontFamily:F.body, fontSize:11, color:th.appFaded, lineHeight:1.45, marginBottom:5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{mem.story}</div>}
                        <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginBottom:6 }}>📅 {mem.date}</div>
                        {linked.map(r => (
                          <button key={r.id} onClick={() => onRecipe(r)} style={{
                            display:"flex", alignItems:"center", gap:5, marginBottom:3,
                            background:`${r.color}18`, border:`1px solid ${r.color}30`,
                            borderRadius:8, padding:"3px 8px", cursor:"pointer",
                          }}>
                            <span style={{ fontSize:12 }}>{r.emoji}</span>
                            <span style={{ fontFamily:F.ui, fontSize:10, color:r.color, fontWeight:600 }}>{r.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ─────────── VISTA LIBRO (ricordo aperto, 2 per pagina) ───────────
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ flex:1, overflowY:"auto", padding:"8px 16px 12px" }}>
            {pages[safePage] && (
              <MemoryOpenPage
                mems={pages[safePage]} linkedFor={getRecipesForMemory} onRecipe={onRecipe} th={th}
                confirmDeleteId={confirmDeleteId}
                onRequestDelete={setConfirmDeleteId}
                onConfirmDelete={handleConfirmDelete}
                onCancelDelete={() => setConfirmDeleteId(null)}
              />
            )}
          </div>
          {/* Controlli pagina */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 20px", borderTop:`1px solid ${th.appBorder}`, background:th.appBg, flexShrink:0 }}>
            <button onClick={() => setPageIndex(p => Math.max(0, p-1))} disabled={safePage===0} style={{
              background:"none", border:"none", cursor: safePage===0 ? "default" : "pointer",
              color: safePage===0 ? th.appBorder : th.appInk, fontFamily:F.ui, fontSize:13,
            }}>‹ Prec.</button>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>pagina {safePage+1} di {pages.length}</div>
            <button onClick={() => setPageIndex(p => Math.min(pages.length-1, p+1))} disabled={safePage>=pages.length-1} style={{
              background:"none", border:"none", cursor: safePage>=pages.length-1 ? "default" : "pointer",
              color: safePage>=pages.length-1 ? th.appBorder : th.appInk, fontFamily:F.ui, fontSize:13,
            }}>Succ. ›</button>
          </div>
        </div>
      )}
    </div>
  );
}
