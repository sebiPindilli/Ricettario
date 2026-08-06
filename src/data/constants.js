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
};

// Condizione @media per "telefono vero" (non il mockup desktop), sia in
// verticale che ruotato in orizzontale — riusata identica da IPhone
// (ricettario-v23.jsx), GlobalNav e BetaButton, così un domani basta
// aggiornarla qui invece che in tre punti separati (com'era prima).
export const MOBILE_BREAKPOINT_CSS = "(max-width: 480px), (max-height: 480px) and (orientation: landscape)";

// ── Macro sections ────────────────────────────────────────────
export const MACRO_SECTIONS = [
  { id:"basi",   label:"Preparazioni Base", emoji:"🧱", desc:"Salse, brodi, impasti e tecniche fondamentali" },
  { id:"salati", label:"Salati",            emoji:"🍝", desc:"Primi, secondi, contorni e antipasti" },
  { id:"dolci",  label:"Dolci",             emoji:"🍰", desc:"Torte, biscotti, dessert e lievitati" },
  { id:"altro",  label:"Altro",             emoji:"📦", desc:"Ricette senza sezione specifica" },
];

// Icone per sezioni e categorie personalizzate
export const PICKER_EMOJIS = [
  "🧱","🍝","🍰","📦","🥘","🍲","🥗","🍕","🍔","🥪","🌮","🍜",
  "🍛","🍤","🥧","🍮","🍩","🧁","🍪","🥐","🥖","🫕","🍷","🍹",
  "☕","🍵","🧃","🥤","🍭","🍬","🎂","🍾","🥂","🧊","🔥","⭐",
];

