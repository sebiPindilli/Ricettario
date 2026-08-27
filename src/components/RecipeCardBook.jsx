import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { isSectioned, ingredientToText, stepPhotosOf, dishPhotoOf } from "../utils/helpers.js";
import PhotoLightbox from "./PhotoLightbox.jsx";
import ChosenIcon from "./ChosenIcon.jsx";

export default function RecipeCardBook({ recipe }) {
  const th = useTheme();
  const [lightbox, setLightbox] = useState(null);

  return (
    <div style={{
      background: th.bookBg,
      border:`1px solid ${th.bookBorder}`,
      borderRadius:4,
      boxShadow:"0 2px 16px rgba(0,0,0,0.10)",
      fontFamily:F.book,
      position:"relative",
      overflow:"visible",
    }}>
      {lightbox && (
        <PhotoLightbox
          photo={lightbox.photo}
          caption={lightbox.caption}
          date={lightbox.date}
          isImage={lightbox.isImage}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Binder holes */}
      {[40, 90, 140].map(top => (
        <div key={top} style={{
          position:"absolute", left:-7, top,
          width:11, height:11, borderRadius:"50%",
          background: th.appBorder,
          border:`1px solid ${th.bookBorder}`,
          zIndex:1,
        }}/>
      ))}

      <div style={{ padding:"22px 20px 28px" }}>

        {/* Title */}
        <div style={{
          textAlign:"center", fontSize:18, fontWeight:"bold",
          color:th.bookInk, marginBottom:4, lineHeight:1.3,
        }}>{recipe.title}</div>

        {/* Source */}
        {recipe.source && (
          <div style={{
            textAlign:"center", fontFamily:F.ui, fontSize:10,
            color:th.bookFaded, marginBottom:14, fontStyle:"italic",
          }}>Ricetta di {recipe.source}</div>
        )}

        {/* Photo */}
        <div
          onClick={() => dishPhotoOf(recipe) && setLightbox({ photo:dishPhotoOf(recipe), caption:recipe.title, date:"", isImage:true })}
          style={{
            width:190, height:140, margin:"0 auto 16px",
            background: th.appBorder,
            border:`1px solid ${th.bookBorder}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:44, cursor: dishPhotoOf(recipe) ? "pointer" : "default",
            position:"relative", overflow:"hidden",
          }}
        >
          {dishPhotoOf(recipe)
            ? <>
                <img src={dishPhotoOf(recipe)} alt={recipe.title} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                <div style={{ position:"absolute", bottom:4, right:6, fontSize:13, opacity:0.5, color:"#fff" }}>⤢</div>
                <div style={{
                  position:"absolute", top:6, left:6, width:28, height:28, borderRadius:"50%",
                  background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,0.25)",
                  display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
                }}><ChosenIcon emoji={recipe.emoji} icon={recipe.icon} size={15} /></div>
              </>
            : <span style={{ opacity:0.35 }}><ChosenIcon emoji={recipe.emoji} icon={recipe.icon} size={44} /></span>
          }
        </div>

        {/* Meta */}
        <div style={{
          display:"flex", justifyContent:"center", gap:16,
          fontSize:11, color:th.bookFaded, marginBottom:14,
          paddingBottom:12, borderBottom:`1px solid ${th.bookBorder}`,
        }}>
          <span>Prep: {recipe.prepTime} min</span>
          <span>·</span>
          <span>Cottura: {recipe.cookTime} min</span>
          <span>·</span>
          <span>{recipe.servings} porzioni</span>
        </div>

        {/* Note box */}
        {recipe.note && (
          <div style={{
            border:`1px solid ${th.bookNoteBorder}`,
            background: th.bookNote,
            padding:"8px 12px", marginBottom:14,
            fontSize:11, fontStyle:"italic",
            color:th.bookFaded, lineHeight:1.65,
          }}>
            {recipe.note}
          </div>
        )}

        {/* ── INGREDIENTI ── */}
        <div style={{
          textAlign:"center", fontSize:14, fontWeight:"bold",
          color:th.bookInk, margin:"0 0 10px",
        }}>Ingredienti</div>

        {isSectioned(recipe.ingredients) ? (
          recipe.ingredients.map((sec, si) => (
            <div key={si} style={{ marginBottom:10 }}>
              {sec.section && (
                <div style={{
                  fontSize:9, fontWeight:"bold", letterSpacing:1.5,
                  textTransform:"uppercase", color:recipe.color,
                  marginBottom:4, paddingBottom:3,
                  borderBottom:`1px solid ${th.bookBorder}`,
                }}>{sec.section}</div>
              )}
              {sec.items.map((ing, i) => (
                <div key={i} style={{
                  fontSize:12, color:th.bookInk, lineHeight:1.8,
                  borderBottom:`1px solid ${th.bookBorder}`,
                  padding:"2px 0",
                }}>{ingredientToText(ing)}</div>
              ))}
            </div>
          ))
        ) : (
          recipe.ingredients.map((ing, i) => (
            <div key={i} style={{
              fontSize:12, color:th.bookInk, lineHeight:1.8,
              borderBottom:`1px solid ${th.bookBorder}`,
              padding:"2px 0",
            }}>{ingredientToText(ing)}</div>
          ))
        )}

        {/* ── DIVISORE ── */}
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"18px 0" }}>
          <div style={{ flex:1, height:1, background:th.bookBorder }}/>
          <span style={{ color:th.bookFaded, fontSize:11 }}>✦</span>
          <div style={{ flex:1, height:1, background:th.bookBorder }}/>
        </div>

        {/* ── PREPARAZIONE ── */}
        <div style={{
          textAlign:"center", fontSize:14, fontWeight:"bold",
          color:th.bookInk, marginBottom:12,
        }}>Preparazione</div>

        {isSectioned(recipe.steps) ? (
          recipe.steps.map((sec, si) => {
            let stepN = recipe.steps.slice(0,si).reduce((acc,s) => acc + s.items.length, 0);
            return (
              <div key={si} style={{ marginBottom:14 }}>
                {sec.section && (
                  <div style={{
                    fontSize:9, fontWeight:"bold", letterSpacing:1.5,
                    textTransform:"uppercase", color:recipe.color,
                    marginBottom:8, paddingBottom:3,
                    borderBottom:`1px solid ${th.bookBorder}`,
                  }}>{sec.section}</div>
                )}
                {sec.items.map((step, i) => {
                  const text = typeof step === "string" ? step : step.text;
                  const photos = stepPhotosOf(step);
                  return (
                    <div key={i} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                        <div style={{
                          width:20, height:20, borderRadius:"50%",
                          background:recipe.color, color:"#fff",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:10, fontWeight:700, flexShrink:0, marginTop:1,
                          fontFamily:F.ui,
                        }}>{stepN + i + 1}</div>
                        <p style={{ fontSize:12, color:th.bookInk, lineHeight:1.65, margin:0 }}>{text}</p>
                      </div>
                      {photos.length > 0 && (
                        <div
                          onClick={() => setLightbox({ photo:photos[0], caption:`Passo ${stepN+i+1}`, date:"", isImage:true })}
                          style={{
                            marginTop:6, marginLeft:28, height:70, width:70, borderRadius:6,
                            cursor:"pointer", position:"relative", overflow:"hidden",
                            border:`1px solid ${th.bookBorder}`,
                          }}
                        >
                          <img src={photos[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                          <div style={{ position:"absolute", bottom:3, right:6, fontSize:12, opacity:0.6, color:"#fff" }}>⤢</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })
        ) : (
          recipe.steps.map((step, i) => {
            const text = typeof step === "string" ? step : step.text;
            const photos = stepPhotosOf(step);
            return (
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
                  <div style={{
                    width:20, height:20, borderRadius:"50%",
                    background:recipe.color, color:"#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:10, fontWeight:700, flexShrink:0, marginTop:1,
                    fontFamily:F.ui,
                  }}>{i+1}</div>
                  <p style={{ fontSize:12, color:th.bookInk, lineHeight:1.65, margin:0 }}>{text}</p>
                </div>
                {photos.length > 0 && (
                  <div
                    onClick={() => setLightbox({ photo:photos[0], caption:`Passo ${i+1}`, date:"", isImage:true })}
                    style={{
                      marginTop:6, marginLeft:28, height:70, width:70, borderRadius:6,
                      cursor:"pointer", position:"relative", overflow:"hidden",
                      border:`1px solid ${th.bookBorder}`,
                    }}
                  >
                    <img src={photos[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                    <div style={{ position:"absolute", bottom:3, right:6, fontSize:12, opacity:0.6, color:"#fff" }}>⤢</div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div style={{
            display:"flex", gap:6, flexWrap:"wrap",
            marginTop:18, paddingTop:14,
            borderTop:`1px solid ${th.bookBorder}`,
          }}>
            {recipe.tags.map(t => (
              <span key={t} style={{
                padding:"3px 10px", borderRadius:12,
                background:th.appBorder, color:th.bookFaded,
                fontFamily:F.ui, fontSize:10,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
