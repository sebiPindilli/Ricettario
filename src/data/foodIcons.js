// Icone "di contenuto" del set SVG (public/app-icons.svg) — il sottoinsieme
// proponibile nel picker a due livelli (Emoji/SVG) per le icone scelte
// liberamente dall'utente: ricetta (EmojiColorPicker.jsx), sezione
// personalizzata (SectionPicker.jsx), categoria ingredienti personalizzata
// (OrganizeIngredientsScreen.jsx). Esclude deliberatamente le icone
// riservate all'interfaccia fissa (nav, azioni, macro sezioni/categorie
// predefinite, metadati scheda ricetta — vedi AppIcon.jsx), che non hanno
// senso come icona di una ricetta o di una sezione creata dall'utente.
export const FOOD_ICON_GROUPS = [
  { label: "Italiani", icons: ["pasta", "pizza", "focaccia", "risotto", "gnocchi", "lasagna", "olio-oliva"] },
  { label: "Carne e pesce", icons: ["carne", "pollo", "pesce", "gamberi", "uovo", "salume", "spiedino"] },
  { label: "Verdure e frutta", icons: ["pomodoro", "carota", "insalata", "funghi", "aglio", "peperoncino", "limone", "uva"] },
  { label: "Piatti", icons: ["zuppa", "panino", "bowl", "antipasto", "contorno"] },
  { label: "Dolci e forno", icons: ["torta", "biscotto", "pane", "croissant", "gelato", "crostata", "marmellata"] },
  { label: "Bevande", icons: ["caffe", "vino", "birra", "te", "succo", "acqua"] },
  { label: "Tecniche e utensili", icons: ["forno", "padella", "pentola", "vapore", "griglia", "congelatore", "bilancia", "mattarello", "frullatore", "coltello"] },
  { label: "Dal mondo", icons: ["sushi", "taco", "noodles", "curry", "kebab", "dumpling", "paella", "couscous", "hamburger", "wok"] },
  { label: "Colazione e merenda", icons: ["pancake", "toast", "yogurt", "frutta-secca", "ciambella", "waffle", "smoothie", "miele"] },
  { label: "Orto", icons: ["zucchina", "melanzana", "peperone", "patata", "cipolla", "broccolo", "mais", "piselli", "zucca", "cavolo"] },
  { label: "Frutta", icons: ["mela", "pera", "banana", "arancia", "fragola", "ciliegia", "pesca", "anguria", "ananas", "cocco"] },
  { label: "Erbe e condimenti", icons: ["basilico", "rosmarino", "alloro", "pepe", "aceto", "senape", "salsa", "zucchero"] },
  { label: "Attrezzi", icons: ["cucchiaio", "forchetta", "frusta", "colino", "tagliere", "misurino", "grattugia", "barattolo", "pinza", "mestolo"] },
  { label: "Dieta e note", icons: ["vegetariano", "vegano", "senza-glutine", "piccante", "leggero", "proteico", "bio", "stagionale", "veloce", "economico"] },
  { label: "Formaggi e latticini", icons: ["mozzarella", "parmigiano", "ricotta", "burro", "latte", "panna", "formaggio-fette", "mascarpone"] },
  { label: "Pesce e frutti di mare", icons: ["cozze", "vongole", "calamari", "polpo", "tonno", "salmone", "granchio", "ostrica"] },
  { label: "Macelleria", icons: ["bistecca", "costine", "salsiccia", "prosciutto", "bacon", "polpette", "coscia", "wurstel"] },
  { label: "Pasticceria", icons: ["tiramisu", "cannolo", "panna-cotta", "muffin", "macaron", "meringa", "budino", "cheesecake", "panettone"] },
  { label: "Dispensa", icons: ["riso", "farina", "polenta", "penne", "lenticchie", "ceci", "orzo", "semi", "lievito"] },
];

export const FOOD_ICON_NAMES = FOOD_ICON_GROUPS.flatMap(g => g.icons);
