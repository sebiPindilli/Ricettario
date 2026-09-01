import React, { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F, MACRO_SECTIONS, DEFAULT_UNIT_SUGGESTIONS } from "../data/constants.js";
import { isSectioned, toSectioned, fromSectioned, stripPhotolessStep, stepPhotosOf, durationOf, collectAllIngredients, flattenIngredients, flattenSteps, normalizeSteps } from "../utils/helpers.js";
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
import AppIcon from "../components/AppIcon.jsx";
import { guideNuovaModificaRicetta } from "../data/guideContent.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: EDIT RECIPE
// ══════════════════════════════════════════════════════════════
export default function EditScreen({ recipe, onBack, onSave, extraTagGroups=[], onAddGroup, onAddTagToGroup, sectionList=MACRO_SECTIONS, onAddSection, onUpdateSection, onDeleteSection, allRecipes=[] }) {
  const th = useTheme();
  const ui = useUiStyle();
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
  const [openSections, setOpenSections] = useState({ info:true, ingredienti:false, preparazione:false, note:false });
  const toggleSection = (s) => setOpenSections(o => ({ ...o, [s]: !o[s] }));

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

  // Colore per ricetta (classico) → colore di sezione (quaderno/schedario),
  // stesso punto di derivazione di RecipeScreen.jsx: sectionColorFull
  // (sezioniPiene) perché qui è un riempimento pieno con icona/testo bianco.
  const heroColor = ui.sectionColorFull(draft.macroSection) ?? draft.color;

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BackBtn onBack={onBack} label="Annulla"/>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <InfoButton>{guideNuovaModificaRicetta}</InfoButton>
          <button onClick={handleSave} style={{
            background:th.appAccent, color:th.appOnAccent,
            border:"none", borderRadius:ui.radius.control,
            padding:"8px 18px",
            fontFamily:F.ui, fontSize:13, fontWeight:700,
            textTransform: ui.uppercaseButtons ? "uppercase" : "none",
            cursor:"pointer",
            display:"flex", alignItems:"center", gap:5,
          }}>Salva <AppIcon emoji="✓" icon="fatto" size={12} /></button>
        </div>
      </div>

      <div style={{ padding:"12px 20px 4px" }}>
        <div style={{ fontFamily:F.display, fontSize:20, color:th.appInk }}>Modifica Ricetta</div>
      </div>

      {/* Preview hero — updates live */}
      <div style={{
        margin:"12px 20px 0",
        background: heroColor,
        borderRadius:ui.radius.card,
        padding:"18px 20px",
        display:"flex", alignItems:"center", gap:14,
      }}>
        <div style={{
          width:52, height:52, borderRadius:ui.radius.tile,
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
          color={heroColor}
          icon={draft.icon}
          onEmoji={e => set("emoji", e)}
          onColor={c => set("color", c)}
          onIcon={setIcon}
          title={draft.title}
        />
      </div>

      {(() => {
        const infoSection = (
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
        );

        const ingredientiSection = (
          <div>
            <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:10, lineHeight:1.4, background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"9px 12px", display:"flex", gap:6 }}>
              <span style={{ flexShrink:0 }}><AppIcon emoji="💡" icon="suggerimento" size={12} /></span>
              <span>Inserisci ingrediente e quantità. Le <b>categorie</b> e gli <b>aggregati</b> (usati in Svuota Frigo) si gestiscono nella sezione <b>🍎⚙️ Organizza</b> del banner, così valgono per tutte le ricette.</span>
            </div>
            <EditSectionedList
              data={toSectioned(draft.ingredients)}
              color={heroColor}
              itemType="ingredient"
              onUpdate={(sections) => set("ingredients", fromSectioned(sections))}
              nameSuggestions={nameSuggestions}
              unitSuggestions={unitSuggestions}
            />
          </div>
        );

        const preparazioneSection = (
          <EditSectionedSteps
            data={toSectioned(draft.steps)}
            color={heroColor}
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
        );

        const noteSection = (
          <div>
            <EditLabel text="Note e consigli"/>
            <textarea
              value={draft.note}
              onChange={e => set("note", e.target.value)}
              rows={5}
              placeholder="Aggiungi note, varianti, consigli…"
              style={{
                width:"100%", padding:"12px 14px",
                border:`1.5px solid ${ui.border}`,
                borderRadius:ui.radius.control, background:ui.card,
                fontFamily:F.body, fontStyle:"italic",
                fontSize:14, color:th.appInk,
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
                border:`1.5px solid ${ui.border}`,
                borderRadius:ui.radius.control, background:ui.card,
                fontFamily:F.ui, fontSize:13, color:th.appInk,
                outline:"none", boxSizing:"border-box",
              }}
            />
          </div>
        );

        if (ui.formSections !== "accordion") {
          return (
            <>
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
                {activeSection==="info" && infoSection}
                {activeSection==="ingredienti" && ingredientiSection}
                {activeSection==="preparazione" && preparazioneSection}
                {activeSection==="note" && noteSection}
              </div>
            </>
          );
        }

        const items = [
          ["info", "Info", infoSection, null],
          ["ingredienti", "Ingredienti", ingredientiSection, flattenIngredients(draft.ingredients).length],
          ["preparazione", "Preparazione", preparazioneSection, flattenSteps(draft.steps || []).length],
          ["note", "Note", noteSection, null],
        ];
        return (
          <div style={{ flex:1, overflowY:"auto", padding:`4px ${ui.padX}px 60px` }}>
            {items.map(([key, label, content, count]) => (
              <div key={key} style={{ marginBottom:8 }}>
                <button onClick={() => toggleSection(key)} style={{
                  width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"12px 2px", background:"none", border:"none", cursor:"pointer",
                  borderBottom:`1px solid ${ui.hairlineStrong}`,
                }}>
                  <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontFamily:F.display, fontSize:16, color:ui.ink }}>{label}</span>
                    {count != null && (
                      <span style={{
                        minWidth:18, height:18, padding:"0 5px", borderRadius:9,
                        background:ui.hairlineStrong, color:ui.faded,
                        fontFamily:F.ui, fontSize:10.5, fontWeight:700,
                        display:"flex", alignItems:"center", justifyContent:"center",
                      }}>{count}</span>
                    )}
                  </span>
                  <span style={{ color:ui.faded, fontSize:13 }}>{openSections[key] ? "▾" : "▸"}</span>
                </button>
                {openSections[key] && <div style={{ padding:"14px 0 4px" }}>{content}</div>}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Floating save bar */}
      <div style={{
        position:"sticky", bottom:0,
        background:th.appBg,
        borderTop:`1px solid ${ui.hairlineStrong}`,
        padding:"12px 20px",
        display:"flex", gap:10,
      }}>
        <button onClick={onBack} style={{
          flex:1, padding:"12px",
          border:`1.5px solid ${ui.border}`,
          borderRadius:ui.radius.control, background:"transparent",
          color:th.appFaded, fontFamily:F.ui, fontSize:14,
          textTransform: ui.uppercaseButtons ? "uppercase" : "none",
          cursor:"pointer",
        }}>Annulla</button>
        <button onClick={handleSave} style={{
          flex:2, padding:"12px",
          background:th.appPrimaryBg, color:th.appPrimaryText,
          border:"none", borderRadius:ui.radius.control,
          fontFamily:F.ui, fontSize:14, fontWeight:700,
          textTransform: ui.uppercaseButtons ? "uppercase" : "none",
          cursor:"pointer",
          boxShadow:`0 4px 16px ${th.appPrimaryBg}55`,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}>Salva modifiche <AppIcon emoji="✓" icon="fatto" size={13} /></button>
      </div>
    </div>
  );
}
