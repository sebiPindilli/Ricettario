// Token font/colore per gli stili PDF — unica fonte di verità condivisa tra
// la generazione vera del PDF (pdfCss in ricettario-v23.jsx) e l'anteprima
// nel popup di esportazione (UnifiedExportFlow.jsx), così i due non possono
// disallinearsi in silenzio.
export const PDF_STYLES = {
  classico: { label:"Classico", bodyFont:"Georgia, serif", uiFont:"sans-serif", ink:"#1a1a1a", faded:"#666", accent:"#8B4520", accent2:"#B8973A", paper:"#ffffff", cardBg:"#fafaf8", border:"#ddd", borderLight:"#eee" },
  minimal:  { label:"Minimal",  bodyFont:"'Helvetica Neue', Arial, sans-serif", uiFont:"'Helvetica Neue', Arial, sans-serif", ink:"#111111", faded:"#666666", accent:"#111111", accent2:"#999999", paper:"#ffffff", cardBg:"#f7f7f7", border:"#ddd", borderLight:"#eee" },
  moderno:  { label:"Moderno",  bodyFont:"'Segoe UI', system-ui, sans-serif", uiFont:"'Segoe UI', system-ui, sans-serif", ink:"#20232a", faded:"#6b7280", accent:"#D9603B", accent2:"#D9603B", paper:"#ffffff", cardBg:"#fdf6f2", border:"#eee", borderLight:"#f2e4de" },
};

// Layout alternativi per il corpo ricetta nel PDF — indipendenti dallo
// stile (colore/font): ogni layout usa i token dello stile scelto
// (vedi pdfCss/.q-* in src/utils/pdfEngine.js), quindi le due scelte si
// combinano liberamente invece di essere legate come nel mockup originale.
export const PDF_LAYOUTS = {
  classico: { label:"Classico", desc:"Titolo centrato, ingredienti e passi in colonna unica — l'impaginazione originale" },
  quaderno: { label:"Quaderno", desc:"Titolo e foto affiancati, ingredienti e passi su due colonne" },
};

// ══════════════════════════════════════════════════════════════
// PdfTemplateConfig — forma unica e serializzabile che guida il motore di
// generazione (src/utils/pdfEngine.js), pensata per essere salvabile come
// template personalizzato (allowlist/{email}.pdfTemplates, vedi bookStore/
// authStore) e per una futura anteprima live che chiami lo stesso motore.
//
//   { id, name, builtIn,
//     colors: { accent, ink, paper, accent2, faded, cardBg, border, borderLight },
//     fonts:  { heading, body, ui },              // stringhe CSS font-family pronte all'uso
//     fontIds:{ heading, body } | undefined,       // id in PDF_FONTS — solo per i template
//                                                   // personalizzati: serve a sapere quali
//                                                   // famiglie incorporare all'export (vedi
//                                                   // embedPdfFontFaces in data/pdfFonts.js).
//                                                   // Assente per i preset predefiniti: sono
//                                                   // font di sistema, nulla da incorporare.
//     layoutId: "classico" | "quaderno",
//     onePerPage, textSize, margins, photoSize }
//
// I 3 stili di oggi restano gli 8 token colore e le stringhe font ESATTE
// (non ri-derivate): resolveTemplateConfig li traduce in un config
// equivalente, verificato byte-per-byte contro l'output pre-esistente.
// ══════════════════════════════════════════════════════════════

export const PDF_TEXT_SIZES = {
  compatto: { label: "Compatto", scale: 0.88 },
  normale:  { label: "Normale",  scale: 1 },
  ampio:    { label: "Ampio",    scale: 1.15 },
};
export const PDF_MARGIN_SIZES = {
  compatto: { label: "Compatti", scale: 0.7 },
  normale:  { label: "Normali",  scale: 1 },
  ampio:    { label: "Ampi",     scale: 1.4 },
};
export const PDF_PHOTO_SIZES = {
  compatto: { label: "Piccole",  scale: 0.75 },
  normale:  { label: "Normali",  scale: 1 },
  ampio:    { label: "Grandi",   scale: 1.3 },
};

