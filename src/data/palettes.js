// ══════════════════════════════════════════════════════════════
// PALETTE — sostituiscono BOOK_THEMES.
//
// Regola che tiene in piedi tutto: le SUPERFICI sono quasi neutre e quasi
// identiche in ogni palette; il COLORE compare solo dove porta peso —
// azione primaria, voce di nav attiva, quantità, filtri, stella, focus.
// Il difetto dei temi precedenti era l'opposto: ogni superficie prendeva
// una velatura dell'accento, e il colore perdeva forza proprio dove serve.
//
// Otto palette (nomi di pietre preziose: sette legate ai colori
// dell'arcobaleno più un tema neutro) × chiaro/scuro × tre stili = 48
// combinazioni, tutte disegnate in designs/Palette per stile.html. Prima
// di inventare una regola per un caso, cercarlo lì.
//
// ── La barra di navigazione ───────────────────────────────────────────
// navBg è una superficie SOLLEVATA: scurisce di poco sul fondo chiaro
// (ΔL −11) e SCHIARISCE su quello scuro (ΔL +9). Portarla al buio in
// entrambi i casi è l'errore da non rifare: diventa una lastra nera sul
// chiaro e sparisce sullo scuro. Lo stacco sta fra ΔL 6 e 20 in tutte e
// venti le superfici.
// navActive e navIdle sono tarati a 4,5:1 contro navBg — NON contro il
// fondo pagina: sono due superfici diverse. Usare accent/muted sulla barra
// è un errore silenzioso (passa il contagocce, non passa nell'app).
// Lo stile Quaderno è l'unico che non usa navBg: lì la barra sta sul fondo
// e valgono accent/muted.
//
// ── Le sezioni ───────────────────────────────────────────────────────
// I quattro ruoli RUOTANO con l'accento conservando la loro spaziatura di
// tinta: identici di struttura, diversi di colore, sempre a ΔE ≥ 22 l'uno
// dall'altro. Non collassano sulla tinta della palette — era il difetto
// da evitare.
// `sezioni` = colore del testo e delle pastiglie tenui (4,5:1 DENTRO la
// propria pastiglia). `sezioniPiene` = la versione scura per i pieni con
// icona bianca sopra (≥ 3:1). Sono due valori diversi: non scambiarli.
//
// Nota di importazione: nel pacchetto di handoff (design_handoff_ui_styles/
// code/palettes.js) le chiavi di `sezioni`/`sezioniPiene` erano `base`; qui
// sono state rinominate in `basi` per combaciare con l'id reale in
// MACRO_SECTIONS (constants.js) — altrimenti ui.sectionColor("basi") non
// avrebbe mai trovato una corrispondenza e sarebbe sempre caduto su `altro`.
// ══════════════════════════════════════════════════════════════

