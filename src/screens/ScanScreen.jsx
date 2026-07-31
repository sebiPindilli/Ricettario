import React, { useState } from "react";
import { F, MACRO_SECTIONS } from "../data/constants.js";
import { ingredientToText } from "../utils/helpers.js";
import BackBtn from "../components/BackBtn.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import EmojiColorPicker from "../components/EmojiColorPicker.jsx";
import TagSection from "../components/TagSection.jsx";
import ScanLabel from "../components/ScanLabel.jsx";
import SectionPicker from "../components/SectionPicker.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: SCAN — with confidence check + GPT confirmation
// ══════════════════════════════════════════════════════════════

// Simulated OCR results: one "good" and one "uncertain" for demo
const OCR_GOOD = {
  confidence: 94,
  title: "Risotto allo Zafferano",
  ingredients: [
    { name:"Riso Carnaroli", qty:320, unit:"g" },
    { name:"Cipolla dorata", qty:1, unit:"" },
    { name:"Brodo di carne", qty:1, unit:"l", note:"caldo" },
    { name:"Zafferano", qty:1, unit:"bustine" },
    { name:"Burro", qty:50, unit:"g" },
    { name:"Parmigiano Reggiano", qty:80, unit:"g" },
    { name:"Vino bianco secco", qty:100, unit:"ml" },
  ],
  steps: ["Soffriggere la cipolla tritata nel burro a fuoco dolce.","Tostare il riso per 2 minuti, sfumare con il vino bianco.","Aggiungere il brodo caldo un mestolo alla volta, mescolando.","A fine cottura sciogliere lo zafferano in poco brodo e unirlo al riso.","Mantecare con burro e parmigiano, coprire e lasciare riposare 2 minuti."],
  note: "Il segreto è la mantecatura finale: burro freddo e movimento deciso.",
  prepTime: 15, cookTime: 20, servings: 4,
};
const OCR_UNCERTAIN = {
  confidence: 48,
  title: "P?lp?tte di Mel??zane",
  ingredients: [
    { name:"Mel??zane", qty:3, unit:"", note:"t?nde" },
    { name:"Pec?r?no", qty:100, unit:"g" },
    { name:"U?va", qty:3, unit:"" },
    { name:"Pan gr?tt?to", qty:8, unit:"c?cchiai", note:"7-8" },
    { name:"M?nta, Bas?l?co, P?pe", qty:null, unit:"" },
    { name:"Ol?o EVO", qty:null, unit:"", note:"da sp?nnellare" },
  ],
  steps: ["T?gl?are a cub?tti le mel?nzane e b?llire 5 m?n.","Sc?lare e l?sciare in sc?lapasta c?n sale.","Un?re agli altri ?ngr?d?enti tranne il pan gr?ttato.","F?rm?re le p?lpette e sp?nnellare c?n ol?o.","Inf?rnare a 185° per 25/30 m?n."],
  note: "",
  prepTime: 30, cookTime: 25, servings: 8,
};

