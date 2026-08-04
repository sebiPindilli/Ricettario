import React, { useState, useRef } from "react";
import { useTheme } from "../context.js";
import { F, MACRO_SECTIONS } from "../data/constants.js";
import { NUTRITION_DB } from "../data/nutrition.js";
import { uid, dishPhotoOf, readImageFile, normName, ingDictIndex, resolveIngId, flattenIngredients } from "../utils/helpers.js";
import { effectiveNutritionKey } from "../utils/aggregates.js";
import BackBtn from "../components/BackBtn.jsx";
import Toast from "../components/Toast.jsx";
import PhotoLightbox from "../components/PhotoLightbox.jsx";
import Pill from "../components/Pill.jsx";
import Divider from "../components/Divider.jsx";
import ExportFlow from "../components/ExportFlow.jsx";
import NutritionCard from "../components/NutritionCard.jsx";
import MemoriesSection from "../components/MemoriesSection.jsx";
import BookPageView from "../components/BookPageView.jsx";
import IngredientsView from "../components/IngredientsView.jsx";
import StepsView from "../components/StepsView.jsx";
import ServingsDialog from "../components/ServingsDialog.jsx";
import ShoppingMode from "../components/ShoppingMode.jsx";
import CookingMode from "./CookingMode.jsx";

export default function RecipeScreen({ recipe, onBack, onUpdate, onEdit, onDelete, onDeleteMemory, onAddMemory, onManageIngredients, onManageEquivalences, onAddToShoppingList, nutritionMap = {}, equivalences = {}, customUnits = {}, customFoods = [], ingredientDict = null, aggregates = [], sourceByIngredient = {}, allRecipes = [], sectionList = MACRO_SECTIONS, onExportPDF, onExportCode }) {
  const th = useTheme();
  const [tab, setTab] = useState("ingredienti");
  const [toast, setToast] = useState({ msg:"", visible:false });
  const [viewMode, setViewMode] = useState("app");
  const [exportOpen, setExportOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemovePhotoConfirm, setShowRemovePhotoConfirm] = useState(false);
  // showAddMemory removed — use home screen
  const [lightbox, setLightbox] = useState(null);
  const [servingsDialog, setServingsDialog] = useState(null); // null | "shopping" | "cooking" | "dose"
  // Calcolo dosi persistente per questa ricetta: default = dosi standard.
  const [doseScale, setDoseScale] = useState({ factor: 1, people: recipe.servings || null, label: `dosi standard (${recipe.servings || "?"} porzioni)` });
  const [activeMode, setActiveMode] = useState(null); // null | {mode, people}
  const [commentInput, setCommentInput] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const dishPhotoInputRef = useRef(null);

  // Copertura valori nutrizionali degli ingredienti (per scegliere se mostrare la tabella o il placeholder)
  const nutritionStatus = React.useMemo(() => {
    const dbByName = new Map([...NUTRITION_DB, ...customFoods].map(f => [normName(f.name), f]));
    const idx = ingredientDict ? ingDictIndex(ingredientDict) : null;
    const anyMapped = flattenIngredients(recipe.ingredients).some(ing => {
      const key = effectiveNutritionKey(resolveIngId(idx, ing.name), aggregates, nutritionMap, sourceByIngredient);
      return nutritionMap[key] || dbByName.has(normName(ing.name));
    });
    return { anyMapped };
  }, [recipe.ingredients, nutritionMap, customFoods, ingredientDict, aggregates, sourceByIngredient]);

  const addComment = () => {
    const text = commentInput.trim();
    if (!text) return;
    const newComment = {
      id: uid("r"),
      text,
      date: new Date().toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }),
    };
    onUpdate({ ...recipe, comments: [...(recipe.comments || []), newComment] });
    setCommentInput("");
    showToast("💬 Commento aggiunto!");
  };

  const deleteComment = (id) => {
    onUpdate({ ...recipe, comments: (recipe.comments || []).filter(c => c.id !== id) });
    if (editingCommentId === id) { setEditingCommentId(null); setEditingText(""); }
  };

  const startEditComment = (c) => {
    setEditingCommentId(c.id);
    setEditingText(c.text);
  };

  const saveEditedComment = () => {
    const text = editingText.trim();
    if (!text) return;
    onUpdate({
      ...recipe,
      comments: (recipe.comments || []).map(c =>
        c.id === editingCommentId
          ? { ...c, text, edited: new Date().toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }) }
          : c
      ),
    });
    setEditingCommentId(null);
    setEditingText("");
    showToast("✏️ Commento modificato!");
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingText("");
  };

  const showToast = (msg) => {
    setToast({ msg, visible:true });
    setTimeout(() => setToast({ msg:"", visible:false }), 2000);
  };

  // Caricamento foto reale — stesso meccanismo dei Ricordi (input file
  // nascosto + FileReader → dataURL).
  const openDishPhotoPicker = () => {
    dishPhotoInputRef.current && dishPhotoInputRef.current.click();
  };
  const handleDishPhotoFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const wasPresent = !!dishPhotoOf(recipe);
    readImageFile(file, (dataUrl) => {
      onUpdate({ ...recipe, dishPhoto: dataUrl });
      showToast(wasPresent ? "📸 Foto piatto aggiornata!" : "📸 Foto piatto aggiunta!");
    });
  };

  return (
    <div style={{ background: viewMode==="book" ? th.bookBg : th.appBg, minHeight:"100%", position:"relative" }}>
      {exportOpen && (
        <ExportFlow
          current={recipe}
          allRecipes={allRecipes}
          sectionList={sectionList}
          onExportPDF={(ids) => onExportPDF && onExportPDF(ids)}
          onExportCode={(ids) => onExportCode && onExportCode(ids)}
          onClose={() => setExportOpen(false)}
        />
      )}
      <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
        <BackBtn onBack={onBack} dark={viewMode==="book"}/>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {/* View toggle */}
          <div style={{ display:"flex", gap:0 }}>
            {[["app","App"],["book","📖"]].map(([mode,label]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                height:38, padding:"0 12px", border:"none",
                background: viewMode===mode ? (mode==="book" ? "#333" : "#2C2416") : "#EDE6D4",
                color: viewMode===mode ? "#fff" : "#7A6E5F",
                fontFamily:F.ui, fontSize: mode==="book" ? 17 : 11, fontWeight:600,
                cursor:"pointer", display:"flex", alignItems:"center",
                borderRadius: mode==="app" ? "8px 0 0 8px" : "0 8px 8px 0",
              }}>{label}</button>
            ))}
          </div>
          {/* Export button */}
          <button onClick={() => setExportOpen(true)} style={{
            width:38, height:38, padding:0,
            border:"1.5px solid #3B6FD855",
            borderRadius:10, background:"#3B6FD81C",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:17, cursor:"pointer", lineHeight:1,
          }} title="Esporta / condividi">📤</button>
          {/* Favorite button */}
          <button onClick={() => onUpdate({ ...recipe, favorite: !recipe.favorite })} style={{
            width:38, height:38, padding:0,
            border: "1.5px solid #D8A02655",
            borderRadius:10, background:"#D8A0261C",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", lineHeight:1,
          }} title={recipe.favorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill={recipe.favorite ? "#D8A026" : "none"} stroke="#D8A026" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          {/* Edit button */}
          <button onClick={onEdit} style={{
            width:38, height:38, padding:0,
            border:"1.5px solid #2D8C6B55",
            borderRadius:10, background:"#2D8C6B1C",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:17, cursor:"pointer", lineHeight:1,
          }} title="Modifica ricetta">✏️</button>
          {/* Delete button */}
          <button onClick={() => setShowDeleteConfirm(true)} style={{
            width:38, height:38, padding:0,
            border:"1.5px solid #D9302555",
            borderRadius:10, background:"#D930251C",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:17, cursor:"pointer", lineHeight:1,
          }} title="Elimina ricetta">🗑️</button>
        </div>
      </div>

      <Toast msg={toast.msg} visible={toast.visible}/>

      {/* ── Delete confirmation modal ── */}
      {showDeleteConfirm && (
        <div style={{
          position:"absolute", inset:0, zIndex:200,
          background:"rgba(0,0,0,0.5)",
          display:"flex", alignItems:"flex-end",
          backdropFilter:"blur(4px)",
        }}>
          <div style={{
            width:"100%",
            background:"#FAF7F0",
            borderRadius:"24px 24px 0 0",
            padding:"28px 24px 40px",
          }}>
            <div style={{ textAlign:"center", marginBottom:6 }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🗑️</div>
              <div style={{ fontFamily:F.display, fontSize:20, color:"#2C2416", marginBottom:8 }}>
                Elimina ricetta?
              </div>
              <div style={{ fontFamily:F.ui, fontSize:13, color:"#7A6E5F", lineHeight:1.5 }}>
                Stai per eliminare <strong>"{recipe.title}"</strong> dal ricettario.
                <br/>Questa azione non può essere annullata.
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:24 }}>
              <button onClick={() => { onDelete(recipe.id); }} style={{
                width:"100%", padding:"15px",
                background:"#D93025", color:"#fff",
                border:"none", borderRadius:14,
                fontFamily:F.ui, fontSize:15, fontWeight:700,
                cursor:"pointer",
                boxShadow:"0 4px 16px rgba(217,48,37,0.35)",
              }}>Sì, elimina definitivamente</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                width:"100%", padding:"15px",
                background:"#EDE6D4", color:"#2C2416",
                border:"none", borderRadius:14,
                fontFamily:F.ui, fontSize:15, fontWeight:600,
                cursor:"pointer",
              }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove dish photo confirmation modal ── */}
      {showRemovePhotoConfirm && (
        <div style={{
          position:"absolute", inset:0, zIndex:200,
          background:"rgba(0,0,0,0.5)",
          display:"flex", alignItems:"flex-end",
          backdropFilter:"blur(4px)",
        }}>
          <div style={{
            width:"100%",
            background:"#FAF7F0",
            borderRadius:"24px 24px 0 0",
            padding:"28px 24px 40px",
          }}>
            <div style={{ textAlign:"center", marginBottom:6 }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🗑️</div>
              <div style={{ fontFamily:F.display, fontSize:20, color:"#2C2416", marginBottom:8 }}>
                Rimuovere la foto del piatto?
              </div>
              <div style={{ fontFamily:F.ui, fontSize:13, color:"#7A6E5F", lineHeight:1.5 }}>
                Questa azione non può essere annullata.
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:24 }}>
              <button onClick={() => { onUpdate({ ...recipe, dishPhoto: null }); setShowRemovePhotoConfirm(false); showToast("🗑️ Foto rimossa"); }} style={{
                width:"100%", padding:"15px",
                background:"#D93025", color:"#fff",
                border:"none", borderRadius:14,
                fontFamily:F.ui, fontSize:15, fontWeight:700,
                cursor:"pointer",
                boxShadow:"0 4px 16px rgba(217,48,37,0.35)",
              }}>Sì, rimuovi foto</button>
              <button onClick={() => setShowRemovePhotoConfirm(false)} style={{
                width:"100%", padding:"15px",
                background:"#EDE6D4", color:"#2C2416",
                border:"none", borderRadius:14,
                fontFamily:F.ui, fontSize:15, fontWeight:600,
                cursor:"pointer",
              }}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* Photo lightbox */}
      {lightbox && (
        <PhotoLightbox
          photo={lightbox.photo}
          caption={lightbox.caption}
          date={lightbox.date}
          isImage={lightbox.isImage}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Input file nascosto per la foto principale — stesso meccanismo dei Ricordi */}
      <input ref={dishPhotoInputRef} type="file" accept="image/*" onChange={handleDishPhotoFile} style={{ display:"none" }}/>

      {viewMode === "app" ? (
        // ── App view ────────────────────────────────────────────
        <div>
          {/* Hero */}
          <div style={{
            margin:"12px 20px",
            background: dishPhotoOf(recipe) ? `linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.35)), url(${dishPhotoOf(recipe)})` : recipe.color,
            backgroundSize:"cover", backgroundPosition:"center",
            borderRadius:20,
            padding:"28px 24px",
            position:"relative", overflow:"hidden",
          }}>
            {dishPhotoOf(recipe) && (
              <div
                onClick={() => setLightbox({ photo:dishPhotoOf(recipe), caption:recipe.title, date:"", isImage:true })}
                style={{ position:"absolute", inset:0, cursor:"pointer" }}
              >
                <div style={{ position:"absolute", bottom:10, right:14, fontSize:18, opacity:0.7, color:"#fff" }}>⤢</div>
              </div>
            )}
            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ fontFamily:F.ui, fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.7)", textTransform:"uppercase" }}>{recipe.category}</div>
              <div style={{ fontFamily:F.display, fontSize:24, color:"#fff", lineHeight:1.2, marginTop:4, textAlign:"center" }}>{recipe.title}</div>
              {recipe.source && (
                <div style={{ fontFamily:F.ui, fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:4 }}>
                  {recipe.sourceUrl
                    ? <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color:"rgba(255,255,255,0.8)", textDecoration:"underline", cursor:"pointer" }}>🔗 Ricetta di {recipe.source}</a>
                    : <>Ricetta di {recipe.source}</>
                  }
                </div>
              )}
              <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
                <Pill icon="🔪" label={`Prep: ${recipe.prepTime} min`}/>
                <Pill icon="🔥" label={`Cottura: ${recipe.cookTime} min`}/>
                <Pill icon="👤" label={`${recipe.servings} porzioni`}/>
              </div>
            </div>

            {/* Camera icon — add/modify dish photo */}
            <button
              onClick={(e) => { e.stopPropagation(); openDishPhotoPicker(); }}
              style={{
                position:"absolute", top:12, right:12, zIndex:3,
                width:36, height:36, borderRadius:"50%",
                background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)",
                border:"1px solid rgba(255,255,255,0.25)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:17, cursor:"pointer",
              }}
              title={dishPhotoOf(recipe) ? "Modifica foto piatto" : "Aggiungi foto piatto"}
            >📷</button>
            {/* Remove dish photo */}
            {dishPhotoOf(recipe) && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowRemovePhotoConfirm(true); }}
                style={{
                  position:"absolute", top:12, right:54, zIndex:3,
                  width:36, height:36, borderRadius:"50%",
                  background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)",
                  border:"1px solid rgba(255,255,255,0.25)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:15, cursor:"pointer", color:"#fff",
                }}
                title="Rimuovi foto piatto"
              >✕</button>
            )}
          </div>

          {/* Tags */}
          <div style={{ display:"flex", gap:6, padding:"0 20px 8px", flexWrap:"wrap" }}>
            {recipe.tags.map(t => (
              <span key={t} style={{
                padding:"4px 12px", borderRadius:20,
                background:"#EDE6D4", color:"#7A6E5F",
                fontFamily:F.ui, fontSize:11,
              }}>{t}</span>
            ))}
          </div>

          {/* Calcolo dosi (persistente per la ricetta) */}
          <div style={{ padding:"0 20px 8px" }}>
            <button onClick={() => setServingsDialog("dose")} style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${doseScale.factor !== 1 ? th.appAccent : th.appBorder}`,
              borderRadius:12, background: doseScale.factor !== 1 ? `${th.appAccent}10` : th.appCard,
              cursor:"pointer", display:"flex", alignItems:"center", gap:10, textAlign:"left",
            }}>
              <span style={{ fontSize:20 }}>⚖️</span>
              <span style={{ flex:1 }}>
                <span style={{ display:"block", fontFamily:F.ui, fontSize:12, fontWeight:700, color:th.appInk }}>Calcolo dosi</span>
                <span style={{ display:"block", fontFamily:F.ui, fontSize:10.5, color: doseScale.factor !== 1 ? th.appAccent : th.appFaded, marginTop:1 }}>{doseScale.label}</span>
              </span>
              <span style={{ fontFamily:F.ui, fontSize:16, color:th.appFaded }}>›</span>
            </button>
          </div>

          {/* Mode buttons: Spesa + Cucina — usano il calcolo dosi impostato sopra */}
          <div style={{ display:"flex", gap:8, padding:"0 20px 12px" }}>
            <button onClick={() => setActiveMode({ mode:"shopping", scale: doseScale })} style={{
              flex:1, padding:"12px 8px",
              border:"none", borderRadius:12,
              background:th.appAccent, color:"#fff",
              fontFamily:F.ui, fontSize:13, fontWeight:700,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>🛒 Spesa</button>
            <button onClick={() => setActiveMode({ mode:"cooking", scale: doseScale })} style={{
              flex:1, padding:"12px 8px",
              border:"none", borderRadius:12,
              background:th.appInk, color:"#fff",
              fontFamily:F.ui, fontSize:13, fontWeight:700,
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}>👨‍🍳 Cucina</button>
          </div>

          <Divider/>

          {/* Tabs */}
          <div style={{ display:"flex", padding:"8px 20px", gap:8 }}>
            {[["ingredienti","Ingredienti"],["preparazione","Preparazione"],["nutrizione","Nutrizione"]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex:1, padding:"10px 6px",
                borderRadius:12, border:"none",
                background: tab===t ? th.appInk : th.appBorder,
                color: tab===t ? "#fff" : th.appFaded,
                fontFamily:F.ui, fontSize:12, fontWeight:600,
                cursor:"pointer",
              }}>{label}</button>
            ))}
          </div>

          <div style={{ padding:"8px 24px 40px" }}>
            {doseScale.factor !== 1 && tab !== "nutrizione" && (
              <div style={{ margin:"0 20px 10px", padding:"8px 12px", borderRadius:10, background:`${th.appAccent}12`, border:`1px solid ${th.appAccent}55`, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:15 }}>⚖️</span>
                <span style={{ fontFamily:F.ui, fontSize:11, color:th.appInk, lineHeight:1.35 }}>
                  Dosi in scala <b>×{Math.round(doseScale.factor*100)/100}</b> — {doseScale.label}. Le quantità mostrate sono già ricalcolate.
                </span>
              </div>
            )}
            {tab === "ingredienti" && (
              <IngredientsView ingredients={recipe.ingredients} recipeColor={recipe.color} scaleFactor={doseScale.factor}/>
            )}
            {tab === "preparazione" && (
              <StepsView steps={recipe.steps} recipeColor={recipe.color}/>
            )}
            {tab === "nutrizione" && (
              !nutritionStatus.anyMapped ? (
                <div style={{ textAlign:"center", padding:"30px 20px", color:th.appFaded }}>
                  <div style={{ fontSize:34, marginBottom:10 }}>🍎</div>
                  <div style={{ fontFamily:F.ui, fontSize:13, color:th.appInk, fontWeight:700, marginBottom:6 }}>Nessun valore nutrizionale</div>
                  <div style={{ fontFamily:F.ui, fontSize:11, lineHeight:1.5 }}>
                    Collega gli ingredienti al database in <b>🍎⚙️ Organizza › 🍎 Valori nutrizionali</b> per vedere calorie e macro di questa ricetta.
                  </div>
                </div>
              ) : (
                <NutritionCard recipe={recipe} nutritionMap={nutritionMap} equivalences={equivalences} customUnits={customUnits} customFoods={customFoods} ingredientDict={ingredientDict} aggregates={aggregates} sourceByIngredient={sourceByIngredient} onManageEquivalences={onManageEquivalences} onManageIngredients={onManageIngredients} standalone/>
              )
            )}

            {recipe.note && (
              <div style={{
                marginTop:20,
                background:"#EDE6D4",
                borderRadius:14,
                padding:"14px 16px",
                borderLeft:`3px solid ${"#B8973A"}`,
              }}>
                <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#B8973A", textTransform:"uppercase", marginBottom:6 }}>Note</div>
                <p style={{ fontFamily:F.body, fontStyle:"italic", fontSize:13, color:"#7A6E5F", margin:0, lineHeight:1.5 }}>"{recipe.note}"</p>
              </div>
            )}

            {/* ── COMMENTI / APPUNTI ── */}
            <div style={{ marginTop:24 }}>
              <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appAccent, textTransform:"uppercase", marginBottom:4, fontWeight:700 }}>
                💬 Commenti e appunti
              </div>
              <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:10, lineHeight:1.4 }}>
                Annota varianti e osservazioni senza modificare la ricetta.
              </div>

              {/* Lista commenti */}
              {(recipe.comments || []).length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                  {recipe.comments.map(c => (
                    <div key={c.id} style={{
                      background:th.appCard, border:`1px solid ${editingCommentId === c.id ? th.appAccent : th.appBorder}`,
                      borderRadius:12, padding:"10px 12px",
                      display:"flex", gap:10, alignItems:"flex-start",
                    }}>
                      <span style={{ fontSize:14, marginTop:1 }}>📝</span>
                      {editingCommentId === c.id ? (
                        // ── Modalità modifica ──
                        <div style={{ flex:1 }}>
                          <textarea
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveEditedComment(); }
                              if (e.key === "Escape") { cancelEditComment(); }
                            }}
                            autoFocus
                            rows={2}
                            style={{
                              width:"100%", padding:"8px 10px",
                              border:`1.5px solid ${th.appAccent}`,
                              borderRadius:10, background:th.appBg,
                              fontFamily:F.body, fontSize:13, color:th.appInk,
                              outline:"none", resize:"vertical", boxSizing:"border-box", minHeight:44,
                            }}
                          />
                          <div style={{ display:"flex", gap:8, marginTop:8 }}>
                            <button onClick={saveEditedComment} disabled={!editingText.trim()} style={{
                              padding:"6px 14px", borderRadius:8, border:"none",
                              background: editingText.trim() ? th.appAccent : th.appBorder,
                              color: editingText.trim() ? "#fff" : th.appFaded,
                              fontFamily:F.ui, fontSize:12, fontWeight:700,
                              cursor: editingText.trim() ? "pointer" : "default",
                            }}>Salva</button>
                            <button onClick={cancelEditComment} style={{
                              padding:"6px 14px", borderRadius:8,
                              border:`1.5px solid ${th.appBorder}`, background:"transparent",
                              color:th.appFaded, fontFamily:F.ui, fontSize:12, cursor:"pointer",
                            }}>Annulla</button>
                          </div>
                        </div>
                      ) : (
                        // ── Visualizzazione ──
                        <>
                          <div style={{ flex:1 }}>
                            <p style={{ fontFamily:F.body, fontSize:13, color:th.appInk, margin:0, lineHeight:1.5 }}>{c.text}</p>
                            <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:4 }}>
                              📅 {c.date}{c.edited ? ` · modificato ${c.edited}` : ""}
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                            <button onClick={() => startEditComment(c)} style={{
                              background:"none", border:"none", color:th.appFaded,
                              fontSize:13, cursor:"pointer", padding:0,
                            }}>✏️</button>
                            <button onClick={() => deleteComment(c.id)} style={{
                              background:"none", border:"none", color:"#ccc",
                              fontSize:15, cursor:"pointer", padding:0,
                            }}>×</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Input nuovo commento */}
              <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
                <textarea
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addComment(); }
                  }}
                  placeholder="Scrivi un commento o una variante…"
                  rows={2}
                  style={{
                    flex:1, padding:"10px 12px",
                    border:`1.5px solid ${commentInput ? th.appAccent : th.appBorder}`,
                    borderRadius:12, background:th.appCard,
                    fontFamily:F.body, fontSize:13, color:th.appInk,
                    outline:"none", resize:"vertical", boxSizing:"border-box",
                    minHeight:44,
                  }}
                />
                <button
                  onClick={addComment}
                  disabled={!commentInput.trim()}
                  style={{
                    padding:"11px 16px", borderRadius:12, border:"none",
                    background: commentInput.trim() ? th.appAccent : th.appBorder,
                    color: commentInput.trim() ? "#fff" : th.appFaded,
                    fontFamily:F.ui, fontSize:13, fontWeight:700,
                    cursor: commentInput.trim() ? "pointer" : "default",
                    flexShrink:0,
                  }}
                >＋</button>
              </div>
            </div>

            {/* ── RICORDI ── */}
            <MemoriesSection
              memories={recipe.memories || []}
              color={recipe.color}
              onAdd={() => onAddMemory && onAddMemory(recipe.id)}
              onDelete={(memId) => onDeleteMemory(memId)}
            />
          </div>
        </div>
      ) : (
        // ── Book view ─────────────────────────────────────────
        <BookPageView recipe={recipe}/>
      )}

      {/* Dialog calcolo dosi (imposta doseScale per la ricetta) */}
      {servingsDialog && (
        <ServingsDialog
          recipe={recipe}
          title="Calcolo dosi"
          emoji="⚖️"
          initialScale={doseScale}
          onConfirm={(scale) => { setDoseScale(scale); setServingsDialog(null); }}
          onClose={() => setServingsDialog(null)}
        />
      )}

      {/* Active mode overlays */}
      {activeMode?.mode === "shopping" && (
        <ShoppingMode recipe={recipe} scale={activeMode.scale} onAddToList={onAddToShoppingList} onClose={() => setActiveMode(null)}/>
      )}
      {activeMode?.mode === "cooking" && (
        <CookingMode recipe={recipe} scale={activeMode.scale} onClose={() => setActiveMode(null)}/>
      )}
    </div>
  );
}
