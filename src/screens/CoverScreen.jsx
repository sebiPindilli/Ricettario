import React, { useState, useEffect } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

export default function CoverScreen({ onEnter }) {
  const th = useTheme();
  const [phase, setPhase] = useState("idle");
  const [coverAngle, setCoverAngle] = useState(0);

  useEffect(() => {
    if (phase === "opening") {
      let start = null;
      const duration = 900;
      const animate = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCoverAngle(eased * 105);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setPhase("open");
          setTimeout(onEnter, 300);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [phase]);

  const handleOpen = () => { if (phase === "idle") setPhase("opening"); };

  const fabricTexture = `
    repeating-linear-gradient(45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px),
    repeating-linear-gradient(-45deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 4px)
  `;

  return (
    <div style={{
      height:"100%", minHeight:800,
      background:"#111",
      overflow:"hidden", position:"relative",
      cursor: phase==="idle" ? "pointer" : "default",
    }} onClick={handleOpen}>

      <div style={{ position:"absolute", top:0, left:0, right:0, zIndex:10 }}>
      </div>

      <div style={{ perspective:"1200px", perspectiveOrigin:"35% 50%", position:"absolute", inset:0 }}>

        {/* PAGES edge */}
        <div style={{
          position:"absolute", right:0, top:0, bottom:0, width:22,
          background:"linear-gradient(to right, #c8c8c8, #f5f5f5, #e0e0e0, #f8f8f8)",
          zIndex:1,
        }}>
          {Array.from({length:40}).map((_,i) => (
            <div key={i} style={{
              height:1,
              background: i%4===0 ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.03)",
              marginTop:"calc(100% / 40)",
            }}/>
          ))}
        </div>

        {/* BACK COVER */}
        <div style={{
          position:"absolute", inset:0, zIndex:2,
          background:`${th.coverBg}, ${fabricTexture}`,
          filter:"brightness(0.7)",
        }}/>

        {/* FRONT COVER */}
        <div style={{
          position:"absolute", inset:0, zIndex:3,
          transformOrigin:"left center",
          transform:`rotateY(-${coverAngle}deg)`,
          transformStyle:"preserve-3d",
        }}>
          {/* Front face */}
          <div style={{
            position:"absolute", inset:0,
            backfaceVisibility:"hidden",
            background:`${th.coverBg}, ${fabricTexture}`,
            boxShadow: phase==="idle"
              ? "inset -8px 0 30px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)"
              : "inset -4px 0 15px rgba(0,0,0,0.3)",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
          }}>
            {/* Spine line */}
            <div style={{
              position:"absolute", left:28, top:0, bottom:0, width:1,
              background: th.spineColor,
            }}/>

            {/* Decorative frames */}
            <div style={{ position:"absolute", inset:28, border:`1px solid ${th.coverAccent}`, pointerEvents:"none" }}/>
            <div style={{ position:"absolute", inset:34, border:`1px solid ${th.coverAccent}`, opacity:0.5, pointerEvents:"none" }}/>

            {/* Corner ornaments */}
            {[
              {top:20,left:20,bt:"borderTop",bl:"borderLeft"},
              {top:20,right:20,bt:"borderTop",bl:"borderRight"},
              {bottom:20,left:20,bt:"borderBottom",bl:"borderLeft"},
              {bottom:20,right:20,bt:"borderBottom",bl:"borderRight"},
            ].map((pos,i) => {
              const { bt, bl, ...coords } = pos;
              return (
                <div key={i} style={{
                  position:"absolute", width:20, height:20, ...coords,
                  [bt]:`1.5px solid ${th.coverAccent}`,
                  [bl]:`1.5px solid ${th.coverAccent}`,
                }}/>
              );
            })}

            {/* Title */}
            <div style={{ textAlign:"center", padding:"0 48px", zIndex:1 }}>
              <div style={{
                fontFamily:F.ui, fontSize:11, letterSpacing:6,
                color: th.coverText.replace(/[\d.]+\)$/, "0.4)"),
                textTransform:"uppercase", marginBottom:18,
              }}>Il mio</div>
              <div style={{
                fontFamily:F.display, fontSize:42,
                color: th.coverText,
                letterSpacing:2, lineHeight:1.15, fontStyle:"italic",
                textShadow:"0 2px 20px rgba(0,0,0,0.4)",
              }}>Ricettario</div>
              <div style={{
                width:80, height:1, margin:"20px auto",
                background:`linear-gradient(to right, transparent, ${th.coverAccent}, transparent)`,
              }}/>
              <div style={{
                fontFamily:F.ui, fontSize:10, letterSpacing:4,
                color: th.coverText.replace(/[\d.]+\)$/, "0.25)"),
                textTransform:"uppercase",
              }}>Le nostre ricette</div>
            </div>

            {/* Tap hint */}
            {phase === "idle" && (
              <div style={{ position:"absolute", bottom:52, left:0, right:0, textAlign:"center" }}>
                <div style={{
                  display:"inline-block",
                  fontFamily:F.ui, fontSize:11,
                  color: th.coverText.replace(/[\d.]+\)$/, "0.35)"),
                  letterSpacing:3, textTransform:"uppercase",
                  animation:"pulse 2s ease-in-out infinite",
                }}>Apri il ricettario</div>
              </div>
            )}
          </div>

          {/* Inner face */}
          <div style={{
            position:"absolute", inset:0,
            backfaceVisibility:"hidden",
            transform:"rotateY(180deg)",
            background: th.pageColor,
          }}/>
        </div>
      </div>

      {/* Recipe count */}
      <div style={{
        position:"absolute", bottom:32, left:0, right:0,
        textAlign:"center", zIndex:20, pointerEvents:"none",
      }}>
        <div style={{
          fontFamily:F.ui, fontSize:10,
          color: th.coverText.replace(/[\d.]+\)$/, "0.15)"),
          letterSpacing:3, textTransform:"uppercase",
        }}>5 ricette salvate</div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity:0.4; transform:translateY(0); }
          50% { opacity:0.8; transform:translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
