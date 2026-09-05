// ══════════════════════════════════════════════════════════════
// MOTORE DI GENERAZIONE PDF — funzioni pure: (config, dati ricetta/e) → HTML.
// Nessuno stato React, nessuna lettura del DOM, nessuna chiamata a
// printHtmlDocument (quella resta in ricettario-v23.jsx: è meccanica di
// finestra/Blob, non generazione di contenuto). Separazione deliberata —
// base sia per evitare regressioni durante la personalizzazione dell'export
// sia perché una futura anteprima dal vivo potrà chiamare le stesse
// funzioni invece di aprire una scheda.
//
// Guidato da un PdfTemplateConfig (vedi pdfStyles.js): i 3 stili storici
// restano riprodotti byte-per-byte (resolveTemplateConfig non ri-deriva i
// loro token, li passa esatti) — verificato con confronto diretto
// dell'HTML generato prima/dopo l'introduzione della config.
// ══════════════════════════════════════════════════════════════
import { MACRO_SECTIONS } from "../data/constants.js";
import { NUTRIENT_LABELS } from "../data/nutrition.js";
import { computeRecipeNutrition } from "./recipeNutrition.js";
import { PDF_TEXT_SIZES, PDF_MARGIN_SIZES, PDF_PHOTO_SIZES } from "./pdfStyles.js";
import { embedPdfFontFaces } from "../data/pdfFonts.js";
import {
  sortSectionsAltroLast, stepPhotosOf, dishPhotoOf, fmtQty, ingredientToText,
} from "./helpers.js";

// Arrotonda a 2 decimali — con scale=1 (i 3 stili storici, vedi
// resolveTemplateConfig) restituisce n identico all'originale, anche per i
// valori con virgola (es. 12.5): n*1*100/100 === n esattamente in virgola
// mobile per questi valori, nessuna deriva rispetto all'HTML pre-esistente.
const px = (n, scale) => Math.round(n * scale * 100) / 100;

