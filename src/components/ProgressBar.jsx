export default function ProgressBar({ color, duration }) {
  return (
    <div style={{ width:200, height:4, background:"rgba(255,255,255,0.1)", borderRadius:2, overflow:"hidden" }}>
      <div style={{ height:"100%", background:color, borderRadius:2, animation:`prog ${duration}ms linear forwards` }}/>
      <style>{`@keyframes prog{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </div>
  );
}
