// Segnalazioni beta (bug/miglioramenti) — collezione globale "reports",
// non legata a un libro. Vedi firestore.rules per i permessi per ruolo.
import { db } from "../firebase.js";
import { collection, doc, setDoc, getDocs, updateDoc, serverTimestamp, deleteField } from "firebase/firestore";
import { uploadPhoto, reportScreenshotPath } from "./photoStore.js";

const reportsCol = () => collection(db, "reports");

// L'ID viene generato subito (invece di addDoc) per poter caricare
// l'eventuale screenshot su Storage nel path corretto PRIMA di scrivere il
// documento — così screenshotUrl entra già nella scrittura di creazione,
// senza bisogno di un update successivo (i report restano immutabili dopo
// la creazione, vedi regola "solo status/resolvedBy/resolvedAt" sotto).
export const createReport = async ({ type, title, description, createdBy, screenshotDataUrl }) => {
  const ref = doc(reportsCol());
  const screenshotUrl = screenshotDataUrl
    ? await uploadPhoto(reportScreenshotPath(ref.id), screenshotDataUrl)
    : null;
  await setDoc(ref, {
    type, title, description, createdBy, createdAt: serverTimestamp(), status: "open",
    ...(screenshotUrl ? { screenshotUrl } : {}),
  });
  return ref.id;
};

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
