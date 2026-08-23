// ══════════════════════════════════════════════════════════════
// MOTORE DI GENERAZIONE PDF — funzioni pure: (config, dati ricetta/e) → HTML.
// Nessuno stato React, nessuna lettura del DOM, nessuna chiamata a
// printHtmlDocument (quella resta in ricettario-v23.jsx: è meccanica di
// finestra/Blob, non generazione di contenuto). Separazione deliberata
// (Fase 1 del piano "personalizzazione export PDF", vedi conversazione):
// è la base sia per evitare regressioni durante quel lavoro sia perché
// una futura anteprima dal vivo potrà chiamare le stesse funzioni invece
// di aprire una scheda.
//
// Questa Fase 1 è un trasferimento a parità, non una riscrittura: il
// contenuto delle funzioni è quello già in uso, spostato qui verbatim
// (stessa logica, stessi risultati) — verificato con generazioni reali
// prima/dopo lo spostamento, non solo a occhio.
// ══════════════════════════════════════════════════════════════
import { MACRO_SECTIONS } from "../data/constants.js";
import { NUTRIENT_LABELS } from "../data/nutrition.js";
import { computeRecipeNutrition } from "./recipeNutrition.js";
import {
  sortSectionsAltroLast, stepPhotosOf, dishPhotoOf, fmtQty, ingredientToText,
} from "./helpers.js";