// ══════════════════════════════════════════════════════════════
// EXPORT PDF: foglio di stile condiviso da ogni export (singola ricetta,
// intero libro/selezione, pagine di copertina/indice/sezione, nutrizione,
// ricordi, tag, commenti), parametrizzato sui colori/font del template e
// sulle 3 taglie testo/margini/foto — invece di triplicare l'intero foglio
// di stile per ogni combinazione.
// ══════════════════════════════════════════════════════════════
export const pdfCss = (template) => {
  const t = template.colors;
  const f = template.fonts;
  const ts = PDF_TEXT_SIZES[template.textSize]?.scale ?? 1;
  const ms = PDF_MARGIN_SIZES[template.margins]?.scale ?? 1;
  const ps = PDF_PHOTO_SIZES[template.photoSize]?.scale ?? 1;
  const recipeBreak = template.onePerPage === false ? "" :
    "page-break-before: always; page-break-after: always; break-before: page; break-after: page;";

  return `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: ${f.body}; color: ${t.ink}; background: ${t.paper || "#fff"};
         max-width: 700px; margin: 0 auto;
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1, .q-title { font-family: ${f.heading}; }
  .single { padding: ${px(40, ms)}px; }
  .page { page-break-before: always; page-break-after: always; break-before: page; break-after: page; padding: ${px(40, ms)}px; }
  /* Copertina/sezione — pagina intera, contenuto centrato verticalmente. Le
     proprietà di interruzione pagina sono ripetute (non solo ereditate da
     .page): alcuni motori di stampa (es. il servizio di stampa di sistema
     Android) le rispettano meno quando derivano da una combinazione di classi. */
  .cover, .secpage {
    page-break-before: always; page-break-after: always; break-before: page; break-after: page;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; text-align:center;
  }
  .cover .small { font-family: ${f.ui}; font-size: ${px(12, ts)}px; letter-spacing: 4px; color: ${t.accent2}; text-transform: uppercase; }
  .cover h1 { font-size: ${px(44, ts)}px; font-style: italic; margin: 10px 0 6px; }
  .cover .sub { font-size: ${px(15, ts)}px; color: ${t.faded}; font-style: italic; }
  .cover .orn, .secpage .orn { color: ${t.accent2}; font-size: ${px(18, ts)}px; margin: 26px 0; }
  .index h1 { font-size: ${px(26, ts)}px; font-style: italic; text-align: center; margin-bottom: 24px; }
  .index .sec { font-family: ${f.ui}; font-size: ${px(13, ts)}px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: ${t.accent}; margin: 20px 0 8px; border-bottom: 1.5px solid ${t.borderLight}; padding-bottom: 4px; }
  .index .row { display:flex; align-items:baseline; font-size: ${px(13, ts)}px; padding: 4px 0; }
  .index .row .dots { flex:1; border-bottom: 1px dotted ${t.border}; margin: 0 8px; }
  .index .row .c { font-family: ${f.ui}; font-size: ${px(11, ts)}px; color: ${t.faded}; }
  .secpage .emoji { font-size: ${px(80, ts)}px; }
  .secpage h1 { font-size: ${px(34, ts)}px; font-style: italic; margin: 18px 0 8px; }
  .secpage .desc { font-size: ${px(14, ts)}px; color: ${t.faded}; font-style: italic; }
  .recipe { ${recipeBreak} padding: ${px(40, ms)}px; }
  .recipe h1, .single h1 { font-size: ${px(26, ts)}px; font-style: italic; text-align: center; margin-bottom: 4px; }
  .source { text-align: center; font-size: ${px(13, ts)}px; color: ${t.faded}; margin-bottom: 12px; }
  .dish-photo { width: ${px(170, ps)}px; height: ${px(128, ps)}px; margin: 0 auto 14px; border: 1px solid ${t.border}; border-radius: 8px; overflow: hidden; background: ${t.cardBg}; }
  .dish-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .meta { display: flex; justify-content: center; gap: 20px; font-size: ${px(12, ts)}px; color: ${t.faded}; border-top: 1px solid ${t.border}; border-bottom: 1px solid ${t.border}; padding: 7px 0; margin-bottom: 14px; }
  .note { border: 1px solid ${t.border}; padding: 9px 13px; font-style: italic; font-size: ${px(12.5, ts)}px; color: ${t.faded}; margin-bottom: 14px; background: ${t.cardBg}; }
  h2 { font-family: ${f.ui}; font-size: ${px(14, ts)}px; text-align: center; letter-spacing: 2px; text-transform: uppercase; margin: 16px 0 9px; color: ${t.ink}; }
  .ing { font-size: ${px(12.5, ts)}px; line-height: 1.85; border-bottom: 1px solid ${t.borderLight}; padding: 2px 0; }
  .section-label { font-family: ${f.ui}; font-size: ${px(10.5, ts)}px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: ${t.accent}; margin: 9px 0 4px; }
  .step { display: flex; gap: 11px; margin-bottom: 11px; }
  .step-n { width: 22px; height: 22px; border-radius: 50%; background: ${t.accent}; color: #fff; display: flex; align-items: center; justify-content: center; font-family: ${f.ui}; font-size: ${px(10.5, ts)}px; font-weight: bold; flex-shrink: 0; margin-top: 2px; }
  .step-content { flex: 1; }
  .step-t { font-size: ${px(12.5, ts)}px; line-height: 1.6; }
  .step-photos { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-top: 7px; }
  .step-photo { width: 100%; height: ${px(140, ps)}px; object-fit: cover; border-radius: 7px; border: 1px solid ${t.border}; }
  .divider { text-align: center; color: ${t.accent2}; margin: 16px 0; font-size: ${px(15, ts)}px; }
  .nutri-row { display:flex; justify-content:space-between; font-size:${px(12.5, ts)}px; padding:3px 0; border-bottom:1px solid ${t.borderLight}; }
  .nutri-row.sub { padding-left:16px; font-size:${px(11.5, ts)}px; color:${t.faded}; }
  .memory { display:flex; gap:12px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid ${t.borderLight}; }
  .memory-photo { width:${px(90, ps)}px; height:${px(70, ps)}px; object-fit:cover; border-radius:8px; border:1px solid ${t.border}; flex-shrink:0; }
  .memory-caption { font-size:${px(12.5, ts)}px; font-style:italic; margin-bottom:3px; }
  .memory-story { font-size:${px(11.5, ts)}px; color:${t.faded}; line-height:1.5; margin-bottom:3px; }
  .memory-date { font-family: ${f.ui}; font-size:${px(10, ts)}px; color:${t.faded}; }
  .tags-row { display:flex; flex-wrap:wrap; gap:6px; }
  .tag-pill { font-family: ${f.ui}; font-size:${px(10.5, ts)}px; padding:4px 10px; border-radius:12px; background:${t.cardBg}; border:1px solid ${t.border}; color:${t.faded}; }
  .comment { margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid ${t.borderLight}; }
  .comment-text { font-size:${px(12.5, ts)}px; line-height:1.6; }
  .comment-date { font-family: ${f.ui}; font-size:${px(10, ts)}px; color:${t.faded}; margin-top:3px; }
  @media print { .page, .recipe, .single { padding: ${px(24, ms)}px; } }

  /* ── Layout "Quaderno" (recipeBodyQuadernoHtml) — usa gli stessi token
     del template attivo. ── */
  .q-head { display:flex; justify-content:space-between; align-items:baseline;
    font-family:${f.ui}; font-size:${px(10.5, ts)}px; letter-spacing:2.5px; text-transform:uppercase;
    color:${t.faded}; border-bottom:1px solid ${t.border}; padding-bottom:10px; margin-bottom:34px; }
  .q-top { display:flex; align-items:flex-start; gap:28px; }
  .q-kicker { font-family:${f.ui}; font-size:${px(10.5, ts)}px; letter-spacing:3px; text-transform:uppercase; color:${t.accent}; }
  .q-title { font-size:${px(42, ts)}px; font-style:italic; line-height:1.08; margin:10px 0 8px; font-weight:400; }
  .q-source { font-size:${px(14, ts)}px; font-style:italic; color:${t.faded}; }
  .q-photo { width:${px(250, ps)}px; height:${px(188, ps)}px; flex-shrink:0; background:${t.cardBg}; overflow:hidden; }
  .q-photo img { width:100%; height:100%; object-fit:cover; display:block; }
  .q-meta { display:flex; gap:26px; margin-top:26px; padding:12px 0;
    border-top:1px solid ${t.border}; border-bottom:1px solid ${t.border};
    font-family:${f.ui}; font-size:${px(11, ts)}px; letter-spacing:1.5px; text-transform:uppercase; color:${t.faded}; }
  .q-cols { display:grid; grid-template-columns:246px 1fr; gap:40px; margin-top:32px; }
  .q-h { font-family:${f.ui}; font-size:${px(11, ts)}px; letter-spacing:3px; text-transform:uppercase;
    color:${t.accent}; margin-bottom:14px; }
  .q-sub { font-family:${f.ui}; font-size:${px(10, ts)}px; font-weight:bold; letter-spacing:1.5px;
    text-transform:uppercase; color:${t.faded}; margin:14px 0 4px; }
  .q-ing { display:flex; justify-content:space-between; gap:10px; font-size:${px(13, ts)}px; line-height:1.5;
    padding:7px 0; border-bottom:1px solid ${t.borderLight}; }
  .q-ing .qty { color:${t.faded}; font-variant-numeric:tabular-nums; white-space:nowrap; }
  .q-ing .n { font-style:italic; color:${t.faded}; }
  .q-note { margin-top:20px; padding:14px 16px; background:${t.cardBg}; border-left:2px solid ${t.accent2};
    font-size:${px(12, ts)}px; font-style:italic; line-height:1.6; }
  .q-step { display:flex; gap:14px; margin-bottom:15px; break-inside:avoid; page-break-inside:avoid; }
  .q-step-n { font-size:${px(26, ts)}px; font-style:italic; color:${t.border}; line-height:1;
    width:34px; flex-shrink:0; text-align:right; }
  .q-step-t { font-size:${px(13.5, ts)}px; line-height:1.72; }
  .q-step-photos { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:9px; }
  .q-step-photos img { width:100%; height:${px(104, ps)}px; object-fit:cover; display:block; }
  .q-nutri { margin-top:14px; padding-top:14px; border-top:1px solid ${t.border}; }
  .q-nutri .row { display:flex; flex-wrap:wrap; gap:6px 18px; font-size:${px(12, ts)}px; }
  .q-foot { display:flex; justify-content:space-between; margin-top:22px; padding-top:12px;
    border-top:1px solid ${t.border}; font-family:${f.ui}; font-size:${px(10, ts)}px;
    letter-spacing:2px; text-transform:uppercase; color:${t.faded}; }
`;
};

