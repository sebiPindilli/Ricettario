// Segnalazioni beta (bug/miglioramenti) — collezione globale "reports",
// non legata a un libro. Vedi firestore.rules per i permessi per ruolo.
import { db } from "../firebase.js";
import { collection, doc, addDoc, getDocs, updateDoc, serverTimestamp, deleteField } from "firebase/firestore";

const reportsCol = () => collection(db, "reports");

export const createReport = ({ type, title, description, createdBy }) =>
  addDoc(reportsCol(), { type, title, description, createdBy, createdAt: serverTimestamp(), status: "open" });

export const loadReports = async () => {
  const snap = await getDocs(reportsCol());
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const setReportStatus = (id, resolved, resolvedBy) =>
  updateDoc(doc(db, "reports", id), resolved
    ? { status: "resolved", resolvedBy, resolvedAt: serverTimestamp() }
    : { status: "open", resolvedBy: deleteField(), resolvedAt: deleteField() });
