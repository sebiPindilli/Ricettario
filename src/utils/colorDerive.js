// Derivazione algoritmica dei token colore secondari (accent2, faded,
// cardBg, border, borderLight) a partire dai 3 colori scelti dall'utente
// per un template PDF personalizzato (principale/testo/sfondo) — evita sia
// la scelta libera di 8 token indipendenti (spesso produce risultati
// brutti, vedi discussione personalizzazione export PDF) sia una libreria
// esterna. Nessuna dipendenza nuova: conversione HEX<->HSL scritta a mano.
//
// Gli stili predefiniti (Classico/Minimal/Moderno, vedi pdfStyles.js) NON
// passano da qui: mantengono gli 8 token originali esatti, verificati
// pixel-per-pixel nella Fase 1. Questo modulo si applica solo ai template
// personalizzati che l'utente crea scegliendo i 3 colori base.

const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const rgbToHex = ({ r, g, b }) => "#" + [r, g, b]
  .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
  .join("");

const rgbToHsl = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToRgb = ({ h, s, l }) => {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { const v = l * 255; return { r: v, g: v, b: v }; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: hue2rgb(h + 1 / 3) * 255, g: hue2rgb(h) * 255, b: hue2rgb(h - 1 / 3) * 255 };
};

// Schiarisce/desatura un colore mantenendone la tonalità — usato per
// accent2 (variante più tenue dello stesso accent, stessa idea dei 3 stili
// predefiniti dove accent2 è sempre una versione più chiara di accent).
export const lighten = (hex, deltaL, deltaS = 0) => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({
    h: hsl.h,
    s: Math.max(0, Math.min(100, hsl.s + deltaS)),
    l: Math.max(0, Math.min(100, hsl.l + deltaL)),
  }));
};

// Interpola linearmente (RGB) tra due colori — usato per i toni intermedi
// (faded, cardBg, border, borderLight): una sfumatura tra due colori
// concreti scelti dall'utente resta corretta anche quando lo sfondo non è
// bianco puro, cosa che uno shift HSL a tonalità unica non garantirebbe.
export const mix = (hexA, hexB, ratio) => {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex({
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio,
  });
};

// Costruisce l'intera palette derivata a partire dai 3 colori scelti.
export const deriveColorTokens = (accent, ink, paper) => ({
  accent,
  ink,
  paper,
  accent2: lighten(accent, 22, -12),
  faded: mix(ink, paper, 0.42),
  cardBg: mix(paper, accent, 0.045),
  border: mix(paper, ink, 0.16),
  borderLight: mix(paper, ink, 0.08),
});
