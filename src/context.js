import React from "react";
import { BOOK_THEMES } from "./data/constants.js";

// ── Theme context — avoids prop-drilling ──────────────────────
export const ThemeCtx = React.createContext(BOOK_THEMES[0]);
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
export const CookingTimersCtx = React.createContext({ timers: [], now: Date.now() });
export const useCookingTimers = () => React.useContext(CookingTimersCtx);