export default function ScanScreen({ onBack, onSave, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping, sectionList=MACRO_SECTIONS, onAddSection, onUpdateSection, onDeleteSection }) {
  const [step, setStep] = useState("viewfinder");
  // "viewfinder" | "processing_vision" | "confidence_good" | "confidence_bad" | "gpt_confirm" | "processing_gpt" | "result"
  const [ocrData, setOcrData] = useState(null);
  const [useUncertain, setUseUncertain] = useState(false); // toggle for demo
  const [selectedTags, setSelectedTags] = useState([]);
  const [recipeName, setRecipeName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("📄");
  const [selectedColor, setSelectedColor] = useState("#6B8C6E");
  const [scanMacro, setScanMacro] = useState("altro"); // default: Altro

  // Elemento (non componente): evita il remount di SectionPicker a ogni render
  const macroPicker = (
    <div>
      <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#7A6E5F", textTransform:"uppercase", marginBottom:6 }}>Sezione del ricettario</div>
      <SectionPicker
        value={scanMacro}
        onChange={setScanMacro}
        sections={sectionList}
        onAddSection={onAddSection}
        onUpdateSection={onUpdateSection}
        onDeleteSection={onDeleteSection}
      />
    </div>
  );

  // Simulated costs
  const GPT_COST_EURO = 0.01;
  const CREDIT_REMAINING = 4.87;

  const toggleTag = (tag) => setSelectedTags(prev =>
    prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag]);

  const handleShoot = () => {
    setStep("processing_vision");
    setTimeout(() => {
      const data = useUncertain ? OCR_UNCERTAIN : OCR_GOOD;
      setOcrData(data);
      setRecipeName(data.title);
      setStep(data.confidence >= 80 ? "confidence_good" : "confidence_bad");
    }, 2200);
  };

  const handleUseGPT = () => setStep("gpt_confirm");

  const handleConfirmGPT = () => {
    setStep("processing_gpt");
    setTimeout(() => {
      // GPT "fixes" the uncertain data
      setOcrData(prev => ({
        ...prev,
        confidence: 97,
        title: "Polpette di Melanzane",
        ingredients: ["Melanzane: 3 tonde di medie dimensioni","Pecorino: 100g grattugiato","Uova: 3","Pan grattato: 7-8 cucchiai","Menta, Basilico, Pepe","Olio EVO da spennellare"],
        steps: ["Tagliare a cubetti le melanzane e bollire 5 min in acqua salata.","Scolare e lasciare in scolapasta con sale per perdere l'acqua.","Unire agli altri ingredienti tranne il pan grattato, aggiungere gradualmente.","Formare le polpette e spennellare con olio extravergine.","Infornare a 185° per 25/30 min."],
      }));
      setRecipeName("Polpette di Melanzane");
      setStep("result");
    }, 2000);
  };

  const bgColor = ["result","confidence_good","confidence_bad","gpt_confirm"].includes(step) ? "#FAF7F0" : "#2C2416";
  const isDark = bgColor === "#2C2416";

  return (
    <div style={{ background:bgColor, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"8px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BackBtn onBack={onBack} label="Annulla" dark={!isDark}/>
        {/* Demo toggle */}
        {step === "viewfinder" && (
          <button onClick={() => setUseUncertain(u=>!u)} style={{
            background:"none", border:`1px solid rgba(255,255,255,0.2)`,
            borderRadius:10, padding:"4px 10px",
            color:"rgba(255,255,255,0.5)", fontFamily:F.ui, fontSize:10,
            cursor:"pointer",
          }}>Demo: {useUncertain ? "grafia difficile 😬" : "testo chiaro ✓"}</button>
        )}
      </div>

      {/* ── VIEWFINDER ── */}
      {step === "viewfinder" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 24px" }}>
          <div style={{ fontFamily:F.display, fontSize:22, color:"#fff", textAlign:"center", marginBottom:4 }}>Scansiona Ricetta</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.5)", textAlign:"center", marginBottom:20 }}>
            Inquadra la pagina — tieni il telefono fermo
          </div>
          <div style={{ width:"100%", aspectRatio:"3/4", borderRadius:20, background:"#111", position:"relative", overflow:"hidden", border:"2px solid rgba(255,255,255,0.12)" }}>
            {[["top:12px","left:12px","borderTop","borderLeft"],["top:12px","right:12px","borderTop","borderRight"],
              ["bottom:12px","left:12px","borderBottom","borderLeft"],["bottom:12px","right:12px","borderBottom","borderRight"]
            ].map(([t,s,b1,b2],i) => (
              <div key={i} style={{
                position:"absolute", width:28, height:28,
                [b1]:`3px solid ${"#C4593A"}`, [b2]:`3px solid ${"#C4593A"}`,
                ...Object.fromEntries([t,s].map(x=>x.split(":"))), borderRadius:4,
              }}/>
            ))}
            <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:56, opacity:0.12 }}>📄</span>
            </div>
          </div>
          <button onClick={handleShoot} style={{
            marginTop:28, width:68, height:68, borderRadius:"50%",
            background:"#fff", border:"5px solid rgba(255,255,255,0.25)",
            cursor:"pointer", fontSize:26,
          }}>📷</button>
          <div style={{ color:"rgba(255,255,255,0.35)", fontFamily:F.ui, fontSize:11, marginTop:10 }}>Premi per fotografare</div>
        </div>
      )}

      {/* ── PROCESSING VISION ── */}
      {step === "processing_vision" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:24 }}>
          <div style={{ fontSize:44 }}>🔍</div>
          <div style={{ fontFamily:F.display, fontSize:20, color:"#fff", textAlign:"center" }}>Lettura testo in corso…</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.45)", textAlign:"center" }}>Apple Vision sta analizzando la pagina</div>
          <ProgressBar color={"#C4593A"} duration={2200}/>
        </div>
      )}

      {/* ── PROCESSING GPT ── */}
      {step === "processing_gpt" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:24 }}>
          <div style={{ fontSize:44 }}>✨</div>
          <div style={{ fontFamily:F.display, fontSize:20, color:"#fff", textAlign:"center" }}>GPT sta correggendo…</div>
          <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.45)", textAlign:"center" }}>Strutturazione intelligente della ricetta</div>
          <ProgressBar color="#7B61FF" duration={2000}/>
        </div>
      )}

      {/* ── CONFIDENCE GOOD ── */}
      {step === "confidence_good" && ocrData && (
        <div style={{ padding:"16px 22px 32px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* Score badge */}
          <div style={{
            background:`${"#6B8C6E"}18`, border:`1.5px solid ${"#6B8C6E"}`,
            borderRadius:14, padding:"14px 16px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{ fontSize:32 }}>✅</div>
            <div>
              <div style={{ fontFamily:F.ui, fontSize:13, fontWeight:700, color:"#6B8C6E" }}>
                Testo riconosciuto con alta confidenza
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:"#7A6E5F", marginTop:2 }}>
                Accuratezza Apple Vision: <strong>{ocrData.confidence}%</strong> — nessun intervento AI necessario
              </div>
            </div>
          </div>

          <ScanPreview ocrData={ocrData} recipeName={recipeName} setRecipeName={setRecipeName}/>

          <EmojiColorPicker emoji={selectedEmoji} color={selectedColor} onEmoji={setSelectedEmoji} onColor={setSelectedColor}/>

          {macroPicker}

          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            <button onClick={() => setStep("viewfinder")} style={{
              flex:1, padding:"13px",
              border:`1.5px solid #EDE6D4`, borderRadius:12,
              background:"transparent", color:"#7A6E5F",
              fontFamily:F.ui, fontSize:13, cursor:"pointer",
            }}>Rifai foto</button>
            <button onClick={() => onSave(recipeName, selectedTags, ocrData, selectedEmoji, selectedColor, scanMacro)} style={{
              flex:2, padding:"13px",
              background:"#6B8C6E", color:"#fff",
              border:"none", borderRadius:12,
              fontFamily:F.ui, fontSize:14, fontWeight:700,
              cursor:"pointer", boxShadow:`0 4px 16px ${"#6B8C6E"}55`,
            }}>Continua →</button>
          </div>

          <TagSection selectedTags={selectedTags} onChange={(tags) => setSelectedTags(tags)}/>
        </div>
      )}

      {/* ── CONFIDENCE BAD ── */}
      {step === "confidence_bad" && ocrData && (
        <div style={{ padding:"16px 22px 32px", display:"flex", flexDirection:"column", gap:14 }}>
          {/* Score badge */}
          <div style={{
            background:`#C4593A18`, border:`1.5px solid ${"#C4593A"}`,
            borderRadius:14, padding:"14px 16px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{ fontSize:32 }}>⚠️</div>
            <div>
              <div style={{ fontFamily:F.ui, fontSize:13, fontWeight:700, color:"#C4593A" }}>
                Testo difficile da leggere
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:"#7A6E5F", marginTop:2 }}>
                Accuratezza Apple Vision: <strong>{ocrData.confidence}%</strong> — alcuni caratteri incerti (evidenziati in rosso)
              </div>
            </div>
          </div>

          <ScanPreviewUncertain ocrData={ocrData} recipeName={recipeName} setRecipeName={setRecipeName}/>

          <EmojiColorPicker emoji={selectedEmoji} color={selectedColor} onEmoji={setSelectedEmoji} onColor={setSelectedColor}/>

          {macroPicker}

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setStep("viewfinder")} style={{
              flex:1, padding:"13px",
              border:`1.5px solid #EDE6D4`, borderRadius:12,
              background:"transparent", color:"#7A6E5F",
              fontFamily:F.ui, fontSize:12, cursor:"pointer",
            }}>Rifai foto</button>
            <button onClick={() => onSave(recipeName, selectedTags, ocrData, selectedEmoji, selectedColor, scanMacro)} style={{
              flex:1, padding:"13px",
              border:`1.5px solid #EDE6D4`, borderRadius:12,
              background:"transparent", color:"#7A6E5F",
              fontFamily:F.ui, fontSize:12, cursor:"pointer",
            }}>Continua →</button>
            <button onClick={handleUseGPT} style={{
              flex:2, padding:"13px",
              background:"#C4593A", color:"#fff",
              border:"none", borderRadius:12,
              fontFamily:F.ui, fontSize:13, fontWeight:700,
              cursor:"pointer", boxShadow:"0 4px 14px rgba(196,89,58,0.4)",
            }}>✨ Migliora con AI</button>
          </div>

          <TagSection selectedTags={selectedTags} onChange={(tags) => setSelectedTags(tags)}/>
        </div>
      )}

      {/* ── GPT CONFIRM ── */}
      {step === "gpt_confirm" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px 22px", gap:16 }}>
          <div style={{ fontFamily:F.display, fontSize:20, color:"#2C2416" }}>Conferma utilizzo AI</div>
          <div style={{ fontFamily:F.ui, fontSize:13, color:"#7A6E5F", lineHeight:1.6 }}>
            GPT-4o analizzerà il testo riconosciuto e correggerà i caratteri incerti, strutturando la ricetta in modo pulito.
          </div>

          {/* Cost card */}
          <div style={{
            background:"#F7F2E8", border:`1px solid #EDE6D4`,
            borderRadius:16, overflow:"hidden",
          }}>
            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${"#EDE6D4"}` }}>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#7A6E5F", textTransform:"uppercase", marginBottom:10 }}>Riepilogo costo</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontFamily:F.ui, fontSize:13, color:"#2C2416" }}>Analisi GPT-4o (1 ricetta)</div>
                <div style={{ fontFamily:F.ui, fontSize:14, fontWeight:700, color:"#2C2416" }}>€ {GPT_COST_EURO.toFixed(2)}</div>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:F.ui, fontSize:13, color:"#7A6E5F" }}>Credito residuo attuale</div>
                <div style={{ fontFamily:F.ui, fontSize:14, fontWeight:700, color:"#6B8C6E" }}>€ {CREDIT_REMAINING.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ padding:"12px 16px", background:`${"#6B8C6E"}10` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:F.ui, fontSize:13, fontWeight:600, color:"#6B8C6E" }}>Credito dopo questa operazione</div>
                <div style={{ fontFamily:F.ui, fontSize:15, fontWeight:700, color:"#6B8C6E" }}>
                  € {(CREDIT_REMAINING - GPT_COST_EURO).toFixed(2)}
                </div>
              </div>
              <div style={{ fontFamily:F.ui, fontSize:10, color:"#7A6E5F", marginTop:4 }}>
                Equivale a circa {Math.floor((CREDIT_REMAINING - GPT_COST_EURO) / GPT_COST_EURO)} ricette rimanenti
              </div>
            </div>
          </div>

          {/* What GPT will do */}
          <div style={{ background:"#F7F2E8", border:`1px solid #EDE6D4`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#7A6E5F", textTransform:"uppercase", marginBottom:10 }}>GPT provvederà a</div>
            {["Correggere i caratteri non riconosciuti","Strutturare titolo, ingredienti e preparazione","Separare le unità di misura dagli ingredienti","Aggiungere punteggiatura e formattazione"].map((item,i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
                <span style={{ color:"#6B8C6E", fontSize:14, marginTop:1 }}>✦</span>
                <span style={{ fontFamily:F.ui, fontSize:13, color:"#2C2416", lineHeight:1.4 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", gap:8, marginTop:"auto" }}>
            <button onClick={() => setStep("confidence_bad")} style={{
              flex:1, padding:"14px",
              border:`1.5px solid #EDE6D4`, borderRadius:12,
              background:"transparent", color:"#7A6E5F",
              fontFamily:F.ui, fontSize:13, cursor:"pointer",
            }}>Annulla</button>
            <button onClick={handleConfirmGPT} style={{
              flex:2, padding:"14px",
              background:"#7B61FF", color:"#fff",
              border:"none", borderRadius:12,
              fontFamily:F.ui, fontSize:14, fontWeight:700,
              cursor:"pointer", boxShadow:"0 4px 16px rgba(123,97,255,0.4)",
            }}>✨ Conferma — usa GPT</button>
          </div>
        </div>
      )}

      {/* ── RESULT (after GPT) ── */}
      {step === "result" && ocrData && (
        <div style={{ padding:"16px 22px 32px", display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{
            background:"#7B61FF18", border:"1.5px solid #7B61FF",
            borderRadius:14, padding:"14px 16px",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{ fontSize:32 }}>✨</div>
            <div>
              <div style={{ fontFamily:F.ui, fontSize:13, fontWeight:700, color:"#7B61FF" }}>
                Ricetta migliorata da GPT-4o
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:"#7A6E5F", marginTop:2 }}>
                Accuratezza finale: <strong>{ocrData.confidence}%</strong> · Costo: <strong>€{GPT_COST_EURO.toFixed(2)}</strong> · Credito rimasto: <strong>€{(CREDIT_REMAINING-GPT_COST_EURO).toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <ScanPreview ocrData={ocrData} recipeName={recipeName} setRecipeName={setRecipeName}/>

          <EmojiColorPicker emoji={selectedEmoji} color={selectedColor} onEmoji={setSelectedEmoji} onColor={setSelectedColor}/>

          {macroPicker}

          <button onClick={() => onSave(recipeName, selectedTags, ocrData, selectedEmoji, selectedColor, scanMacro)} style={{
            width:"100%", padding:"15px",
            background:"#7B61FF", color:"#fff",
            border:"none", borderRadius:12,
            fontFamily:F.ui, fontSize:14, fontWeight:700,
            cursor:"pointer", boxShadow:"0 4px 16px rgba(123,97,255,0.4)",
          }}>Continua →</button>

          <TagSection selectedTags={selectedTags} onChange={(tags) => setSelectedTags(tags)}/>
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components for ScanScreen ──────────────────────

const ScanPreview = ({ ocrData, recipeName, setRecipeName }) => (
  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
    <div>
      <ScanLabel text="Titolo"/>
      <input value={recipeName} onChange={e=>setRecipeName(e.target.value)} style={{
        width:"100%", padding:"10px 14px",
        border:`1.5px solid #EDE6D4`, borderRadius:10,
        background:"#F7F2E8", fontFamily:F.display, fontSize:15, color:"#2C2416",
        outline:"none", boxSizing:"border-box",
      }}/>
    </div>
    <div>
      <ScanLabel text={`Ingredienti (${ocrData.ingredients.length})`}/>
      <div style={{ border:`1.5px solid #EDE6D4`, borderRadius:10, padding:"10px 14px", background:"#F7F2E8" }}>
        {ocrData.ingredients.map((ing,i) => (
          <div key={i} style={{ fontFamily:F.body, fontSize:13, color:"#2C2416", lineHeight:1.8 }}>
            <span style={{ color:"#B8973A", marginRight:6 }}>✦</span>{ingredientToText(ing)}
          </div>
        ))}
      </div>
    </div>
    <div>
      <ScanLabel text={`Preparazione (${ocrData.steps.length} passi)`}/>
      <div style={{ border:`1.5px solid #EDE6D4`, borderRadius:10, padding:"10px 14px", background:"#F7F2E8" }}>
        {ocrData.steps.map((s,i) => (
          <div key={i} style={{ fontFamily:F.body, fontSize:12, color:"#2C2416", lineHeight:1.6, marginBottom:4 }}>
            <span style={{ fontWeight:700, color:"#7A6E5F", marginRight:6 }}>{i+1}.</span>{s}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ScanPreviewUncertain = ({ ocrData, recipeName, setRecipeName }) => {
  // Highlight ? characters in red
  const highlight = (text) => {
    const parts = text.split(/(\?)/);
    return parts.map((p,i) => p === "?" ?
      <span key={i} style={{ color:"#C4593A", fontWeight:700, background:`${"#C4593A"}18`, borderRadius:2, padding:"0 1px" }}>?</span> : p
    );
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div>
        <ScanLabel text="Titolo (verifica i caratteri rossi)"/>
        <input value={recipeName} onChange={e=>setRecipeName(e.target.value)} style={{
          width:"100%", padding:"10px 14px",
          border:`1.5px solid ${"#C4593A"}`, borderRadius:10,
          background:"#fff5f3", fontFamily:F.display, fontSize:15, color:"#2C2416",
          outline:"none", boxSizing:"border-box",
        }}/>
      </div>
      <div>
        <ScanLabel text="Ingredienti — caratteri incerti evidenziati"/>
        <div style={{ border:`1.5px solid ${"#C4593A"}`, borderRadius:10, padding:"10px 14px", background:"#fff5f3" }}>
          {ocrData.ingredients.map((ing,i) => (
            <div key={i} style={{ fontFamily:F.body, fontSize:13, color:"#2C2416", lineHeight:1.8 }}>
              <span style={{ color:"#B8973A", marginRight:6 }}>✦</span>{highlight(ingredientToText(ing))}
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontFamily:F.ui, fontSize:11, color:"#7A6E5F", textAlign:"center" }}>
        Puoi correggere manualmente oppure lasciare che GPT risolva tutto automaticamente
      </div>
    </div>
  );
};
