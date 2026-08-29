import React, { useState } from "react";
import { useTheme, useUiStyle } from "../context.js";
import { F, MACRO_SECTIONS, DEFAULT_UNIT_SUGGESTIONS } from "../data/constants.js";
import { collectAllIngredients, flattenIngredients, flattenSteps, toSectioned, fromSectioned, stripPhotolessStep } from "../utils/helpers.js";
import BackBtn from "../components/BackBtn.jsx";
import EditLabel from "../components/EditLabel.jsx";
import EditField from "../components/EditField.jsx";
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
// SCREEN: NEW RECIPE (manual entry)
// ══════════════════════════════════════════════════════════════
export default function NewRecipeScreen({ onBack, onSave, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping, extraTagGroups=[], onAddGroup, onAddTagToGroup, sectionList=MACRO_SECTIONS, onAddSection, onUpdateSection, onDeleteSection, allRecipes=[], initialDraft=null }) {
  const th = useTheme();
  const ui = useUiStyle();
  const [draft, setDraft] = useState(initialDraft || {
    title:"", source:"", prepTime:"", cookTime:"", servings:4,
    note:"", ingredients:[{ name:"", qty:"", unit:"" }], steps:[""],
    tags:[], color:"#C4593A", emoji:"🍝",
    dishPhoto:null, macroSection:"altro",
  });
  const [activeSection, setActiveSection] = useState("info");
  // Negli stili nuovi: quattro sezioni richiudibili sulla stessa pagina
  // invece di schede (DECISIONI.md §Nuova ricetta) — la prima aperta.
  const [openSections, setOpenSections] = useState({ info:true, ingredienti:false, preparazione:false, note:false });
  const toggleSection = (s) => setOpenSections(o => ({ ...o, [s]: !o[s] }));

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));
  // Rimuove del tutto la chiave invece di scriverci undefined: Firestore
  // rifiuta i campi undefined nei documenti (vedi onIcon in EmojiColorPicker).
  const setIcon = (i) => setDraft(d => i === undefined
    ? Object.fromEntries(Object.entries(d).filter(([k]) => k !== "icon"))
    : { ...d, icon: i });

  const updateIngredient = (i, val) => {
    const arr = [...draft.ingredients]; arr[i] = val; set("ingredients", arr);
  };
  const addIngredient = () => set("ingredients", [...draft.ingredients, ""]);
  const removeIngredient = (i) => set("ingredients", draft.ingredients.filter((_,idx)=>idx!==i));

  const updateStep = (i, val) => {
    const arr = [...draft.steps]; arr[i] = val; set("steps", arr);
  };
  const addStep = () => set("steps", [...draft.steps, ""]);
  const removeStep = (i) => set("steps", draft.steps.filter((_,idx)=>idx!==i));

  const toggleTag = (tag) => {
    set("tags", draft.tags.includes(tag) ? draft.tags.filter(t=>t!==tag) : [...draft.tags, tag]);
  };

  const canSave = draft.title.trim().length > 0;
  const sections = ["info","ingredienti","preparazione","note"];

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


  return (
    <div style={{ background:"#FAF7F0", minHeight:"100%", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BackBtn onBack={onBack} label="Annulla"/>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <InfoButton>{guideNuovaModificaRicetta}</InfoButton>
          <button onClick={() => canSave && onSave(draft)} style={{
            background: canSave ? "#C4593A" : "#EDE6D4",
            color: canSave ? "#fff" : "#7A6E5F",
            border:"none", borderRadius:10,
            padding:"8px 18px",
            fontFamily:F.ui, fontSize:13, fontWeight:700,
            cursor: canSave ? "pointer" : "default",
            transition:"all 0.2s",
          }}>Salva ✓</button>
        </div>
      </div>

      {/* Preview hero — updates live */}
      <div style={{
        margin:"12px 20px 0",
        background: draft.color,
        borderRadius:16,
        padding:"18px 20px",
        display:"flex", alignItems:"center", gap:14,
      }}>
        {/* Emoji picker */}
        <div style={{ position:"relative" }}>
          <div style={{
            width:52, height:52, borderRadius:12,
            background:"rgba(255,255,255,0.2)", color:"#fff",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer",
          }}><ChosenIcon emoji={draft.emoji} icon={draft.icon} size={26} /></div>
        </div>
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

      {/* Categorized emoji + color picker */}
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

      {(() => {
        const infoSection = (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <EditLabel text="Titolo ricetta *"/>
              <input
                value={draft.title}
                onChange={e => set("title", e.target.value)}
                placeholder="es. Risotto allo Zafferano"
                autoFocus={ui.id==="classico"}
                style={{
                  width:"100%", padding:"12px 14px",
                  border:`1.5px solid ${draft.title ? "#C4593A" : "#EDE6D4"}`,
                  borderRadius:10, background:"#F7F2E8",
                  fontFamily:F.display, fontSize:16, color:"#2C2416",
                  outline:"none", boxSizing:"border-box",
                  transition:"border-color 0.2s",
                }}
              />
            </div>
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
              />
            </div>
            <EditField label="Fonte / Autore" value={draft.source} onChange={v=>set("source",v)} placeholder="es. Nonna Maria"/>
            <EditField label="Link fonte (URL)" value={draft.sourceUrl||""} onChange={v=>set("sourceUrl",v)} placeholder="es. https://www.sito.it/ricetta"/>
            <div style={{ display:"flex", gap:10 }}>
              <div style={{ flex:1 }}><EditLabel text="Prep (min)"/><EditNumberInput value={draft.prepTime} onChange={v=>set("prepTime", v===""?"":Number(v))}/></div>
              <div style={{ flex:1 }}><EditLabel text="Cottura (min)"/><EditNumberInput value={draft.cookTime} onChange={v=>set("cookTime", v===""?"":Number(v))}/></div>
              <div style={{ flex:1 }}><EditLabel text="Porzioni"/><EditNumberInput value={draft.servings} onChange={v=>set("servings",Number(v))}/></div>
            </div>
            {/* Tags */}
            <div>
              <EditLabel text="Tag"/>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:10 }}>
                Seleziona i tag o aggiungine di personalizzati in ogni categoria
              </div>
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
        );

        const preparazioneSection = (
          <EditSectionedSteps
            data={toSectioned(draft.steps || [])}
            color={draft.color}
            onUpdate={(sections) => {
              const flat = fromSectioned(sections);
              if (Array.isArray(flat) && flat.length > 0 && !("section" in flat[0])) {
                set("steps", flat.map(stripPhotolessStep));
              } else {
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
            <textarea value={draft.note} onChange={e=>set("note",e.target.value)}
              rows={5} placeholder="Aggiungi note, varianti, consigli…"
              style={{ width:"100%", padding:"12px 14px", border:`1.5px solid #EDE6D4`, borderRadius:12, background:"#F7F2E8", fontFamily:F.body, fontStyle:"italic", fontSize:14, color:"#2C2416", outline:"none", resize:"none", lineHeight:1.6, boxSizing:"border-box" }}/>
          </div>
        );

        if (ui.formSections !== "accordion") {
          return (
            <>
              {/* Section tabs */}
              <div style={{ display:"flex", overflowX:"auto", gap:6, padding:"4px 20px 10px", scrollbarWidth:"none" }}>
                {sections.map(s => (
                  <button key={s} onClick={() => setActiveSection(s)} style={{
                    flexShrink:0, padding:"6px 14px", borderRadius:20, border:"none",
                    background: activeSection===s ? "#2C2416" : "#EDE6D4",
                    color: activeSection===s ? "#fff" : "#7A6E5F",
                    fontFamily:F.ui, fontSize:12, fontWeight:600,
                    cursor:"pointer", textTransform:"capitalize",
                  }}>{s}</button>
                ))}
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"0 20px 80px" }}>
                {activeSection==="info" && infoSection}
                {activeSection==="ingredienti" && ingredientiSection}
                {activeSection==="preparazione" && preparazioneSection}
                {activeSection==="note" && noteSection}
              </div>
            </>
          );
        }

        // quaderno/schedario: quattro sezioni richiudibili sulla stessa
        // pagina, la prima aperta (DECISIONI.md §Nuova ricetta).
        const items = [
          ["info", "Info", infoSection, null],
          ["ingredienti", "Ingredienti", ingredientiSection, flattenIngredients(draft.ingredients).length],
          ["preparazione", "Preparazione", preparazioneSection, flattenSteps(draft.steps || []).length],
          ["note", "Note", noteSection, null],
        ];
        return (
          <div style={{ flex:1, overflowY:"auto", padding:`4px ${ui.padX}px 80px` }}>
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
        background:"#FAF7F0", borderTop:`1px solid ${"#EDE6D4"}`,
        padding:"12px 20px", display:"flex", gap:10,
      }}>
        <button onClick={onBack} style={{
          flex:1, padding:"12px",
          border:`1.5px solid #EDE6D4`, borderRadius:12,
          background:"transparent", color:"#7A6E5F",
          fontFamily:F.ui, fontSize:14, cursor:"pointer",
        }}>Annulla</button>
        <button onClick={() => canSave && onSave(draft)} style={{
          flex:2, padding:"12px",
          background: canSave ? "#C4593A" : "#EDE6D4",
          color: canSave ? "#fff" : "#7A6E5F",
          border:"none", borderRadius:12,
          fontFamily:F.ui, fontSize:14, fontWeight:700,
          cursor: canSave ? "pointer" : "default",
          boxShadow: canSave ? "0 4px 16px rgba(196,89,58,0.35)" : "none",
          transition:"all 0.2s",
        }}>
          {canSave ? "Salva ricetta ✓" : "Inserisci un titolo"}
        </button>
      </div>
    </div>
  );
}
