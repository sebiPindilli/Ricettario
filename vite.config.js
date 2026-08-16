import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Service worker che mette in cache l'app shell (HTML/JS/CSS) generata
    // dalla build, così l'app si apre anche a connessione zero mostrando i
    // dati già letti in precedenza (già in cache separatamente via
    // persistentLocalCache di Firestore, vedi src/firebase.js) invece della
    // pagina di errore nativa del browser. Nessun runtimeCaching: le
    // chiamate a Firestore/Auth/Storage restano gestite dalla cache di
    // Firestore, non da una seconda cache qui che potrebbe confliggere.
    // autoUpdate: nessun popup "nuova versione disponibile" da gestire,
    // adatto a un'app per pochi utenti fidati — chi la riapre prende da
    // solo l'ultima versione pubblicata. Attivo solo in build di
    // produzione, non in `vite dev` (vedi npm run build && vite preview).
    VitePWA({
      registerType: 'autoUpdate',
      // Il precache di default segue solo i file effettivamente referenziati
      // dalla build (bundle JS/CSS, manifest, icone del manifest) — favicon
      // e apple-touch-icon sono referenziati solo da <link> in index.html,
      // non individuati automaticamente: senza questo restano scaricabili
      // solo online (irrilevante per l'installazione, ma non per l'uso
      // offline della scheda/icona già installata).
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Ricettario',
        short_name: 'Ricettario',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        lang: 'it',
        // Stessi colori del tema "classic" (il primo di BOOK_THEMES, vedi
        // data/constants.js) — non c'è un unico "colore dell'app" dato che
        // ogni libro ha un tema scelto dall'utente, ma questi restano i
        // valori di default finché non se ne sceglie uno diverso, e sono
        // gli stessi usati per generare le icone (public/icon*.svg).
        theme_color: '#C4593A',
        background_color: '#FAF7F0',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
