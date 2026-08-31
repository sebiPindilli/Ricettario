export default function Icon({ name, size = 20, style, title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ width: size, height: size, display: "block", flexShrink: 0, ...style }}
    >
      {/* Riferimento allo stesso documento (IconSprite.jsx, montato una
          sola volta in cima a App()): risoluzione istantanea, non un file
          esterno da recuperare a ogni icona montata. */}
      <use href={`#ic-${name}`} />
    </svg>
  );
}
