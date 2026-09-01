// ══════════════════════════════════════════════════════════════
// Stili di interfaccia — struttura, densità e forma.
//
// I COLORI restano quelli della palette scelta (vedi data/palettes.js e
// buildTheme() più sotto): qui non si dichiara nessun colore di marca. Uno
// stile decide *come* è fatta l'interfaccia (card o filetto, nav in alto o
// in basso, filtri aperti o dietro un pulsante, emoji o SVG), la palette
// decide di che colore è.
//
// Uso:
//   const ui = useUiStyle();            // token risolti (tema + stile)
//   ui.id                                // "classico" | "quaderno" | "schedario"
//   ui.navPosition                       // "top" | "bottom"
//   ui.hairline                          // colore filetto derivato dal tema
//
// Ogni fase del piano ha il suo punto di scelta qui sotto (ui.header,
// ui.dialogTabs, ui.timer, ui.fields, ui.iconPicker, ui.formSections,
// ui.exportFlow, ui.booksLayout, ui.tables/ui.stripe): se un componente
// non legge il token della sua fase, quella fase non è fatta.
//
// Vedi design_handoff_ui_styles/README.md e PALETTE.md per la corrispondenza
// con i mockup.
// ══════════════════════════════════════════════════════════════

import { colori } from "./palettes.js";
import { BOOK_PAGE } from "./constants.js";

// Mescola due colori esadecimali (#rrggbb) con peso t su `b`.
const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a), [br, bg, bb] = p(b);
  const c = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
};

// Schiarisce un colore di un numero fisso di punti di luminosità percettuale
// (scala HSL 0-100), non di una percentuale verso il bianco: una percentuale
// fissa sposta pochissimo un colore già quasi bianco ma stravolge un colore
// scuro (bug corretto in Fase 6 — vedi bgTint/cardTint sotto). Un ΔL fisso
// ha invece un effetto proporzionato in entrambe le direzioni, stessa logica
// già usata per navBg in PALETTE.md ("ΔL −11 chiaro / +9 scuro").
const hexToHsl = (hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
};
const hslToHex = (h, s, l) => {
  h /= 360; s /= 100; l /= 100;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return s === 0
    ? `#${toHex(l)}${toHex(l)}${toHex(l)}`
    : `#${toHex(hue2rgb(p, q, h + 1 / 3))}${toHex(hue2rgb(p, q, h))}${toHex(hue2rgb(p, q, h - 1 / 3))}`;
};
const lighten = (hex, deltaL) => {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + deltaL)));
};

// Trasparenza su un colore pieno del tema (per pastiglie e riempimenti tenui).
export const alpha = (hex, a) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};

// "Bianco" per le chrome sempre scure (th.darkChrome.bg): mai 255,255,255
// puro (legge "argento", piatto in ogni palette) — darkChrome.ink è già il
// chiaro del set scuro della palette scelta, quindi è la tinta giusta da
// usare per icone/etichette/separatori semi-trasparenti su quelle barre.
export const chromeWhite = (theme, a) => alpha(theme.darkChrome.ink, a);

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
    // ── punti di scelta per le fasi 6-11 ──
    navPad: "10px 6px 24px",  // barra in basso (classico non la usa)
    header: "legacy",         // seconda riga di GlobalNav
    dialogTabs: false,        // ServingsDialog a un solo pannello
    timer: "fab",             // pallino flottante
    fields: "labeled",        // etichetta sopra il campo
    iconPicker: "screen",     // picker a schermata piena
    tables: "plain",          // nessuna riga alternata
    formSections: "open",     // tutte le sezioni aperte
    exportFlow: "legacy",
    booksLayout: "cards",
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
    navPad: "8px 8px 10px",   // + safe-area, vedi navPadBottom
    header: "rule",           // filetto, nessun fondo
    dialogTabs: true,
    timer: "strip",           // striscia sopra la nav
    fields: "placeholder",
    iconPicker: "sheet",
    tables: "striped",
    formSections: "accordion",
    exportFlow: "guided",
    booksLayout: "list",
    sectionLabel: { size: 9.5, spacing: 2, weight: 700 },
    uppercaseButtons: true,
    // Ritocchi di fondo: schiarisce lo sfondo del tema per dare aria.
    // Punti di luminosità (ΔL, scala HSL), non percentuale — vedi lighten().
    bgTint: 3,
    cardTint: 0,              // quaderno non ha card (surface:"plain")
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
    navPad: "8px 6px 10px",
    header: "bar",            // fascia #FFFDF8 con filetto sotto
    dialogTabs: true,
    timer: "strip",
    fields: "placeholder",
    iconPicker: "sheet",
    tables: "striped",
    formSections: "accordion",
    exportFlow: "guided",
    booksLayout: "list",
    sectionLabel: { size: 9.5, spacing: 1.8, weight: 700 },
    uppercaseButtons: false,
    // Punti di luminosità (ΔL, scala HSL), non percentuale — vedi lighten().
    // Verificato su tutte e 10 le palette, chiaro e scuro: peggior contrasto
    // accento/card a cardTint=3 resta ≥ 4,5:1 (ardesia chiaro, il caso più
    // stretto: le notturne hanno un "chiaro" che è già un fondo scuro).
    bgTint: 1,
    cardTint: 3,              // card più chiare del fondo
  },
];