// ══════════════════════════════════════════════════════════════
// EXPORT PDF: foglio di stile condiviso da ogni export (singola ricetta,
// intero libro/selezione, pagine di copertina/indice/sezione, nutrizione,
// ricordi), parametrizzato sui token colore/font di PDF_STYLES
// (src/utils/pdfStyles.js — condiviso con l'anteprima in UnifiedExportFlow.jsx)
// invece di triplicare l'intero foglio di stile per ogni variante grafica.
// ══════════════════════════════════════════════════════════════
export const pdfCss = (t) => `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: ${t.bodyFont}; color: ${t.ink}; background: ${t.paper || "#fff"};
         max-width: 700px; margin: 0 auto;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .single { padding: 40px; }
  .page { page-break-before: always; page-break-after: always; break-before: page; break-after: page; padding: 40px; }
  /* Copertina/sezione — pagina intera, contenuto centrato verticalmente. Le
     proprietà di interruzione pagina sono ripetute (non solo ereditate da
     .page): alcuni motori di stampa (es. il servizio di stampa di sistema
     Android) le rispettano meno quando derivano da una combinazione di classi. */
  .cover, .secpage {
    page-break-before: always; page-break-after: always; break-before: page; break-after: page;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; text-align:center;
  }
  .cover .small { font-family: ${t.uiFont}; font-size: 12px; letter-spacing: 4px; color: ${t.accent2}; text-transform: uppercase; }
  .cover h1 { font-size: 44px; font-style: italic; margin: 10px 0 6px; }
  .cover .sub { font-size: 15px; color: ${t.faded}; font-style: italic; }
  .cover .orn, .secpage .orn { color: ${t.accent2}; font-size: 18px; margin: 26px 0; }
  .index h1 { font-size: 26px; font-style: italic; text-align: center; margin-bottom: 24px; }
  .index .sec { font-family: ${t.uiFont}; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: ${t.accent}; margin: 20px 0 8px; border-bottom: 1.5px solid ${t.borderLight}; padding-bottom: 4px; }
  .index .row { display:flex; align-items:baseline; font-size: 13px; padding: 4px 0; }
  .index .row .dots { flex:1; border-bottom: 1px dotted ${t.border}; margin: 0 8px; }
  .index .row .c { font-family: ${t.uiFont}; font-size: 11px; color: ${t.faded}; }
  .secpage .emoji { font-size: 80px; }
  .secpage h1 { font-size: 34px; font-style: italic; margin: 18px 0 8px; }
  .secpage .desc { font-size: 14px; color: ${t.faded}; font-style: italic; }
  .recipe { page-break-before: always; page-break-after: always; break-before: page; break-after: page; padding: 40px; }
  .recipe h1, .single h1 { font-size: 26px; font-style: italic; text-align: center; margin-bottom: 4px; }
  .source { text-align: center; font-size: 13px; color: ${t.faded}; margin-bottom: 12px; }
  .dish-photo { width: 170px; height: 128px; margin: 0 auto 14px; border: 1px solid ${t.border}; border-radius: 8px; overflow: hidden; background: ${t.cardBg}; }
  .dish-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .meta { display: flex; justify-content: center; gap: 20px; font-size: 12px; color: ${t.faded}; border-top: 1px solid ${t.border}; border-bottom: 1px solid ${t.border}; padding: 7px 0; margin-bottom: 14px; }
  .note { border: 1px solid ${t.border}; padding: 9px 13px; font-style: italic; font-size: 12.5px; color: ${t.faded}; margin-bottom: 14px; background: ${t.cardBg}; }
  h2 { font-family: ${t.uiFont}; font-size: 14px; text-align: center; letter-spacing: 2px; text-transform: uppercase; margin: 16px 0 9px; color: ${t.ink}; }
  .ing { font-size: 12.5px; line-height: 1.85; border-bottom: 1px solid ${t.borderLight}; padding: 2px 0; }
  .section-label { font-family: ${t.uiFont}; font-size: 10.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: ${t.accent}; margin: 9px 0 4px; }
  .step { display: flex; gap: 11px; margin-bottom: 11px; }
  .step-n { width: 22px; height: 22px; border-radius: 50%; background: ${t.accent}; color: #fff; display: flex; align-items: center; justify-content: center; font-family: ${t.uiFont}; font-size: 10.5px; font-weight: bold; flex-shrink: 0; margin-top: 2px; }
  .step-content { flex: 1; }
  .step-t { font-size: 12.5px; line-height: 1.6; }
  .step-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 7px; }
  .step-photo { width: 100%; height: 140px; object-fit: cover; border-radius: 7px; border: 1px solid ${t.border}; }
  .divider { text-align: center; color: ${t.accent2}; margin: 16px 0; font-size: 15px; }
  .nutri-row { display:flex; justify-content:space-between; font-size:12.5px; padding:3px 0; border-bottom:1px solid ${t.borderLight}; }
  .nutri-row.sub { padding-left:16px; font-size:11.5px; color:${t.faded}; }
  .memory { display:flex; gap:12px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid ${t.borderLight}; }
  .memory-photo { width:90px; height:70px; object-fit:cover; border-radius:8px; border:1px solid ${t.border}; flex-shrink:0; }
  .memory-caption { font-size:12.5px; font-style:italic; margin-bottom:3px; }
  .memory-story { font-size:11.5px; color:${t.faded}; line-height:1.5; margin-bottom:3px; }
  .memory-date { font-family: ${t.uiFont}; font-size:10px; color:${t.faded}; }
  @media print { .page, .recipe, .single { padding: 24px; } }

  /* ── Layout "Quaderno" (recipeBodyQuadernoHtml) — usa gli stessi token
     dello stile attivo, così funziona con Classico/Minimal/Moderno. ── */
  .q-head { display:flex; justify-content:space-between; align-items:baseline;
    font-family:${t.uiFont}; font-size:10.5px; letter-spacing:2.5px; text-transform:uppercase;
    color:${t.faded}; border-bottom:1px solid ${t.border}; padding-bottom:10px; margin-bottom:34px; }
  .q-top { display:flex; align-items:flex-start; gap:28px; }
  .q-kicker { font-family:${t.uiFont}; font-size:10.5px; letter-spacing:3px; text-transform:uppercase; color:${t.accent}; }
  .q-title { font-size:42px; font-style:italic; line-height:1.08; margin:10px 0 8px; font-weight:400; }
  .q-source { font-size:14px; font-style:italic; color:${t.faded}; }
  .q-photo { width:250px; height:188px; flex-shrink:0; background:${t.cardBg}; overflow:hidden; }
  .q-photo img { width:100%; height:100%; object-fit:cover; display:block; }
  .q-meta { display:flex; gap:26px; margin-top:26px; padding:12px 0;
    border-top:1px solid ${t.border}; border-bottom:1px solid ${t.border};
    font-family:${t.uiFont}; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:${t.faded}; }
  .q-cols { display:grid; grid-template-columns:246px 1fr; gap:40px; margin-top:32px; }
  .q-h { font-family:${t.uiFont}; font-size:11px; letter-spacing:3px; text-transform:uppercase;
    color:${t.accent}; margin-bottom:14px; }
  .q-sub { font-family:${t.uiFont}; font-size:10px; font-weight:bold; letter-spacing:1.5px;
    text-transform:uppercase; color:${t.faded}; margin:14px 0 4px; }
  .q-ing { display:flex; justify-content:space-between; gap:10px; font-size:13px; line-height:1.5;
    padding:7px 0; border-bottom:1px solid ${t.borderLight}; }
  .q-ing .qty { color:${t.faded}; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .q-ing .n { font-style:italic; color:${t.faded}; }
  .q-note { margin-top:20px; padding:14px 16px; background:${t.cardBg}; border-left:2px solid ${t.accent2};
    font-size:12px; font-style:italic; line-height:1.6; }
  .q-step { display:flex; gap:14px; margin-bottom:15px; break-inside:avoid; page-break-inside:avoid; }
  .q-step-n { font-size:26px; font-style:italic; color:${t.border}; line-height:1;
    width:34px; flex-shrink:0; text-align:right; }
  .q-step-t { font-size:13.5px; line-height:1.72; }
  .q-step-photos { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:9px; }
  .q-step-photos img { width:100%; height:104px; object-fit:cover; display:block; }
  .q-nutri { margin-top:14px; padding-top:14px; border-top:1px solid ${t.border}; }
  .q-nutri .row { display:flex; flex-wrap:wrap; gap:6px 18px; font-size:12px; }
  .q-foot { display:flex; justify-content:space-between; margin-top:22px; padding-top:12px;
    border-top:1px solid ${t.border}; font-family:${t.uiFont}; font-size:10px;
    letter-spacing:2px; text-transform:uppercase; color:${t.faded}; }
`;

