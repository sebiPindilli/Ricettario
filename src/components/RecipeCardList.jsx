import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { dishPhotoOf } from "../utils/helpers.js";

export default function RecipeCardList({ recipe, onClick }) {
  const th = useTheme();
  const photo = dishPhotoOf(recipe);
  return (
    <button onClick={onClick} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", textAlign:"left", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", width:"100%" }}>
      <div style={{ width:46, height:46, borderRadius:12, background:recipe.color, flexShrink:0, position:"relative", overflow:"visible", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
        {photo ? (
          <img src={photo} alt="" style={{ width:"100%", height:"100%", borderRadius:12, objectFit:"cover" }} loading="lazy"/>
        ) : recipe.emoji}
        {photo && (
          <span style={{
            position:"absolute", bottom:-4, right:-4, width:18, height:18, borderRadius:"50%",
            background:recipe.color, border:`1.5px solid ${th.appCard}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, lineHeight:1,
          }}>{recipe.emoji}</span>
        )}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:2 }}>
            {recipe.favorite && <span style={{ marginRight:4 }}>⭐</span>}{recipe.title}
          </div>
        <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{recipe.category} · {recipe.prepTime+recipe.cookTime} min · {recipe.servings} porzioni</div>
        <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
          {recipe.tags.slice(0,3).map(t => (
            <span key={t} style={{ padding:"2px 8px", borderRadius:10, background:th.appBorder, color:th.appFaded, fontFamily:F.ui, fontSize:10 }}>{t}</span>
          ))}
        </div>
      </div>
      <span style={{ color:th.appFaded, fontSize:18 }}>›</span>
    </button>
  );
}
