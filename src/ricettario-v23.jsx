import React, { useState, useRef, useEffect } from "react";
import {
  sortSectionsAltroLast, sortCategoriesBaseFirst,
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
import { effectiveNutritionKey, findSimilarIngredients } from "./utils/aggregates.js";
import { loadFullBook, saveFullBook, createBookInFirestore, saveRecipe } from "./services/bookStore.js";
import AuthGate from "./components/AuthGate.jsx";
import {
  T, F, MACRO_SECTIONS, PICKER_EMOJIS, INGREDIENT_CATEGORIES,
  TAG_GROUPS, ALL_PRESET_TAGS, BOOK_THEMES,
  EMOJI_CATEGORIES, EMOJI_OPTIONS, COLOR_OPTIONS, DEFAULT_UNIT_SUGGESTIONS,
} from "./data/constants.js";
import { NUTRITION_DB, NUTRIENT_LABELS } from "./data/nutrition.js";
import { ThemeCtx, useTheme, NavCtx, useNavActions, RoleCtx } from "./context.js";
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
import OrganizeIngredientsScreen, { SHOPPING_SOURCE } from "./screens/OrganizeIngredientsScreen.jsx";
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
import RecipesScreen from "./screens/RecipesScreen.jsx";
import AddMemoryScreen from "./screens/AddMemoryScreen.jsx";
import BooksScreen from "./screens/BooksScreen.jsx";
import BookViewScreen from "./screens/BookViewScreen.jsx";
import AdminUsersScreen from "./screens/AdminUsersScreen.jsx";
import BetaButton from "./components/BetaButton.jsx";

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
    <BetaButton/>
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
  .step-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
  .step-photo { width: 100%; height: 160px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; }
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
  .step-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 7px; }
  .step-photo { width: 100%; height: 140px; object-fit: cover; border-radius: 7px; border: 1px solid #ddd; }
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


// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════


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

function AppInner({ me, role }) {
  const [screen, setScreen] = useState("cover");
  // screen: cover | landing | recipes | book | memories | recipe | new | edit | scan | theme
  const [selected, setSelected] = useState(null);
  const [memoryPrefillRecipeId, setMemoryPrefillRecipeId] = useState(null);
  const [organizeFilter, setOrganizeFilter] = useState({ recipeId:null, alertTypes:null, manageAggs:false, manageCats:false, aggScope:"all" });
  // Schermata da cui si è entrati in Organizza Ingredienti (qualunque punto
  // d'ingresso: icona di navigazione globale, banner di una schermata, link
  // diretto a una sotto-schermata) — usata dai tasti "Indietro" per tornare
  // davvero da dove si è partiti, invece che sempre alla vista principale.
  const [organizeOrigin, setOrganizeOrigin] = useState("landing");
  // Fase/selezione di Svuota Frigo sollevate qui: se si apre una ricetta dai
  // risultati e si torna indietro, si ritrova la stessa schermata (invece di
  // ripartire dalla selezione ingredienti, dato che EmptyFridgeScreen viene
  // smontata e rimontata ad ogni cambio di `screen`).
  const [fridgePhase, setFridgePhase] = useState("select");
  const [fridgeOwnedMembers, setFridgeOwnedMembers] = useState([]);
  const [scanDraft, setScanDraft] = useState(null); // draft precompilato da una scansione
  const [pendingShopUpdate, setPendingShopUpdate] = useState(null); // {updated} ricetta modificata già in lista spesa
  const [prevScreen, setPrevScreen] = useState("landing");
  // Vuoto finché il caricamento iniziale da Firestore non li sostituisce
  // (vedi useEffect più sotto) — non più dati demo hardcoded.
  const [recipes, setRecipes] = useState([]);
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
      return sortCategoriesBaseFirst(next);
    });
  };

  const deleteCategory = (id) => {
    if (id === "base") return; // "Ingredienti base" è l'unica categoria fissa: non eliminabile
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

  // equivalences: { "<nome>": { factors:{ cucchiaio:10 } } } — i grammi sono
  // sempre l'unità di riferimento (1 cucchiaio = 10 g), niente base scelta.
  const [equivalences, setEquivalences] = useState({});
  // customUnits: { "<unità>": { base, value, grams } } — conversioni di
  // sistema personalizzate (es. "bicchiere" = 200 ml = 200 g), definite in
  // una delle unità fisse. Fanno da default globale per ogni ingrediente che
  // usa quell'unità: un'equivalenza specifica sulla singola voce vince sempre
  // (vedi ingredientToGrams/gramsPerUnitFor). Le unità fisse restano intoccate.
  const [customUnits, setCustomUnits] = useState({});
  // nutritionMap: { "<nome>": { foodId } | { custom:{kcal,carb,...} } } — mappa ingrediente → voce database
  const [nutritionMap, setNutritionMap] = useState({});
  // customFoods: alimenti aggiunti dall'utente (fonte: personalizzata)
  const [customFoods, setCustomFoods] = useState([]);
  // R2 — dizionario ingredienti del libro attivo (id → nome visualizzato)
  const [ingredientDict, setIngredientDict] = useState({});
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
  const saveCustomUnit = (unitKey, def) => {
    setCustomUnits(prev => ({ ...prev, [unitKey]: def }));
  };
  const deleteCustomUnit = (unitKey) => {
    setCustomUnits(prev => { const next = { ...prev }; delete next[unitKey]; return next; });
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

  // ── Suggerimenti aggregati (ingredienti dal nome simile) ──
  // ignoredSimilarities: [[ingIdA, ingIdB], ...] coppie che l'utente ha
  // scelto di non raggruppare — persistite come tutto il resto per-libro.
  const [ignoredSimilarities, setIgnoredSimilarities] = useState([]);
  const ignoreSimilarity = (a, b) => {
    const pair = [a, b].sort();
    setIgnoredSimilarities(prev => prev.some(([x, y]) => x === pair[0] && y === pair[1]) ? prev : [...prev, pair]);
  };
  const restoreSimilarity = (a, b) => {
    const pair = [a, b].sort();
    setIgnoredSimilarities(prev => prev.filter(([x, y]) => !(x === pair[0] && y === pair[1])));
  };
  // Gruppi ancora attivi (non ignorati): guida sia l'alert in Svuota Frigo
  // sia le card mostrate come "attive" in Organizza Ingredienti.
  const suggestedAggregates = React.useMemo(
    () => findSimilarIngredients(ingredientDict, aggregates, ignoredSimilarities),
    [ingredientDict, aggregates, ignoredSimilarities]
  );

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

  // ══ Multi-ricettario — meta locale (nome/tipo/owner/members); i dati
  // di ogni libro vivono su Firestore (vedi loadFullBook/saveFullBook) ══
  // me = email reale dell'utente loggato (da AuthGate, vedi export default App)
  const [books, setBooks] = useState([
    { id:"b1", name:"Il mio Ricettario", type:"personale", owner:me, members:[me] },
  ]);
  // Ricettario predefinito: quello caricato all'avvio dell'app
  // (nella PWA sarà salvato nel profilo utente su Firestore)
  const [defaultBookId, setDefaultBookId] = useState("b1");
  const [activeBookId, setActiveBookId] = useState("b1"); // all'avvio = predefinito
  const activeBook = books.find(b => b.id === activeBookId);
  // Diventa true solo dopo il primo caricamento riuscito da Firestore —
  // finché è false, il salvataggio automatico resta fermo (altrimenti,
  // su una rete lenta, potrebbe salvare i dati demo iniziali sopra a
  // quelli veri appena caricati, perdendoli).
  const [bookLoaded, setBookLoaded] = useState(false);

  const snapshotData = () => ({
    recipes, extraTagGroups, sectionList, categoryList,
    ingredientCategories, aggregates, shoppingList, equivalences, customUnits, nutritionMap, customFoods, ingredientDict, sourceByIngredient, ignoredSimilarities,
  });
  const loadData = (d) => {
    setRecipes(d.recipes); setExtraTagGroups(d.extraTagGroups);
    setSectionList(d.sectionList); setCategoryList(d.categoryList);
    setIngredientCategories(d.ingredientCategories); setAggregates(d.aggregates);
    setShoppingList(d.shoppingList); setEquivalences(d.equivalences || {});
    setCustomUnits(d.customUnits || {});
    setNutritionMap(d.nutritionMap || {});
    setCustomFoods(d.customFoods || []);
    setIngredientDict(d.ingredientDict || {});
    setSourceByIngredient(d.sourceByIngredient || {});
    setIgnoredSimilarities(d.ignoredSimilarities || []);
    if (d.meta?.bookTheme) {
      setBookTheme(BOOK_THEMES.find(t => t.id === d.meta.bookTheme) || BOOK_THEMES[0]);
    }
  };

  // Caricamento iniziale da Firestore — sostituisce i dati demo hardcoded
  // con quelli reali del libro attivo, non appena disponibili.
  useEffect(() => {
    loadFullBook(activeBookId).then(data => {
      if (data.meta) loadData(data);
      setBookLoaded(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Salvataggio automatico — ogni cambiamento ai dati del libro viene
  // scritto su Firestore dopo una breve pausa (debounce), per non fare
  // una scrittura ad ogni singolo carattere digitato. Salva tutto insieme
  // (stessa forma di saveFullBook/loadFullBook) invece che per singola
  // azione: più semplice da verificare in questo primo cutover.
  useEffect(() => {
    if (!bookLoaded || !activeBook) return;
    const timer = setTimeout(() => {
      saveFullBook(activeBookId, {
        meta: { name: activeBook.name, type: activeBook.type, owner: activeBook.owner, members: activeBook.members, bookTheme: bookTheme.id },
        ...snapshotData(),
      });
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bookLoaded, activeBookId, bookTheme,
    recipes, extraTagGroups, sectionList, categoryList,
    ingredientCategories, aggregates, shoppingList, equivalences, customUnits,
    nutritionMap, customFoods, ingredientDict, sourceByIngredient, ignoredSimilarities,
  ]);

  const switchBook = async (id) => {
    if (id === activeBookId) return;
    const target = books.find(b => b.id === id);
    if (!target) return;
    // metti in pausa il salvataggio automatico, forza subito su Firestore
    // il libro che si lascia (non aspetta il debounce), poi carica il nuovo
    setBookLoaded(false);
    if (activeBook) {
      await saveFullBook(activeBookId, {
        meta: { name: activeBook.name, type: activeBook.type, owner: activeBook.owner, members: activeBook.members, bookTheme: bookTheme.id },
        ...snapshotData(),
      });
    }
    const data = await loadFullBook(id);
    loadData(data);
    setActiveBookId(id);
    setSelected(null);
    setBookLoaded(true);
  };

  const createBook = async (name, memberEmails) => {
    const trimmedName = name.trim() || "Nuovo ricettario";
    const members = [me, ...memberEmails.filter(e => e && e !== me)];
    const id = await createBookInFirestore({ name: trimmedName, type:"condiviso", owner:me, members, bookTheme:"classic" });
    setBooks(prev => [...prev, { id, name: trimmedName, type:"condiviso", owner:me, members }]);
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

  // Copia ricette (per id) dal libro ATTIVO verso un altro libro — copie
  // indipendenti, scritte direttamente nella sotto-collezione recipes del
  // libro di destinazione (non serve toccare meta/system di quel libro).
  const copyRecipesToBook = async (targetId, recipeIds) => {
    const sel = recipes.filter(r => recipeIds.includes(r.id));
    if (sel.length === 0 || targetId === activeBookId) return;
    const copies = sel.map((r) => ({ ...r, id: uid("r"), memories:[], comments:[], favorite:false }));
    await Promise.all(copies.map((c) => saveRecipe(targetId, c)));
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
  const openAddMemory = (recipeId = null) => { setMemoryPrefillRecipeId(recipeId); goTo("addMemory"); };
  const openOrganize = (recipeId = null, alertTypes = null, manageAggs = false, manageCats = false, aggScope = "all") => {
    if (screen !== "organize") setOrganizeOrigin(screen); // non sovrascrivere se già dentro Organizza (es. da un alert interno)
    setOrganizeFilter({ recipeId, alertTypes, manageAggs, manageCats, aggScope });
    goTo("organize");
  };

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
    <RoleCtx.Provider value={role}>
    <ThemeCtx.Provider value={bookTheme}>
    <NavCtx.Provider value={{ onOrganize: () => openOrganize() }}>
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
            onOrganize={() => openOrganize()}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
            onScan={() => goTo("scan")}
            onAddMemory={() => openAddMemory()}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
            onTheme={() => goTo("theme")}
            onCover={() => setScreen("cover")}
            onGuide={() => goTo("guide")}
            onAdminUsers={() => setScreen("adminUsers")}
          />
        )}
        {screen==="adminUsers" && (
          <AdminUsersScreen
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="organize" && (
          <OrganizeIngredientsScreen
            ingredientDict={ingredientDict}
            onRenameIngredient={renameIngredient}
            initialFilterRecipeId={organizeFilter.recipeId}
            initialAlertTypes={organizeFilter.alertTypes}
            initialManageAggs={organizeFilter.manageAggs}
            initialManageCats={organizeFilter.manageCats}
            initialAggScope={organizeFilter.aggScope}
            onBack={() => setScreen(organizeOrigin)}
            nav={
              <GlobalNav
                activeScreen="organize"
                onRecipes={() => setScreen("recipes")}
                onBook={() => setScreen("book")}
                onMemories={() => setScreen("memories")}
                onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
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
            shoppingList={shoppingList}
            aggregates={aggregates}
            sourceByIngredient={sourceByIngredient}
            onSetSourcePriority={setIngredientSourcePriority}
            ingredientCategories={ingredientCategories}
            onSetIngredientCats={setIngredientCats}
            onSaveAggregate={saveAggregate}
            onDeleteAggregate={deleteAggregate}
            suggestedAggregates={suggestedAggregates}
            ignoredSimilarities={ignoredSimilarities}
            onIgnoreSimilarity={ignoreSimilarity}
            onRestoreSimilarity={restoreSimilarity}
            categoryList={categoryList}
            onSaveCategory={saveCategory}
            onDeleteCategory={deleteCategory}
            equivalences={equivalences}
            onSaveEquivalence={saveEquivalence}
            customUnits={customUnits}
            onSaveCustomUnit={saveCustomUnit}
            onDeleteCustomUnit={deleteCustomUnit}
            nutritionMap={nutritionMap}
            onSaveNutritionMapping={saveNutritionMapping}
            customFoods={customFoods}
            onSaveCustomFood={saveCustomFood}
            onDeleteCustomFood={deleteCustomFood}
          />
        )}
        {screen==="books" && (
          <BooksScreen
            books={books}
            activeBookId={activeBookId}
            me={me}
            activeRecipes={recipes}
            onSwitch={async (id) => { await switchBook(id); setScreen("landing"); }}
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
            onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="shoppingList" && (
          <ShoppingListScreen
            entries={shoppingList}
            aggregates={aggregates}
            ingredientCategories={ingredientCategories}
            sourceByIngredient={sourceByIngredient}
            equivalences={equivalences}
            customUnits={customUnits}
            ingredientDict={ingredientDict}
            suggestedAggregates={suggestedAggregates}
            onRemoveEntry={removeShoppingEntry}
            onRemoveRecipe={removeShoppingRecipe}
            onRemoveItem={removeShoppingItem}
            onClearAll={clearShoppingList}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
            onManageAggregates={() => openOrganize(null, null, true, false, "shopping")}
            onManageEquivalences={() => openOrganize(SHOPPING_SOURCE, ["eq"])}
          />
        )}
        {screen==="fridge" && (
          <EmptyFridgeScreen
            recipes={recipes}
            sectionList={sectionList}
            phase={fridgePhase}
            setPhase={setFridgePhase}
            ownedMembers={fridgeOwnedMembers}
            setOwnedMembers={setFridgeOwnedMembers}
            suggestedAggregates={suggestedAggregates}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
            onStartCooking={(r) => { setSelected(r); setPrevScreen("fridge"); setScreen("recipe"); }}
            onAddToShoppingList={addToShoppingList}
            onManageAggregates={() => openOrganize(null, null, true)}
            onManageCategories={() => openOrganize(null, ["cat"])}
            onManageCategoriesDb={() => openOrganize(null, null, false, true)}
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
            onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
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
            onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
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
            onAdd={(type) => type==="memory" ? openAddMemory() : goTo("addRecipeHub")}
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
            onAdd={(type) => type==="memory" ? openAddMemory() : setScreen("addRecipeHub")}
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
            onAdd={(type) => type==="memory" ? openAddMemory() : setScreen("addRecipeHub")}
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
            initialRecipeId={memoryPrefillRecipeId}
            onBack={() => setScreen(prevScreen)}
            onSave={(mem) => { addMemory(mem); setScreen(prevScreen); }}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => type==="memory" ? openAddMemory() : setScreen("addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="recipe" && currentRecipe && (
          <RecipeScreen
            recipe={currentRecipe}
            nutritionMap={nutritionMap}
            equivalences={equivalences}
            customUnits={customUnits}
            customFoods={customFoods}
            ingredientDict={ingredientDict}
            aggregates={aggregates}
            sourceByIngredient={sourceByIngredient}
            onBack={() => setScreen(prevScreen === "recipe" ? "recipes" : prevScreen)}
            onUpdate={updateRecipe}
            onEdit={() => goTo("edit")}
            onDelete={deleteRecipe}
            onDeleteMemory={deleteMemory}
            onAddMemory={(recipeId) => openAddMemory(recipeId)}
            onManageIngredients={(recipeId) => openOrganize(recipeId, ["nutri"])}
            onManageEquivalences={(recipeId) => openOrganize(recipeId, ["eq"])}
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
            onAdd={(type) => type==="memory" ? openAddMemory() : setScreen("addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
          />
        )}
        {screen==="addFromLink" && (
          <AddFromLinkScreen
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
            onAdd={(type) => type==="memory" ? openAddMemory() : setScreen("addRecipeHub")}
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
                  }}>🗑️ Rimuovi dalla lista spesa</button>
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
    </RoleCtx.Provider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGate>
        {(user, role) => <AppInner me={user.email} role={role}/>}
      </AuthGate>
    </ErrorBoundary>
  );
}
