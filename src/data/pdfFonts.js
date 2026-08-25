// Famiglie curate per l'export PDF — 2 di sistema (nessun download, nessun
// impatto sul bundle) + 5 da Google Fonts via @fontsource, imbarcate nel
// progetto (non CDN) e caricate SOLO al momento dell'export, mai
// all'avvio dell'app (vedi embedPdfFontFaces sotto). Solo pesi regular+bold
// (non l'intera gamma), come per il polyfill pagedjs: ogni import() è un
// chunk separato caricato via Vite solo se quella famiglia viene scelta.
export const PDF_FONTS = [
  { id: "georgia", label: "Georgia", category: "serif", stack: "Georgia, 'Times New Roman', serif" },
  { id: "helvetica", label: "Helvetica", category: "sans", stack: "'Helvetica Neue', Arial, sans-serif" },
  {
    id: "lora", label: "Lora", category: "serif", stack: "'Lora', Georgia, serif",
    load: () => Promise.all([
      import("@fontsource/lora/files/lora-latin-400-normal.woff2?url"),
      import("@fontsource/lora/files/lora-latin-700-normal.woff2?url"),
    ]).then(([r, b]) => ({ regular: r.default, bold: b.default })),
  },
  {
    id: "playfair", label: "Playfair Display", category: "serif", stack: "'Playfair Display', Georgia, serif",
    load: () => Promise.all([
      import("@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2?url"),
      import("@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2?url"),
    ]).then(([r, b]) => ({ regular: r.default, bold: b.default })),
  },
  {
    id: "inter", label: "Inter", category: "sans", stack: "'Inter', 'Helvetica Neue', sans-serif",
    load: () => Promise.all([
      import("@fontsource/inter/files/inter-latin-400-normal.woff2?url"),
      import("@fontsource/inter/files/inter-latin-700-normal.woff2?url"),
    ]).then(([r, b]) => ({ regular: r.default, bold: b.default })),
  },
  {
    id: "poppins", label: "Poppins", category: "sans", stack: "'Poppins', sans-serif",
    load: () => Promise.all([
      import("@fontsource/poppins/files/poppins-latin-400-normal.woff2?url"),
      import("@fontsource/poppins/files/poppins-latin-700-normal.woff2?url"),
    ]).then(([r, b]) => ({ regular: r.default, bold: b.default })),
  },
  {
    id: "jetbrains", label: "JetBrains Mono", category: "mono", stack: "'JetBrains Mono', monospace",
    load: () => Promise.all([
      import("@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2?url"),
      import("@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2?url"),
    ]).then(([r, b]) => ({ regular: r.default, bold: b.default })),
  },
];

export const pdfFontStack = (id) => PDF_FONTS.find(f => f.id === id)?.stack || PDF_FONTS[0].stack;

const bufferToBase64 = (buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

const fetchAsBase64 = async (url) => {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return bufferToBase64(buf);
};

// Genera le regole @font-face (woff2 incorporato come data URI) solo per le
// famiglie effettivamente in uso in un export — mai un font non scelto,
// mai un caricamento da rete a export completato. In caso di errore di
// rete per una famiglia, quella famiglia viene semplicemente omessa: il
// PDF usa comunque la pila di fallback dichiarata in stack (es. "'Lora',
// Georgia, serif" ricade su Georgia), l'export non si blocca.
export const embedPdfFontFaces = async (fontIds) => {
  const uniqueIds = [...new Set(fontIds)];
  const fonts = uniqueIds
    .map(id => PDF_FONTS.find(f => f.id === id))
    .filter(f => f && f.load);

  const rules = await Promise.all(fonts.map(async (font) => {
    try {
      const { regular, bold } = await font.load();
      const [regB64, boldB64] = await Promise.all([fetchAsBase64(regular), fetchAsBase64(bold)]);
      return `
        @font-face { font-family: '${font.label}'; font-weight: 400; font-style: normal; font-display: swap; src: url(data:font/woff2;base64,${regB64}) format('woff2'); }
        @font-face { font-family: '${font.label}'; font-weight: 700; font-style: normal; font-display: swap; src: url(data:font/woff2;base64,${boldB64}) format('woff2'); }
      `;
    } catch {
      return "";
    }
  }));

  return rules.join("\n");
};
