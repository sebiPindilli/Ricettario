export default function Divider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"8px 0" }}>
      <div style={{ flex:1, height:1, background:"#EDE6D4" }}/>
      <span style={{ color:"#B8973A", fontSize:12 }}>✦</span>
      <div style={{ flex:1, height:1, background:"#EDE6D4" }}/>
    </div>
  );
}
