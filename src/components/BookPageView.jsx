import React from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { isSectioned, ingredientToText, dishPhotoOf, stepPhotosOf, stepNumbers, stepNumberLabel } from "../utils/helpers.js";

export default function BookPageView({ recipe }) {
  const th = useTheme();
  const numbers = stepNumbers(recipe.steps);
  let flatI = 0;
  return (
    <div style={{ background:th.bookBg, margin:"12px 16px", padding:"24px 20px", border:`1px solid ${th.bookBorder}`, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", fontFamily:F.book, color:th.bookInk, minHeight:600, position:"relative" }}>
      {[60,120,180].map(top => (
        <div key={top} style={{ position:"absolute", left:-8, top, width:12, height:12, borderRadius:"50%", background:th.appBorder, border:`1px solid ${th.bookBorder}` }}/>
      ))}
      <div style={{ fontSize:17, fontWeight:"bold", color:th.bookInk, marginBottom:14, textAlign:"center" }}>{recipe.title}</div>
      <div style={{ width:180, height:130, margin:"0 auto 14px", background:th.appBorder, border:`1px solid ${th.bookBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40, overflow:"hidden", position:"relative" }}>
        {dishPhotoOf(recipe)
          ? <>
              <img src={dishPhotoOf(recipe)} alt={recipe.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              <div style={{
                position:"absolute", top:6, left:6, width:24, height:24, borderRadius:"50%",
                background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,0.25)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
              }}>{recipe.emoji}</div>
            </>
          : <span style={{ opacity:0.35 }}>{recipe.emoji}</span>}
      </div>
      <div style={{ fontSize:12, color:th.bookFaded, lineHeight:2 }}>
        <div>Tempo di prep.(min): {recipe.prepTime}</div>
        <div>Tempo di cottura (min): {recipe.cookTime}</div>
        <div>Porzioni: {recipe.servings}</div>
      </div>
      {recipe.note && (
        <div style={{ border:`1px solid ${th.bookNoteBorder}`, background:th.bookNote, padding:"8px 12px", margin:"12px 0", fontSize:11, fontStyle:"italic", color:th.bookFaded, lineHeight:1.65 }}>
          {recipe.source && <span>Ricetta di {recipe.source} — </span>}{recipe.note}
        </div>
      )}
      <div style={{ textAlign:"center", fontSize:14, fontWeight:"bold", color:th.bookInk, margin:"12px 0 8px" }}>Ingredienti</div>
      {isSectioned(recipe.ingredients) ? (
        recipe.ingredients.map((sec, si) => (
          <div key={si}>
            {sec.section && <div style={{ fontSize:10, fontWeight:"bold", color:recipe.color, textTransform:"uppercase", letterSpacing:1.5, margin:"8px 0 3px", paddingBottom:2, borderBottom:`1px solid ${th.bookBorder}` }}>{sec.section}</div>}
            {sec.items.map((ing,i) => <div key={i} style={{ fontSize:12, color:th.bookInk, lineHeight:1.8 }}>{ingredientToText(ing)}</div>)}
          </div>
        ))
      ) : (
        recipe.ingredients.map((ing,i) => (
          <div key={i} style={{ fontSize:12, color:th.bookInk, lineHeight:1.8 }}>{ingredientToText(ing)}</div>
        ))
      )}
      <div style={{ textAlign:"center", fontSize:14, fontWeight:"bold", color:th.bookInk, margin:"14px 0 8px" }}>Preparazione</div>
      {isSectioned(recipe.steps) ? (
        recipe.steps.map((sec, si) => (
          <div key={si}>
            {sec.section && <div style={{ fontSize:10, fontWeight:"bold", color:recipe.color, textTransform:"uppercase", letterSpacing:1.5, margin:"10px 0 5px", paddingBottom:2, borderBottom:`1px solid ${th.bookBorder}` }}>{sec.section}</div>}
            {sec.items.map((step,i) => {
              const text = typeof step === "string" ? step : step.text;
              const { sectionIndex, indexInSection } = numbers[flatI++];
              const label = stepNumberLabel(sectionIndex, indexInSection);
              const photos = stepPhotosOf(step);
              return (
                <div key={i} style={{ marginBottom:8 }}>
                  <p style={{ fontSize:12, color:th.bookInk, lineHeight:1.65, margin:0 }}><b>{label}.</b> {text}</p>
                  {photos.length > 0 && (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:5 }}>
                      {photos.map((photo, pi) => (
                        <img key={pi} src={photo} alt="" style={{ width:70, height:70, objectFit:"cover", borderRadius:6, border:`1px solid ${th.bookBorder}` }}/>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))
      ) : (
        recipe.steps.map((step,i) => {
          const text = typeof step === "string" ? step : step.text;
          const { sectionIndex, indexInSection } = numbers[flatI++];
          const label = stepNumberLabel(sectionIndex, indexInSection);
          const photos = stepPhotosOf(step);
          return (
            <div key={i} style={{ marginBottom:8 }}>
              <p style={{ fontSize:12, color:th.bookInk, lineHeight:1.65, margin:0 }}><b>{label}.</b> {text}</p>
              {photos.length > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:5 }}>
                  {photos.map((photo, pi) => (
                    <img key={pi} src={photo} alt="" style={{ width:70, height:70, objectFit:"cover", borderRadius:6, border:`1px solid ${th.bookBorder}` }}/>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
