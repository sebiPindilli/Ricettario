import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import BookMembersPanel from "./BookMembersPanel.jsx";

// Popup "Aggiungi persona" — solo la gestione membri del ricettario attivo
// (BookMembersPanel.jsx, la stessa logica già usata in BooksScreen.jsx),
// non l'intera scheda del libro. Stesso linguaggio visivo degli altri
// overlay centrati della sessione (PhotoCropOverlay.jsx/SectionMovePicker.jsx).
export default function AddMemberOverlay({ book, me, onAddMember, onRemoveMember, onChangeMemberPermission, onClose }) {
  const th = useTheme();
  if (!book) return null;

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxHeight:"80%", overflowY:"auto", background:th.appBg, borderRadius:20, padding:"18px 16px", boxShadow:"0 10px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ fontFamily:F.display, fontSize:16, color:th.appInk, textAlign:"center", marginBottom:2 }}>{book.name}</div>
        <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded, textAlign:"center", marginBottom:14 }}>Persone con accesso a questo ricettario</div>
        <BookMembersPanel book={book} me={me} onAddMember={onAddMember} onRemoveMember={onRemoveMember} onChangeMemberPermission={onChangeMemberPermission}/>
        <button onClick={onClose} style={{ width:"100%", marginTop:14, padding:"11px", border:"none", borderRadius:12, background:th.appAccent, color:th.appOnAccent, fontFamily:F.ui, fontSize:12, fontWeight:700, cursor:"pointer" }}>Fatto</button>
      </div>
    </div>
  );
}
