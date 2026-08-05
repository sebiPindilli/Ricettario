// Test isolato per lo step N.1 — chiama Gemini via lib/gemini.js, senza
// passare dal browser. Uso:
//   node --env-file=.env.local scripts/testGemini.mjs link "https://..."
//   node --env-file=.env.local scripts/testGemini.mjs text "incolla qui una ricetta in testo semplice"
import { parseRecipeFromLink } from "../lib/gemini.js";

const [mode, value] = process.argv.slice(2);

if (!mode || !value) {
  console.error('Uso: node --env-file=.env.local scripts/testGemini.mjs link "<url>"');
  console.error('  oppure: node --env-file=.env.local scripts/testGemini.mjs text "<testo ricetta>"');
  process.exit(1);
}

try {
  const result = mode === "link"
    ? await parseRecipeFromLink({ url: value })
    : await parseRecipeFromLink({ text: value });
  console.log("✅ Ricetta estratta:");
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.log("❌ Errore:", err.message);
}
