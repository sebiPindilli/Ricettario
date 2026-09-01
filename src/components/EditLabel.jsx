import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

export default function EditLabel({ text }) {
  const th = useTheme();
  return (
    <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.5, color:th.appFaded, textTransform:"uppercase", marginBottom:6, marginTop:2 }}>{text}</div>
  );
}
