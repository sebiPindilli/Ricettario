// ══════════════════════════════════════════════════════════════
// Costanti di configurazione (design tokens, sezioni, categorie,
// tag, temi, opzioni dei picker), estratte da ricettario-v23.jsx.
// Nessuna di queste usa React o JSX.
// ══════════════════════════════════════════════════════════════

// ── Design tokens ──────────────────────────────────────────────
export const T = {
  // App UI (warm ivory shell)
  ivory:      "#F7F2E8",
  ivoryDark:  "#EDE6D4",
  paper:      "#FAF7F0",
  ink:        "#2C2416",
  inkFaded:   "#7A6E5F",
  terracotta: "#C4593A",
  sage:       "#6B8C6E",
  gold:       "#B8973A",
  cream:      "#F0E8D0",
  shadow:     "rgba(44,36,22,0.13)",
  // Book mode (faithful to the real book)
  bookBg:     "#FFFFFF",
  bookText:   "#1A1A1A",
  bookMeta:   "#444444",
  bookNote:   "#555555",
};

export const F = {
  display: "'Georgia','Times New Roman',serif",
  body:    "'Georgia',serif",
  ui:      "'Helvetica Neue',Arial,sans-serif",
  book:    "'Arial','Helvetica',sans-serif",
  // Quantità e numeri negli stili "quaderno"/"schedario": allineati a
  // destra, larghezza fissa per cifra così le colonne si leggono a scorrimento.
  mono:    "ui-monospace, Consolas, monospace",
};

// Condizione @media per "telefono vero" (non il mockup desktop), sia in
// verticale che ruotato in orizzontale — riusata identica da IPhone
// (ricettario-v23.jsx), GlobalNav e BetaButton, così un domani basta
// aggiornarla qui invece che in tre punti separati (com'era prima).
export const MOBILE_BREAKPOINT_CSS = "(max-width: 480px), (max-height: 480px) and (orientation: landscape)";

// Aspect ratio fisso per il ritaglio della foto principale (PhotoCropOverlay)
// — coerente con i contenitori 4:3-ish già usati nei vari punti di
// visualizzazione (card libro, book page, PDF), che assorbono la piccola
// differenza residua con object-fit:cover.
export const DISH_PHOTO_ASPECT = 4 / 3;

// ── Macro sections ────────────────────────────────────────────
// icon: nome nel set SVG (public/app-icons.svg) usato quando l'admin attiva
// lo stile "svg" (vedi IconStyleCtx/AppIcon.jsx) — solo per queste 4 voci
// predefinite. Una sezione aggiunta dall'utente (vedi SectionPicker.jsx)
// non ha un campo icon: resta sempre l'emoji scelta liberamente.
export const MACRO_SECTIONS = [
  { id:"basi",   label:"Preparazioni Base", emoji:"🧱", icon:"basi",   desc:"Salse, brodi, impasti e tecniche fondamentali" },
  { id:"salati", label:"Salati",            emoji:"🍝", icon:"salati", desc:"Primi, secondi, contorni e antipasti" },
  { id:"dolci",  label:"Dolci",             emoji:"🍰", icon:"dolci",  desc:"Torte, biscotti, dessert e lievitati" },
  { id:"altro",  label:"Altro",             emoji:"📦", icon:"altro",  desc:"Ricette senza sezione specifica" },
];

// Icone per sezioni e categorie personalizzate
export const PICKER_EMOJIS = [
  "🧱","🍝","🍰","📦","🥘","🍲","🥗","🍕","🍔","🥪","🌮","🍜",
  "🍛","🍤","🥧","🍮","🍩","🧁","🍪","🥐","🥖","🫕","🍷","🍹",
  "☕","🍵","🧃","🥤","🍭","🍬","🎂","🍾","🥂","🧊","🔥","⭐",
];

