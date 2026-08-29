import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F, MACRO_SECTIONS, DEFAULT_UNIT_SUGGESTIONS } from "../data/constants.js";
import { isSectioned, toSectioned, fromSectioned, stripPhotolessStep, stepPhotosOf, durationOf, collectAllIngredients, flattenIngredients, normalizeSteps } from "../utils/helpers.js";
import BackBtn from "../components/BackBtn.jsx";
import EditField from "../components/EditField.jsx";
import EditLabel from "../components/EditLabel.jsx";
import EditNumberInput from "../components/EditNumberInput.jsx";
import TagPicker from "../components/TagPicker.jsx";
import EmojiColorPicker from "../components/EmojiColorPicker.jsx";
import ChosenIcon from "../components/ChosenIcon.jsx";
import SectionPicker from "../components/SectionPicker.jsx";
import EditSectionedList from "../components/EditSectionedList.jsx";
import EditSectionedSteps from "../components/EditSectionedSteps.jsx";
import InfoButton from "../components/InfoButton.jsx";
import { guideNuovaModificaRicetta } from "../data/guideContent.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: EDIT RECIPE
// ══════════════════════════════════════════════════════════════
export default function EditScreen({ recipe, onBack, onSave, extraTagGroups=[], onAddGroup, onAddTagToGroup, sectionList=MACRO_SECTIONS, onAddSection, onUpdateSection, onDeleteSection, allRecipes=[] }) {
  const th = useTheme();
  // Normalise steps: can be string or {text, photos} (o vecchio {text, photo}).
  // Sectioned-aware: se ci sono sottosezioni, normalizza gli item dentro
  // ciascuna, mai il wrapper {section, items} (vedi bug #steps-sezionati).
  const normaliseSteps = (steps) => {
    const normOne = (s) =>
      typeof s === "string" ? { text: s, photos: [], duration: null } : { text: s?.text ?? "", photos: stepPhotosOf(s), duration: durationOf(s) };
    return isSectioned(steps)
      ? steps.map(sec => ({ ...sec, items: (sec.items || []).map(normOne) }))
      : (steps || []).map(normOne);
  };

  const [draft, setDraft] = useState({ ...recipe, steps: normaliseSteps(recipe.steps) });
  const [activeSection, setActiveSection] = useState("info");

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  // Rimuove del tutto la chiave invece di scriverci undefined: Firestore
  // rifiuta i campi undefined nei documenti (vedi onIcon in EmojiColorPicker,
  // che passa undefined per tornare all'emoji dopo aver scelto un'icona SVG).
  const setIcon = (i) => setDraft(d => i === undefined
    ? Object.fromEntries(Object.entries(d).filter(([k]) => k !== "icon"))
    : { ...d, icon: i });

  const toggleTag = (tag) => {
    set("tags", draft.tags.includes(tag) ? draft.tags.filter(t=>t!==tag) : [...draft.tags, tag]);
  };

  // Normalizzazione a salvataggio unificata con saveNewRecipe (vedi
  // normalizeSteps in helpers.js) — prima questo screen usava solo
  // stripPhotolessStep, senza filtrare step/sezioni vuote come invece
  // faceva già la creazione di una ricetta nuova: bug corretto qui.
  const handleSave = () => {
    onSave({
      ...draft, steps: normalizeSteps(draft.steps),
      // Campi tempo lasciati vuoti in fase di modifica (es. cancellati per
      // riscriverli): si popolano a 0 solo qui, al salvataggio, mai durante
      // la digitazione (altrimenti l'input "combatterebbe" con l'utente).
      prepTime: draft.prepTime === "" ? 0 : draft.prepTime,
      cookTime: draft.cookTime === "" ? 0 : draft.cookTime,
    });
  };


  // Suggerimenti autocomplete da tutto il ricettario attivo
  const nameSuggestions = React.useMemo(() =>
    collectAllIngredients(allRecipes).map(i => i.display),
    [allRecipes]);
  const unitSuggestions = React.useMemo(() => {
    const found = new Set();
    allRecipes.forEach(r => flattenIngredients(r.ingredients).forEach(ing => {
      if (ing.unit && ing.unit !== "q.b.") found.add(ing.unit);
    }));
    return Array.from(new Set([...DEFAULT_UNIT_SUGGESTIONS, ...found]));
  }, [allRecipes]);

  const sections = ["info","ingredienti","preparazione","note"];

  return (
    <div style={{ background:"#FAF7F0", minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BackBtn onBack={onBack} label="Annulla"/>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <InfoButton>{guideNuovaModificaRicetta}</InfoButton>
          <button onClick={handleSave} style={{
            background:"#C4593A", color:"#fff",
            border:"none", borderRadius:10,
            padding:"8px 18px",
            fontFamily:F.ui, fontSize:13, fontWeight:700,
            cursor:"pointer",
          }}>Salva ✓</button>
        </div>
      </div>

      <div style={{ padding:"12px 20px 4px" }}>
        <div style={{ fontFamily:F.display, fontSize:20, color:"#2C2416" }}>Modifica Ricetta</div>
      </div>

      {/* Preview hero — updates live */}
      <div style={{
        margin:"12px 20px 0",
        background: draft.color,
        borderRadius:16,
        padding:"18px 20px",
        display:"flex", alignItems:"center", gap:14,
      }}>
        <div style={{
          width:52, height:52, borderRadius:12,
          background:"rgba(255,255,255,0.2)", color:"#fff",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}><ChosenIcon emoji={draft.emoji} icon={draft.icon} size={26} /></div>
        <div>
          <div style={{
            fontFamily:F.display, fontSize:20, color:"#fff",
            opacity: draft.title ? 1 : 0.4,
          }}>{draft.title || "Nome ricetta…"}</div>
          <div style={{ fontFamily:F.ui, fontSize:11, color:"rgba(255,255,255,0.65)", marginTop:3 }}>
            {(() => { const tot = (Number(draft.prepTime)||0) + (Number(draft.cookTime)||0); return tot > 0 ? `${tot} min · ` : ""; })()}{draft.servings} porzioni
          </div>
        </div>
      </div>

      {/* Emoji + color picker */}
      <div style={{ padding:"10px 20px 0" }}>
        <EmojiColorPicker
          emoji={draft.emoji}
          color={draft.color}
          icon={draft.icon}
          onEmoji={e => set("emoji", e)}
          onColor={c => set("color", c)}
          onIcon={setIcon}
          title={draft.title}
        />
      </div>

      {/* Section tabs */}
      <div style={{ display:"flex", overflowX:"auto", gap:6, padding:"4px 20px 10px", scrollbarWidth:"none" }}>
        {sections.map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            flexShrink:0, padding:"6px 14px", borderRadius:20,
            border:"none",
            background: activeSection===s ? "#2C2416" : "#EDE6D4",
            color: activeSection===s ? "#fff" : "#7A6E5F",
            fontFamily:F.ui, fontSize:12, fontWeight:600,
            cursor:"pointer", textTransform:"capitalize",
          }}>{s}</button>
        ))}
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 20px 60px" }}>

        {/* ── INFO ── */}
        {activeSection==="info" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <EditField label="Titolo" value={draft.title} onChange={v => set("title",v)}/>
            {/* Sezione del libro */}
            <div>
              <EditLabel text="Sezione del ricettario"/>
              <SectionPicker
                value={draft.macroSection}
                onChange={v => set("macroSection", v)}
                sections={sectionList}
                onAddSection={onAddSection}
                onUpdateSection={onUpdateSection}
        onDeleteSection={onDeleteSection}
                showDefaultHint={false}
              />
            </div>
            <EditField label="Fonte / Autore" value={draft.source} onChange={v => set("source",v)} placeholder="es. Nonna Maria"/>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ flex:1 }}>
                <EditLabel text="Prep (min)"/>
                <EditNumberInput value={draft.prepTime} onChange={v => set("prepTime", v===""?"":Number(v))}/>
              </div>
              <div style={{ flex:1 }}>
                <EditLabel text="Cottura (min)"/>
                <EditNumberInput value={draft.cookTime} onChange={v => set("cookTime", v===""?"":Number(v))}/>
              </div>
              <div style={{ flex:1 }}>
                <EditLabel text="Porzioni"/>
                <EditNumberInput value={draft.servings} onChange={v => set("servings", Number(v))}/>
              </div>
            </div>

            {/* Tags */}
            <div>
              <EditLabel text="Tag"/>
              <TagPicker
                selectedTags={draft.tags}
                onChange={(tags) => set("tags", tags)}
                extraGroups={extraTagGroups}
                onAddGroup={onAddGroup}
                onAddTagToGroup={onAddTagToGroup}
              />
            </div>
          </div>
        )}

        {/* ── INGREDIENTI ── */}
        {activeSection==="ingredienti" && (
          <div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:10, lineHeight:1.4, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"9px 12px" }}>
              💡 Inserisci ingrediente e quantità. Le <b>categorie</b> e gli <b>aggregati</b> (usati in Svuota Frigo) si gestiscono nella sezione <b>🍎⚙️ Organizza</b> del banner, così valgono per tutte le ricette.
            </div>
            <EditSectionedList
              data={toSectioned(draft.ingredients)}
              color={draft.color}
              itemType="ingredient"
              onUpdate={(sections) => set("ingredients", fromSectioned(sections))}
              nameSuggestions={nameSuggestions}
              unitSuggestions={unitSuggestions}
            />
          </div>
        )}

        {/* ── PREPARAZIONE ── */}
        {activeSection==="preparazione" && (
          <EditSectionedSteps
            data={toSectioned(draft.steps)}
            color={draft.color}
            onUpdate={(sections) => {
              const flat = fromSectioned(sections);
              // if flat array, strip photo-less steps back to strings
              if (Array.isArray(flat) && flat.length > 0 && !("section" in flat[0])) {
                set("steps", flat.map(stripPhotolessStep));
              } else {
                // sectioned: keep structure, strip photo-less items
                set("steps", sections.map(sec => ({
                  section: sec.section,
                  items: sec.items.map(stripPhotolessStep),
                })));
              }
            }}
          />
        )}

        {/* ── NOTE ── */}
        {activeSection==="note" && (
          <div>
            <EditLabel text="Note e consigli"/>
            <textarea
              value={draft.note}
              onChange={e => set("note", e.target.value)}
              rows={5}
              placeholder="Aggiungi note, varianti, consigli…"
              style={{
                width:"100%", padding:"12px 14px",
                border:`1.5px solid #EDE6D4`,
                borderRadius:12, background:"#F7F2E8",
                fontFamily:F.body, fontStyle:"italic",
                fontSize:14, color:"#2C2416",
                outline:"none", resize:"none", lineHeight:1.6,
                boxSizing:"border-box",
              }}
            />
            <EditLabel text="Fonte / Autore ricetta" style={{ marginTop:14 }}/>
            <input
              value={draft.source}
              onChange={e => set("source", e.target.value)}
              placeholder="es. Nonna Maria, Giallo Zafferano…"
              style={{
                width:"100%", padding:"10px 14px",
                border:`1.5px solid #EDE6D4`,
                borderRadius:10, background:"#F7F2E8",
                fontFamily:F.ui, fontSize:13, color:"#2C2416",
                outline:"none", boxSizing:"border-box",
              }}
            />
          </div>
        )}
      </div>

      {/* Floating save bar */}
      <div style={{
        position:"sticky", bottom:0,
        background:"#FAF7F0",
        borderTop:`1px solid ${"#EDE6D4"}`,
        padding:"12px 20px",
        display:"flex", gap:10,
      }}>
        <button onClick={onBack} style={{
          flex:1, padding:"12px",
          border:`1.5px solid #EDE6D4`,
          borderRadius:12, background:"transparent",
          color:"#7A6E5F", fontFamily:F.ui, fontSize:14,
          cursor:"pointer",
        }}>Annulla</button>
        <button onClick={handleSave} style={{
          flex:2, padding:"12px",
          background:"#C4593A", color:"#fff",
          border:"none", borderRadius:12,
          fontFamily:F.ui, fontSize:14, fontWeight:700,
          cursor:"pointer",
          boxShadow:"0 4px 16px rgba(196,89,58,0.35)",
        }}>Salva modifiche ✓</button>
      </div>
    </div>
  );
}
