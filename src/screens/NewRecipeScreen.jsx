import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F, MACRO_SECTIONS, DEFAULT_UNIT_SUGGESTIONS } from "../data/constants.js";
import { collectAllIngredients, flattenIngredients, toSectioned, fromSectioned, stripPhotolessStep } from "../utils/helpers.js";
import BackBtn from "../components/BackBtn.jsx";
import EditLabel from "../components/EditLabel.jsx";
import EditField from "../components/EditField.jsx";
import EditNumberInput from "../components/EditNumberInput.jsx";
import TagPicker from "../components/TagPicker.jsx";
import EmojiColorPicker from "../components/EmojiColorPicker.jsx";
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
  const [draft, setDraft] = useState(initialDraft || {
    title:"", source:"", prepTime:"", cookTime:"", servings:4,
    note:"", ingredients:[{ name:"", qty:"", unit:"" }], steps:[""],
    tags:[], color:"#C4593A", emoji:"🍝",
    dishPhoto:null, macroSection:"altro",
  });
  const [activeSection, setActiveSection] = useState("info");

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));

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
            background:"rgba(255,255,255,0.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, cursor:"pointer",
          }}>{draft.emoji}</div>
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
          onEmoji={e => set("emoji", e)}
          onColor={c => set("color", c)}
        />
      </div>

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

      {/* Section content */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 20px 80px" }}>

        {/* INFO */}
        {activeSection==="info" && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <EditLabel text="Titolo ricetta *"/>
              <input
                value={draft.title}
                onChange={e => set("title", e.target.value)}
                placeholder="es. Risotto allo Zafferano"
                autoFocus
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
        )}

        {/* INGREDIENTI */}
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

        {/* PREPARAZIONE */}
        {activeSection==="preparazione" && (
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
        )}

        {/* NOTE */}
        {activeSection==="note" && (
          <div>
            <EditLabel text="Note e consigli"/>
            <textarea value={draft.note} onChange={e=>set("note",e.target.value)}
              rows={5} placeholder="Aggiungi note, varianti, consigli…"
              style={{ width:"100%", padding:"12px 14px", border:`1.5px solid #EDE6D4`, borderRadius:12, background:"#F7F2E8", fontFamily:F.body, fontStyle:"italic", fontSize:14, color:"#2C2416", outline:"none", resize:"none", lineHeight:1.6, boxSizing:"border-box" }}/>
          </div>
        )}
      </div>

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
