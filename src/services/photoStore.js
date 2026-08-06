// Fase 2 — upload/cancellazione foto su Firebase Storage.
// Le foto nell'app sono dataURL base64 ("data:image/...;base64,...");
// qui vengono caricate su Storage e sostituite con la sola download URL
// prima di salvare su Firestore (mai base64 inline nei documenti).
import { storage } from "../firebase.js";
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";

// path: percorso Storage (es. "books/{bookId}/recipes/{recipeId}/dish.jpg").
// "data_url" fa fare a Firebase il parse del base64 e del content-type.
export const uploadPhoto = async (path, dataUrl) => {
  const r = ref(storage, path);
  await uploadString(r, dataUrl, "data_url");
  return getDownloadURL(r);
};

// urlOrPath: accetta sia una download URL https che un path Storage —
// firebase/storage sa costruire il riferimento da entrambe le forme.
export const deletePhoto = (urlOrPath) => deleteObject(ref(storage, urlOrPath));

export const dishPhotoPath = (bookId, recipeId) =>
  `books/${bookId}/recipes/${recipeId}/dish.jpg`;
export const stepPhotoPath = (bookId, recipeId, stepKey, photoIndex) =>
  `books/${bookId}/recipes/${recipeId}/steps/${stepKey}_${photoIndex}.jpg`;
export const memoryPhotoPath = (bookId, recipeId, memoryId) =>
  `books/${bookId}/recipes/${recipeId}/memories/${memoryId}.jpg`;
export const reportScreenshotPath = (reportId) =>
  `reports/${reportId}/screenshot.jpg`;
