import { MACRO_SECTIONS, INGREDIENT_CATEGORIES } from "../data/constants.js";

// Una sezione/categoria predefinita (MACRO_SECTIONS/INGREDIENT_CATEGORIES)
// resta "fissa" — governata dall'interruttore globale admin, vedi
// AppIcon.jsx — finché emoji e icon coincidono ancora con i valori
// originali. Nel momento in cui l'utente la personalizza (cambia emoji o
// sceglie una propria icona SVG, vedi SectionPicker.jsx/
// OrganizeIngredientsScreen.jsx), smette automaticamente di esserlo: da
// lì in poi è una scelta personale come una sezione creata da zero,
// sempre visibile come tale — vedi ChosenIcon.jsx. Nessun campo nuovo sul
// dato: la "fissità" si deduce confrontando col valore di default.
export const isBuiltInIcon = (item) => {
  const def = MACRO_SECTIONS.find(s => s.id === item.id) || INGREDIENT_CATEGORIES.find(c => c.id === item.id);
  return !!def && def.icon === item.icon && def.emoji === item.emoji;
};
