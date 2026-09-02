import React, { useState } from "react";
import { useTheme, useUiStyle, useOnline } from "../context.js";
import { F } from "../data/constants.js";
import { readImageFile } from "../utils/helpers.js";
import GlobalNav from "../components/GlobalNav.jsx";
import BackBtn from "../components/BackBtn.jsx";
import ScreenHeader from "../components/ScreenHeader.jsx";
import EditField from "../components/EditField.jsx";
import EditLabel from "../components/EditLabel.jsx";
import Toast from "../components/Toast.jsx";
import ChosenIcon from "../components/ChosenIcon.jsx";
import AppIcon from "../components/AppIcon.jsx";
import PhotoCropOverlay from "../components/PhotoCropOverlay.jsx";
import { guideNuovoRicordo } from "../data/guideContent.jsx";

export default function AddMemoryScreen({ recipes, initialRecipeId = null, onBack, onSave, onLanding, onRecipes, onBook, onMemories, onAdd, onFridge, onShopping }) {
  const th = useTheme();
  const ui = useUiStyle();
  const isOnline = useOnline();
  const [toast, setToast] = useState({ msg:"", visible:false });
  const showToast = (msg) => {
    setToast({ msg, visible:true });
    setTimeout(() => setToast({ msg:"", visible:false }), 2000);
  };
  const todayISO = new Date().toISOString().slice(0,10);
  const dateLabel = (iso) => new Date(iso).toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" });
  const [caption, setCaption] = useState("");
  const [story, setStory] = useState("");
  const [chosenPhoto, setChosenPhoto] = useState(null); // emoji o dataURL immagine
  const [photoIsImage, setPhotoIsImage] = useState(false);
  const [cropSource, setCropSource] = useState(null); // dataURL grezzo in attesa di ritaglio
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(initialRecipeId ? [initialRecipeId] : []);
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const fileInputRef = React.useRef(null);

  const MEMORY_EMOJIS = ["🍽️","🥂","🎉","👨‍👩‍👦","🌿","🌅","🏠","🎂","⛺","🌊","❄️","🫂","🎄","🌸","🍂","✨","🫶","🥳"];
  const today = dateLabel(selectedDate);

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    readImageFile(file, (dataUrl) => setCropSource(dataUrl));
  };
  const handleCropConfirm = (croppedDataUrl) => {
    setChosenPhoto(croppedDataUrl);
    setPhotoIsImage(true);
    setCropSource(null);
  };

  // Richiede connessione (Storage non ha una coda offline come Firestore).
  const openPhotoPicker = () => {
    if (!isOnline) { showToast(<><AppIcon emoji="📡" icon="connessione" size={13} /> Serve una connessione per aggiungere una foto</>); return; }
    fileInputRef.current && fileInputRef.current.click();
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
        bottomNavActive
      />
      {ui.header === "legacy" && (
        <div style={{ padding:"8px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <BackBtn onBack={onBack} label="Annulla"/>
          <button
            onClick={() => canSave && onSave({ photo:chosenPhoto, photoIsImage, caption, story, date:today, dateISO:selectedDate, recipeIds:selectedRecipeIds })}
            style={{
              background: canSave ? th.appAccent : th.appBorder,
              color: canSave ? th.appOnAccent : th.appFaded,
              border:"none", borderRadius:10, padding:"8px 18px",
              fontFamily:F.ui, fontSize:13, fontWeight:700,
              cursor: canSave ? "pointer" : "default", transition:"all 0.2s",
              display:"flex", alignItems:"center", gap:5,
            }}
          >Salva <AppIcon emoji="✓" icon="fatto" size={12} /></button>
        </div>
      )}
      {/* Negli stili nuovi niente Salva duplicato in testa: c'è già il
          pulsante pieno in fondo alla scheda (Fase 8, come le altre schermate). */}
      <ScreenHeader title="Nuovo Ricordo" subtitle={today} onBack={onBack} onHome={onLanding} infoContent={guideNuovoRicordo}/>

      <div style={{ flex:1, overflowY:"auto", padding:`0 ${ui.padX}px 40px`, display:"flex", flexDirection:"column", gap:16 }}>

        {/* Data del ricordo */}
        <div>
          <EditField label="Quando è successo" type="date" value={selectedDate} onChange={v => setSelectedDate(v)} placeholder="Quando è successo" max={todayISO}/>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:6 }}>
            Predefinita a oggi. Cambiala se il momento è di un altro giorno.
          </div>
        </div>

        {/* Photo — caricamento reale con anteprima */}
        <div>
          <EditLabel text="Foto"/>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }}/>
          {photoIsImage && chosenPhoto ? (
            <div style={{ position:"relative", borderRadius:ui.radius.card, overflow:"hidden", border:`1.5px solid ${ui.border}` }}>
              <img src={chosenPhoto} alt="anteprima" style={{ width:"100%", height:200, objectFit:"cover", display:"block" }}/>
              <button onClick={openPhotoPicker} style={{
                position:"absolute", bottom:10, right:10,
                background:"rgba(0,0,0,0.6)", color:"#fff", border:"none",
                borderRadius:10, padding:"7px 12px", fontFamily:F.ui, fontSize:11, fontWeight:600, cursor:"pointer",
                opacity: isOnline ? 1 : 0.5,
                display:"flex", alignItems:"center", gap:5,
              }}><AppIcon emoji="🔄" icon="aggiorna" size={11} /> Cambia foto</button>
            </div>
          ) : (
            <button onClick={openPhotoPicker} style={{
              width:"100%", padding:"22px 8px",
              border:`2px dashed ${ui.border}`, borderRadius:ui.radius.card,
              background:"transparent", color:th.appFaded,
              fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:8,
              opacity: isOnline ? 1 : 0.5,
            }}>
              <AppIcon emoji="📷" icon="foto" size={30} />
              <span>Scatta o scegli dalla galleria</span>
            </button>
          )}
          {cropSource && (
            <PhotoCropOverlay
              image={cropSource}
              onConfirm={handleCropConfirm}
              onClose={() => setCropSource(null)}
            />
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
                background: !photoIsImage && chosenPhoto===e ? th.appPillBg : "transparent",
                fontSize:20, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Titolo breve */}
        <EditField label="Titolo (opzionale)" value={caption} onChange={setCaption} placeholder="es. Domenica in famiglia, prima volta insieme…"/>

        {/* Racconto — spazio ampio per la storia (EditField non copre le
            textarea multilinea: resta il campo con etichetta di sempre). */}
        <div>
          <EditLabel text="Il racconto (opzionale)"/>
          <textarea
            value={story}
            onChange={e => setStory(e.target.value)}
            placeholder="Com'è andata? Chi c'era, cosa vi siete detti, un dettaglio da ricordare…"
            rows={4}
            style={{
              width:"100%", padding:"11px 14px",
              border:`1.5px solid ${ui.border}`,
              borderRadius:ui.radius.control, background:ui.card,
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
              // sezioni (testo/tenue) e sezioniPiene (riempimento pieno con
              // icona/spunta bianca) sono due colori diversi apposta — vedi
              // PALETTE.md, e ui.sectionColorFull in data/uiStyles.js.
              const color = ui.sectionColor(r.macroSection) ?? r.color;
              const fillColor = ui.sectionColorFull(r.macroSection) ?? r.color;
              return (
                <button key={r.id} onClick={() => toggleRecipe(r.id)} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"10px 14px",
                  background: sel ? `${color}15` : th.appCard,
                  border:`1.5px solid ${sel ? color : th.appBorder}`,
                  borderRadius:12, cursor:"pointer", textAlign:"left",
                  transition:"all 0.15s",
                }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:fillColor, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><ChosenIcon emoji={r.emoji} icon={r.icon} size={16} /></div>
                  <div style={{ flex:1, fontFamily:F.ui, fontSize:13, color: sel ? color : th.appInk, fontWeight: sel ? 600 : 400 }}>{r.title}</div>
                  <div style={{
                    width:22, height:22, borderRadius:"50%",
                    border:`2px solid ${sel ? color : th.appBorder}`,
                    background: sel ? fillColor : "transparent",
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
            background: canSave ? th.appPrimaryBg : th.appBorder,
            color: canSave ? th.appPrimaryText : th.appFaded,
            border:"none", borderRadius:ui.radius.control,
            fontFamily:F.ui, fontSize:14, fontWeight:700,
            textTransform: ui.uppercaseButtons ? "uppercase" : "none",
            cursor: canSave ? "pointer" : "default",
            boxShadow: canSave ? `0 4px 16px ${th.appPrimaryBg}44` : "none",
            transition:"all 0.2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}
        >
          {!chosenPhoto
            ? "Seleziona una foto o emoji"
            : selectedRecipeIds.length === 0
              ? "Seleziona almeno una ricetta"
              : <><AppIcon emoji="✓" icon="fatto" size={14} /> {`Salva ricordo (${selectedRecipeIds.length} ricett${selectedRecipeIds.length===1?"a":"e"})`}</>
          }
        </button>
      </div>
      <Toast msg={toast.msg} visible={toast.visible}/>
    </div>
  );
}
