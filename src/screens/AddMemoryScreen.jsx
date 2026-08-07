import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import GlobalNav from "../components/GlobalNav.jsx";
import BackBtn from "../components/BackBtn.jsx";
import EditLabel from "../components/EditLabel.jsx";
import { guideNuovoRicordo } from "../data/guideContent.jsx";

export default function AddMemoryScreen({ recipes, initialRecipeId = null, onBack, onSave, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping }) {
  const th = useTheme();
  const todayISO = new Date().toISOString().slice(0,10);
  const dateLabel = (iso) => new Date(iso).toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" });
  const [caption, setCaption] = useState("");
  const [story, setStory] = useState("");
  const [chosenPhoto, setChosenPhoto] = useState(null); // emoji o dataURL immagine
  const [photoIsImage, setPhotoIsImage] = useState(false);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(initialRecipeId ? [initialRecipeId] : []);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const fileInputRef = React.useRef(null);

  const MEMORY_EMOJIS = ["🍽️","🥂","🎉","👨‍👩‍👦","🌿","🌅","🏠","🎂","⛺","🌊","❄️","🫂","🎄","🌸","🍂","✨","🫶","🥳"];
  const today = dateLabel(selectedDate);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setChosenPhoto(ev.target.result); setPhotoIsImage(true); };
    reader.readAsDataURL(file);
  };

  const toggleRecipe = (id) => setSelectedRecipeIds(prev =>
    prev.includes(id) ? prev.filter(r=>r!==id) : [...prev, id]
  );

  const canSave = chosenPhoto && selectedRecipeIds.length > 0;

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <GlobalNav
        activeScreen="add"
        onRecipes={onRecipes}
        onBook={onBook}
        onMemories={onMemories}
        onAdd={onAdd}
        onFridge={onFridge}
        onShopping={onShopping}
        onLanding={onLanding}
        onSearch={() => {}}
        onFavorites={() => {}}
        showSearch={false}
        showFavorites={false}
        activeLabel="Nuovo Ricordo"
        infoContent={guideNuovoRicordo}
      />
      <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <BackBtn onBack={onBack} label="Annulla"/>
        <button
          onClick={() => canSave && onSave({ photo:chosenPhoto, photoIsImage, caption, story, date:today, dateISO:selectedDate, recipeIds:selectedRecipeIds })}
          style={{
            background: canSave ? th.appAccent : th.appBorder,
            color: canSave ? "#fff" : th.appFaded,
            border:"none", borderRadius:10, padding:"8px 18px",
            fontFamily:F.ui, fontSize:13, fontWeight:700,
            cursor: canSave ? "pointer" : "default", transition:"all 0.2s",
          }}
        >Salva ✓</button>
      </div>

      <div style={{ padding:"12px 20px 4px" }}>
        <div style={{ fontFamily:F.display, fontSize:22, color:th.appInk }}>Nuovo Ricordo</div>
        <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:2 }}>{today}</div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"0 20px 40px", display:"flex", flexDirection:"column", gap:16 }}>

        {/* Data del ricordo */}
        <div>
          <EditLabel text="Quando è successo"/>
          <input
            type="date"
            value={selectedDate}
            max={todayISO}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${th.appBorder}`,
              borderRadius:12, background:th.appCard,
              fontFamily:F.body, fontSize:14, color:th.appInk,
              outline:"none", boxSizing:"border-box",
            }}
          />
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:6 }}>
            Predefinita a oggi. Cambiala se il momento è di un altro giorno.
          </div>
        </div>

        {/* Photo — caricamento reale con anteprima */}
        <div>
          <EditLabel text="Foto"/>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }}/>
          {photoIsImage && chosenPhoto ? (
            <div style={{ position:"relative", borderRadius:14, overflow:"hidden", border:`1.5px solid ${th.appBorder}` }}>
              <img src={chosenPhoto} alt="anteprima" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }}/>
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{
                position:"absolute", bottom:10, right:10,
                background:"rgba(0,0,0,0.6)", color:"#fff", border:"none",
                borderRadius:10, padding:"7px 12px", fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
              }}>🔄 Cambia foto</button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{
              width:"100%", padding:"22px 8px",
              border:`2px dashed ${th.appBorder}`, borderRadius:14,
              background:"transparent", color:th.appFaded,
              fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            }}>
              <span style={{ fontSize:30 }}>📷</span>
              <span>Scatta o scegli dalla galleria</span>
            </button>
          )}
        </div>

        {/* Emoji picker — alternativa se non c'è una foto */}
        <div>
          <EditLabel text={photoIsImage ? "Oppure usa un'emoji" : "Oppure scegli un'emoji"}/>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {MEMORY_EMOJIS.map(e => (
              <button key={e} onClick={() => { setChosenPhoto(e); setPhotoIsImage(false); }} style={{
                width:38, height:38, borderRadius:10,
                border:`1.5px solid ${!photoIsImage && chosenPhoto===e ? th.appAccent : th.appBorder}`,
                background: !photoIsImage && chosenPhoto===e ? `${th.appAccent}15` : "transparent",
                fontSize:20, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Titolo breve */}
        <div>
          <EditLabel text="Titolo (opzionale)"/>
          <input
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="es. Domenica in famiglia, prima volta insieme…"
            style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${th.appBorder}`,
              borderRadius:12, background:th.appCard,
              fontFamily:F.body, fontStyle:"italic",
              fontSize:14, color:th.appInk,
              outline:"none", boxSizing:"border-box",
            }}
          />
        </div>

        {/* Racconto — spazio ampio per la storia */}
        <div>
          <EditLabel text="Il racconto (opzionale)"/>
          <textarea
            value={story}
            onChange={e => setStory(e.target.value)}
            placeholder="Com'è andata? Chi c'era, cosa vi siete detti, un dettaglio da ricordare…"
            rows={4}
            style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${th.appBorder}`,
              borderRadius:12, background:th.appCard,
              fontFamily:F.body, fontSize:14, color:th.appInk,
              outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.5,
            }}
          />
        </div>

        {/* Recipe association — required */}
        <div>
          <EditLabel text="Associa a una o più ricette *"/>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginBottom:8 }}>
            Seleziona almeno una ricetta
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {recipes.map(r => {
              const sel = selectedRecipeIds.includes(r.id);
              return (
                <button key={r.id} onClick={() => toggleRecipe(r.id)} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 14px",
                  background: sel ? `${r.color}15` : th.appCard,
                  border:`1.5px solid ${sel ? r.color : th.appBorder}`,
                  borderRadius:12, cursor:"pointer", textAlign:"left",
                  transition:"all 0.15s",
                }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:r.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>{r.emoji}</div>
                  <div style={{ flex:1, fontFamily:F.ui, fontSize:13, color: sel ? r.color : th.appInk, fontWeight: sel ? 600 : 400 }}>{r.title}</div>
                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    border:`2px solid ${sel ? r.color : th.appBorder}`,
                    background: sel ? r.color : "transparent",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontSize:12, flexShrink:0,
                  }}>{sel ? "✓" : ""}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={() => canSave && onSave({ photo:chosenPhoto, photoIsImage, caption, story, date:today, dateISO:selectedDate, recipeIds:selectedRecipeIds })}
          style={{
            width:"100%", padding:"15px",
            background: canSave ? th.appAccent : th.appBorder,
            color: canSave ? "#fff" : th.appFaded,
            border:"none", borderRadius:14,
            fontFamily:F.ui, fontSize:14, fontWeight:700,
            cursor: canSave ? "pointer" : "default",
            boxShadow: canSave ? `0 4px 16px ${th.appAccent}44` : "none",
            transition:"all 0.2s",
          }}
        >
          {!chosenPhoto
            ? "Seleziona una foto o emoji"
            : selectedRecipeIds.length === 0
              ? "Seleziona almeno una ricetta"
              : `Salva ricordo ✓ (${selectedRecipeIds.length} ricett${selectedRecipeIds.length===1?"a":"e"})`
          }
        </button>
      </div>
    </div>
  );
}