// Palette curate — scelta rapida in alternativa ai 3 colori liberi. Le
// prime 3 corrispondono esattamente ai 3 stili predefiniti, per coerenza
// visiva tra "scegli uno stile pronto" e "parti da una palette".
export const PDF_PALETTES = [
  { id: "terracotta", label: "Terracotta",  accent: "#8B4520", ink: "#1a1a1a", paper: "#ffffff" },
  { id: "nero",       label: "Nero su bianco", accent: "#111111", ink: "#111111", paper: "#ffffff" },
  { id: "corallo",    label: "Corallo",     accent: "#D9603B", ink: "#20232a", paper: "#ffffff" },
  { id: "salvia",     label: "Salvia",      accent: "#5B7553", ink: "#22281f", paper: "#fdfdf8" },
  { id: "blu-notte",  label: "Blu notte",   accent: "#2E4374", ink: "#1c2333", paper: "#ffffff" },
  { id: "bordeaux",   label: "Bordeaux",    accent: "#7A2B3A", ink: "#241417", paper: "#fffaf7" },
  { id: "senape",     label: "Senape",      accent: "#B8892B", ink: "#2b2418", paper: "#fffdf6" },
];

// Default dei toggle di contenuto. note/times/servings/source erano già
// mostrati incondizionatamente prima di questa fase: di default restano
// attivi, così un export senza preferenze esplicite appare identico a
// prima. tags/comments non comparivano affatto nel PDF: di default
// restano disattivi, per non far apparire di sorpresa contenuti (es.
// commenti personali) che finora non finivano mai in un PDF condiviso.
export const DEFAULT_PDF_CONTENT = {
  includeDishPhoto: true, includeStepPhotos: true, includeNutrition: false, includeMemories: false,
  includeIndex: true, includeSubsectionNames: true,
  includeNote: true, includeTimes: true, includeServings: true, includeSource: true,
  includeTags: false, includeComments: false,
};

// Campi sempre inclusi in ogni export, non disattivabili: titolo,
// ingredienti, passi. Da mostrare esplicitamente in UI come "sempre
// inclusi" (Fase 6) e non semplicemente omessi dall'elenco dei toggle,
// perché altrimenti sembrerebbero mancanti/non disponibili.
export const PDF_ALWAYS_INCLUDED = ["title", "ingredients", "steps"];

// Adatta le opzioni "piatte" storiche (opts.style/opts.layout, vedi
// exportRecipesPDF in ricettario-v23.jsx) in un PdfTemplateConfig completo.
// opts.template, se presente, ha sempre la precedenza: è la via che userà
// la Fase 6 per passare un template personalizzato già risolto.
export const resolveTemplateConfig = (opts = {}) => {
  if (opts.template) {
    // Il layout resta sempre una scelta indipendente dal template (come
    // per gli stili predefiniti sotto): opts.layout, se specificato,
    // prevale sul layoutId salvato nel template.
    return { ...opts.template, layoutId: opts.layout === "quaderno" ? "quaderno" : (opts.layout === "classico" ? "classico" : opts.template.layoutId) };
  }
  const s = PDF_STYLES[opts.style] || PDF_STYLES.classico;
  return {
    id: opts.style || "classico", name: s.label, builtIn: true,
    colors: {
      accent: s.accent, ink: s.ink, paper: s.paper,
      accent2: s.accent2, faded: s.faded, cardBg: s.cardBg,
      border: s.border, borderLight: s.borderLight,
    },
    fonts: { heading: s.bodyFont, body: s.bodyFont, ui: s.uiFont },
    layoutId: opts.layout === "quaderno" ? "quaderno" : "classico",
    onePerPage: true,
    textSize: "normale", margins: "normale", photoSize: "normale",
  };
};
