import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  sortSectionsAltroLast, sortCategoriesBaseFirst,
  isSectioned, toSectioned, fromSectioned, stepPhotosOf,
  stepNumbers, stepNumberLabel, dishPhotoOf, readImageFile, normalizeSteps,
  normName, uid, fmtQty, ingredientToText, scaleIngredient,
  flattenIngredients, collectAllIngredients, buildIngredientDict,
  ingDictIndex, resolveIngId, mapIngredientsStruct, flattenSteps,
  UNIT_ALIASES, unitLabel, normUnit, macroLine,
  WEIGHT_UNITS, ingredientToGrams,
  parseIngredientAmount, decomposeIngredient, composeIngredient,
  memoryPeriodLabel, memorySortKey, buildFridgeItems, withTimeout,
  isSystemDataEmpty, applyImportedSystemData,
} from "./utils/helpers.js";
import { effectiveNutritionKey, findSimilarIngredients } from "./utils/aggregates.js";
import {
  loadFullBook, saveRecipe, deleteRecipe as deleteRecipeDoc,
  saveBookSystem, saveBookMeta, saveShoppingList, loadBookSystem,
  createBookInFirestore, deleteBookInFirestore, listMyBooks,
  addBookMember as addBookMemberFs, removeBookMember as removeBookMemberFs, setBookMemberPermission as setBookMemberPermissionFs,
} from "./services/bookStore.js";
import { diffRecipes, recipesToMap } from "./utils/dirtyTracking.js";
import { setDefaultBook } from "./services/authStore.js";
import { buildRecipeIngredientData } from "./utils/shareIngredientData.js";
import {
  createSharedRecipe, loadSharedStatus, loadSharedContent, duplicateRecipePhotos,
  listMySharedRecipes, updateSharedRecipeAccess, revokeSharedRecipe, deleteSharedRecipeFully,
} from "./services/sharedRecipesStore.js";
import { dishPhotoPath, stepPhotoPath, memoryPhotoPath } from "./services/photoStore.js";
import { OfflineNoCacheError } from "./services/offlineFirst.js";
import { markBackupDone } from "./utils/backupReminder.js";
import { isEditorRole, normalizeRole } from "./utils/bookRoles.js";
import SharedRecipeScreen from "./screens/SharedRecipeScreen.jsx";
import MySharedLinksScreen from "./screens/MySharedLinksScreen.jsx";
import { auth } from "./firebase.js";
import { signOut } from "firebase/auth";
import AuthGate from "./components/AuthGate.jsx";
import {
  T, F, MACRO_SECTIONS, PICKER_EMOJIS, INGREDIENT_CATEGORIES,
  TAG_GROUPS, ALL_PRESET_TAGS, BOOK_THEMES,
  EMOJI_CATEGORIES, EMOJI_OPTIONS, COLOR_OPTIONS, DEFAULT_UNIT_SUGGESTIONS,
  MOBILE_BREAKPOINT_CSS,
} from "./data/constants.js";
import { NUTRITION_DB, NUTRIENT_LABELS } from "./data/nutrition.js";
import { ThemeCtx, useTheme, NavCtx, useNavActions, RoleCtx, BetaEnabledCtx, OnlineCtx } from "./context.js";
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
import { guideOrganizza } from "./data/guideContent.jsx";
import GuideScreen from "./screens/GuideScreen.jsx";
import { listPendingExtractions, savePendingExtraction, removePendingExtraction } from "./utils/pendingExtractions.js";
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
import TopStack from "./components/TopStack.jsx";
import CookingTimersProvider from "./components/CookingTimersProvider.jsx";
import ScanExtractionProvider from "./components/ScanExtractionProvider.jsx";

// ── Subsection data helpers ────────────────────────────────────
// ingredients and steps can be either:
//   flat:  ["item1", "item2", ...]
//   sectioned: [{ section:"Nome", items:["item1","item2"] }, ...]
//
// Steps items can be strings or {text, photo}

// ── iPhone shell ───────────────────────────────────────────────
// Su un telefono vero (verticale o ruotato in orizzontale — vedi
// MOBILE_BREAKPOINT_CSS in data/constants.js), non sul mockup desktop, il
// "telefono" disegnato sparisce e lo schermo reale diventa la cornice —
// regola in un <style> iniettato perché gli stili inline non possono
// esprimere media query (stesso pattern già usato in ScanScreen.jsx per
// le @keyframes).
const IPHONE_RESPONSIVE_CSS = `
  @media ${MOBILE_BREAKPOINT_CSS} {
    .iphone-shell { width:100vw !important; height:100dvh !important; border-radius:0 !important; box-shadow:none !important; }
    .iphone-page-wrap { padding:0 !important; gap:0 !important; }
    .iphone-desktop-hint { display:none !important; }
    .iphone-notch { display:none !important; }
    .iphone-content-scroll { padding-top:0 !important; }
  }
`;