// Sezione "Valori nutrizionali" (per porzione) — opzionale, riusa lo stesso
// motore di calcolo della scheda ricetta in app (computeRecipeNutrition,
// esportata da NutritionCard.jsx: un'unica implementazione, mai duplicata).
export const nutritionPdfHtml = (recipe, ctx) => {
  if (!ctx) return "";
  const n = computeRecipeNutrition(recipe, ctx.nutritionMap, ctx.equivalences, ctx.customFoods, ctx.ingredientDict, ctx.aggregates, ctx.sourceByIngredient, ctx.customUnits);
  if (!n || n.covered === 0) return "";
  const fmt = (v, dec) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10**dec) / 10**dec).replace(".", ",");
  return `
    <div class="divider">✦</div>
    <h2>Valori nutrizionali (per porzione)</h2>
    ${NUTRIENT_LABELS.map(({ key, label, unit, dec, sub }) => `<div class="nutri-row${sub?" sub":""}"><span>${label}</span><span>${fmt(n.perServing[key], dec)} ${unit}</span></div>`).join("")}
  `;
};

// Sezione "Ricordi" — opzionale, stessa struttura foto/didascalia/data della vista in app.
export const memoriesPdfHtml = (recipe) => {
  const mems = recipe.memories || [];
  if (mems.length === 0) return "";
  return `
    <div class="divider">✦</div>
    <h2>Ricordi</h2>
    ${mems.map(m => `
      <div class="memory">
        ${m.photoIsImage && m.photo ? `<img class="memory-photo" src="${m.photo}" alt="">` : ""}
        <div>
          ${m.caption ? `<div class="memory-caption">"${m.caption}"</div>` : ""}
          ${m.story ? `<div class="memory-story">${m.story}</div>` : ""}
          <div class="memory-date">📅 ${m.date || ""}</div>
        </div>
      </div>`).join("")}
  `;
};

