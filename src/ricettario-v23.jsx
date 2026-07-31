import React, { useState, useRef, useEffect } from "react";
import {
  sortSectionsAltroLast, sortCategoriesAltroLast,
  isSectioned, toSectioned, fromSectioned, stripPhotolessStep, stepPhotosOf,
  stepNumbers, stepNumberLabel,
  normName, uid, fmtQty, ingredientToText, scaleIngredient,
  flattenIngredients, collectAllIngredients, buildIngredientDict,
  ingDictIndex, resolveIngId, mapIngredientsStruct, flattenSteps,
  UNIT_ALIASES, unitLabel, normUnit, macroLine,
  WEIGHT_UNITS, ingredientToGrams,
  parseIngredientAmount, decomposeIngredient, composeIngredient,
  memoryPeriodLabel, memorySortKey, buildFridgeItems,
} from "./utils/helpers.js";
import { effectiveNutritionKey } from "./utils/aggregates.js";
import {
  T, F, MACRO_SECTIONS, PICKER_EMOJIS, INGREDIENT_CATEGORIES,
  TAG_GROUPS, ALL_PRESET_TAGS, BOOK_THEMES,
  EMOJI_CATEGORIES, EMOJI_OPTIONS, COLOR_OPTIONS, DEFAULT_UNIT_SUGGESTIONS,
} from "./data/constants.js";
import { NUTRITION_DB, NUTRIENT_LABELS } from "./data/nutrition.js";
import { RECIPES, INITIAL_NUTRITION_MAP, INITIAL_EQUIVALENCES } from "./data/recipes.js";
import { ThemeCtx, useTheme, NavCtx, useNavActions } from "./context.js";
import OrganizeIcon from "./components/OrganizeIcon.jsx";
import BackBtn from "./components/BackBtn.jsx";
import Divider from "./components/Divider.jsx";
import Toast from "./components/Toast.jsx";
import SectionBadge from "./components/SectionBadge.jsx";
import Pill from "./components/Pill.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import ScanLabel from "./components/ScanLabel.jsx";
import EditLabel from "./components/EditLabel.jsx";
import EditField from "./components/EditField.jsx";
import EditNumberInput from "./components/EditNumberInput.jsx";
import MemoryPhoto from "./components/MemoryPhoto.jsx";
import PhotoLightbox from "./components/PhotoLightbox.jsx";
import TagPicker from "./components/TagPicker.jsx";
import TagSection from "./components/TagSection.jsx";
import EmojiColorPicker from "./components/EmojiColorPicker.jsx";
import AutocompleteInput from "./components/AutocompleteInput.jsx";
import RecipeCardList from "./components/RecipeCardList.jsx";
import RecipeCardBook from "./components/RecipeCardBook.jsx";
import GlobalNav from "./components/GlobalNav.jsx";
import GuideScreen from "./screens/GuideScreen.jsx";
import MemoriesBookScreen from "./screens/MemoriesBookScreen.jsx";
import CookingMode from "./screens/CookingMode.jsx";
import OrganizeIngredientsScreen from "./screens/OrganizeIngredientsScreen.jsx";
import ShoppingListScreen from "./screens/ShoppingListScreen.jsx";
import EmptyFridgeScreen from "./screens/EmptyFridgeScreen.jsx";
import ServingsDialog from "./components/ServingsDialog.jsx";
import ShoppingMode from "./components/ShoppingMode.jsx";
import AddRecipeHubScreen from "./screens/AddRecipeHubScreen.jsx";
import NewRecipeScreen from "./screens/NewRecipeScreen.jsx";
import SectionPicker from "./components/SectionPicker.jsx";
import EditSectionedList from "./components/EditSectionedList.jsx";
import EditSectionedSteps from "./components/EditSectionedSteps.jsx";

// ── Subsection data helpers ────────────────────────────────────
// ingredients and steps can be either:
//   flat:  ["item1", "item2", ...]
//   sectioned: [{ section:"Nome", items:["item1","item2"] }, ...]
//
// Steps items can be strings or {text, photo}

// ── iPhone shell ───────────────────────────────────────────────
const IPhone = ({ children }) => {
  const th = useTheme();
  return (
  <div style={{
    width:390, minHeight:844,
    background: th.appBg,
    borderRadius:50,
    overflow:"hidden",
    boxShadow:"0 40px 100px rgba(0,0,0,0.35), 0 0 0 12px #1a1a1a, 0 0 0 14px #333",
    position:"relative",
    fontFamily:F.body,
    display:"flex", flexDirection:"column",
    userSelect:"none",
    transition:"background 0.3s",
  }}>
    <div style={{
      position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
      width:130, height:36, background:"#1a1a1a",
      borderRadius:"0 0 20px 20px", zIndex:100,
    }}/>
    <div style={{ flex:1, overflowY:"auto", paddingTop:44 }}>
      {children}
    </div>
  </div>
  );
};

// ══════════════════════════════════════════════════════════════
// SCREEN: COVER (book opening animation)
// ══════════════════════════════════════════════════════════════
const CoverScreen = ({ onEnter }) => {
  const th = useTheme();
  const [phase, setPhase] = useState("idle");
  const [coverAngle, setCoverAngle] = useState(0);

  useEffect(() => {
    if (phase === "opening") {
      let start = null;
      const duration = 900;
      const animate = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCoverAngle(eased * 105);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setPhase("open");
          setTimeout(onEnter, 300);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [phase]);

  const handleOpen = () => { if (phase === "idle") setPhase("opening"); };

  const fabricTexture = `
    repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px)
  `;

  return (
    <div style={{
      height:"100%", minHeight:800,
      background:"#111",
      overflow:"hidden", position:"relative",
      cursor: phase==="idle" ? "pointer" : "default",
    }} onClick={handleOpen}>

      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:10 }}>
      </div>

      <div style={{ perspective:"1200px", perspectiveOrigin:"35% 50%", position:"absolute", inset:0 }}>

        {/* PAGES edge */}
        <div style={{
          position:"absolute", right:0, top:0, bottom:0, width:22,
          background:"linear-gradient(to right, #c8c8c8, #f5f5f5, #e0e0e0, #f8f8f8)",
          zIndex:1,
        }}>
          {Array.from({length:40}).map((_,i) => (
            <div key={i} style={{
              height:1,
              background: i%4===0 ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.03)",
              marginTop:"calc(100% / 40)",
            }}/>
          ))}
        </div>

        {/* BACK COVER */}
        <div style={{
          position:"absolute", inset:0, zIndex:2,
          background:`${th.coverBg}, ${fabricTexture}`,
          filter:"brightness(0.7)",
        }}/>

        {/* FRONT COVER */}
        <div style={{
          position:"absolute", inset:0, zIndex:3,
          transformOrigin:"left center",
          transform:`rotateY(-${coverAngle}deg)`,
          transformStyle:"preserve-3d",
        }}>
          {/* Front face */}
          <div style={{
            position:"absolute", inset:0,
            backfaceVisibility:"hidden",
            background:`${th.coverBg}, ${fabricTexture}`,
            boxShadow: phase==="idle"
              ? "inset -8px 0 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)"
              : "inset -4px 0 15px rgba(0,0,0,0.3)",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
          }}>
            {/* Spine line */}
            <div style={{
              position:"absolute", left:28, top:0, bottom:0, width:1,
              background: th.spineColor,
            }}/>

            {/* Decorative frames */}
            <div style={{ position:"absolute", inset:28, border:`1px solid ${th.coverAccent}`, pointerEvents:"none" }}/>
            <div style={{ position:"absolute", inset:34, border:`1px solid ${th.coverAccent}`, opacity:0.5, pointerEvents:"none" }}/>

            {/* Corner ornaments */}
            {[
              {top:20,left:20,bt:"borderTop",bl:"borderLeft"},
              {top:20,right:20,bt:"borderTop",bl:"borderRight"},
              {bottom:20,left:20,bt:"borderBottom",bl:"borderLeft"},
              {bottom:20,right:20,bt:"borderBottom",bl:"borderRight"},
            ].map((pos,i) => {
              const { bt, bl, ...coords } = pos;
              return (
                <div key={i} style={{
                  position:"absolute", width:20, height:20, ...coords,
                  [bt]:`1.5px solid ${th.coverAccent}`,
                  [bl]:`1.5px solid ${th.coverAccent}`,
                }}/>
              );
            })}

            {/* Title */}
            <div style={{ textAlign:"center", padding:"0 48px", zIndex:1 }}>
              <div style={{
                fontFamily:F.ui, fontSize:11, letterSpacing:6,
                color: th.coverText.replace(/[\d.]+\)$/, "0.4)"),
                textTransform:"uppercase", marginBottom:18,
              }}>Il mio</div>
              <div style={{
                fontFamily:F.display, fontSize:42,
                color: th.coverText,
                letterSpacing:2, lineHeight:1.15, fontStyle:"italic",
                textShadow:"0 2px 20px rgba(0,0,0,0.4)",
              }}>Ricettario</div>
              <div style={{
                width:80, height:1, margin:"20px auto",
                background:`linear-gradient(to right, transparent, ${th.coverAccent}, transparent)`,
              }}/>
              <div style={{
                fontFamily:F.ui, fontSize:10, letterSpacing:4,
                color: th.coverText.replace(/[\d.]+\)$/, "0.25)"),
                textTransform:"uppercase",
              }}>Le nostre ricette</div>
            </div>

            {/* Tap hint */}
            {phase === "idle" && (
              <div style={{ position:"absolute", bottom:52, left:0, right:0, textAlign:"center" }}>
                <div style={{
                  display:"inline-block",
                  fontFamily:F.ui, fontSize:11,
                  color: th.coverText.replace(/[\d.]+\)$/, "0.35)"),
                  letterSpacing:3, textTransform:"uppercase",
                  animation:"pulse 2s ease-in-out infinite",
                }}>Apri il ricettario</div>
              </div>
            )}
          </div>

          {/* Inner face */}
          <div style={{
            position:"absolute", inset:0,
            backfaceVisibility:"hidden",
            transform:"rotateY(180deg)",
            background: th.pageColor,
          }}/>
        </div>
      </div>

      {/* Recipe count */}
      <div style={{
        position:"absolute", bottom:32, left:0, right:0,
        textAlign:"center", zIndex:20, pointerEvents:"none",
      }}>
        <div style={{
          fontFamily:F.ui, fontSize:10,
          color: th.coverText.replace(/[\d.]+\)$/, "0.15)"),
          letterSpacing:3, textTransform:"uppercase",
        }}>5 ricette salvate</div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity:0.4; transform:translateY(0); }
          50% { opacity:0.8; transform:translateY(-3px); }
        }
      `}</style>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// SCREEN: HOME
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// SHARED: Ingredient & Step renderers (handle flat + sectioned)
// ══════════════════════════════════════════════════════════════

// Renders ingredients (flat array or sectioned)
const IngredientsView = ({ ingredients, recipeColor, scaleFactor = 1 }) => {
  const th = useTheme();
  if (!ingredients || ingredients.length === 0) return null;
  const showIng = (ing) => scaleFactor !== 1 ? ingredientToText(scaleIngredient(ing, scaleFactor)) : ingredientToText(ing);

  if (isSectioned(ingredients)) {
    return (
      <div>
        {ingredients.map((sec, si) => (
          <div key={si}>
            <SectionBadge label={sec.section} color={recipeColor}/>
            {sec.items.map((ing, i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:`1px solid ${th.appBorder}` }}>
                <span style={{ color:th.appAccent2, fontSize:13, marginTop:2 }}>✦</span>
                <span style={{ fontFamily:F.body, fontSize:14, color:th.appInk, lineHeight:1.4 }}>{showIng(ing)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {ingredients.map((ing, i) => (
        <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:`1px solid ${th.appBorder}` }}>
          <span style={{ color:th.appAccent2, fontSize:13, marginTop:2 }}>✦</span>
          <span style={{ fontFamily:F.body, fontSize:14, color:th.appInk, lineHeight:1.4 }}>{showIng(ing)}</span>
        </div>
      ))}
    </div>
  );
};

// Renders steps (flat or sectioned, items can be string or {text,photos})
const StepsView = ({ steps, recipeColor }) => {
  const th = useTheme();
  if (!steps || steps.length === 0) return null;
  const numbers = stepNumbers(steps);
  let flatI = 0;

  const renderStep = (step, key, label, color) => {
    const text = typeof step === "string" ? step : step.text;
    const photos = stepPhotosOf(step);
    return (
      <div key={key} style={{ marginBottom:16 }}>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{
            minWidth:26, height:26, padding:"0 5px", borderRadius:13,
            background: color || recipeColor,
            color:"#fff",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:F.ui, fontSize:12, fontWeight:700,
            flexShrink:0, marginTop:2,
          }}>{label}</div>
          <p style={{ fontFamily:F.body, fontSize:14, color:th.appInk, lineHeight:1.55, margin:0 }}>{text}</p>
        </div>
        {photos.length > 0 && (
          <div
            style={{
              marginTop:8, marginLeft:38, height:90, borderRadius:10,
              background:`${color || recipeColor}22`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:28, border:`1px solid ${(color||recipeColor)}22`,
              cursor:"pointer", position:"relative",
            }}
          >
            📸
            <div style={{ position:"absolute", bottom:4, right:8, fontSize:14, opacity:0.5 }}>⤢</div>
          </div>
        )}
      </div>
    );
  };

  if (isSectioned(steps)) {
    return (
      <div>
        {steps.map((sec, si) => (
          <div key={si}>
            <SectionBadge label={sec.section} color={recipeColor}/>
            {sec.items.map((step, i) => {
              const { sectionIndex, indexInSection } = numbers[flatI++];
              return renderStep(step, i, stepNumberLabel(sectionIndex, indexInSection), recipeColor);
            })}
          </div>
        ))}
      </div>
    );
  }

  return <div>{steps.map((step, i) => {
    const { sectionIndex, indexInSection } = numbers[flatI++];
    return renderStep(step, i, stepNumberLabel(sectionIndex, indexInSection), recipeColor);
  })}</div>;
};


// ══════════════════════════════════════════════════════════════
// PHOTO LIGHTBOX — fullscreen photo viewer with save option
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// PDF EXPORT — generates a printable recipe PDF via browser
// ══════════════════════════════════════════════════════════════
const exportRecipePDF = (recipe) => {
  const isSec = (arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object" && "section" in arr[0];

  const flatIng = isSec(recipe.ingredients)
    ? recipe.ingredients.flatMap(s => s.section ? [`── ${s.section} ──`, ...s.items.map(ingredientToText)] : s.items.map(ingredientToText))
    : recipe.ingredients.map(ingredientToText);

  // Steps carry {text, photo}; section markers use {section:true}
  const flatSteps = isSec(recipe.steps)
    ? recipe.steps.flatMap(s => {
        const items = s.items.map(st => typeof st === "string" ? { text: st, photo: null } : { text: st.text, photo: st.photo });
        return s.section ? [{ sectionLabel: s.section }, ...items] : items;
      })
    : recipe.steps.map(st => typeof st === "string" ? { text: st, photo: null } : { text: st.text, photo: st.photo });

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${recipe.title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; color: #1a1a1a; padding: 40px; max-width: 700px; margin: 0 auto; }
  h1 { font-size: 28px; font-style: italic; text-align: center; margin-bottom: 4px; }
  .source { text-align: center; font-size: 13px; color: #666; margin-bottom: 16px; }
  .meta { display: flex; justify-content: center; gap: 24px; font-size: 12px; color: #555; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 8px 0; margin-bottom: 16px; }
  .note { border: 1px solid #ccc; padding: 10px 14px; font-style: italic; font-size: 13px; color: #555; margin-bottom: 16px; background: #fafaf8; }
  h2 { font-size: 15px; text-align: center; letter-spacing: 2px; text-transform: uppercase; margin: 20px 0 10px; color: #333; }
  .ing { font-size: 13px; line-height: 1.9; border-bottom: 1px solid #eee; padding: 2px 0; }
  .section-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #8B4520; margin: 10px 0 4px; }
  .step { display: flex; gap: 12px; margin-bottom: 12px; }
  .step-n { width: 24px; height: 24px; border-radius: 50%; background: #8B4520; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; margin-top: 2px; font-family: sans-serif; }
  .step-t { font-size: 13px; line-height: 1.65; }
  .divider { text-align: center; color: #B8973A; margin: 20px 0; font-size: 16px; }
  .dish-photo { width: 200px; height: 150px; margin: 0 auto 18px; border: 1px solid #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 64px; background: #fafaf8; }
  .step-photo { font-size: 34px; margin-left: 12px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>${recipe.title}</h1>
  ${recipe.source ? `<div class="source">Ricetta di ${recipe.source}</div>` : ""}
  ${recipe.dishPhoto ? `<div class="dish-photo">${recipe.dishPhoto === "PLACEHOLDER" ? "🍽️" : recipe.dishPhoto}</div>` : ""}
  <div class="meta">
    <span>Prep: ${recipe.prepTime} min</span>
    <span>·</span>
    <span>Cottura: ${recipe.cookTime} min</span>
    <span>·</span>
    <span>${recipe.servings} porzioni</span>
  </div>
  ${recipe.note ? `<div class="note">${recipe.note}</div>` : ""}

  <h2>Ingredienti</h2>
  ${flatIng.map(ing => ing.startsWith("──")
    ? `<div class="section-label">${ing.replace(/── | ──/g,"")}</div>`
    : `<div class="ing">${ing}</div>`
  ).join("")}

  <div class="divider">✦</div>

  <h2>Preparazione</h2>
  ${(() => {
    let n = 0;
    return flatSteps.map(step => step.sectionLabel
      ? `<div class="section-label">${step.sectionLabel}</div>`
      : `<div class="step"><div class="step-n">${++n}</div><div class="step-t">${step.text}</div>${step.photo && step.photo !== "PLACEHOLDER" ? `<div class="step-photo">${step.photo}</div>` : ""}</div>`
    ).join("");
  })()}
</body>
</html>`;

  // Crea un iframe nascosto, ci inietta l'HTML e avvia la stampa
  // → il browser mostra "Salva come PDF" nella finestra di stampa
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 400);
};

