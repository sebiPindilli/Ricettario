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
      manifest: {
        name: 'Ricettario',
        short_name: 'Ricettario',
        start_url: '/',
        display: 'standalone',
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
    }),
  ],
})
