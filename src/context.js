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
