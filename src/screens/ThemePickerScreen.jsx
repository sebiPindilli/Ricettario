import React from "react";
import { useTheme } from "../context.js";
import { F, BOOK_THEMES } from "../data/constants.js";
import BackBtn from "../components/BackBtn.jsx";

export default function ThemePickerScreen({ onBack, onSelect }) {
  const th = useTheme();
  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"8px 20px 0" }}><BackBtn onBack={onBack} label="Indietro"/></div>
      <div style={{ padding:"12px 20px 4px" }}>
        <div style={{ fontFamily:F.display, fontSize:24, color:th.appInk }}>Stile del libro</div>
        <div style={{ fontFamily:F.ui, fontSize:12, color:th.appFaded, marginTop:4 }}>Scegli la copertina e il tema dell'app</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px 20px 40px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {BOOK_THEMES.map(theme => {
            const isActive = th.id === theme.id;
            return (
              <button key={theme.id} onClick={() => onSelect(theme)} style={{ background:"none", border:"none", padding:0, cursor:"pointer", textAlign:"left" }}>
                <div style={{ height:130, borderRadius:12, background:theme.coverBg, position:"relative", overflow:"hidden", boxShadow: isActive ? `0 0 0 3px ${th.appAccent}, 0 4px 16px rgba(0,0,0,0.2)` : "0 2px 10px rgba(0,0,0,0.15)", transition:"box-shadow 0.2s" }}>
                  <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(45deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 4px)" }}/>
                  {[{top:6,left:6,b1:"borderTop",b2:"borderLeft"},{top:6,right:6,b1:"borderTop",b2:"borderRight"},{bottom:6,left:6,b1:"borderBottom",b2:"borderLeft"},{bottom:6,right:6,b1:"borderBottom",b2:"borderRight"}].map((pos,i) => {
                    const {b1,b2,...coords} = pos;
                    return <div key={i} style={{ position:"absolute", width:10, height:10, ...coords, [b1]:`1px solid ${theme.coverAccent}`, [b2]:`1px solid ${theme.coverAccent}` }}/>;
                  })}
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                    <div style={{ fontFamily:F.display, fontSize:16, fontStyle:"italic", color:theme.coverText, letterSpacing:1, textShadow:"0 1px 8px rgba(0,0,0,0.3)" }}>Ricettario</div>
                    <div style={{ width:30, height:1, background:`linear-gradient(to right,transparent,${theme.coverAccent},transparent)` }}/>
                  </div>
                  <div style={{ position:"absolute", right:0, top:0, bottom:0, width:8, background:"linear-gradient(to right,#ccc,#f5f5f5)" }}/>
                  {isActive && <div style={{ position:"absolute", top:6, left:6, width:20, height:20, borderRadius:"50%", background:th.appAccent, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>✓</div>}
                </div>
                <div style={{ padding:"6px 2px 0" }}>
                  <div style={{ fontFamily:F.ui, fontSize:12, fontWeight:600, color: isActive ? th.appAccent : th.appInk }}>{theme.name}</div>
                  <div style={{ fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:1 }}>{theme.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
