import React, { useState } from "react";
import { useTheme } from "../context.js";
import { MACRO_SECTIONS } from "../data/constants.js";
import RecipeFilterBarBook from "../components/RecipeFilterBarBook.jsx";

export default function BookViewScreen({ recipes, onLanding, onRecipe, onRecipes, onMemories, onAdd, onFridge, onShopping, extraTagGroups=[], sectionList=MACRO_SECTIONS }) {
  const th = useTheme();
  const [pageIndex, setPageIndex] = useState(0);
  const [turning, setTurning] = useState(null);

  return (
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
    />
  );
}
