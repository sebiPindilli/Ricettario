import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { F, DISH_PHOTO_ASPECT } from "../data/constants.js";
import { getCroppedImage } from "../utils/cropImage.js";

// ── Overlay di ritaglio/zoom/posizionamento per la foto principale — stesso
// linguaggio visivo di SectionMovePicker.jsx/TimersPopup.jsx (overlay scuro
// centrato, card chiara, bottoni pieni). react-easy-crop gestisce pinch e
// drag internamente via Pointer Events (niente codice touch a mano); il
// contenitore ad altezza esplicita (60vh) è un requisito della libreria —
// non supporta un'altezza percentuale libera senza vincoli.
export default function PhotoCropOverlay({ image, onConfirm, onClose }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    const dataUrl = await getCroppedImage(image, croppedAreaPixels, { outputWidth: 900, outputHeight: 675 });
    setSaving(false);
    onConfirm(dataUrl);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", background: "#FAF7F0", borderRadius: 20, padding: "18px 16px", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ fontFamily: F.display, fontSize: 16, color: "#2C2416", textAlign: "center", marginBottom: 12 }}>Ritaglia foto</div>

        <div style={{ position: "relative", width: "100%", height: "60vh", borderRadius: 12, overflow: "hidden", background: "#000" }}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={DISH_PHOTO_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div style={{ fontFamily: F.ui, fontSize: 11, color: "#7A6E5F", textAlign: "center", margin: "10px 0" }}>
          Trascina per spostare · pizzica o usa la rotella per zoomare
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} disabled={saving} style={{ flex: 1, padding: "11px", border: "1.5px solid #EDE6D4", borderRadius: 12, background: "transparent", color: "#7A6E5F", fontFamily: F.ui, fontSize: 12, cursor: saving ? "default" : "pointer" }}>Annulla</button>
          <button onClick={handleConfirm} disabled={saving || !croppedAreaPixels} style={{ flex: 2, padding: "11px", border: "none", borderRadius: 12, background: "#C4593A", color: "#fff", fontFamily: F.ui, fontSize: 12, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Elaborazione…" : "Conferma"}
          </button>
        </div>
      </div>
    </div>
  );
}
