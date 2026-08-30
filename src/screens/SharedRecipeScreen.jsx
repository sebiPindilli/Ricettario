import { useState, useEffect, useRef } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F } from "../data/constants.js";
import { isSectioned, ingredientToText, stepPhotosOf, dishPhotoOf } from "../utils/helpers.js";
import { loadSharedStatus, loadSharedContent } from "../services/sharedRecipesStore.js";
import ChosenIcon from "../components/ChosenIcon.jsx";
import AppIcon from "../components/AppIcon.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: SharedRecipeScreen — apertura di un link di condivisione
// (?shared=ID). Vista sola lettura, con "Chiudi" e "Aggiungi al mio
// ricettario". Copre esplicitamente ogni caso di link non valido, ognuno
// con un messaggio distinto — mai un caricamento infinito o una schermata
// bianca (vedi firestore.rules per come i due documenti, stato e
// contenuto, permettono di distinguere il motivo lato client).
// ══════════════════════════════════════════════════════════════
const Shell = ({ th, onClose, children }) => (
  <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
    <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${th.appBorder}` }}>
      <div style={{ fontFamily:F.display, fontSize:16, fontStyle:"italic", color:th.appInk }}>🔗 Ricetta condivisa</div>
      <button onClick={onClose} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>Chiudi</button>
    </div>
    <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>{children}</div>
  </div>
);

const Message = ({ th, icon, title, sub }) => (
  <div style={{ textAlign:"center", padding:"60px 20px" }}>
    <div style={{ fontSize:44, marginBottom:14 }}>{icon}</div>
    <div style={{ fontFamily:F.display, fontSize:18, color:th.appInk, marginBottom:8 }}>{title}</div>
    <div style={{ fontFamily:F.ui, fontSize:13, color:th.appFaded, lineHeight:1.5 }}>{sub}</div>
  </div>
);

export default function SharedRecipeScreen({ shareId, me, editableBooks = [], onAddToBook, onClose }) {
  const th = useTheme();
  const ui = useUiStyle();
  const isNew = ui.id !== "classico";
  const saveSectionRef = useRef(null);
  const [phase, setPhase] = useState("loading"); // loading | not-found | revoked | expired | forbidden | ready
  const [status, setStatus] = useState(null);
  const [content, setContent] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addedTo, setAddedTo] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!shareId) { setPhase("not-found"); return; }
      let s;
      try {
        s = await loadSharedStatus(shareId);
      } catch {
        s = null;
      }
      if (cancelled) return;
      if (!s) { setPhase("not-found"); return; }
      setStatus(s);

      if (s.revoked) { setPhase("revoked"); return; }
      const expiresAtMs = s.expiresAt?.toMillis ? s.expiresAt.toMillis() : 0;
      if (expiresAtMs && expiresAtMs < Date.now()) { setPhase("expired"); return; }
      const isSharer = s.sharedBy === me;
      const isAllowed = s.visibility === "anyone" || isSharer || (s.allowedEmails || []).includes(me);
      if (!isAllowed) { setPhase("forbidden"); return; }

      try {
        const c = await loadSharedContent(shareId);
        if (cancelled) return;
        if (!c) { setPhase("not-found"); return; }
        setContent(c);
        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("not-found");
      }
    })();
    return () => { cancelled = true; };
  }, [shareId, me]);

  const toggleBook = (id) => setSelectedBooks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const doAdd = async () => {
    if (selectedBooks.length === 0 || adding) return;
    setAdding(true); setAddError(null);
    try {
      for (const bookId of selectedBooks) {
        await onAddToBook(bookId, content, { applyIngredientData: !!content.ingredientData });
      }
      setAddedTo(selectedBooks.map(id => editableBooks.find(b => b.id === id)?.name).filter(Boolean));
      setSelectedBooks([]);
    } catch {
      setAddError("Non sono riuscito ad aggiungere la ricetta. Riprova.");
    } finally {
      setAdding(false);
    }
  };

  if (phase === "loading") {
    return <Shell th={th} onClose={onClose}><Message th={th} icon="⏳" title="Apertura in corso…" sub="Un attimo." /></Shell>;
  }
  if (phase === "not-found") {
    return <Shell th={th} onClose={onClose}><Message th={th} icon="🔗" title="Link non valido" sub="Questo link non esiste o è scritto male. Chiedi a chi te l'ha mandato di rimandartelo." /></Shell>;
  }
  if (phase === "revoked") {
    return <Shell th={th} onClose={onClose}><Message th={th} icon="🚫" title="Link revocato" sub={`Chi ha condiviso "${status?.recipeTitle || "questa ricetta"}" ha disattivato il link.`} /></Shell>;
  }
  if (phase === "expired") {
    return <Shell th={th} onClose={onClose}><Message th={th} icon="⌛" title="Link scaduto" sub="I link di condivisione durano 30 giorni. Chiedi un nuovo link a chi te l'ha mandato." /></Shell>;
  }
  if (phase === "forbidden") {
    return <Shell th={th} onClose={onClose}><Message th={th} icon="🔒" title="Non condiviso con te" sub="Chi ha condiviso questa ricetta l'ha riservata a persone specifiche, e il tuo account non è tra queste." /></Shell>;
  }

  // phase === "ready"
  const recipe = content.recipe;
  const flatIng = isSectioned(recipe.ingredients)
    ? recipe.ingredients.flatMap(s => s.section ? [{ section:s.section }, ...s.items.map(it => ({ text: ingredientToText(it) }))] : s.items.map(it => ({ text: ingredientToText(it) })))
    : recipe.ingredients.map(it => ({ text: ingredientToText(it) }));
  const flatSteps = isSectioned(recipe.steps)
    ? recipe.steps.flatMap(s => {
        const items = s.items.map(st => ({ text: typeof st === "string" ? st : st.text, photos: stepPhotosOf(st) }));
        return s.section ? [{ sectionLabel: s.section }, ...items] : items;
      })
    : recipe.steps.map(st => ({ text: typeof st === "string" ? st : st.text, photos: stepPhotosOf(st) }));

  return (
    <Shell th={th} onClose={onClose}>
      <div style={{ textAlign:"center", marginBottom:14 }}>
        <div style={{ width:64, height:64, borderRadius:16, background:recipe.color || th.appAccent, color:"#fff", margin:"0 auto 10px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {dishPhotoOf(recipe) ? <img src={dishPhotoOf(recipe)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <ChosenIcon emoji={recipe.emoji || "🍽️"} icon={recipe.icon} size={30} />}
        </div>
        <div style={{ fontFamily:F.display, fontSize:22, fontStyle:"italic", color:th.appInk }}>{recipe.title}</div>
        <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:4 }}>
          Condivisa da {status.sharedBy}
        </div>
        <div style={{ fontFamily:F.ui, fontSize:11.5, color:th.appFaded, marginTop:8 }}>
          Prep: {recipe.prepTime || 0} min · Cottura: {recipe.cookTime || 0} min · {recipe.servings || 4} porzioni
        </div>
        {/* "Salva nel mio ricettario" in cima e in fondo (DECISIONI.md §Ricetta condivisa) */}
        {isNew && editableBooks.length > 0 && (
          <button onClick={() => saveSectionRef.current?.scrollIntoView({ behavior:"smooth", block:"start" })} style={{
            marginTop:12, padding:"10px 18px", borderRadius:20, border:"none",
            background:th.appAccent, color:"#fff", fontFamily:F.ui, fontSize:12.5, fontWeight:700, cursor:"pointer",
          }}>＋ Salva nel mio ricettario</button>
        )}
      </div>

      {/* Ricordi collegati — solo se erano accesi al momento della condivisione */}
      {isNew && recipe.memories && recipe.memories.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:F.ui, fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:th.appAccent, marginBottom:8 }}>Ricordi</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {recipe.memories.map(mem => (
              <div key={mem.id} style={{ borderRadius:12, overflow:"hidden", border:`1px solid ${th.appBorder}`, background:th.appCard }}>
                {mem.photo && <img src={mem.photo} alt="" style={{ width:"100%", height:100, objectFit:"cover", display:"block" }}/>}
                <div style={{ padding:"7px 9px" }}>
                  {mem.caption && <div style={{ fontFamily:F.body, fontSize:12, fontStyle:"italic", color:th.appInk, lineHeight:1.4 }}>{mem.caption}</div>}
                  {mem.date && <div style={{ fontFamily:F.ui, fontSize:9.5, color:th.appFaded, marginTop:3 }}>{mem.date}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(status.includedData?.ingredients || status.includedData?.photos || status.includedData?.memories) && (
        <div style={{ background:`${th.appAccent}10`, border:`1px dashed ${th.appAccent}55`, borderRadius:10, padding:"9px 12px", marginBottom:14, fontFamily:F.ui, fontSize:11, color:th.appFaded, lineHeight:1.5, display:"flex", gap:6 }}>
          <span style={{ flexShrink:0 }}><AppIcon emoji="💡" icon="suggerimento" size={11} /></span>
          <span>Questa condivisione include anche {[
            status.includedData.ingredients && "i dati ingredienti (categorie, nutrizione, equivalenze)",
            status.includedData.photos && "le foto",
            status.includedData.memories && "i ricordi",
          ].filter(Boolean).join(", ")}.
          {status.includedData.ingredients ? " I dati ingredienti verranno applicati solo se il libro scelto non ne ha già di propri." : ""}
          </span>
        </div>
      )}

      {recipe.note && (
        <div style={{ border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"10px 14px", fontFamily:F.body, fontSize:13, fontStyle:"italic", color:th.appFaded, marginBottom:16, background:th.appCard }}>{recipe.note}</div>
      )}

      <div style={{ fontFamily:F.ui, fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:th.appAccent, marginBottom:8 }}>Ingredienti</div>
      <div style={{ marginBottom:20 }}>
        {flatIng.map((ing, i) => ing.section != null
          ? <div key={i} style={{ fontFamily:F.ui, fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:th.appAccent, margin:"10px 0 4px" }}>{ing.section}</div>
          : <div key={i} style={{ fontFamily:F.body, fontSize:13.5, color:th.appInk, padding:"4px 0", borderBottom:`1px solid ${th.appBorder}55` }}>{ing.text}</div>
        )}
      </div>

      <div style={{ fontFamily:F.ui, fontSize:12, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color:th.appAccent, marginBottom:8 }}>Preparazione</div>
      <div style={{ marginBottom:24 }}>
        {(() => {
          let n = 0;
          return flatSteps.map((step, i) => step.sectionLabel != null
            ? <div key={i} style={{ fontFamily:F.ui, fontSize:10.5, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:th.appAccent, margin:"10px 0 4px" }}>{step.sectionLabel}</div>
            : (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:12 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:recipe.color || th.appAccent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>{++n}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:F.body, fontSize:13.5, color:th.appInk, lineHeight:1.55 }}>{step.text}</div>
                  {step.photos && step.photos.length > 0 && (
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:6 }}>
                      {step.photos.map((p, pi) => <img key={pi} src={p} alt="" style={{ width:"100%", height:100, objectFit:"cover", borderRadius:8, border:`1px solid ${th.appBorder}` }}/>)}
                    </div>
                  )}
                </div>
              </div>
            )
          );
        })()}
      </div>

      <div ref={saveSectionRef} style={{ borderTop:`1px solid ${th.appBorder}`, paddingTop:16 }}>
        <div style={{ fontFamily:F.display, fontSize:15, color:th.appInk, marginBottom:8 }}>Aggiungi al mio ricettario</div>
        {editableBooks.length === 0 ? (
          <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, lineHeight:1.5 }}>Non hai libri su cui puoi scrivere (serve almeno un libro come proprietario, co-proprietario o collaboratore).</div>
        ) : (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
              {editableBooks.map(b => (
                <label key={b.id} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontFamily:F.ui, fontSize:13, color:th.appInk }}>
                  <input type="checkbox" checked={selectedBooks.includes(b.id)} onChange={() => toggleBook(b.id)} />
                  {b.name}
                </label>
              ))}
            </div>
            {addError && <div style={{ fontFamily:F.ui, fontSize:11.5, color:"#C4593A", marginBottom:8 }}>{addError}</div>}
            {addedTo.length > 0 && (
              <div style={{ fontFamily:F.ui, fontSize:11.5, color:"#6B8C6E", fontWeight:700, marginBottom:8 }}>✓ Aggiunta a {addedTo.join(", ")}</div>
            )}
            <button onClick={doAdd} disabled={selectedBooks.length === 0 || adding} style={{
              width:"100%", padding:"13px", borderRadius:12, border:"none",
              background: selectedBooks.length === 0 || adding ? th.appBorder : th.appAccent,
              color: selectedBooks.length === 0 || adding ? th.appFaded : "#fff",
              fontFamily:F.ui, fontSize:13, fontWeight:700, cursor: selectedBooks.length === 0 || adding ? "default" : "pointer",
            }}>{adding ? "Aggiunta…" : "＋ Aggiungi al mio ricettario"}</button>
          </>
        )}
      </div>
    </Shell>
  );
}