export const PALETTES = [
  {
    id: "rubino", nome: "Rubino", desc: "nuovo, rosso puro", notturna: false,
    chiaro: {
      bg: "#FBF7F4", card: "#FFFFFF", border: "#EAE1DB", borderStrong: "#9E9189",
      ink: "#2E2622", faded: "#736962", muted: "#958982",
      accent: "#B52E26", onAccent: "#FFFFFF", accent2: "#8A6A18",
      navBg: "#DCD8D5", navBorder: "#C8C5C2", navActive: "#971E15", navIdle: "#655C55",
      sezioni:      { basi: "#646271", salati: "#994E33", dolci: "#6B661F", altro: "#006F6E" },
      sezioniPiene: { basi: "#646271", salati: "#994E33", dolci: "#6B661F", altro: "#006F6E" },
    },
    scuro: {
      bg: "#25201D", card: "#312B28", border: "#3D3734", borderStrong: "#8D827B",
      ink: "#F6EFEC", faded: "#B5A9A2", muted: "#9A8F88",
      accent: "#E87E73", onAccent: "#4C0400", accent2: "#CFAC67",
      navBg: "#383330", navBorder: "#4D4744", navActive: "#E87E73", navIdle: "#B5A9A2",
      sezioni:      { basi: "#B1AFBF", salati: "#F19B7A", dolci: "#B9B368", altro: "#4BC1C1" },
      sezioniPiene: { basi: "#9290A0", salati: "#D07E5E", dolci: "#9B964C", altro: "#21A3A3" },
    },
  },
  {
    id: "corniola", nome: "Corniola", desc: "la predefinita", notturna: false,
    chiaro: {
      bg: "#FBF7F4", card: "#FFFFFF", border: "#EAE1DB", borderStrong: "#9E9189",
      ink: "#2E2622", faded: "#736962", muted: "#958982",
      accent: "#B44A26", onAccent: "#FFFFFF", accent2: "#8A6A18",
      navBg: "#DCD8D5", navBorder: "#C8C5C2", navActive: "#A33C19", navIdle: "#655C55",
      sezioni:      { basi: "#646271", salati: "#994E33", dolci: "#6B661F", altro: "#006F6E" },
      sezioniPiene: { basi: "#646271", salati: "#994E33", dolci: "#6B661F", altro: "#006F6E" },
    },
    scuro: {
      bg: "#25201D", card: "#312B28", border: "#3D3734", borderStrong: "#8D827B",
      ink: "#F6EFEC", faded: "#B5A9A2", muted: "#9A8F88",
      accent: "#E68C6A", onAccent: "#4C0400", accent2: "#CFAC67",
      navBg: "#383330", navBorder: "#4D4744", navActive: "#E68C6A", navIdle: "#B5A9A2",
      sezioni:      { basi: "#B1AFBF", salati: "#F19B7A", dolci: "#B9B368", altro: "#4BC1C1" },
      sezioniPiene: { basi: "#9290A0", salati: "#D07E5E", dolci: "#9B964C", altro: "#21A3A3" },
    },
  },
  {
    id: "citrino", nome: "Citrino", desc: "ambra e spezie", notturna: false,
    chiaro: {
      bg: "#FBF7F4", card: "#FFFFFF", border: "#E9E1DA", borderStrong: "#9C9287",
      ink: "#2D2721", faded: "#726961", muted: "#938A82",
      accent: "#96690F", onAccent: "#FFFFFF", accent2: "#8A4A20",
      navBg: "#DCD8D5", navBorder: "#C8C5C2", navActive: "#7F5600", navIdle: "#645C54",
      sezioni:      { basi: "#6D606C", salati: "#825E1C", dolci: "#426F33", altro: "#006C8A" },
      sezioniPiene: { basi: "#6D606C", salati: "#825E1C", dolci: "#426F33", altro: "#006C8A" },
    },
    scuro: {
      bg: "#24201C", card: "#302B27", border: "#3C3733", borderStrong: "#8B827A",
      ink: "#F5F0EB", faded: "#B3AAA1", muted: "#988F87",
      accent: "#C89C58", onAccent: "#391B00", accent2: "#E4A279",
      navBg: "#37332F", navBorder: "#4B4743", navActive: "#C89C58", navIdle: "#B3AAA1",
      sezioni:      { basi: "#BBACB9", salati: "#D6A965", dolci: "#8EBD7B", altro: "#4BBEDE" },
      sezioniPiene: { basi: "#9D8F9B", salati: "#B68C4A", dolci: "#719F5F", altro: "#1BA0BF" },
    },
  },
  {
    id: "smeraldo", nome: "Smeraldo", desc: "erbe e orto", notturna: false,
    chiaro: {
      bg: "#F8F8F4", card: "#FFFFFF", border: "#E3E3DA", borderStrong: "#959487",
      ink: "#282821", faded: "#6B6B61", muted: "#8C8C81",
      accent: "#3C6B42", onAccent: "#FFFFFF", accent2: "#8A6A18",
      navBg: "#D9D9D5", navBorder: "#C5C5C2", navActive: "#38673F", navIdle: "#5F5F55",
      sezioni:      { basi: "#745F5D", salati: "#2C713A", dolci: "#006F75", altro: "#5F5E98" },
      sezioniPiene: { basi: "#745F5D", salati: "#2C713A", dolci: "#006F75", altro: "#5F5E98" },
    },
    scuro: {
      bg: "#21211C", card: "#2D2D27", border: "#393833", borderStrong: "#85847A",
      ink: "#F1F1EB", faded: "#ACACA1", muted: "#929187",
      accent: "#86AD88", onAccent: "#04280A", accent2: "#CFAC67",
      navBg: "#34342F", navBorder: "#484843", navActive: "#86AD88", navIdle: "#ACACA1",
      sezioni:      { basi: "#C2ACA7", salati: "#7BC083", dolci: "#0CC4C9", altro: "#ADAAE9" },
      sezioniPiene: { basi: "#A48F8A", salati: "#5EA267", dolci: "#00A3A8", altro: "#8F8DCA" },
    },
  },
  {
    id: "acquamarina", nome: "Acquamarina", desc: "acqua e sale", notturna: false,
    chiaro: {
      bg: "#F3F9F9", card: "#FFFFFF", border: "#D8E5E5", borderStrong: "#849797",
      ink: "#1F2A2A", faded: "#5E6D6D", muted: "#7F8F8E",
      accent: "#1F6B70", onAccent: "#FFFFFF", accent2: "#8A6A18",
      navBg: "#D4DADA", navBorder: "#C1C6C6", navActive: "#1A676C", navIdle: "#526161",
      sezioni:      { basi: "#696456", salati: "#006F7A", dolci: "#0068A1", altro: "#954D6A" },
      sezioniPiene: { basi: "#696456", salati: "#006F7A", dolci: "#0068A1", altro: "#954D6A" },
    },
    scuro: {
      bg: "#1B2222", card: "#262E2E", border: "#323A3A", borderStrong: "#778786",
      ink: "#EAF2F2", faded: "#9EAEAE", muted: "#849493",
      accent: "#77ACB0", onAccent: "#00282C", accent2: "#CFAC67",
      navBg: "#2E3535", navBorder: "#424949", navActive: "#77ACB0", navIdle: "#9EAEAE",
      sezioni:      { basi: "#B6B0A0", salati: "#00C4CF", dolci: "#65B8F8", altro: "#E999B7" },
      sezioniPiene: { basi: "#989383", salati: "#00A3AE", dolci: "#3E99D7", altro: "#C97C9A" },
    },
  },
  {
    id: "zaffiro", nome: "Zaffiro", desc: "ceramica dipinta", notturna: false,
    chiaro: {
      bg: "#F5F8FB", card: "#FFFFFF", border: "#DBE4EA", borderStrong: "#89959E",
      ink: "#21292E", faded: "#626C74", muted: "#828D95",
      accent: "#2F5480", onAccent: "#FFFFFF", accent2: "#8A6A18",
      navBg: "#D6D9DC", navBorder: "#C3C5C8", navActive: "#2F5480", navIdle: "#555F66",
      sezioni:      { basi: "#57685F", salati: "#1A67A9", dolci: "#8C4E87", altro: "#895933" },
      sezioniPiene: { basi: "#57685F", salati: "#1A67A9", dolci: "#8C4E87", altro: "#895933" },
    },
    scuro: {
      bg: "#1C2125", card: "#272D31", border: "#33383D", borderStrong: "#7B858D",
      ink: "#ECF1F6", faded: "#A2ADB5", muted: "#88929A",
      accent: "#8DA4CC", onAccent: "#002342", accent2: "#CFAC67",
      navBg: "#2F3438", navBorder: "#43484C", navActive: "#8DA4CC", navIdle: "#A2ADB5",
      sezioni:      { basi: "#A1B5AB", salati: "#7EB3FD", dolci: "#DE9BD6", altro: "#DDA57A" },
      sezioniPiene: { basi: "#84988E", salati: "#5E96DD", dolci: "#BF7EB7", altro: "#BD885E" },
    },
  },
  {
    id: "ametista", nome: "Ametista", desc: "vinaccia e fichi", notturna: false,
    chiaro: {
      bg: "#FBF7F9", card: "#FFFFFF", border: "#E9E0E5", borderStrong: "#9D9098",
      ink: "#2D262A", faded: "#73676E", muted: "#94888F",
      accent: "#7C3350", onAccent: "#FFFFFF", accent2: "#956F1B",
      navBg: "#DCD8DA", navBorder: "#C8C5C6", navActive: "#7C3350", navIdle: "#675B62",
      sezioni:      { basi: "#566672", salati: "#A04468", dolci: "#955330", altro: "#397045" },
      sezioniPiene: { basi: "#566672", salati: "#A04468", dolci: "#955330", altro: "#397045" },
    },
    scuro: {
      bg: "#241F22", card: "#302A2E", border: "#3C363A", borderStrong: "#8C8187",
      ink: "#F5EFF3", faded: "#B4A8AF", muted: "#998D94",
      accent: "#D291A7", onAccent: "#420C24", accent2: "#D2AB65",
      navBg: "#373235", navBorder: "#4B4649", navActive: "#D291A7", navIdle: "#B4A8AF",
      sezioni:      { basi: "#A1B3BF", salati: "#F692B6", dolci: "#EB9F78", altro: "#85BE8D" },
      sezioniPiene: { basi: "#8496A1", salati: "#D67599", dolci: "#CA825C", altro: "#68A071" },
    },
  },
  {
    id: "onice", nome: "Onice", desc: "chiaro-scuro, senza colore", notturna: false,
    chiaro: {
      bg: "#F5F8FC", card: "#FFFFFF", border: "#DDE3EB", borderStrong: "#8A939E",
      ink: "#23282F", faded: "#646B74", muted: "#858C96",
      accent: "#4A5560", onAccent: "#FFFFFF", accent2: "#6E6558",
      navBg: "#D6D9DD", navBorder: "#C3C5C9", navActive: "#4A5560", navIdle: "#585F68",
      sezioni:      { basi: "#5B685C", salati: "#0067A3", dolci: "#7B5594", altro: "#91543B" },
      sezioniPiene: { basi: "#5B685C", salati: "#0067A3", dolci: "#7B5594", altro: "#91543B" },
    },
    scuro: {
      bg: "#1D2125", card: "#282D31", border: "#34383D", borderStrong: "#7D848E",
      ink: "#EDF1F6", faded: "#A4ACB6", muted: "#8A919B",
      accent: "#9BA4AE", onAccent: "#1B222A", accent2: "#B8AFA4",
      navBg: "#303438", navBorder: "#44484C", navActive: "#9BA4AE", navIdle: "#A4ACB6",
      sezioni:      { basi: "#A5B4A8", salati: "#5BB8FB", dolci: "#CCA0E4", altro: "#E6A083" },
      sezioniPiene: { basi: "#88978B", salati: "#329BDB", dolci: "#AD83C5", altro: "#C68367" },
    },
  },
];