// ── Categorie ingredienti (per Svuota Frigo) ───────────────────
// Ogni ingrediente può appartenere a più categorie.
export const INGREDIENT_CATEGORIES = [
  { id:"base",      label:"Ingredienti base",              emoji:"🧂" },
  { id:"cereali",   label:"Cereali e tuberi",              emoji:"🌾" },
  { id:"ortofrutta",label:"Frutta e ortaggi",              emoji:"🥕" },
  { id:"proteine",  label:"Carne, pesce, uova",            emoji:"🥩" },
  { id:"latticini", label:"Latte e derivati",              emoji:"🧀" },
  { id:"legumi",    label:"Legumi",                        emoji:"🫘" },
  { id:"grassi",    label:"Grassi e oli",                  emoji:"🫒" },
  { id:"spezie",    label:"Spezie, erbe aromatiche e aromi",emoji:"🌿" },
  { id:"alcolici",  label:"Alcolici",                      emoji:"🍷" },
  { id:"cacao",     label:"Cacao e cioccolato",            emoji:"🍫" },
  { id:"altro",     label:"Altro",                         emoji:"📦" },
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
    group:"Tempo",
    tags:["Meno di 30 min","30-60 min","Più di 1 ora"],
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

// ── Book themes ────────────────────────────────────────────────
export const BOOK_THEMES = [
  { id:"classic",    name:"Classico",      desc:"Il tuo raccoglitore originale",   preview:"⬛",
    coverBg:"linear-gradient(160deg,#2e2e2e 0%,#1a1a1a 45%,#252525 100%)", coverText:"rgba(255,255,255,0.88)", coverAccent:"rgba(184,151,58,0.5)", spineColor:"rgba(255,255,255,0.05)", pageColor:"#f5f5f5",
    appBg:"#FAF7F0", appCard:"#F7F2E8", appBorder:"#EDE6D4", appInk:"#2C2416", appFaded:"#7A6E5F", appAccent:"#C4593A", appAccent2:"#B8973A",
    bookBg:"#FFFFFF", bookBorder:"#ddd", bookInk:"#1A1A1A", bookFaded:"#555", bookNote:"#f5f5f5", bookNoteBorder:"#ccc" },
  { id:"linen",      name:"Lino Grezzo",   desc:"Tessuto naturale color sabbia",   preview:"🟫",
    coverBg:"linear-gradient(160deg,#c8b89a 0%,#a89070 45%,#b8a080 100%)", coverText:"rgba(44,28,10,0.9)", coverAccent:"rgba(100,70,30,0.5)", spineColor:"rgba(0,0,0,0.08)", pageColor:"#faf6ef",
    appBg:"#F5EFE3", appCard:"#EDE4D2", appBorder:"#D9CDB8", appInk:"#3A2810", appFaded:"#7A6040", appAccent:"#8B5A2B", appAccent2:"#A07840",
    bookBg:"#FDFAF4", bookBorder:"#D9CDB8", bookInk:"#3A2810", bookFaded:"#7A6040", bookNote:"#EDE4D2", bookNoteBorder:"#C8B898" },
  { id:"forest",     name:"Verde Foresta", desc:"Eleganza botanica",               preview:"🟩",
    coverBg:"linear-gradient(160deg,#2d4a2d 0%,#1a3020 45%,#253d25 100%)", coverText:"rgba(220,240,220,0.9)", coverAccent:"rgba(140,200,100,0.4)", spineColor:"rgba(255,255,255,0.04)", pageColor:"#f4f9f4",
    appBg:"#F0F7F0", appCard:"#E4F0E4", appBorder:"#C8DCC8", appInk:"#1A301A", appFaded:"#4A6A4A", appAccent:"#2D6A2D", appAccent2:"#5A8C3A",
    bookBg:"#F8FCF8", bookBorder:"#C8DCC8", bookInk:"#1A301A", bookFaded:"#4A6A4A", bookNote:"#E4F0E4", bookNoteBorder:"#A8C8A8" },
  { id:"bordeaux",   name:"Bordeaux",      desc:"Caldo e sofisticato",             preview:"🟥",
    coverBg:"linear-gradient(160deg,#5c1a1a 0%,#3d0f0f 45%,#4a1515 100%)", coverText:"rgba(255,230,220,0.9)", coverAccent:"rgba(200,120,80,0.5)", spineColor:"rgba(255,255,255,0.04)", pageColor:"#fff8f6",
    appBg:"#FDF5F3", appCard:"#F5E8E4", appBorder:"#E0C8C0", appInk:"#3A0F0F", appFaded:"#7A4A40", appAccent:"#8B1A1A", appAccent2:"#C87850",
    bookBg:"#FFFAF8", bookBorder:"#E0C8C0", bookInk:"#3A0F0F", bookFaded:"#7A4A40", bookNote:"#F5E8E4", bookNoteBorder:"#C8A090" },
  { id:"navy",       name:"Blu Notte",     desc:"Classico marinaro",               preview:"🟦",
    coverBg:"linear-gradient(160deg,#0f1f3d 0%,#071428 45%,#0d1a35 100%)", coverText:"rgba(200,220,255,0.9)", coverAccent:"rgba(100,150,220,0.45)", spineColor:"rgba(255,255,255,0.04)", pageColor:"#f5f8ff",
    appBg:"#F0F4FF", appCard:"#E4ECFF", appBorder:"#C0D0F0", appInk:"#071428", appFaded:"#3A5080", appAccent:"#1A3A7A", appAccent2:"#3A60B0",
    bookBg:"#F8FAFF", bookBorder:"#C0D0F0", bookInk:"#071428", bookFaded:"#3A5080", bookNote:"#E4ECFF", bookNoteBorder:"#A0B8E0" },
  { id:"rose",       name:"Rosa Antico",   desc:"Delicato e romantico",            preview:"🩷",
    coverBg:"linear-gradient(160deg,#8b4a5c 0%,#6b2a3c 45%,#7d3a4e 100%)", coverText:"rgba(255,230,235,0.9)", coverAccent:"rgba(220,150,170,0.5)", spineColor:"rgba(255,255,255,0.05)", pageColor:"#fff5f7",
    appBg:"#FFF0F4", appCard:"#F8E4EC", appBorder:"#E8C8D4", appInk:"#3A1020", appFaded:"#7A4A58", appAccent:"#8B2A44", appAccent2:"#C87890",
    bookBg:"#FFFAFC", bookBorder:"#E8C8D4", bookInk:"#3A1020", bookFaded:"#7A4A58", bookNote:"#F8E4EC", bookNoteBorder:"#D8A8B8" },
  { id:"marble",     name:"Marmo Bianco",  desc:"Minimal e raffinato",             preview:"🤍",
    coverBg:"linear-gradient(135deg,#f0ece8 0%,#d8d0c8 30%,#e8e0d8 60%,#c8c0b8 100%)", coverText:"rgba(40,35,30,0.85)", coverAccent:"rgba(80,70,60,0.3)", spineColor:"rgba(0,0,0,0.06)", pageColor:"#fdfcfb",
    appBg:"#FAFAF8", appCard:"#F5F3F0", appBorder:"#E5E0D8", appInk:"#282520", appFaded:"#6A6560", appAccent:"#4A4540", appAccent2:"#8A8070",
    bookBg:"#FEFEFE", bookBorder:"#E5E0D8", bookInk:"#282520", bookFaded:"#6A6560", bookNote:"#F5F3F0", bookNoteBorder:"#D0C8C0" },
  { id:"terracotta", name:"Terracotta",    desc:"Caldo come la cucina italiana",   preview:"🟧",
    coverBg:"linear-gradient(160deg,#a0522d 0%,#7a3a1a 45%,#8b4820 100%)", coverText:"rgba(255,240,225,0.92)", coverAccent:"rgba(230,180,100,0.5)", spineColor:"rgba(255,255,255,0.06)", pageColor:"#fff9f4",
    appBg:"#FFF5EC", appCard:"#F8E8D8", appBorder:"#E8CDB0", appInk:"#3A1A08", appFaded:"#7A4A28", appAccent:"#A0522D", appAccent2:"#C88040",
    bookBg:"#FFFCF8", bookBorder:"#E8CDB0", bookInk:"#3A1A08", bookFaded:"#7A4A28", bookNote:"#F8E8D8", bookNoteBorder:"#D8B890" },
  { id:"lavender",   name:"Lavanda",       desc:"Provenzale e aromatico",          preview:"🟣",
    coverBg:"linear-gradient(160deg,#5a4a7a 0%,#3d2f5c 45%,#4e3f6e 100%)", coverText:"rgba(235,225,255,0.92)", coverAccent:"rgba(180,150,230,0.5)", spineColor:"rgba(255,255,255,0.05)", pageColor:"#faf8ff",
    appBg:"#F5F0FF", appCard:"#EDE4FF", appBorder:"#D4C4F0", appInk:"#250F50", appFaded:"#5A4A80", appAccent:"#5A3A9A", appAccent2:"#8060C0",
    bookBg:"#FBF8FF", bookBorder:"#D4C4F0", bookInk:"#250F50", bookFaded:"#5A4A80", bookNote:"#EDE4FF", bookNoteBorder:"#B8A0D8" },
  { id:"midnight",   name:"Mezzanotte",    desc:"Profondo e misterioso",           preview:"🌑",
    coverBg:"linear-gradient(160deg,#0a0a1a 0%,#050510 45%,#080818 100%)", coverText:"rgba(180,180,255,0.85)", coverAccent:"rgba(100,100,220,0.4)", spineColor:"rgba(255,255,255,0.03)", pageColor:"#f8f8ff",
    appBg:"#F0F0FF", appCard:"#E4E4F8", appBorder:"#C8C8E8", appInk:"#08081A", appFaded:"#404070", appAccent:"#2020A0", appAccent2:"#5050C0",
    bookBg:"#FAFAFF", bookBorder:"#C8C8E8", bookInk:"#08081A", bookFaded:"#404070", bookNote:"#E4E4F8", bookNoteBorder:"#A8A8D0" },
  { id:"olive",      name:"Verde Oliva",   desc:"Mediterraneo e rustico",          preview:"🫒",
    coverBg:"linear-gradient(160deg,#4a4a1a 0%,#2e2e0a 45%,#3d3d12 100%)", coverText:"rgba(235,235,180,0.9)", coverAccent:"rgba(180,180,80,0.45)", spineColor:"rgba(255,255,255,0.04)", pageColor:"#fafdf0",
    appBg:"#F5F8E8", appCard:"#ECF2D8", appBorder:"#D4E0B0", appInk:"#202808", appFaded:"#5A6030", appAccent:"#4A5818", appAccent2:"#7A8830",
    bookBg:"#FDFFF8", bookBorder:"#D4E0B0", bookInk:"#202808", bookFaded:"#5A6030", bookNote:"#ECF2D8", bookNoteBorder:"#B8CC88" },
  { id:"cream",      name:"Crema & Oro",   desc:"Luminoso e prezioso",             preview:"🌟",
    coverBg:"linear-gradient(160deg,#c8a84b 0%,#9a7a2a 45%,#b8982e 100%)", coverText:"rgba(255,250,220,0.95)", coverAccent:"rgba(255,240,150,0.5)", spineColor:"rgba(255,255,255,0.08)", pageColor:"#fffdf0",
    appBg:"#FFFCE8", appCard:"#FFF5C8", appBorder:"#E8D890", appInk:"#2A2000", appFaded:"#6A5820", appAccent:"#8A6800", appAccent2:"#C0A030",
    bookBg:"#FFFEF5", bookBorder:"#E8D890", bookInk:"#2A2000", bookFaded:"#6A5820", bookNote:"#FFF5C8", bookNoteBorder:"#D0B860" },
];

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
