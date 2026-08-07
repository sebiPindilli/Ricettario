import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { auth } from "../firebase.js";
import BackBtn from "../components/BackBtn.jsx";
import InfoButton from "../components/InfoButton.jsx";
import { guideScansiona } from "../data/guideContent.jsx";

export default function ScanScreen({ onBack, onSave, mode = "camera" }) {
  const isGallery = mode === "gallery";
  const th = useTheme();
  const [images, setImages] = useState([]); // array di { id, base64, mimeType, previewUrl }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result.split(",")[1];
          resolve({
            id: Date.now() + Math.random().toString(36).substring(2, 9),
            base64: base64Data,
            mimeType: file.type,
            previewUrl: URL.createObjectURL(file)
          });
        };
        reader.readAsDataURL(file);
      });
    });

    try {
      const newImages = await Promise.all(promises);
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    } catch (err) {
      console.error("Error reading files:", err);
      setError("Si è verificato un errore nel caricamento di alcune foto.");
    }
    e.target.value = "";
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/parse-recipe-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          images: images.map(img => ({ base64: img.base64, mimeType: img.mimeType })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Errore (${response.status})`);
      }

      const ocrData = data.recipe;

      // Apri nell'editor precompilato
      onSave(
        ocrData.title || "",
        [],
        ocrData,
        ocrData.emoji || "🍝",
        ocrData.color || "#C4593A",
        "altro"
      );
    } catch (err) {
      console.error("Errore analisi foto ricetta:", err);
      setError("Si è verificato un errore durante l'analisi. Riprova con un'immagine più nitida.");
    } finally {
      setLoading(false);
    }
  };

  const cssAnimations = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 1; }
      100% { opacity: 0.6; }
    }
  `;

  return (
    <div style={{ background: th.appBg, minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <style dangerouslySetInnerHTML={{ __html: cssAnimations }} />

      {/* Header */}
      <div style={{ padding: "12px 18px 6px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <BackBtn onBack={onBack} label="Annulla" />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.display, fontSize: 17, color: th.appInk }}>{isGallery ? "Importa dalla Galleria" : "Scansiona dalla Fotocamera"}</div>
          <div style={{ fontFamily: F.ui, fontSize: 10.5, color: th.appFaded }}>Crea ricetta da foto AI</div>
        </div>
        <InfoButton>{guideScansiona}</InfoButton>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Info card */}
        <div style={{
          background: th.appCard,
          border: `1.5px solid ${th.appBorder}`,
          borderRadius: 16,
          padding: "16px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start"
        }}>
          <span style={{ fontSize: 24 }}>📸</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: th.appInk }}>
              Fotografa una ricetta
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: th.appFaded, lineHeight: 1.5 }}>
              Carica una foto (anche scritta a mano o pagine di libri) e la ricetta verrà aggiunta al tuo ricettario.
            </div>
          </div>
        </div>

        {/* Upload Container */}
        {images.length === 0 && (
          <label style={{
            flex: 1,
            minHeight: 200,
            border: `2px dashed ${th.appBorder}`,
            borderRadius: 20,
            background: th.appCard,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            cursor: "pointer",
            padding: "30px 20px",
            transition: "all 0.2s",
            textAlign: "center"
          }}>
            <input
              type="file"
              accept="image/*"
              multiple
              {...(isGallery ? {} : { capture: "environment" })}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <span style={{ fontSize: 44 }}>{isGallery ? "🗃️" : "📷"}</span>
            <div>
              <div style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: th.appInk }}>
                {isGallery ? "Scegli una o più immagini" : "Fai una foto"}
              </div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: th.appFaded, marginTop: 4 }}>
                Supporta JPG, PNG, WEBP (più foto accettate)
              </div>
            </div>
          </label>
        )}

        {/* Image Grid Preview & Action Buttons */}
        {images.length > 0 && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Grid list */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              gap: 12
            }}>
              {images.map((img) => (
                <div key={img.id} style={{
                  position: "relative",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: `1.5px solid ${th.appBorder}`,
                  background: "#1a1a1a",
                  aspectRatio: "1/1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <img
                    src={img.previewUrl}
                    alt="Anteprima"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    onClick={() => setImages(prev => prev.filter(x => x.id !== img.id))}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "none",
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      color: "#fff",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add More Tile */}
              <label style={{
                borderRadius: 12,
                border: `2px dashed ${th.appBorder}`,
                background: th.appCard,
                aspectRatio: "1/1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                cursor: "pointer",
                padding: 8,
                textAlign: "center"
              }}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  {...(isGallery ? {} : { capture: "environment" })}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: 24 }}>➕</span>
                <span style={{ fontFamily: F.ui, fontSize: 10, fontWeight: 700, color: th.appInk }}>Aggiungi</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setImages([])}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${th.appBorder}`,
                  background: "transparent",
                  color: th.appInk,
                  fontFamily: F.ui,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Svuota
              </button>

              <button
                onClick={handleAnalyze}
                style={{
                  flex: 2,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: th.appAccent,
                  color: "#fff",
                  fontFamily: F.ui,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: `0 4px 12px rgba(196,89,58,0.25)`
                }}
              >
                Analizza Foto ({images.length}) 🍳
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "40px 20px"
          }}>
            <div style={{
              width: 50,
              height: 50,
              border: `5px solid ${th.appBorder}`,
              borderTop: `5px solid ${th.appAccent}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }} />
            <div style={{
              fontFamily: F.ui,
              fontSize: 14,
              fontWeight: 700,
              color: th.appInk,
              textAlign: "center",
              animation: "pulse 1.8s ease-in-out infinite"
            }}>
              Estrazione della ricetta in corso...
            </div>
            <div style={{
              fontFamily: F.ui,
              fontSize: 11,
              color: th.appFaded,
              textAlign: "center",
              maxWidth: 240,
              lineHeight: 1.4
            }}>
              Estrazione di titolo, ingredienti, dosi e passaggi.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: "#FFF5F5",
            border: "1.5px solid #FEB2B2",
            borderRadius: 14,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>❌</span>
              <div style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#C53030" }}>
                Si è verificato un errore
              </div>
            </div>
            <div style={{ fontFamily: F.ui, fontSize: 12, color: "#9B2C2C", lineHeight: 1.5 }}>
              {error}
            </div>
            <button
              onClick={handleAnalyze}
              style={{
                alignSelf: "flex-end",
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: "#C53030",
                color: "#fff",
                fontFamily: F.ui,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Riprova
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