// Sezione "Valori nutrizionali" (per porzione) — opzionale, riusa lo stesso
// motore di calcolo della scheda ricetta in app (computeRecipeNutrition,
// esportata da NutritionCard.jsx: un'unica implementazione, mai duplicata).
export const nutritionPdfHtml = (recipe, ctx) => {
  if (!ctx) return "";
  const n = computeRecipeNutrition(recipe, ctx.nutritionMap, ctx.equivalences, ctx.customFoods, ctx.ingredientDict, ctx.aggregates, ctx.sourceByIngredient, ctx.customUnits);
  if (!n || n.covered === 0) return "";
  const fmt = (v, dec) => v >= 100 ? String(Math.round(v)) : String(Math.round(v * 10**dec) / 10**dec).replace(".", ",");
  const fmtN = (key, dec) => n.incomplete?.[key] ? "n/d" : fmt(n.perServing[key], dec);
  return `
    <div class="divider">✦</div>
    <h2>Valori nutrizionali (per porzione)</h2>
    ${NUTRIENT_LABELS.map(({ key, label, unit, dec, sub }) => `<div class="nutri-row${sub?" sub":""}"><span>${label}</span><span>${fmtN(key, dec)} ${unit}</span></div>`).join("")}
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

// Sezione "Tag" — opzionale, non mostrata nel PDF prima di questa fase.
export const tagsPdfHtml = (recipe) => {
  const tags = recipe.tags || [];
  if (tags.length === 0) return "";
  return `
    <div class="divider">✦</div>
    <h2>Tag</h2>
    <div class="tags-row">${tags.map(t => `<span class="tag-pill">${t}</span>`).join("")}</div>
  `;
};

// Sezione "Commenti" — opzionale, non mostrata nel PDF prima di questa fase.
export const commentsPdfHtml = (recipe) => {
  const comments = recipe.comments || [];
  if (comments.length === 0) return "";
  return `
    <div class="divider">✦</div>
    <h2>Commenti</h2>
    ${comments.map(c => `
      <div class="comment">
        <div class="comment-text">${c.text}</div>
        <div class="comment-date">${c.date}${c.edited ? ` (modificato ${c.edited})` : ""}</div>
      </div>`).join("")}
  `;
};

// Corpo HTML di una singola ricetta — condiviso da export singolo ed export
// libro/selezione. opts governa cosa includere (vedi exportRecipesPDF).
// Titolo, ingredienti e passi sono sempre inclusi (vedi PDF_ALWAYS_INCLUDED
// in pdfStyles.js); tutto il resto è un toggle esplicito in opts.
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

  const metaParts = [];
  if (opts.includeTimes) metaParts.push(`Prep: ${recipe.prepTime} min`, `Cottura: ${recipe.cookTime} min`);
  if (opts.includeServings) metaParts.push(`${recipe.servings} porzioni`);

  let n = 0;
  return `
    <h1>${recipe.title}</h1>
    ${opts.includeSource && recipe.source ? `<div class="source">Ricetta di ${recipe.source}</div>` : ""}
    ${opts.includeDishPhoto && dishPhotoOf(recipe) ? `<div class="dish-photo"><img src="${dishPhotoOf(recipe)}" alt="${recipe.title}"></div>` : ""}
    ${metaParts.length > 0 ? `<div class="meta">${metaParts.map(p => `<span>${p}</span>`).join(`<span>·</span>`)}</div>` : ""}
    ${opts.includeNote && recipe.note ? `<div class="note">${recipe.note}</div>` : ""}
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
    ${opts.includeTags ? tagsPdfHtml(recipe) : ""}
    ${opts.includeComments ? commentsPdfHtml(recipe) : ""}
  `;
};

// Corpo ricetta per il layout "Quaderno" (opts.layout === "quaderno"):
// testatina, titolo+foto affiancati, ingredienti e passi su due colonne.
// Stessi opts/nutritionCtx di recipeBodyPdfHtml — indipendente dal template
// colore/font, che resta quello passato a buildRecipeDocumentHtml/buildBookDocumentHtml.
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
      const fmtN = (key, dec) => nut.incomplete?.[key] ? "n/d" : fmt(nut.perServing[key], dec);
      nutriHtml = `<div class="q-nutri"><div class="q-sub">Per porzione</div><div class="row">` +
        NUTRIENT_LABELS.filter(l => !l.sub)
          .map(l => `<span>${l.label} <b>${fmtN(l.key, l.dec)} ${l.unit}</b></span>`).join("") +
        `</div></div>`;
    }
  }

  const dish = opts.includeDishPhoto && dishPhotoOf(recipe);
  const metaParts = [];
  if (opts.includeTimes) metaParts.push(`Prep ${recipe.prepTime} min`, `Cottura ${recipe.cookTime} min`);
  if (opts.includeServings) metaParts.push(`${recipe.servings} porzioni`);

  return `
    <div class="q-head"><span>${sectionLabel}</span><span>${recipe.category || ""}</span></div>
    <div class="q-top">
      <div style="flex:1;min-width:0">
        <div class="q-kicker">${[recipe.category, ...(recipe.tags || []).slice(0, 1)].filter(Boolean).join(" · ")}</div>
        <h1 class="q-title">${recipe.title}</h1>
        ${opts.includeSource && recipe.source ? `<div class="q-source">Ricetta di ${recipe.source}</div>` : ""}
      </div>
      ${dish ? `<div class="q-photo"><img src="${dish}" alt="${recipe.title}"></div>` : ""}
    </div>
    ${metaParts.length > 0 ? `<div class="q-meta">${metaParts.map(p => `<span>${p}</span>`).join("")}</div>` : ""}
    <div class="q-cols">
      <div>
        <div class="q-h">Ingredienti</div>
        ${ingHtml}
        ${opts.includeNote && recipe.note ? `<div class="q-note">${recipe.note}</div>` : ""}
      </div>
      <div>
        <div class="q-h">Preparazione</div>
        ${stepsHtml}
        ${nutriHtml}
      </div>
    </div>
    ${opts.includeMemories ? memoriesPdfHtml(recipe) : ""}
    ${opts.includeTags ? tagsPdfHtml(recipe) : ""}
    ${opts.includeComments ? commentsPdfHtml(recipe) : ""}
  `;
};

// Sceglie il generatore di corpo ricetta in base al layout del template —
// unico punto che conosce questa scelta, riusato da entrambi i costruttori
// di documento sotto.
const bodyRendererFor = (template) => template.layoutId === "quaderno" ? recipeBodyQuadernoHtml : recipeBodyPdfHtml;

// Incorpora (se il template ne specifica, vedi PdfTemplateConfig in
// pdfStyles.js) le famiglie @fontsource selezionate come @font-face inline
// — mai per i preset predefiniti (font di sistema, fontIds assente).
const fontFacesFor = async (template) => {
  if (!template.fontIds) return "";
  const ids = Object.values(template.fontIds).filter(Boolean);
  if (ids.length === 0) return "";
  return embedPdfFontFaces(ids);
};

// Documento HTML completo per l'export di una singola ricetta — meno
// l'apertura della finestra di stampa (resta in ricettario-v23.jsx: è
// meccanica di finestra, non di contenuto).
export const buildRecipeDocumentHtml = async (recipe, template, opts, nutritionCtx) => {
  const body = bodyRendererFor(template);
  const fontFaces = await fontFacesFor(template);
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${recipe.title}</title>
<style>${fontFaces}${pdfCss(template)}</style>
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
export const buildBookDocumentHtml = async (recipesList, sections = MACRO_SECTIONS, bookTitle = "Il mio Ricettario", template, opts, nutritionCtx) => {
  const body = bodyRendererFor(template);
  const t = template.colors;
  const f = template.fonts;
  const ts = PDF_TEXT_SIZES[template.textSize]?.scale ?? 1;

  const [fontFaces, pagedPolyfillJs] = await Promise.all([
    fontFacesFor(template),
    // Caricato solo quando serve (indice con numeri di pagina reali) e come
    // chunk separato (import dinamico, non in cima al file): senza questo, il
    // polyfill da ~500KB finirebbe nel bundle principale dell'app, scaricato
    // da OGNI utente a ogni avvio anche se non esporta mai un PDF con indice.
    // Percorso relativo diretto (non "pagedjs/...") perché il package.json di
    // pagedjs espone solo condizioni root nel campo "exports" (import/
    // require/browser/polyfill), nessun subpath — un import bare-specifier
    // verso "pagedjs/dist/..." verrebbe rifiutato dal resolver; un percorso
    // relativo bypassa del tutto la mappa "exports", leggendo il file diretto.
    // Due livelli sopra src/utils/ per arrivare alla radice del progetto.
    opts.includeIndex
      ? import("../../node_modules/pagedjs/dist/paged.polyfill.min.js?raw").then(m => m.default)
      : Promise.resolve(null),
  ]);

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
    .pagenum { font-family: ${f.ui}; font-size: ${px(11, ts)}px; color: ${t.faded}; text-decoration: none; }
    .pagenum::after { content: target-counter(attr(href), page); }
    @page { size: A4; margin: 18mm 16mm; }
    #pagedjs-status { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: ${t.ink}; color: #fff; padding: 14px; text-align: center; font-family: ${f.ui}; font-size: 13px; }
    #pagedjs-print-btn { padding: 9px 18px; border: none; border-radius: 8px; background: ${t.accent}; color: #fff; font-family: ${f.ui}; font-size: 13px; font-weight: 700; cursor: pointer; }
    @media print { #pagedjs-status { display: none !important; } }
  ` : "";

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>${bookTitle}</title>
<style>${fontFaces}${pdfCss(template)}${pagedjsHeadCss}</style>
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