export const DEFAULT_UI_STYLE_ID = "classico";
export const isUiStyleId = (id) => UI_STYLES.some(s => s.id === id);

// ── Copertina cartacea — formula unica derivata dalla palette ─────────
// Fase 6: le 12 copertine disegnate a mano di BOOK_THEMES sono state
// assorbite nella palette (scelta utente unica: colore/tema/stile, non più
// una copertina separata). Nessun mockup copre questo caso — è un
// trattamento placeholder, plausibile ma da rifinire a vista in seguito
// (come già segnalato per il PDF in Fase 9 del piano).
//
// La copertina è un oggetto fisico (facsimile di libro rilegato): resta
// SEMPRE scura e identica, indipendente da temaScuro — riceve sempre il set
// CHIARO della palette (`coverBase`, mai il set scuro dove `ink` sarebbe
// chiaro e la copertina diventerebbe grigia invece che scura) e anche il
// suo accento resta fisso (`coverBase.accent`), non quello dell'utente.
function coverFromPalette(coverBase, accent) {
  const tintedWhite = mix(coverBase.ink, "#FFFFFF", 0.88); // mai bianco puro ("argento"): tinto dell'ink della palette
  return {
    coverBg: `linear-gradient(160deg, ${mix(coverBase.ink, accent, 0.18)} 0%, ${mix(coverBase.ink, "#000000", 0.55)} 45%, ${mix(coverBase.ink, accent, 0.10)} 100%)`,
    coverText: alpha(tintedWhite, 0.9),
    coverAccent: alpha(accent, 0.55),
    spineColor: alpha(tintedWhite, 0.06),
    pageColor: coverBase.bg,
  };
}