// ══════════════════════════════════════════════════════════════
// EXPORT: intero ricettario in PDF — indice + pagine sezione + ricette
// ══════════════════════════════════════════════════════════════
const exportBookPDF = (recipes, sections = MACRO_SECTIONS) => {
  const isSec = (arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object" && "section" in arr[0];

  // Corpo di una singola ricetta (stesso layout dell'export singolo)
  const recipeBody = (recipe) => {
    const flatIng = isSec(recipe.ingredients)
      ? recipe.ingredients.flatMap(s => s.section ? [`── ${s.section} ──`, ...s.items.map(ingredientToText)] : s.items.map(ingredientToText))
      : recipe.ingredients.map(ingredientToText);
    const flatSteps = isSec(recipe.steps)
      ? recipe.steps.flatMap(s => {
          const items = s.items.map(st => typeof st === "string" ? { text: st, photo: null } : { text: st.text, photo: st.photo });
          return s.section ? [{ sectionLabel: s.section }, ...items] : items;
        })
      : recipe.steps.map(st => typeof st === "string" ? { text: st, photo: null } : { text: st.text, photo: st.photo });
    let n = 0;
    return `
  <div class="recipe">
    <h1>${recipe.title}</h1>
    ${recipe.source ? `<div class="source">Ricetta di ${recipe.source}</div>` : ""}
    ${recipe.dishPhoto ? `<div class="dish-photo">${recipe.dishPhoto === "PLACEHOLDER" ? "🍽️" : recipe.dishPhoto}</div>` : ""}
    <div class="meta">
      <span>Prep: ${recipe.prepTime} min</span><span>·</span>
      <span>Cottura: ${recipe.cookTime} min</span><span>·</span>
      <span>${recipe.servings} porzioni</span>
    </div>
    ${recipe.note ? `<div class="note">${recipe.note}</div>` : ""}
    <h2>Ingredienti</h2>
    ${flatIng.map(ing => ing.startsWith("──")
      ? `<div class="section-label">${ing.replace(/── | ──/g,"")}</div>`
      : `<div class="ing">${ing}</div>`
    ).join("")}
    <div class="divider">✦</div>
    <h2>Preparazione</h2>
    ${flatSteps.map(step => step.sectionLabel
      ? `<div class="section-label">${step.sectionLabel}</div>`
      : `<div class="step"><div class="step-n">${++n}</div><div class="step-t">${step.text}</div>${step.photo && step.photo !== "PLACEHOLDER" ? `<div class="step-photo">${step.photo}</div>` : ""}</div>`
    ).join("")}
  </div>`;
  };

  // Sezioni con almeno una ricetta, nell'ordine di MACRO_SECTIONS
  const sectionsWithRecipes = sortSectionsAltroLast(sections)
    .map(sec => ({ ...sec, recipes: recipes.filter(r => r.macroSection === sec.id) }))
    .filter(sec => sec.recipes.length > 0);

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Il mio Ricettario</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
  .page { page-break-after: always; padding: 40px; }
  /* Copertina */
  .cover { text-align:center; padding-top: 200px; }
  .cover .small { font-size: 12px; letter-spacing: 4px; color: #8a7c66; text-transform: uppercase; font-family: sans-serif; }
  .cover h1 { font-size: 44px; font-style: italic; margin: 10px 0 6px; }
  .cover .sub { font-size: 15px; color: #7A6E5F; font-style: italic; }
  .cover .orn { color: #B8973A; font-size: 18px; margin: 26px 0; }
  /* Indice */
  .index h1 { font-size: 26px; font-style: italic; text-align: center; margin-bottom: 24px; }
  .index .sec { font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #8B4520; margin: 20px 0 8px; border-bottom: 1.5px solid #EDE6D4; padding-bottom: 4px; }
  .index .row { display:flex; align-items:baseline; font-size: 13px; padding: 4px 0; }
  .index .row .t { }
  .index .row .dots { flex:1; border-bottom: 1px dotted #c9bda5; margin: 0 8px; }
  .index .row .c { font-size: 11px; color: #7A6E5F; font-family: sans-serif; }
  /* Pagina sezione */
  .secpage { text-align:center; padding-top: 230px; }
  .secpage .emoji { font-size: 80px; }
  .secpage h1 { font-size: 34px; font-style: italic; margin: 18px 0 8px; }
  .secpage .desc { font-size: 14px; color: #7A6E5F; font-style: italic; }
  .secpage .orn { color: #B8973A; font-size: 15px; margin-top: 24px; }
  /* Ricetta */
  .recipe { page-break-before: always; padding: 40px; }
  .recipe h1 { font-size: 26px; font-style: italic; text-align: center; margin-bottom: 4px; }
  .source { text-align: center; font-size: 13px; color: #666; margin-bottom: 12px; }
  .dish-photo { width: 170px; height: 128px; margin: 0 auto 14px; border: 1px solid #ddd; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 54px; background: #fafaf8; }
  .meta { display: flex; justify-content: center; gap: 20px; font-size: 12px; color: #555; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 7px 0; margin-bottom: 14px; }
  .note { border: 1px solid #ccc; padding: 9px 13px; font-style: italic; font-size: 12.5px; color: #555; margin-bottom: 14px; background: #fafaf8; }
  h2 { font-size: 14px; text-align: center; letter-spacing: 2px; text-transform: uppercase; margin: 16px 0 9px; color: #333; }
  .ing { font-size: 12.5px; line-height: 1.85; border-bottom: 1px solid #eee; padding: 2px 0; }
  .section-label { font-size: 10.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #8B4520; margin: 9px 0 4px; }
  .step { display: flex; gap: 11px; margin-bottom: 11px; }
  .step-n { width: 22px; height: 22px; border-radius: 50%; background: #8B4520; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: bold; flex-shrink: 0; margin-top: 2px; font-family: sans-serif; }
  .step-t { font-size: 12.5px; line-height: 1.6; }
  .step-photo { font-size: 30px; margin-left: 10px; }
  .divider { text-align: center; color: #B8973A; margin: 16px 0; font-size: 15px; }
  @media print { .page, .recipe { padding: 24px; } }
</style>
</head>
<body>
  <!-- Copertina -->
  <div class="page cover">
    <div class="small">Le nostre ricette, i nostri ricordi</div>
    <h1>Il mio Ricettario</h1>
    <div class="orn">✦ ✦ ✦</div>
    <div class="sub">${recipes.length} ricette</div>
  </div>

  <!-- Indice -->
  <div class="page index">
    <h1>Indice</h1>
    ${sectionsWithRecipes.map(sec => `
      <div class="sec">${sec.emoji} ${sec.label}</div>
      ${sec.recipes.map(r => `
        <div class="row">
          <span class="t">${r.title}</span>
          <span class="dots"></span>
          <span class="c">${r.category}</span>
        </div>`).join("")}
    `).join("")}
  </div>

  <!-- Sezioni e ricette -->
  ${sectionsWithRecipes.map(sec => `
    <div class="page secpage">
      <div class="emoji">${sec.emoji}</div>
      <h1>${sec.label}</h1>
      <div class="desc">${sec.desc}</div>
      <div class="orn">✦ ✦ ✦</div>
    </div>
    ${sec.recipes.map(recipeBody).join("")}
  `).join("")}
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 400);
};

// ══════════════════════════════════════════════════════════════
// SCREEN: HOME
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// SCREEN: RECIPE DETAIL
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// HELPER: scala le quantità negli ingredienti in proporzione
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// MODELLO INGREDIENTE: { name, qty, unit, note? }
//   qty: numero (anche decimale) oppure null (es. "q.b.", senza quantità)
//   unit: stringa dal menu unità ("g", "cucchiai", "q.b.", "" per pezzi)
//   note: annotazione opzionale, mostrata tra parentesi
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// DIALOG: scelta numero persone prima di spesa/cucina
// ══════════════════════════════════════════════════════════════



// ── Calcolo nutrizionale di una ricetta ──
// nutritionMap: { "<nome normalizzato>": { foodId } | { custom:{kcal,...} } }
// Ritorna { total, perServing, covered, excluded:[{name, reason}] }
const computeRecipeNutrition = (recipe, nutritionMap = {}, equivalences = {}, customFoods = [], ingredientDict = null, aggregates = [], sourceByIngredient) => {
  const dictIdx = ingredientDict ? ingDictIndex(ingredientDict) : null;
  const allFoods = [...NUTRITION_DB, ...customFoods];
  const dbById = new Map(allFoods.map(f => [f.id, f]));
  const dbByName = new Map(allFoods.map(f => [normName(f.name), f]));
  const total = { kcal:0, carb:0, sug:0, prot:0, fat:0, sat:0, fib:0, salt:0 };
  const excluded = [];
  let covered = 0;
  let totalGrams = 0;

  const details = []; // sintesi per-ingrediente: incluso/escluso e perché
  flattenIngredients(recipe.ingredients).forEach(ing => {
    const key = resolveIngId(dictIdx, ing.name);
    // Se l'ingrediente appartiene a un aggregato con nutrizione propria,
    // usa quella (agg.id); altrimenti resta la chiave del singolo.
    const effKey = effectiveNutritionKey(key, aggregates, nutritionMap, sourceByIngredient);
    const mapping = nutritionMap[effKey];
    // 1) mappatura esplicita → 2) match esatto sul nome del database
    const values = mapping?.custom
      ? mapping.custom
      : mapping?.foodId
        ? dbById.get(mapping.foodId)
        : dbByName.get(normName(ing.name));
    const foodName = mapping?.custom ? "valori manuali" : values?.name;
    if (ing.qty == null) {
      // q.b. / senza dose: irrilevante per il computo
      details.push({ name: ing.name, status: "noqty" });
      return;
    }
    if (!values) {
      excluded.push({ name: ing.name, reason: "non collegato" });
      details.push({ name: ing.name, status: "unlinked" });
      return;
    }
    const grams = ingredientToGrams(ing, equivalences, dictIdx, aggregates, sourceByIngredient);
    if (grams == null) {
      excluded.push({ name: ing.name, reason: `unità "${ing.unit || "?"}" non convertibile in grammi` });
      details.push({ name: ing.name, status: "nounit", unit: ing.unit, foodName });
      return;
    }
    // Percentuale che resta nel prodotto finale (default 100)
    const pct = typeof ing.nutriPct === "number" ? Math.max(0, Math.min(100, ing.nutriPct)) : 100;
    if (pct === 0) {
      details.push({ name: ing.name, status: "optout" });
      return;
    }
    const effGrams = grams * pct / 100;
    covered++;
    totalGrams += effGrams;
    details.push({ name: ing.name, status: "ok", grams: effGrams, foodName, pct });
    Object.keys(total).forEach(k => { total[k] += (values[k] || 0) * effGrams / 100; });
  });

  const servings = recipe.servings > 0 ? recipe.servings : 1;
  const perServing = {};
  Object.keys(total).forEach(k => { perServing[k] = total[k] / servings; });
  const per100 = {};
  Object.keys(total).forEach(k => { per100[k] = totalGrams > 0 ? total[k] * 100 / totalGrams : 0; });
  return { total, perServing, per100, totalGrams, covered, excluded, details };
};


// ══════════════════════════════════════════════════════════════
// NUTRITION CARD — tabella valori nella scheda ricetta
// ══════════════════════════════════════════════════════════════
const NutritionCard = ({ recipe, nutritionMap = {}, equivalences = {}, customFoods = [], ingredientDict = null, aggregates = [], sourceByIngredient = {}, standalone = false }) => {
  const th = useTheme();
  const [open, setOpen] = useState(standalone);
  const [view, setView] = useState("serving"); // "serving" | "per100" | "total"

  const nutri = React.useMemo(
    () => computeRecipeNutrition(recipe, nutritionMap, equivalences, customFoods, ingredientDict, aggregates, sourceByIngredient),
    [recipe, nutritionMap, equivalences, customFoods, ingredientDict, aggregates, sourceByIngredient]
  );
  // Conta gli ingredienti mappati (anche se non convertibili in grammi)
  const mappedCount = React.useMemo(() => {
    const dbByName = new Map([...NUTRITION_DB, ...customFoods].map(f => [normName(f.name), f]));
    const idx = ingredientDict ? ingDictIndex(ingredientDict) : null;
    return flattenIngredients(recipe.ingredients).filter(ing => {
      const key = effectiveNutritionKey(resolveIngId(idx, ing.name), aggregates, nutritionMap, sourceByIngredient);
      return nutritionMap[key] || dbByName.has(normName(ing.name));
    }).length;
  }, [recipe, nutritionMap, customFoods, ingredientDict, aggregates, sourceByIngredient]);

  if (nutri.covered === 0 && mappedCount === 0) return null; // nessuna mappatura: nulla da mostrare

  // Mappature presenti ma nessuna quantità convertibile in grammi → guida invece della tabella
  if (nutri.covered === 0) {
    return (
      <div style={{ marginTop:14, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:14, padding:"12px 14px" }}>
        <div style={{ fontFamily:F.ui, fontSize:12, fontWeight:700, color:th.appInk, marginBottom:6 }}>🍎 Valori nutrizionali</div>
        <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.55, marginBottom:8 }}>
          {mappedCount} ingredient{mappedCount===1?"e è collegato":"i sono collegati"} al database, ma nessuna quantità è convertibile in grammi.
          Definisci i fattori (es. 1 cucchiaio = 10 g) in ⚙️ Organizza › ⚖️ Organizza equivalenze.
        </div>
        {nutri.details.map((d, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:8, fontFamily:F.ui, fontSize:10.5, lineHeight:1.7, color:th.appFaded }}>
            <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {d.status === "noqty" || d.status === "optout" ? "·" : "○"} {d.name}
            </span>
            <span style={{ flexShrink:0, fontStyle:"italic" }}>
              {d.status === "noqty" ? "q.b." : d.status === "optout" ? "escluso (0%)" : d.status === "nounit" ? `"${d.unit || "?"}" non convertibile` : "non collegato"}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const vals = view === "per100" ? nutri.per100 : nutri.perServing;
  const fmt = (v, dec) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10**dec) / 10**dec).replace(".", ",");

  return (
    <div style={{ marginTop: standalone ? 0 : 14, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:14, overflow:"hidden" }}>
      <button onClick={() => { if (!standalone) setOpen(o => !o); }} style={{
        width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 14px", background:"none", border:"none", cursor: standalone ? "default" : "pointer",
      }}>
        <span style={{ fontFamily:F.ui, fontSize:12, fontWeight:700, color:th.appInk }}>
          🍎 Valori nutrizionali
          <span style={{ fontWeight:400, color:th.appFaded }}> · {fmt(nutri.perServing.kcal, 0)} kcal/porzione</span>
        </span>
        {!standalone && <span style={{ color:th.appFaded, fontSize:12 }}>{open ? "▴" : "▾"}</span>}
      </button>

      {open && (
        <div style={{ padding:"0 14px 12px" }}>
          <div style={{ display:"flex", gap:5, marginBottom:10, flexWrap:"wrap" }}>
            {[["Per porzione","serving"], ["Per 100 g","per100"]].map(([label, v]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:"5px 11px", borderRadius:14,
                border:`1.5px solid ${view === v ? th.appAccent : th.appBorder}`,
                background: view === v ? th.appAccent : "transparent",
                color: view === v ? "#fff" : th.appFaded,
                fontFamily:F.ui, fontSize:10.5, fontWeight:600, cursor:"pointer",
              }}>{label}</button>
            ))}
          </div>
          {view === "per100" && (
            <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginBottom:8 }}>
              su {fmt(nutri.totalGrams, 0)} g totali di ingredienti calcolati (a crudo)
            </div>
          )}

          {NUTRIENT_LABELS.map(({ key, label, unit, dec, sub }) => (
            <div key={key} style={{
              display:"flex", justifyContent:"space-between",
              padding: sub ? "3px 0 3px 16px" : "5px 0",
              borderBottom:`1px solid ${th.appBorder}55`,
              fontFamily:F.body, fontSize: sub ? 12 : 13.5,
              color: sub ? th.appFaded : th.appInk,
            }}>
              <span>{label}</span>
              <span style={{ fontWeight: sub ? 400 : 700 }}>{fmt(vals[key], dec)} {unit}</span>
            </div>
          ))}

          {/* Sintesi per ingrediente — quantità scalate alla vista corrente */}
          <div style={{ marginTop:10 }}>
            <div style={{ fontFamily:F.ui, fontSize:9.5, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:5 }}>
              Ingredienti nel calcolo · {view === "per100" ? "per 100 g" : "per porzione"}
            </div>
            {nutri.details.map((d, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", gap:8,
                fontFamily:F.ui, fontSize:10.5, lineHeight:1.7,
                color: d.status === "ok" ? th.appInk : th.appFaded,
              }}>
                <span style={{ minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {d.status === "ok" ? "✓" : d.status === "noqty" || d.status === "optout" ? "·" : "○"} {d.name}
                  {d.status === "ok" && (
                    <span style={{
                      display:"inline-block", marginLeft:5, padding:"0 5px", borderRadius:6,
                      fontSize:8.5, fontWeight:700, verticalAlign:"middle",
                      background: d.pct < 100 ? `${th.appAccent}22` : `${th.appBorder}66`,
                      color: d.pct < 100 ? th.appAccent : th.appFaded,
                    }} title="Pesatura nel calcolo nutrizionale">{d.pct != null ? d.pct : 100}%</span>
                  )}
                  {d.status === "optout" && (
                    <span style={{ display:"inline-block", marginLeft:5, padding:"0 5px", borderRadius:6, fontSize:8.5, fontWeight:700, verticalAlign:"middle", background:`${th.appBorder}66`, color:th.appFaded }}>0%</span>
                  )}
                  {d.status === "ok" && d.foodName && d.foodName !== "valori manuali" && normName(d.foodName) !== normName(d.name) && (
                    <span style={{ opacity:0.6 }}> → {d.foodName}</span>
                  )}
                </span>
                <span style={{ flexShrink:0, fontStyle: d.status === "ok" ? "normal" : "italic" }}>
                  {d.status === "ok" ? (() => {
                      const factor = view === "serving" ? 1 / (recipe.servings > 0 ? recipe.servings : 1)
                                   : view === "per100"  ? (nutri.totalGrams > 0 ? 100 / nutri.totalGrams : 0)
                                   : 1;
                      const g = d.grams * factor;
                      return `${fmt(g, g < 10 ? 1 : 0)} g`;
                    })()
                    : d.status === "noqty" ? "q.b. — non conteggiato"
                    : d.status === "optout" ? "escluso dal calcolo (0%)"
                    : d.status === "nounit" ? `"${d.unit || "?"}" non convertibile`
                    : "non collegato"}
                </span>
              </div>
            ))}
          </div>
          {nutri.excluded.length > 0 && (
            <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:8, lineHeight:1.5 }}>
              ⚠ Per includere gli esclusi: ⚙️ Organizza › 🍎 Valori nutrizionali (collegamenti) o ⚖️ Equivalenze (unità).
            </div>
          )}
          <div style={{ fontFamily:F.ui, fontSize:9, color:th.appFaded, marginTop:8, textAlign:"center" }}>
            Valori indicativi — elaborazione da Tabelle CREA (alimentinutrizione.it)
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// COMPONENT: ExportFlow — overlay a passi per esportare ricette
// Passo 1: solo questa ricetta o più ricette?
// Passo 2 (se più): selezione multipla con "seleziona tutto"
// Passo 3: link (codice) o PDF?
// ══════════════════════════════════════════════════════════════
const ExportFlow = ({ current, allRecipes = [], sectionList = MACRO_SECTIONS, onExportPDF, onExportCode, onClose }) => {
  const th = useTheme();
  const [step, setStep] = useState("scope");      // scope | select | format
  const [selected, setSelected] = useState([current.id]);
  const [scope, setScope] = useState("single");   // single | multi
  const [resultCode, setResultCode] = useState(null);
  const [copied, setCopied] = useState(false);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const allIds = allRecipes.map(r => r.id);
  const allSelected = selected.length === allRecipes.length && allRecipes.length > 0;
  const toggleAll = () => setSelected(allSelected ? [] : allIds);

  const finalIds = scope === "single" ? [current.id] : selected;

  const doPDF = () => { onExportPDF(finalIds); onClose(); };
  const doCode = () => { const code = onExportCode(finalIds); setResultCode(code || ""); };

  const Panel = ({ children }) => (
    <div style={{ position:"absolute", inset:0, zIndex:600, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:18 }}>
      <div style={{ width:"100%", maxHeight:"88%", background:th.appBg, borderRadius:20, padding:"20px 18px", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {children}
      </div>
    </div>
  );
  const Title = ({ children }) => (
    <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk, textAlign:"center", marginBottom:4 }}>{children}</div>
  );
  const Sub = ({ children }) => (
    <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, textAlign:"center", marginBottom:16, lineHeight:1.5 }}>{children}</div>
  );
  const Primary = (props) => (
    <button {...props} style={{ padding:"13px", borderRadius:12, border:"none", background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer", ...(props.style||{}) }}/>
  );
  const Ghost = (props) => (
    <button {...props} style={{ padding:"13px", borderRadius:12, border:`1.5px solid ${th.appBorder}`, background:"transparent", color:th.appInk, fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer", ...(props.style||{}) }}/>
  );

  // Risultato codice/link
  if (resultCode !== null) {
    return (
      <Panel>
        <Title>🔗 Link di condivisione</Title>
        <Sub>Copia questo codice e invialo. Chi lo riceve lo incolla in "Importa da codice" per aggiungere le ricette al suo ricettario.</Sub>
        <textarea readOnly value={resultCode} style={{
          width:"100%", height:110, resize:"none", borderRadius:12, padding:"10px 12px",
          border:`1.5px solid ${th.appBorder}`, background:th.appCard, color:th.appInk,
          fontFamily:"monospace", fontSize:11, marginBottom:12,
        }}/>
        <Primary onClick={() => {
          if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(resultCode).catch(()=>{}); }
          setCopied(true); setTimeout(()=>setCopied(false), 1500);
        }}>{copied ? "✓ Copiato" : "📋 Copia il codice"}</Primary>
        <Ghost onClick={onClose} style={{ marginTop:8 }}>Chiudi</Ghost>
      </Panel>
    );
  }

  // Passo 1 — ambito
  if (step === "scope") {
    return (
      <Panel>
        <Title>📤 Esporta</Title>
        <Sub>Vuoi esportare solo questa ricetta o sceglierne più di una?</Sub>
        <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
          <Primary onClick={() => { setScope("single"); setStep("format"); }}>
            📄 Solo «{current.title}»
          </Primary>
          <Ghost onClick={() => { setScope("multi"); setStep("select"); }}>
            ✔️ Scegli più ricette
          </Ghost>
          <Ghost onClick={onClose} style={{ border:"none", color:th.appFaded }}>Annulla</Ghost>
        </div>
      </Panel>
    );
  }

  // Passo 2 — selezione multipla
  if (step === "select") {
    return (
      <Panel>
        <Title>Scegli le ricette</Title>
        <Sub>{selected.length} selezionate</Sub>
        <button onClick={toggleAll} style={{
          padding:"9px", borderRadius:10, border:`1.5px solid ${th.appAccent}`,
          background: allSelected ? th.appAccent : "transparent",
          color: allSelected ? "#fff" : th.appAccent,
          fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer", marginBottom:10, flexShrink:0,
        }}>{allSelected ? "✓ Tutto il ricettario selezionato" : "Seleziona tutto il ricettario"}</button>
        <div style={{ flex:1, overflowY:"auto", marginBottom:12 }}>
          {sortSectionsAltroLast(sectionList).map(sec => {
            const inSec = allRecipes.filter(r => r.macroSection === sec.id);
            if (inSec.length === 0) return null;
            return (
              <div key={sec.id} style={{ marginBottom:8 }}>
                <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, textTransform:"uppercase", letterSpacing:0.5, margin:"4px 2px" }}>{sec.emoji} {sec.label}</div>
                {inSec.map(r => {
                  const sel = selected.includes(r.id);
                  return (
                    <button key={r.id} onClick={() => toggle(r.id)} style={{
                      width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 11px",
                      borderRadius:10, marginBottom:4, cursor:"pointer", textAlign:"left",
                      background: sel ? `${th.appAccent}18` : th.appCard,
                      border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                    }}>
                      <span style={{
                        width:20, height:20, borderRadius:6, flexShrink:0,
                        border:`1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                        background: sel ? th.appAccent : "transparent",
                        color:"#fff", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center",
                      }}>{sel ? "✓" : ""}</span>
                      <span style={{ fontFamily:F.body, fontSize:13, color:th.appInk }}>{r.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <Ghost onClick={() => setStep("scope")} style={{ flex:1 }}>‹ Indietro</Ghost>
          <Primary onClick={() => selected.length > 0 && setStep("format")} style={{ flex:2, opacity: selected.length ? 1 : 0.5 }}>Continua →</Primary>
        </div>
      </Panel>
    );
  }

  // Passo 3 — formato
  return (
    <Panel>
      <Title>Come vuoi esportare?</Title>
      <Sub>{finalIds.length === 1 ? "1 ricetta" : `${finalIds.length} ricette`}</Sub>
      <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
        <Primary onClick={doCode}>🔗 Genera link (per copiarle in un altro ricettario)</Primary>
        <Ghost onClick={doPDF}>📄 Genera PDF (da stampare o inviare)</Ghost>
        <Ghost onClick={() => setStep(scope === "multi" ? "select" : "scope")} style={{ border:"none", color:th.appFaded }}>‹ Indietro</Ghost>
      </div>
    </Panel>
  );
};

const RecipeScreen = ({ recipe, onBack, onUpdate, onEdit, onDelete, onDeleteMemory, onAddToShoppingList, nutritionMap = {}, equivalences = {}, customFoods = [], ingredientDict = null, aggregates = [], sourceByIngredient = {}, allRecipes = [], sectionList = MACRO_SECTIONS, onExportPDF, onExportCode }) => {
  const th = useTheme();
  const [tab, setTab] = useState("ingredienti");
  const [toast, setToast] = useState({ msg:"", visible:false });
  const [viewMode, setViewMode] = useState("app");
  const [exportOpen, setExportOpen] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // showAddMemory removed — use home screen
  const [lightbox, setLightbox] = useState(null);
  const [servingsDialog, setServingsDialog] = useState(null); // null | "shopping" | "cooking" | "dose"
  // Calcolo dosi persistente per questa ricetta: default = dosi standard.
  const [doseScale, setDoseScale] = useState({ factor: 1, people: recipe.servings || null, label: `dosi standard (${recipe.servings || "?"} porzioni)` });
  const [activeMode, setActiveMode] = useState(null); // null | {mode, people}
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const addComment = () => {
    const text = commentInput.trim();
    if (!text) return;
    const newComment = {
      id: uid("r"),
      text,
      date: new Date().toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }),
    };
    onUpdate({ ...recipe, comments: [...(recipe.comments || []), newComment] });
    setCommentInput("");
    showToast("💬 Commento aggiunto!");
  };

  const deleteComment = (id) => {
    onUpdate({ ...recipe, comments: (recipe.comments || []).filter(c => c.id !== id) });
    if (editingCommentId === id) { setEditingCommentId(null); setEditingText(""); }
  };

  const startEditComment = (c) => {
    setEditingCommentId(c.id);
    setEditingText(c.text);
  };

  const saveEditedComment = () => {
    const text = editingText.trim();
    if (!text) return;
    onUpdate({
      ...recipe,
      comments: (recipe.comments || []).map(c =>
        c.id === editingCommentId
          ? { ...c, text, edited: new Date().toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }) }
          : c
      ),
    });
    setEditingCommentId(null);
    setEditingText("");
    showToast("✏️ Commento modificato!");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const showToast = (msg) => {
    setToast({ msg, visible:true });
    setTimeout(() => setToast({ msg:"", visible:false }), 2000);
  };

  const addDishPhoto = () => {
    const wasPresent = !!recipe.dishPhoto;
    setShowPhotoOptions(false);
    onUpdate({ ...recipe, dishPhoto: "PLACEHOLDER" });
    showToast(wasPresent ? "📸 Foto piatto aggiornata!" : "📸 Foto piatto aggiunta!");
  };

  return (
    <div style={{ background: viewMode==="book" ? th.bookBg : th.appBg, minHeight:"100%", position:"relative" }}>
      {exportOpen && (
        <ExportFlow
          current={recipe}
          allRecipes={allRecipes}
          sectionList={sectionList}
          onExportPDF={(ids) => onExportPDF && onExportPDF(ids)}
          onExportCode={(ids) => onExportCode && onExportCode(ids)}
          onClose={() => setExportOpen(false)}
        />
      )}
      <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
        <BackBtn onBack={onBack} label="Ricettario" dark={viewMode==="book"}/>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {/* View toggle */}
          <div style={{ display:"flex", gap:0 }}>
            {[["app","App"],["book","📖"]].map(([mode,label]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding:"5px 10px", border:"none",
                background: viewMode===mode ? (mode==="book" ? "#333" : "#2C2416") : "#EDE6D4",
                color: viewMode===mode ? "#fff" : "#7A6E5F",
                fontFamily:F.ui, fontSize:11, fontWeight:600,
                cursor:"pointer",
                borderRadius: mode==="app" ? "8px 0 0 8px" : "0 8px 8px 0",
              }}>{label}</button>
            ))}
          </div>
          {/* Export button */}
          <button onClick={() => setExportOpen(true)} style={{
            padding:"5px 10px", border:"none",
            borderRadius:8, background:"transparent",
            fontSize:16, cursor:"pointer", lineHeight:1,
            color:"rgba(255,255,255,0.7)",
          }} title="Esporta / condividi">📤</button>
          {/* Favorite button */}
          <button onClick={() => onUpdate({ ...recipe, favorite: !recipe.favorite })} style={{
            padding:"5px 10px", border:"none",
            borderRadius:8, background:"transparent",
            fontSize:18, cursor:"pointer", lineHeight:1,
          }}>{recipe.favorite ? "⭐" : "☆"}</button>
          {/* Edit button */}
          <button onClick={onEdit} style={{
            padding:"5px 12px", border:`1.5px solid ${th.appAccent}`,
            borderRadius:8, background:"transparent",
            color:th.appAccent, fontFamily:F.ui, fontSize:11, fontWeight:600,
            cursor:"pointer",
          }}>✏️ Modifica</button>
          {/* Delete button */}
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            padding:"5px 10px", border:"none",
            borderRadius:8, background:"transparent",
            color:"#ccc", fontFamily:F.ui, fontSize:16,
            cursor:"pointer", lineHeight:1,
          }}>🗑</button>
        </div>
      </div>

      <Toast msg={toast.msg} visible={toast.visible}/>

      {/* ── Delete confirmation modal ── */}
      {showDeleteConfirm && (
        <div style={{
          position:"absolute", inset:0, zIndex:200,
          background:"rgba(0,0,0,0.5)",
          display:"flex", alignItems:"flex-end",
          backdropFilter:"blur(4px)",
        }}>
          <div style={{
            width:"100%",
            background:"#FAF7F0",
            borderRadius:"24px 24px 0 0",
            padding:"28px 24px 40px",
          }}>
            <div style={{ textAlign:"center", marginBottom:6 }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🗑️</div>
              <div style={{ fontFamily:F.display, fontSize:20, color:"#2C2416", marginBottom:8 }}>
                Elimina ricetta?
              </div>
              <div style={{ fontFamily:F.ui, fontSize:13, color:"#7A6E5F", lineHeight:1.5 }}>
                Stai per eliminare <strong>"{recipe.title}"</strong> dal ricettario.
                <br/>Questa azione non può essere annullata.
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:24 }}>
              <button onClick={() => { onDelete(recipe.id); }} style={{
                width:"100%", padding:"15px",
                background:"#D93025", color:"#fff",
                border:"none", borderRadius:14,
                fontFamily:F.ui, fontSize:15, fontWeight:700,
                cursor:"pointer",
                boxShadow:"0 4px 16px rgba(217,48,37,0.35)",
              }}>Sì, elimina definitivamente</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                width:"100%", padding:"15px",
                background:"#EDE6D4", color:"#2C2416",
                border:"none", borderRadius:14,
                fontFamily:F.ui, fontSize:15, fontWeight:600,
                cursor:"pointer",
              }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      {lightbox && (
        <PhotoLightbox
          photo={lightbox.photo}
          caption={lightbox.caption}
          date={lightbox.date}
          onClose={() => setLightbox(null)}
        />
      )}

      {viewMode === "app" ? (
        // ── App view ────────────────────────────────────────────
        <div>
          {/* Hero */}
          <div style={{
            margin:"12px 20px",
            background: recipe.dishPhoto ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>)` : recipe.color,
            borderRadius:20,
            padding:"28px 24px",
            position:"relative", overflow:"hidden",
          }}>
            {recipe.dishPhoto && (
              <div
                onClick={() => setLightbox({ photo:"📸", caption:recipe.title, date:"" })}
                style={{
                  position:"absolute", inset:0, borderRadius:20,
                  background:`${recipe.color}cc`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:60, cursor:"pointer",
                }}
              >
                📸
                <div style={{ position:"absolute", bottom:10, right:14, fontSize:18, opacity:0.7 }}>⤢</div>
              </div>
            )}
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.7)", textTransform:"uppercase" }}>{recipe.category}</div>
              <div style={{ fontFamily:F.display, fontSize:24, color:"#fff", lineHeight:1.2, marginTop:4 }}>{recipe.title}</div>
              {recipe.source && (
                <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:4 }}>
                  {recipe.sourceUrl
                    ? <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color:"rgba(255,255,255,0.8)", textDecoration:"underline", cursor:"pointer" }}>🔗 Ricetta di {recipe.source}</a>
                    : <>Ricetta di {recipe.source}</>
                  }
                </div>
              )}
              <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
                <Pill icon="🔪" label={`Prep: ${recipe.prepTime} min`}/>
                <Pill icon="🔥" label={`Cottura: ${recipe.cookTime} min`}/>
                <Pill icon="👤" label={`${recipe.servings} porzioni`}/>
              </div>
            </div>

            {/* Camera icon — add/modify dish photo */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowPhotoOptions(!showPhotoOptions); }}
              style={{
                position:"absolute", top:12, right:12, zIndex:3,
                width:36, height:36, borderRadius:"50%",
                background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)",
                border:"1px solid rgba(255,255,255,0.25)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:17, cursor:"pointer",
              }}
              title={recipe.dishPhoto ? "Modifica foto piatto" : "Aggiungi foto piatto"}
            >📷</button>
          </div>

          {/* Photo options dropdown */}
          {showPhotoOptions && (
            <div style={{
              margin:"0 20px 12px",
              background:"#F7F2E8", border:`1px solid #EDE6D4`,
              borderRadius:12, overflow:"hidden",
            }}>
              <div style={{ padding:"10px 16px 4px", fontFamily:F.ui, fontSize:10, letterSpacing:1, color:"#7A6E5F", textTransform:"uppercase" }}>
                {recipe.dishPhoto ? "Modifica foto del piatto" : "Aggiungi foto del piatto"}
              </div>
              {[["📷","Scatta una foto"],["🖼","Scegli dalla galleria"]].map(([icon, label]) => (
                <button key={label} onClick={addDishPhoto} style={{
                  width:"100%", padding:"12px 16px",
                  background:"none", border:"none",
                  borderTop:`1px solid ${"#EDE6D4"}`,
                  fontFamily:F.ui, fontSize:14, color:"#2C2416",
                  textAlign:"left", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:10,
                }}><span>{icon}</span>{label}</button>
              ))}
              {recipe.dishPhoto && (
                <button onClick={() => { onUpdate({ ...recipe, dishPhoto: null }); setShowPhotoOptions(false); showToast("🗑 Foto rimossa"); }} style={{
                  width:"100%", padding:"12px 16px",
                  background:"none", border:"none",
                  borderTop:`1px solid ${"#EDE6D4"}`,
                  fontFamily:F.ui, fontSize:14, color:"#D93025",
                  textAlign:"left", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:10,
                }}><span>🗑</span>Rimuovi foto</button>
              )}
            </div>
          )}

          {/* Tags */}
          <div style={{ display:"flex", gap:6, padding:"0 20px 8px", flexWrap:"wrap" }}>
            {recipe.tags.map(t => (
              <span key={t} style={{
                padding:"4px 12px", borderRadius:20,
                background:"#EDE6D4", color:"#7A6E5F",
                fontFamily:F.ui, fontSize:11,
              }}>{t}</span>
            ))}
          </div>

          {/* Calcolo dosi (persistente per la ricetta) */}
          <div style={{ padding:"0 20px 8px" }}>
            <button onClick={() => setServingsDialog("dose")} style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${doseScale.factor !== 1 ? th.appAccent : th.appBorder}`,
              borderRadius:12, background: doseScale.factor !== 1 ? `${th.appAccent}10` : th.appCard,
              cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left",
            }}>
              <span style={{ fontSize:20 }}>⚖️</span>
              <span style={{ flex:1 }}>
                <span style={{ display:"block", fontFamily:F.ui, fontSize:12, fontWeight:700, color:th.appInk }}>Calcolo dosi</span>
                <span style={{ display:"block", fontFamily:F.ui, fontSize:10.5, color: doseScale.factor !== 1 ? th.appAccent : th.appFaded, marginTop:1 }}>{doseScale.label}</span>
              </span>
              <span style={{ fontFamily:F.ui, fontSize:16, color:th.appFaded }}>›</span>
            </button>
          </div>

          {/* Mode buttons: Spesa + Cucina — usano il calcolo dosi impostato sopra */}
          <div style={{ display:"flex", gap:8, padding:"0 20px 12px" }}>
            <button onClick={() => setActiveMode({ mode:"shopping", scale: doseScale })} style={{
              flex:1, padding:"12px 8px",
              border:"none", borderRadius:12,
              background:th.appAccent, color:"#fff",
              fontFamily:F.ui, fontSize:13, fontWeight:700,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>🛒 Spesa</button>
            <button onClick={() => setActiveMode({ mode:"cooking", scale: doseScale })} style={{
              flex:1, padding:"12px 8px",
              border:"none", borderRadius:12,
              background:th.appInk, color:"#fff",
              fontFamily:F.ui, fontSize:13, fontWeight:700,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>👨‍🍳 Cucina</button>
          </div>

          <Divider/>

          {/* Tabs */}
          <div style={{ display:"flex", padding:"8px 20px", gap:8 }}>
            {[["ingredienti","Ingredienti"],["preparazione","Preparazione"],["nutrizione","Nutrizione"]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, padding:"10px 6px",
                borderRadius:12, border:"none",
                background: tab===t ? th.appInk : th.appBorder,
                color: tab===t ? "#fff" : th.appFaded,
                fontFamily:F.ui, fontSize:12, fontWeight:600,
                cursor:"pointer",
              }}>{label}</button>
            ))}
          </div>

          <div style={{ padding:"8px 24px 40px" }}>
            {doseScale.factor !== 1 && tab !== "nutrizione" && (
              <div style={{ margin:"0 20px 10px", padding:"8px 12px", borderRadius:10, background:`${th.appAccent}12`, border:`1px solid ${th.appAccent}55`, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:15 }}>⚖️</span>
                <span style={{ fontFamily:F.ui, fontSize:11, color:th.appInk, lineHeight:1.35 }}>
                  Dosi in scala <b>×{Math.round(doseScale.factor*100)/100}</b> — {doseScale.label}. Le quantità mostrate sono già ricalcolate.
                </span>
              </div>
            )}
            {tab === "ingredienti" && (
              <IngredientsView ingredients={recipe.ingredients} recipeColor={recipe.color} scaleFactor={doseScale.factor}/>
            )}
            {tab === "preparazione" && (
              <StepsView steps={recipe.steps} recipeColor={recipe.color}/>
            )}
            {tab === "nutrizione" && (
              (() => {
                const dbByName = new Map([...NUTRITION_DB, ...customFoods].map(f => [normName(f.name), f]));
                const idx = ingredientDict ? ingDictIndex(ingredientDict) : null;
                const anyMapped = flattenIngredients(recipe.ingredients).some(ing => {
                  const key = effectiveNutritionKey(resolveIngId(idx, ing.name), aggregates, nutritionMap, sourceByIngredient);
                  return nutritionMap[key] || dbByName.has(normName(ing.name));
                });
                if (!anyMapped) {
                  return (
                    <div style={{ textAlign:"center", padding:"30px 20px", color:th.appFaded }}>
                      <div style={{ fontSize:34, marginBottom:10 }}>🍎</div>
                      <div style={{ fontFamily:F.ui, fontSize:13, color:th.appInk, fontWeight:700, marginBottom:6 }}>Nessun valore nutrizionale</div>
                      <div style={{ fontFamily:F.ui, fontSize:11, lineHeight:1.5 }}>
                        Collega gli ingredienti al database in <b>🍎⚙️ Organizza › 🍎 Valori nutrizionali</b> per vedere calorie e macro di questa ricetta.
                      </div>
                    </div>
                  );
                }
                return <NutritionCard recipe={recipe} nutritionMap={nutritionMap} equivalences={equivalences} customFoods={customFoods} ingredientDict={ingredientDict} aggregates={aggregates} sourceByIngredient={sourceByIngredient} standalone/>;
              })()
            )}

            {recipe.note && (
              <div style={{
                marginTop:20,
                background:"#EDE6D4",
                borderRadius:14,
                padding:"14px 16px",
                borderLeft:`3px solid ${"#B8973A"}`,
              }}>
                <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#B8973A", textTransform:"uppercase", marginBottom:6 }}>Note</div>
                <p style={{ fontFamily:F.body, fontStyle:"italic", fontSize:13, color:"#7A6E5F", margin:0, lineHeight:1.5 }}>"{recipe.note}"</p>
              </div>
            )}

            {/* ── COMMENTI / APPUNTI ── */}
            <div style={{ marginTop:24 }}>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appAccent, textTransform:"uppercase", marginBottom:4, fontWeight:700 }}>
                💬 Commenti e appunti
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:10, lineHeight:1.4 }}>
                Annota varianti e osservazioni senza modificare la ricetta.
              </div>

              {/* Lista commenti */}
              {(recipe.comments || []).length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                  {recipe.comments.map(c => (
                    <div key={c.id} style={{
                      background:th.appCard, border:`1px solid ${editingCommentId === c.id ? th.appAccent : th.appBorder}`,
                      borderRadius:12, padding:"10px 12px",
                      display:"flex", gap:10, alignItems:"flex-start",
                    }}>
                      <span style={{ fontSize:14, marginTop:1 }}>📝</span>
                      {editingCommentId === c.id ? (
                        // ── Modalità modifica ──
                        <div style={{ flex:1 }}>
                          <textarea
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveEditedComment(); }
                              if (e.key === "Escape") { cancelEditComment(); }
                            }}
                            autoFocus
                            rows={2}
                            style={{
                              width:"100%", padding:"8px 10px",
                              border:`1.5px solid ${th.appAccent}`,
                              borderRadius:10, background:th.appBg,
                              fontFamily:F.body, fontSize:13, color:th.appInk,
                              outline:"none", resize:"vertical", boxSizing:"border-box", minHeight:44,
                            }}
                          />
                          <div style={{ display:"flex", gap:8, marginTop:8 }}>
                            <button onClick={saveEditedComment} disabled={!editingText.trim()} style={{
                              padding:"6px 14px", borderRadius:8, border:"none",
                              background: editingText.trim() ? th.appAccent : th.appBorder,
                              color: editingText.trim() ? "#fff" : th.appFaded,
                              fontFamily:F.ui, fontSize:12, fontWeight:700,
                              cursor: editingText.trim() ? "pointer" : "default",
                            }}>Salva</button>
                            <button onClick={cancelEditComment} style={{
                              padding:"6px 14px", borderRadius:8,
                              border:`1.5px solid ${th.appBorder}`, background:"transparent",
                              color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer",
                            }}>Annulla</button>
                          </div>
                        </div>
                      ) : (
                        // ── Visualizzazione ──
                        <>
                          <div style={{ flex:1 }}>
                            <p style={{ fontFamily:F.body, fontSize:13, color:th.appInk, margin:0, lineHeight:1.5 }}>{c.text}</p>
                            <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:4 }}>
                              📅 {c.date}{c.edited ? ` · modificato ${c.edited}` : ""}
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                            <button onClick={() => startEditComment(c)} style={{
                              background:"none", border:"none", color:th.appFaded,
                              fontSize:13, cursor:"pointer", padding:0,
                            }}>✏️</button>
                            <button onClick={() => deleteComment(c.id)} style={{
                              background:"none", border:"none", color:"#ccc",
                              fontSize:15, cursor:"pointer", padding:0,
                            }}>×</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Input nuovo commento */}
              <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                <textarea
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addComment(); }
                  }}
                  placeholder="Scrivi un commento o una variante…"
                  rows={2}
                  style={{
                    flex:1, padding:"10px 12px",
                    border:`1.5px solid ${commentInput ? th.appAccent : th.appBorder}`,
                    borderRadius:12, background:th.appCard,
                    fontFamily:F.body, fontSize:13, color:th.appInk,
                    outline:"none", resize:"vertical", boxSizing:"border-box",
                    minHeight:44,
                  }}
                />
                <button
                  onClick={addComment}
                  disabled={!commentInput.trim()}
                  style={{
                    padding:"11px 16px", borderRadius:12, border:"none",
                    background: commentInput.trim() ? th.appAccent : th.appBorder,
                    color: commentInput.trim() ? "#fff" : th.appFaded,
                    fontFamily:F.ui, fontSize:13, fontWeight:700,
                    cursor: commentInput.trim() ? "pointer" : "default",
                    flexShrink:0,
                  }}
                >＋</button>
              </div>
            </div>

            {/* ── RICORDI ── */}
            <MemoriesSection
              memories={recipe.memories || []}
              color={recipe.color}
              onAdd={() => {}}  /* handled by home */
              onDelete={(memId) => onDeleteMemory(memId)}
            />
          </div>
        </div>
      ) : (
        // ── Book view ─────────────────────────────────────────
        <BookPageView recipe={recipe}/>
      )}

      {/* Dialog calcolo dosi (imposta doseScale per la ricetta) */}
      {servingsDialog && (
        <ServingsDialog
          recipe={recipe}
          title="Calcolo dosi"
          emoji="⚖️"
          initialScale={doseScale}
          onConfirm={(scale) => { setDoseScale(scale); setServingsDialog(null); }}
          onClose={() => setServingsDialog(null)}
        />
      )}

      {/* Active mode overlays */}
      {activeMode?.mode === "shopping" && (
        <ShoppingMode recipe={recipe} scale={activeMode.scale} onAddToList={onAddToShoppingList} onClose={() => setActiveMode(null)}/>
      )}
      {activeMode?.mode === "cooking" && (
        <CookingMode recipe={recipe} scale={activeMode.scale} onClose={() => setActiveMode(null)}/>
      )}
    </div>
  );
};

// ── Memories Section ───────────────────────────────────────────
const MemoriesSection = ({ memories, color, onAdd, onDelete }) => {
  const th = useTheme();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // {photo, caption, date}
  const isEmpty = !memories || memories.length === 0;

  return (
    <div style={{ marginTop:28 }}>
      {/* Lightbox */}
      {lightbox && (
        <PhotoLightbox
          photo={lightbox.photo}
          caption={lightbox.caption}
          date={lightbox.date}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Section header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ flex:1, height:1, background:th.appBorder }}/>
        <span style={{ fontFamily:F.ui, fontSize:11, letterSpacing:2.5, color:th.appFaded, textTransform:"uppercase" }}>
          I nostri ricordi
        </span>
        <div style={{ flex:1, height:1, background:th.appBorder }}/>
      </div>

      {/* Memory grid */}
      {isEmpty ? (
        <div style={{
          textAlign:"center", padding:"24px 16px",
          background:th.appCard, borderRadius:16,
          border:`1.5px dashed ${th.appBorder}`,
          marginBottom:16,
        }}>
          <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
          <div style={{ fontFamily:F.display, fontSize:15, color:th.appFaded, fontStyle:"italic" }}>
            Nessun ricordo ancora
          </div>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:4, opacity:0.7 }}>
            Aggiungi una foto la prossima volta che cucinate questa ricetta
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {memories.map(mem => (
            <div key={mem.id} style={{
              position:"relative",
              borderRadius:14, overflow:"hidden",
              background:`linear-gradient(135deg, ${color}28, ${color}12)`,
              border:`1px solid ${color}30`,
            }}>
              {/* Photo — tappable to open lightbox */}
              <div
                onClick={() => setLightbox({ photo:mem.photo, caption:mem.caption, date:mem.date })}
                style={{
                  height:110, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:44,
                  background:`linear-gradient(135deg, ${color}20, ${color}08)`,
                  position:"relative",
                }}
              >
                {mem.photo}
                {/* Expand hint */}
                <div style={{
                  position:"absolute", bottom:4, right:6,
                  fontSize:12, opacity:0.5,
                }}>⤢</div>
              </div>

              {/* Caption + date */}
              <div style={{ padding:"8px 10px 10px" }}>
                {mem.caption && (
                  <div style={{
                    fontFamily:F.body, fontSize:12, color:th.appInk,
                    fontStyle:"italic", lineHeight:1.4, marginBottom:3,
                  }}>"{mem.caption}"</div>
                )}
                <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, letterSpacing:0.5 }}>
                  📅 {mem.date}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => setConfirmDeleteId(mem.id)}
                style={{
                  position:"absolute", top:6, right:6,
                  width:22, height:22, borderRadius:"50%",
                  background:"rgba(0,0,0,0.45)", color:"#fff",
                  border:"none", cursor:"pointer",
                  fontSize:11, display:"flex", alignItems:"center", justifyContent:"center",
                }}>×</button>

              {/* Confirm delete overlay */}
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
                    <button onClick={() => { onDelete(mem.id); setConfirmDeleteId(null); }} style={{
                      padding:"5px 12px", borderRadius:8,
                      background:"#D93025", color:"#fff",
                      border:"none", fontFamily:F.ui, fontSize:11, cursor:"pointer", fontWeight:700,
                    }}>Elimina</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add memory button handled by home screen */}
    </div>
  );
};

// ── Add Memory Modal ───────────────────────────────────────────
// ══════════════════════════════════════════════════════════════
// SCREEN: ADD MEMORY — standalone, choose recipes to link
// ══════════════════════════════════════════════════════════════
const AddMemoryScreen = ({ recipes, onBack, onSave, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping }) => {
  const th = useTheme();
  const todayISO = new Date().toISOString().slice(0,10);
  const dateLabel = (iso) => new Date(iso).toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" });
  const [caption, setCaption] = useState("");
  const [story, setStory] = useState("");
  const [chosenPhoto, setChosenPhoto] = useState(null); // emoji o dataURL immagine
  const [photoIsImage, setPhotoIsImage] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const fileInputRef = React.useRef(null);

  const MEMORY_EMOJIS = ["🍽","🥂","🎉","👨‍👩‍👦","🌿","🌅","🏠","🎂","⛺","🌊","❄️","🫂","🎄","🌸","🍂","✨","🫶","🥳"];
  const today = dateLabel(selectedDate);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setChosenPhoto(ev.target.result); setPhotoIsImage(true); };
    reader.readAsDataURL(file);
  };

  const toggleRecipe = (id) => setSelectedRecipeIds(prev =>
    prev.includes(id) ? prev.filter(r=>r!==id) : [...prev, id]
  );

  const canSave = chosenPhoto && selectedRecipeIds.length > 0;

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <GlobalNav
        activeScreen="add"
        onRecipes={onRecipes}
        onBook={onBook}
        onMemories={onMemories}
        onAdd={onAdd}
        onFridge={onFridge}
        onShopping={onShopping}
        onLanding={onLanding}
        onSearch={() => {}}
        onFavorites={() => {}}
        showSearch={false}
        showFavorites={false}
        activeLabel="Nuovo Ricordo"
      />
      <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BackBtn onBack={onBack} label="Annulla"/>
        <button
          onClick={() => canSave && onSave({ photo:chosenPhoto, photoIsImage, caption, story, date:today, dateISO:selectedDate, recipeIds:selectedRecipeIds })}
          style={{
            background: canSave ? th.appAccent : th.appBorder,
            color: canSave ? "#fff" : th.appFaded,
            border:"none", borderRadius:10, padding:"8px 18px",
            fontFamily:F.ui, fontSize:13, fontWeight:700,
            cursor: canSave ? "pointer" : "default", transition:"all 0.2s",
          }}
        >Salva ✓</button>
      </div>

      <div style={{ padding:"12px 20px 4px" }}>
        <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk }}>Nuovo Ricordo</div>
        <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:2 }}>{today}</div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 20px 40px", display:"flex", flexDirection:"column", gap:16 }}>

        {/* Data del ricordo */}
        <div>
          <EditLabel text="Quando è successo"/>
          <input
            type="date"
            value={selectedDate}
            max={todayISO}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${th.appBorder}`,
              borderRadius:12, background:th.appCard,
              fontFamily:F.body, fontSize:14, color:th.appInk,
              outline:"none", boxSizing:"border-box",
            }}
          />
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:6 }}>
            Predefinita a oggi. Cambiala se il momento è di un altro giorno.
          </div>
        </div>

        {/* Photo — caricamento reale con anteprima */}
        <div>
          <EditLabel text="Foto"/>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }}/>
          {photoIsImage && chosenPhoto ? (
            <div style={{ position:"relative", borderRadius:14, overflow:"hidden", border:`1.5px solid ${th.appBorder}` }}>
              <img src={chosenPhoto} alt="anteprima" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }}/>
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{
                position:"absolute", bottom:10, right:10,
                background:"rgba(0,0,0,0.6)", color:"#fff", border:"none",
                borderRadius:10, padding:"7px 12px", fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
              }}>🔄 Cambia foto</button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{
              width:"100%", padding:"22px 8px",
              border:`2px dashed ${th.appBorder}`, borderRadius:14,
              background:"transparent", color:th.appFaded,
              fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            }}>
              <span style={{ fontSize:30 }}>📷</span>
              <span>Scatta o scegli dalla galleria</span>
            </button>
          )}
        </div>

        {/* Emoji picker — alternativa se non c'è una foto */}
        <div>
          <EditLabel text={photoIsImage ? "Oppure usa un'emoji" : "Oppure scegli un'emoji"}/>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {MEMORY_EMOJIS.map(e => (
              <button key={e} onClick={() => { setChosenPhoto(e); setPhotoIsImage(false); }} style={{
                width:38, height:38, borderRadius:10,
                border:`1.5px solid ${!photoIsImage && chosenPhoto===e ? th.appAccent : th.appBorder}`,
                background: !photoIsImage && chosenPhoto===e ? `${th.appAccent}15` : "transparent",
                fontSize:20, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Titolo breve */}
        <div>
          <EditLabel text="Titolo (opzionale)"/>
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="es. Domenica in famiglia, prima volta insieme…"
            style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${th.appBorder}`,
              borderRadius:12, background:th.appCard,
              fontFamily:F.body, fontStyle:"italic",
              fontSize:14, color:th.appInk,
              outline:"none", boxSizing:"border-box",
            }}
          />
        </div>

        {/* Racconto — spazio ampio per la storia */}
        <div>
          <EditLabel text="Il racconto (opzionale)"/>
          <textarea
            value={story}
            onChange={e => setStory(e.target.value)}
            placeholder="Com'è andata? Chi c'era, cosa vi siete detti, un dettaglio da ricordare…"
            rows={4}
            style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${th.appBorder}`,
              borderRadius:12, background:th.appCard,
              fontFamily:F.body, fontSize:14, color:th.appInk,
              outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.5,
            }}
          />
        </div>

        {/* Recipe association — required */}
        <div>
          <EditLabel text="Associa a una o più ricette *"/>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:8 }}>
            Seleziona almeno una ricetta
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {recipes.map(r => {
              const sel = selectedRecipeIds.includes(r.id);
              return (
                <button key={r.id} onClick={() => toggleRecipe(r.id)} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 14px",
                  background: sel ? `${r.color}15` : th.appCard,
                  border:`1.5px solid ${sel ? r.color : th.appBorder}`,
                  borderRadius:12, cursor:"pointer", textAlign:"left",
                  transition:"all 0.15s",
                }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:r.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{r.emoji}</div>
                  <div style={{ flex:1, fontFamily:F.ui, fontSize:13, color: sel ? r.color : th.appInk, fontWeight: sel ? 600 : 400 }}>{r.title}</div>
                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    border:`2px solid ${sel ? r.color : th.appBorder}`,
                    background: sel ? r.color : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:12, flexShrink:0,
                  }}>{sel ? "✓" : ""}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={() => canSave && onSave({ photo:chosenPhoto, photoIsImage, caption, story, date:today, dateISO:selectedDate, recipeIds:selectedRecipeIds })}
          style={{
            width:"100%", padding:"15px",
            background: canSave ? th.appAccent : th.appBorder,
            color: canSave ? "#fff" : th.appFaded,
            border:"none", borderRadius:14,
            fontFamily:F.ui, fontSize:14, fontWeight:700,
            cursor: canSave ? "pointer" : "default",
            boxShadow: canSave ? `0 4px 16px ${th.appAccent}44` : "none",
            transition:"all 0.2s",
          }}
        >
          {!chosenPhoto
            ? "Seleziona una foto o emoji"
            : selectedRecipeIds.length === 0
              ? "Seleziona almeno una ricetta"
              : `Salva ricordo ✓ (${selectedRecipeIds.length} ricett${selectedRecipeIds.length===1?"a":"e"})`
          }
        </button>
      </div>
    </div>
  );
};



const BookPageView = ({ recipe }) => {
  const th = useTheme();
  return (
    <div style={{ background:th.bookBg, margin:"12px 16px", padding:"24px 20px", border:`1px solid ${th.bookBorder}`, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", fontFamily:F.book, color:th.bookInk, minHeight:600, position:"relative" }}>
      {[60,120,180].map(top => (
        <div key={top} style={{ position:"absolute", left:-8, top, width:12, height:12, borderRadius:"50%", background:th.appBorder, border:`1px solid ${th.bookBorder}` }}/>
      ))}
      <div style={{ textAlign:"center", fontSize:17, fontWeight:"bold", color:th.bookInk, marginBottom:14 }}>{recipe.title}</div>
      <div style={{ width:180, height:130, margin:"0 auto 14px", background:th.appBorder, border:`1px solid ${th.bookBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:40 }}>
        {recipe.dishPhoto ? "📸" : <span style={{ opacity:0.35 }}>{recipe.emoji}</span>}
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
              return <p key={i} style={{ fontSize:12, color:th.bookInk, lineHeight:1.65, marginBottom:8, marginTop:0 }}>{text}</p>;
            })}
          </div>
        ))
      ) : (
        recipe.steps.map((step,i) => {
          const text = typeof step === "string" ? step : step.text;
          return <p key={i} style={{ fontSize:12, color:th.bookInk, lineHeight:1.65, marginBottom:8, marginTop:0 }}>{text}</p>;
        })
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// SCREEN: SCAN — with confidence check + GPT confirmation
// ══════════════════════════════════════════════════════════════

// Simulated OCR results: one "good" and one "uncertain" for demo
const OCR_GOOD = {
  confidence: 94,
  title: "Risotto allo Zafferano",
  ingredients: [
    { name:"Riso Carnaroli", qty:320, unit:"g" },
    { name:"Cipolla dorata", qty:1, unit:"" },
    { name:"Brodo di carne", qty:1, unit:"l", note:"caldo" },
    { name:"Zafferano", qty:1, unit:"bustine" },
    { name:"Burro", qty:50, unit:"g" },
    { name:"Parmigiano Reggiano", qty:80, unit:"g" },
    { name:"Vino bianco secco", qty:100, unit:"ml" },
  ],
  steps: ["Soffriggere la cipolla tritata nel burro a fuoco dolce.","Tostare il riso per 2 minuti, sfumare con il vino bianco.","Aggiungere il brodo caldo un mestolo alla volta, mescolando.","A fine cottura sciogliere lo zafferano in poco brodo e unirlo al riso.","Mantecare con burro e parmigiano, coprire e lasciare riposare 2 minuti."],
  note: "Il segreto è la mantecatura finale: burro freddo e movimento deciso.",
  prepTime: 15, cookTime: 20, servings: 4,
};
const OCR_UNCERTAIN = {
  confidence: 48,
  title: "P?lp?tte di Mel??zane",
  ingredients: [
    { name:"Mel??zane", qty:3, unit:"", note:"t?nde" },
    { name:"Pec?r?no", qty:100, unit:"g" },
    { name:"U?va", qty:3, unit:"" },
    { name:"Pan gr?tt?to", qty:8, unit:"c?cchiai", note:"7-8" },
    { name:"M?nta, Bas?l?co, P?pe", qty:null, unit:"" },
    { name:"Ol?o EVO", qty:null, unit:"", note:"da sp?nnellare" },
  ],
  steps: ["T?gl?are a cub?tti le mel?nzane e b?llire 5 m?n.","Sc?lare e l?sciare in sc?lapasta c?n sale.","Un?re agli altri ?ngr?d?enti tranne il pan gr?ttato.","F?rm?re le p?lpette e sp?nnellare c?n ol?o.","Inf?rnare a 185° per 25/30 m?n."],
  note: "",
  prepTime: 30, cookTime: 25, servings: 8,
};

const ScanScreen = ({ onBack, onSave, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping, sectionList=MACRO_SECTIONS, onAddSection, onUpdateSection, onDeleteSection }) => {
  const [step, setStep] = useState("viewfinder");
  // "viewfinder" | "processing_vision" | "confidence_good" | "confidence_bad" | "gpt_confirm" | "processing_gpt" | "result"
  const [ocrData, setOcrData] = useState(null);
  const [useUncertain, setUseUncertain] = useState(false); // toggle for demo
  const [selectedTags, setSelectedTags] = useState([]);
  const [recipeName, setRecipeName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📄");
  const [selectedColor, setSelectedColor] = useState("#6B8C6E");
  const [scanMacro, setScanMacro] = useState("altro"); // default: Altro

  // Elemento (non componente): evita il remount di SectionPicker a ogni render
  const macroPicker = (
    <div>
      <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#7A6E5F", textTransform:"uppercase", marginBottom:6 }}>Sezione del ricettario</div>
      <SectionPicker
        value={scanMacro}
        onChange={setScanMacro}
        sections={sectionList}
        onAddSection={onAddSection}
        onUpdateSection={onUpdateSection}
        onDeleteSection={onDeleteSection}
      />
    </div>
  );

  // Simulated costs
  const GPT_COST_EURO = 0.01;
  const CREDIT_REMAINING = 4.87;

  const toggleTag = (tag) => setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]);

  const handleShoot = () => {
    setStep("processing_vision");
    setTimeout(() => {
      const data = useUncertain ? OCR_UNCERTAIN : OCR_GOOD;
      setOcrData(data);
      setRecipeName(data.title);
      setStep(data.confidence >= 80 ? "confidence_good" : "confidence_bad");
    }, 2200);
  };

  const handleUseGPT = () => setStep("gpt_confirm");

  const handleConfirmGPT = () => {
    setStep("processing_gpt");
    setTimeout(() => {
      // GPT "fixes" the uncertain data
      setOcrData(prev => ({
        ...prev,
        confidence: 97,
        title: "Polpette di Melanzane",
        ingredients: ["Melanzane: 3 tonde di medie dimensioni","Pecorino: 100g grattugiato","Uova: 3","Pan grattato: 7-8 cucchiai","Menta, Basilico, Pepe","Olio EVO da spennellare"],
        steps: ["Tagliare a cubetti le melanzane e bollire 5 min in acqua salata.","Scolare e lasciare in scolapasta con sale per perdere l'acqua.","Unire agli altri ingredienti tranne il pan grattato, aggiungere gradualmente.","Formare le polpette e spennellare con olio extravergine.","Infornare a 185° per 25/30 min."],
      }));
      setRecipeName("Polpette di Melanzane");
      setStep("result");
    }, 2000);
  };

  const bgColor = ["result","confidence_good","confidence_bad","gpt_confirm"].includes(step) ? "#FAF7F0" : "#2C2416";
  const isDark = bgColor === "#2C2416";

  return (
    <div style={{ background:bgColor, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <GlobalNav
        activeScreen="add"
        onRecipes={onRecipes}
        onBook={onBook}
        onMemories={onMemories}
        onAdd={onAdd}
        onFridge={onFridge}
        onShopping={onShopping}
        onLanding={onLanding}
        onSearch={() => {}}
        onFavorites={() => {}}
        showSearch={false}
        showFavorites={false}
        activeLabel="Scansiona Ricetta"
      />
      <div style={{ padding:"8px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BackBtn onBack={onBack} label="Annulla" dark={!isDark}/>
        {/* Demo toggle */}
        {step === "viewfinder" && (
          <button onClick={() => setUseUncertain(u=>!u)} style={{
            background:"none", border:`1px solid rgba(255,255,255,0.2)`,
            borderRadius:10, padding:"4px 10px",
            color:"rgba(255,255,255,0.5)", fontFamily:F.ui, fontSize:10,
            cursor:"pointer",
          }}>Demo: {useUncertain ? "grafia difficile 😬" : "testo chiaro ✓"}</button>
        )}
      </div>

      {/* ── VIEWFINDER ── */}
      {step === "viewfinder" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 24px" }}>
          <div style={{ fontFamily:F.display, fontSize:22, color:"#fff", textAlign:"center", marginBottom:4 }}>Scansiona Ricetta</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.5)", textAlign:"center", marginBottom:20 }}>
            Inquadra la pagina — tieni il telefono fermo
          </div>
          <div style={{ width:"100%", aspectRatio:"3/4", borderRadius:20, background:"#111", position:"relative", overflow:"hidden", border:"2px solid rgba(255,255,255,0.12)" }}>
            {[["top:12px","left:12px","borderTop","borderLeft"],["top:12px","right:12px","borderTop","borderRight"],
              ["bottom:12px","left:12px","borderBottom","borderLeft"],["bottom:12px","right:12px","borderBottom","borderRight"]
            ].map(([t,s,b1,b2],i) => (
              <div key={i} style={{
                position:"absolute", width:28, height:28,
                [b1]:`3px solid ${"#C4593A"}`, [b2]:`3px solid ${"#C4593A"}`,
                ...Object.fromEntries([t,s].map(x=>x.split(":"))), borderRadius:4,
              }}/>
            ))}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:56, opacity:0.12 }}>📄</span>
            </div>
          </div>
          <button onClick={handleShoot} style={{
            marginTop:28, width:68, height:68, borderRadius:"50%",
            background:"#fff", border:"5px solid rgba(255,255,255,0.25)",
            cursor:"pointer", fontSize:26,
          }}>📷</button>
          <div style={{ color:"rgba(255,255,255,0.35)", fontFamily:F.ui, fontSize:11, marginTop:10 }}>Premi per fotografare</div>
        </div>
      )}

      {/* ── PROCESSING VISION ── */}
      {step === "processing_vision" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:24 }}>
          <div style={{ fontSize:44 }}>🔍</div>
          <div style={{ fontFamily:F.display, fontSize:20, color:"#fff", textAlign:"center" }}>Lettura testo in corso…</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.45)", textAlign:"center" }}>Apple Vision sta analizzando la pagina</div>
          <ProgressBar color={"#C4593A"} duration={2200}/>
        </div>
      )}

      {/* ── PROCESSING GPT ── */}
      {step === "processing_gpt" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:24 }}>
          <div style={{ fontSize:44 }}>✨</div>
          <div style={{ fontFamily:F.display, fontSize:20, color:"#fff", textAlign:"center" }}>GPT sta correggendo…</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.45)", textAlign:"center" }}>Strutturazione intelligente della ricetta</div>
          <ProgressBar color="#7B61FF" duration={2000}/>
        </div>
      )}

      {/* ── CONFIDENCE GOOD ── */}
      {step === "confidence_good" && ocrData && (
        <div style={{ padding:"16px 22px 32px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* Score badge */}
          <div style={{
            background:`${"#6B8C6E"}18`, border:`1.5px solid ${"#6B8C6E"}`,
            borderRadius:14, padding:"14px 16px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{ fontSize:32 }}>✅</div>
            <div>
              <div style={{ fontFamily:F.ui, fontSize:13, fontWeight:700, color:"#6B8C6E" }}>
                Testo riconosciuto con alta confidenza
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:"#7A6E5F", marginTop:2 }}>
                Accuratezza Apple Vision: <strong>{ocrData.confidence}%</strong> — nessun intervento AI necessario
              </div>
            </div>
          </div>

          <ScanPreview ocrData={ocrData} recipeName={recipeName} setRecipeName={setRecipeName}/>

          <EmojiColorPicker emoji={selectedEmoji} color={selectedColor} onEmoji={setSelectedEmoji} onColor={setSelectedColor}/>

          {macroPicker}

          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={() => setStep("viewfinder")} style={{
              flex:1, padding:"13px",
              border:`1.5px solid #EDE6D4`, borderRadius:12,
              background:"transparent", color:"#7A6E5F",
              fontFamily:F.ui, fontSize:13, cursor:"pointer",
            }}>Rifai foto</button>
            <button onClick={() => onSave(recipeName, selectedTags, ocrData, selectedEmoji, selectedColor, scanMacro)} style={{
              flex:2, padding:"13px",
              background:"#6B8C6E", color:"#fff",
              border:"none", borderRadius:12,
              fontFamily:F.ui, fontSize:14, fontWeight:700,
              cursor:"pointer", boxShadow:`0 4px 16px ${"#6B8C6E"}55`,
            }}>Continua →</button>
          </div>

          <TagSection selectedTags={selectedTags} onChange={(tags) => setSelectedTags(tags)}/>
        </div>
      )}

      {/* ── CONFIDENCE BAD ── */}
      {step === "confidence_bad" && ocrData && (
        <div style={{ padding:"16px 22px 32px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* Score badge */}
          <div style={{
            background:`#C4593A18`, border:`1.5px solid ${"#C4593A"}`,
            borderRadius:14, padding:"14px 16px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{ fontSize:32 }}>⚠️</div>
            <div>
              <div style={{ fontFamily:F.ui, fontSize:13, fontWeight:700, color:"#C4593A" }}>
                Testo difficile da leggere
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:"#7A6E5F", marginTop:2 }}>
                Accuratezza Apple Vision: <strong>{ocrData.confidence}%</strong> — alcuni caratteri incerti (evidenziati in rosso)
              </div>
            </div>
          </div>

          <ScanPreviewUncertain ocrData={ocrData} recipeName={recipeName} setRecipeName={setRecipeName}/>

          <EmojiColorPicker emoji={selectedEmoji} color={selectedColor} onEmoji={setSelectedEmoji} onColor={setSelectedColor}/>

          {macroPicker}

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setStep("viewfinder")} style={{
              flex:1, padding:"13px",
              border:`1.5px solid #EDE6D4`, borderRadius:12,
              background:"transparent", color:"#7A6E5F",
              fontFamily:F.ui, fontSize:12, cursor:"pointer",
            }}>Rifai foto</button>
            <button onClick={() => onSave(recipeName, selectedTags, ocrData, selectedEmoji, selectedColor, scanMacro)} style={{
              flex:1, padding:"13px",
              border:`1.5px solid #EDE6D4`, borderRadius:12,
              background:"transparent", color:"#7A6E5F",
              fontFamily:F.ui, fontSize:12, cursor:"pointer",
            }}>Continua →</button>
            <button onClick={handleUseGPT} style={{
              flex:2, padding:"13px",
              background:"#C4593A", color:"#fff",
              border:"none", borderRadius:12,
              fontFamily:F.ui, fontSize:13, fontWeight:700,
              cursor:"pointer", boxShadow:"0 4px 14px rgba(196,89,58,0.4)",
            }}>✨ Migliora con AI</button>
          </div>

          <TagSection selectedTags={selectedTags} onChange={(tags) => setSelectedTags(tags)}/>
        </div>
      )}

      {/* ── GPT CONFIRM ── */}
      {step === "gpt_confirm" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px 22px", gap:16 }}>
          <div style={{ fontFamily:F.display, fontSize:20, color:"#2C2416" }}>Conferma utilizzo AI</div>
          <div style={{ fontFamily:F.ui, fontSize:13, color:"#7A6E5F", lineHeight:1.6 }}>
            GPT-4o analizzerà il testo riconosciuto e correggerà i caratteri incerti, strutturando la ricetta in modo pulito.
          </div>

          {/* Cost card */}
          <div style={{
            background:"#F7F2E8", border:`1px solid #EDE6D4`,
            borderRadius:16, overflow:"hidden",
          }}>
            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${"#EDE6D4"}` }}>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#7A6E5F", textTransform:"uppercase", marginBottom:10 }}>Riepilogo costo</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontFamily:F.ui, fontSize:13, color:"#2C2416" }}>Analisi GPT-4o (1 ricetta)</div>
                <div style={{ fontFamily:F.ui, fontSize:14, fontWeight:700, color:"#2C2416" }}>€ {GPT_COST_EURO.toFixed(2)}</div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:F.ui, fontSize:13, color:"#7A6E5F" }}>Credito residuo attuale</div>
                <div style={{ fontFamily:F.ui, fontSize:14, fontWeight:700, color:"#6B8C6E" }}>€ {CREDIT_REMAINING.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ padding:"12px 16px", background:`${"#6B8C6E"}10` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:F.ui, fontSize:13, fontWeight:600, color:"#6B8C6E" }}>Credito dopo questa operazione</div>
                <div style={{ fontFamily:F.ui, fontSize:15, fontWeight:700, color:"#6B8C6E" }}>
                  € {(CREDIT_REMAINING - GPT_COST_EURO).toFixed(2)}
                </div>
              </div>
              <div style={{ fontFamily:F.ui, fontSize:10, color:"#7A6E5F", marginTop:4 }}>
                Equivale a circa {Math.floor((CREDIT_REMAINING - GPT_COST_EURO) / GPT_COST_EURO)} ricette rimanenti
              </div>
            </div>
          </div>

          {/* What GPT will do */}
          <div style={{ background:"#F7F2E8", border:`1px solid #EDE6D4`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#7A6E5F", textTransform:"uppercase", marginBottom:10 }}>GPT provvederà a</div>
            {["Correggere i caratteri non riconosciuti","Strutturare titolo, ingredienti e preparazione","Separare le unità di misura dagli ingredienti","Aggiungere punteggiatura e formattazione"].map((item,i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                <span style={{ color:"#6B8C6E", fontSize:14, marginTop:1 }}>✦</span>
                <span style={{ fontFamily:F.ui, fontSize:13, color:"#2C2416", lineHeight:1.4 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
            <button onClick={() => setStep("confidence_bad")} style={{
              flex:1, padding:"14px",
              border:`1.5px solid #EDE6D4`, borderRadius:12,
              background:"transparent", color:"#7A6E5F",
              fontFamily:F.ui, fontSize:13, cursor:"pointer",
            }}>Annulla</button>
            <button onClick={handleConfirmGPT} style={{
              flex:2, padding:"14px",
              background:"#7B61FF", color:"#fff",
              border:"none", borderRadius:12,
              fontFamily:F.ui, fontSize:14, fontWeight:700,
              cursor:"pointer", boxShadow:"0 4px 16px rgba(123,97,255,0.4)",
            }}>✨ Conferma — usa GPT</button>
          </div>
        </div>
      )}

      {/* ── RESULT (after GPT) ── */}
      {step === "result" && ocrData && (
        <div style={{ padding:"16px 22px 32px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{
            background:"#7B61FF18", border:"1.5px solid #7B61FF",
            borderRadius:14, padding:"14px 16px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{ fontSize:32 }}>✨</div>
            <div>
              <div style={{ fontFamily:F.ui, fontSize:13, fontWeight:700, color:"#7B61FF" }}>
                Ricetta migliorata da GPT-4o
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:"#7A6E5F", marginTop:2 }}>
                Accuratezza finale: <strong>{ocrData.confidence}%</strong> · Costo: <strong>€{GPT_COST_EURO.toFixed(2)}</strong> · Credito rimasto: <strong>€{(CREDIT_REMAINING-GPT_COST_EURO).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <ScanPreview ocrData={ocrData} recipeName={recipeName} setRecipeName={setRecipeName}/>

          <EmojiColorPicker emoji={selectedEmoji} color={selectedColor} onEmoji={setSelectedEmoji} onColor={setSelectedColor}/>

          {macroPicker}

          <button onClick={() => onSave(recipeName, selectedTags, ocrData, selectedEmoji, selectedColor, scanMacro)} style={{
            width:"100%", padding:"15px",
            background:"#7B61FF", color:"#fff",
            border:"none", borderRadius:12,
            fontFamily:F.ui, fontSize:14, fontWeight:700,
            cursor:"pointer", boxShadow:"0 4px 16px rgba(123,97,255,0.4)",
          }}>Continua →</button>

          <TagSection selectedTags={selectedTags} onChange={(tags) => setSelectedTags(tags)}/>
        </div>
      )}
    </div>
  );
};

// ── Shared sub-components for ScanScreen ──────────────────────

const ScanPreview = ({ ocrData, recipeName, setRecipeName }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
    <div>
      <ScanLabel text="Titolo"/>
      <input value={recipeName} onChange={e=>setRecipeName(e.target.value)} style={{
        width:"100%", padding:"10px 14px",
        border:`1.5px solid #EDE6D4`, borderRadius:10,
        background:"#F7F2E8", fontFamily:F.display, fontSize:15, color:"#2C2416",
        outline:"none", boxSizing:"border-box",
      }}/>
    </div>
    <div>
      <ScanLabel text={`Ingredienti (${ocrData.ingredients.length})`}/>
      <div style={{ border:`1.5px solid #EDE6D4`, borderRadius:10, padding:"10px 14px", background:"#F7F2E8" }}>
        {ocrData.ingredients.map((ing,i) => (
          <div key={i} style={{ fontFamily:F.body, fontSize:13, color:"#2C2416", lineHeight:1.8 }}>
            <span style={{ color:"#B8973A", marginRight:6 }}>✦</span>{ingredientToText(ing)}
          </div>
        ))}
      </div>
    </div>
    <div>
      <ScanLabel text={`Preparazione (${ocrData.steps.length} passi)`}/>
      <div style={{ border:`1.5px solid #EDE6D4`, borderRadius:10, padding:"10px 14px", background:"#F7F2E8" }}>
        {ocrData.steps.map((s,i) => (
          <div key={i} style={{ fontFamily:F.body, fontSize:12, color:"#2C2416", lineHeight:1.6, marginBottom:4 }}>
            <span style={{ fontWeight:700, color:"#7A6E5F", marginRight:6 }}>{i+1}.</span>{s}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ScanPreviewUncertain = ({ ocrData, recipeName, setRecipeName }) => {
  // Highlight ? characters in red
  const highlight = (text) => {
    const parts = text.split(/(\?)/);
    return parts.map((p,i) => p === "?" ?
      <span key={i} style={{ color:"#C4593A", fontWeight:700, background:`${"#C4593A"}18`, borderRadius:2, padding:"0 1px" }}>?</span> : p
    );
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div>
        <ScanLabel text="Titolo (verifica i caratteri rossi)"/>
        <input value={recipeName} onChange={e=>setRecipeName(e.target.value)} style={{
          width:"100%", padding:"10px 14px",
          border:`1.5px solid ${"#C4593A"}`, borderRadius:10,
          background:"#fff5f3", fontFamily:F.display, fontSize:15, color:"#2C2416",
          outline:"none", boxSizing:"border-box",
        }}/>
      </div>
      <div>
        <ScanLabel text="Ingredienti — caratteri incerti evidenziati"/>
        <div style={{ border:`1.5px solid ${"#C4593A"}`, borderRadius:10, padding:"10px 14px", background:"#fff5f3" }}>
          {ocrData.ingredients.map((ing,i) => (
            <div key={i} style={{ fontFamily:F.body, fontSize:13, color:"#2C2416", lineHeight:1.8 }}>
              <span style={{ color:"#B8973A", marginRight:6 }}>✦</span>{highlight(ingredientToText(ing))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontFamily:F.ui, fontSize:11, color:"#7A6E5F", textAlign:"center" }}>
        Puoi correggere manualmente oppure lasciare che GPT risolva tutto automaticamente
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// SCREEN: EDIT RECIPE
// ══════════════════════════════════════════════════════════════
const EditScreen = ({ recipe, onBack, onSave, extraTagGroups=[], onAddGroup, onAddTagToGroup, sectionList=MACRO_SECTIONS, onAddSection, onUpdateSection, onDeleteSection, allRecipes=[] }) => {
  const th = useTheme();
  // Normalise steps: can be string or {text, photos} (o vecchio {text, photo}).
  // Sectioned-aware: se ci sono sottosezioni, normalizza gli item dentro
  // ciascuna, mai il wrapper {section, items} (vedi bug #steps-sezionati).
  const normaliseSteps = (steps) => {
    const normOne = (s) =>
      typeof s === "string" ? { text: s, photos: [] } : { text: s?.text ?? "", photos: stepPhotosOf(s) };
    return isSectioned(steps)
      ? steps.map(sec => ({ ...sec, items: (sec.items || []).map(normOne) }))
      : (steps || []).map(normOne);
  };

  const [draft, setDraft] = useState({ ...recipe, steps: normaliseSteps(recipe.steps) });
  const [activeSection, setActiveSection] = useState("info");

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  const updateIngredient = (i, val) => {
    const arr = [...draft.ingredients];
    arr[i] = val;
    set("ingredients", arr);
  };
  const addIngredient = () => set("ingredients", [...draft.ingredients, ""]);
  const removeIngredient = (i) => set("ingredients", draft.ingredients.filter((_,idx) => idx!==i));

  const updateStep = (i, field, val) => {
    const arr = draft.steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    set("steps", arr);
  };
  const addStep = () => set("steps", [...draft.steps, { text:"", photo:null }]);
  const removeStep = (i) => set("steps", draft.steps.filter((_,idx) => idx!==i));
  const addStepPhoto = (i) => {
    // Simulate picking a photo — in real app would open camera/library
    updateStep(i, "photo", "PHOTO_PLACEHOLDER");
  };
  const removeStepPhoto = (i) => updateStep(i, "photo", null);

  const toggleTag = (tag) => {
    set("tags", draft.tags.includes(tag) ? draft.tags.filter(t=>t!==tag) : [...draft.tags, tag]);
  };

  // Before saving, convert steps back to plain strings if no photo
  // (sectioned-aware: con sottosezioni ripulisce gli item di ciascuna,
  // mai il wrapper {section, items} — vedi bug #steps-sezionati)
  const handleSave = () => {
    const steps = isSectioned(draft.steps)
      ? draft.steps.map(sec => ({ ...sec, items: sec.items.map(stripPhotolessStep) }))
      : draft.steps.map(stripPhotolessStep);
    onSave({ ...draft, steps });
  };


  // Suggerimenti autocomplete da tutto il ricettario attivo
  const nameSuggestions = React.useMemo(() =>
    collectAllIngredients(allRecipes).map(i => i.display),
    [allRecipes]);
  const unitSuggestions = React.useMemo(() => {
    const found = new Set();
    allRecipes.forEach(r => flattenIngredients(r.ingredients).forEach(ing => {
      if (ing.unit && ing.unit !== "q.b.") found.add(ing.unit);
    }));
    return Array.from(new Set([...DEFAULT_UNIT_SUGGESTIONS, ...found]));
  }, [allRecipes]);

  const sections = ["info","ingredienti","preparazione","note"];

  return (
    <div style={{ background:"#FAF7F0", minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BackBtn onBack={onBack} label="Annulla"/>
        <button onClick={handleSave} style={{
          background:"#C4593A", color:"#fff",
          border:"none", borderRadius:10,
          padding:"8px 18px",
          fontFamily:F.ui, fontSize:13, fontWeight:700,
          cursor:"pointer",
        }}>Salva ✓</button>
      </div>

      <div style={{ padding:"12px 20px 4px" }}>
        <div style={{ fontFamily:F.display, fontSize:20, color:"#2C2416" }}>Modifica Ricetta</div>
      </div>

      {/* Section tabs */}
      <div style={{ display:"flex", overflowX:"auto", gap:6, padding:"4px 20px 10px", scrollbarWidth:"none" }}>
        {sections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            flexShrink:0, padding:"6px 14px", borderRadius:20,
            border:"none",
            background: activeSection===s ? "#2C2416" : "#EDE6D4",
            color: activeSection===s ? "#fff" : "#7A6E5F",
            fontFamily:F.ui, fontSize:12, fontWeight:600,
            cursor:"pointer", textTransform:"capitalize",
          }}>{s}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 20px 60px" }}>

        {/* ── INFO ── */}
        {activeSection==="info" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <EditField label="Titolo" value={draft.title} onChange={v => set("title",v)}/>
            {/* Sezione del libro */}
            <div>
              <EditLabel text="Sezione del ricettario"/>
              <SectionPicker
                value={draft.macroSection}
                onChange={v => set("macroSection", v)}
                sections={sectionList}
                onAddSection={onAddSection}
                onUpdateSection={onUpdateSection}
        onDeleteSection={onDeleteSection}
                showDefaultHint={false}
              />
            </div>
            <EditField label="Fonte / Autore" value={draft.source} onChange={v => set("source",v)} placeholder="es. Nonna Maria"/>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ flex:1 }}>
                <EditLabel text="Prep (min)"/>
                <EditNumberInput value={draft.prepTime} onChange={v => set("prepTime", Number(v))}/>
              </div>
              <div style={{ flex:1 }}>
                <EditLabel text="Cottura (min)"/>
                <EditNumberInput value={draft.cookTime} onChange={v => set("cookTime", Number(v))}/>
              </div>
              <div style={{ flex:1 }}>
                <EditLabel text="Porzioni"/>
                <EditNumberInput value={draft.servings} onChange={v => set("servings", Number(v))}/>
              </div>
            </div>

            {/* Tags */}
            <div>
              <EditLabel text="Tag"/>
              <TagPicker
                selectedTags={draft.tags}
                onChange={(tags) => set("tags", tags)}
                extraGroups={extraTagGroups}
                onAddGroup={onAddGroup}
                onAddTagToGroup={onAddTagToGroup}
              />
            </div>
          </div>
        )}

        {/* ── INGREDIENTI ── */}
        {activeSection==="ingredienti" && (
          <div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:10, lineHeight:1.4, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"9px 12px" }}>
              💡 Inserisci ingrediente e quantità. Le <b>categorie</b> e gli <b>aggregati</b> (usati in Svuota Frigo) si gestiscono nella sezione <b>🍎⚙️ Organizza</b> del banner, così valgono per tutte le ricette.
            </div>
            <EditSectionedList
              data={toSectioned(draft.ingredients)}
              color={draft.color}
              itemType="ingredient"
              onUpdate={(sections) => set("ingredients", fromSectioned(sections))}
              nameSuggestions={nameSuggestions}
              unitSuggestions={unitSuggestions}
            />
          </div>
        )}

        {/* ── PREPARAZIONE ── */}
        {activeSection==="preparazione" && (
          <EditSectionedSteps
            data={toSectioned(draft.steps)}
            color={draft.color}
            onUpdate={(sections) => {
              const flat = fromSectioned(sections);
              // if flat array, strip photo-less steps back to strings
              if (Array.isArray(flat) && flat.length > 0 && !("section" in flat[0])) {
                set("steps", flat.map(stripPhotolessStep));
              } else {
                // sectioned: keep structure, strip photo-less items
                set("steps", sections.map(sec => ({
                  section: sec.section,
                  items: sec.items.map(stripPhotolessStep),
                })));
              }
            }}
          />
        )}

        {/* ── NOTE ── */}
        {activeSection==="note" && (
          <div>
            <EditLabel text="Note e consigli"/>
            <textarea
              value={draft.note}
              onChange={e => set("note", e.target.value)}
              rows={5}
              placeholder="Aggiungi note, varianti, consigli…"
              style={{
                width:"100%", padding:"12px 14px",
                border:`1.5px solid #EDE6D4`,
                borderRadius:12, background:"#F7F2E8",
                fontFamily:F.body, fontStyle:"italic",
                fontSize:14, color:"#2C2416",
                outline:"none", resize:"none", lineHeight:1.6,
                boxSizing:"border-box",
              }}
            />
            <EditLabel text="Fonte / Autore ricetta" style={{ marginTop:14 }}/>
            <input
              value={draft.source}
              onChange={e => set("source", e.target.value)}
              placeholder="es. Nonna Maria, Giallo Zafferano…"
              style={{
                width:"100%", padding:"10px 14px",
                border:`1.5px solid #EDE6D4`,
                borderRadius:10, background:"#F7F2E8",
                fontFamily:F.ui, fontSize:13, color:"#2C2416",
                outline:"none", boxSizing:"border-box",
              }}
            />
          </div>
        )}
      </div>

      {/* Floating save bar */}
      <div style={{
        position:"sticky", bottom:0,
        background:"#FAF7F0",
        borderTop:`1px solid ${"#EDE6D4"}`,
        padding:"12px 20px",
        display:"flex", gap:10,
      }}>
        <button onClick={onBack} style={{
          flex:1, padding:"12px",
          border:`1.5px solid #EDE6D4`,
          borderRadius:12, background:"transparent",
          color:"#7A6E5F", fontFamily:F.ui, fontSize:14,
          cursor:"pointer",
        }}>Annulla</button>
        <button onClick={handleSave} style={{
          flex:2, padding:"12px",
          background:"#C4593A", color:"#fff",
          border:"none", borderRadius:12,
          fontFamily:F.ui, fontSize:14, fontWeight:700,
          cursor:"pointer",
          boxShadow:"0 4px 16px rgba(196,89,58,0.35)",
        }}>Salva modifiche ✓</button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// SCREEN: THEME PICKER
// ══════════════════════════════════════════════════════════════
const ThemePickerScreen = ({ onBack, onSelect }) => {
  const th = useTheme();
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"8px 20px 0" }}><BackBtn onBack={onBack} label="Indietro"/></div>
      <div style={{ padding:"12px 20px 4px" }}>
        <div style={{ fontFamily:F.display, fontSize:24, color:th.appInk }}>Stile del libro</div>
        <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:4 }}>Scegli la copertina e il tema dell'app</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 40px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {BOOK_THEMES.map(theme => {
            const isActive = th.id === theme.id;
            return (
              <button key={theme.id} onClick={() => onSelect(theme)} style={{ background:"none", border:"none", padding:0, cursor:"pointer", textAlign:"left" }}>
                <div style={{ height:130, borderRadius:12, background:theme.coverBg, position:"relative", overflow:"hidden", boxShadow: isActive ? `0 0 0 3px ${th.appAccent}, 0 4px 16px rgba(0,0,0,0.2)` : "0 2px 10px rgba(0,0,0,0.15)", transition:"box-shadow 0.2s" }}>
                  <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(45deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 4px)" }}/>
                  {[{top:6,left:6,b1:"borderTop",b2:"borderLeft"},{top:6,right:6,b1:"borderTop",b2:"borderRight"},{bottom:6,left:6,b1:"borderBottom",b2:"borderLeft"},{bottom:6,right:6,b1:"borderBottom",b2:"borderRight"}].map((pos,i) => {
                    const {b1,b2,...coords} = pos;
                    return <div key={i} style={{ position:"absolute", width:10, height:10, ...coords, [b1]:`1px solid ${theme.coverAccent}`, [b2]:`1px solid ${theme.coverAccent}` }}/>;
                  })}
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                    <div style={{ fontFamily:F.display, fontSize:16, fontStyle:"italic", color:theme.coverText, letterSpacing:1, textShadow:"0 1px 8px rgba(0,0,0,0.3)" }}>Ricettario</div>
                    <div style={{ width:30, height:1, background:`linear-gradient(to right,transparent,${theme.coverAccent},transparent)` }}/>
                  </div>
                  <div style={{ position:"absolute", right:0, top:0, bottom:0, width:8, background:"linear-gradient(to right,#ccc,#f5f5f5)" }}/>
                  {isActive && <div style={{ position:"absolute", top:6, left:6, width:20, height:20, borderRadius:"50%", background:th.appAccent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>✓</div>}
                </div>
                <div style={{ padding:"6px 2px 0" }}>
                  <div style={{ fontFamily:F.ui, fontSize:12, fontWeight:600, color: isActive ? th.appAccent : th.appInk }}>{theme.name}</div>
                  <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:1 }}>{theme.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};




// ══════════════════════════════════════════════════════════════
// SCREEN: I MIEI RICETTARI — selezione, membri, trasferimento, codici
// ══════════════════════════════════════════════════════════════
const BooksScreen = ({
  books, activeBookId, me, activeRecipes,
  onSwitch, onCreate, onRename, onAddMember, onRemoveMember,
  onCopyRecipes, onExportCode, onImportCode,
  defaultBookId, onSetDefault,
  onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping,
}) => {
  const th = useTheme();
  const [phase, setPhase] = useState("list"); // "list" | "transfer"
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmails, setNewEmails] = useState("");
  const [renaming, setRenaming] = useState(null); // book id
  const [renameVal, setRenameVal] = useState("");
  const [memberInput, setMemberInput] = useState({}); // bookId → email
  const [importOpen, setImportOpen] = useState(false);
  const [importVal, setImportVal] = useState("");
  const [importMsg, setImportMsg] = useState(null);
  // transfer phase
  const [selIds, setSelIds] = useState([]);
  const [shareCode, setShareCode] = useState(null);
  const [copiedMsg, setCopiedMsg] = useState(null);

  const activeBook = books.find(b => b.id === activeBookId);
  const otherBooks = books.filter(b => b.id !== activeBookId);

  const nav = (
    <GlobalNav
      activeScreen="books"
      onRecipes={onRecipes}
      onBook={onBook}
      onMemories={onMemories}
      onAdd={onAdd}
      onFridge={onFridge}
      onShopping={onShopping}
      onLanding={onLanding}
      onSearch={() => {}}
      onFavorites={() => {}}
      showSearch={false}
      showFavorites={false}
      activeLabel="I miei Ricettari"
    />
  );

  // ══ FASE TRASFERIMENTO / CONDIVISIONE ══
  if (phase === "transfer") {
    const toggle = (id) => setSelIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    return (
      <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
        {nav}
        <div style={{ padding:"12px 20px 6px", display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={() => { setPhase("list"); setSelIds([]); setShareCode(null); }} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk }}>Esporta ricette</div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>da: {activeBook?.name}</div>
          </div>
        </div>

        {shareCode ? (
          <div style={{ flex:1, overflowY:"auto", padding:"12px 20px 40px" }}>
            <div style={{ fontFamily:F.ui, fontSize:12, color:th.appInk, marginBottom:10, lineHeight:1.5 }}>
              🔗 <b>Codice di condivisione</b> per {selIds.length} ricett{selIds.length===1?"a":"e"}. Invialo a chi vuoi (WhatsApp, email…): dal suo ricettario potrà importarle con "Importa da codice".
            </div>
            <textarea
              readOnly
              value={shareCode}
              onClick={e => e.target.select()}
              style={{ width:"100%", height:140, padding:"10px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:12, background:th.appCard, fontFamily:"monospace", fontSize:10, color:th.appInk, boxSizing:"border-box", resize:"none" }}
            />
            <button onClick={() => {
              if (navigator.clipboard?.writeText) navigator.clipboard.writeText(shareCode).catch(()=>{});
              setCopiedMsg("✓ Codice copiato!");
              setTimeout(() => setCopiedMsg(null), 2000);
            }} style={{ width:"100%", marginTop:10, padding:"13px", border:"none", borderRadius:12, background: copiedMsg ? "#6B8C6E" : th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {copiedMsg || "📋 Copia codice"}
            </button>
            <button onClick={() => setShareCode(null)} style={{ width:"100%", marginTop:8, padding:"11px", border:`1.5px solid ${th.appBorder}`, borderRadius:12, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>‹ Torna alla selezione</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, padding:"4px 20px 8px" }}>
              Seleziona una o più ricette, poi scegli dove copiarle.
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"0 18px 150px" }}>
              {activeRecipes.map(r => {
                const on = selIds.includes(r.id);
                return (
                  <button key={r.id} onClick={() => toggle(r.id)} style={{
                    width:"100%", display:"flex", alignItems:"center", gap:10,
                    background:th.appCard, border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
                    borderRadius:12, padding:"10px 12px", marginBottom:7, cursor:"pointer", textAlign:"left",
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:6, flexShrink:0,
                      border:`1.5px solid ${on ? th.appAccent : th.appBorder}`,
                      background: on ? th.appAccent : "transparent",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"#fff", fontSize:12,
                    }}>{on && "✓"}</div>
                    <div style={{ width:34, height:34, borderRadius:9, background:r.color, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>{r.emoji}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:F.display, fontSize:14, color:th.appInk, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.title}</div>
                      <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded }}>{r.category}</div>
                    </div>
                  </button>
                );
              })}
              {activeRecipes.length === 0 && (
                <div style={{ textAlign:"center", padding:"30px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>Nessuna ricetta in questo ricettario</div>
              )}
            </div>

            {/* Azioni fisse in basso */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 18px 20px", background:`linear-gradient(transparent, ${th.appBg} 25%)` }}>
              {copiedMsg && (
                <div style={{ textAlign:"center", fontFamily:F.ui, fontSize:12, color:"#6B8C6E", fontWeight:700, marginBottom:8 }}>{copiedMsg}</div>
              )}
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>
                Copia in un altro tuo ricettario
              </div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {otherBooks.map(b => (
                  <button key={b.id} disabled={selIds.length===0} onClick={() => {
                    onCopyRecipes(b.id, selIds);
                    setCopiedMsg(`✓ ${selIds.length} ricett${selIds.length===1?"a copiata":"e copiate"} in "${b.name}"`);
                    setSelIds([]);
                    setTimeout(() => setCopiedMsg(null), 2500);
                  }} style={{
                    padding:"9px 13px", borderRadius:11, border:"none",
                    background: selIds.length===0 ? th.appBorder : th.appAccent,
                    color: selIds.length===0 ? th.appFaded : "#fff",
                    fontFamily:F.ui, fontSize:12, fontWeight:700,
                    cursor: selIds.length===0 ? "default" : "pointer",
                  }}>📚 {b.name}</button>
                ))}
                {otherBooks.length === 0 && (
                  <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>crea prima un altro ricettario</div>
                )}
              </div>
              <button disabled={selIds.length===0} onClick={() => setShareCode(onExportCode(selIds))} style={{
                width:"100%", padding:"13px", borderRadius:12,
                border:`1.5px solid ${selIds.length===0 ? th.appBorder : th.appInk}`,
                background:"transparent",
                color: selIds.length===0 ? th.appFaded : th.appInk,
                fontFamily:F.ui, fontSize:13, fontWeight:700,
                cursor: selIds.length===0 ? "default" : "pointer",
              }}>🔗 Genera codice per esterni ({selIds.length})</button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ══ FASE LISTA RICETTARI ══
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      {nav}
      <div style={{ padding:"14px 20px 6px" }}>
        <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk }}>📚 I miei Ricettari</div>
        <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:3 }}>
          account: {me} <span style={{ opacity:0.6 }}>(simulato — arriverà dal login Google)</span>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"10px 18px 40px" }}>
        {books.map(b => {
          const active = b.id === activeBookId;
          const isRen = renaming === b.id;
          return (
            <div key={b.id} style={{
              background:th.appCard,
              border:`1.5px solid ${active ? th.appAccent : th.appBorder}`,
              borderRadius:14, padding:"12px 14px", marginBottom:10,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:20 }}>{b.type === "personale" ? "🔒" : "👥"}</span>
                {isRen ? (
                  <input
                    value={renameVal}
                    autoFocus
                    onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { onRename(b.id, renameVal.trim() || b.name); setRenaming(null); } if (e.key === "Escape") setRenaming(null); }}
                    style={{ flex:1, padding:"7px 10px", border:`1.5px solid ${th.appAccent}`, borderRadius:9, background:th.appBg, fontFamily:F.display, fontSize:15, color:th.appInk, outline:"none", minWidth:0 }}
                  />
                ) : (
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk }}>{b.name}</div>
                    <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded }}>
                      {b.type === "personale" ? "personale" : `condiviso · ${b.members.length} membri`}
                      {active && <span style={{ color:th.appAccent, fontWeight:700 }}> · attivo</span>}
                    </div>
                  </div>
                )}
                {isRen ? (
                  <button onClick={() => { onRename(b.id, renameVal.trim() || b.name); setRenaming(null); }} style={{ background:th.appAccent, border:"none", borderRadius:9, padding:"7px 11px", color:"#fff", fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>✓</button>
                ) : (
                  <button onClick={() => { setRenaming(b.id); setRenameVal(b.name); }} title="Rinomina" style={{ background:"none", border:"none", fontSize:15, cursor:"pointer", color:th.appFaded, flexShrink:0, padding:"4px 6px" }}>✏️</button>
                )}
                {!active && !isRen && (
                  <button onClick={() => onSwitch(b.id)} style={{ background:th.appInk, border:"none", borderRadius:9, padding:"8px 13px", color:"#fff", fontFamily:F.ui, fontSize:11, fontWeight:700, cursor:"pointer", flexShrink:0 }}>Apri</button>
                )}
              </div>

              {/* Predefinito all'avvio */}
              <button
                onClick={() => b.id !== defaultBookId && onSetDefault(b.id)}
                style={{
                  marginTop:8, background:"none", border:"none",
                  cursor: b.id === defaultBookId ? "default" : "pointer",
                  fontFamily:F.ui, fontSize:10.5, padding:0,
                  color: b.id === defaultBookId ? th.appAccent : th.appFaded,
                  display:"flex", alignItems:"center", gap:4,
                }}
              >
                {b.id === defaultBookId
                  ? <><span>⭐</span> Predefinito all'avvio dell'app</>
                  : <><span style={{ opacity:0.5 }}>☆</span> <span style={{ textDecoration:"underline", textUnderlineOffset:2 }}>Imposta come predefinito all'avvio</span></>}
              </button>

              {/* Membri (solo condivisi) */}
              {b.type === "condiviso" && (
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px dashed ${th.appBorder}` }}>
                  <div style={{ fontFamily:F.ui, fontSize:9, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>Membri (sincronizzati)</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:8 }}>
                    {b.members.map(m => (
                      <span key={m} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:F.ui, fontSize:10.5, color:th.appInk, background:th.appBg, border:`1px solid ${th.appBorder}`, borderRadius:14, padding:"4px 9px" }}>
                        {m}{m === b.owner && " 👑"}
                        {m !== b.owner && (
                          <button onClick={() => onRemoveMember(b.id, m)} style={{ background:"none", border:"none", color:"#C4593A", cursor:"pointer", fontSize:12, padding:0 }}>×</button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <input
                      value={memberInput[b.id] || ""}
                      onChange={e => setMemberInput(p => ({ ...p, [b.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") { onAddMember(b.id, memberInput[b.id] || ""); setMemberInput(p => ({ ...p, [b.id]: "" })); } }}
                      placeholder="email@esempio.it"
                      style={{ flex:1, padding:"8px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:9, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", minWidth:0 }}
                    />
                    <button onClick={() => { onAddMember(b.id, memberInput[b.id] || ""); setMemberInput(p => ({ ...p, [b.id]: "" })); }} style={{ background:th.appAccent, border:"none", borderRadius:9, padding:"8px 12px", color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>＋ Invita</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Crea nuovo condiviso */}
        {creating ? (
          <div style={{ background:th.appCard, border:`1.5px dashed ${th.appAccent}`, borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1, color:th.appFaded, textTransform:"uppercase", marginBottom:6 }}>Nuovo ricettario condiviso</div>
            <input
              value={newName}
              autoFocus
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome (es. Ricette di famiglia)"
              style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.body, fontSize:13, color:th.appInk, outline:"none", boxSizing:"border-box", marginBottom:8 }}
            />
            <input
              value={newEmails}
              onChange={e => setNewEmails(e.target.value)}
              placeholder="Email membri, separate da virgola (opzionale)"
              style={{ width:"100%", padding:"9px 12px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:F.body, fontSize:12, color:th.appInk, outline:"none", boxSizing:"border-box", marginBottom:10 }}
            />
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setCreating(false); setNewName(""); setNewEmails(""); }} style={{ flex:1, padding:"11px", border:`1.5px solid ${th.appBorder}`, borderRadius:11, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Annulla</button>
              <button onClick={() => {
                onCreate(newName, newEmails.split(",").map(s => s.trim().toLowerCase()).filter(Boolean));
                setCreating(false); setNewName(""); setNewEmails("");
              }} disabled={!newName.trim()} style={{ flex:2, padding:"11px", border:"none", borderRadius:11, background: newName.trim() ? th.appAccent : th.appBorder, color: newName.trim() ? "#fff" : th.appFaded, fontFamily:F.ui, fontSize:12, fontWeight:700, cursor: newName.trim() ? "pointer" : "default" }}>Crea ricettario</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setCreating(true)} style={{
            width:"100%", padding:"13px", borderRadius:14,
            border:`1.5px dashed ${th.appBorder}`, background:"transparent",
            color:th.appFaded, fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:10,
          }}>＋ Nuovo ricettario condiviso</button>
        )}

        {/* Azioni: trasferisci / importa */}
        <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${th.appBorder}` }}>
          <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", marginBottom:8, fontWeight:700 }}>Condivisione ricette</div>
          <button onClick={() => setPhase("transfer")} style={{
            width:"100%", padding:"13px", borderRadius:12, border:"none",
            background:th.appAccent, color:"#fff",
            fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:8,
          }}>📤 Esporta ricette da "{activeBook?.name}"</button>

          {importOpen ? (
            <div style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:12, padding:"12px" }}>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:8 }}>
                Incolla il codice ricevuto: le ricette verranno copiate in "{activeBook?.name}".
              </div>
              <textarea
                value={importVal}
                onChange={e => setImportVal(e.target.value)}
                placeholder="Incolla qui il codice…"
                style={{ width:"100%", height:80, padding:"9px 11px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:th.appBg, fontFamily:"monospace", fontSize:10, color:th.appInk, boxSizing:"border-box", resize:"none", marginBottom:8 }}
              />
              {importMsg && (
                <div style={{ fontFamily:F.ui, fontSize:11.5, fontWeight:700, color: importMsg.ok ? "#6B8C6E" : "#C4593A", marginBottom:8 }}>
                  {importMsg.ok ? `✓ ${importMsg.count} ricett${importMsg.count===1?"a importata":"e importate"}!` : "⚠ Codice non valido"}
                </div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => { setImportOpen(false); setImportVal(""); setImportMsg(null); }} style={{ flex:1, padding:"10px", border:`1.5px solid ${th.appBorder}`, borderRadius:10, background:"transparent", color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer" }}>Chiudi</button>
                <button onClick={() => {
                  const res = onImportCode(importVal);
                  setImportMsg(res);
                  if (res.ok) setImportVal("");
                }} disabled={!importVal.trim()} style={{ flex:2, padding:"10px", border:"none", borderRadius:10, background: importVal.trim() ? th.appInk : th.appBorder, color: importVal.trim() ? "#fff" : th.appFaded, fontFamily:F.ui, fontSize:12, fontWeight:700, cursor: importVal.trim() ? "pointer" : "default" }}>Importa</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setImportOpen(true)} style={{
              width:"100%", padding:"13px", borderRadius:12,
              border:`1.5px solid ${th.appInk}`, background:"transparent",
              color:th.appInk, fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer",
            }}>📥 Importa da codice</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// SCREEN: LANDING — choose what to do
// ══════════════════════════════════════════════════════════════
const LandingScreen = ({ recipes = [], bookName = "Il mio Ricettario", onBooks, onRecipes, onBook, onMemories, onAdd, onAddMemory, onFridge, onShopping, onOrganize, onTheme, onCover, onGuide }) => {
  const th = useTheme();

  const mainItems = [
    { emoji:"🍽️", label:"Libro Ricette",         desc:"Sfoglia, cerca e aggiungi",   fn:onRecipes, color:th.appAccent },
    { emoji:"📒", label:"Libro dei Ricordi",     desc:"Tutte le fotografie",         fn:onMemories,color:"#6B8C6E" },
    { emoji:"🧊", label:"Svuota Frigo",          desc:"Cosa cucino con ciò che ho",  fn:onFridge,  color:"#5B7FA6" },
    { emoji:"🛒", label:"Lista Spesa",           desc:"Gli ingredienti da comprare", fn:onShopping,color:"#8C6E4A" },
    { emoji:<OrganizeIcon/>, label:"Organizza Ingredienti", desc:"Aggregati, categorie, nutrizione", fn:onOrganize, color:"#7A5EA6" },
  ];

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>

      {/* Top row: copertina · info · stile — icone uniformi */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"8px 20px 0" }}>
        <button onClick={onCover} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
          <span style={{ width:26, height:26, borderRadius:7, background:th.appCard, border:`1.5px solid ${th.appBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, boxSizing:"border-box" }}>📕</span>
          <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>copertina</span>
        </button>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onGuide} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
            <span style={{ width:26, height:26, borderRadius:7, background:th.appCard, border:`1.5px solid ${th.appBorder}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, boxSizing:"border-box" }}>ℹ️</span>
            <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>info</span>
          </button>
          <button onClick={onTheme} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:0, width:44 }}>
            <span style={{ width:26, height:26, borderRadius:7, background:th.coverBg, border:`1.5px solid ${th.appBorder}`, display:"block", boxSizing:"border-box" }}/>
            <span style={{ fontFamily:F.ui, fontSize:8, color:th.appFaded }}>stile</span>
          </button>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign:"center", padding:"20px 24px 8px" }}>
        <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:3, color:th.appFaded, textTransform:"uppercase" }}>Il mio</div>
        <div style={{ fontFamily:F.display, fontSize:36, color:th.appInk, fontStyle:"italic" }}>Ricettario</div>
        {/* Selettore ricettario attivo */}
        <div style={{ marginTop:8 }}>
          <button onClick={onBooks} style={{
            background:th.appCard, border:`1.5px solid ${th.appBorder}`,
            borderRadius:20, padding:"7px 14px", cursor:"pointer",
            fontFamily:F.ui, fontSize:11, color:th.appInk,
            display:"inline-flex", alignItems:"center", gap:6,
            maxWidth:"88%",
          }}>
            📚 <span style={{ color:th.appFaded }}>Ricettario attivo:</span>
            <span style={{ fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{bookName}</span>
            <span style={{ color:th.appFaded }}>▾</span>
          </button>
        </div>
        {/* Sottotitolo: apri in modalità libro */}
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"10px 0" }}>
          <div style={{ flex:1, height:1, background:th.appBorder }}/>
          <span style={{ color:th.appAccent2, fontSize:12 }}>✦</span>
          <div style={{ flex:1, height:1, background:th.appBorder }}/>
        </div>
      </div>

      {/* Main navigation cards */}
      <div style={{ padding:"0 24px", display:"flex", flexDirection:"column", gap:12, flex:1 }}>
        {mainItems.map(item => (
          <button key={item.label} onClick={item.fn} style={{
            width:"100%", padding:"16px 18px",
            background:th.appCard, border:`1px solid ${th.appBorder}`,
            borderRadius:18, cursor:"pointer", textAlign:"left",
            display:"flex", alignItems:"center", gap:14,
            boxShadow:`0 2px 12px rgba(0,0,0,0.05)`,
          }}>
            <div style={{ width:48, height:48, borderRadius:13, background:item.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{item.emoji}</div>
            <div>
              <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, marginBottom:2 }}>{item.label}</div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded }}>{item.desc}</div>
            </div>
            <span style={{ marginLeft:"auto", color:th.appFaded, fontSize:18 }}>›</span>
          </button>
        ))}

      </div>

      <div style={{ height:32 }}/>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// COMPONENT: Top navbar for book/recipes view
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// COMPONENT: TopNav — reorganised with back-to-home always visible
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// COMPONENT: GlobalNav — unified nav bar used across all screens
// ══════════════════════════════════════════════════════════════
//
// Layout:
//   Row 1 (function buttons): 🍝 📖 📸 ✏️ 🖼  (5 main functions)
//   Row 2 (utility bar):      🏠 · active label · 🔍 ⭐
//
// Props:
//   activeScreen: "recipes"|"book"|"memories"|"addRecipe"|"addMemory"|null
//   onRecipes, onBook, onMemories, onAddRecipe, onAddMemory — nav callbacks
//   onLanding, onSearch, onFavorites — utility callbacks
//   showSearch, showFavorites — active states for utility buttons

// ══════════════════════════════════════════════════════════════
// SCREEN: RECIPES — list only, no book mode here
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// COMPONENT: RecipeFilterBar — barra filtri condivisa (schede + libro)
// Gestisce ricerca, sezioni, tag, preferiti; espone la lista filtrata
// tramite render-prop: <RecipeFilterBar ...>{(list) => (...)}</RecipeFilterBar>
// ══════════════════════════════════════════════════════════════
const RecipeFilterBar = ({ recipes, extraTagGroups = [], sectionList = MACRO_SECTIONS, compact = false, bookMode = false, renderNav = null, topAction = null, children }) => {
  const th = useTheme();
  const [activeSection, setActiveSection] = useState(null);
  const [activeTags, setActiveTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [openTagGroup, setOpenTagGroup] = useState(null);

  const goSection = (id) => {
    setActiveSection(id === activeSection ? null : id);
    setActiveTags([]);
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
            🏷 Filtra per tag
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
};

const RecipesScreen = ({ recipes, onRecipe, onLanding, onBook, onMemories, onAdd, onFridge, onShopping, extraTagGroups=[], sectionList=MACRO_SECTIONS }) => {
  const th = useTheme();
  const [activeSection, setActiveSection] = useState(null);
  const [activeTags, setActiveTags] = useState([]);
  const [openTagGroup, setOpenTagGroup] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const goSection = (id) => {
    setActiveSection(id === activeSection ? null : id);
    setActiveTags([]);
    setOpenTagGroup(null);
    setShowFavorites(false);
  };
  const goFavorites = () => setShowFavorites(f => !f);
  const toggleTag = (tag) => setActiveTags(prev =>
    prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]
  );

  // ── Hierarchical filter ──────────────────────────────────────
  // Level 1: section (macroSection)
  const sectionFiltered = activeSection
    ? recipes.filter(r => r.macroSection === activeSection)
    : recipes;

  // Level 2: tags (within section)
  const tagFiltered = activeTags.length > 0
    ? sectionFiltered.filter(r => activeTags.every(t => r.tags.includes(t)))
    : sectionFiltered;

  // Level 3: preferiti e ricerca (sempre attiva, combinabili)
  const favFiltered = showFavorites ? tagFiltered.filter(r => r.favorite) : tagFiltered;
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

  return (
    <div style={{ background:th.appBg, minHeight:"100%", position:"relative" }}>
      <GlobalNav
        activeScreen="recipes"
        onRecipes={() => {}}
        onBook={onBook}
        onMemories={onMemories}
        onAdd={onAdd}
        onFridge={onFridge}
        onShopping={onShopping}
        onLanding={onLanding}
        activeLabel={activeSection ? MACRO_SECTIONS.find(s=>s.id===activeSection)?.label : "Libro Ricette"}
      />

      {/* ── Pulsante nuova ricetta (in alto al centro, come nei Ricordi) ── */}
      <div style={{ padding:"10px 24px 2px", textAlign:"center" }}>
        <button onClick={() => onAdd("recipe")} title="Nuova ricetta" style={{
          padding:"9px 20px", borderRadius:20,
          background:th.appAccent, border:"none", cursor:"pointer",
          color:"#fff", fontFamily:F.ui, fontSize:12, fontWeight:700,
        }}>＋ Nuova ricetta</button>
      </div>

      {/* ── Ricerca sempre visibile (come nelle altre sezioni) ── */}
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

      {/* ── Level 1: Section filter pills ── */}
      <div style={{
        display:"flex", flexWrap:"wrap", gap:6, padding:"8px 16px 8px",
        borderBottom:`1px solid ${th.appBorder}`, flexShrink:0,
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

      {/* ── Level 2: Tag filter (accordion) ── */}
      <div style={{ borderBottom:`1px solid ${th.appBorder}`, flexShrink:0 }}>
        {/* Active tags summary row */}
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
            🏷 Filtra per tag
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
          <div style={{ padding:"0 16px 10px", maxHeight:240, overflowY:"auto" }}>
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

      {/* Results count */}
      <div style={{ padding:"6px 20px 2px", fontFamily:F.ui, fontSize:11, color:th.appFaded }}>
        {displayRecipes.length} ricett{displayRecipes.length===1?"a":"e"}
        {activeSection && ` · ${MACRO_SECTIONS.find(s=>s.id===activeSection)?.label}`}
        {activeTags.length > 0 && ` · ${activeTags.length} tag`}
        {showFavorites && " · ⭐ Preferiti"}
      </div>

      {/* Recipe list */}
      <div style={{ padding:"6px 20px 60px", display:"flex", flexDirection:"column", gap:10 }}>
        {displayRecipes.length === 0
          ? <div style={{ textAlign:"center", padding:"40px 0", color:th.appFaded, fontFamily:F.display, fontStyle:"italic" }}>
              Nessuna ricetta trovata
            </div>
          : displayRecipes.map(r => (
              <RecipeCardList key={r.id} recipe={r} onClick={() => onRecipe(r)}/>
            ))
        }
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// SCREEN: BOOK VIEW — page-turn animation between recipes
// ══════════════════════════════════════════════════════════════
const BookViewScreen = ({ recipes, onLanding, onRecipe, onRecipes, onMemories, onAdd, onFridge, onShopping, extraTagGroups=[], sectionList=MACRO_SECTIONS }) => {
  const th = useTheme();
  const [pageIndex, setPageIndex] = useState(0);
  const [turning, setTurning] = useState(null);

  return (
    <RecipeFilterBarBook
      recipes={recipes}
      extraTagGroups={extraTagGroups}
      sectionList={sectionList}
      pageIndex={pageIndex}
      setPageIndex={setPageIndex}
      turning={turning}
      setTurning={setTurning}
      onLanding={onLanding}
      onRecipe={onRecipe}
      onRecipes={onRecipes}
      onMemories={onMemories}
      onAdd={onAdd}
      onFridge={onFridge}
      onShopping={onShopping}
    />
  );
};

// Wrapper che usa RecipeFilterBar sopra la pagina del libro, restringendo le pagine sfogliabili al filtro
const RecipeFilterBarBook = ({ recipes, extraTagGroups, sectionList, pageIndex, setPageIndex, turning, setTurning, onLanding, onRecipe, onRecipes, onMemories, onAdd, onFridge, onShopping }) => {
  const th = useTheme();
  return (
    <RecipeFilterBar recipes={recipes} extraTagGroups={extraTagGroups} sectionList={sectionList} bookMode
      renderNav={() => (
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
          activeLabel="Libro Ricette"
        />
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
      {(sectionRecipes) => {
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
            ) : onlyFavorites ? (
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
    </div>
        );
      }}
    </RecipeFilterBar>
  );
};
const SearchScreen = ({ recipes, onBack, onRecipe }) => {
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
};

// ══════════════════════════════════════════════════════════════
// SCREEN: RECIPES VIEW — list with macro sections + favorites + search
// ══════════════════════════════════════════════════════════════

// R9 — Error boundary: se una schermata va in errore durante il disegno,
// mostra un messaggio con possibilità di ricaricare invece dello schermo bianco.
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, msg: "" }; }
  static getDerivedStateFromError(err) { return { hasError: true, msg: (err && err.message) || "Errore imprevisto" }; }
  componentDidCatch(err, info) { try { console.error("App error:", err, info); } catch (e) {} }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"system-ui, sans-serif", background:"#e8e4dc" }}>
          <div style={{ maxWidth:340, textAlign:"center", background:"#fff", borderRadius:16, padding:"28px 22px", boxShadow:"0 4px 20px rgba(0,0,0,0.12)" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🍳</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#3a3229", marginBottom:8 }}>Qualcosa è andato storto</div>
            <div style={{ fontSize:13, color:"#7A6E5F", lineHeight:1.5, marginBottom:18 }}>
              C'è stato un problema nel mostrare questa schermata. I tuoi dati sono al sicuro.
            </div>
            <button onClick={() => this.setState({ hasError:false, msg:"" })} style={{
              padding:"11px 22px", borderRadius:12, border:"none", background:"#C4593A",
              color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer",
            }}>Riprova</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const [screen, setScreen] = useState("cover");
  // screen: cover | landing | recipes | book | memories | recipe | new | edit | scan | theme
  const [selected, setSelected] = useState(null);
  const [scanDraft, setScanDraft] = useState(null); // draft precompilato da una scansione
  const [pendingShopUpdate, setPendingShopUpdate] = useState(null); // {updated} ricetta modificata già in lista spesa
  const [prevScreen, setPrevScreen] = useState("landing");
  const [recipes, setRecipes] = useState(RECIPES);
  const [bookTheme, setBookTheme] = useState(BOOK_THEMES[0]);
  // Custom tag groups added by user — shared across whole app
  const [extraTagGroups, setExtraTagGroups] = useState([]);

  const addTagGroup = (groupName) => {
    if (extraTagGroups.find(g => g.group === groupName)) return;
    setExtraTagGroups(prev => [...prev, { group:groupName, tags:[] }]);
  };

  const addTagToGroup = (groupName, tag) => {
    setExtraTagGroups(prev => prev.map(g =>
      g.group === groupName && !g.tags.includes(tag)
        ? { ...g, tags:[...g.tags, tag] }
        : g
    ));
  };

  // ── Sezioni del ricettario (modificabili: aggiunta con icona) ──
  const [sectionList, setSectionList] = useState(MACRO_SECTIONS);
  const addSection = (sec) => setSectionList(prev => sortSectionsAltroLast([...prev, sec]));
  const updateSection = (sec) => setSectionList(prev => sortSectionsAltroLast(prev.map(s => s.id === sec.id ? sec : s)));
  // Elimina sezione ("altro" è fissa): le ricette della sezione passano in "altro"
  const deleteSection = (id) => {
    if (id === "altro") return;
    setSectionList(prev => prev.filter(s => s.id !== id));
    setRecipes(prev => prev.map(r => r.macroSection === id ? { ...r, macroSection:"altro" } : r));
  };

  // ── Sistema ingredienti per Svuota Frigo (condiviso) ──
  // Lista delle categorie (modificabile: nome, icona, aggiunta, eliminazione)
  const [categoryList, setCategoryList] = useState(INGREDIENT_CATEGORIES);

  const saveCategory = (cat) => {
    setCategoryList(prev => {
      const exists = prev.find(c => c.id === cat.id);
      const next = exists ? prev.map(c => c.id === cat.id ? cat : c) : [...prev, cat];
      return sortCategoriesAltroLast(next);
    });
  };

  const deleteCategory = (id) => {
    if (id === "altro" || id === "base") return; // categorie fisse: non eliminabili
    setCategoryList(prev => prev.filter(c => c.id !== id));
    // Pulisci i riferimenti alla categoria eliminata
    setIngredientCategories(prev => {
      const next = {};
      Object.entries(prev).forEach(([name, cats]) => { next[name] = cats.filter(c => c !== id); });
      return next;
    });
    setAggregates(prev => prev.map(a => ({ ...a, categories: (a.categories||[]).filter(c => c !== id) })));
  };

  // ingredientCategories: { "<nomePulito>": ["base","grassi", ...] }
  const [ingredientCategories, setIngredientCategories] = useState({});
  // aggregates: [ { id, name, members:["zucchero di canna", ...], categories:[...] } ]
  const [aggregates, setAggregates] = useState([]);
  // sourceByIngredient: { [ingId]: ["ingredient", aggId, ...] } — ordine di
  // priorità delle fonti per l'ereditarietà (categorie/nutrizione/equivalenze).
  // Sparso: un'entry esiste solo per gli ingredienti su cui è stato
  // personalizzato; altrimenti il risolutore usa un ordine di default.
  const [sourceByIngredient, setSourceByIngredient] = useState({});

  const setIngredientCats = (name, cats) => {
    setIngredientCategories(prev => ({ ...prev, [name]: cats }));
  };

  const setIngredientSourcePriority = (ingId, priority) => {
    setSourceByIngredient(prev => ({ ...prev, [ingId]: priority }));
  };

  // equivalences: { "<nome>": { base:"g", factors:{ cucchiaio:10 }, display:"g"|"separate"|<unità> } }
  const [equivalences, setEquivalences] = useState(INITIAL_EQUIVALENCES);
  // nutritionMap: { "<nome>": { foodId } | { custom:{kcal,carb,...} } } — mappa ingrediente → voce database
  const [nutritionMap, setNutritionMap] = useState(INITIAL_NUTRITION_MAP);
  // customFoods: alimenti aggiunti dall'utente (fonte: personalizzata)
  const [customFoods, setCustomFoods] = useState([]);
  // R2 — dizionario ingredienti del libro attivo (id → nome visualizzato)
  const [ingredientDict, setIngredientDict] = useState(() => buildIngredientDict(RECIPES));
  useEffect(() => {
    setIngredientDict(d => buildIngredientDict(recipes, d));
  }, [recipes]);
  // Rinomina: aggiorna il nome nel dizionario E in tutte le ricette.
  // Le mappe keyed per id restano intatte. Ritorna false se il nome è già in uso.
  const renameIngredient = (ingId, newName) => {
    const clean = (newName || "").trim();
    if (!clean || !ingredientDict[ingId]) return false;
    const idx = ingDictIndex(ingredientDict);
    const existing = idx.get(normName(clean));
    if (existing && existing !== ingId) return false;
    const oldKey = normName(ingredientDict[ingId]);
    setIngredientDict(d => ({ ...d, [ingId]: clean }));
    setRecipes(prev => prev.map(r => ({
      ...r,
      ingredients: mapIngredientsStruct(r.ingredients, ing =>
        normName(ing.name) === oldKey ? { ...ing, name: clean } : ing),
    })));
    return true;
  };
  const saveCustomFood = (food) => {
    setCustomFoods(prev => {
      const exists = prev.some(f => f.id === food.id);
      return exists ? prev.map(f => f.id === food.id ? food : f) : [...prev, food];
    });
  };
  const deleteCustomFood = (id) => setCustomFoods(prev => prev.filter(f => f.id !== id));
  const saveNutritionMapping = (name, mapping) => {
    setNutritionMap(prev => {
      const next = { ...prev };
      if (mapping) next[name] = mapping; else delete next[name];
      return next;
    });
  };
  const saveEquivalence = (name, eq) => {
    setEquivalences(prev => ({ ...prev, [name]: eq }));
  };

  const saveAggregate = (agg) => {
    setAggregates(prev => {
      const exists = prev.find(a => a.id === agg.id);
      if (exists) return prev.map(a => a.id === agg.id ? agg : a);
      return [...prev, agg];
    });
  };

  const deleteAggregate = (id) => {
    setAggregates(prev => prev.filter(a => a.id !== id));
  };

  // ── Lista Spesa globale ──
  // entries: [{ id, recipeId, recipeTitle, scaleLabel, items:[{text, original}] }]
  const [shoppingList, setShoppingList] = useState([]);

  const addToShoppingList = (recipe, scale, items) => {
    setShoppingList(prev => [...prev, {
      id: uid("r"),
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      scaleLabel: scale?.label || "dosi originali",
      factor: scale?.factor ?? 1,              // R6: memorizza la scala per poter ricalcolare
      selectedNames: items.map(it => normName(it.ing.name)), // quali ingredienti erano scelti
      items: items.map(it => ({ ...it.ing })), // { name, qty (scalata), unit, note? }
    }]);
  };

  // R6 — ricalcola le voci di un'entry dalla ricetta corrente × fattore salvato,
  // mantenendo solo gli ingredienti che erano stati selezionati (per nome).
  const recomputeEntry = (entry, recipe) => {
    const sel = new Set(entry.selectedNames || []);
    const items = flattenIngredients(recipe.ingredients)
      .filter(ing => sel.size === 0 || sel.has(normName(ing.name)))
      .map(ing => ({ ...scaleIngredient(ing, entry.factor ?? 1) }));
    return { ...entry, recipeTitle: recipe.title, items };
  };

  const removeShoppingEntry = (id) => setShoppingList(prev => prev.filter(e => e.id !== id));
  // Rimuove un singolo ingrediente da una entry (se l'entry resta vuota, la elimina)
  const removeShoppingItem = (entryId, ingName) => {
    const key = normName(ingName);
    setShoppingList(prev => prev.flatMap(e => {
      if (e.id !== entryId) return [e];
      const items = e.items.filter(it => normName(it.name) !== key);
      if (items.length === 0) return []; // entry svuotata → via
      return [{ ...e, items, selectedNames: (e.selectedNames || []).filter(n => n !== key) }];
    }));
  };
  const removeShoppingRecipe = (recipeId) => setShoppingList(prev => prev.filter(e => e.recipeId !== recipeId));
  const clearShoppingList = () => setShoppingList([]);

  // ══ Multi-ricettario (simulato: nella PWA sarà su Firestore) ══
  const ME = "tu@esempio.it"; // utente simulato — nella PWA arriverà dal login Google
  const emptyBookData = () => ({
    recipes: [], extraTagGroups: [],
    sectionList: MACRO_SECTIONS, categoryList: INGREDIENT_CATEGORIES,
    ingredientCategories: {}, aggregates: [], shoppingList: [], equivalences: {}, nutritionMap: {}, customFoods: [], ingredientDict: {}, sourceByIngredient: {},
  });
  // data:null per il libro attivo = i dati vivono negli stati correnti
  const [books, setBooks] = useState([
    { id:"b1", name:"Il mio Ricettario", type:"personale", owner:ME, members:[ME], data:null },
  ]);
  // Ricettario predefinito: quello caricato all'avvio dell'app
  // (nella PWA sarà salvato nel profilo utente su Firestore)
  const [defaultBookId, setDefaultBookId] = useState("b1");
  const [activeBookId, setActiveBookId] = useState("b1"); // all'avvio = predefinito
  const activeBook = books.find(b => b.id === activeBookId);

  const snapshotData = () => ({
    recipes, extraTagGroups, sectionList, categoryList,
    ingredientCategories, aggregates, shoppingList, equivalences, nutritionMap, customFoods, ingredientDict, sourceByIngredient,
  });
  const loadData = (d) => {
    setRecipes(d.recipes); setExtraTagGroups(d.extraTagGroups);
    setSectionList(d.sectionList); setCategoryList(d.categoryList);
    setIngredientCategories(d.ingredientCategories); setAggregates(d.aggregates);
    setShoppingList(d.shoppingList); setEquivalences(d.equivalences || {});
    setNutritionMap(d.nutritionMap || {});
    setCustomFoods(d.customFoods || []);
    setIngredientDict(d.ingredientDict || {});
    setSourceByIngredient(d.sourceByIngredient || {});
  };

  const switchBook = (id) => {
    if (id === activeBookId) return;
    const target = books.find(b => b.id === id);
    if (!target) return;
    // salva lo stato corrente nel libro che lascio, carica quello nuovo
    setBooks(prev => prev.map(b =>
      b.id === activeBookId ? { ...b, data: snapshotData() } :
      b.id === id ? { ...b, data: null } : b
    ));
    loadData(target.data || emptyBookData());
    setActiveBookId(id);
    setSelected(null);
  };

  const createBook = (name, memberEmails) => {
    const id = uid("b");
    const members = [ME, ...memberEmails.filter(e => e && e !== ME)];
    setBooks(prev => [...prev, { id, name: name.trim() || "Nuovo ricettario", type:"condiviso", owner:ME, members, data: emptyBookData() }]);
  };

  const renameBook = (id, name) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, name } : b));
  };

  const addMember = (id, email) => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@")) return;
    setBooks(prev => prev.map(b =>
      b.id === id && !b.members.includes(e) ? { ...b, members:[...b.members, e] } : b
    ));
  };

  const removeMember = (id, email) => {
    setBooks(prev => prev.map(b =>
      b.id === id && email !== b.owner ? { ...b, members: b.members.filter(m => m !== email) } : b
    ));
  };

  // Copia ricette (per id) dal libro ATTIVO verso un altro libro — copie indipendenti
  const copyRecipesToBook = (targetId, recipeIds) => {
    const sel = recipes.filter(r => recipeIds.includes(r.id));
    if (sel.length === 0 || targetId === activeBookId) return;
    const copies = sel.map((r) => ({ ...r, id: uid("r"), memories:[], comments:[], favorite:false }));
    setBooks(prev => prev.map(b => {
      if (b.id !== targetId) return b;
      const d = b.data || emptyBookData();
      return { ...b, data: { ...d, recipes:[...d.recipes, ...copies] } };
    }));
  };

  // ── Condivisione esterna: codice testuale copiabile (import/export reale) ──
  const exportShareCode = (recipeIds) => {
    const sel = recipes.filter(r => recipeIds.includes(r.id))
      .map(({ memories, comments, favorite, ...rest }) => rest); // solo la ricetta
    const json = JSON.stringify({ v:2, recipes: sel });
    return btoa(unescape(encodeURIComponent(json)));
  };

  // Esporta PDF di una o più ricette (per id)
  const exportRecipesPDFByIds = (recipeIds) => {
    const sel = recipes.filter(r => recipeIds.includes(r.id));
    if (sel.length === 1) { exportRecipePDF(sel[0]); }
    else if (sel.length > 1) { exportBookPDF(sel, sectionList); }
  };

  const importShareCode = (code) => {
    try {
      const json = decodeURIComponent(escape(atob(code.trim())));
      const parsed = JSON.parse(json);
      if (!parsed || !Array.isArray(parsed.recipes)) return { ok:false };
      // Conversione legacy v1: ingredienti stringa → oggetti {name, qty, unit}
      const legacyToObj = (it) => {
        if (typeof it !== "string") return it;
        const d = decomposeIngredient(it);
        const n = parseFloat((d.qty || "").replace(",", "."));
        return { name: d.name.trim(), qty: isNaN(n) ? null : n, unit: (d.unit || "").trim() };
      };
      const convIngs = (ings) => !Array.isArray(ings) ? [] :
        (ings.length > 0 && typeof ings[0] === "object" && "section" in ings[0])
          ? ings.map(s => ({ ...s, items: (s.items || []).map(legacyToObj) }))
          : ings.map(legacyToObj);
      const copies = parsed.recipes.map((r, i) => ({
        ...r, id: uid("r"), memories:[], comments:[], favorite:false,
        macroSection: r.macroSection || "altro",
        ingredients: convIngs(r.ingredients),
      }));
      setRecipes(prev => [...prev, ...copies]);
      return { ok:true, count: copies.length };
    } catch {
      return { ok:false };
    }
  };

  const goTo = (s) => { setPrevScreen(screen); setScreen(s); };

  const updateRecipe = (updated) => {
    setRecipes(prev => prev.map(r => r.id===updated.id ? updated : r));
    setSelected(updated);
    // R6: se la ricetta è nella lista spesa, chiedi cosa fare
    if (shoppingList.some(e => e.recipeId === updated.id)) {
      setPendingShopUpdate({ updated });
    }
  };
  // Applica la scelta del dialogo R6
  const resolveShopUpdate = (action) => {
    const upd = pendingShopUpdate?.updated;
    if (upd) {
      if (action === "update") {
        setShoppingList(prev => prev.map(e => e.recipeId === upd.id ? recomputeEntry(e, upd) : e));
      } else if (action === "remove") {
        setShoppingList(prev => prev.filter(e => e.recipeId !== upd.id));
      } // "keep" = non tocca nulla
    }
    setPendingShopUpdate(null);
  };


  // Normalizza gli ingredienti del form: qty stringa → numero|null, scarta righe senza nome
  const normalizeIngredients = (ings) => {
    const normOne = (it) => {
      if (typeof it === "string") return null; // legacy, non dovrebbe accadere
      const name = (it.name || "").trim();
      if (!name) return null;
      let qty = it.qty;
      if (typeof qty === "string") {
        const n = parseFloat(qty.replace(",", "."));
        qty = isNaN(n) ? null : n;
      }
      const out = { name, qty: qty ?? null, unit: (it.unit || "").trim() };
      if (it.note) out.note = it.note;
      // Percentuale che concorre ai valori nutrizionali (es. olio da frittura ~10%)
      let pct = it.nutriPct;
      if (typeof pct === "string") { const p = parseFloat(pct.replace(",", ".")); pct = isNaN(p) ? null : p; }
      if (typeof pct === "number" && pct >= 0 && pct < 100) out.nutriPct = Math.round(pct * 10) / 10;
      return out;
    };
    if (isSectioned(ings)) {
      return ings.map(sec => ({ ...sec, items: sec.items.map(normOne).filter(Boolean) }))
                 .filter(sec => sec.items.length > 0 || sec.section);
    }
    return (ings || []).map(normOne).filter(Boolean);
  };

  const saveNewRecipe = (draft) => {
    const newR = {
      ...draft,
      id: uid("r"),
      macroSection: draft.macroSection || "altro",
      favorite: false,
      sourceUrl: draft.sourceUrl || "",
      category: draft.tags[0] || "Altro",
      ingredients: normalizeIngredients(draft.ingredients),
      // sectioned-aware, come normalizeIngredients: ripulisce gli item di
      // ciascuna sottosezione (mai il wrapper), scarta le sezioni rimaste vuote
      steps: isSectioned(draft.steps)
        ? draft.steps
            .map(sec => ({ ...sec, items: sec.items.map(stripPhotolessStep).filter(s => s.trim ? s.trim() : s) }))
            .filter(sec => sec.items.length > 0 || sec.section)
        : draft.steps.map(stripPhotolessStep).filter(s => s.trim ? s.trim() : s),
      memories: [],
      comments: [],
    };
    setRecipes(prev => [...prev, newR]);
    setSelected(newR);
    setScreen("recipe");
  };

  // Dopo la scansione: NON salva subito, ma apre il form manuale precompilato
  // con i dati letti dalla foto, così si possono correggere prima di salvare.
  const saveScanned = (name, tags, ocrData, emoji, color, macroSection) => {
    setScanDraft({
      title: name || ocrData?.title || "",
      source: "", prepTime: ocrData?.prepTime || 0, cookTime: ocrData?.cookTime || 0,
      servings: ocrData?.servings || 4,
      note: ocrData?.note || "",
      ingredients: (ocrData?.ingredients && ocrData.ingredients.length) ? ocrData.ingredients : [{ name:"", qty:"", unit:"" }],
      steps: (ocrData?.steps && ocrData.steps.length) ? ocrData.steps : [""],
      tags: tags.length ? tags : [],
      color: color || "#6B8C6E",
      emoji: emoji || "🍝",
      dishPhoto: null,
      macroSection: macroSection || "altro",
    });
    setScreen("new");
  };

  const currentRecipe = selected ? recipes.find(r=>r.id===selected.id) : null;

  const deleteRecipe = (id) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    setSelected(null);
    setScreen(prevScreen === "recipe" ? "recipes" : prevScreen);
  };

  const addMemory = (mem) => {
    // mem.recipeIds = array of recipe ids to link
    const memId = uid("mem");
    setRecipes(prev => prev.map(r => {
      if (!(mem.recipeIds||[]).includes(r.id)) return r;
      const newMem = { ...mem, id:memId };
      return { ...r, memories: [...(r.memories||[]), newMem] };
    }));
  };

  const deleteMemory = (memId) => {
    setRecipes(prev => prev.map(r => {
      if (r.id !== selected?.id) return r;
      return { ...r, memories: (r.memories||[]).filter(m => m.id !== memId) };
    }));
  };

  const openRecipe = (r) => { setSelected(r); setPrevScreen(screen); setScreen("recipe"); };

  return (
    <ThemeCtx.Provider value={bookTheme}>
    <NavCtx.Provider value={{ onOrganize: () => goTo("organize") }}>
    <div style={{
      minHeight:"100vh",
      background:`radial-gradient(ellipse at 60% 20%, ${bookTheme.appCard} 0%, ${bookTheme.appBorder} 100%)`,
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 20px", gap:20,
      transition:"background 0.4s",
    }}>
      <div style={{ textAlign:"center", color:bookTheme.appInk }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:26, marginBottom:4 }}>Il mio Ricettario</div>
        <div style={{ fontFamily:"sans-serif", fontSize:12, opacity:0.6 }}>Prototipo v17 · tocca la copertina per entrare</div>
      </div>

      <IPhone>
        {screen==="cover" && (
          <CoverScreen onEnter={() => setScreen("landing")}/>
        )}
        {screen==="guide" && (
          <GuideScreen onBack={() => setScreen(prevScreen === "guide" ? "landing" : prevScreen)}/>
        )}

        {screen==="landing" && (
          <LandingScreen
            recipes={recipes}
            bookName={activeBook?.name}
            onBooks={() => goTo("books")}
            onOrganize={() => goTo("organize")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => goTo(type==="memory" ? "addMemory" : "addRecipeHub")}
            onScan={() => goTo("scan")}
            onAddMemory={() => goTo("addMemory")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
            onTheme={() => goTo("theme")}
            onCover={() => setScreen("cover")}
            onGuide={() => goTo("guide")}
          />
        )}
        {screen==="organize" && (
          <OrganizeIngredientsScreen
            ingredientDict={ingredientDict}
            onRenameIngredient={renameIngredient}
            nav={
              <GlobalNav
                activeScreen="organize"
                onRecipes={() => setScreen("recipes")}
                onBook={() => setScreen("book")}
                onMemories={() => setScreen("memories")}
                onAdd={(type) => goTo(type==="memory" ? "addMemory" : "addRecipeHub")}
                onFridge={() => setScreen("fridge")}
                onShopping={() => setScreen("shoppingList")}
                onLanding={() => setScreen("landing")}
                onSearch={() => {}}
                onFavorites={() => {}}
                showSearch={false}
                showFavorites={false}
                activeLabel="Organizza Ingredienti"
              />
            }
            recipes={recipes}
            aggregates={aggregates}
            sourceByIngredient={sourceByIngredient}
            onSetSourcePriority={setIngredientSourcePriority}
            ingredientCategories={ingredientCategories}
            onSetIngredientCats={setIngredientCats}
            onSaveAggregate={saveAggregate}
            onDeleteAggregate={deleteAggregate}
            categoryList={categoryList}
            onSaveCategory={saveCategory}
            onDeleteCategory={deleteCategory}
            equivalences={equivalences}
            onSaveEquivalence={saveEquivalence}
            nutritionMap={nutritionMap}
            onSaveNutritionMapping={saveNutritionMapping}
            customFoods={customFoods}
            onSaveCustomFood={saveCustomFood}
            onDeleteCustomFood={deleteCustomFood}
            onBack={() => setScreen("landing")}
          />
        )}
        {screen==="books" && (
          <BooksScreen
            books={books}
            activeBookId={activeBookId}
            me={ME}
            activeRecipes={recipes}
            onSwitch={(id) => { switchBook(id); setScreen("landing"); }}
            onCreate={createBook}
            onRename={renameBook}
            onAddMember={addMember}
            onRemoveMember={removeMember}
            onCopyRecipes={copyRecipesToBook}
            onExportCode={exportShareCode}
            onImportCode={importShareCode}
            defaultBookId={defaultBookId}
            onSetDefault={setDefaultBookId}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => goTo(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="shoppingList" && (
          <ShoppingListScreen
            entries={shoppingList}
            aggregates={aggregates}
            equivalences={equivalences}
            ingredientDict={ingredientDict}
            onRemoveEntry={removeShoppingEntry}
            onRemoveRecipe={removeShoppingRecipe}
            onRemoveItem={removeShoppingItem}
            onClearAll={clearShoppingList}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => goTo(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="fridge" && (
          <EmptyFridgeScreen
            recipes={recipes}
            sectionList={sectionList}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => goTo(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
            onStartCooking={(r) => { setSelected(r); setPrevScreen("fridge"); setScreen("recipe"); }}
            onAddToShoppingList={addToShoppingList}
            extraTagGroups={extraTagGroups}
            aggregates={aggregates}
            ingredientCategories={ingredientCategories}
            categoryList={categoryList}
            ingredientDict={ingredientDict}
          />
        )}
        {screen==="recipes" && (
          <RecipesScreen
            recipes={recipes}
            sectionList={sectionList}
            onRecipe={openRecipe}
            onLanding={() => setScreen("landing")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => goTo(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
            extraTagGroups={extraTagGroups}
          />
        )}
        {screen==="book" && (
          <BookViewScreen
            recipes={recipes}
            sectionList={sectionList}
            extraTagGroups={extraTagGroups}
            onLanding={() => setScreen("landing")}
            onRecipe={openRecipe}
            onRecipes={() => setScreen("recipes")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => goTo(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="memories" && (
          <MemoriesBookScreen
            recipes={recipes}
            onBack={() => setScreen("landing")}
            onRecipe={openRecipe}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onAdd={(type) => goTo(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="theme" && (
          <ThemePickerScreen
            onBack={() => setScreen(prevScreen)}
            onSelect={(t) => { setBookTheme(t); setScreen("cover"); }}
          />
        )}
        {screen==="addRecipeHub" && (
          <AddRecipeHubScreen
            onManual={() => setScreen("new")}
            onScan={() => setScreen("scan")}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => setScreen(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="new" && (
          <NewRecipeScreen
            onBack={() => { setScanDraft(null); setScreen("addRecipeHub"); }}
            onSave={(d) => { setScanDraft(null); saveNewRecipe(d); }}
            initialDraft={scanDraft}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => setScreen(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
            extraTagGroups={extraTagGroups}
            onAddGroup={addTagGroup}
            onAddTagToGroup={addTagToGroup}
            sectionList={sectionList}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            allRecipes={recipes}
          />
        )}
        {screen==="addMemory" && (
          <AddMemoryScreen
            recipes={recipes}
            onBack={() => setScreen(prevScreen)}
            onSave={(mem) => { addMemory(mem); setScreen(prevScreen); }}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => setScreen(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="recipe" && currentRecipe && (
          <RecipeScreen
            recipe={currentRecipe}
            nutritionMap={nutritionMap}
            equivalences={equivalences}
            customFoods={customFoods}
            ingredientDict={ingredientDict}
            aggregates={aggregates}
            sourceByIngredient={sourceByIngredient}
            onBack={() => setScreen(prevScreen === "recipe" ? "recipes" : prevScreen)}
            onUpdate={updateRecipe}
            onEdit={() => goTo("edit")}
            onDelete={deleteRecipe}
            onDeleteMemory={deleteMemory}
            onAddToShoppingList={addToShoppingList}
            allRecipes={recipes}
            sectionList={sectionList}
            onExportPDF={exportRecipesPDFByIds}
            onExportCode={exportShareCode}
          />
        )}
        {screen==="edit" && currentRecipe && (
          <EditScreen
            recipe={currentRecipe}
            onBack={() => setScreen("recipe")}
            onSave={(updated) => { updateRecipe({ ...updated, ingredients: normalizeIngredients(updated.ingredients) }); setScreen("recipe"); }}
            extraTagGroups={extraTagGroups}
            onAddGroup={addTagGroup}
            onAddTagToGroup={addTagToGroup}
            sectionList={sectionList}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            allRecipes={recipes}
          />
        )}
        {screen==="scan" && (
          <ScanScreen
            onBack={() => setScreen("addRecipeHub")}
            onSave={saveScanned}
            sectionList={sectionList}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => setScreen(type==="memory" ? "addMemory" : "addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}

        {/* R6 — Dialogo: ricetta modificata già in lista spesa */}
        {pendingShopUpdate && (() => {
          const upd = pendingShopUpdate.updated;
          const entry = shoppingList.find(e => e.recipeId === upd.id);
          const th = bookTheme;
          return (
            <div style={{ position:"absolute", inset:0, zIndex:500, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <div style={{ width:"100%", background:th.appBg, borderRadius:20, padding:"22px 20px", textAlign:"center", maxHeight:"90%", overflowY:"auto" }}>
                <div style={{ fontSize:32, marginBottom:6 }}>🛒</div>
                <div style={{ fontFamily:F.display, fontSize:19, color:th.appInk, marginBottom:6 }}>Ricetta già nella lista spesa</div>
                <div style={{ fontFamily:F.ui, fontSize:12.5, color:th.appFaded, lineHeight:1.5, marginBottom:18 }}>
                  Hai modificato <b style={{ color:th.appInk }}>{upd.title}</b>, che è nella tua lista spesa{entry?.scaleLabel ? ` (${entry.scaleLabel})` : ""}. Cosa vuoi fare?
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
                  <button onClick={() => resolveShopUpdate("update")} style={{
                    padding:"13px", borderRadius:12, border:"none", background:th.appAccent,
                    color:"#fff", fontFamily:F.ui, fontSize:13, fontWeight:700, cursor:"pointer",
                  }}>🔄 Aggiorna le quantità nella spesa</button>
                  <button onClick={() => resolveShopUpdate("keep")} style={{
                    padding:"13px", borderRadius:12, border:`1.5px solid ${th.appBorder}`, background:"transparent",
                    color:th.appInk, fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer",
                  }}>📌 Mantieni le vecchie quantità</button>
                  <button onClick={() => resolveShopUpdate("remove")} style={{
                    padding:"13px", borderRadius:12, border:"none", background:"transparent",
                    color:"#C0392B", fontFamily:F.ui, fontSize:12.5, fontWeight:600, cursor:"pointer",
                  }}>🗑 Rimuovi dalla lista spesa</button>
                </div>
              </div>
            </div>
          );
        })()}
      </IPhone>

      <div style={{ display:"flex", gap:16, color:bookTheme.appFaded, fontFamily:"sans-serif", fontSize:12, flexWrap:"wrap", justifyContent:"center" }}>
        <span>📕 Tocca la copertina</span>
        <span>🍝 Ricette · 📖 Libro · 📸 Ricordi</span>
        <span>🔍 Cerca · ⭐ Preferiti · 🎨 Temi</span>
      </div>
    </div>
    </NavCtx.Provider>
    </ThemeCtx.Provider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner/>
    </ErrorBoundary>
  );
}
