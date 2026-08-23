import { useState } from "react";
import { useTheme } from "../context.js";
import { F, MACRO_SECTIONS } from "../data/constants.js";
import { sortSectionsAltroLast } from "../utils/helpers.js";
import InfoButton from "./InfoButton.jsx";
import { guideEsporta } from "../data/guideContent.jsx";
import { PDF_STYLES } from "../utils/pdfStyles.js";

const PDF_STYLE_OPTIONS = [
  { id: "classico", label: "Classico", desc: "Serif, accenti caldi — lo stile originale" },
  { id: "minimal", label: "Minimal", desc: "Sans-serif in bianco e nero, compatto" },
  { id: "moderno", label: "Moderno", desc: "Sans-serif con accento colore, foto più grandi" },
];

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
}) {
  const th = useTheme();
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
  const [pdfPrefs, setPdfPrefs] = useState({
    includeDishPhoto: true, includeStepPhotos: true, includeNutrition: false, includeMemories: false,
    includeIndex: true, includeSubsectionNames: true, style: "classico", title: "",
  });
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

  const submitPDF = () => {
    const sel = recipes.filter(r => selected.includes(r.id));
    onExportPDF(selected, {
      includeDishPhoto: pdfPrefs.includeDishPhoto,
      includeStepPhotos: pdfPrefs.includeStepPhotos,
      includeNutrition: pdfPrefs.includeNutrition,
      includeMemories: pdfPrefs.includeMemories,
      includeIndex: sel.length > 1 ? pdfPrefs.includeIndex : false,
      includeSubsectionNames: pdfPrefs.includeSubsectionNames,
      style: pdfPrefs.style,
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
        }}>{allSelected ? "✓ Tutto il ricettario selezionato" : "Seleziona tutto"}</button>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          {sortSectionsAltroLast(sectionList).map(sec => {
            const inSec = recipes.filter(r => r.macroSection === sec.id);
            if (inSec.length === 0) return null;
            return (
              <div key={sec.id} style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: F.ui, fontSize: 10, color: th.appFaded, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 2px" }}>{sec.emoji} {sec.label}</div>
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
          <Primary th={th} onClick={() => { setDest("books"); setStep("books"); }}>📚 Un mio altro ricettario</Primary>
          <Primary th={th} onClick={() => { setDest("person"); setStep("format"); }}>🧑‍🤝‍🧑 Un'altra persona</Primary>
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
                  <span style={{ fontSize: 16 }}>{b.type === "personale" ? "🔒" : "👥"}</span>
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
          <Primary th={th} onClick={() => { setFormat("link"); goPrefs(); }}>🔗 Link URL <span style={{ fontWeight: 400 }}>— consigliato per chi ha l'app</span></Primary>
          <Primary th={th} onClick={() => { setFormat("pdf"); goPrefs(); }}>📄 PDF <span style={{ fontWeight: 400 }}>— consigliato per persone esterne</span></Primary>
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
            <Primary th={th} onClick={submitBooks} disabled={busy} style={{ flex: 2 }}>{busy ? "Copia…" : "✓ Copia ricette"}</Primary>
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
            <Primary th={th} onClick={submitLink} disabled={busy || !linkCanSubmit} style={{ flex: 2 }}>{busy ? "Creazione…" : `🔗 Genera ${sel.length > 1 ? `${sel.length} link` : "link"}`}</Primary>
          </div>
        </Panel>
      );
    }

    // format === "pdf"
    return (
      <Panel th={th}>
        <Title th={th}>Preferenze PDF</Title>
        <Sub th={th}>{sel.length} ricett{sel.length === 1 ? "a" : "e"}</Sub>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          <Check th={th} checked={pdfPrefs.includeDishPhoto} onChange={v => setPdfPrefs(p => ({ ...p, includeDishPhoto: v }))} label="Foto piatto" />
          <Check th={th} checked={pdfPrefs.includeStepPhotos} onChange={v => setPdfPrefs(p => ({ ...p, includeStepPhotos: v }))} label="Foto preparazione" />
          <Check th={th} checked={pdfPrefs.includeNutrition} onChange={v => setPdfPrefs(p => ({ ...p, includeNutrition: v }))} label="Valori nutrizionali" />
          <Check th={th} checked={pdfPrefs.includeMemories} onChange={v => setPdfPrefs(p => ({ ...p, includeMemories: v }))} label="Ricordi collegati" />
          <Check th={th} checked={pdfPrefs.includeSubsectionNames} onChange={v => setPdfPrefs(p => ({ ...p, includeSubsectionNames: v }))} label="Nomi delle sottosezioni" sub="Es. «Per l'impasto», «Per la farcitura»." />
          {multi && (
            <>
              <Check th={th} checked={pdfPrefs.includeIndex} onChange={v => setPdfPrefs(p => ({ ...p, includeIndex: v }))} label="Indice" />
              <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", margin: "10px 0 6px" }}>Titolo di copertina</div>
              <input
                value={pdfPrefs.title}
                onChange={e => setPdfPrefs(p => ({ ...p, title: e.target.value }))}
                placeholder={`${sel.length} ricette`}
                style={{ width: "100%", padding: "9px 11px", border: `1.5px solid ${th.appBorder}`, borderRadius: 10, background: th.appBg, fontFamily: F.body, fontSize: 13, color: th.appInk, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
              />
            </>
          )}
          <div style={{ fontFamily: F.ui, fontSize: 10, letterSpacing: 1, color: th.appFaded, textTransform: "uppercase", margin: "10px 0 8px" }}>Stile</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PDF_STYLE_OPTIONS.map(s => {
              const t = PDF_STYLES[s.id];
              return (
                <button key={s.id} onClick={() => setPdfPrefs(p => ({ ...p, style: s.id }))} style={{
                  textAlign: "left", padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  border: `1.5px solid ${pdfPrefs.style === s.id ? th.appAccent : th.appBorder}`,
                  background: pdfPrefs.style === s.id ? `${th.appAccent}18` : th.appCard,
                }}>
                  {/* Anteprima — approssima colori/font veri dello stile PDF (stessi token di pdfCss in ricettario-v23.jsx) */}
                  <div style={{
                    width: 52, height: 40, borderRadius: 8, flexShrink: 0,
                    background: t.cardBg, border: `1px solid ${t.border}`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  }}>
                    <div style={{ fontFamily: t.bodyFont, fontStyle: "italic", fontSize: 12, color: t.ink }}>Aa</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: t.accent, flexShrink: 0 }} />
                      <span style={{ width: 16, height: 3, borderRadius: 2, background: t.accent2 }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: th.appInk }}>{s.label}</div>
                    <div style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded, marginTop: 2 }}>{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
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
        <Title th={th}>✓ Fatto</Title>
        <Sub th={th}>{selected.length} ricett{selected.length === 1 ? "a copiata" : "e copiate"} in {result.names.map(n => `«${n}»`).join(", ")}.</Sub>
        <Ghost th={th} onClick={onClose}>Chiudi</Ghost>
      </Panel>
    );
  }
  if (result?.kind === "link") {
    return (
      <Panel th={th}>
        <Title th={th}>🔗 {result.links.length > 1 ? "Link creati" : "Link creato"}</Title>
        <Sub th={th}>Validi 30 giorni, revocabili in ogni momento da "I miei link condivisi".</Sub>
        {result.links.some(l => l.photosDegraded) && (
          <div style={{ fontFamily: F.ui, fontSize: 11, color: "#C4593A", background: "#C4593A18", border: "1px solid #C4593A40", borderRadius: 10, padding: "8px 10px", marginBottom: 10 }}>
            ⚠️ {result.links.filter(l => l.photosDegraded).length === result.links.length ? "Foto/ricordi non inclusi" : "Foto/ricordi non inclusi in alcuni link"}: duplicazione non riuscita, il link è stato creato comunque senza.
          </div>
        )}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          {result.links.map(l => {
            const url = `${window.location.origin}/?shared=${l.shareId}`;
            return (
              <div key={l.shareId} style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: F.ui, fontSize: 11.5, color: th.appInk, fontWeight: 700, marginBottom: 4 }}>{l.recipeTitle}{l.photosDegraded ? " ⚠️" : ""}</div>
                <textarea readOnly value={url} onClick={e => e.target.select()} style={{
                  width: "100%", height: 40, resize: "none", borderRadius: 10, padding: "8px 10px",
                  border: `1.5px solid ${th.appBorder}`, background: th.appCard, color: th.appInk,
                  fontFamily: "monospace", fontSize: 11, marginBottom: 4,
                }} />
                <button onClick={() => copyToClipboard(url, () => { setLinkCopiedId(l.shareId); setTimeout(() => setLinkCopiedId(null), 1500); })} style={{
                  padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${th.appBorder}`, background: "transparent",
                  color: th.appInk, fontFamily: F.ui, fontSize: 11, cursor: "pointer",
                }}>{linkCopiedId === l.shareId ? "✓ Copiato" : "📋 Copia"}</button>
              </div>
            );
          })}
        </div>
        {result.links.length > 1 && (
          <Primary th={th} onClick={() => copyToClipboard(
            result.links.map(l => `${l.recipeTitle}: ${window.location.origin}/?shared=${l.shareId}`).join("\n"),
            () => { setAllCopied(true); setTimeout(() => setAllCopied(false), 1500); }
          )} style={{ marginBottom: 8 }}>{allCopied ? "✓ Copiati" : "📋 Copia tutti i link"}</Primary>
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
