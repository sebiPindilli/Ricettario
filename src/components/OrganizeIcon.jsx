// ── Icona Organizza: mela con ingranaggio all'angolo ──
// Eredita la dimensione dal contesto (em): la scatola è quella di un'emoji
// reale (segnaposto invisibile), quindi l'allineamento è identico alle altre icone.
export default function OrganizeIcon() {
  return (
    <span style={{ position:"relative", display:"inline-block" }}>
      <span style={{ visibility:"hidden" }}>🍎</span>
      <span style={{ position:"absolute", inset:0 }}>🍎</span>
      <span style={{ position:"absolute", right:"-0.15em", bottom:"-0.05em", fontSize:"0.58em", lineHeight:1, filter:"drop-shadow(0 0 1px rgba(0,0,0,0.45))" }}>⚙️</span>
    </span>
  );
}
