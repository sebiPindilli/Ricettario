// ══════════════════════════════════════════════════════════════
// Stili di interfaccia — struttura, densità e forma.
//
// I COLORI restano quelli del tema (BOOK_THEMES, vedi ThemeCtx): qui non
// si dichiara nessun colore di marca. Uno stile decide *come* è fatta
// l'interfaccia (card o filetto, nav in alto o in basso, filtri aperti o
// dietro un pulsante, emoji o SVG), il tema decide di che colore è.
//
// Uso:
//   const ui = useUiStyle();            // token risolti (tema + stile)
//   ui.id                                // "classico" | "quaderno" | "schedario"
//   ui.navPosition                       // "top" | "bottom"
//   ui.hairline                          // colore filetto derivato dal tema
//
// Vedi design_handoff_ui_styles/README.md per la corrispondenza con i mockup.
// ══════════════════════════════════════════════════════════════

// Mescola due colori esadecimali (#rrggbb) con peso t su `b`.
const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a), [br, bg, bb] = p(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
};

// Trasparenza su un colore pieno del tema (per pastiglie e riempimenti tenui).
export const alpha = (hex, a) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};

export const UI_STYLES = [
  {
    id: "classico",
    name: "Classico",
    desc: "L'interfaccia di sempre",
    icons: "config",          // segue l'interruttore admin (IconStyleCtx)
    navPosition: "top",       // barra scura a due righe, come oggi
    navTone: "dark",
    filters: "expanded",      // sezioni, tag e tempo sempre visibili
    listRow: "card",          // RecipeCardList attuale
    surface: "card",          // card con ombra
    shadow: "0 2px 8px rgba(0,0,0,0.05)",
    radius: { card: 16, control: 12, chip: 20, tile: 12 },
    padX: 20,
    rowGap: 10,
    rowHeight: 76,
    listIcon: { size: 46, iconSize: 22, fill: "solid" }, // pastiglia colore pieno
    quantities: "inline",     // "200 g Farina" dentro la riga
    bullet: true,             // il ✦ negli ingredienti
    dividers: "ornament",     // Divider con ✦
    sectionLabel: { size: 10, spacing: 1.5, weight: 700 },
    uppercaseButtons: false,
  },
  {
    id: "quaderno",
    name: "Quaderno",
    desc: "Filetti e tipografia, niente card",
    icons: "svg",
    navPosition: "bottom",
    navTone: "light",
    filters: "sheet",
    listRow: "rule",
    surface: "plain",
    shadow: "none",
    radius: { card: 0, control: 13, chip: 11, tile: 12 },
    padX: 24,
    rowGap: 0,
    rowHeight: 72,
    listIcon: { size: 42, iconSize: 22, fill: "tint" },   // fondo colore @12%
    quantities: "right",      // nome a sinistra, quantità in F.mono a destra
    bullet: false,
    dividers: "hairline",
    sectionLabel: { size: 9.5, spacing: 2, weight: 700 },
    uppercaseButtons: true,
    // Ritocchi di fondo: schiarisce lo sfondo del tema per dare aria.
    bgTint: 0.35,             // verso il bianco
    cardTint: 0,
  },
  {
    id: "schedario",
    name: "Schedario",
    desc: "Card piatte, dati con icone",
    icons: "svg",
    navPosition: "bottom",
    navTone: "dark",
    filters: "sheet",
    listRow: "card",
    surface: "flat",          // card con un solo bordo, nessuna ombra
    shadow: "none",
    radius: { card: 14, control: 11, chip: 9, tile: 10 },
    padX: 18,
    rowGap: 10,
    rowHeight: 84,
    listIcon: { size: 60, iconSize: 24, fill: "photo" },  // foto o segnaposto
    quantities: "right",
    bullet: false,
    dividers: "hairline",
    sectionLabel: { size: 9.5, spacing: 1.8, weight: 700 },
    uppercaseButtons: false,
    bgTint: 0.15,
    cardTint: 0.6,            // card più chiare del fondo
  },
];

export const DEFAULT_UI_STYLE_ID = "classico";
export const isUiStyleId = (id) => UI_STYLES.some(s => s.id === id);

// Unisce tema e stile nei token che i componenti leggono davvero.
// `theme` è una voce di BOOK_THEMES (l'oggetto restituito da useTheme()).
export function resolveUiStyle(theme, styleId = DEFAULT_UI_STYLE_ID) {
  const style = UI_STYLES.find(s => s.id === styleId) || UI_STYLES[0];
  const bg = style.bgTint ? mix(theme.appBg, "#ffffff", style.bgTint) : theme.appBg;
  const card = style.cardTint ? mix(theme.appCard, "#ffffff", style.cardTint) : theme.appCard;
  return {
    ...style,
    // colori risolti — usare QUESTI nei componenti, non theme.* direttamente,
    // così un cambio di stile non richiede di toccare ogni schermata.
    bg,
    card,
    border: theme.appBorder,
    hairline: mix(bg, theme.appBorder, 0.6),          // filetto di riga
    hairlineStrong: theme.appBorder,                   // separatore di sezione
    ink: theme.appInk,
    faded: theme.appFaded,
    muted: mix(theme.appFaded, bg, 0.45),              // maiuscoletti tenui
    accent: theme.appAccent,
    accent2: theme.appAccent2,
    ok: "#6B8C6E",
    danger: "#D93025",
    // superfici pronte all'uso
    cardStyle:
      style.surface === "plain"
        ? { background: "transparent", border: "none", borderRadius: 0, boxShadow: "none" }
        : {
            background: card,
            border: `1px solid ${theme.appBorder}`,
            borderRadius: style.radius.card,
            boxShadow: style.shadow,
          },
  };
}
