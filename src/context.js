import React from "react";
import { DEFAULT_PALETTE_ID } from "./data/palettes.js";
import { resolveUiStyle, buildTheme, DEFAULT_UI_STYLE_ID } from "./data/uiStyles.js";

// ── Theme context — avoids prop-drilling ──────────────────────
// Il valore reale arriva da buildTheme(paletteId, temaScuro) — preferenza
// personale per dispositivo, vedi PALETTE.md e AppInner in ricettario-v23.jsx.
// Questo default serve solo prima che il Provider monti (o in test isolati).
export const ThemeCtx = React.createContext(buildTheme(DEFAULT_PALETTE_ID, false));
export const useTheme = () => React.useContext(ThemeCtx);

// ── Nav context — azioni globali del banner (es. Organizza) ──
export const NavCtx = React.createContext({});
export const useNavActions = () => React.useContext(NavCtx);

// ── Role context — ruolo whitelist dell'utente corrente ──
export const RoleCtx = React.createContext("base");
export const useRole = () => React.useContext(RoleCtx);

// ── Beta context — interruttore globale del pulsante β (config/beta) ──
export const BetaEnabledCtx = React.createContext(true);
export const useBetaEnabled = () => React.useContext(BetaEnabledCtx);

// ── Icon style context — "emoji" o "svg" per le icone di interfaccia
// fisse (nav, barra azioni, sezioni/categorie predefinite), interruttore
// globale gestito da un admin (config/icons). Le icone scelte liberamente
// dall'utente su ricette/sezioni/categorie personalizzate non dipendono da
// questo valore — vedi AppIcon.jsx. Default "emoji": comportamento
// identico a prima finché nessun admin lo cambia esplicitamente.
export const IconStyleCtx = React.createContext("emoji");
export const useIconStyle = () => React.useContext(IconStyleCtx);

// ── UI style context — "classico" | "quaderno" | "schedario".
// Scelta PERSONALE dell'utente (localStorage, per dispositivo), diversa
// dall'interruttore admin emoji/SVG (IconStyleCtx): quello resta valido
// solo per lo stile "classico". Il valore esposto sono i token già
// risolti su tema + stile (vedi data/uiStyles.js), non il solo id.
export const UiStyleCtx = React.createContext(
  resolveUiStyle(buildTheme(DEFAULT_PALETTE_ID, false), DEFAULT_UI_STYLE_ID)
);
export const useUiStyle = () => React.useContext(UiStyleCtx);

// ── Online context — navigator.onLine, per bloccare azioni che richiedono
// rete (es. upload foto: Storage non ha una coda offline) ovunque nella UI
// senza prop-drilling ──
export const OnlineCtx = React.createContext(true);
export const useOnline = () => React.useContext(OnlineCtx);

// ── Cooking timers context — stato dei timer di cucina, vive sopra il
// punto in cui screen alterna RecipeScreen/EmptyFridgeScreen/altri (vedi
// CookingTimersProvider) così sopravvive alla navigazione: uscire dalla
// Modalità Cucina o cambiare schermata non deve fermare un timer attivo.
// Valore di default { timers:[] } solo per sicurezza in test/storybook
// isolati — in app il vero valore arriva sempre da CookingTimersProvider.
export const CookingTimersCtx = React.createContext({
  timers: [], now: Date.now(), prefs: { sound: true, vibrate: true, visual: true },
  cookingModeActive: false, setCookingModeActive: () => {},
  topStackHeight: 0, setTopStackHeight: () => {},
});
export const useCookingTimers = () => React.useContext(CookingTimersCtx);

// ── Scan extraction context — stato dell'estrazione AI (da link/testo/foto),
// stesso motivo del context dei timer: vive sopra lo switch di `screen` così
// un'estrazione avviata da AddFromLinkScreen/ScanScreen prosegue anche se
// l'utente naviga altrove prima che Gemini risponda (vedi
// ScanExtractionProvider). Un solo job alla volta a livello di app.
export const ScanExtractionCtx = React.createContext({
  job: null, startExtraction: () => {}, retryExtraction: () => {}, dismissJob: () => {},
});
export const useScanExtraction = () => React.useContext(ScanExtractionCtx);
