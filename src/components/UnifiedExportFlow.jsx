import { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F, MACRO_SECTIONS } from "../data/constants.js";
import { sortSectionsAltroLast, uid } from "../utils/helpers.js";
import InfoButton from "./InfoButton.jsx";
import AppIcon from "./AppIcon.jsx";
import { guideEsporta } from "../data/guideContent.jsx";
import {
  PDF_STYLES, PDF_LAYOUTS, DEFAULT_PDF_CONTENT, PDF_ALWAYS_INCLUDED,
  PDF_PALETTES, PDF_TEXT_SIZES, PDF_MARGIN_SIZES, PDF_PHOTO_SIZES,
} from "../utils/pdfStyles.js";
import { PDF_FONTS, pdfFontStack } from "../data/pdfFonts.js";
import { deriveColorTokens } from "../utils/colorDerive.js";
import SectionCategoryIcon from "./SectionCategoryIcon.jsx";

const PDF_STYLE_OPTIONS = [
  { id: "classico", label: "Classico", desc: "Serif, accenti caldi — lo stile originale" },
  { id: "minimal", label: "Minimal", desc: "Sans-serif in bianco e nero, compatto" },
  { id: "moderno", label: "Moderno", desc: "Sans-serif con accento colore, foto più grandi" },
];
const BUILT_IN_STYLE_IDS = PDF_STYLE_OPTIONS.map(s => s.id);

// Layout: indipendente da stile/template (vedi PDF_LAYOUTS in pdfStyles.js)
// — le scelte si combinano liberamente, non sono legate come nel mockup originale.
const PDF_LAYOUT_OPTIONS = [
  { id: "classico", ...PDF_LAYOUTS.classico },
  { id: "quaderno", ...PDF_LAYOUTS.quaderno },
];

// Etichette dei toggle di contenuto — un solo posto che elenca ogni campo
// disattivabile, riusato sia per il rendering sia per calcolare fullOpts.
// Titolo/ingredienti/passi non compaiono qui: sono sempre inclusi (vedi
// PDF_ALWAYS_INCLUDED), mostrati a parte come promemoria, non come toggle.
const PDF_CONTENT_FIELDS = [
  { key: "includeDishPhoto", label: "Foto piatto" },
  { key: "includeStepPhotos", label: "Foto preparazione" },
  { key: "includeNote", label: "Nota" },
  { key: "includeTimes", label: "Tempi (prep./cottura)" },
  { key: "includeServings", label: "Porzioni" },
  { key: "includeSource", label: "Fonte/autore" },
  { key: "includeTags", label: "Tag" },
  { key: "includeNutrition", label: "Valori nutrizionali" },
  { key: "includeMemories", label: "Ricordi collegati" },
  { key: "includeComments", label: "Commenti" },
  { key: "includeSubsectionNames", label: "Nomi delle sottosezioni", sub: "Es. «Per l'impasto», «Per la farcitura»." },
];

const emptyDraftTemplate = (fromColors) => ({
  id: uid("pdft"), name: "Nuovo template", builtIn: false,
  colors: fromColors || deriveColorTokens("#8B4520", "#1a1a1a", "#ffffff"),
  fonts: { heading: pdfFontStack("georgia"), body: pdfFontStack("georgia"), ui: pdfFontStack("helvetica") },
  fontIds: { heading: "georgia", body: "georgia" },
  layoutId: "classico", onePerPage: true,
  textSize: "normale", margins: "normale", photoSize: "normale",
});

// Componenti di layout a livello di modulo, non dentro UnifiedExportFlow:
// definirli nel corpo del componente li ricrea come una nuova identità di
// componente a ogni render (ogni tasto premuto in un campo testo, es.
// "Titolo di copertina", causava un re-render → React vedeva un tipo di
// componente diverso in quella posizione → smontava e rimontava tutto il
// sottoalbero, perdendo il focus dell'input a ogni carattere). Da qui in
// poi, unica identità stabile per tutta la vita del componente: `th` va
// passato esplicitamente come prop invece che catturato per closure.
const Panel = ({ th, children }) => (
  <div style={{ position: "absolute", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
    <div style={{ width: "100%", maxHeight: "88%", background: th.appBg, borderRadius: 20, padding: "20px 18px", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <InfoButton triggerStyle={{ position: "absolute", top: 14, right: 14 }}>{guideEsporta}</InfoButton>
      {children}
    </div>
  </div>
);
const Title = ({ th, children }) => (
  <div style={{ fontFamily: F.display, fontSize: 18, color: th.appInk, textAlign: "center", marginBottom: 4 }}>{children}</div>
);
const Sub = ({ th, children }) => (
  <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, textAlign: "center", marginBottom: 16, lineHeight: 1.5 }}>{children}</div>
);
const Primary = ({ th, ...props }) => (
  <button {...props} style={{ padding: "13px", borderRadius: 12, border: "none", background: th.appAccent, color: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 700, cursor: "pointer", ...(props.disabled ? { opacity: 0.55, cursor: "default" } : {}), ...(props.style || {}) }} />
);
const Ghost = ({ th, ...props }) => (
  <button {...props} style={{ padding: "13px", borderRadius: 12, border: `1.5px solid ${th.appBorder}`, background: "transparent", color: th.appInk, fontFamily: F.ui, fontSize: 13, fontWeight: 600, cursor: "pointer", ...(props.style || {}) }} />
);
const Check = ({ th, checked, onChange, label, sub }) => (
  <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 12, color: th.appInk, marginBottom: 10 }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ marginTop: 2 }} />
    <span>{label}{sub && <span style={{ display: "block", fontSize: 10.5, color: th.appFaded, marginTop: 2 }}>{sub}</span>}</span>
  </label>
);

