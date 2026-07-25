import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

// ── Input con menu a tendina filtrato mentre scrivi ──
export default function AutocompleteInput({ value, onChange, suggestions = [], placeholder, wrapperStyle, inputStyle, maxItems = 6 }) {
  const th = useTheme();
  const [open, setOpen] = useState(false);
  const v = (value || "").trim().toLowerCase();
  const filtered = (v
    ? suggestions.filter(s => s.toLowerCase().includes(v) && s.toLowerCase() !== v)
    : suggestions
  ).slice(0, maxItems);

  return (
    <div style={{ position:"relative", ...wrapperStyle }}>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{ width:"100%", boxSizing:"border-box", ...inputStyle }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position:"absolute", top:"calc(100% + 3px)", left:0, right:0, zIndex:250,
          background:th.appBg, border:`1.5px solid ${th.appBorder}`, borderRadius:10,
          maxHeight:150, overflowY:"auto",
          boxShadow:"0 6px 20px rgba(0,0,0,0.18)",
        }}>
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false); }}
              style={{
                display:"block", width:"100%", textAlign:"left",
                padding:"8px 11px", background:"none", border:"none",
                borderBottom:`1px solid ${th.appBorder}55`,
                cursor:"pointer", fontFamily:F.body, fontSize:12.5, color:th.appInk,
              }}
            >{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