// ── Categorie ingredienti (per Svuota Frigo) ───────────────────
// Ogni ingrediente può appartenere a più categorie.
// icon: come in MACRO_SECTIONS sopra — solo per le voci predefinite.
export const INGREDIENT_CATEGORIES = [
  { id:"base",      label:"Ingredienti base",              emoji:"🧂", icon:"sale" },
  { id:"cereali",   label:"Cereali e tuberi",              emoji:"🌾", icon:"cereali" },
  { id:"ortofrutta",label:"Frutta e ortaggi",              emoji:"🥕", icon:"ortofrutta" },
  { id:"proteine",  label:"Carne, pesce, uova",            emoji:"🥩", icon:"proteine" },
  { id:"latticini", label:"Latte e derivati",              emoji:"🧀", icon:"latticini" },
  { id:"legumi",    label:"Legumi",                        emoji:"🫘", icon:"legumi" },
  { id:"grassi",    label:"Grassi e oli",                  emoji:"🫒", icon:"grassi" },
  { id:"spezie",    label:"Spezie, erbe aromatiche e aromi",emoji:"🌿", icon:"spezie" },
  { id:"alcolici",  label:"Alcolici",                      emoji:"🍷", icon:"alcolici" },
  { id:"cacao",     label:"Cacao e cioccolato",            emoji:"🍫", icon:"cacao" },
  { id:"altro",     label:"Altro",                         emoji:"📦", icon:"altro" },
];

// ── Gruppi allergie/preferenze alimentari standard ──────────────
// I 14 allergeni a dichiarazione obbligatoria UE (Reg. 1169/2011,
// Allegato II) più Vegetariano/Vegano a ETICHETTA INVERTITA: il gruppo
// elenca gli ingredienti da ESCLUDERE per rispettare la preferenza (es.
// "Vegetariano" contiene carne e pesce, non gli ingredienti ammessi),
// coerente con la semantica di esclusione già usata dal filtro ricette.
// Usati per dare un'etichetta/emoji di default quando un gruppo standard
// viene creato la prima volta da un suggerimento (vedi
// findAllergenGroupSuggestionsFromDb in utils/aggregates.js) — l'utente
// può poi rinominarli/eliminarli liberamente come un gruppo qualsiasi.
export const ALLERGEN_GROUP_DEFS = [
  { id:"glutine",       label:"Glutine",                          emoji:"🌾" },
  { id:"crostacei",     label:"Crostacei",                        emoji:"🦐" },
  { id:"uova",          label:"Uova",                             emoji:"🥚" },
  { id:"pesce",         label:"Pesce",                            emoji:"🐟" },
  { id:"arachidi",      label:"Arachidi",                         emoji:"🥜" },
  { id:"soia",          label:"Soia",                             emoji:"🫘" },
  { id:"latte",         label:"Latte e lattosio",                 emoji:"🥛" },
  { id:"frutta_guscio", label:"Frutta a guscio",                  emoji:"🌰" },
  { id:"sedano",        label:"Sedano",                           emoji:"🥬" },
  { id:"senape",        label:"Senape",                           emoji:"🫙" },
  { id:"sesamo",        label:"Semi di sesamo",                   emoji:"⚪" },
  { id:"solfiti",       label:"Anidride solforosa e solfiti",     emoji:"🍷" },
  { id:"lupini",        label:"Lupini",                           emoji:"🫛" },
  { id:"molluschi",     label:"Molluschi",                        emoji:"🐚" },
  { id:"vegetariano",   label:"Vegetariano (esclude carne e pesce)", emoji:"🥕" },
  { id:"vegano",        label:"Vegano (esclude anche derivati animali)", emoji:"🌱" },
];

