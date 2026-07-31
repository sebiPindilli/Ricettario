import React from "react";
import ComingSoon from "../components/ComingSoon.jsx";

// ══════════════════════════════════════════════════════════════
// SCREEN: ADD FROM LINK — segnaposto in attesa della vera importazione AI
// ══════════════════════════════════════════════════════════════
export default function AddFromLinkScreen({ onBack }) {
  return (
    <ComingSoon
      icon="🔗"
      title="Aggiungi da link — in arrivo"
      message="Presto potrai incollare il link di una ricetta trovata online: l'AI la leggerà e la importerà per te, pronta da rivedere e salvare."
      onBack={onBack}
    />
  );
}
