import { useTheme } from "../context.js";

// Rende la "foto" di un ricordo: immagine reale (dataURL) o emoji grande
export default function MemoryPhoto({ mem, height, fontSize = 44, rounded = false }) {
  const th = useTheme();
  if (mem.photoIsImage && mem.photo) {
    return <img src={mem.photo} alt={mem.caption || "ricordo"} style={{ width:"100%", height, objectFit:"cover", display:"block", borderRadius: rounded ? 12 : 0 }}/>;
  }
  return (
    <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", fontSize, background:`${th.appAccent}15`, borderRadius: rounded ? 12 : 0 }}>
      {mem.photo || "📸"}
    </div>
  );
}
