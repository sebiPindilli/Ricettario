import React from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import GlobalNav from "./GlobalNav.jsx";
import BottomNav from "./BottomNav.jsx";
import ScreenHeader from "./ScreenHeader.jsx";
import RecipeCardBook from "./RecipeCardBook.jsx";
import RecipeFilterBar from "./RecipeFilterBar.jsx";
import { guideRicette } from "../data/guideContent.jsx";

// Wrapper che usa RecipeFilterBar sopra la pagina del libro, restringendo le pagine sfogliabili al filtro
export default function RecipeFilterBarBook({ recipes, extraTagGroups, sectionList, pageIndex, setPageIndex, turning, setTurning, onLanding, onRecipe, onRecipes, onMemories, onAdd, onFridge, onShopping, onExport }) {
  const th = useTheme();
  const ui = useUiStyle();
  return (
    <RecipeFilterBar recipes={recipes} extraTagGroups={extraTagGroups} sectionList={sectionList} bookMode
      renderNav={() => (
        <>
          <GlobalNav
            activeScreen="book"
            bookView={true}
            onRecipes={onRecipes}
            onBook={() => {}}
            onMemories={onMemories}
            onAdd={onAdd}
            onFridge={onFridge}
            onShopping={onShopping}
            onLanding={onLanding}
            onExport={onExport}
            activeLabel="Libro Ricette"
            infoContent={guideRicette}
            bottomNavActive
          />
          <ScreenHeader
            section="ricette"
            title="Vista Libro"
            onHome={onLanding}
            infoContent={guideRicette}
            actions={onExport ? [{ icon:"esporta", label:"Esporta ricettario", onClick:onExport }] : []}
          />
        </>
      )}
      topAction={(
        <div style={{ padding:"10px 24px 2px", textAlign:"center" }}>
          <button onClick={() => onAdd("recipe")} title="Nuova ricetta" style={{
            padding:"9px 20px", borderRadius:20,
            background:th.appAccent, border:"none", cursor:"pointer",
            color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700,
          }}>＋ Nuova ricetta</button>
        </div>
      )}
    >
      {(sectionRecipes, { showFavorites }) => {
        const totalPages = sectionRecipes.length;
        const safeIndex = Math.min(pageIndex, Math.max(0, totalPages - 1));
        const currentRecipe = sectionRecipes[safeIndex];
        const turnPage = (dir) => {
          const nextIdx = dir === "next" ? safeIndex + 1 : safeIndex - 1;
          if (nextIdx < 0 || nextIdx >= totalPages) return;
          setTurning(dir);
          setTimeout(() => { setPageIndex(nextIdx); setTurning(null); }, 350);
        };
        return (
    <div style={{ background:th.bookBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <style>{`
        @keyframes turnNext {
          0%   { transform: rotateY(0deg);   opacity:1; }
          50%  { transform: rotateY(-12deg); opacity:0.6; }
          100% { transform: rotateY(0deg);   opacity:1; }
        }
        @keyframes turnPrev {
          0%   { transform: rotateY(0deg);  opacity:1; }
          50%  { transform: rotateY(12deg); opacity:0.6; }
          100% { transform: rotateY(0deg);  opacity:1; }
        }
      `}</style>

      {/* Page counter + prev/next */}
      {totalPages > 0 ? (
        <>
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"8px 16px",
            background:th.bookBg,
            borderBottom:`1px solid ${th.bookBorder}`,
            flexShrink:0,
          }}>
            <button
              onClick={() => turnPage("prev")}
              disabled={safeIndex === 0}
              style={{
                background:"none", border:`1px solid ${th.bookBorder}`,
                borderRadius:8, padding:"6px 14px",
                cursor: safeIndex===0 ? "default" : "pointer",
                color: safeIndex===0 ? th.bookBorder : th.bookInk,
                fontFamily:F.ui, fontSize:13,
              }}
            >‹ Prec.</button>

            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.bookFaded }}>
                pagina {safeIndex+1} di {totalPages}
              </div>
              <div style={{ fontFamily:F.display, fontSize:12, color:th.appAccent, fontStyle:"italic", marginTop:1 }}>
                {currentRecipe?.title}
              </div>
            </div>

            <button
              onClick={() => turnPage("next")}
              disabled={safeIndex === totalPages-1}
              style={{
                background:"none", border:`1px solid ${th.bookBorder}`,
                borderRadius:8, padding:"6px 14px",
                cursor: safeIndex===totalPages-1 ? "default" : "pointer",
                color: safeIndex===totalPages-1 ? th.bookBorder : th.bookInk,
                fontFamily:F.ui, fontSize:13,
              }}
            >Succ. ›</button>
          </div>

          {/* Animated page */}
          <div style={{
            flex:1, overflowY:"auto",
            animation: turning ? `turn${turning==="next"?"Next":"Prev"} 0.35s ease` : "none",
            transformOrigin:"center center",
          }}>
            {currentRecipe ? (
              <div style={{ padding:"0 0 40px" }}>
                <RecipeCardBook recipe={currentRecipe}/>
              </div>
            ) : showFavorites ? (
              <div style={{ padding:"60px 30px", textAlign:"center", fontFamily:F.ui, fontSize:13, color:th.bookInk || "#5a4f42" }}>
                ⭐ Nessuna ricetta preferita.<br/>Segna una ricetta col ☆ nella sua scheda per ritrovarla qui.
              </div>
            ) : null}
          </div>

          {/* Bottom prev/next with titles */}
          <div style={{ display:"flex", background:th.appInk, flexShrink:0 }}>
            <button
              onClick={() => turnPage("prev")}
              disabled={safeIndex===0}
              style={{
                flex:1, padding:"12px",
                background:"none", border:"none",
                color: safeIndex===0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)",
                fontFamily:F.ui, fontSize:12,
                cursor: safeIndex===0 ? "default" : "pointer",
                borderRight:"1px solid rgba(255,255,255,0.1)",
              }}
            >‹ {safeIndex>0 ? sectionRecipes[safeIndex-1]?.title.substring(0,20)+"…" : "—"}</button>
            <button
              onClick={() => turnPage("next")}
              disabled={safeIndex===totalPages-1}
              style={{
                flex:1, padding:"12px",
                background:"none", border:"none",
                color: safeIndex===totalPages-1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)",
                fontFamily:F.ui, fontSize:12,
                cursor: safeIndex===totalPages-1 ? "default" : "pointer",
              }}
            >{safeIndex<totalPages-1 ? sectionRecipes[safeIndex+1]?.title.substring(0,20)+"…" : "—"} ›</button>
          </div>
        </>
      ) : (
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ textAlign:"center", color:th.bookFaded, fontFamily:F.display, fontStyle:"italic", fontSize:16 }}>
            Nessuna ricetta con questi filtri
          </div>
        </div>
      )}

      {ui.navPosition === "bottom" && (
        <BottomNav
          activeScreen="recipes"
          bookView
          onRecipes={onRecipes}
          onMemories={onMemories}
          onFridge={onFridge}
          onShopping={onShopping}
        />
      )}
    </div>
        );
      }}
    </RecipeFilterBar>
  );
}
