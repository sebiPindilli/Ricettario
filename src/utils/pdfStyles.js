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
// (vedi pdfCss/.q-* in ricettario-v23.jsx), quindi le due scelte si
// combinano liberamente invece di essere legate come nel mockup originale.
export const PDF_LAYOUTS = {
  classico: { label:"Classico", desc:"Titolo centrato, ingredienti e passi in colonna unica — l'impaginazione originale" },
  quaderno: { label:"Quaderno", desc:"Titolo e foto affiancati, ingredienti e passi su due colonne" },
};