const IPhone = ({ children }) => {
  const th = useTheme();
  const scrollRef = useRef(null);

  // Blocca il "pull to refresh" nativo dei browser mobile SOLO nel gesto
  // ambiguo che lo attiva: trascinare verso il basso mentre si è già in
  // cima allo scroll. Il controllo va fatto sull'elemento che sta
  // DAVVERO scrollando sotto il dito (trovato risalendo dal target del
  // tocco), non su .iphone-content-scroll a priori: dentro modalità
  // cucina/spesa (overlay con una propria lista interna scrollabile)
  // .iphone-content-scroll resta fermo, quindi controllarlo bloccherebbe
  // ogni scroll verso l'alto lì dentro a prescindere dalla posizione
  // reale della lista.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const findScrollAncestor = (node) => {
      let n = node;
      while (n && n !== document.body && n !== document.documentElement) {
        if (n.scrollHeight > n.clientHeight + 1) return n;
        n = n.parentElement;
      }
      return null;
    };

    let lastY = 0;
    let ancestor = null;

    const onTouchStart = (e) => {
      lastY = e.touches[0]?.clientY ?? 0;
      ancestor = findScrollAncestor(e.target);
    };

    const onTouchMove = (e) => {
      const y = e.touches[0]?.clientY ?? lastY;
      const deltaY = y - lastY;
      lastY = y;
      if (deltaY <= 0) return; // solo i trascinamenti verso il basso attivano il pull-to-refresh nativo
      if (ancestor) {
        if (ancestor.scrollTop <= 0) e.preventDefault();
      } else {
        // Nessun antenato scrollabile (es. Home: contenuto più corto dello
        // schermo) — non c'è nulla su cui scrollare davvero, quindi il
        // gesto è sempre pull-to-refresh, mai uno scroll legittimo.
        e.preventDefault();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
  <div className="iphone-shell" style={{
    width:390, height:844,
    background: th.appBg,
    borderRadius:50,
    overflow:"hidden",
    boxShadow:"0 40px 100px rgba(0,0,0,0.35), 0 0 0 12px #1a1a1a, 0 0 0 14px #333",
    position:"relative",
    // Rende la shell il "contenitore" per i figli position:fixed (es. le
    // modalità cucina/spesa a schermo intero): senza questo, un figlio
    // fixed si ancorerebbe alla finestra del browser invece che al mockup
    // telefono su desktop. Trasformazione identica, nessun effetto visivo.
    transform:"translateZ(0)",
    fontFamily:F.body,
    display:"flex", flexDirection:"column",
    userSelect:"none",
    transition:"background 0.3s",
  }}>
    <style dangerouslySetInnerHTML={{ __html: IPHONE_RESPONSIVE_CSS }} />
    <div className="iphone-notch" style={{
      position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
      width:130, height:36, background:"#1a1a1a",
      borderRadius:"0 0 20px 20px", zIndex:100,
    }}/>
    <div ref={scrollRef} className="iphone-content-scroll" style={{ flex:1, overflowY:"auto", paddingTop:44 }}>
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
// Apre l'HTML generato in una scheda dedicata e ne avvia la stampa. Un
// iframe nascosto sembrerebbe la via più "silenziosa", ma su Chrome ha un
// bug di lunga data (issues.chromium.org/issues/40896385 e /41323115):
// contentWindow.print() stampa l'intera scheda ATTIVA invece del solo
// iframe — esattamente il sintomo osservato (pagina 1 = screenshot della
// vista corrente, pagina 2 vuota per l'overflow del contenuto vero, breve).
// Una scheda vera dedicata al solo contenuto da stampare non ha questa
// ambiguità: quando si stampa, è l'unico documento di quella scheda.
//
// Il contenuto passa da un Blob URL invece di document.write() su
// "about:blank": document.write() lascia la scheda sull'URL opaco
// "about:blank" a tempo indeterminato, e print() partiva dopo un timeout
// fisso di 400ms — non abbastanza per le foto (piatto/step, caricate da
// Storage) ancora in scaricamento. Chiedere l'anteprima di stampa mentre
// mancano ancora immagini ha causato in test un blocco del renderer di
// diversi minuti, non un errore rapido. Un Blob URL è una navigazione vera:
// l'evento "load" della scheda garantisce che TUTTE le immagini abbiano
// finito di caricare (con successo o in errore) prima di stampare.
function printHtmlDocument(html) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const printWin = window.open(url, "_blank");
  if (!printWin) { URL.revokeObjectURL(url); return; } // popup bloccato dal browser — nulla da fare lato codice
  // NON ripulire su "afterprint": su Android la stampa è delegata al
  // Servizio di Stampa di sistema (un'Activity fuori dal ciclo di vita
  // della pagina), che spesso ricarica/ripagina il contenuto per generare
  // il PDF DOPO che "afterprint" è già scattato nella scheda — lì significa
  // solo "il controllo è passato al sistema", non "la stampa è finita".
  // Chiudere la scheda e revocare il Blob URL a quel punto toglie il
  // contenuto da sotto ai piedi del servizio di stampa: si vede l'anteprima
  // per un istante, poi errore, e al "riprova" non c'è più nulla da
  // caricare. Si rilascia tutto solo dopo un margine di sicurezza fisso.
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    try { printWin.close(); } catch (e) {}
    URL.revokeObjectURL(url);
  };
  printWin.addEventListener("load", () => {
    printWin.focus();
    printWin.print();
    setTimeout(release, 120000);
  });
}

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

  printHtmlDocument(html);
};

