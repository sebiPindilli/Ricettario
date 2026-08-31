import spriteSvg from "../assets/app-icons.svg?raw";

// Sprite SVG inserito UNA SOLA VOLTA nel documento, montato in cima a App()
// (ricettario-v23.jsx). Prima Icon.jsx puntava al file esterno
// /app-icons.svg: ogni icona montata (cioè a ogni cambio schermata, dato
// che i componenti vengono smontati/rimontati) obbligava il browser a
// risolvere un riferimento verso un documento SVG separato — il ritardo
// percepito nel cambio schermata. Con lo sprite già presente nella pagina,
// <use href="#ic-nome"> in Icon.jsx punta a un simbolo dello STESSO
// documento: risoluzione istantanea, nessuna richiesta di rete.
//
// `?raw` (Vite) inserisce il contenuto del file come stringa a tempo di
// build — da qui la necessità di una copia in src/ (i file in public/ non
// sono importabili come modulo). Il file svg ha già la struttura giusta
// per stare nascosto in pagina (width=0 height=0 style="position:absolute"),
// quindi non serve avvolgerlo in un contenitore nascosto.
export default function IconSprite() {
  return <div aria-hidden="true" dangerouslySetInnerHTML={{ __html: spriteSvg }} />;
}