export const DEFAULT_PALETTE_ID = "corniola";
export const isPaletteId = (id) => PALETTES.some(p => p.id === id);

// Opacità delle pastiglie tenui. Alzarla scurisce il fondo della pastiglia e
// fa cadere sotto 4,5:1 le etichette di sezione: se la cambi, ritara i colori.
export const PILL_ALPHA = 0.14;      // pastiglia con testo dentro
export const ICON_PILL_ALPHA = 0.16; // pastiglia con sola icona (soglia 3:1)

export const alpha = (hex, a = PILL_ALPHA) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};

// Il fondo che l'occhio vede davvero dietro l'etichetta.
export const fondoPastiglia = (colore, su, a = PILL_ALPHA) => {
  const c = [1, 3, 5].map(i => parseInt(colore.slice(i, i + 2), 16));
  const s = [1, 3, 5].map(i => parseInt(su.slice(i, i + 2), 16));
  return '#' + c.map((v, i) => Math.round(v * a + s[i] * (1 - a)).toString(16).padStart(2, '0')).join('');
};

// Rapporto di contrasto dell'etichetta dentro la propria pastiglia.
// Deve stare ≥ 4,5. Usare QUESTA, non il contrasto contro la card.
export function contrastoEtichetta(colore, su, a = PILL_ALPHA) {
  const L = (hex) => { const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const [x, y] = [L(colore), L(fondoPastiglia(colore, su, a))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

// Restituisce i colori giusti per la superficie su cui stai disegnando.
// `scuro` = il tema scuro scelto dall'utente, o la Modalità Cucina.
export function colori(paletteId, scuro = false) {
  const p = PALETTES.find(x => x.id === paletteId) || PALETTES[0];
  return { id: p.id, nome: p.nome, notturna: p.notturna, ...(scuro ? p.scuro : p.chiaro) };
}
