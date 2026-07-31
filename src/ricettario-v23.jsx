import React, { useState, useRef, useEffect } from "react";
import {
  sortSectionsAltroLast, sortCategoriesAltroLast,
  isSectioned, toSectioned, fromSectioned, stripPhotolessStep, stepPhotosOf,
  stepNumbers, stepNumberLabel, dishPhotoOf, readImageFile,
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
import ScanScreen from "./screens/ScanScreen.jsx";
import AddFromLinkScreen from "./screens/AddFromLinkScreen.jsx";
import EditScreen from "./screens/EditScreen.jsx";
import NutritionCard from "./components/NutritionCard.jsx";
import ExportFlow from "./components/ExportFlow.jsx";
import MemoriesSection from "./components/MemoriesSection.jsx";
import BookPageView from "./components/BookPageView.jsx";
import IngredientsView from "./components/IngredientsView.jsx";
import StepsView from "./components/StepsView.jsx";
import RecipeScreen from "./screens/RecipeScreen.jsx";
import CoverScreen from "./screens/CoverScreen.jsx";
import ThemePickerScreen from "./screens/ThemePickerScreen.jsx";
import LandingScreen from "./screens/LandingScreen.jsx";
import SearchScreen from "./screens/SearchScreen.jsx";

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
// SCREEN: HOME
// ══════════════════════════════════════════════════════════════


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

  // Steps carry {text, photos}; section markers use {section:true}
  const flatSteps = isSec(recipe.steps)
    ? recipe.steps.flatMap(s => {
        const items = s.items.map(st => ({ text: typeof st === "string" ? st : st.text, photos: stepPhotosOf(st) }));
        return s.section ? [{ sectionLabel: s.section }, ...items] : items;
      })
    : recipe.steps.map(st => ({ text: typeof st === "string" ? st : st.text, photos: stepPhotosOf(st) }));

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
  .step-content { flex: 1; }
  .step-t { font-size: 13px; line-height: 1.65; }
  .divider { text-align: center; color: #B8973A; margin: 20px 0; font-size: 16px; }
  .dish-photo { width: 200px; height: 150px; margin: 0 auto 18px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fafaf8; }
  .dish-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .step-photos { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
  .step-photo { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>${recipe.title}</h1>
  ${recipe.source ? `<div class="source">Ricetta di ${recipe.source}</div>` : ""}
  ${dishPhotoOf(recipe) ? `<div class="dish-photo"><img src="${dishPhotoOf(recipe)}" alt="${recipe.title}"></div>` : ""}
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
      : `<div class="step"><div class="step-n">${++n}</div><div class="step-content"><div class="step-t">${step.text}</div>${step.photos && step.photos.length > 0 ? `<div class="step-photos">${step.photos.map(p => `<img class="step-photo" src="${p}" alt="">`).join("")}</div>` : ""}</div></div>`
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
          const items = s.items.map(st => ({ text: typeof st === "string" ? st : st.text, photos: stepPhotosOf(st) }));
          return s.section ? [{ sectionLabel: s.section }, ...items] : items;
        })
      : recipe.steps.map(st => ({ text: typeof st === "string" ? st : st.text, photos: stepPhotosOf(st) }));
    let n = 0;
    return `
  <div class="recipe">
    <h1>${recipe.title}</h1>
    ${recipe.source ? `<div class="source">Ricetta di ${recipe.source}</div>` : ""}
    ${dishPhotoOf(recipe) ? `<div class="dish-photo"><img src="${dishPhotoOf(recipe)}" alt="${recipe.title}"></div>` : ""}
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
      : `<div class="step"><div class="step-n">${++n}</div><div class="step-content"><div class="step-t">${step.text}</div>${step.photos && step.photos.length > 0 ? `<div class="step-photos">${step.photos.map(p => `<img class="step-photo" src="${p}" alt="">`).join("")}</div>` : ""}</div></div>`
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
  .dish-photo { width: 170px; height: 128px; margin: 0 auto 14px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fafaf8; }
  .dish-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .meta { display: flex; justify-content: center; gap: 20px; font-size: 12px; color: #555; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 7px 0; margin-bottom: 14px; }
  .note { border: 1px solid #ccc; padding: 9px 13px; font-style: italic; font-size: 12.5px; color: #555; margin-bottom: 14px; background: #fafaf8; }
  h2 { font-size: 14px; text-align: center; letter-spacing: 2px; text-transform: uppercase; margin: 16px 0 9px; color: #333; }
  .ing { font-size: 12.5px; line-height: 1.85; border-bottom: 1px solid #eee; padding: 2px 0; }
  .section-label { font-size: 10.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #8B4520; margin: 9px 0 4px; }
  .step { display: flex; gap: 11px; margin-bottom: 11px; }
  .step-n { width: 22px; height: 22px; border-radius: 50%; background: #8B4520; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: bold; flex-shrink: 0; margin-top: 2px; font-family: sans-serif; }
  .step-content { flex: 1; }
  .step-t { font-size: 12.5px; line-height: 1.6; }
  .step-photos { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; }
  .step-photo { width: 50px; height: 50px; object-fit: cover; border-radius: 5px; border: 1px solid #ddd; }
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

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════

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
            onBack={() => setScreen(prevScreen)}
            onManual={() => setScreen("new")}
            onScan={() => setScreen("scan")}
            onLink={() => setScreen("addFromLink")}
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
        {screen==="addFromLink" && (
          <AddFromLinkScreen onBack={() => setScreen("addRecipeHub")}/>
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
