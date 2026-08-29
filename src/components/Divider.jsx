import { useUiStyle } from "../context.js";

export default function Divider() {
  const ui = useUiStyle();
  if (ui.dividers === "hairline") {
    return <div style={{ height:1, background:ui.hairlineStrong, margin:"8px 0" }}/>;
  }
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"8px 0" }}>
      <div style={{ flex:1, height:1, background:"#EDE6D4" }}/>
      <span style={{ color:"#B8973A", fontSize:12 }}>✦</span>
      <div style={{ flex:1, height:1, background:"#EDE6D4" }}/>
    </div>
  );
}