// ══════════════════════════════════════════════════════════════
// COMPONENT: UnifiedExportFlow — popup a passi condiviso da scheda
// ricetta e libro ricette (sostituisce ExportFlow.jsx e la fase
// "transfer" di BooksScreen.jsx).
//
// Passi: select (ricette) → dest (mio ricettario / altra persona)
//   → books (selezione libri) | format (link / pdf)
//   → prefs (preferenze specifiche del ramo scelto) → result
// ══════════════════════════════════════════════════════════════
export default function UnifiedExportFlow({
  recipes = [], preselectId = null, sectionList = MACRO_SECTIONS,
  targetBooks = [], onCopyToBooks, onShareLinks, onExportPDF, onClose,
  userTemplates = {}, defaultTemplateId = null,
  onSaveTemplate, onDeleteTemplate, onSetDefaultTemplate,
}) {
  const th = useTheme();
  const ui = useUiStyle();
  // DECISIONI.md §Export vale solo per quaderno/schedario: la conseguenza
  // dichiarata a ogni scelta e' un'aggiunta di testo, non un cambio di
  // struttura — ma "classico byte-per-byte identico" vale anche per il
  // testo visibile, quindi resta comunque dietro questo controllo.
  const isNew = ui.exportFlow === "guided";
  const [step, setStep] = useState("select"); // select | dest | books | format | prefs | result
  const [selected, setSelected] = useState(preselectId ? [preselectId] : []);
  const [dest, setDest] = useState(null); // "books" | "person"
  const [targetBookIds, setTargetBookIds] = useState([]);
  const [format, setFormat] = useState(null); // "link" | "pdf"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { kind, ... }

  // Preferenze — un solo oggetto per ramo, letto solo quando serve
  const [booksPrefs, setBooksPrefs] = useState({ includePhotos: true, includeMemories: false, includeSystem: false });
  const [linkPrefs, setLinkPrefs] = useState({ includeIngredients: false, includePhotos: false, includeMemories: false, visibility: "anyone", allowedEmailsText: "" });
  const [pdfPrefs, setPdfPrefs] = useState(() => {
    const dtid = defaultTemplateId && (BUILT_IN_STYLE_IDS.includes(defaultTemplateId) || userTemplates[defaultTemplateId])
      ? defaultTemplateId : "classico";
    const customTpl = !BUILT_IN_STYLE_IDS.includes(dtid) ? userTemplates[dtid] : null;
    return {
      ...DEFAULT_PDF_CONTENT,
      templateId: dtid, layout: customTpl?.layoutId || "classico", title: "",
    };
  });
  const [pdfSection, setPdfSection] = useState("content"); // content | appearance | layout
  const [editingTemplate, setEditingTemplate] = useState(null); // null | draft PdfTemplateConfig
  const [linkCopiedId, setLinkCopiedId] = useState(null);
  const [allCopied, setAllCopied] = useState(false);

  const toggleSel = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allIds = recipes.map(r => r.id);
  const allSelected = selected.length === recipes.length && recipes.length > 0;
  const toggleAll = () => setSelected(allSelected ? [] : allIds);
  const toggleTargetBook = (id) => setTargetBookIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const linkAllowedEmails = () => Array.from(new Set(
    linkPrefs.allowedEmailsText.split(/[,\n]/).map(e => e.trim().toLowerCase()).filter(Boolean)
  ));
  const linkCanSubmit = linkPrefs.visibility === "anyone" || linkAllowedEmails().length > 0;

  const goDest = () => { setError(null); setStep("dest"); };
  const goPrefs = () => { setError(null); setStep("prefs"); };

  const submitBooks = async () => {
    setBusy(true); setError(null);
    try {
      await onCopyToBooks(targetBookIds, selected, booksPrefs);
      const names = targetBooks.filter(b => targetBookIds.includes(b.id)).map(b => b.name);
      setResult({ kind: "books", names });
      setStep("result");
    } catch (e) {
      setError(e.message || "Copia non riuscita.");
    } finally {
      setBusy(false);
    }
  };

  const submitLink = async () => {
    if (!linkCanSubmit || busy) return;
    setBusy(true); setError(null);
    try {
      const links = await onShareLinks(selected, {
        includeIngredients: linkPrefs.includeIngredients,
        includePhotos: linkPrefs.includePhotos,
        includeMemories: linkPrefs.includeMemories,
        visibility: linkPrefs.visibility,
        allowedEmails: linkPrefs.visibility === "restricted" ? linkAllowedEmails() : [],
      });
      setResult({ kind: "link", links });
      setStep("result");
    } catch (e) {
      setError(e.message || "Creazione dei link non riuscita.");
    } finally {
      setBusy(false);
    }
  };

  // Un template personalizzato (vedi userTemplates) porta con sé colori/
  // font/dimensioni; uno stile predefinito usa ancora style+layout come
  // prima. Il layout resta sempre una scelta a parte (pdfPrefs.layout),
  // anche con un template personalizzato — vedi resolveTemplateConfig.
  const customTemplate = !BUILT_IN_STYLE_IDS.includes(pdfPrefs.templateId) ? userTemplates[pdfPrefs.templateId] : null;

  const submitPDF = () => {
    const sel = recipes.filter(r => selected.includes(r.id));
    const contentOpts = Object.fromEntries(PDF_CONTENT_FIELDS.map(f => [f.key, pdfPrefs[f.key]]));
    onExportPDF(selected, {
      ...contentOpts,
      includeIndex: sel.length > 1 ? pdfPrefs.includeIndex : false,
      ...(customTemplate ? { template: customTemplate } : { style: pdfPrefs.templateId }),
      layout: pdfPrefs.layout,
      title: sel.length > 1 ? (pdfPrefs.title.trim() || undefined) : undefined,
    });
    setResult({ kind: "pdf" });
    setStep("result");
  };

  const copyToClipboard = (text, onDone) => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {});
    onDone();
  };

  // ── Passo: selezione ricette ──
  if (step === "select") {
    return (
      <Panel th={th}>
        <Title th={th}>📤 Esporta</Title>
        <Sub th={th}>{selected.length} ricett{selected.length === 1 ? "a" : "e"} selezionat{selected.length === 1 ? "a" : "e"}</Sub>
        <button onClick={toggleAll} style={{
          padding: "9px", borderRadius: 10, border: `1.5px solid ${th.appAccent}`,
          background: allSelected ? th.appAccent : "transparent",
          color: allSelected ? "#fff" : th.appAccent,
          fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>{allSelected ? <><AppIcon emoji="✓" icon="fatto" size={13} /> Tutto il ricettario selezionato</> : "Seleziona tutto"}</button>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          {sortSectionsAltroLast(sectionList).map(sec => {
            const inSec = recipes.filter(r => r.macroSection === sec.id);
            if (inSec.length === 0) return null;
            return (
              <div key={sec.id} style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appFaded, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 2px", display: "flex", alignItems: "center", gap: 4 }}><SectionCategoryIcon item={sec} size={10} /> {sec.label}</div>
                {inSec.map(r => {
                  const sel = selected.includes(r.id);
                  return (
                    <button key={r.id} onClick={() => toggleSel(r.id)} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
                      borderRadius: 10, marginBottom: 4, cursor: "pointer", textAlign: "left",
                      background: sel ? `${th.appAccent}18` : th.appCard,
                      border: `1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                    }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        border: `1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                        background: sel ? th.appAccent : "transparent",
                        color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{sel ? "✓" : ""}</span>
                      <span style={{ fontFamily: F.body, fontSize: 13, color: th.appInk }}>{r.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Ghost th={th} onClick={onClose} style={{ flex: 1 }}>Annulla</Ghost>
          <Primary th={th} onClick={goDest} disabled={selected.length === 0} style={{ flex: 2 }}>Continua →</Primary>
        </div>
      </Panel>
    );
  }

  // ── Passo: destinazione ──
  if (step === "dest") {
    return (
      <Panel th={th}>
        <Title th={th}>Dove vuoi esportare?</Title>
        <Sub th={th}>{selected.length} ricett{selected.length === 1 ? "a" : "e"}</Sub>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <Primary th={th} onClick={() => { setDest("books"); setStep("books"); }} style={isNew ? { display: "flex", flexDirection: "column", gap: 2 } : undefined}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AppIcon emoji="📚" icon="ricettari" size={14} /> Un mio altro ricettario</span>
            {isNew && <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.85 }}>copia le ricette, restano indipendenti dall'originale</span>}
          </Primary>
          <Primary th={th} onClick={() => { setDest("person"); setStep("format"); }} style={isNew ? { display: "flex", flexDirection: "column", gap: 2 } : undefined}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AppIcon emoji="🧑‍🤝‍🧑" icon="persona" size={14} /> Un'altra persona</span>
            {isNew && <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.85 }}>link o PDF, a scelta al passo successivo</span>}
          </Primary>
          <Ghost th={th} onClick={() => setStep("select")} style={{ border: "none", color: th.appFaded }}>‹ Indietro</Ghost>
        </div>
      </Panel>
    );
  }

  // ── Passo: scelta libri destinazione (mio ricettario) ──
  if (step === "books") {
    return (
      <Panel th={th}>
        <Title th={th}>In quali ricettari?</Title>
        <Sub th={th}>Puoi sceglierne più di uno</Sub>
        {targetBooks.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: th.appFaded, fontFamily: F.display, fontStyle: "italic", padding: 20 }}>
            Non hai altri ricettari su cui puoi scrivere.
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            {targetBooks.map(b => {
              const sel = targetBookIds.includes(b.id);
              return (
                <button key={b.id} onClick={() => toggleTargetBook(b.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10, marginBottom: 6, cursor: "pointer", textAlign: "left",
                  background: sel ? `${th.appAccent}18` : th.appCard,
                  border: `1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `1.5px solid ${sel ? th.appAccent : th.appBorder}`,
                    background: sel ? th.appAccent : "transparent",
                    color: "#fff", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{sel ? "✓" : ""}</span>
                  {b.type === "personale" ? <AppIcon emoji="🔒" icon="privato" size={16} /> : <span style={{ fontSize: 16 }}>👥</span>}
                  <span style={{ fontFamily: F.body, fontSize: 13, color: th.appInk }}>{b.name}</span>
                </button>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Ghost th={th} onClick={() => setStep("dest")} style={{ flex: 1 }}>‹ Indietro</Ghost>
          <Primary th={th} onClick={goPrefs} disabled={targetBookIds.length === 0} style={{ flex: 2 }}>Continua →</Primary>
        </div>
      </Panel>
    );
  }

  // ── Passo: link o PDF (altra persona) ──
  if (step === "format") {
    return (
      <Panel th={th}>
        <Title th={th}>Come vuoi condividerle?</Title>
        <Sub th={th}>{selected.length} ricett{selected.length === 1 ? "a" : "e"}</Sub>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <Primary th={th} onClick={() => { setFormat("link"); goPrefs(); }} style={isNew ? { display: "flex", flexDirection: "column", gap: 2 } : undefined}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><AppIcon emoji="🔗" icon="link" size={13} /> Link URL <span style={{ fontWeight: 400 }}>— consigliato per chi ha l'app</span></span>
            {isNew && <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.85 }}>scade fra 30 giorni, revocabile in ogni momento</span>}
          </Primary>
          <Primary th={th} onClick={() => { setFormat("pdf"); goPrefs(); }} style={isNew ? { display: "flex", flexDirection: "column", gap: 2 } : undefined}>
            <span>📄 PDF <span style={{ fontWeight: 400 }}>— consigliato per persone esterne</span></span>
            {isNew && <span style={{ fontWeight: 400, fontSize: 11, opacity: 0.85 }}>si apre in una nuova scheda, da lì stampi o salvi</span>}
          </Primary>
          <Ghost th={th} onClick={() => setStep("dest")} style={{ border: "none", color: th.appFaded }}>‹ Indietro</Ghost>
        </div>
      </Panel>
    );
  }

  // ── Passo: preferenze ──
  if (step === "prefs") {
    const sel = recipes.filter(r => selected.includes(r.id));
    const multi = sel.length > 1;

    if (dest === "books") {
      return (
        <Panel th={th}>
          <Title th={th}>Preferenze</Title>
          <Sub th={th}>Copia in {targetBookIds.length} ricettari{targetBookIds.length === 1 ? "o" : ""}</Sub>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            <Check th={th} checked={booksPrefs.includePhotos} onChange={v => setBooksPrefs(p => ({ ...p, includePhotos: v }))}
              label="Foto piatto e preparazione" sub="Vengono duplicate: restano valide anche se poi cancelli la ricetta originale." />
            <Check th={th} checked={booksPrefs.includeMemories} onChange={v => setBooksPrefs(p => ({ ...p, includeMemories: v }))}
              label="Ricordi collegati" />
            <Check th={th} checked={booksPrefs.includeSystem} onChange={v => setBooksPrefs(p => ({ ...p, includeSystem: v }))}
              label="Impostazioni di Organizza Ingredienti" sub="Applicate solo se il ricettario di destinazione non ne ha già di proprie." />
          </div>
          {error && <div style={{ fontFamily: F.ui, fontSize: 11.5, color: "#C4593A", marginBottom: 8, textAlign: "center" }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Ghost th={th} onClick={() => setStep("books")} style={{ flex: 1 }} disabled={busy}>‹ Indietro</Ghost>
            <Primary th={th} onClick={submitBooks} disabled={busy} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>{busy ? "Copia…" : <><AppIcon emoji="✓" icon="fatto" size={14} /> Copia ricette</>}</Primary>
          </div>
        </Panel>
      );
    }

    if (format === "link") {
      return (
        <Panel th={th}>
          <Title th={th}>Preferenze link</Title>
          <Sub th={th}>{sel.length} link{sel.length === 1 ? "" : " (uno per ricetta)"}</Sub>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", margin: "4px 0 8px" }}>Cosa includere</div>
            <Check th={th} checked={linkPrefs.includeIngredients} onChange={v => setLinkPrefs(p => ({ ...p, includeIngredients: v }))}
              label="Dati ingredienti" sub="Valori nutrizionali, categorie ed equivalenze di queste ricette." />
            <Check th={th} checked={linkPrefs.includePhotos} onChange={v => setLinkPrefs(p => ({ ...p, includePhotos: v }))}
              label="Foto piatto e preparazione" />
            <Check th={th} checked={linkPrefs.includeMemories} onChange={v => setLinkPrefs(p => ({ ...p, includeMemories: v }))}
              label="Ricordi collegati" />

            <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", margin: "10px 0 8px" }}>Chi può aprirli</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 12, color: th.appInk, marginBottom: 8 }}>
              <input type="radio" name="uef-visibility" checked={linkPrefs.visibility === "anyone"} onChange={() => setLinkPrefs(p => ({ ...p, visibility: "anyone" }))} />
              Chiunque abbia il link (e accesso all'app)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 12, color: th.appInk, marginBottom: 8 }}>
              <input type="radio" name="uef-visibility" checked={linkPrefs.visibility === "restricted"} onChange={() => setLinkPrefs(p => ({ ...p, visibility: "restricted" }))} />
              Solo persone specifiche
            </label>
            {linkPrefs.visibility === "restricted" && (
              <>
                <textarea
                  value={linkPrefs.allowedEmailsText}
                  onChange={e => setLinkPrefs(p => ({ ...p, allowedEmailsText: e.target.value }))}
                  placeholder="Un'email per riga o separate da virgola"
                  style={{ width: "100%", height: 64, padding: "9px 11px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appBg, fontFamily: F.ui, fontSize: 12, color: th.appInk, boxSizing: "border-box", resize: "none", marginBottom: 6 }}
                />
                <div style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded, lineHeight: 1.5 }}>
                  Solo chi ha già accesso all'app potrà aprirli, anche se l'email è tra queste. Vale per tutti i {sel.length} link.
                </div>
              </>
            )}
          </div>
          {error && <div style={{ fontFamily: F.ui, fontSize: 11.5, color: "#C4593A", marginBottom: 8, textAlign: "center" }}>{error}</div>}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Ghost th={th} onClick={() => setStep("format")} style={{ flex: 1 }} disabled={busy}>‹ Indietro</Ghost>
            <Primary th={th} onClick={submitLink} disabled={busy || !linkCanSubmit} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {busy ? "Creazione…" : <><AppIcon emoji="🔗" icon="link" size={13} /> Genera {sel.length > 1 ? `${sel.length} link` : "link"}</>}
            </Primary>
          </div>
        </Panel>
      );
    }

    // Condiviso da editingTemplate e dalla vista prefs sotto — dichiarato
    // qui, prima di entrambi: editingTemplate ritorna dentro il blocco
    // "if" sotto, che precede (nell'ordine di esecuzione) l'altra
    // dichiarazione della vista prefs — riferirlo da lì sarebbe stato un
    // ReferenceError da temporal dead zone (const non ancora inizializzata).
    const sectionLabelStyle = { fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", margin: "10px 0 8px" };

    // format === "pdf" — creazione/modifica di un template personalizzato:
    // un pannello a sé, non annidato nell'accordion sotto (troppi controlli
    // per stare in una sezione collassabile su schermo piccolo).
    if (editingTemplate) {
      const draft = editingTemplate;
      const isExisting = userTemplates[draft.id] != null;
      const setColor = (key, value) => {
        const colors = { ...draft.colors, [key]: value };
        setEditingTemplate(prev => ({ ...prev, colors: deriveColorTokens(colors.accent, colors.ink, colors.paper) }));
      };
      const setFont = (role, fontId) => setEditingTemplate(prev => ({
        ...prev,
        fonts: { ...prev.fonts, [role]: pdfFontStack(fontId) },
        fontIds: { ...prev.fontIds, [role]: fontId },
      }));
      const paletteActive = (p) => draft.colors.accent === p.accent && draft.colors.ink === p.ink && draft.colors.paper === p.paper;
      const sizeRow = (labelText, table, key) => (
        <div style={{ marginBottom: 14 }}>
          <div style={sectionLabelStyle}>{labelText}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(table).map(([id, opt]) => (
              <button key={id} onClick={() => setEditingTemplate(prev => ({ ...prev, [key]: id }))} style={{
                flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 11.5, fontWeight: 700,
                border: `1.5px solid ${draft[key] === id ? th.appAccent : th.appBorder}`,
                background: draft[key] === id ? `${th.appAccent}18` : th.appCard, color: th.appInk,
              }}>{opt.label}</button>
            ))}
          </div>
        </div>
      );
      // L'anteprima usa lo stack della famiglia scelta (fallback compreso):
      // se il font Google non è presente sul dispositivo di chi visualizza
      // l'anteprima, il testo ricade sul font di sistema — nessun
      // caricamento anticipato solo per mostrare l'elenco, coerente con
      // "font caricati solo al momento dell'export".
      const fontRow = (labelText, role) => (
        <div style={{ marginBottom: 14 }}>
          <div style={sectionLabelStyle}>{labelText}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {PDF_FONTS.map(f => (
              <button key={f.id} onClick={() => setFont(role, f.id)} style={{
                textAlign: "left", padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                border: `1.5px solid ${draft.fontIds?.[role] === f.id ? th.appAccent : th.appBorder}`,
                background: draft.fontIds?.[role] === f.id ? `${th.appAccent}18` : th.appCard,
                fontFamily: f.stack, fontSize: 14, color: th.appInk,
              }}>{f.label}</button>
            ))}
          </div>
        </div>
      );

      return (
        <Panel th={th}>
          <Title th={th}>{isExisting ? "Modifica template" : "Nuovo template"}</Title>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            <input
              value={draft.name}
              onChange={e => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome del template"
              style={{ width: "100%", padding: "9px 11px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appBg, fontFamily: F.body, fontSize: 13, color: th.appInk, outline: "none", boxSizing: "border-box", marginBottom: 14 }}
            />

            <div style={sectionLabelStyle}>Palette</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {PDF_PALETTES.map(p => (
                <button key={p.id} onClick={() => setEditingTemplate(prev => ({ ...prev, colors: deriveColorTokens(p.accent, p.ink, p.paper) }))}
                  title={p.label} style={{
                    width: 34, height: 34, borderRadius: "50%", cursor: "pointer", flexShrink: 0,
                    background: p.accent, border: `2.5px solid ${paletteActive(p) ? th.appInk : "transparent"}`,
                    boxShadow: `0 0 0 1px ${th.appBorder}`,
                  }} />
              ))}
            </div>

            <div style={sectionLabelStyle}>Colori personalizzati</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
              {[["accent", "Principale"], ["ink", "Testo"], ["paper", "Sfondo"]].map(([key, lbl]) => (
                <label key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: F.ui, fontSize: 10.5, color: th.appFaded, cursor: "pointer" }}>
                  <input type="color" value={draft.colors[key]} onChange={e => setColor(key, e.target.value)} style={{ width: 40, height: 40, border: "none", borderRadius: 8, cursor: "pointer", background: "none" }} />
                  {lbl}
                </label>
              ))}
            </div>

            {fontRow("Font dei titoli", "heading")}
            {fontRow("Font del testo", "body")}

            <div style={sectionLabelStyle}>Layout</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {PDF_LAYOUT_OPTIONS.map(l => (
                <button key={l.id} onClick={() => setEditingTemplate(prev => ({ ...prev, layoutId: l.id }))} style={{
                  flex: 1, padding: "8px 6px", borderRadius: 8, cursor: "pointer", fontFamily: F.ui, fontSize: 11.5, fontWeight: 700,
                  border: `1.5px solid ${draft.layoutId === l.id ? th.appAccent : th.appBorder}`,
                  background: draft.layoutId === l.id ? `${th.appAccent}18` : th.appCard, color: th.appInk,
                }}>{l.label}</button>
              ))}
            </div>

            {sizeRow("Dimensione testo", PDF_TEXT_SIZES, "textSize")}
            {sizeRow("Margini", PDF_MARGIN_SIZES, "margins")}
            {sizeRow("Dimensione foto", PDF_PHOTO_SIZES, "photoSize")}

            <Check th={th} checked={draft.onePerPage} onChange={v => setEditingTemplate(prev => ({ ...prev, onePerPage: v }))}
              label="Una ricetta per pagina" sub="Se disattivato, le ricette si susseguono senza andare sempre a nuova pagina." />
          </div>
          {isExisting && (
            <button onClick={() => {
              if (!window.confirm(`Eliminare il template "${draft.name}"?`)) return;
              onDeleteTemplate(draft.id);
              if (pdfPrefs.templateId === draft.id) setPdfPrefs(p => ({ ...p, templateId: "classico" }));
              setEditingTemplate(null);
            }} style={{ background: "transparent", border: "none", color: "#C4593A", fontFamily: F.ui, fontSize: 12, cursor: "pointer", padding: "6px 0", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <AppIcon emoji="🗑️" icon="elimina" size={12} /> Elimina template
            </button>
          )}
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <Ghost th={th} onClick={() => setEditingTemplate(null)} style={{ flex: 1 }}>Annulla</Ghost>
            <Primary th={th} onClick={() => {
              const saved = { ...draft, name: draft.name.trim() || "Template senza nome" };
              onSaveTemplate(saved);
              setPdfPrefs(p => ({ ...p, templateId: saved.id, layout: saved.layoutId }));
              setEditingTemplate(null);
            }} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><AppIcon emoji="✓" icon="fatto" size={14} /> Salva template</Primary>
          </div>
        </Panel>
      );
    }

    // format === "pdf"
    const sectionToggle = (id, label, badge) => (
      <button onClick={() => setPdfSection(id)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 2px", background: "transparent", border: "none", borderBottom: `1px solid ${th.appBorder}`,
        cursor: "pointer",
      }}>
        <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: th.appInk }}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {badge && <span style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded }}>{badge}</span>}
          <span style={{ color: th.appFaded, fontSize: 11 }}>{pdfSection === id ? "▾" : "▸"}</span>
        </span>
      </button>
    );

    const selectedLabel = customTemplate ? customTemplate.name : PDF_STYLE_OPTIONS.find(s => s.id === pdfPrefs.templateId)?.label;
    const activeContentCount = PDF_CONTENT_FIELDS.filter(f => pdfPrefs[f.key]).length;

    return (
      <Panel th={th}>
        <Title th={th}>Preferenze PDF</Title>
        <Sub th={th}>{sel.length} ricett{sel.length === 1 ? "a" : "e"}</Sub>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>

          {sectionToggle("content", "Contenuto", `${activeContentCount}/${PDF_CONTENT_FIELDS.length}`)}
          {pdfSection === "content" && (
            <div style={{ padding: "12px 2px 4px" }}>
              <div style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded, marginBottom: 10, lineHeight: 1.5 }}>
                Sempre inclusi: {PDF_ALWAYS_INCLUDED.map(k => ({ title: "titolo", ingredients: "ingredienti", steps: "passi" }[k])).join(", ")}.
              </div>
              {PDF_CONTENT_FIELDS.map(f => (
                <Check key={f.key} th={th} checked={pdfPrefs[f.key]} onChange={v => setPdfPrefs(p => ({ ...p, [f.key]: v }))} label={f.label} sub={f.sub} />
              ))}
              {multi && (
                <>
                  <Check th={th} checked={pdfPrefs.includeIndex} onChange={v => setPdfPrefs(p => ({ ...p, includeIndex: v }))} label="Indice" />
                  <div style={sectionLabelStyle}>Titolo di copertina</div>
                  <input
                    value={pdfPrefs.title}
                    onChange={e => setPdfPrefs(p => ({ ...p, title: e.target.value }))}
                    placeholder={`${sel.length} ricette`}
                    style={{ width: "100%", padding: "9px 11px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appBg, fontFamily: F.body, fontSize: 13, color: th.appInk, outline: "none", boxSizing: "border-box" }}
                  />
                </>
              )}
            </div>
          )}

          {sectionToggle("appearance", "Aspetto", selectedLabel)}
          {pdfSection === "appearance" && (
            <div style={{ padding: "12px 2px 4px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PDF_STYLE_OPTIONS.map(s => {
                  const t = PDF_STYLES[s.id];
                  return (
                    <button key={s.id} onClick={() => setPdfPrefs(p => ({ ...p, templateId: s.id }))} style={{
                      textAlign: "left", padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10,
                      border: `1.5px solid ${pdfPrefs.templateId === s.id ? th.appAccent : th.appBorder}`,
                      background: pdfPrefs.templateId === s.id ? `${th.appAccent}18` : th.appCard,
                    }}>
                      <div style={{
                        width: 44, height: 34, borderRadius: 8, flexShrink: 0,
                        background: t.cardBg, border: `1px solid ${t.border}`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                      }}>
                        <div style={{ fontFamily: t.bodyFont, fontStyle: "italic", fontSize: 11, color: t.ink }}>Aa</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.accent, flexShrink: 0 }} />
                          <span style={{ width: 14, height: 3, borderRadius: 2, background: t.accent2 }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: th.appInk }}>{s.label}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appFaded, marginTop: 1 }}>{s.desc}</div>
                      </div>
                    </button>
                  );
                })}
                {Object.values(userTemplates).sort((a, b) => a.name.localeCompare(b.name, "it")).map(tpl => (
                  <button key={tpl.id} onClick={() => setPdfPrefs(p => ({ ...p, templateId: tpl.id, layout: tpl.layoutId }))} style={{
                    textAlign: "left", padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    border: `1.5px solid ${pdfPrefs.templateId === tpl.id ? th.appAccent : th.appBorder}`,
                    background: pdfPrefs.templateId === tpl.id ? `${th.appAccent}18` : th.appCard,
                  }}>
                    <div style={{
                      width: 44, height: 34, borderRadius: 8, flexShrink: 0,
                      background: tpl.colors.cardBg, border: `1px solid ${tpl.colors.border}`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                    }}>
                      <div style={{ fontFamily: tpl.fonts.heading, fontStyle: "italic", fontSize: 11, color: tpl.colors.ink }}>Aa</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: tpl.colors.accent, flexShrink: 0 }} />
                        <span style={{ width: 14, height: 3, borderRadius: 2, background: tpl.colors.accent2 }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: th.appInk }}>{tpl.name}</div>
                      {defaultTemplateId === tpl.id && <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appFaded, marginTop: 1 }}>Predefinito</div>}
                    </div>
                    <span onClick={e => { e.stopPropagation(); setEditingTemplate(tpl); }} style={{ fontSize: 15, padding: 4, cursor: "pointer", display: "flex" }} title="Modifica"><AppIcon emoji="✏️" icon="modifica" size={15} /></span>
                    {defaultTemplateId !== tpl.id && (
                      <span onClick={e => { e.stopPropagation(); onSetDefaultTemplate(tpl.id); }} style={{ fontSize: 15, padding: 4, cursor: "pointer" }} title="Imposta come predefinito">☆</span>
                    )}
                  </button>
                ))}
              </div>
              <Ghost th={th} onClick={() => {
                const base = PDF_STYLES[BUILT_IN_STYLE_IDS.includes(pdfPrefs.templateId) ? pdfPrefs.templateId : "classico"];
                const baseColors = { accent: base.accent, ink: base.ink, paper: base.paper, accent2: base.accent2, faded: base.faded, cardBg: base.cardBg, border: base.border, borderLight: base.borderLight };
                setEditingTemplate(emptyDraftTemplate(baseColors));
              }} style={{ marginTop: 10, width: "100%" }}>
                + Nuovo template personalizzato
              </Ghost>
            </div>
          )}

          {sectionToggle("layout", "Layout", PDF_LAYOUT_OPTIONS.find(l => l.id === pdfPrefs.layout)?.label)}
          {pdfSection === "layout" && (
            <div style={{ padding: "12px 2px 4px", display: "flex", flexDirection: "column", gap: 6 }}>
              {PDF_LAYOUT_OPTIONS.map(l => (
                <button key={l.id} onClick={() => setPdfPrefs(p => ({ ...p, layout: l.id }))} style={{
                  textAlign: "left", padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  border: `1.5px solid ${pdfPrefs.layout === l.id ? th.appAccent : th.appBorder}`,
                  background: pdfPrefs.layout === l.id ? `${th.appAccent}18` : th.appCard,
                }}>
                  <div style={{
                    width: 52, height: 40, borderRadius: 8, flexShrink: 0, padding: 5,
                    background: th.appBg, border: `1px solid ${th.appBorder}`,
                    display: "flex", flexDirection: "column", gap: 3,
                  }}>
                    {l.id === "quaderno" ? (
                      <>
                        <div style={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
                            <div style={{ width: "70%", height: 3, borderRadius: 1, background: th.appAccent }} />
                            <div style={{ width: "90%", height: 3, borderRadius: 1, background: th.appFaded }} />
                          </div>
                          <div style={{ width: 14, height: 14, borderRadius: 2, background: th.appBorder, flexShrink: 0 }} />
                        </div>
                        <div style={{ display: "flex", gap: 3, flex: 1 }}>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ width: "100%", height: 2, background: th.appBorder }} />
                            <div style={{ width: "80%", height: 2, background: th.appBorder }} />
                          </div>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                            <div style={{ width: "100%", height: 2, background: th.appBorder }} />
                            <div style={{ width: "80%", height: 2, background: th.appBorder }} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: "60%", height: 3, borderRadius: 1, background: th.appAccent, margin: "0 auto" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, marginTop: 3 }}>
                          <div style={{ width: "100%", height: 2, background: th.appBorder }} />
                          <div style={{ width: "100%", height: 2, background: th.appBorder }} />
                          <div style={{ width: "70%", height: 2, background: th.appBorder }} />
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: th.appInk }}>{l.label}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded, marginTop: 2 }}>{l.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Ghost th={th} onClick={() => setStep("format")} style={{ flex: 1 }}>‹ Indietro</Ghost>
          <Primary th={th} onClick={submitPDF} style={{ flex: 2 }}>📄 Genera PDF</Primary>
        </div>
      </Panel>
    );
  }

  // ── Passo: risultato ──
  if (result?.kind === "books") {
    return (
      <Panel th={th}>
        <Title th={th}><span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><AppIcon emoji="✓" icon="fatto" size={17} /> Fatto</span></Title>
        <Sub th={th}>{selected.length} ricett{selected.length === 1 ? "a copiata" : "e copiate"} in {result.names.map(n => `«${n}»`).join(", ")}.</Sub>
        <Ghost th={th} onClick={onClose}>Chiudi</Ghost>
      </Panel>
    );
  }
  if (result?.kind === "link") {
    return (
      <Panel th={th}>
        <Title th={th}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AppIcon emoji="🔗" icon="link" size={16} /> {result.links.length > 1 ? "Link creati" : "Link creato"}</span></Title>
        <Sub th={th}>Validi 30 giorni, revocabili in ogni momento da "I miei link condivisi".</Sub>
        {result.links.some(l => l.photosDegraded) && (
          <div style={{ fontFamily: F.ui, fontSize: 11, color: "#C4593A", background: "#C4593A18", border: "1px solid #C4593A40", borderRadius: 10, padding: "8px 10px", marginBottom: 10, display: "flex", gap: 6 }}>
            <span style={{ flexShrink: 0 }}><AppIcon emoji="⚠️" icon="avviso" size={11} /></span>
            <span>{result.links.filter(l => l.photosDegraded).length === result.links.length ? "Foto/ricordi non inclusi" : "Foto/ricordi non inclusi in alcuni link"}: duplicazione non riuscita, il link è stato creato comunque senza.</span>
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          {result.links.map(l => {
            const url = `${window.location.origin}/?shared=${l.shareId}`;
            return (
              <div key={l.shareId} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: F.ui, fontSize: 11.5, color: th.appInk, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>{l.recipeTitle}{l.photosDegraded && <AppIcon emoji="⚠️" icon="avviso" size={11} />}</div>
                <textarea readOnly value={url} onClick={e => e.target.select()} style={{
                  width: "100%", height: 40, resize: "none", borderRadius: 10, padding: "8px 10px",
                  border: `1.5px solid ${th.appBorder}`, background: th.appCard, color: th.appInk,
                  fontFamily: "monospace", fontSize: 11, marginBottom: 4,
                }} />
                <button onClick={() => copyToClipboard(url, () => { setLinkCopiedId(l.shareId); setTimeout(() => setLinkCopiedId(null), 1500); })} style={{
                  padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${th.appBorder}`, background: "transparent",
                  color: th.appInk, fontFamily: F.ui, fontSize: 11, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  {linkCopiedId === l.shareId
                    ? <><AppIcon emoji="✓" icon="fatto" size={12} /> Copiato</>
                    : <><AppIcon emoji="📋" icon="copia" size={12} /> Copia</>}
                </button>
              </div>
            );
          })}
        </div>
        {result.links.length > 1 && (
          <Primary th={th} onClick={() => copyToClipboard(
            result.links.map(l => `${l.recipeTitle}: ${window.location.origin}/?shared=${l.shareId}`).join("\n"),
            () => { setAllCopied(true); setTimeout(() => setAllCopied(false), 1500); }
          )} style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {allCopied
              ? <><AppIcon emoji="✓" icon="fatto" size={14} /> Copiati</>
              : <><AppIcon emoji="📋" icon="copia" size={14} /> Copia tutti i link</>}
          </Primary>
        )}
        <Ghost th={th} onClick={onClose}>Chiudi</Ghost>
      </Panel>
    );
  }
  if (result?.kind === "pdf") {
    return (
      <Panel th={th}>
        <Title th={th}>📄 PDF generato</Title>
        <Sub th={th}>Si è aperta una nuova scheda: da lì puoi stampare o salvare come PDF.</Sub>
        <Ghost th={th} onClick={onClose}>Chiudi</Ghost>
      </Panel>
    );
  }

  return null;
}
