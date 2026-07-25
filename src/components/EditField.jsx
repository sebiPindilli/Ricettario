import { F } from "../data/constants.js";
import EditLabel from "./EditLabel.jsx";

export default function EditField({ label, value, onChange, placeholder="" }) {
  return (
    <div>
      <EditLabel text={label}/>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        width:"100%", padding:"10px 14px",
        border:`1.5px solid #EDE6D4`, borderRadius:10,
        background:"#F7F2E8", fontFamily:F.body, fontSize:14, color:"#2C2416",
        outline:"none", boxSizing:"border-box",
      }}/>
    </div>
  );
}