// Corpo HTML di una singola ricetta — condiviso da export singolo ed export
// libro/selezione. opts governa cosa includere (vedi exportRecipesPDF).
export const recipeBodyPdfHtml = (recipe, opts, nutritionCtx) => {
  const isSec = (arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object" && "section" in arr[0];

  const flatIng = isSec(recipe.ingredients)
    ? recipe.ingredients.flatMap(s => s.section
        ? [opts.includeSubsectionNames ? `── ${s.section} ──` : null, ...s.items.map(ingredientToText)].filter(x => x !== null)
        : s.items.map(ingredientToText))
    : recipe.ingredients.map(ingredientToText);

  // Steps carry {text, photos}; section markers use {section:true}
  const flatSteps = isSec(recipe.steps)
    ? recipe.steps.flatMap(s => {
        const items = s.items.map(st => ({ text: typeof st === "string" ? st : st.text, photos: opts.includeStepPhotos ? stepPhotosOf(st) : [] }));
        return s.section && opts.includeSubsectionNames ? [{ sectionLabel: s.section }, ...items] : items;
      })
    : recipe.steps.map(st => ({ text: typeof st === "string" ? st : st.text, photos: opts.includeStepPhotos ? stepPhotosOf(st) : [] }));

  let n = 0;
  return `
    <h1>${recipe.title}</h1>
    ${recipe.source ? `<div class="source">Ricetta di ${recipe.source}</div>` : ""}
    ${opts.includeDishPhoto && dishPhotoOf(recipe) ? `<div class="dish-photo"><img src="${dishPhotoOf(recipe)}" alt="${recipe.title}"></div>` : ""}
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
    ${opts.includeNutrition ? nutritionPdfHtml(recipe, nutritionCtx) : ""}
    ${opts.includeMemories ? memoriesPdfHtml(recipe) : ""}
  `;
};

// Corpo ricetta per il layout "Quaderno" (opts.layout === "quaderno"):
// testatina, titolo+foto affiancati, ingredienti e passi su due colonne.
// Stessi opts/nutritionCtx di recipeBodyPdfHtml — indipendente dallo stile
// (colore/font), che resta quello scelto in opts.style.
export const recipeBodyQuadernoHtml = (recipe, opts, nutritionCtx, sectionLabel = "") => {
  const isSec = (arr) => Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object" && "section" in arr[0];

  // Nome a sinistra, quantità a destra (non ingredientToText, che le unisce
  // in una sola stringa). Gestisce anche ingredienti salvati come semplice
  // stringa (dati legacy), come fa già ingredientToText altrove.
  const ingRow = (ing) => {
    if (!ing || typeof ing === "string") return `<div class="q-ing"><span>${ing || ""}</span></div>`;
    const qty = [ing.qty != null ? fmtQty(ing.qty) : "", ing.unit || ""].filter(Boolean).join(" ").trim();
    return `<div class="q-ing"><span>${ing.name}${ing.note ? ` <span class="n">${ing.note}</span>` : ""}</span>` +
           `<span class="qty">${qty || "q.b."}</span></div>`;
  };
  const ingHtml = isSec(recipe.ingredients)
    ? recipe.ingredients.map(s =>
        (s.section && opts.includeSubsectionNames ? `<div class="q-sub">${s.section}</div>` : "") +
        s.items.map(ingRow).join("")).join("")
    : recipe.ingredients.map(ingRow).join("");

  let n = 0;
  const stepRow = (st) => {
    const text = typeof st === "string" ? st : st.text;
    const photos = opts.includeStepPhotos ? stepPhotosOf(st) : [];
    return `<div class="q-step"><div class="q-step-n">${++n}</div><div>` +
      `<div class="q-step-t">${text}</div>` +
      (photos.length ? `<div class="q-step-photos">${photos.map(p => `<img src="${p}" alt="">`).join("")}</div>` : "") +
      `</div></div>`;
  };
  const stepsHtml = isSec(recipe.steps)
    ? recipe.steps.map(s =>
        (s.section && opts.includeSubsectionNames ? `<div class="q-sub">${s.section}</div>` : "") +
        s.items.map(stepRow).join("")).join("")
    : recipe.steps.map(stepRow).join("");

  // Nutrizione: riga compatta in fondo alla colonna dei passi
  let nutriHtml = "";
  if (opts.includeNutrition && nutritionCtx) {
    const c = nutritionCtx;
    const nut = computeRecipeNutrition(recipe, c.nutritionMap, c.equivalences, c.customFoods,
      c.ingredientDict, c.aggregates, c.sourceByIngredient, c.customUnits);
    if (nut && nut.covered > 0) {
      const fmt = (v, dec) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10 ** dec) / 10 ** dec).replace(".", ",");
      nutriHtml = `<div class="q-nutri"><div class="q-sub">Per porzione</div><div class="row">` +
        NUTRIENT_LABELS.filter(l => !l.sub)
          .map(l => `<span>${l.label} <b>${fmt(nut.perServing[l.key], l.dec)} ${l.unit}</b></span>`).join("") +
        `</div></div>`;
    }
  }

  const dish = opts.includeDishPhoto && dishPhotoOf(recipe);
  return `
    <div class="q-head"><span>${sectionLabel}</span><span>${recipe.category || ""}</span></div>
    <div class="q-top">
      <div style="flex:1;min-width:0">
        <div class="q-kicker">${[recipe.category, ...(recipe.tags || []).slice(0, 1)].filter(Boolean).join(" · ")}</div>
        <h1 class="q-title">${recipe.title}</h1>
        ${recipe.source ? `<div class="q-source">Ricetta di ${recipe.source}</div>` : ""}
      </div>
      ${dish ? `<div class="q-photo"><img src="${dish}" alt="${recipe.title}"></div>` : ""}
    </div>
    <div class="q-meta">
      <span>Prep ${recipe.prepTime} min</span><span>Cottura ${recipe.cookTime} min</span><span>${recipe.servings} porzioni</span>
    </div>
    <div class="q-cols">
      <div>
        <div class="q-h">Ingredienti</div>
        ${ingHtml}
        ${recipe.note ? `<div class="q-note">${recipe.note}</div>` : ""}
      </div>
      <div>
        <div class="q-h">Preparazione</div>
        ${stepsHtml}
        ${nutriHtml}
      </div>
    </div>
    ${opts.includeMemories ? memoriesPdfHtml(recipe) : ""}
  `;
};