// Costruisce l'oggetto "tema" completo che alimenta ThemeCtx (vedi
// context.js/ricettario-v23.jsx): colori dell'interfaccia dalla palette
// scelta (personale, localStorage — vedi PALETTE.md) + campi "libro" fissi
// (BOOK_PAGE, facsimile di carta) + copertina derivata. Sostituisce
// BOOK_THEMES: non più una voce fissa scelta dall'utente, ma il risultato
// sempre ricalcolato di `colori(paletteId, temaScuro)`.
export function buildTheme(paletteId, temaScuro = false) {
  const c = colori(paletteId, temaScuro);
  // Set di colori sempre scuro della palette scelta, indipendente da
  // `temaScuro`: per le superfici pensate per restare scure a prescindere
  // dal tema dell'app (Modalità Cucina — schermo pensato per la cucina in
  // penombra — e la barra di navigazione di Classico, da sempre scura).
  // `appInk`/`appBg`/`appAccent2` si invertono con `temaScuro` e non vanno
  // bene per questo (per le palette notturne `ink` è chiaro anche in
  // "chiaro"): `colori(paletteId, true)` è invece un set completo e già
  // coerente al suo interno, qualunque sia la scelta reale dell'utente.
  const darkChrome = colori(paletteId, true);
  // Copertina: sempre il set CHIARO, mai quello scelto dall'utente — vedi
  // coverFromPalette() sopra.
  const coverBase = colori(paletteId, false);
  return {
    id: c.id, name: c.nome, notturna: c.notturna,
    // Nei temi chiari il fondo pagina è bianco puro fisso (mai tinto dalla
    // palette) e cinque ruoli colore distinti sostituiscono l'unica
    // velatura uniforme di th.appAccent usata finora: campo di testo, pill,
    // tasto secondario (=appAccent, invariato) e tasto primario. Nei temi
    // scuri questi nuovi campi restano equivalenti al comportamento di
    // sempre — nessuna modifica visiva lì.
    appBg: temaScuro ? c.bg : "#FFFFFF",
    appCard: c.card, appBorder: c.border, appBorderStrong: c.borderStrong,
    appInk: temaScuro ? c.ink : mix("#1A1A1A", c.accent, 0.10),
    appFaded: temaScuro ? c.faded : mix(c.faded, c.accent, 0.20),
    appMuted: c.muted,
    appAccent: c.accent, appOnAccent: c.onAccent, appAccent2: c.accent2,
    appFieldBg: temaScuro ? c.card : mix(c.accent, "#FFFFFF", 0.93),
    appFieldBorder: temaScuro ? c.border : mix(c.accent, "#FFFFFF", 0.78),
    appPillBg: temaScuro ? alpha(c.accent, 0.15) : mix(c.accent, "#FFFFFF", 0.80),
    appPrimaryBg: temaScuro ? c.accent : mix(c.accent, "#000000", 0.35),
    appPrimaryText: temaScuro ? c.onAccent : "#FFFFFF",
    navBg: c.navBg, navBorder: c.navBorder, navActive: c.navActive, navIdle: c.navIdle,
    sezioni: c.sezioni, sezioniPiene: c.sezioniPiene,
    darkChrome,
    ...BOOK_PAGE,
    ...coverFromPalette(coverBase, coverBase.accent),
  };
}

// Unisce tema e stile nei token che i componenti leggono davvero.
// `theme` è l'oggetto restituito da buildTheme() (== useTheme()).
export function resolveUiStyle(theme, styleId = DEFAULT_UI_STYLE_ID) {
  const style = UI_STYLES.find(s => s.id === styleId) || UI_STYLES[0];
  const bg = style.bgTint ? lighten(theme.appBg, style.bgTint) : theme.appBg;
  const card = style.cardTint ? lighten(theme.appCard, style.cardTint) : theme.appCard;
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
    // Testo/icona sopra un pieno di accento — MAI "#fff" scritto a mano: nei
    // temi scuri (e nelle palette notturne) l'accento si schiarisce e serve
    // testo scuro sopra, non chiaro. Vedi PALETTE.md.
    onAccent: theme.appOnAccent,
    ok: "#6B8C6E",
    danger: "#D93025",
    // riga alternata delle tabelle (vale ovunque ci siano righe lunghe) —
    // deriva dal tema, non un rgba fisso: cambia con palette diverse.
    stripe: style.tables === "striped" ? alpha(theme.appBorder, 0.4) : "transparent",
    // Colore di sezione — negli stili nuovi sostituisce recipe.color.
    // Uso: pastiglia tenue in lista, pieno solo nell'hero della scheda.
    // `theme.sezioni` arriva da colori(paletteId, temaScuro) — vedi PALETTE.md.
    sectionColor: (macroSection) => style.id === "classico" ? null : (theme.sezioni[macroSection] || theme.sezioni.altro),
    // Variante "piena" — per i riempimenti solidi con icona/testo bianco
    // sopra (hero della scheda ricetta, pastiglie a colore pieno). Sono due
    // valori diversi apposta (PALETTE.md): `sezioni` è tarato per il testo
    // DENTRO la propria pastiglia tenue, `sezioniPiene` per il bianco SOPRA
    // un pieno — scambiarli rompe uno dei due contrasti.
    sectionColorFull: (macroSection) => style.id === "classico" ? null : (theme.sezioniPiene[macroSection] || theme.sezioniPiene.altro),
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

// Padding inferiore della barra in basso: 10px + safe area iOS. Solo punto
// di verità per l'altezza della nav — CTA fissi e striscia timer lo
// sommano da qui, mai una seconda misura indipendente (vedi Rischi noti).
export const navPadBottom = "calc(10px + env(safe-area-inset-bottom, 0px))";
