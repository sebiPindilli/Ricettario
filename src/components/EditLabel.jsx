import { F } from "../data/constants.js";

export default function EditLabel({ text }) {
  return (
    <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:"#7A6E5F", textTransform:"uppercase", marginBottom:6, marginTop:2 }}>{text}</div>
  );
}
