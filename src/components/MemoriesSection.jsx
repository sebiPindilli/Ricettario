import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import PhotoLightbox from "./PhotoLightbox.jsx";
import MemoryPhoto from "./MemoryPhoto.jsx";
import AppIcon from "./AppIcon.jsx";

// ── Memories Section ───────────────────────────────────────────
export default function MemoriesSection({ memories, color, onAdd, onDelete }) {
  const th = useTheme();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [lightbox, setLightbox] = useState(null); // {photo, caption, date}
  const isEmpty = !memories || memories.length === 0;

  return (
    <div style={{ marginTop:28 }}>
      {/* Lightbox */}
      {lightbox && (
        <PhotoLightbox
          photo={lightbox.photo}
          caption={lightbox.caption}
          date={lightbox.date}
          isImage={lightbox.isImage}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Section header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ flex:1, height:1, background:th.appBorder }}/>
        <span style={{ fontFamily:F.ui, fontSize:11, letterSpacing:2.5, color:th.appFaded, textTransform:"uppercase" }}>
          I nostri ricordi
        </span>
        <div style={{ flex:1, height:1, background:th.appBorder }}/>
      </div>

      {/* Memory grid */}
      {isEmpty ? (
        <div style={{
          textAlign:"center", padding:"24px 16px",
          background:th.appCard, borderRadius:16,
          border:`1.5px dashed ${th.appBorder}`,
          marginBottom:16,
        }}>
          <div style={{ marginBottom:8, display:"flex", justifyContent:"center" }}><AppIcon emoji="📷" icon="foto" size={36} /></div>
          <div style={{ fontFamily:F.display, fontSize:15, color:th.appFaded, fontStyle:"italic" }}>
            Nessun ricordo ancora
          </div>
          <div style={{ fontFamily:F.ui, fontSize:11, color:th.appFaded, marginTop:4, opacity:0.7 }}>
            Aggiungi una foto la prossima volta che cucinate questa ricetta
          </div>
        </div>
      ) : null}

      {!isEmpty && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {memories.map(mem => (
            <div key={mem.id} style={{
              position:"relative",
              borderRadius:14, overflow:"hidden",
              background:`linear-gradient(135deg, ${color}28, ${color}12)`,
              border:`1px solid ${color}30`,
            }}>
              {/* Photo — tappable to open lightbox */}
              <div
                onClick={() => setLightbox({ photo:mem.photo, caption:mem.caption, date:mem.date, isImage:mem.photoIsImage })}
                style={{
                  cursor:"pointer",
                  background:`linear-gradient(135deg, ${color}20, ${color}08)`,
                  position:"relative",
                }}
              >
                <MemoryPhoto mem={mem} height={110}/>
                {/* Expand hint */}
                <div style={{
                  position:"absolute", bottom:4, right:6,
                  fontSize:12, opacity:0.5,
                }}>⤢</div>
              </div>

              {/* Caption + date */}
              <div style={{ padding:"8px 10px 10px" }}>
                {mem.caption && (
                  <div style={{
                    fontFamily:F.body, fontSize:12, color:th.appInk,
                    fontStyle:"italic", lineHeight:1.4, marginBottom:3,
                  }}>"{mem.caption}"</div>
                )}
                <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, letterSpacing:0.5 }}>
                  📅 {mem.date}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={() => setConfirmDeleteId(mem.id)}
                style={{
                  position:"absolute", top:6, right:6,
                  width:22, height:22, borderRadius:"50%",
                  background:"rgba(0,0,0,0.45)", color:"#fff",
                  border:"none", cursor:"pointer",
                  fontSize:11, display:"flex", alignItems:"center", justifyContent:"center",
                }}>×</button>

              {/* Confirm delete overlay */}
              {confirmDeleteId === mem.id && (
                <div style={{
                  position:"absolute", inset:0,
                  background:"rgba(0,0,0,0.75)",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  gap:8, padding:10,
                }}>
                  <div style={{ fontFamily:F.ui, fontSize:11, color:"#fff", textAlign:"center" }}>
                    Eliminare questo ricordo?
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => setConfirmDeleteId(null)} style={{
                      padding:"5px 12px", borderRadius:8,
                      background:"rgba(255,255,255,0.2)", color:"#fff",
                      border:"none", fontFamily:F.ui, fontSize:11, cursor:"pointer",
                    }}>Annulla</button>
                    <button onClick={() => { onDelete(mem.id); setConfirmDeleteId(null); }} style={{
                      padding:"5px 12px", borderRadius:8,
                      background:"#D93025", color:"#fff",
                      border:"none", fontFamily:F.ui, fontSize:11, cursor:"pointer", fontWeight:700,
                    }}>Elimina</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add memory button */}
      <button onClick={onAdd} style={{
        width:"100%", padding:"12px", borderRadius:14,
        border:`1.5px dashed ${th.appAccent}`,
        background:"transparent", color:th.appAccent,
        fontFamily:F.ui, fontSize:13, fontWeight:600, cursor:"pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      }}>➕ Aggiungi ricordo</button>
    </div>
  );
}