// ── Structured tag system ──────────────────────────────────────
export const TAG_GROUPS = [
  {
    group:"Tipo di cibo",
    tags:["Vegetariano","Vegano","Carne","Pesce","Uova e latticini","Pasta","Riso","Legumi","Zuppe"],
  },
  {
    group:"Occasione",
    tags:["Quotidiano","Cena tra amici","Occasioni speciali","Pranzo domenicale","Buffet","Picnic","Natale","Pasqua"],
  },
  {
    group:"Stagione",
    tags:["Primavera","Estate","Autunno","Inverno","Tutto l'anno"],
  },
  {
    group:"Metodo di cottura",
    tags:["Forno","Padella","Pentola","Vapore","Crudo","Fritta","Grigliata"],
  },
  {
    group:"Difficoltà",
    tags:["Semplice","Media","Elaborata"],
  },
  {
    group:"Origine",
    tags:["Italiana","Regionale","Internazionale","Di famiglia"],
  },
  {
    group:"Altro",
    tags:["Classici","Senza glutine","Senza lattosio","Light","Avanzato","Bimby"],
  },
];

export const ALL_PRESET_TAGS = TAG_GROUPS.flatMap(g => g.tags);

// ── Pagina "libro" (facsimile di carta) ─────────────────────────────────
// Unico set neutro, indipendente dalla palette: BookViewScreen/RecipeCardBook/
// BookPageView restano un facsimile di carta "esente dal restyling" (vedi
// Fase 6, PALETTE.md). Prima erano quasi identici in tutti i 12 BOOK_THEMES
// (bianco/quasi nero) — qui sono fissati una volta per tutte, valori presi
// dal vecchio tema "classic".
export const BOOK_PAGE = {
  bookBg:"#FFFFFF", bookBorder:"#ddd", bookInk:"#1A1A1A", bookFaded:"#555", bookNote:"#f5f5f5", bookNoteBorder:"#ccc",
};

// ── Emoji organised by food category ──────────────────────────
export const EMOJI_CATEGORIES = [
  {
    label: "Italiani",
    emojis: ["🍝","🍕","🍜","🫕","🥟","🧆","🍞","🥐","🫓","🥨","🧀","🫙"],
  },
  {
    label: "Carne & Pesce",
    emojis: ["🥩","🍗","🍖","🥓","🌭","🍔","🦐","🐟","🦑","🦞","🦀","🥚"],
  },
  {
    label: "Verdure & Base",
    emojis: ["🥗","🥬","🥦","🥕","🧅","🧄","🫑","🍅","🍆","🥑","🫛","🌽"],
  },
  {
    label: "Zuppe & Stufati",
    emojis: ["🍲","🥣","🍜","🫕","🥘","🍛","🫙","🧆","🫔","🌮","🌯","🥙"],
  },
  {
    label: "Etnici",
    emojis: ["🍣","🍱","🥡","🍤","🍙","🍚","🥮","🍢","🫔","🌮","🥗","🧆"],
  },
  {
    label: "Dolci",
    emojis: ["🍰","🎂","🧁","🍩","🍪","🍫","🍮","🍭","🍬","🍯","🧇","🥧"],
  },
  {
    label: "Bevande & Altro",
    emojis: ["☕","🍵","🧃","🍷","🧋","🍹","🥂","🫖","🍾","🧊","🍋","🫐"],
  },
];

// Flat list for places that still need it (scan screen picker)
export const EMOJI_OPTIONS = EMOJI_CATEGORIES.flatMap(c => c.emojis);
export const COLOR_OPTIONS = [
  "#C4593A","#9B5E3A","#8B6046","#B8973A",
  "#6B8C6E","#4A7A6B","#5B7FA6","#7B61FF",
  "#8B5E8B","#C47A3A","#3A7A8B","#8B3A3A",
];

// Unità suggerite di default (singolari e plurali comuni)
export const DEFAULT_UNIT_SUGGESTIONS = [
  "g","kg","ml","l","cl","dl",
  "cucchiai","cucchiaio","cucchiaini","cucchiaino",
  "tazze","tazza","bicchieri","bicchiere",
  "bustine","bustina","pizzico","spicchi","spicchio","q.b.",
];