// Sceglie il generatore di corpo ricetta in base a opts.layout — unico
// punto che conosce questa scelta, riusato da entrambi i costruttori di
// documento sotto (prima duplicato tra exportRecipePDF/exportBookPDF).
const bodyRendererFor = (opts) => opts.layout === "quaderno" ? recipeBodyQuadernoHtml : recipeBodyPdfHtml;

// Documento HTML completo per l'export di una singola ricetta — stesso
// contenuto prodotto oggi da exportRecipePDF, meno l'apertura della
// finestra di stampa (resta lì: è meccanica di finestra, non di contenuto).
export const buildRecipeDocumentHtml = (recipe, t, opts, nutritionCtx) => {
  const body = bodyRendererFor(opts);
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${recipe.title}</title>
<style>${pdfCss(t)}</style>
</head>
<body>
  <div class="single">${body(recipe, opts, nutritionCtx)}</div>
</body>
</html>`;
};

// ══════════════════════════════════════════════════════════════
// EXPORT: più ricette in PDF — copertina + indice (opzionale) + pagine
// sezione + ricette. bookTitle riflette la selezione (nome del ricettario
// se è tutto, altrimenti "N ricette da «Nome»") — vedi exportRecipesPDF.
// ══════════════════════════════════════════════════════════════
export const buildBookDocumentHtml = async (recipesList, sections = MACRO_SECTIONS, bookTitle = "Il mio Ricettario", t, opts, nutritionCtx) => {
  const body = bodyRendererFor(opts);

  // Caricato solo quando serve (indice con numeri di pagina reali) e come
  // chunk separato (import dinamico, non in cima al file): senza questo, il
  // polyfill da ~500KB finirebbe nel bundle principale dell'app, scaricato
  // da OGNI utente a ogni avvio anche se non esporta mai un PDF con indice.
  // Percorso relativo diretto (non "pagedjs/...") perché il package.json di
  // pagedjs espone solo condizioni root nel campo "exports" (import/
  // require/browser/polyfill), nessun subpath — un import bare-specifier
  // verso "pagedjs/dist/..." verrebbe rifiutato dal resolver; un percorso
  // relativo bypassa del tutto la mappa "exports", leggendo il file diretto.
  // Due livelli sopra src/utils/ per arrivare alla radice del progetto
  // (questo file vive in src/utils/, non nella radice di src/ come prima).
  const pagedPolyfillJs = opts.includeIndex
    ? (await import("../../node_modules/pagedjs/dist/paged.polyfill.min.js?raw")).default
    : null;

  // Sezioni con almeno una ricetta, nell'ordine di MACRO_SECTIONS, ricette
  // in ordine alfabetico dentro ciascuna sezione
  const sectionsWithRecipes = sortSectionsAltroLast(sections)
    .map(sec => ({
      ...sec,
      recipes: recipesList.filter(r => r.macroSection === sec.id)
        .sort((a, b) => a.title.localeCompare(b.title, "it")),
    }))
    .filter(sec => sec.recipes.length > 0);

  // Stili legati a paged.js (numeri di pagina reali + barra di stato) DEVONO
  // stare nel <head>, non dentro <body>: paged.js sposta tutto il contenuto
  // di <body> in un <template> inerte PRIMA di estrarre i fogli di stile
  // (querySelectorAll non vede dentro un <template>), quindi qualunque
  // <style> lasciato tra i contenuti del body verrebbe semplicemente
  // ignorato — target-counter() resterebbe testo letterale, mai calcolato.
  // Verificato con una riproduzione minima isolata prima di questo fix.
  const pagedjsHeadCss = opts.includeIndex ? `
    .pagenum { font-family: ${t.uiFont}; font-size: 11px; color: ${t.faded}; text-decoration: none; }
    .pagenum::after { content: target-counter(attr(href), page); }
    @page { size: A4; margin: 18mm 16mm; }
    #pagedjs-status { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: ${t.ink}; color: #fff; padding: 14px; text-align: center; font-family: ${t.uiFont}; font-size: 13px; }
    #pagedjs-print-btn { padding: 9px 18px; border: none; border-radius: 8px; background: ${t.accent}; color: #fff; font-family: ${t.uiFont}; font-size: 13px; font-weight: 700; cursor: pointer; }
    @media print { #pagedjs-status { display: none !important; } }
  ` : "";

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${bookTitle}</title>
<style>${pdfCss(t)}${pagedjsHeadCss}</style>
</head>
<body>
  <!-- Copertina -->
  <div class="page cover">
    <div class="small">Le nostre ricette, i nostri ricordi</div>
    <h1>${bookTitle}</h1>
    <div class="orn">✦ ✦ ✦</div>
    <div class="sub">${recipesList.length} ricette</div>
  </div>

  <!-- Indice — i numeri di pagina (.pagenum) sono vuoti qui: li calcola
       paged.js dopo l'impaginazione vera, vedi target-counter() nel head. -->
  ${opts.includeIndex ? `
  <div class="page index">
    <h1>Indice</h1>
    ${sectionsWithRecipes.map(sec => `
      <div class="sec">${sec.emoji} ${sec.label}</div>
      ${sec.recipes.map(r => `
        <div class="row">
          <span class="t">${r.title}</span>
          <span class="dots"></span>
          <a class="pagenum" href="#recipe-${r.id}"></a>
        </div>`).join("")}
    `).join("")}
  </div>` : ""}

  <!-- Sezioni e ricette -->
  ${sectionsWithRecipes.map(sec => `
    <div class="page secpage">
      <div class="emoji">${sec.emoji}</div>
      <h1>${sec.label}</h1>
      <div class="desc">${sec.desc}</div>
      <div class="orn">✦ ✦ ✦</div>
    </div>
    ${sec.recipes.map(r => `<div class="recipe" id="recipe-${r.id}">${body(r, opts, nutritionCtx, sec.label)}</div>`).join("")}
  `).join("")}

  ${opts.includeIndex ? `
  <!-- Barra di stato impaginazione — MAI stampa automatica: un
       window.print() scattato da solo (in precedenza dentro
       PagedConfig.after) ha bloccato un'intera sessione del browser in
       test reali quando l'impaginazione di paged.js è stata più lenta del
       previsto (foto ricette ancora in caricamento). Ora l'utente vede lo
       stato e stampa quando decide lui/lei — mai a sorpresa. Nascosta in
       stampa (@media print) così non compare nel PDF vero.
  -->
  <div id="pagedjs-status">⏳ Sto impaginando il PDF, un momento…</div>
  <script>
    window.PagedConfig = { after: function () {
      var el = document.getElementById("pagedjs-status");
      if (!el) return;
      el.innerHTML = "";
      var btn = document.createElement("button");
      btn.id = "pagedjs-print-btn";
      btn.textContent = "🖨️ Stampa / Salva come PDF";
      btn.onclick = function () { window.print(); };
      el.appendChild(btn);
    } };
    // Rete di sicurezza: se l'impaginazione non finisce entro un tempo
    // ragionevole (contenuto molto pesante, foto che non caricano), un
    // messaggio esplicito batte un'attesa muta indefinita.
    setTimeout(function () {
      var el = document.getElementById("pagedjs-status");
      if (el && el.textContent.indexOf("impaginando") !== -1) {
        el.textContent = "⚠️ L'impaginazione sta impiegando più del previsto — controlla la connessione (le foto potrebbero non essere ancora caricate) o riprova con meno ricette.";
      }
    }, 45000);
  </script>
  <script>${pagedPolyfillJs}</script>
  ` : ""}
</body>
</html>`;
};