// ══════════════════════════════════════════════════════════════
// EXPORT: intero ricettario in PDF — indice + pagine sezione + ricette
// ══════════════════════════════════════════════════════════════
const exportBookPDF = (recipes, sections = MACRO_SECTIONS, bookName = "Il mio Ricettario") => {
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

  // Sezioni con almeno una ricetta, nell'ordine di MACRO_SECTIONS, ricette
  // in ordine alfabetico dentro ciascuna sezione
  const sectionsWithRecipes = sortSectionsAltroLast(sections)
    .map(sec => ({
      ...sec,
      recipes: recipes.filter(r => r.macroSection === sec.id)
        .sort((a, b) => a.title.localeCompare(b.title, "it")),
    }))
    .filter(sec => sec.recipes.length > 0);

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${bookName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; color: #1a1a1a; max-width: 700px; margin: 0 auto; }
  .page { page-break-before: always; page-break-after: always; break-before: page; break-after: page; padding: 40px; }
  /* Copertina — pagina intera, contenuto centrato verticalmente (non solo
     text-align, anche allineato a metà altezza pagina). Le proprietà di
     interruzione pagina sono ripetute qui invece di fare solo affidamento
     sull'ereditarietà da .page: alcuni motori di stampa (es. il servizio di
     stampa di sistema Android) le rispettano meno quando derivano da una
     combinazione di classi. */
  .cover {
    page-break-before: always; page-break-after: always; break-before: page; break-after: page;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; text-align:center;
  }
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
  /* Pagina sezione — stessa ragione di .cover per le proprietà ripetute:
     deve sempre isolarsi dalla ricetta precedente, mai condividerne la
     pagina. */
  .secpage {
    page-break-before: always; page-break-after: always; break-before: page; break-after: page;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; text-align:center;
  }
  .secpage .emoji { font-size: 80px; }
  .secpage h1 { font-size: 34px; font-style: italic; margin: 18px 0 8px; }
  .secpage .desc { font-size: 14px; color: #7A6E5F; font-style: italic; }
  .secpage .orn { color: #B8973A; font-size: 15px; margin-top: 24px; }
  /* Ricetta */
  .recipe { page-break-before: always; page-break-after: always; break-before: page; break-after: page; padding: 40px; }
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
    <h1>${bookName}</h1>
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

  printHtmlDocument(html);
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

function AppInner({ me, role, initialDefaultBookId, betaEnabled, initialTimerAlerts }) {
  // Solo per il banner "sei offline" — il salvataggio vero e proprio non
  // dipende da questo stato (si appoggia alla coda offline di Firestore,
  // vedi src/firebase.js, e al retry sull'evento "online" più sotto).
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  // Deep-link di un link condiviso (?shared=ID nella query string): letto
  // una sola volta all'avvio, non con un router — questa è l'unica pagina,
  // la query string arriva sempre su "/" e ci arriva anche da service
  // worker attivo (nessun navigateFallbackDenylist la esclude, vedi
  // vite.config.js). Il login usa signInWithPopup (non redirect): l'URL
  // della pagina non cambia mai durante l'accesso, quindi anche un utente
  // non ancora loggato la ritrova qui intatta una volta autenticato — non
  // serve un meccanismo dedicato di "azione in sospeso dopo il login".
  // L'URL viene ripulito subito dopo averla letta, così un refresh o una
  // navigazione successiva non ripropongono lo stesso link.
  const [sharedRecipeId] = useState(() => {
    const id = new URLSearchParams(window.location.search).get("shared");
    if (id) window.history.replaceState(null, "", window.location.pathname);
    return id;
  });
  const [screen, setScreen] = useState(() => sharedRecipeId ? "sharedRecipe" : "cover");
  // screen: cover | landing | recipes | book | memories | recipe | new | edit | scan | theme

  // Tasto/gesto Indietro del telefono: senza questo, su Android chiude
  // subito l'app da qualunque schermata (nessuna cronologia gestita, vedi
  // sopra per il deep-link). Qui ogni cambio di `screen` diventa una voce
  // di cronologia; "indietro" la fa scorrere all'indietro invece di uscire.
  // Limite consapevole: copre solo i cambi di `screen` (le schermate
  // principali), non le fasi interne di un componente (es. i passi di
  // ExportFlow o le fasi di BooksScreen) né gli overlay aperti sopra una
  // schermata — coprirli tutti richiederebbe che ognuno gestisca la propria
  // voce di cronologia, fuori scope per ora. Il tasto Home resta e deve
  // restare fuori portata: è un'azione di sistema operativo, nessuna API
  // web può intercettarla.
  const poppingRef = useRef(false);
  const firstScreenEffectRef = useRef(true);
  const prevScreenForHistoryRef = useRef(screen);
  useEffect(() => {
    if (poppingRef.current) { poppingRef.current = false; prevScreenForHistoryRef.current = screen; return; }
    if (firstScreenEffectRef.current) {
      firstScreenEffectRef.current = false;
      // La homepage è sempre la base della cronologia — l'ultima tappa
      // prima di uscire dall'app, mai la copertina (una semplice
      // animazione d'ingresso, non una vera schermata su cui "tornare").
      // Se la schermata iniziale vera è diversa (di norma "cover", oppure
      // una ricetta condivisa via deep-link), diventa il passo successivo.
      window.history.replaceState({ screen: "landing" }, "");
      if (screen !== "landing" && screen !== "cover") {
        window.history.pushState({ screen }, "");
      }
      prevScreenForHistoryRef.current = screen;
      return;
    }
    // Rientro senza un vero cambiamento (in sviluppo, StrictMode invoca gli
    // effect due volte all'avvio per diagnostica): senza questa guardia la
    // seconda invocazione "fantasma" — stesso screen, prevScreenForHistoryRef
    // già aggiornato dalla prima — verrebbe scambiata per una transizione
    // reale fuori dalla copertina, sovrascrivendo la base appena seminata.
    if (screen === prevScreenForHistoryRef.current) return;
    // La transizione FUORI dalla copertina sostituisce invece di
    // aggiungere: dopo, in cronologia resta solo la homepage come base,
    // senza un passo "a vuoto" dentro l'animazione d'ingresso.
    if (prevScreenForHistoryRef.current === "cover") {
      window.history.replaceState({ screen }, "");
    } else {
      window.history.pushState({ screen }, "");
    }
    prevScreenForHistoryRef.current = screen;
  }, [screen]);
  useEffect(() => {
    const onPopState = (e) => {
      if (e.state && e.state.screen) {
        poppingRef.current = true;
        setScreen(e.state.screen);
      }
      // Nessuno stato salvato: siamo alla prima voce di cronologia — si
      // lascia che il browser/sistema gestisca l'uscita, non va impedita.
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  const [scanMode, setScanMode] = useState("camera"); // "camera" | "gallery" — vedi AddRecipeHubScreen
  const [selected, setSelected] = useState(null);
  const [memoryPrefillRecipeId, setMemoryPrefillRecipeId] = useState(null);
  const [organizeFilter, setOrganizeFilter] = useState({ recipeId:null, alertTypes:null, manageAggs:false, manageCats:false, aggScope:"all" });
  // Schermata da cui si è entrati in Organizza Ingredienti (qualunque punto
  // d'ingresso: icona di navigazione globale, banner di una schermata, link
  // diretto a una sotto-schermata) — usata dai tasti "Indietro" per tornare
  // davvero da dove si è partiti, invece che sempre alla vista principale.
  const [organizeOrigin, setOrganizeOrigin] = useState(null);
  // Fase/selezione di Svuota Frigo sollevate qui: se si apre una ricetta dai
  // risultati e si torna indietro, si ritrova la stessa schermata (invece di
  // ripartire dalla selezione ingredienti, dato che EmptyFridgeScreen viene
  // smontata e rimontata ad ogni cambio di `screen`).
  const [fridgePhase, setFridgePhase] = useState("select");
  const [fridgeOwnedMembers, setFridgeOwnedMembers] = useState([]);
  const [scanDraft, setScanDraft] = useState(null); // draft precompilato da una scansione
  // id della bozza persistita (src/utils/pendingExtractions.js) che questa
  // sessione di NewRecipeScreen sta modificando — null per l'inserimento
  // manuale (nessuna bozza AI da tracciare).
  const [scanDraftPendingId, setScanDraftPendingId] = useState(null);
  const [pendingExtractions, setPendingExtractions] = useState(() => listPendingExtractions());
  const refreshPendingExtractions = () => setPendingExtractions(listPendingExtractions());
  const [pendingShopUpdate, setPendingShopUpdate] = useState(null); // {updated} ricetta modificata già in lista spesa
  const [prevScreen, setPrevScreen] = useState("landing");
  const [booksEntryPhase, setBooksEntryPhase] = useState("list"); // fase con cui BooksScreen si apre: "list" o "transfer" (export diretto dal banner)
  // Vuoto finché il caricamento iniziale da Firestore non li sostituisce
  // (vedi useEffect più sotto) — non più dati demo hardcoded.
  const [recipes, setRecipes] = useState([]);
  // Ultimo stato ricette effettivamente scritto su Firestore (id → riferimento),
  // usato da flushRecipesNow per salvare/eliminare solo ciò che è cambiato
  // invece di riscrivere tutte le ricette ad ogni modifica (vedi dirtyTracking.js).
  const lastSyncedRecipesRef = useRef(new Map());
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
    // Tocca solo le ricette che contengono davvero l'ingrediente: mantenere lo
    // stesso riferimento per le altre è ciò che permette al salvataggio
    // mirato (vedi dirtyTracking.js) di scrivere solo le ricette toccate.
    setRecipes(prev => prev.map(r => {
      const hasIng = flattenIngredients(r.ingredients).some(ing => normName(ing.name) === oldKey);
      if (!hasIng) return r;
      return {
        ...r,
        ingredients: mapIngredientsStruct(r.ingredients, ing =>
          normName(ing.name) === oldKey ? { ...ing, name: clean } : ing),
      };
    }));
    return true;
  };
  // Elimina definitivamente ingredienti NON usati in nessuna ricetta —
  // pulisce ogni struttura keyed per ingId, non solo il dizionario (a
  // differenza di deleteAggregate, che lascia riferimenti pendenti; qui
  // seguiamo lo stile esplicito di deleteCategory).
  const deleteIngredients = (ids) => {
    const idSet = new Set(ids);
    const stripKeys = (obj) => {
      const next = { ...obj };
      idSet.forEach(id => delete next[id]);
      return next;
    };
    setIngredientDict(stripKeys);
    setIngredientCategories(stripKeys);
    setSourceByIngredient(stripKeys);
    setEquivalences(stripKeys);
    setNutritionMap(stripKeys);
    setAggregates(prev => prev.map(a => ({ ...a, members: (a.members || []).filter(m => !idSet.has(m)) })));
    setIgnoredSimilarities(prev => prev.filter(([a, b]) => !idSet.has(a) && !idSet.has(b)));
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

  // ══ Multi-ricettario — meta locale (nome/tipo/owner/membri); i dati
  // di ogni libro vivono su Firestore, un salvataggio mirato per documento
  // (vedi loadFullBook e flushRecipesNow/flushSystemNow/flushShoppingListNow/
  // flushMetaNow più sotto) ══
  // me = email reale dell'utente loggato (da AuthGate, vedi export default App)
  const [books, setBooks] = useState([]);
  // Ricettario predefinito: quello caricato all'avvio dell'app — persistito
  // su allowlist/{email}.defaultBookId (vedi services/authStore.js).
  const [defaultBookId, setDefaultBookId] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);
  const activeBook = books.find(b => b.id === activeBookId);
  // Diventa true solo dopo il primo caricamento riuscito da Firestore —
  // finché è false, il salvataggio automatico resta fermo (altrimenti,
  // su una rete lenta, potrebbe salvare i dati demo iniziali sopra a
  // quelli veri appena caricati, perdendoli).
  const [bookLoaded, setBookLoaded] = useState(false);
  // true se il bootstrap sotto ha fallito o è andato in timeout — mostra
  // uno stato di errore con possibilità di riprovare invece di restare
  // bloccati su "Caricamento…" per sempre (vedi anche AuthGate.jsx).
  const [bookBootError, setBookBootError] = useState(false);
  // true se offline e nulla in cache su questo dispositivo per questo
  // libro (es. primo avvio da zero senza rete) — messaggio dedicato,
  // distinto dall'errore generico (vedi anche AuthGate.jsx).
  const [bookBootOffline, setBookBootOffline] = useState(false);

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
    lastSyncedRecipesRef.current = recipesToMap(d.recipes || []);
  };

  // Backup locale: scarica un file JSON con tutti i dati del libro attivo
  // (stesso snapshot usato dal salvataggio automatico, nessuna lettura in
  // più) — permette di recuperare i dati anche se l'app o Firestore hanno
  // un problema. Le foto restano referenziate via URL Storage (non incluse
  // nel file, sarebbe enorme): un ripristino le rende autonome ri-
  // duplicandole (vedi restoreBackup più sotto).
  const downloadLocalBackup = () => {
    const payload = {
      app: "ricettario", formatVersion: 1, exportedAt: new Date().toISOString(),
      bookName: activeBook?.name || "Ricettario",
      meta: { bookTheme: bookTheme?.id },
      data: snapshotData(),
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);
    const safeName = (activeBook?.name || "ricettario").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${safeName || "ricettario"}-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    markBackupDone();
  };

  // Ripristina un file di backup come NUOVO libro — non tocca mai il libro
  // attivo né alcun libro esistente (vedi discussione con l'utente: un
  // backup serve a recuperare dati persi, sovrascrivere silenziosamente
  // sarebbe rischioso). Le foto (referenziate via URL nel file) vengono
  // ri-duplicate sui path Storage del nuovo libro così restano autonome
  // anche se il libro/le foto d'origine del backup non esistono più —
  // stesso principio già usato per "aggiungi ricetta condivisa al mio
  // ricettario" (vedi sharedRecipesStore.js, duplicateRecipePhotos). Se la
  // duplicazione di una foto fallisce (es. foto d'origine non più
  // raggiungibile), la ricetta viene comunque salvata con l'URL originale
  // invece di far fallire l'intero ripristino: i dati testuali contano più
  // delle foto per lo scopo di questa funzione.
  const restoreBackup = async (payload) => {
    const d = payload?.data;
    if (!d || !Array.isArray(d.recipes)) throw new Error("File di backup non valido.");
    const name = `${payload.bookName || "Ricettario"} (ripristinato)`;
    const bookThemeId = BOOK_THEMES.some(t => t.id === payload.meta?.bookTheme) ? payload.meta.bookTheme : "classic";
    const idToken = await auth.currentUser.getIdToken();
    const id = await createBookInFirestore({ idToken, name, type: "personale", bookTheme: bookThemeId });

    await saveBookSystem(id, {
      extraTagGroups: d.extraTagGroups, sectionList: d.sectionList, categoryList: d.categoryList,
      ingredientCategories: d.ingredientCategories, aggregates: d.aggregates,
      equivalences: d.equivalences || {}, customUnits: d.customUnits || {},
      nutritionMap: d.nutritionMap || {}, customFoods: d.customFoods || [],
      ingredientDict: d.ingredientDict || {}, sourceByIngredient: d.sourceByIngredient || {},
      ignoredSimilarities: d.ignoredSimilarities || [],
    });
    await saveShoppingList(id, d.shoppingList || []);

    for (const r of d.recipes) {
      let toSave = r;
      try {
        const { recipe } = await duplicateRecipePhotos(r, {
          dishPath: () => dishPhotoPath(id, r.id),
          stepPath: (i, p) => stepPhotoPath(id, r.id, i, p),
          memoryPath: (memId) => memoryPhotoPath(id, r.id, memId),
        });
        toSave = recipe;
      } catch (e) {
        console.warn(`Duplicazione foto non riuscita per la ricetta "${r.title}", salvata senza foto autonome`, e);
      }
      await saveRecipe(id, toSave);
    }

    setBooks(prev => [...prev, {
      id, name, type: "personale", bookTheme: bookThemeId,
      owner: me, memberEmails: [], memberRoles: {},
    }]);
    return id;
  };

  // Salvataggio mirato delle ricette: confronta lo stato attuale con l'ultimo
  // sincronizzato (per riferimento, vedi dirtyTracking.js) e scrive solo le
  // ricette create/modificate (saveRecipe) ed elimina solo quelle rimosse
  // (deleteRecipe) — mai l'intero libro. Richiamabile sia dal debounce sotto
  // sia — await-ata — da switchBook, per non perdere modifiche pendenti al
  // cambio libro.
  const flushRecipesNow = async () => {
    const { changed, removedIds } = diffRecipes(lastSyncedRecipesRef.current, recipes);
    if (changed.length === 0 && removedIds.length === 0) return;
    try {
      await Promise.all([
        ...changed.map(r => saveRecipe(activeBookId, r, lastSyncedRecipesRef.current.get(r.id))),
        ...removedIds.map(id => deleteRecipeDoc(activeBookId, id)),
      ]);
      lastSyncedRecipesRef.current = recipesToMap(recipes);
    } catch (e) {
      // Non aggiorna lastSyncedRecipesRef: le ricette rimaste diverse dal
      // sincronizzato risulteranno di nuovo dirty al prossimo giro (vedi
      // dirtyTracking.js) — stesso principio del retry alla riconnessione
      // (evento "online" più sotto). Un fallimento qui non deve mai
      // propagarsi: bloccherebbe switchBook a metà (vedi Promise.allSettled).
      console.warn("Salvataggio ricette non riuscito, verrà ritentato", e);
    }
  };

  // Bootstrap iniziale: carica "i miei libri" da Firestore (owner + membro,
  // più il Ricettario Beta se tester/admin — vedi listMyBooks); se è la
  // primissima volta (nessun libro trovato), crea il libro personale via
  // /api/create-book. Sceglie come attivo il predefinito salvato (se ancora
  // valido) o il libro personale, poi ne carica subito i dati.
  // Isolato in una funzione a sé (invece che inline nell'effect) così può
  // essere richiamato anche dal pulsante "Riprova" in caso di errore.
  // Un timeout complessivo evita che una richiesta di rete mai risolta
  // lasci l'app bloccata su "Caricamento…" per sempre.
  const bootstrapBooks = useCallback(async () => {
    setBookBootError(false);
    setBookBootOffline(false);
    // Offline, non c'è rete da aspettare: la lettura va dritta alla cache
    // locale (vedi services/offlineFirst.js), quindi un margine più corto
    // basta e non fa percepire un'attesa inutile.
    const timeoutMs = navigator.onLine ? 15000 : 4000;
    try {
      await withTimeout((async () => {
        let list = await listMyBooks(me, role);
        if (list.length === 0) {
          const idToken = await auth.currentUser.getIdToken();
          const id = await createBookInFirestore({ idToken, name: "Il mio Ricettario", type: "personale" });
          list = [{ id, name: "Il mio Ricettario", type: "personale", bookTheme: "classic", owner: me, memberEmails: [], memberRoles: {} }];
        }
        setBooks(list);
        const personal = list.find(b => b.type === "personale" && b.owner === me);
        const initial = (initialDefaultBookId && list.some(b => b.id === initialDefaultBookId))
          ? initialDefaultBookId
          : (personal ? personal.id : list[0].id);
        setDefaultBookId(initial);
        setActiveBookId(initial);
        const data = await loadFullBook(initial);
        if (data.meta) loadData(data);
      })(), timeoutMs);
      setBookLoaded(true);
    } catch (e) {
      if (e instanceof OfflineNoCacheError) setBookBootOffline(true);
      else setBookBootError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bootstrapBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOutAndRetry = () => signOut(auth);

  // Salvataggio mirato delle ricette: scrive solo quelle create/modificate
  // ed elimina solo quelle rimosse (vedi flushRecipesNow) — non l'intero
  // libro. Primo pezzo staccato dal salvataggio "tutto insieme" qui sotto,
  // perché è dove vive il costo N×M (N ricette × M modifiche).
  useEffect(() => {
    if (!bookLoaded || !activeBook) return;
    const timer = setTimeout(() => { flushRecipesNow(); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookLoaded, activeBookId, recipes]);

  // Salvataggio mirato del documento system: un solo documento per le sue 12
  // proprietà, quindi "una qualunque è cambiata" è già la granularità
  // giusta — a differenza delle ricette non serve un diff, solo osservare
  // il gruppo intero. Prima viveva nel salvataggio "tutto insieme": ogni
  // modifica a una ricetta o alla lista spesa lo riscriveva inutilmente.
  const flushSystemNow = async () => {
    const { recipes: _recipes, shoppingList: _shoppingList, ...system } = snapshotData();
    try {
      await saveBookSystem(activeBookId, system);
    } catch (e) {
      // Un fallimento qui non deve mai propagarsi (bloccherebbe switchBook a
      // metà, vedi Promise.allSettled) — il prossimo cambiamento di un campo
      // system, o il retry alla riconnessione, ritenterà.
      console.warn("Salvataggio system non riuscito, verrà ritentato", e);
    }
  };
  useEffect(() => {
    if (!bookLoaded || !activeBook) return;
    const timer = setTimeout(() => { flushSystemNow(); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bookLoaded, activeBookId,
    extraTagGroups, sectionList, categoryList, ingredientCategories, aggregates,
    equivalences, customUnits, nutritionMap, customFoods, ingredientDict,
    sourceByIngredient, ignoredSimilarities,
  ]);

  // Salvataggio mirato della lista spesa: un documento a sé, indipendente
  // da ricette e system — così una modifica alla spesa non tocca l'uno né
  // l'altro (e viceversa), incluso il percorso updateRecipe → resolveShopUpdate
  // (R6), che tocca shoppingList da solo, in reazione a una modifica ricetta
  // già gestita dal proprio effetto.
  const flushShoppingListNow = async () => {
    try {
      await saveShoppingList(activeBookId, shoppingList);
    } catch (e) {
      console.warn("Salvataggio lista spesa non riuscito, verrà ritentato", e);
    }
  };
  useEffect(() => {
    if (!bookLoaded || !activeBook) return;
    const timer = setTimeout(() => { flushShoppingListNow(); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookLoaded, activeBookId, shoppingList]);

  // Salvataggio mirato di meta/tema — cambia raramente (nome libro, tema),
  // un piccolo documento a sé.
  const flushMetaNow = async () => {
    try {
      await saveBookMeta(activeBookId, { name: activeBook.name, type: activeBook.type, owner: activeBook.owner, memberEmails: activeBook.memberEmails || [], memberRoles: activeBook.memberRoles || {}, bookTheme: bookTheme.id });
    } catch (e) {
      console.warn("Salvataggio meta libro non riuscito, verrà ritentato", e);
    }
  };
  useEffect(() => {
    if (!bookLoaded || !activeBook) return;
    const timer = setTimeout(() => { flushMetaNow(); }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookLoaded, activeBookId, bookTheme]);

  // Retry immediato alla riconnessione — senza, un salvataggio fallito da
  // offline (tipicamente: una foto, vedi resolvePhoto in bookStore.js)
  // resterebbe in sospeso finché l'utente non tocca di nuovo quella
  // ricetta. flushAllRef è sempre la versione più recente dei 4 flush
  // (riassegnata ad ogni render): l'effetto si registra una sola volta per
  // "sessione di libro caricato", non ad ogni cambio di stato.
  const flushAllRef = useRef(() => {});
  useEffect(() => {
    flushAllRef.current = () => {
      flushRecipesNow();
      flushSystemNow();
      flushShoppingListNow();
      flushMetaNow();
    };
  });
  useEffect(() => {
    if (!bookLoaded || !activeBook) return;
    const onReconnect = () => flushAllRef.current();
    window.addEventListener("online", onReconnect);
    return () => window.removeEventListener("online", onReconnect);
  }, [bookLoaded, activeBookId]);

  const switchBook = async (id) => {
    if (id === activeBookId) return;
    const target = books.find(b => b.id === id);
    if (!target) return;
    // metti in pausa il salvataggio automatico, forza subito su Firestore
    // il libro che si lascia (non aspetta il debounce), poi carica il nuovo
    setBookLoaded(false);
    if (activeBook) {
      // allSettled, non all: ogni flush gestisce già i propri errori (vedi
      // sopra), ma un fallimento isolato (es. rete assente) non deve mai
      // impedire il cambio libro o lasciare bookLoaded bloccato a false.
      await Promise.allSettled([
        flushRecipesNow(),
        flushSystemNow(),
        flushShoppingListNow(),
        flushMetaNow(),
      ]);
    }
    const data = await loadFullBook(id);
    loadData(data);
    setActiveBookId(id);
    setSelected(null);
    setBookLoaded(true);
  };

  const createBook = async (name, memberEmails) => {
    const trimmedName = name.trim() || "Nuovo ricettario";
    const idToken = await auth.currentUser.getIdToken();
    const id = await createBookInFirestore({ idToken, name: trimmedName, type: "condiviso" });
    const emails = memberEmails.filter(e => e && e !== me);
    // Ruolo di partenza per chi viene invitato in fase di creazione:
    // redattore (può aggiungere/modificare contenuti, non eliminarli) —
    // il proprietario può sempre promuoverli dopo dalla lista membri.
    await Promise.all(emails.map(e => addBookMemberFs({ idToken, bookId: id, targetEmail: e, newRole: "redattore" })));
    setBooks(prev => [...prev, {
      id, name: trimmedName, type: "condiviso", bookTheme: "classic", owner: me,
      memberEmails: emails, memberRoles: Object.fromEntries(emails.map(e => [e, "redattore"])),
    }]);
  };

  const renameBook = (id, name) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, name } : b));
  };

  const deleteBook = async (id) => {
    // Se è il libro attivo, cambia libro PRIMA di chiedere l'eliminazione al
    // server: switchBook salva (autosave d'uscita) il libro che si lascia,
    // e quel salvataggio fallirebbe con "permessi insufficienti" se il
    // documento fosse già stato cancellato nel frattempo.
    if (id === activeBookId) {
      const personal = books.find(b => b.type === "personale" && b.owner === me && b.id !== id);
      if (personal) await switchBook(personal.id);
    }
    const idToken = await auth.currentUser.getIdToken();
    await deleteBookInFirestore({ idToken, bookId: id });
    setBooks(prev => prev.filter(b => b.id !== id));
  };

  // Scrivono subito su Firestore via /api/manage-book-member (non solo
  // nello stato locale come prima): lo stato locale si aggiorna solo DOPO
  // la conferma del server, mai prima — se la chiamata fallisce (es. ruolo
  // non permesso, tetto membri raggiunto), l'errore risale al chiamante
  // (vedi BooksScreen.jsx) senza aver toccato `books`.
  const addMember = async (id, email, newRole) => {
    const e = email.trim().toLowerCase();
    const book = books.find(b => b.id === id);
    if (!e || !e.includes("@") || !book || (book.memberEmails || []).includes(e)) return;
    const idToken = await auth.currentUser.getIdToken();
    await addBookMemberFs({ idToken, bookId: id, targetEmail: e, newRole });
    setBooks(prev => prev.map(b => b.id === id
      ? { ...b, memberEmails: [...(b.memberEmails || []), e], memberRoles: { ...(b.memberRoles || {}), [e]: newRole } }
      : b));
  };

  const removeMember = async (id, email) => {
    const book = books.find(b => b.id === id);
    if (!book || email === book.owner) return;
    const idToken = await auth.currentUser.getIdToken();
    await removeBookMemberFs({ idToken, bookId: id, targetEmail: email });
    setBooks(prev => prev.map(b => b.id === id
      ? { ...b, memberEmails: (b.memberEmails || []).filter(m => m !== email), memberRoles: Object.fromEntries(Object.entries(b.memberRoles || {}).filter(([k]) => k !== email)) }
      : b));
  };

  const changeMemberPermission = async (id, email, newRole) => {
    const idToken = await auth.currentUser.getIdToken();
    await setBookMemberPermissionFs({ idToken, bookId: id, targetEmail: email, newRole });
    setBooks(prev => prev.map(b => b.id === id
      ? { ...b, memberRoles: { ...(b.memberRoles || {}), [email]: newRole } }
      : b));
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
  // includeMemories: porta con sé anche i ricordi (che contengono le loro foto).
  // includeSystem: aggiunge le impostazioni di "Organizza Ingredienti" del libro attivo.
  const exportShareCode = (recipeIds, { includeMemories = false, includeSystem = false } = {}) => {
    const sel = recipes.filter(r => recipeIds.includes(r.id))
      .map(({ memories, comments, favorite, ...rest }) => includeMemories ? { ...rest, memories: memories || [] } : rest);
    const payload = { v:3, recipes: sel };
    if (includeSystem) {
      payload.system = {
        ingredientCategories, aggregates, equivalences, customUnits, nutritionMap,
        customFoods, ingredientDict, sourceByIngredient, ignoredSimilarities,
      };
    }
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)));
  };

  // Condivisione di una singola ricetta via link (sharedRecipes) — vedi
  // ExportFlow.jsx e sharedRecipesStore.js. Il filtro dei dati ingredienti
  // resta scoped alla ricetta (mai il libro intero, a differenza
  // dell'export a codice): vedi utils/shareIngredientData.js.
  const shareRecipeViaLink = async (recipeId, { includeIngredients, includePhotos, visibility, allowedEmails }) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) throw new Error("Ricetta non trovata");
    const ingredientData = includeIngredients
      ? buildRecipeIngredientData(recipe, {
          ingredientCategories, aggregates, equivalences, customUnits,
          nutritionMap, customFoods, ingredientDict, sourceByIngredient,
        })
      : null;
    return createSharedRecipe({
      recipe, ingredientData, sharedBy: me, visibility, allowedEmails,
      sourceBookId: activeBookId, sourceRecipeId: recipeId,
      includePhotos,
    });
  };

  // Libri su cui l'utente ha permesso di scrittura (proprietario/
  // co-proprietario/collaboratore, non lettore) — per la scelta "aggiungi
  // al mio ricettario" quando si apre un link condiviso. Stesso controllo
  // di bookRoles.js usato ovunque nell'app, non riscritto qui.
  const myEditableBooks = books.filter(b => {
    const role = b.owner === me ? "proprietario" : normalizeRole((b.memberRoles || {})[me]);
    return isEditorRole(role);
  });

  // Copia una ricetta condivisa (ricevuta via link) in un libro proprio —
  // stesso schema di copyRecipesToBook, più l'applicazione dei dati
  // ingredienti (se inclusi) con la stessa regola "solo se il libro di
  // destinazione è vuoto" usata dall'import a codice. Se il libro target
  // non è quello attivo, il suo system/data non è in memoria: va letto e
  // scritto direttamente su Firestore invece di passare dagli state setter
  // (che riflettono solo il libro attivo).
  const addSharedRecipeToBook = async (targetBookId, content, { applyIngredientData }) => {
    let newRecipe = {
      ...content.recipe,
      id: uid("r"),
      macroSection: content.recipe.macroSection || "altro",
      comments: [], favorite: false,
      memories: Array.isArray(content.recipe.memories) ? content.recipe.memories : [],
    };
    // Le foto della ricetta condivisa vivono sotto sharedRecipes/{shareId}/…
    // e spariscono quando quel link scade o viene revocato: una ricetta
    // "aggiunta" al proprio libro deve avere le sue foto indipendenti,
    // sotto il path del libro/ricetta di destinazione (no-op se la
    // condivisione non includeva foto: duplicateRecipePhotos non trova
    // nulla da duplicare).
    const dup = await duplicateRecipePhotos(newRecipe, {
      dishPath: () => dishPhotoPath(targetBookId, newRecipe.id),
      stepPath: (i, p) => stepPhotoPath(targetBookId, newRecipe.id, String(i), p),
      memoryPath: (memId) => memoryPhotoPath(targetBookId, newRecipe.id, memId),
    });
    newRecipe = dup.recipe;
    await saveRecipe(targetBookId, newRecipe);

    if (applyIngredientData && content.ingredientData) {
      if (targetBookId === activeBookId) {
        if (isSystemDataEmpty({ ingredientCategories, aggregates, nutritionMap, equivalences, customFoods, ingredientDict })) {
          applyImportedSystemData(content.ingredientData, {
            setIngredientCategories, setAggregates, setEquivalences, setCustomUnits,
            setNutritionMap, setCustomFoods, setIngredientDict, setSourceByIngredient,
          });
        }
      } else {
        const targetSystem = await loadBookSystem(targetBookId);
        if (isSystemDataEmpty(targetSystem || {})) {
          await saveBookSystem(targetBookId, { ...(targetSystem || {}), ...content.ingredientData });
        }
      }
    }
    return newRecipe.id;
  };

  // Esporta PDF di una o più ricette (per id)
  const exportRecipesPDFByIds = (recipeIds) => {
    const sel = recipes.filter(r => recipeIds.includes(r.id));
    if (sel.length === 1) { exportRecipePDF(sel[0]); }
    else if (sel.length > 1) { exportBookPDF(sel, sectionList, activeBook?.name); }
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
        ...r, id: uid("r"), memories: Array.isArray(r.memories) ? r.memories : [], comments:[], favorite:false,
        macroSection: r.macroSection || "altro",
        ingredients: convIngs(r.ingredients),
      }));
      setRecipes(prev => [...prev, ...copies]);
      // Le impostazioni di Organizza Ingredienti si applicano solo se il libro
      // attivo non ne ha ancora di proprie — altrimenti rischierebbero di
      // sovrascrivere in silenzio categorie/aggregati già configurati dall'utente.
      let systemImported = false;
      if (parsed.system && isSystemDataEmpty({ ingredientCategories, aggregates, nutritionMap, equivalences, customFoods, ingredientDict })) {
        systemImported = applyImportedSystemData(parsed.system, {
          setIngredientCategories, setAggregates, setEquivalences, setCustomUnits,
          setNutritionMap, setCustomFoods, setIngredientDict, setSourceByIngredient, setIgnoredSimilarities,
        });
      }
      return { ok:true, count: copies.length, systemImported };
    } catch {
      return { ok:false };
    }
  };

  const goTo = (s) => { setPrevScreen(screen); setScreen(s); };
  const openBookExport = () => { setBooksEntryPhase("transfer"); goTo("books"); };
  const openAddMemory = (recipeId = null) => { setMemoryPrefillRecipeId(recipeId); goTo("addMemory"); };
  const openOrganize = (recipeId = null, alertTypes = null, manageAggs = false, manageCats = false, aggScope = "all") => {
    // Ingresso "contestuale" (da un alert/link specifico) vs "generico" (icona
    // di navigazione globale o banner, sempre invocato senza argomenti): solo
    // il primo caso ha un vero posto a cui tornare — l'altro azzera
    // organizeOrigin così il tasto "Indietro" resta nascosto (vedi onBack).
    const isContextual = recipeId != null || (alertTypes && alertTypes.length > 0) || manageAggs || manageCats;
    if (screen !== "organize") setOrganizeOrigin(isContextual ? screen : null); // non sovrascrivere se già dentro Organizza (es. da un alert interno)
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
      steps: normalizeSteps(draft.steps),
      memories: [],
      comments: [],
    };
    setRecipes(prev => [...prev, newR]);
    setSelected(newR);
    setScreen("recipe");
  };

  // Dopo la scansione: NON salva subito, ma apre il form manuale precompilato
  // con i dati letti dalla foto, così si possono correggere prima di salvare.
  // Il draft viene anche persistito (src/utils/pendingExtractions.js) PRIMA
  // di entrare nell'editor: se l'utente tocca "indietro" invece di "salva",
  // resta recuperabile dall'hub "Aggiungi ricetta" invece di sparire.
  const saveScanned = (name, tags, ocrData, emoji, color, macroSection) => {
    const draft = {
      title: name || ocrData?.title || "",
      source: ocrData?.source || "", sourceUrl: ocrData?.sourceUrl || "",
      prepTime: ocrData?.prepTime || 0, cookTime: ocrData?.cookTime || 0,
      servings: ocrData?.servings || 4,
      note: ocrData?.note || "",
      ingredients: (ocrData?.ingredients && ocrData.ingredients.length) ? ocrData.ingredients : [{ name:"", qty:"", unit:"" }],
      // normalizeSteps deduce già qui il timer dal testo di ogni step (es.
      // "Cuocere per 20 minuti") — senza, il timer comparirebbe solo dopo
      // aver salvato la ricetta, invisibile nella schermata di conferma.
      steps: (ocrData?.steps && ocrData.steps.length) ? normalizeSteps(ocrData.steps) : [""],
      tags: tags.length ? tags : [],
      color: color || "#6B8C6E",
      emoji: emoji || "🍝",
      dishPhoto: null,
      macroSection: macroSection || "altro",
    };
    const id = uid("pending");
    savePendingExtraction(id, draft);
    refreshPendingExtractions();
    setScanDraftPendingId(id);
    setScanDraft(draft);
    setScreen("new");
  };

  // Riapre nell'editor una bozza già in "Estrazioni da confermare".
  const openPendingExtraction = (pending) => {
    setScanDraftPendingId(pending.id);
    setScanDraft(pending.draft);
    setScreen("new");
  };

  const discardPendingExtraction = (id) => {
    removePendingExtraction(id);
    refreshPendingExtractions();
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

  // Stesso principio applicato al login (AuthGate.jsx): finché i libri non
  // sono caricati, non si mostra la UI principale con dati vuoti/demo — e
  // in caso di errore/timeout c'è sempre un modo per uscirne, mai un
  // caricamento eterno.
  if (!bookLoaded) {
    const bootPageStyle = {
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      fontFamily: "sans-serif", padding: 20, textAlign: "center",
    };
    if (bookBootOffline) {
      return (
        <div style={bootPageStyle}>
          <h1>Nessuna connessione</h1>
          <p>Non ci sono ancora dati salvati su questo dispositivo per questo libro: la prima apertura richiede una connessione internet.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={bootstrapBooks} style={{ padding: "10px 20px", cursor: "pointer" }}>
              Riprova
            </button>
            <button onClick={signOutAndRetry} style={{ padding: "10px 20px", cursor: "pointer" }}>
              Esci e riprova
            </button>
          </div>
        </div>
      );
    }
    if (bookBootError) {
      return (
        <div style={bootPageStyle}>
          <h1>Caricamento non riuscito</h1>
          <p>Controlla la connessione e riprova.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={bootstrapBooks} style={{ padding: "10px 20px", cursor: "pointer" }}>
              Riprova
            </button>
            <button onClick={signOutAndRetry} style={{ padding: "10px 20px", cursor: "pointer" }}>
              Esci e riprova
            </button>
          </div>
        </div>
      );
    }
    return <div style={bootPageStyle}>Caricamento…</div>;
  }

  return (
    <CookingTimersProvider me={me} initialPrefs={initialTimerAlerts}>
    <ScanExtractionProvider>
    <RoleCtx.Provider value={role}>
    <BetaEnabledCtx.Provider value={betaEnabled}>
    <OnlineCtx.Provider value={isOnline}>
    <ThemeCtx.Provider value={bookTheme}>
    <NavCtx.Provider value={{ onOrganize: () => openOrganize() }}>
    <div className="iphone-page-wrap" style={{
      minHeight:"100vh",
      background:`radial-gradient(ellipse at 60% 20%, ${bookTheme.appCard} 0%, ${bookTheme.appBorder} 100%)`,
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 20px", gap:20,
      transition:"background 0.4s",
    }}>
      <div className="iphone-desktop-hint" style={{ textAlign:"center", color:bookTheme.appInk }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:26, marginBottom:4 }}>Il mio Ricettario</div>
        <div style={{ fontFamily:"sans-serif", fontSize:12, opacity:0.6 }}>Prototipo v17 · tocca la copertina per entrare</div>
      </div>

      <IPhone>
        <TopStack
          isOnline={isOnline}
          isOnExtractionScreen={screen==="scan" || screen==="addFromLink"}
          onOpenExtractionResult={(result) => saveScanned(result.title, [], result.ocrData, result.emoji, result.color, "altro")}
          onOpenExtractionScreen={(kind) => setScreen(kind==="photo" ? "scan" : "addFromLink")}
        />
        {screen==="cover" && (
          <CoverScreen onEnter={() => setScreen("landing")}/>
        )}
        {screen==="sharedRecipe" && (
          <SharedRecipeScreen
            shareId={sharedRecipeId}
            me={me}
            editableBooks={myEditableBooks}
            onAddToBook={addSharedRecipeToBook}
            onClose={() => setScreen("landing")}
          />
        )}
        {screen==="guide" && (
          <GuideScreen onBack={() => window.history.back()}/>
        )}

        {screen==="landing" && (
          <LandingScreen
            recipes={recipes}
            bookName={activeBook?.name}
            onBooks={() => { setBooksEntryPhase("list"); goTo("books"); }}
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
            onDeleteIngredients={deleteIngredients}
            initialFilterRecipeId={organizeFilter.recipeId}
            initialAlertTypes={organizeFilter.alertTypes}
            initialManageAggs={organizeFilter.manageAggs}
            initialManageCats={organizeFilter.manageCats}
            initialAggScope={organizeFilter.aggScope}
            onBack={organizeOrigin ? () => setScreen(organizeOrigin) : undefined}
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
                infoContent={guideOrganizza}
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
            onDelete={deleteBook}
            onAddMember={addMember}
            onRemoveMember={removeMember}
            onChangeMemberPermission={changeMemberPermission}
            onCopyRecipes={copyRecipesToBook}
            onExportCode={exportShareCode}
            onExportPDF={(ids) => exportRecipesPDFByIds(ids)}
            onDownloadBackup={downloadLocalBackup}
            onRestoreBackup={restoreBackup}
            initialPhase={booksEntryPhase}
            defaultBookId={defaultBookId}
            onSetDefault={(id) => { setDefaultBookId(id); setDefaultBook(me, id); }}
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
            onExport={openBookExport}
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
            onExport={openBookExport}
          />
        )}
        {screen==="memories" && (
          <MemoriesBookScreen
            recipes={recipes}
            onBack={() => window.history.back()}
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
            onBack={() => window.history.back()}
            onSelect={(t) => { setBookTheme(t); setScreen("cover"); }}
          />
        )}
        {screen==="addRecipeHub" && (
          <AddRecipeHubScreen
            onBack={() => window.history.back()}
            onManual={() => { setScanDraft(null); setScanDraftPendingId(null); setScreen("new"); }}
            onScan={(mode) => { setScanMode(mode || "camera"); setScreen("scan"); }}
            onLink={() => setScreen("addFromLink")}
            onLanding={() => setScreen("landing")}
            onRecipes={() => setScreen("recipes")}
            onBook={() => setScreen("book")}
            onMemories={() => setScreen("memories")}
            onAdd={(type) => type==="memory" ? openAddMemory() : setScreen("addRecipeHub")}
            onFridge={() => setScreen("fridge")}
            onShopping={() => setScreen("shoppingList")}
            pendingExtractions={pendingExtractions}
            onOpenPending={openPendingExtraction}
            onDiscardPending={discardPendingExtraction}
            onImportCode={importShareCode}
          />
        )}
        {screen==="new" && (
          <NewRecipeScreen
            onBack={() => { setScanDraft(null); setScanDraftPendingId(null); setScreen("addRecipeHub"); }}
            onSave={(d) => {
              if (scanDraftPendingId) { discardPendingExtraction(scanDraftPendingId); }
              setScanDraft(null); setScanDraftPendingId(null);
              saveNewRecipe(d);
            }}
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
            onBack={() => window.history.back()}
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
            onBack={() => window.history.back()}
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
            onShareLink={shareRecipeViaLink}
          />
        )}
        {screen==="edit" && currentRecipe && (
          <EditScreen
            recipe={currentRecipe}
            onBack={() => window.history.back()}
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
            mode={scanMode}
            onBack={() => window.history.back()}
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
            onBack={() => window.history.back()}
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

      <div className="iphone-desktop-hint" style={{ display:"flex", gap:16, color:bookTheme.appFaded, fontFamily:"sans-serif", fontSize:12, flexWrap:"wrap", justifyContent:"center" }}>
        <span>📕 Tocca la copertina</span>
        <span>🍝 Ricette · 📖 Libro · 📸 Ricordi</span>
        <span>🔍 Cerca · ⭐ Preferiti · 🎨 Temi</span>
      </div>
    </div>
    </NavCtx.Provider>
    </ThemeCtx.Provider>
    </OnlineCtx.Provider>
    </BetaEnabledCtx.Provider>
    </RoleCtx.Provider>
    </ScanExtractionProvider>
    </CookingTimersProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGate>
        {(user, role, defaultBookId, betaEnabled, timerAlerts) => <AppInner me={user.email} role={role} initialDefaultBookId={defaultBookId} betaEnabled={betaEnabled} initialTimerAlerts={timerAlerts}/>}
      </AuthGate>
    </ErrorBoundary>
  );
}
