import { useState } from "react";
import { MACRO_SECTIONS } from "../data/constants.js";
import RecipeFilterBarBook from "../components/RecipeFilterBarBook.jsx";

// La pagina vera e propria (RecipeCardBook/BookPageView) resta un facsimile
// di carta esente dal restyling per costruzione: usa solo i token th.book*
// del tema, non legge mai useUiStyle(). Qui NON forziamo più il contesto a
// "classico" (lo si faceva prima Fase 11): la nav segue lo stile reale come
// ovunque — vedi RecipeFilterBarBook.jsx — e così la ricerca/i filtri
// (RecipeFilterBar, non nella lista degli esenti di DECISIONI.md).
export default function BookViewScreen({ recipes, onLanding, onRecipe, onRecipes, onMemories, onAdd, onFridge, onShopping, onExport, extraTagGroups=[], sectionList=MACRO_SECTIONS, ingredientDict=null, allergenGroups=[], aggregates=[] }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [turning, setTurning] = useState(null);

  return (
    <RecipeFilterBarBook
      recipes={recipes}
      extraTagGroups={extraTagGroups}
      sectionList={sectionList}
      ingredientDict={ingredientDict}
      allergenGroups={allergenGroups}
      aggregates={aggregates}
      pageIndex={pageIndex}
      setPageIndex={setPageIndex}
      turning={turning}
      setTurning={setTurning}
      onLanding={onLanding}
      onRecipe={onRecipe}
      onRecipes={onRecipes}
      onMemories={onMemories}
      onAdd={onAdd}
      onFridge={onFridge}
      onShopping={onShopping}
      onExport={onExport}
    />
  );
}
