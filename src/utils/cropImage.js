// ── Estrazione dell'area ritagliata su canvas — usata da
// PhotoCropOverlay.jsx dopo che react-easy-crop ha calcolato l'area in
// pixel dell'immagine sorgente. Nessuna dipendenza da React: funzione pura,
// testabile/riusabile in isolamento.

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

// Sorgenti da fotocamera moderna possono superare i 4000px di lato: prima di
// disegnare il ritaglio si ridimensiona l'immagine intera a un massimo
// ragionevole, per non appesantire canvas/memoria su dispositivi di fascia
// bassa. Il fattore di scala va applicato anche alle coordinate di ritaglio,
// che react-easy-crop calcola sui pixel dell'immagine ORIGINALE.
const MAX_SOURCE_SIDE = 2000;

// `croppedAreaPixels` è il rettangolo {x,y,width,height} in pixel
// dell'immagine sorgente, come restituito da onCropComplete di
// react-easy-crop. Ritorna una dataURL JPEG alle dimensioni fisse richieste.
export async function getCroppedImage(imageSrc, croppedAreaPixels, { outputWidth = 900, outputHeight = 675 } = {}) {
  const source = await loadImage(imageSrc);

  const longSide = Math.max(source.width, source.height);
  const preScale = longSide > MAX_SOURCE_SIDE ? MAX_SOURCE_SIDE / longSide : 1;

  const crop = {
    x: croppedAreaPixels.x * preScale,
    y: croppedAreaPixels.y * preScale,
    width: croppedAreaPixels.width * preScale,
    height: croppedAreaPixels.height * preScale,
  };

  let sourceCanvas = source;
  if (preScale !== 1) {
    const resized = document.createElement("canvas");
    resized.width = Math.round(source.width * preScale);
    resized.height = Math.round(source.height * preScale);
    resized.getContext("2d").drawImage(source, 0, 0, resized.width, resized.height);
    sourceCanvas = resized;
  }

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  canvas.getContext("2d").drawImage(
    sourceCanvas,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, outputWidth, outputHeight,
  );

  return canvas.toDataURL("image/jpeg", 0.85);
}
