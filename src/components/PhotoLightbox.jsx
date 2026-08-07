import { F } from "../data/constants.js";

export default function PhotoLightbox({ photo, caption, date, isImage = false, onClose }) {
  // Le foto sono URL di Firebase Storage: un salvataggio "vero" via
  // fetch → blob richiederebbe CORS configurato sul bucket (mai fatto in
  // questo progetto) e comunque Safari iOS ignora l'attributo download a
  // prescindere da CORS. Aprire in una nuova scheda funziona ovunque senza
  // dipendenze: l'utente salva col gesto nativo del suo dispositivo
  // (pressione prolungata su mobile, tasto destro su desktop).
  const handleSave = () => {
    if (photo) window.open(photo, "_blank");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:500,
        background:"rgba(0,0,0,0.95)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position:"absolute", top:20, right:20,
          width:36, height:36, borderRadius:"50%",
          background:"rgba(255,255,255,0.15)", border:"none",
          color:"#fff", fontSize:20, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:10,
        }}
      >×</button>

      {/* Photo — emoji placeholder in prototype, real image in PWA */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"90%", maxWidth:360,
          aspectRatio:"4/3",
          background:"rgba(255,255,255,0.05)",
          borderRadius:12,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:80,
          border:"1px solid rgba(255,255,255,0.1)",
          overflow:"hidden",
        }}
      >
        {/* Immagine reale (dataURL) o emoji placeholder */}
        {isImage && photo
          ? <img src={photo} alt={caption || "ricordo"} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : photo}
      </div>

      {/* Caption + date */}
      {(caption || date) && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ marginTop:16, textAlign:"center", padding:"0 24px" }}
        >
          {caption && (
            <div style={{
              fontFamily:F.body, fontStyle:"italic",
              fontSize:15, color:"rgba(255,255,255,0.85)",
              marginBottom:4, lineHeight:1.4,
            }}>"{caption}"</div>
          )}
          {date && (
            <div style={{
              fontFamily:F.ui, fontSize:12,
              color:"rgba(255,255,255,0.4)",
            }}>📅 {date}</div>
          )}
        </div>
      )}

      {/* Save to gallery button — solo se c'è una foto vera, non un'emoji */}
      {isImage && photo && (
        <button
          onClick={e => { e.stopPropagation(); handleSave(); }}
          style={{
            marginTop:24,
            padding:"12px 28px",
            background:"rgba(255,255,255,0.12)",
            border:"1px solid rgba(255,255,255,0.2)",
            borderRadius:30,
            color:"#fff",
            fontFamily:F.ui, fontSize:14, fontWeight:600,
            cursor:"pointer",
            display:"flex", alignItems:"center", gap:8,
            transition:"all 0.2s",
          }}
        >
          ⬇️ Salva in galleria
        </button>
      )}

      <div style={{
        position:"absolute", bottom:24,
        fontFamily:F.ui, fontSize:11,
        color:"rgba(255,255,255,0.25)",
      }}>Tocca fuori per chiudere</div>
    </div>
  );
}
