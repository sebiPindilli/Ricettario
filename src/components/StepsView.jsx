import React, { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";
import { isSectioned, stepPhotosOf, stepNumbers, stepNumberLabel } from "../utils/helpers.js";
import SectionBadge from "./SectionBadge.jsx";
import PhotoLightbox from "./PhotoLightbox.jsx";

// Renders steps (flat or sectioned, items can be string or {text,photos})
export default function StepsView({ steps, recipeColor }) {
  const th = useTheme();
  const [lightbox, setLightbox] = useState(null);
  if (!steps || steps.length === 0) return null;
  const numbers = stepNumbers(steps);
  let flatI = 0;

  const renderStep = (step, key, label, color) => {
    const text = typeof step === "string" ? step : step.text;
    const photos = stepPhotosOf(step);
    return (
      <div key={key} style={{ marginBottom:16 }}>
        <div style={{ display:"flex", gap:12 }}>
          <div style={{
            minWidth:26, height:26, padding:"0 5px", borderRadius:13,
            background: color || recipeColor,
            color:"#fff",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:F.ui, fontSize:12, fontWeight:700,
            flexShrink:0, marginTop:2,
          }}>{label}</div>
          <p style={{ fontFamily:F.body, fontSize:14, color:th.appInk, lineHeight:1.55, margin:0 }}>{text}</p>
        </div>
        {photos.length > 0 && (
          <div style={{ display:"flex", gap:8, overflowX:"auto", marginTop:8, marginLeft:38, paddingBottom:2 }}>
            {photos.map((photo, pi) => (
              <img
                key={pi}
                src={photo}
                alt=""
                onClick={() => setLightbox({ photo, caption:text, date:"", isImage:true })}
                style={{
                  height:90, width:120, objectFit:"cover", borderRadius:10,
                  flexShrink:0, cursor:"pointer",
                  border:`1px solid ${(color||recipeColor)}33`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const body = isSectioned(steps) ? (
    <div>
      {steps.map((sec, si) => (
        <div key={si}>
          <SectionBadge label={sec.section} color={recipeColor}/>
          {sec.items.map((step, i) => {
            const { sectionIndex, indexInSection } = numbers[flatI++];
            return renderStep(step, i, stepNumberLabel(sectionIndex, indexInSection), recipeColor);
          })}
        </div>
      ))}
    </div>
  ) : (
    <div>{steps.map((step, i) => {
      const { sectionIndex, indexInSection } = numbers[flatI++];
      return renderStep(step, i, stepNumberLabel(sectionIndex, indexInSection), recipeColor);
    })}</div>
  );

  return (
    <>
      {body}
      {lightbox && (
        <PhotoLightbox
          photo={lightbox.photo}
          caption={lightbox.caption}
          date={lightbox.date}
          isImage={lightbox.isImage}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
