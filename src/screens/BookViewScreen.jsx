import React, { useState } from "react";
import { useTheme, UiStyleCtx } from "../context.js";
import { MACRO_SECTIONS } from "../data/constants.js";
import { resolveUiStyle } from "../data/uiStyles.js";
import RecipeFilterBarBook from "../components/RecipeFilterBarBook.jsx";

// La vista libro è un facsimile di carta, esente dal restyling (vedi
// DECISIONI.md): forziamo qui il contesto stile a "classico" così
// GlobalNav (montato da RecipeFilterBarBook) e ogni altro consumer di
// useUiStyle() in questo sottoalbero restano sempre la nav a due righe
// in alto, indipendentemente dallo stile scelto altrove nell'app.
export default function BookViewScreen({ recipes, onLanding, onRecipe, onRecipes, onMemories, onAdd, onFridge, onShopping, onExport, extraTagGroups=[], sectionList=MACRO_SECTIONS }) {
  const th = useTheme();
  const [pageIndex, setPageIndex] = useState(0);
  const [turning, setTurning] = useState(null);

  return (
    <UiStyleCtx.Provider value={resolveUiStyle(th, "classico")}>
      <RecipeFilterBarBook
        recipes={recipes}
        extraTagGroups={extraTagGroups}
        sectionList={sectionList}
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
    </UiStyleCtx.Provider>
  );
}
