// ══════════════════════════════════════════════════════════════
// VALORI NUTRIZIONALI — dataset locale (per 100 g di parte edibile)
// kcal · carb=carboidrati · sug=zuccheri · prot=proteine
// fat=grassi · sat=saturi · fib=fibre · salt=sale (g)
//
// source: string — fonte dei valori nutrizionali di QUESTA voce, sempre
// presente (mai un dato senza fonte dichiarata). "CREA (alimentinutrizione.it)"
// per le voci italiane (Tabelle di Composizione degli Alimenti); le voci di
// altre cucine dichiarano la propria fonte reale voce per voce (es. "USDA
// FoodData Central"). Quando la fonte non riporta un valore per un nutriente
// (capita soprattutto per grassi saturi/sodio su verdure fresche), si usa 0
// come stima ragionevole, mai un numero inventato con falsa precisione.
//
// Tre campi opzionali aggiuntivi alimentano il "dizionario ingredienti"
// (categorie/equivalenze/sinonimi di base):
// - synonyms: [string,...] — altre grafie/varianti dello stesso alimento
//   (es. "carote" per "Carota"). Usati per il collegamento automatico alla
//   nutrizione (buildFoodNameIndex, in utils/helpers.js) E per riconoscere
//   un ingrediente nuovo come corrispondente a questa voce.
// - defaultCategories: [catId,...] — id di INGREDIENT_CATEGORIES copiati
//   nel libro alla prima comparsa dell'ingrediente, solo se il libro non ha
//   già una propria categorizzazione per quell'ingrediente e solo se l'id
//   esiste ancora tra le categorie del libro (vedi l'effetto dedicato in
//   ricettario-v23.jsx). Mai un riferimento vivo: una volta copiati,
//   l'utente li modifica liberamente come se li avesse scelti lui.
// - defaultEquivalences: {unità: grammi} — stessa logica di copia-alla-
//   prima-comparsa, dentro equivalences[id].factors.
// ══════════════════════════════════════════════════════════════
export const NUTRITION_DB = [
  // ── Farine, cereali e derivati ──
  { cat:"Farine, cereali e derivati", id:"farina_00", name:"Farina di frumento tipo 00", kcal:340, carb:77.3, sug:1.7, prot:11.0, fat:0.7, sat:0.1, fib:2.2, salt:0.005, synonyms:["farina","farina 00"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"farina_int", name:"Farina di frumento integrale", kcal:319, carb:67.8, sug:2.1, prot:11.9, fat:1.9, sat:0.3, fib:8.4, salt:0.008, synonyms:["farina integrale"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"farina_mandorle", name:"Farina di mandorle", kcal:603, carb:4.6, sug:3.7, prot:22.0, fat:55.3, sat:4.6, fib:12.7, salt:0.01, defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"semola", name:"Semola di grano duro", kcal:339, carb:76.9, sug:3.2, prot:11.5, fat:0.5, sat:0.1, fib:3.6, salt:0.005, defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"pasta_secca", name:"Pasta di semola", kcal:353, carb:79.1, sug:4.2, prot:10.9, fat:1.4, sat:0.2, fib:2.7, salt:0.01, synonyms:["pasta"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"pasta_uovo", name:"Pasta all'uovo secca", kcal:366, carb:72.1, sug:2.1, prot:13.0, fat:2.4, sat:0.7, fib:3.2, salt:0.03, synonyms:["pasta all'uovo"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"riso", name:"Riso brillato (Carnaroli, Arborio…)", kcal:332, carb:80.4, sug:0.2, prot:6.7, fat:0.4, sat:0.1, fib:1.0, salt:0.01, synonyms:["riso arborio","riso carnaroli","riso vialone nano"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"riso_integrale", name:"Riso integrale", kcal:337, carb:77.4, sug:0.9, prot:7.5, fat:1.9, sat:0.5, fib:1.9, salt:0.01, defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"pane", name:"Pane comune", kcal:275, carb:57.6, sug:2.0, prot:8.6, fat:0.4, sat:0.1, fib:3.1, salt:1.5, defaultCategories:["cereali"], defaultEquivalences:{fetta:30}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"pangrattato", name:"Pane grattugiato", kcal:351, carb:70.3, sug:2.5, prot:11.5, fat:2.2, sat:0.5, fib:4.0, salt:1.7, synonyms:["pan grattato"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"orzo", name:"Orzo perlato", kcal:319, carb:70.5, sug:1.2, prot:10.4, fat:1.4, sat:0.3, fib:9.2, salt:0.01, defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"farro", name:"Farro", kcal:335, carb:67.1, sug:2.7, prot:15.1, fat:2.5, sat:0.4, fib:6.8, salt:0.01, defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"avena_fiocchi", name:"Fiocchi d'avena", kcal:376, carb:66.8, sug:1.0, prot:13.0, fat:7.1, sat:1.3, fib:10.6, salt:0.005, synonyms:["avena"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"mais_polenta", name:"Farina di mais (polenta)", kcal:354, carb:80.8, sug:1.5, prot:8.7, fat:2.7, sat:0.4, fib:3.1, salt:0.005, synonyms:["farina di mais","polenta"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"couscous", name:"Cous cous secco", kcal:358, carb:77.4, sug:1.6, prot:12.8, fat:0.6, sat:0.1, fib:5.0, salt:0.02, synonyms:["couscous"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"lievito_birra", name:"Lievito di birra fresco", kcal:82, carb:1.1, sug:0, prot:12.1, fat:0.4, sat:0.1, fib:6.9, salt:0.09, synonyms:["lievito di birra"], defaultCategories:["base"], defaultEquivalences:{cubetto:25}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"lievito_chimico", name:"Lievito chimico (per dolci)", kcal:110, carb:27.0, sug:0, prot:0.5, fat:0.1, sat:0, fib:0.2, salt:26.0, synonyms:["lievito per dolci","lievito in polvere"], defaultCategories:["base"], defaultEquivalences:{bustina:16}, source:"CREA (alimentinutrizione.it)" },

  // ── Farine, cereali e derivati (lotto 2, cucina italiana — CREA/alimentinutrizione.it;
  // dove la fonte non riporta un valore assoluto per i grassi saturi ma solo
  // la % sui lipidi totali, il grammo è ricavato da quella percentuale ──
  { cat:"Farine, cereali e derivati", id:"farina_riso", name:"Farina di riso", kcal:332, carb:79.1, sug:0, prot:7.3, fat:0.5, sat:0, fib:1.0, salt:0.01, synonyms:["farina di riso"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"farina_tipo0", name:"Farina di frumento tipo 0", kcal:321, carb:69.5, sug:1.8, prot:11.5, fat:1.0, sat:0.18, fib:2.9, salt:0.005, synonyms:["farina 0","farina tipo 0","farina manitoba"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"farina_castagne", name:"Farina di castagne", kcal:318, carb:62.0, sug:16.1, prot:6.1, fat:3.7, sat:0, fib:13.8, salt:0.03, synonyms:["farina di castagne"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"farina_segale", name:"Farina di segale", kcal:342, carb:67.8, sug:0.1, prot:11.7, fat:2.0, sat:0, fib:11.3, salt:0.02, synonyms:["farina di segale"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it) — sodio stimato per analogia, non riportato dalla fonte" },
  { cat:"Farine, cereali e derivati", id:"grano_saraceno", name:"Grano saraceno", kcal:329, carb:61.2, sug:0, prot:12.4, fat:3.3, sat:0.71, fib:10.0, salt:0.003, synonyms:["grano saraceno"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"miglio", name:"Miglio", kcal:343, carb:64.9, sug:0, prot:11.8, fat:3.9, sat:0, fib:8.5, salt:0.01, defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Farine, cereali e derivati", id:"riso_venere", name:"Riso Venere, crudo", kcal:355, carb:80.4, sug:2.2, prot:7.8, fat:1.3, sat:0, fib:5.1, salt:0.005, synonyms:["riso nero","riso venere"], defaultCategories:["cereali"], source:"CREA (alimentinutrizione.it)" },

  // ── Zuccheri e dolcificanti ──
  { cat:"Zuccheri e dolcificanti", id:"zucchero", name:"Zucchero (saccarosio)", kcal:392, carb:100, sug:100, prot:0, fat:0, sat:0, fib:0, salt:0, synonyms:["zucchero semolato","zucchero bianco"], defaultCategories:["base"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Zuccheri e dolcificanti", id:"zucchero_canna", name:"Zucchero di canna grezzo", kcal:377, carb:97.0, sug:96.0, prot:0.1, fat:0, sat:0, fib:0, salt:0.03, synonyms:["zucchero di canna"], defaultCategories:["base"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Zuccheri e dolcificanti", id:"zucchero_velo", name:"Zucchero a velo", kcal:392, carb:99.8, sug:99.5, prot:0, fat:0, sat:0, fib:0, salt:0, defaultCategories:["base"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Zuccheri e dolcificanti", id:"miele", name:"Miele", kcal:304, carb:80.3, sug:80.3, prot:0.6, fat:0, sat:0, fib:0, salt:0.01, defaultCategories:["base"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Zuccheri e dolcificanti", id:"marmellata", name:"Marmellata / confettura", kcal:222, carb:58.7, sug:58.7, prot:0.5, fat:0, sat:0, fib:1.0, salt:0.03, synonyms:["confettura"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Zuccheri e dolcificanti", id:"nutella", name:"Crema spalmabile alle nocciole", kcal:539, carb:57.5, sug:56.3, prot:6.3, fat:30.9, sat:10.6, fib:3.4, salt:0.11, defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Zuccheri e dolcificanti", id:"frutta_candita", name:"Ciliege, candite", kcal:252, carb:66.4, sug:66.4, prot:0.4, fat:0, sat:0, fib:0.9, salt:0.07, synonyms:["frutta candita","ciliegie candite"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },

  // ── Latticini e uova ──
  { cat:"Latticini e uova", id:"latte_intero", name:"Latte intero", kcal:64, carb:4.9, sug:4.9, prot:3.3, fat:3.6, sat:2.1, fib:0, salt:0.13, synonyms:["latte"], defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"latte_ps", name:"Latte parzialmente scremato", kcal:46, carb:5.0, sug:5.0, prot:3.5, fat:1.5, sat:0.9, fib:0, salt:0.13, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"panna", name:"Panna fresca da montare (35%)", kcal:337, carb:3.4, sug:3.4, prot:2.3, fat:35.0, sat:22.0, fib:0, salt:0.08, synonyms:["panna da montare","panna fresca"], defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"panna_cucina", name:"Panna da cucina (20%)", kcal:207, carb:4.0, sug:4.0, prot:2.6, fat:20.0, sat:12.5, fib:0, salt:0.09, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"burro", name:"Burro", kcal:758, carb:1.1, sug:1.1, prot:0.8, fat:83.4, sat:51.4, fib:0, salt:0.02, defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"yogurt_intero", name:"Yogurt intero bianco", kcal:66, carb:4.3, sug:4.3, prot:3.8, fat:3.9, sat:2.4, fib:0, salt:0.12, synonyms:["yogurt"], defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"yogurt_greco", name:"Yogurt greco", kcal:97, carb:3.9, sug:3.9, prot:9.0, fat:5.0, sat:3.4, fib:0, salt:0.09, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"ricotta", name:"Ricotta di vacca", kcal:146, carb:3.5, sug:3.5, prot:8.8, fat:10.9, sat:7.1, fib:0, salt:0.22, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"mascarpone", name:"Mascarpone", kcal:455, carb:4.6, sug:4.6, prot:4.6, fat:47.0, sat:30.0, fib:0, salt:0.09, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"mozzarella", name:"Mozzarella di vacca", kcal:253, carb:0.7, sug:0.7, prot:18.7, fat:19.5, sat:12.5, fib:0, salt:0.5, synonyms:["fior di latte"], defaultCategories:["latticini"], defaultEquivalences:{panetto:125}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"parmigiano", name:"Parmigiano Reggiano", kcal:392, carb:0, sug:0, prot:33.0, fat:28.4, sat:18.5, fib:0, salt:1.6, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"grana", name:"Grana Padano", kcal:398, carb:0, sug:0, prot:33.0, fat:29.0, sat:19.0, fib:0, salt:1.5, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"pecorino", name:"Pecorino", kcal:392, carb:0.2, sug:0.2, prot:28.5, fat:30.6, sat:19.6, fib:0, salt:1.9, synonyms:["pecorino romano"], defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"gorgonzola", name:"Gorgonzola", kcal:324, carb:0.1, sug:0.1, prot:19.1, fat:27.1, sat:18.0, fib:0, salt:1.6, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },

  // ── Formaggi regionali (lotto 5, cucina italiana — CREA/alimentinutrizione.it;
  // grassi saturi assenti dalla fonte per taleggio/caciocavallo/scamorza/
  // stracchino/robiola/crescenza stimati come 65% dei grassi totali, lo
  // stesso rapporto osservato sui formaggi di questo database dove il dato
  // è invece dichiarato (mozzarella/parmigiano/grana/pecorino/gorgonzola,
  // ~64-66%); sodio assente per scamorza/stracchino/robiola stimato per
  // analogia con formaggi freschi simili — entrambe le stime dichiarate qui,
  // non da CREA ──
  { cat:"Latticini e uova", id:"provolone", name:"Provolone", kcal:374, carb:2.0, sug:2.0, prot:28.1, fat:28.2, sat:19.19, fib:0, salt:2.15, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"fontina", name:"Fontina", kcal:361, carb:0.8, sug:0.8, prot:24.5, fat:28.9, sat:18.62, fib:0, salt:1.72, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Latticini e uova", id:"taleggio", name:"Taleggio", kcal:315, carb:0.9, sug:0.9, prot:19.0, fat:26.2, sat:17.03, fib:0, salt:2.18, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it) — grassi saturi stimati (v. nota di sezione)" },
  { cat:"Latticini e uova", id:"caciocavallo", name:"Caciocavallo", kcal:431, carb:2.3, sug:2.3, prot:35.7, fat:31.1, sat:20.22, fib:0, salt:2.4, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it) — grassi saturi stimati (v. nota di sezione)" },
  { cat:"Latticini e uova", id:"scamorza", name:"Scamorza", kcal:334, carb:1.0, sug:1.0, prot:25.0, fat:25.6, sat:16.64, fib:0, salt:1.2, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it) — grassi saturi e sodio stimati (v. nota di sezione)" },
  { cat:"Latticini e uova", id:"stracchino", name:"Stracchino", kcal:300, carb:0, sug:0, prot:18.5, fat:25.1, sat:16.32, fib:0, salt:1.0, synonyms:["crescenza stracchino"], defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it) — grassi saturi e sodio stimati (v. nota di sezione)" },
  { cat:"Latticini e uova", id:"robiola", name:"Robiola", kcal:338, carb:2.3, sug:2.3, prot:20.0, fat:27.7, sat:18.01, fib:0, salt:0.9, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it) — grassi saturi e sodio stimati (v. nota di sezione)" },
  { cat:"Latticini e uova", id:"crescenza", name:"Crescenza", kcal:281, carb:1.9, sug:1.9, prot:16.1, fat:23.3, sat:15.15, fib:0, salt:0.88, defaultCategories:["latticini"], source:"CREA (alimentinutrizione.it) — grassi saturi stimati (v. nota di sezione)" },
  { cat:"Latticini e uova", id:"uova", name:"Uova di gallina intere", kcal:128, carb:0.5, sug:0.5, prot:12.4, fat:8.7, sat:2.7, fib:0, salt:0.35, synonyms:["uovo"], defaultCategories:["proteine"], defaultEquivalences:{uovo:50,pz:50}, source:"CREA (alimentinutrizione.it)" },

  // ── Carni e salumi ──
  { cat:"Carni e salumi", id:"pollo_petto", name:"Pollo, petto", kcal:100, carb:0, sug:0, prot:23.3, fat:0.8, sat:0.3, fib:0, salt:0.08, synonyms:["petto di pollo"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"pollo_intero", name:"Pollo intero con pelle", kcal:171, carb:0, sug:0, prot:19.1, fat:10.6, sat:3.0, fib:0, salt:0.09, synonyms:["pollo"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"tacchino", name:"Tacchino, fesa", kcal:107, carb:0, sug:0, prot:24.0, fat:1.2, sat:0.4, fib:0, salt:0.06, synonyms:["fesa di tacchino"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"manzo_magro", name:"Bovino adulto, tagli magri", kcal:129, carb:0, sug:0, prot:21.8, fat:4.6, sat:1.8, fib:0, salt:0.1, synonyms:["manzo","carne di manzo"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"macinato_misto", name:"Carne macinata mista (bovino/suino)", kcal:220, carb:0, sug:0, prot:18.5, fat:16.0, sat:6.5, fib:0, salt:0.12, synonyms:["carne macinata","carne trita"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"maiale_lonza", name:"Suino, lonza", kcal:157, carb:0, sug:0, prot:21.3, fat:8.0, sat:2.8, fib:0, salt:0.08, synonyms:["lonza di maiale","maiale"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"salsiccia", name:"Salsiccia di suino fresca", kcal:304, carb:0.6, sug:0.6, prot:15.4, fat:26.7, sat:9.5, fib:0, salt:2.2, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"prosciutto_crudo", name:"Prosciutto crudo", kcal:224, carb:0, sug:0, prot:25.5, fat:13.0, sat:4.5, fib:0, salt:5.5, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"prosciutto_cotto", name:"Prosciutto cotto", kcal:215, carb:0.9, sug:0.9, prot:19.8, fat:14.7, sat:5.0, fib:0, salt:1.8, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"speck", name:"Speck", kcal:303, carb:0.5, sug:0.5, prot:28.3, fat:20.9, sat:7.7, fib:0, salt:4.4, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"pancetta", name:"Pancetta tesa", kcal:337, carb:0.8, sug:0.8, prot:20.9, fat:28.1, sat:10.1, fib:0, salt:2.8, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"guanciale", name:"Guanciale", kcal:655, carb:0.2, sug:0.2, prot:8.6, fat:69.6, sat:24.5, fib:0, salt:2.0, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },

  // ── Carni, salumi e frattaglie (lotto 4, cucina italiana — CREA/alimentinutrizione.it;
  // grassi saturi ricavati dalla % sui lipidi totali dove la fonte non dà il grammo ──
  { cat:"Carni e salumi", id:"agnello", name:"Agnello, crudo", kcal:159, carb:0, sug:0, prot:20.0, fat:8.8, sat:4.70, fib:0, salt:0.22, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"coniglio", name:"Coniglio intero, crudo", kcal:118, carb:0, sug:0, prot:19.9, fat:4.3, sat:1.89, fib:0, salt:0.17, synonyms:["coniglio"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"anatra", name:"Anatra domestica, crudo", kcal:159, carb:0, sug:0, prot:21.4, fat:8.2, sat:0, fib:0, salt:0.28, synonyms:["anatra"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"fegato_bovino", name:"Fegato di bovino", kcal:142, carb:5.9, sug:5.9, prot:20.0, fat:4.4, sat:1.81, fib:0, salt:0.20, synonyms:["fegato","fegato di vitello","fegato di manzo"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"bresaola", name:"Bresaola della Valtellina IGP", kcal:152, carb:0.4, sug:0, prot:33.1, fat:2.0, sat:0.66, fib:0, salt:4.0, synonyms:["bresaola"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"salame", name:"Salame nostrano", kcal:370, carb:1.1, sug:1.1, prot:27.3, fat:28.5, sat:10.15, fib:0, salt:4.08, synonyms:["salame"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"mortadella", name:"Mortadella Bologna IGP", kcal:288, carb:0, sug:0, prot:15.7, fat:25.0, sat:7.88, fib:0, salt:2.4, synonyms:["mortadella"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"coppa", name:"Coppa", kcal:400, carb:0, sug:0, prot:28.9, fat:31.6, sat:11.28, fib:0, salt:4.9, synonyms:["coppa piacentina"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"cotechino", name:"Cotechino Modena IGP, cotto", kcal:253, carb:3.2, sug:0, prot:23.6, fat:16.3, sat:4.86, fib:0, salt:2.2, synonyms:["cotechino"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Carni e salumi", id:"zampone", name:"Zampone Modena IGP, cotto", kcal:262, carb:2.6, sug:0, prot:23.7, fat:17.5, sat:5.20, fib:0, salt:1.7, synonyms:["zampone"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },

  // ── Pesce ──
  { cat:"Pesce", id:"tonno_fresco", name:"Tonno fresco", kcal:159, carb:0.1, sug:0.1, prot:21.5, fat:8.1, sat:2.8, fib:0, salt:0.1, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"tonno_olio", name:"Tonno sott'olio sgocciolato", kcal:192, carb:0, sug:0, prot:25.2, fat:10.1, sat:2.4, fib:0, salt:0.9, synonyms:["tonno in scatola"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"salmone", name:"Salmone fresco", kcal:185, carb:1.0, sug:1.0, prot:18.4, fat:12.0, sat:2.9, fib:0, salt:0.1, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"merluzzo", name:"Merluzzo / nasello", kcal:71, carb:0, sug:0, prot:17.0, fat:0.3, sat:0.1, fib:0, salt:0.2, synonyms:["nasello"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"gamberi", name:"Gamberi", kcal:71, carb:0.6, sug:0, prot:13.6, fat:0.6, sat:0.2, fib:0, salt:0.6, synonyms:["gamberetti"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"acciughe", name:"Acciughe sott'olio", kcal:206, carb:0.2, sug:0.2, prot:25.9, fat:11.3, sat:2.7, fib:0, salt:9.3, synonyms:["alici"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },

  // ── Pesce e frutti di mare (lotto 3, cucina italiana — CREA/alimentinutrizione.it;
  // dove la fonte riporta i saturi solo come % dei lipidi totali il grammo è
  // ricavato da quella percentuale; due eccezioni dichiarate: sodio di
  // "polpo"/"orata" stimato per analogia (assente dalla fonte), sodio di
  // "baccalà" stimato da fonti pubbliche esterne (non da CREA) perché è un
  // prodotto sotto sale — un valore vicino a 0 sarebbe fuorviante ──
  { cat:"Pesce", id:"cozze", name:"Cozza o mitilo", kcal:84, carb:3.4, sug:0.3, prot:11.7, fat:2.7, sat:0.81, fib:0, salt:0.73, synonyms:["cozza","mitili"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"vongole", name:"Vongola", kcal:65, carb:3.9, sug:0, prot:9.8, fat:1.2, sat:0.40, fib:0, salt:1.48, synonyms:["vongola"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"seppia", name:"Seppia", kcal:72, carb:0.7, sug:0.7, prot:14.0, fat:1.5, sat:0, fib:0, salt:0.89, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"polpo", name:"Polpo", kcal:57, carb:1.4, sug:1.4, prot:10.6, fat:1.0, sat:0.42, fib:0, salt:0.35, synonyms:["polipo"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it) — sodio stimato per analogia, non riportato dalla fonte" },
  { cat:"Pesce", id:"branzino", name:"Spigola", kcal:82, carb:0.6, sug:0.6, prot:16.5, fat:1.5, sat:0.50, fib:0, salt:0.32, synonyms:["branzino","spigola"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"orata", name:"Orata, filetti", kcal:121, carb:1.0, sug:1.0, prot:20.7, fat:3.8, sat:1.11, fib:0, salt:0.30, synonyms:["orata"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it) — sodio stimato per analogia, non riportato dalla fonte" },
  { cat:"Pesce", id:"sogliola", name:"Sogliola", kcal:83, carb:0.8, sug:0.8, prot:16.9, fat:1.4, sat:0.20, fib:0, salt:0.30, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"sgombro", name:"Sgombro o maccarello", kcal:170, carb:0.5, sug:0.5, prot:17.0, fat:11.1, sat:3.16, fib:0, salt:0.33, synonyms:["maccarello"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"sardine", name:"Sardine", kcal:225, carb:1.5, sug:1.5, prot:20.3, fat:15.4, sat:5.23, fib:0, salt:0.29, synonyms:["sarde","sardina"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"baccala", name:"Baccalà, secco", kcal:131, carb:0, sug:0, prot:29.0, fat:1.7, sat:0, fib:0, salt:16.25, synonyms:["baccalà"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it) per kcal/macro; sodio stimato da fonti pubbliche esterne (prodotto sotto sale non dissalato, CREA non lo riporta)" },
  { cat:"Pesce", id:"granchio", name:"Granchio, in scatola", kcal:81, carb:0, sug:0, prot:18.1, fat:0.9, sat:0, fib:0, salt:1.38, synonyms:["granchio"], defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"aragosta", name:"Aragosta", kcal:85, carb:1.0, sug:1.0, prot:16.0, fat:1.9, sat:0.66, fib:0, salt:0.44, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Pesce", id:"trota", name:"Trota", kcal:86, carb:0, sug:0, prot:14.7, fat:3.0, sat:0.80, fib:0, salt:0.10, defaultCategories:["proteine"], source:"CREA (alimentinutrizione.it)" },

  // ── Legumi ──
  { cat:"Legumi", id:"ceci_secchi", name:"Ceci secchi", kcal:343, carb:46.9, sug:3.7, prot:20.9, fat:6.3, sat:0.7, fib:13.6, salt:0.02, synonyms:["ceci"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Legumi", id:"ceci_cotti", name:"Ceci in scatola scolati", kcal:113, carb:15.0, sug:0.9, prot:6.7, fat:2.3, sat:0.2, fib:5.7, salt:0.6, defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Legumi", id:"lenticchie_secche", name:"Lenticchie secche", kcal:325, carb:51.1, sug:1.8, prot:22.7, fat:1.0, sat:0.2, fib:13.7, salt:0.02, synonyms:["lenticchie"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Legumi", id:"fagioli_borlotti", name:"Fagioli borlotti in scatola scolati", kcal:91, carb:14.9, sug:0.6, prot:6.9, fat:0.6, sat:0.1, fib:6.5, salt:0.7, synonyms:["fagioli borlotti"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Legumi", id:"fagioli_cannellini", name:"Fagioli cannellini in scatola scolati", kcal:85, carb:13.5, sug:0.5, prot:6.6, fat:0.5, sat:0.1, fib:6.2, salt:0.7, synonyms:["fagioli cannellini"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Legumi", id:"piselli", name:"Piselli freschi/surgelati", kcal:76, carb:11.4, sug:3.3, prot:5.5, fat:0.6, sat:0.1, fib:5.2, salt:0.01, synonyms:["piselli surgelati"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },

  // ── Legumi (lotto 2, cucina italiana — CREA/alimentinutrizione.it ──
  { cat:"Legumi", id:"fave_secche", name:"Fave, secche", kcal:331, carb:52.8, sug:4.5, prot:21.3, fat:2.1, sat:0.45, fib:14.7, salt:0.02, synonyms:["fave"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it) — sodio stimato per analogia, non riportato dalla fonte" },
  { cat:"Legumi", id:"lupini", name:"Lupini, ammollati", kcal:119, carb:7.1, sug:0.5, prot:16.4, fat:2.4, sat:0, fib:2.8, salt:0.02, synonyms:["lupini in salamoia"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it) — sodio stimato per analogia, non riportato dalla fonte" },
  { cat:"Legumi", id:"piselli_secchi", name:"Piselli, secchi", kcal:317, carb:48.2, sug:2.9, prot:21.7, fat:2.0, sat:0, fib:15.7, salt:0.10, defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Legumi", id:"fagiolini", name:"Fagiolini, freschi", kcal:24, carb:2.4, sug:2.4, prot:2.1, fat:0.1, sat:0, fib:2.9, salt:0.005, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Legumi", id:"fagioli_borlotti_secchi", name:"Fagioli, Borlotti, secchi", kcal:312, carb:47.7, sug:3.5, prot:20.2, fat:2.0, sat:0, fib:17.3, salt:0.01, synonyms:["fagioli borlotti secchi"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Legumi", id:"fagioli_cannellini_secchi", name:"Fagioli, Cannellini, secchi", kcal:314, carb:45.5, sug:2.9, prot:23.4, fat:1.6, sat:0, fib:17.6, salt:0.01, synonyms:["fagioli cannellini secchi"], defaultCategories:["legumi"], source:"CREA (alimentinutrizione.it)" },

  // ── Verdure e ortaggi ──
  { cat:"Verdure e ortaggi", id:"pomodori", name:"Pomodori da insalata", kcal:19, carb:2.8, sug:2.8, prot:1.0, fat:0.2, sat:0, fib:1.1, salt:0.01, synonyms:["pomodoro","pomodori","pomodorini","pomodoro san marzano"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"pomodori_pelati", name:"Pomodori pelati in scatola", kcal:23, carb:3.5, sug:3.5, prot:1.2, fat:0.5, sat:0.1, fib:0.9, salt:0.1, synonyms:["pelati"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"passata", name:"Passata di pomodoro", kcal:30, carb:5.5, sug:5.0, prot:1.4, fat:0.2, sat:0, fib:1.2, salt:0.1, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"cipolla", name:"Cipolla", kcal:28, carb:5.7, sug:5.7, prot:1.0, fat:0.1, sat:0, fib:1.0, salt:0.01, synonyms:["cipolle"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"aglio", name:"Aglio", kcal:44, carb:8.4, sug:2.4, prot:0.9, fat:0.6, sat:0.1, fib:3.1, salt:0.01, defaultCategories:["ortofrutta"], defaultEquivalences:{spicchio:5}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"carote", name:"Carote", kcal:39, carb:7.6, sug:7.6, prot:1.1, fat:0.2, sat:0, fib:3.1, salt:0.1, synonyms:["carota"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:70}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"sedano", name:"Sedano", kcal:23, carb:2.4, sug:2.2, prot:2.3, fat:0.2, sat:0, fib:1.6, salt:0.14, synonyms:["gambo di sedano"], defaultCategories:["ortofrutta"], defaultEquivalences:{costa:40}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"zucchine", name:"Zucchine", kcal:14, carb:1.4, sug:1.3, prot:1.3, fat:0.1, sat:0, fib:1.2, salt:0.01, synonyms:["zucchina"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:200}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"melanzane", name:"Melanzane", kcal:21, carb:2.6, sug:2.6, prot:1.1, fat:0.4, sat:0.1, fib:2.6, salt:0.01, synonyms:["melanzana"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:250}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"peperoni", name:"Peperoni", kcal:24, carb:4.2, sug:4.2, prot:0.9, fat:0.3, sat:0.1, fib:1.9, salt:0.01, synonyms:["peperone"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"patate", name:"Patate", kcal:81, carb:17.9, sug:0.4, prot:2.1, fat:1.0, sat:0.1, fib:1.6, salt:0.01, synonyms:["patata"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"spinaci", name:"Spinaci", kcal:35, carb:2.9, sug:0.4, prot:3.4, fat:0.7, sat:0.1, fib:1.9, salt:0.18, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"broccoli", name:"Broccoli", kcal:30, carb:3.1, sug:3.1, prot:3.0, fat:0.4, sat:0.1, fib:3.1, salt:0.02, synonyms:["broccolo"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"funghi", name:"Funghi champignon", kcal:22, carb:0.9, sug:0.9, prot:3.9, fat:0.3, sat:0, fib:2.3, salt:0.01, synonyms:["champignon"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"zucca", name:"Zucca", kcal:19, carb:3.5, sug:2.6, prot:1.1, fat:0.1, sat:0, fib:1.3, salt:0.01, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"lattuga", name:"Lattuga", kcal:21, carb:2.2, sug:2.2, prot:1.8, fat:0.4, sat:0.1, fib:1.5, salt:0.02, synonyms:["insalata"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"rucola", name:"Rucola", kcal:30, carb:3.9, sug:2.0, prot:2.6, fat:0.3, sat:0.1, fib:1.6, salt:0.07, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"basilico", name:"Basilico fresco", kcal:32, carb:5.1, sug:0.3, prot:3.1, fat:0.6, sat:0, fib:1.6, salt:0.01, synonyms:["basilico"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"prezzemolo", name:"Prezzemolo fresco", kcal:30, carb:1.7, sug:1.7, prot:3.7, fat:0.6, sat:0.1, fib:5.0, salt:0.05, synonyms:["prezzemolo"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },

  // ── Verdure e ortaggi (lotto 1b, cucina italiana — CREA/alimentinutrizione.it,
  // dati "Sodio" convertiti in sale con salt(g) = sodio(mg) × 2.5 / 1000;
  // dove la fonte non riporta grassi saturi/sodio per l'ortaggio si usa 0,
  // nessuna stima inventata — unica eccezione dichiarata: "verza" (sodio
  // assente nella fonte, valore qui stimato per analogia con cavolo cappuccio) ──
  { cat:"Verdure e ortaggi", id:"finocchio", name:"Finocchi, crudi", kcal:15, carb:1.5, sug:1.5, prot:1.2, fat:0, sat:0, fib:2.2, salt:0.01, synonyms:["finocchi"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"cavolfiore", name:"Cavolfiore, crudo", kcal:30, carb:2.7, sug:2.4, prot:3.2, fat:0.2, sat:0, fib:2.4, salt:0.02, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"cetrioli", name:"Cetrioli, freschi", kcal:16, carb:1.8, sug:1.8, prot:0.7, fat:0.5, sat:0, fib:0.8, salt:0.03, synonyms:["cetriolo"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"radicchio", name:"Radicchio, rosso, fresco", kcal:19, carb:1.6, sug:1.6, prot:1.4, fat:0.1, sat:0, fib:3.0, salt:0.03, synonyms:["radicchio rosso"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"indivia", name:"Indivia, fresca", kcal:20, carb:2.7, sug:2.7, prot:0.9, fat:0.3, sat:0, fib:1.6, salt:0.03, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"bietola", name:"Bieta, cruda", kcal:15, carb:1.8, sug:1.8, prot:1.3, fat:0.1, sat:0, fib:1.2, salt:0.03, synonyms:["bieta","biete"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"porro", name:"Porri, crudi", kcal:35, carb:5.2, sug:5.2, prot:2.1, fat:0.1, sat:0, fib:2.9, salt:0.005, synonyms:["porri"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"asparagi", name:"Asparagi di campo, crudi", kcal:33, carb:3.3, sug:3.3, prot:3.6, fat:0.2, sat:0, fib:2.0, salt:0.003, synonyms:["asparago"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"carciofi", name:"Carciofi, crudi", kcal:33, carb:2.5, sug:1.9, prot:2.7, fat:0.2, sat:0, fib:5.5, salt:0.33, synonyms:["carciofo"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:120}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"verza", name:"Cavolo verza, cruda", kcal:29, carb:3.8, sug:3.8, prot:2.0, fat:0.1, sat:0, fib:2.9, salt:0.05, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it) — sodio stimato per analogia, non riportato dalla fonte" },
  { cat:"Verdure e ortaggi", id:"cavolo_cappuccio", name:"Cavolo cappuccio, verde, crudo", kcal:24, carb:2.5, sug:2.5, prot:2.1, fat:0.1, sat:0, fib:2.6, salt:0.06, synonyms:["cavolo","cavolo cappuccio"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },

  // ── Verdure e ortaggi (lotto 6, cucina italiana — CREA/alimentinutrizione.it
  // salvo le due eccezioni dichiarate: "cavolo nero" (CREA non lo censisce
  // come voce a sé; usati i valori USDA per kale, la stessa cultivar) e
  // "scalogno" (idem, valori USDA — vedi anche nota lotto 2) ──
  { cat:"Verdure e ortaggi", id:"cime_di_rapa", name:"Cavolo broccolo verde ramoso, crudo", kcal:30, carb:2.0, sug:2.0, prot:3.4, fat:0.3, sat:0, fib:3.0, salt:0.02, synonyms:["cime di rapa","broccoletti"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"ravanelli", name:"Ravanelli, freschi", kcal:13, carb:1.8, sug:1.8, prot:0.8, fat:0.1, sat:0, fib:1.3, salt:0.15, synonyms:["ravanello"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"topinambur", name:"Topinambur, cotto, bollito", kcal:52, carb:10.6, sug:0, prot:1.6, fat:0.1, sat:0, fib:2.7, salt:0.01, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it) — sodio stimato per analogia, non riportato dalla fonte" },
  { cat:"Verdure e ortaggi", id:"barbabietole", name:"Barbabietole rosse, crude", kcal:25, carb:4.0, sug:4.0, prot:1.1, fat:0, sat:0, fib:2.6, salt:0.21, synonyms:["barbabietola"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"cardi", name:"Cardi, crudi", kcal:13, carb:1.7, sug:1.5, prot:0.6, fat:0.1, sat:0, fib:1.5, salt:0.06, synonyms:["cardo"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"cavolo_nero", name:"Cavolo nero", kcal:35, carb:4.4, sug:1.3, prot:2.9, fat:1.5, sat:0.15, fib:4.1, salt:0.06, synonyms:["cavolo toscano","kale"], defaultCategories:["ortofrutta"], source:"USDA FoodData Central — zuccheri e grassi saturi stimati per analogia (non nella fonte)" },
  { cat:"Verdure e ortaggi", id:"scalogno", name:"Scalogno", kcal:72, carb:16.8, sug:7.9, prot:2.5, fat:0.1, sat:0.01, fib:3.2, salt:0.03, defaultCategories:["ortofrutta"], source:"USDA FoodData Central — zuccheri, grassi saturi, fibre e sodio stimati per analogia (fonte parziale)" },
  { cat:"Verdure e ortaggi", id:"salvia", name:"Salvia, fresco", kcal:132, carb:15.6, sug:15.6, prot:3.9, fat:4.6, sat:0, fib:8.2, salt:0.01, synonyms:["salvia"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Verdure e ortaggi", id:"peperoncino", name:"Peperoncini piccanti, freschi", kcal:30, carb:3.8, sug:1.5, prot:1.8, fat:0.5, sat:0, fib:2.0, salt:0.02, synonyms:["peperoncino","peperoncino fresco","peperoncino piccante"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },

  // ── Frutta ──
  { cat:"Frutta", id:"mele", name:"Mele", kcal:57, carb:13.7, sug:13.7, prot:0.3, fat:0.1, sat:0, fib:1.7, salt:0.005, synonyms:["mela"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"pere", name:"Pere", kcal:41, carb:9.5, sug:9.5, prot:0.3, fat:0.1, sat:0, fib:3.8, salt:0.005, synonyms:["pera"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"banane", name:"Banane", kcal:69, carb:15.4, sug:12.8, prot:1.2, fat:0.3, sat:0.1, fib:1.8, salt:0.005, synonyms:["banana"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:120}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"limoni", name:"Limoni (succo e polpa)", kcal:16, carb:2.3, sug:2.3, prot:0.6, fat:0.2, sat:0, fib:1.9, salt:0.005, synonyms:["limone"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:100}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"arance", name:"Arance", kcal:39, carb:8.1, sug:8.1, prot:0.7, fat:0.2, sat:0, fib:1.6, salt:0.005, synonyms:["arancia"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"fragole", name:"Fragole", kcal:30, carb:5.3, sug:5.3, prot:0.9, fat:0.4, sat:0, fib:1.6, salt:0.005, synonyms:["fragola"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"pesche", name:"Pesche", kcal:28, carb:6.1, sug:6.1, prot:0.7, fat:0.1, sat:0, fib:2.1, salt:0.005, synonyms:["pesca"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"uva", name:"Uva", kcal:64, carb:15.6, sug:15.6, prot:0.5, fat:0.1, sat:0, fib:1.5, salt:0.005, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },

  // ── Frutta (lotto 7, cucina italiana — CREA/alimentinutrizione.it ──
  { cat:"Frutta", id:"kiwi", name:"Kiwi, freschi", kcal:48, carb:9.0, sug:9.0, prot:1.2, fat:0.6, sat:0, fib:2.2, salt:0.01, defaultCategories:["ortofrutta"], defaultEquivalences:{pz:80}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"anguria", name:"Cocomero, fresco", kcal:16, carb:3.7, sug:3.7, prot:0.4, fat:0, sat:0, fib:0.2, salt:0.01, synonyms:["anguria","cocomero"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"melone", name:"Melone, d'estate, fresco", kcal:34, carb:7.4, sug:7.4, prot:0.8, fat:0.2, sat:0, fib:0.7, salt:0.02, synonyms:["melone"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"fichi", name:"Fichi, freschi", kcal:63, carb:14.2, sug:14.2, prot:0.9, fat:0.2, sat:0, fib:2.0, salt:0.01, synonyms:["fico"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:50}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"castagne", name:"Castagne", kcal:174, carb:36.7, sug:8.9, prot:2.9, fat:1.7, sat:0, fib:4.7, salt:0.02, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"mandarini", name:"Mandarini, freschi", kcal:76, carb:17.6, sug:17.6, prot:0.9, fat:0.3, sat:0, fib:1.7, salt:0.003, synonyms:["mandarino","clementine"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:80}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"mirtilli", name:"Mirtilli, freschi", kcal:49, carb:10.1, sug:10.1, prot:0.9, fat:0.2, sat:0, fib:3.1, salt:0.005, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"pompelmo", name:"Pompelmo, fresco", kcal:29, carb:6.2, sug:6.2, prot:0.6, fat:0, sat:0, fib:1.6, salt:0.003, defaultCategories:["ortofrutta"], defaultEquivalences:{pz:200}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"lamponi", name:"Lamponi, freschi", kcal:49, carb:6.5, sug:6.5, prot:1.0, fat:0.6, sat:0, fib:7.4, salt:0.01, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"prugne", name:"Prugne, fresche", kcal:45, carb:10.5, sug:10.5, prot:0.5, fat:0.1, sat:0, fib:1.5, salt:0.005, synonyms:["prugna","susine"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:60}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"albicocche", name:"Albicocche, fresche", kcal:42, carb:9.8, sug:9.8, prot:0.4, fat:0.1, sat:0, fib:1.5, salt:0.003, synonyms:["albicocca"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:40}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"kaki", name:"Loti o kaki, freschi", kcal:70, carb:16.0, sug:16.0, prot:0.6, fat:0.3, sat:0, fib:2.5, salt:0.01, synonyms:["cachi"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"more", name:"Mora di rovo", kcal:42, carb:8.1, sug:8.1, prot:1.3, fat:0, sat:0, fib:3.2, salt:0.005, synonyms:["mora"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },

  // ── Frutta secca e semi ──
  { cat:"Frutta secca e semi", id:"mandorle", name:"Mandorle sgusciate", kcal:628, carb:4.6, sug:3.7, prot:22.0, fat:55.3, sat:4.6, fib:12.7, salt:0.01, synonyms:["mandorle"], defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta secca e semi", id:"noci", name:"Noci sgusciate", kcal:689, carb:5.1, sug:3.1, prot:14.3, fat:68.1, sat:6.1, fib:6.2, salt:0.005, synonyms:["noci"], defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta secca e semi", id:"nocciole", name:"Nocciole sgusciate", kcal:655, carb:6.1, sug:4.1, prot:13.8, fat:64.1, sat:4.5, fib:8.1, salt:0.01, defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta secca e semi", id:"pinoli", name:"Pinoli", kcal:595, carb:4.0, sug:3.9, prot:31.9, fat:50.3, sat:4.3, fib:4.5, salt:0.01, defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta secca e semi", id:"pistacchi", name:"Pistacchi", kcal:608, carb:8.1, sug:7.6, prot:18.1, fat:56.1, sat:6.9, fib:10.6, salt:0.01, defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta secca e semi", id:"uvetta", name:"Uva passa / uvetta", kcal:283, carb:72.0, sug:72.0, prot:1.9, fat:0.6, sat:0.2, fib:3.1, salt:0.05, synonyms:["uva passa"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },

  // ── Grassi e condimenti ──
  { cat:"Grassi e condimenti", id:"olio_evo", name:"Olio extravergine di oliva", kcal:899, carb:0, sug:0, prot:0, fat:99.9, sat:14.5, fib:0, salt:0, synonyms:["olio d'oliva","olio evo","olio extravergine"], defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"olio_semi", name:"Olio di semi (girasole)", kcal:899, carb:0, sug:0, prot:0, fat:99.9, sat:11.2, fib:0, salt:0, synonyms:["olio di semi"], defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"aceto", name:"Aceto di vino", kcal:19, carb:0.6, sug:0.5, prot:0.4, fat:0, sat:0, fib:0, salt:0.02, synonyms:["aceto"], defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"aceto_balsamico", name:"Aceto balsamico", kcal:88, carb:17.0, sug:15.0, prot:0.5, fat:0, sat:0, fib:0, salt:0.06, defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"maionese", name:"Maionese", kcal:655, carb:2.1, sug:1.4, prot:1.2, fat:70.0, sat:10.5, fib:0, salt:1.5, defaultCategories:["grassi"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"sale", name:"Sale da cucina", kcal:0, carb:0, sug:0, prot:0, fat:0, sat:0, fib:0, salt:100, synonyms:["sale fino","sale grosso"], defaultCategories:["base"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"pepe", name:"Pepe nero", kcal:255, carb:38.3, sug:0.6, prot:10.9, fat:3.3, sat:1.4, fib:26.5, salt:0.05, synonyms:["pepe"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"concentrato_pomodoro", name:"Concentrato di pomodoro", kcal:88, carb:17.8, sug:13.7, prot:4.9, fat:0.4, sat:0.1, fib:3.0, salt:0.5, synonyms:["doppio concentrato","triplo concentrato"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"brodo_carne", name:"Brodo di carne (pronto)", kcal:9, carb:0.4, sug:0.2, prot:1.1, fat:0.4, sat:0.2, fib:0, salt:0.9, defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"brodo_vegetale", name:"Brodo vegetale (pronto)", kcal:6, carb:0.6, sug:0.3, prot:0.4, fat:0.2, sat:0.1, fib:0, salt:0.9, synonyms:["brodo"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Grassi e condimenti", id:"dado", name:"Dado da brodo", kcal:245, carb:15.0, sug:8.0, prot:12.0, fat:15.5, sat:8.5, fib:0.5, salt:47.0, synonyms:["dado vegetale","dado di carne"], defaultCategories:["base"], source:"CREA (alimentinutrizione.it)" },

  // ── Cioccolato, cacao e dolci ──
  { cat:"Cioccolato, cacao e dolci", id:"cioccolato_fondente", name:"Cioccolato fondente (70%)", kcal:531, carb:33.0, sug:28.0, prot:7.9, fat:38.0, sat:23.0, fib:10.0, salt:0.02, synonyms:["cioccolato fondente"], defaultCategories:["cacao"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Cioccolato, cacao e dolci", id:"cioccolato_latte", name:"Cioccolato al latte", kcal:552, carb:56.7, sug:54.0, prot:7.0, fat:33.6, sat:20.5, fib:2.1, salt:0.2, defaultCategories:["cacao"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Cioccolato, cacao e dolci", id:"cacao_amaro", name:"Cacao amaro in polvere", kcal:355, carb:11.5, sug:0.5, prot:20.4, fat:25.6, sat:15.3, fib:29.8, salt:0.05, synonyms:["cacao in polvere","cacao"], defaultCategories:["cacao"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Cioccolato, cacao e dolci", id:"biscotti_secchi", name:"Biscotti secchi", kcal:429, carb:80.4, sug:21.9, prot:7.6, fat:8.1, sat:2.7, fib:2.6, salt:0.5, synonyms:["biscotti"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Cioccolato, cacao e dolci", id:"savoiardi", name:"Savoiardi", kcal:392, carb:75.5, sug:41.0, prot:9.5, fat:5.9, sat:1.9, fib:1.8, salt:0.25, defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Cioccolato, cacao e dolci", id:"cioccolato_bianco", name:"Cioccolato bianco", kcal:539, carb:57.5, sug:55.0, prot:5.0, fat:35.0, sat:19.0, fib:0, salt:0.50, defaultCategories:["cacao"], source:"USDA FoodData Central — zuccheri stimati per analogia con il cioccolato al latte (fonte non scomponeva i carboidrati)" },
  { cat:"Cioccolato, cacao e dolci", id:"marzapane", name:"Marzapane", kcal:429, carb:57.0, sug:50.0, prot:4.2, fat:17.0, sat:3.9, fib:3.0, salt:0.02, defaultCategories:["altro"], source:"USDA FoodData Central — valori con variabilità significativa tra fonti; zuccheri, fibre e sodio stimati per analogia" },

  // ── Bevande e alcolici (per cucina) ──
  { cat:"Bevande e alcolici (per cucina)", id:"vino_bianco", name:"Vino bianco da tavola", kcal:70, carb:0.1, sug:0.1, prot:0.1, fat:0, sat:0, fib:0, salt:0.01, synonyms:["vino bianco"], defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"vino_rosso", name:"Vino rosso da tavola", kcal:75, carb:0.2, sug:0.2, prot:0.1, fat:0, sat:0, fib:0, salt:0.01, synonyms:["vino rosso"], defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"birra", name:"Birra chiara", kcal:34, carb:3.5, sug:3.5, prot:0.2, fat:0, sat:0, fib:0, salt:0.005, synonyms:["birra"], defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"caffe", name:"Caffè espresso", kcal:2, carb:0.3, sug:0, prot:0.1, fat:0, sat:0, fib:0, salt:0.005, synonyms:["caffè"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"marsala", name:"Marsala all'uovo", kcal:150, carb:12.4, sug:12.4, prot:0, fat:0, sat:0, fib:0, salt:0, synonyms:["marsala"], defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"grappa", name:"Grappa", kcal:242, carb:0, sug:0, prot:0, fat:0, sat:0, fib:0, salt:0, defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"spumante", name:"Bevanda alcolica, Spumante", kcal:87, carb:0.6, sug:0.6, prot:0, fat:0, sat:0, fib:0, salt:0.01, synonyms:["spumante","prosecco"], defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"vin_santo", name:"Vin Santo", kcal:136, carb:12.0, sug:12.0, prot:0, fat:0, sat:0, fib:0, salt:0.01, defaultCategories:["alcolici"], source:"Stima da titolo alcolometrico (~16% vol) e residuo zuccherino tipici dichiarati per la denominazione — non una misurazione diretta CREA/USDA" },
  { cat:"Bevande e alcolici (per cucina)", id:"limoncello", name:"Limoncello", kcal:286, carb:30.0, sug:30.0, prot:0, fat:0, sat:0, fib:0, salt:0.01, defaultCategories:["alcolici"], source:"Stima da titolo alcolometrico (~30% vol) e residuo zuccherino tipici dichiarati per il prodotto — non una misurazione diretta CREA/USDA" },

  // ── Varie ──
  { cat:"Varie", id:"vaniglia", name:"Vaniglia (bacca/estratto)", kcal:288, carb:12.7, sug:12.7, prot:0.1, fat:0.1, sat:0, fib:0, salt:0.02, synonyms:["bacca di vaniglia","estratto di vaniglia"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"cannella", name:"Cannella in polvere", kcal:247, carb:27.5, sug:2.2, prot:4.0, fat:1.2, sat:0.3, fib:53.1, salt:0.03, synonyms:["cannella"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"rosmarino", name:"Rosmarino fresco", kcal:131, carb:13.5, sug:0, prot:3.3, fat:5.9, sat:2.8, fib:14.1, salt:0.07, synonyms:["rosmarino"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"timo", name:"Timo fresco", kcal:101, carb:10.5, sug:0, prot:5.6, fat:1.7, sat:0.5, fib:14.0, salt:0.02, synonyms:["timo"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"menta", name:"Menta fresca", kcal:70, carb:5.3, sug:0, prot:3.8, fat:0.9, sat:0.2, fib:8.0, salt:0.08, synonyms:["menta"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"olive", name:"Olive da tavola", kcal:145, carb:1.0, sug:0.5, prot:0.8, fat:15.0, sat:2.3, fib:4.4, salt:3.5, synonyms:["olive nere","olive verdi"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"capperi", name:"Capperi sotto sale (dissalati)", kcal:23, carb:2.4, sug:0.4, prot:2.4, fat:0.9, sat:0.2, fib:3.2, salt:2.5, synonyms:["capperi"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"zafferano", name:"Zafferano", kcal:310, carb:61.5, sug:0, prot:11.4, fat:5.9, sat:1.6, fib:3.9, salt:0.4, defaultCategories:["spezie"], defaultEquivalences:{bustina:0.1}, source:"CREA (alimentinutrizione.it)" },

  // ── Spezie ed erbe aromatiche (lotto 8, cucina italiana — CREA non le censisce
  // come voci a sé, usati valori USDA FoodData Central; zuccheri stimati 0
  // (erbe/spezie essiccate, trascurabili) e grassi saturi come quota tipica
  // dei grassi totali per questo genere di spezie dove la fonte non la
  // riporta separatamente — entrambe le stime dichiarate, non dati USDA diretti ──
  { cat:"Varie", id:"origano", name:"Origano essiccato", kcal:265, carb:68.92, sug:0, prot:9.0, fat:4.28, sat:1.0, fib:42.0, salt:0.06, synonyms:["origano"], defaultCategories:["spezie"], source:"USDA FoodData Central — zuccheri e grassi saturi stimati (v. nota di sezione)" },
  { cat:"Varie", id:"maggiorana", name:"Maggiorana essiccata", kcal:271, carb:60.60, sug:0, prot:12.70, fat:7.04, sat:1.7, fib:35.0, salt:0.19, synonyms:["maggiorana"], defaultCategories:["spezie"], source:"USDA FoodData Central — zuccheri, grassi saturi e fibre stimati (v. nota di sezione)" },
  { cat:"Varie", id:"alloro", name:"Alloro, foglie essiccate", kcal:313, carb:74.97, sug:0, prot:7.61, fat:8.36, sat:2.0, fib:26.0, salt:0.06, synonyms:["alloro","foglie di alloro"], defaultCategories:["spezie"], source:"USDA FoodData Central — zuccheri e grassi saturi stimati (v. nota di sezione)" },
  { cat:"Varie", id:"noce_moscata", name:"Noce moscata macinata", kcal:525, carb:49.29, sug:0, prot:5.84, fat:36.31, sat:25.9, fib:20.8, salt:0.02, synonyms:["noce moscata"], defaultCategories:["spezie"], source:"USDA FoodData Central — zuccheri e sodio stimati (v. nota di sezione)" },
  { cat:"Varie", id:"chiodi_di_garofano", name:"Chiodi di garofano macinati", kcal:274, carb:65.53, sug:0, prot:5.97, fat:13.0, sat:3.9, fib:33.9, salt:0.69, synonyms:["chiodi di garofano"], defaultCategories:["spezie"], source:"USDA FoodData Central — zuccheri e grassi saturi stimati (v. nota di sezione)" },
  { cat:"Varie", id:"erba_cipollina", name:"Erba cipollina fresca", kcal:30, carb:4.35, sug:2.0, prot:3.27, fat:0.73, sat:0.1, fib:4.7, salt:0.01, synonyms:["erba cipollina"], defaultCategories:["spezie"], source:"USDA FoodData Central — zuccheri e grassi saturi stimati (v. nota di sezione)" },

  // ══════════════════════════════════════════════════════════════
  // FASE B — CUCINE INTERNAZIONALI. Da qui in poi le voci sono raggruppate
  // per lotto/cucina di introduzione (non più per categoria alimentare come
  // sopra, dove tutto era CREA): più facile capire da dove viene ogni voce.
  // Fonte primaria: USDA FoodData Central (nessun database italiano
  // equivalente a CREA per questi ingredienti).
  // ══════════════════════════════════════════════════════════════

  // ── Cucina americana/inglese, lotto 10: dispensa e basi — USDA FoodData
  // Central; zuccheri di mirtilli rossi/noci pecan stimati per analogia
  // (fonte non li scomponeva dai carboidrati totali); sodio di sciroppo
  // d'acero/noci pecan assente dalla fonte, stimato quasi nullo per
  // analogia con prodotti simili ──
  { cat:"Cucina americana", id:"burro_arachidi", name:"Burro di arachidi", kcal:598, carb:24.0, sug:6.5, prot:21.9, fat:49.5, sat:9.52, fib:5.7, salt:1.19, synonyms:["burro di arachidi","peanut butter"], defaultCategories:["grassi"], source:"USDA FoodData Central" },
  { cat:"Cucina americana", id:"sciroppo_acero", name:"Sciroppo d'acero", kcal:260, carb:67.04, sug:67.04, prot:0.04, fat:0.06, sat:0, fib:0, salt:0.01, synonyms:["sciroppo d'acero","maple syrup"], defaultCategories:["base"], source:"USDA FoodData Central — sodio stimato per analogia, non riportato dalla fonte" },
  { cat:"Cucina americana", id:"bicarbonato", name:"Bicarbonato di sodio", kcal:0, carb:0, sug:0, prot:0, fat:0, sat:0, fib:0, salt:68.5, synonyms:["bicarbonato"], defaultCategories:["base"], source:"Calcolo chimico dalla composizione NaHCO3 (27,4% sodio in peso) — non una misurazione di tabella nutrizionale" },
  { cat:"Cucina americana", id:"latticello", name:"Latticello (buttermilk)", kcal:62, carb:4.9, sug:4.9, prot:3.2, fat:3.3, sat:1.9, fib:0, salt:0.26, synonyms:["buttermilk","latticello"], defaultCategories:["latticini"], source:"USDA FoodData Central" },
  { cat:"Cucina americana", id:"melassa", name:"Melassa", kcal:290, carb:74.7, sug:74.7, prot:0, fat:0.1, sat:0, fib:0, salt:0.09, synonyms:["molasses"], defaultCategories:["base"], source:"USDA FoodData Central" },
  { cat:"Cucina americana", id:"sciroppo_mais", name:"Sciroppo di mais", kcal:324, carb:81.0, sug:81.0, prot:0, fat:0, sat:0, fib:0, salt:0, synonyms:["corn syrup"], defaultCategories:["base"], source:"USDA FoodData Central" },
  { cat:"Cucina americana", id:"mirtilli_rossi", name:"Mirtilli rossi (cranberries)", kcal:46, carb:11.97, sug:4.0, prot:0.46, fat:0.13, sat:0, fib:3.6, salt:0.005, synonyms:["cranberries","mirtilli rossi"], defaultCategories:["ortofrutta"], source:"USDA FoodData Central — zuccheri stimati per analogia (fonte non li scomponeva dai carboidrati totali)" },
  { cat:"Cucina americana", id:"noci_pecan", name:"Noci pecan", kcal:691, carb:13.86, sug:4.0, prot:9.17, fat:71.9, sat:6.18, fib:9.6, salt:0, synonyms:["pecan","noci pecan"], defaultCategories:["grassi"], source:"USDA FoodData Central — zuccheri stimati per analogia (fonte non li scomponeva dai carboidrati totali)" },
  { cat:"Cucina americana", id:"ketchup", name:"Ketchup", kcal:101, carb:27.0, sug:21.0, prot:1.0, fat:0.1, sat:0, fib:0.3, salt:2.27, defaultCategories:["altro"], source:"USDA FoodData Central" },
  { cat:"Cucina americana", id:"worcestershire", name:"Salsa Worcestershire", kcal:49, carb:11.0, sug:4.5, prot:0.9, fat:0.1, sat:0, fib:0, salt:3.26, synonyms:["worcestershire sauce","salsa worcester"], defaultCategories:["altro"], source:"USDA FoodData Central — valori con variabilità significativa tra fonti/prodotti" },

  // ── Cucina americana/inglese, lotto 11: formaggi, carni e altro — USDA
  // FoodData Central; zuccheri/grassi saturi/sodio stimati dove la fonte
  // non li scomponeva, dichiarato voce per voce ──
  { cat:"Cucina americana", id:"cheddar", name:"Formaggio cheddar", kcal:404, carb:3.09, sug:0, prot:22.87, fat:33.31, sat:21.0, fib:0, salt:1.70, synonyms:["cheddar"], defaultCategories:["latticini"], source:"USDA FoodData Central" },
  { cat:"Cucina americana", id:"bacon", name:"Bacon, cotto", kcal:541, carb:0.5, sug:0, prot:37.0, fat:42.0, sat:15.0, fib:0, salt:3.75, synonyms:["bacon"], defaultCategories:["proteine"], source:"USDA FoodData Central — grassi saturi e sodio stimati per analogia (fonte non li riportava con precisione)" },
  { cat:"Cucina americana", id:"cream_cheese", name:"Formaggio cremoso spalmabile (cream cheese)", kcal:350, carb:5.52, sug:4.0, prot:6.15, fat:34.0, sat:20.0, fib:0, salt:1.68, synonyms:["cream cheese","philadelphia"], defaultCategories:["latticini"], source:"USDA FoodData Central — zuccheri stimati per analogia (fonte non li scomponeva dai carboidrati totali)" },
  { cat:"Cucina americana", id:"marshmallow", name:"Marshmallow", kcal:318, carb:81.3, sug:57.56, prot:1.8, fat:0.2, sat:0, fib:0.1, salt:0.20, defaultCategories:["altro"], source:"USDA FoodData Central" },
  { cat:"Cucina americana", id:"graham_cracker", name:"Graham cracker", kcal:430, carb:78.0, sug:30.0, prot:6.69, fat:10.5, sat:2.5, fib:3.4, salt:1.57, synonyms:["graham cracker"], defaultCategories:["altro"], source:"USDA FoodData Central — zuccheri e grassi saturi stimati per analogia (fonte non li scomponeva)" },
  { cat:"Cucina americana", id:"popcorn", name:"Popcorn, al naturale", kcal:387, carb:63.28, sug:0.87, prot:12.9, fat:4.5, sat:0.6, fib:14.5, salt:0.02, synonyms:["popcorn"], defaultCategories:["cereali"], source:"USDA FoodData Central — grassi saturi stimati per analogia (fonte non li scomponeva)" },
  { cat:"Cucina americana", id:"panna_half", name:"Panna leggera (half and half)", kcal:123, carb:4.73, sug:4.5, prot:3.13, fat:10.39, sat:7.0, fib:0, salt:0.10, synonyms:["half and half"], defaultCategories:["latticini"], source:"USDA FoodData Central — zuccheri e sodio stimati per analogia (fonte non li riportava)" },

  // ── Cucina sudamericana/messicana, lotto 12: peperoncini, mais, fagioli —
  // USDA FoodData Central; zuccheri/grassi saturi/fibre/sodio stimati dove
  // la fonte non li scomponeva, dichiarato voce per voce ──
  { cat:"Cucina sudamericana/messicana", id:"jalapeno", name:"Jalapeño, fresco", kcal:29, carb:6.5, sug:3.0, prot:0.91, fat:0.37, sat:0, fib:2.8, salt:0.01, synonyms:["jalapeno","jalapeño"], defaultCategories:["ortofrutta"], source:"USDA FoodData Central — zuccheri stimati per analogia (fonte non li scomponeva)" },
  { cat:"Cucina sudamericana/messicana", id:"avocado", name:"Avocado", kcal:160, carb:8.53, sug:0.66, prot:2.0, fat:14.66, sat:2.13, fib:6.7, salt:0.02, defaultCategories:["ortofrutta"], defaultEquivalences:{pz:200}, source:"USDA FoodData Central" },
  { cat:"Cucina sudamericana/messicana", id:"lime", name:"Lime", kcal:30, carb:10.54, sug:1.7, prot:0.7, fat:0.2, sat:0, fib:2.8, salt:0.005, defaultCategories:["ortofrutta"], defaultEquivalences:{pz:70}, source:"USDA FoodData Central — zuccheri stimati per analogia (fonte non li scomponeva)" },
  { cat:"Cucina sudamericana/messicana", id:"coriandolo_fresco", name:"Coriandolo fresco", kcal:23, carb:3.67, sug:0.9, prot:2.13, fat:0.52, sat:0, fib:3.2, salt:0.12, synonyms:["coriandolo","cilantro"], defaultCategories:["spezie"], source:"USDA FoodData Central" },
  { cat:"Cucina sudamericana/messicana", id:"cumino", name:"Cumino, semi essiccati", kcal:375, carb:42.857, sug:3.0, prot:17.857, fat:21.429, sat:0, fib:10.0, salt:0.42, synonyms:["cumino"], defaultCategories:["spezie"], source:"USDA FoodData Central — zuccheri stimati per analogia (fonte non li scomponeva)" },
  { cat:"Cucina sudamericana/messicana", id:"paprika", name:"Paprika essiccata", kcal:289, carb:53.99, sug:0, prot:14.14, fat:12.89, sat:3.1, fib:35.0, salt:0.17, synonyms:["paprika","paprika affumicata","paprika dolce"], defaultCategories:["spezie"], source:"USDA FoodData Central — grassi saturi, fibre e sodio stimati per analogia (fonte non li scomponeva)" },
  { cat:"Cucina sudamericana/messicana", id:"tortilla_mais", name:"Tortilla di mais", kcal:218, carb:47.9, sug:0, prot:5.7, fat:2.1, sat:0.3, fib:4.8, salt:0.02, synonyms:["tortilla"], defaultCategories:["cereali"], source:"USDA FoodData Central — zuccheri, grassi saturi e sodio stimati per analogia (fonte li dichiarava trascurabili senza numero)" },
  { cat:"Cucina sudamericana/messicana", id:"fagioli_neri", name:"Fagioli neri, cotti", kcal:132, carb:23.71, sug:0.32, prot:8.86, fat:0.54, sat:0, fib:8.7, salt:0.59, synonyms:["fagioli neri","black beans"], defaultCategories:["legumi"], source:"USDA FoodData Central" },
  { cat:"Cucina sudamericana/messicana", id:"fagioli_pinto", name:"Fagioli pinto, cotti", kcal:143, carb:26.22, sug:0.34, prot:9.01, fat:0.65, sat:0, fib:9.0, salt:0.005, synonyms:["fagioli pinto","pinto beans"], defaultCategories:["legumi"], source:"USDA FoodData Central" },

  // ── Cucina sudamericana/messicana, lotto 13: frutta tropicale, formaggi e
  // carni — USDA FoodData Central; zuccheri/grassi saturi/sodio stimati
  // dove la fonte non li scomponeva, dichiarato voce per voce ──
  { cat:"Cucina sudamericana/messicana", id:"mango", name:"Mango", kcal:60, carb:15.0, sug:13.7, prot:0.82, fat:0.38, sat:0, fib:1.6, salt:0.003, defaultCategories:["ortofrutta"], defaultEquivalences:{pz:200}, source:"USDA FoodData Central" },
  { cat:"Cucina sudamericana/messicana", id:"papaya", name:"Papaya", kcal:43, carb:10.8, sug:8.0, prot:0.47, fat:0.26, sat:0, fib:1.7, salt:0.003, defaultCategories:["ortofrutta"], source:"USDA FoodData Central — zuccheri stimati per analogia (fonte non li scomponeva)" },
  { cat:"Cucina sudamericana/messicana", id:"guava", name:"Guava", kcal:68, carb:14.32, sug:8.92, prot:2.55, fat:0.95, sat:0, fib:5.4, salt:0.005, defaultCategories:["ortofrutta"], source:"USDA FoodData Central" },
  { cat:"Cucina sudamericana/messicana", id:"platano", name:"Platano (banana da cottura)", kcal:122, carb:31.89, sug:15.0, prot:1.3, fat:0.37, sat:0, fib:2.3, salt:0.01, synonyms:["platano","plantain","banana da cottura"], defaultCategories:["ortofrutta"], source:"USDA FoodData Central — zuccheri stimati per analogia (fonte non li scomponeva); valori della varietà matura" },
  { cat:"Cucina sudamericana/messicana", id:"yuca", name:"Yuca (manioca)", kcal:160, carb:38.0, sug:1.7, prot:1.4, fat:0.3, sat:0, fib:1.8, salt:0.03, synonyms:["manioca","cassava"], defaultCategories:["cereali"], source:"USDA FoodData Central — sodio stimato per analogia (fonte non lo riportava per la radice cruda)" },
  { cat:"Cucina sudamericana/messicana", id:"queso_fresco", name:"Queso fresco", kcal:299, carb:3.0, sug:2.0, prot:18.0, fat:24.0, sat:13.0, fib:0, salt:1.88, defaultCategories:["latticini"], source:"USDA FoodData Central" },
  { cat:"Cucina sudamericana/messicana", id:"panna_acida", name:"Panna acida (sour cream)", kcal:181, carb:7.1, sug:0.2, prot:7.0, fat:10.6, sat:9.0, fib:0, salt:0.15, synonyms:["sour cream","crema agria"], defaultCategories:["latticini"], source:"USDA FoodData Central" },
  { cat:"Cucina sudamericana/messicana", id:"chorizo", name:"Chorizo", kcal:455, carb:1.9, sug:0, prot:24.0, fat:38.0, sat:14.0, fib:0, salt:3.09, defaultCategories:["proteine"], source:"USDA FoodData Central" },
  { cat:"Cucina sudamericana/messicana", id:"dulce_de_leche", name:"Dulce de leche", kcal:315, carb:55.0, sug:50.0, prot:7.0, fat:7.0, sat:4.5, fib:0, salt:0.32, defaultCategories:["altro"], source:"USDA FoodData Central" },

  // ── Cucina asiatica, lotto 14: salse e condimenti — USDA FoodData Central
  // (via aggregatori: foodstruct, myfooddata, recipal, fatsecret, nutrifox);
  // diverse fonti riportavano percentuali anziché grammi o carboidrati netti
  // anziché carboidrati totali/fibra separati — riconciliato voce per voce,
  // dichiarato dove il valore è stimato/calcolato ──
  { cat:"Cucina asiatica", id:"salsa_soia", name:"Salsa di soia", kcal:53, carb:5.8, sug:0.4, prot:9.6, fat:0.7, sat:0, fib:0.9, salt:13.73, synonyms:["salsa di soia","soy sauce","shoyu"], defaultCategories:["spezie"], source:"USDA FoodData Central (via foodstruct.com) — grassi saturi stimati trascurabili (grasso totale dichiarato 0.7g); fibra calcolata come 16% dei carboidrati totali, percentuale dichiarata dalla fonte" },
  { cat:"Cucina asiatica", id:"olio_sesamo", name:"Olio di sesamo", kcal:884, carb:0, sug:0, prot:0, fat:100, sat:14.2, fib:0, salt:0, synonyms:["olio di sesamo","sesame oil"], defaultCategories:["grassi"], source:"USDA FoodData Central (via myfooddata.com)" },
  { cat:"Cucina asiatica", id:"aceto_riso", name:"Aceto di riso", kcal:0, carb:0, sug:0, prot:0, fat:0, sat:0, fib:0, salt:0, synonyms:["aceto di riso","rice vinegar"], defaultCategories:["grassi"], source:"USDA FoodData Central (via recipal.com), voce \"rice vinegar, unseasoned\" — valori arrotondati a zero dalla fonte per il prodotto non condito/zuccherato; le cifre più alte trovate in altre ricerche (18-35 kcal, ~13g carboidrati) risultavano riferite a varianti \"seasoned\"/di marca con zucchero aggiunto, scartate perché non rappresentative dell'ingrediente generico" },
  { cat:"Cucina asiatica", id:"salsa_pesce", name:"Salsa di pesce (nam pla)", kcal:35, carb:3.64, sug:1.0, prot:5.06, fat:0.1, sat:0, fib:0, salt:19.63, synonyms:["salsa di pesce","nam pla","fish sauce","nuoc mam"], defaultCategories:["spezie"], source:"USDA FoodData Central (via recipal.com) — la fonte riportava solo \"carboidrati netti\" (3.64g) senza scomporre fibra/zuccheri: fibra stimata a 0 e zuccheri stimati pari al valore netto; grassi dichiarati dalla fonte come trascurabili, stimati a 0.1g" },
  { cat:"Cucina asiatica", id:"miso", name:"Miso (pasta di soia fermentata)", kcal:199, carb:26.47, sug:6.2, prot:11.69, fat:6.01, sat:1.139, fib:5.4, salt:9.32, synonyms:["miso","pasta di miso"], defaultCategories:["proteine"], source:"USDA FoodData Central (via myfooddata.com/fatsecret.com)" },
  { cat:"Cucina asiatica", id:"salsa_hoisin", name:"Salsa hoisin", kcal:220, carb:44.1, sug:27.3, prot:3.31, fat:3.39, sat:0, fib:2.8, salt:4.05, synonyms:["hoisin"], defaultCategories:["spezie"], source:"USDA FoodData Central (via recipal.com/myfooddata.com) — grassi saturi non riportati dalla fonte, stimati trascurabili dato il basso contenuto di grassi totali (3.39g)" },
  { cat:"Cucina asiatica", id:"salsa_ostrica", name:"Salsa di ostriche", kcal:53, carb:13.41, sug:8.48, prot:1.35, fat:0, sat:0, fib:0.2, salt:6.83, synonyms:["salsa di ostriche","oyster sauce"], defaultCategories:["spezie"], source:"USDA FoodData Central (via fatsecret.com, proteine e sodio da voce myfooddata.com) — fibra stimata bassa (differenza carboidrati/zuccheri attribuita perlopiù ad amido addensante, non a fibra)" },
  { cat:"Cucina asiatica", id:"pasta_curry_rossa", name:"Pasta di curry rossa", kcal:135, carb:14.7, sug:7.4, prot:3.7, fat:6.9, sat:1.0, fib:1.0, salt:4.12, synonyms:["curry rosso","red curry paste","pasta di curry"], defaultCategories:["spezie"], source:"Dati commerciali aggregati (myfooddata.com, nutrifox.com, recipal.com) — valori molto variabili tra marche (100-150 kcal/100g dichiarati); usata una voce dettagliata scalata da porzione da 15g; grassi saturi e fibra non riportati dalla fonte, stimati per analogia con paste di peperoncino/spezie" },

  // ── Cucina asiatica, lotto 15: verdure e proteine — USDA FoodData Central
  // (via aggregatori: foodstruct, myfooddata, recipal); stimati dove
  // dichiarato, dichiarato voce per voce ──
  { cat:"Cucina asiatica", id:"bok_choy", name:"Bok choy (cavolo cinese)", kcal:13, carb:2.2, sug:1.2, prot:1.5, fat:0.2, sat:0, fib:1.0, salt:0.07, synonyms:["bok choy","pak choi","cavolo cinese"], defaultCategories:["ortofrutta"], source:"USDA FoodData Central (via myfooddata.com) — zuccheri, fibre e sodio non mostrati dalla fonte consultata (dati mancanti sulla pagina), stimati per analogia con cavoli a foglia simili già presenti nel database (es. funghi/cavolo verza)" },
  { cat:"Cucina asiatica", id:"daikon", name:"Daikon (ravanello bianco)", kcal:18, carb:4.1, sug:1.86, prot:0.6, fat:0.1, sat:0, fib:1.4, salt:0.05, synonyms:["daikon","ravanello bianco","ravanello orientale"], defaultCategories:["ortofrutta"], source:"USDA FoodData Central (via foodstruct.com/snapcalorie.com)" },
  { cat:"Cucina asiatica", id:"tofu", name:"Tofu, sodo", kcal:144, carb:2.8, sug:0, prot:17.3, fat:8.7, sat:1.3, fib:2.3, salt:0.035, synonyms:["tofu"], defaultCategories:["proteine"], source:"USDA FoodData Central (via myfooddata.com), voce \"tofu, raw, firm, prepared with calcium sulfate\"" },
  { cat:"Cucina asiatica", id:"edamame", name:"Edamame (fagioli di soia freschi)", kcal:121, carb:8.9, sug:2.2, prot:11.9, fat:5.2, sat:0.6, fib:5.2, salt:0.015, synonyms:["edamame","fagioli di soia"], defaultCategories:["legumi"], source:"USDA FoodData Central (via foodstruct.com/myfooddata.com) — grassi saturi stimati per analogia (fonte non li scomponeva)" },
  { cat:"Cucina asiatica", id:"germogli_soia", name:"Germogli di soia (fagioli mungo)", kcal:30, carb:5.9, sug:4.1, prot:3.0, fat:0.2, sat:0, fib:1.8, salt:0.015, synonyms:["germogli di soia","germogli di fagioli mungo","bean sprouts"], defaultCategories:["ortofrutta"], source:"USDA FoodData Central (via myfooddata.com/foodstruct.com)" },
  { cat:"Cucina asiatica", id:"shiitake", name:"Funghi shiitake, freschi", kcal:34, carb:6.8, sug:2.4, prot:2.24, fat:0.49, sat:0, fib:2.5, salt:0.0225, synonyms:["shiitake"], defaultCategories:["ortofrutta"], source:"USDA FoodData Central (via recipal.com/foodstruct.com) — grassi saturi stimati trascurabili (fonte non li scomponeva)" },
  { cat:"Cucina asiatica", id:"nori", name:"Alga nori, essiccata", kcal:35, carb:5.1, sug:0.5, prot:5.8, fat:0.3, sat:0, fib:5.6, salt:1.44, synonyms:["nori","alga nori"], defaultCategories:["altro"], source:"USDA FoodData Central (via foodstruct.com per kcal/macro; fibre e sodio da voce myfooddata.com \"dried seaweed\", più concentrata della voce \"raw laver\" per il minor contenuto d'acqua) — grassi saturi stimati trascurabili" },
  { cat:"Cucina asiatica", id:"tempeh", name:"Tempeh", kcal:192, carb:7.6, sug:0, prot:20.3, fat:10.8, sat:2.0, fib:3.7, salt:0.0225, synonyms:["tempeh"], defaultCategories:["proteine"], source:"USDA FoodData Central (via myfooddata.com/foodstruct.com) — fonti discordanti sulla fibra (0-6g secondo la voce USDA consultata), scelto il valore intermedio più citato; zuccheri stimati trascurabili (prodotto fermentato) e grassi saturi stimati per analogia con la soia (fonte non li scomponeva)" },

  // ── Cucina asiatica, lotto 16: riso/noodles e spezie — chiude la cucina
  // asiatica. USDA FoodData Central (via aggregatori); stimati dove
  // dichiarato, dichiarato voce per voce ──
  { cat:"Cucina asiatica", id:"riso_jasmine", name:"Riso jasmine, crudo", kcal:329, carb:80.0, sug:0.1, prot:7.1, fat:0.6, sat:0, fib:1.1, salt:0.01, synonyms:["riso jasmine","riso gelsomino"], defaultCategories:["cereali"], source:"USDA FoodData Central (via mynetdiary.com/snapcalorie.com) — zuccheri, fibre e sodio riportati dalla fonte per porzione da 1/4 tazza (56g), riscalati a 100g" },
  { cat:"Cucina asiatica", id:"riso_basmati", name:"Riso basmati, crudo", kcal:354, carb:76.0, sug:0.1, prot:9.0, fat:1.0, sat:0, fib:1.2, salt:0.005, synonyms:["riso basmati"], defaultCategories:["cereali"], source:"USDA FoodData Central (via recipal.com/nutritiontable.com) — zuccheri, fibre, grassi saturi e sodio non riportati dalla fonte, stimati per analogia con il riso bianco già nel database (voce \"riso\")" },
  { cat:"Cucina asiatica", id:"noodles_riso", name:"Noodles di riso, secchi", kcal:364, carb:80.2, sug:0.12, prot:6.0, fat:0.6, sat:0, fib:1.6, salt:0.01, synonyms:["noodles di riso","spaghetti di riso","rice noodles"], defaultCategories:["cereali"], source:"USDA FoodData Central (via recipal.com/foodstruct.com/fatsecret.com) — sodio non riportato dalla fonte, stimato basso per analogia con il riso bianco (ingrediente base del prodotto)" },
  { cat:"Cucina asiatica", id:"noodles_udon", name:"Noodles udon, secchi", kcal:339, carb:71.0, sug:0, prot:8.0, fat:1.5, sat:0.3, fib:2.5, salt:0.0125, synonyms:["udon"], defaultCategories:["cereali"], source:"Dati commerciali aggregati (eatthismuch.com, myfooddata.com) — valori di calorie/macro molto discordanti tra fonti (104-400 kcal/100g secondo che il dato citato fosse in realtà per il prodotto cotto anziché secco); scelto un valore rappresentativo di più marche di udon secco; grassi saturi e fibre stimati per analogia con la pasta di semola già nel database; sodio da fonte dedicata al solo noodle secco (le confezioni di udon istantaneo includono anche una bustina di condimento molto più salata, non conteggiata qui perché non parte dell'ingrediente \"noodles\")" },
  { cat:"Cucina asiatica", id:"zenzero", name:"Zenzero, radice fresca", kcal:80, carb:17.77, sug:1.7, prot:1.82, fat:0.75, sat:0, fib:2.8, salt:0.0325, synonyms:["zenzero","ginger"], defaultCategories:["spezie"], source:"USDA FoodData Central (via myfooddata.com/nutritiontable.com) — zuccheri e grassi saturi stimati (fonte non li scomponeva)" },
  { cat:"Cucina asiatica", id:"semi_sesamo", name:"Semi di sesamo, essiccati", kcal:573, carb:23.4, sug:0.3, prot:17.73, fat:48.0, sat:6.82, fib:11.8, salt:0.0275, synonyms:["sesamo","semi di sesamo","sesame seeds"], defaultCategories:["spezie"], source:"USDA FoodData Central (via medindia.net per carboidrati/fibre/zuccheri, foodstruct.com per kcal/proteine/grassi/sodio) — grassi saturi stimati al 14.2% dei grassi totali, stessa proporzione dichiarata dalla fonte per l'olio di sesamo già nel database; scartato un valore isolato di calorie/macro molto più alto (medindia, prima lettura) risultato incoerente con tutte le altre fonti, probabile errore di unità di misura" },
  { cat:"Cucina asiatica", id:"curcuma_fresca", name:"Curcuma, radice fresca", kcal:40, carb:7.0, sug:1.0, prot:0, fat:1.0, sat:0, fib:2.0, salt:0.24, synonyms:["curcuma fresca","turmeric"], defaultCategories:["spezie"], source:"USDA FoodData Central (via recipal.com) — proteine dichiarate a 0 dalla fonte (valore insolitamente basso per una radice fresca, non confermabile con una seconda fonte in questa ricerca, riportato comunque perché esplicitamente dichiarato dalla fonte); zuccheri e grassi saturi stimati" },
  { cat:"Cucina asiatica", id:"wasabi", name:"Wasabi, radice fresca", kcal:109, carb:23.0, sug:2.3, prot:4.8, fat:0.63, sat:0, fib:7.8, salt:0.0425, synonyms:["wasabi"], defaultCategories:["spezie"], source:"USDA FoodData Central (via fatsecret.com/myfooddata.com/foodstruct.com) — zuccheri e grassi saturi stimati (fonte non li scomponeva)" },

  // ── Cucina mediorientale/nordafricana, lotto 17: spezie, salse e legumi —
  // USDA FoodData Central e dati commerciali aggregati (le miscele di spezie
  // non hanno una voce USDA unica: composizione e quindi valori nutrizionali
  // variano molto da ricetta a ricetta); ceci, lenticchie comuni, fave e
  // cannella già presenti nel database dalle sezioni precedenti, qui solo
  // le voci mancanti; stimato dove dichiarato, dichiarato voce per voce ──
  { cat:"Cucina mediorientale/nordafricana", id:"tahini", name:"Tahina (crema di sesamo)", kcal:592, carb:21.5, sug:0.5, prot:17.4, fat:53.0, sat:7.53, fib:9.0, salt:0.29, synonyms:["tahini","tahina","crema di sesamo"], defaultCategories:["spezie"], source:"USDA FoodData Central (via fatsecret.com/foodstruct.com) — zuccheri stimati bassi per analogia con i semi di sesamo (fonte non li scomponeva); grassi saturi stimati al 14.2% dei grassi totali, stessa proporzione già usata per olio e semi di sesamo nel database" },
  { cat:"Cucina mediorientale/nordafricana", id:"zaatar", name:"Za'atar (miscela di spezie)", kcal:350, carb:33.0, sug:0, prot:16.7, fat:25.0, sat:3.5, fib:16.7, salt:5.67, synonyms:["zaatar","za'atar"], defaultCategories:["spezie"], source:"Dati commerciali aggregati (spicesinc.com, ricetta tipica riportata da beingnutritious.com) — la miscela (timo/origano essiccati, sumac, semi di sesamo, sale) varia molto per composizione da ricetta a ricetta; grassi saturi stimati per analogia con il sesamo, componente tipica della miscela" },
  { cat:"Cucina mediorientale/nordafricana", id:"sumac", name:"Sumac macinato", kcal:345, carb:48.1, sug:7.0, prot:13.3, fat:14.4, sat:0, fib:33.8, salt:0.0825, synonyms:["sommacco","sumac"], defaultCategories:["spezie"], source:"USDA FoodData Central (via myfooddata.com) — usata la voce \"senza sale aggiunto\" (33mg sodio/100g): altre fonti riportavano 2840-4200mg per varianti commerciali salate, scartate perché non rappresentative della spezia pura; grassi saturi stimati trascurabili" },
  { cat:"Cucina mediorientale/nordafricana", id:"harissa", name:"Harissa (pasta di peperoncino)", kcal:95, carb:10.8, sug:4.0, prot:1.5, fat:4.1, sat:0.5, fib:3.3, salt:2.5, synonyms:["harissa"], defaultCategories:["spezie"], source:"Dati commerciali aggregati (myfooddata.com/nutrifox.com) — fibra scalata da un valore dichiarato per porzione da 30g; zuccheri e grassi saturi stimati (fonte non li scomponeva)" },
  { cat:"Cucina mediorientale/nordafricana", id:"lenticchie_rosse", name:"Lenticchie rosse decorticate, secche", kcal:353, carb:60.08, sug:2.03, prot:25.8, fat:1.06, sat:0, fib:10.7, salt:0.015, synonyms:["lenticchie rosse","red lentils"], defaultCategories:["legumi"], source:"USDA FoodData Central (via myfooddata.com/calorique.io) — grassi saturi stimati trascurabili (fonte non li scomponeva)" },
  { cat:"Cucina mediorientale/nordafricana", id:"cardamomo", name:"Cardamomo macinato", kcal:311, carb:68.5, sug:0, prot:10.8, fat:6.7, sat:0, fib:28.0, salt:0.045, synonyms:["cardamomo"], defaultCategories:["spezie"], source:"USDA FoodData Central (via foodstruct.com/myfooddata.com) — zuccheri e grassi saturi stimati trascurabili (fonte non li scomponeva)" },
  { cat:"Cucina mediorientale/nordafricana", id:"ras_el_hanout", name:"Ras el hanout (miscela di spezie)", kcal:283, carb:50.0, sug:3.0, prot:17.0, fat:17.0, sat:2.4, fib:15.0, salt:1.5, synonyms:["ras el hanout"], defaultCategories:["spezie"], source:"Stima scalata da una porzione di riferimento da 6g (spicesinc.com/bowlofdelicious.com) — nessuna voce USDA per la miscela; composizione (cumino, coriandolo, curcuma, cannella, peperoncino e molte altre spezie in proporzioni variabili) cambia molto da ricetta a ricetta; zuccheri, fibre, grassi saturi e sale stimati per analogia con le spezie componenti già nel database, non desunti dalla fonte" },

  // ── Cucina mediorientale/nordafricana, lotto 18: formaggi, frutta secca e
  // altro — chiude la cucina mediorientale/nordafricana. USDA FoodData
  // Central e dati commerciali aggregati; pistacchi, pinoli e cous cous già
  // presenti nel database dalle sezioni precedenti; stimato dove
  // dichiarato, dichiarato voce per voce ──
  { cat:"Cucina mediorientale/nordafricana", id:"feta", name:"Feta", kcal:264, carb:4.09, sug:4.09, prot:14.21, fat:21.28, sat:14.95, fib:0, salt:2.79, synonyms:["feta"], defaultCategories:["latticini"], source:"USDA FoodData Central (via fatsecret.com/foodstruct.com)" },
  { cat:"Cucina mediorientale/nordafricana", id:"halloumi", name:"Halloumi", kcal:333, carb:1.47, sug:0.47, prot:22.07, fat:26.47, sat:16.75, fib:0, salt:1.41, synonyms:["halloumi"], defaultCategories:["latticini"], source:"USDA FoodData Central (via mealstack.io/fatsecret.com)" },
  { cat:"Cucina mediorientale/nordafricana", id:"datteri_medjoul", name:"Datteri Medjoul", kcal:277, carb:74.97, sug:66.47, prot:1.81, fat:0.15, sat:0, fib:6.7, salt:0.003, synonyms:["datteri","dates"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:24}, source:"USDA FoodData Central (via myfooddata.com/fatsecret.com)" },
  { cat:"Cucina mediorientale/nordafricana", id:"bulgur", name:"Bulgur, secco", kcal:342, carb:75.87, sug:0, prot:12.29, fat:1.33, sat:0, fib:4.0, salt:0.02, synonyms:["bulgur"], defaultCategories:["cereali"], source:"USDA FoodData Central (via foodstruct.com/myfooddata.com) — zuccheri, grassi saturi e sodio non riportati dalla fonte per il prodotto secco, stimati per analogia con cous cous e altri cereali secchi già nel database" },
  { cat:"Cucina mediorientale/nordafricana", id:"pane_pita", name:"Pane pita, bianco", kcal:275, carb:53.5, sug:2.0, prot:9.1, fat:1.4, sat:0, fib:2.5, salt:1.34, synonyms:["pita","pane pita"], defaultCategories:["cereali"], source:"USDA FoodData Central (via fatsecret.com/myfooddata.com) — zuccheri, fibre e grassi saturi non riportati dalla fonte, stimati per analogia con altri pani bianchi" },
  { cat:"Cucina mediorientale/nordafricana", id:"labneh", name:"Labneh (yogurt colato)", kcal:150, carb:4.0, sug:3.0, prot:6.0, fat:10.0, sat:6.0, fib:0, salt:0.63, synonyms:["labneh"], defaultCategories:["latticini"], source:"Dati commerciali aggregati (calorique.io/healthline.com) — valori variabili per marca/percentuale di grassi; zuccheri e grassi saturi stimati per analogia con yogurt greco/latticini simili; sodio stimato al centro dell'intervallo dichiarato dalla fonte (200-300mg)" },
  { cat:"Cucina mediorientale/nordafricana", id:"melassa_melograno", name:"Melassa di melograno", kcal:300, carb:75.0, sug:62.0, prot:0.1, fat:0.1, sat:0, fib:0, salt:0, synonyms:["melassa di melograno","pomegranate molasses"], defaultCategories:["base"], source:"Dati commerciali aggregati (recipal.com/myfooddata.com, marca Al Wadi Al Akhdar) — valori variabili tra marche (calorie 222-300, carboidrati 50-75g secondo la fonte); sodio dichiarato a 0 dalla fonte" },

  // ── Cucina indiana, lotto 19: spezie — USDA FoodData Central e dati
  // commerciali aggregati per le miscele; cumino, curcuma fresca, cannella,
  // cardamomo, zenzero e peperoncino fresco già presenti nel database dalle
  // sezioni precedenti, qui solo le voci mancanti; stimato dove dichiarato,
  // dichiarato voce per voce ──
  { cat:"Cucina indiana", id:"garam_masala", name:"Garam masala (miscela di spezie)", kcal:103, carb:14, sug:0, prot:5, fat:3, sat:0, fib:1, salt:0.81, synonyms:["garam masala"], defaultCategories:["spezie"], source:"Dati commerciali aggregati (recipal.com/nutrifox.com) — forte variabilità tra marche (100-500 kcal/100g secondo le fonti, a seconda della proporzione spezie/riempitivi); usato il valore più dettagliato trovato (calorie/macro coerenti tra loro); zuccheri e grassi saturi stimati trascurabili" },
  { cat:"Cucina indiana", id:"curcuma_polvere", name:"Curcuma in polvere", kcal:312, carb:67.1, sug:2.38, prot:9.7, fat:3.3, sat:0, fib:23.0, salt:0.1, synonyms:["curcuma","curcuma in polvere","turmeric"], defaultCategories:["spezie"], source:"USDA FoodData Central (via myfooddata.com/foodstruct.com) — sodio non riportato dalla fonte, stimato per analogia con altre spezie macinate; grassi saturi stimati trascurabili. Voce distinta dalla curcuma fresca già nel database (radice essiccata e macinata, molto più concentrata)" },
  { cat:"Cucina indiana", id:"semi_coriandolo", name:"Semi di coriandolo, essiccati", kcal:298, carb:55.0, sug:0, prot:12.4, fat:17.8, sat:0, fib:42.0, salt:0.0015, synonyms:["semi di coriandolo","coriander seed"], defaultCategories:["spezie"], source:"USDA FoodData Central (via sculptai.io/foodstruct.com) — zuccheri e grassi saturi stimati trascurabili (fonte non li scomponeva). Voce distinta dal coriandolo fresco già nel database (semi essiccati, non foglie)" },
  { cat:"Cucina indiana", id:"semi_senape", name:"Semi di senape, macinati", kcal:508, carb:28.09, sug:0, prot:26.08, fat:36.24, sat:0, fib:15.5, salt:0.05, synonyms:["semi di senape","mustard seed"], defaultCategories:["spezie"], source:"USDA FoodData Central (via myfooddata.com) — zuccheri, grassi saturi e sodio non riportati dalla fonte, stimati per analogia con altre spezie macinate" },
  { cat:"Cucina indiana", id:"fieno_greco", name:"Semi di fieno greco", kcal:323, carb:58.4, sug:0, prot:23.0, fat:6.4, sat:0, fib:24.6, salt:0.1675, synonyms:["fieno greco","fenugreek"], defaultCategories:["spezie"], source:"USDA FoodData Central (via myfooddata.com/fatsecret.com) — zuccheri e grassi saturi non riportati dalla fonte, stimati trascurabili" },
  { cat:"Cucina indiana", id:"asafetida", name:"Asafetida (hing)", kcal:348, carb:73.0, sug:0, prot:10.0, fat:1.5, sat:0, fib:0, salt:0, synonyms:["asafetida","hing","asafoetida"], defaultCategories:["spezie"], source:"Dati commerciali aggregati (recipal.com) — fonti fortemente discordanti (0-400 kcal/100g secondo la voce consultata, probabilmente per prodotti diluiti con farina di riso/grano in proporzioni diverse, pratica comune per questa spezia); usata la voce più dettagliata e internamente coerente (\"asafoetida powder\"); fibra non riportata da nessuna fonte, lasciata a 0; zuccheri e grassi saturi stimati trascurabili" },
  { cat:"Cucina indiana", id:"foglie_curry", name:"Foglie di curry, fresche", kcal:108, carb:18.7, sug:0, prot:6.1, fat:1.0, sat:0, fib:6.4, salt:0, synonyms:["foglie di curry","curry leaves"], defaultCategories:["spezie"], source:"Dati commerciali aggregati (nutritionix.com/nutrition-and-you.com) — una fonte alternativa riportava 97 kcal/100g, differenza probabilmente dovuta al contenuto di umidità della foglia analizzata; zuccheri e grassi saturi stimati trascurabili" },
  { cat:"Cucina indiana", id:"peperoncino_polvere", name:"Peperoncino in polvere (cayenna)", kcal:318, carb:56.63, sug:10.34, prot:12.02, fat:17.27, sat:0, fib:27.2, salt:0.075, synonyms:["peperoncino in polvere","cayenna","cayenne pepper","chili powder"], defaultCategories:["spezie"], source:"USDA FoodData Central (via fatsecret.com/foodstruct.com) — grassi saturi stimati trascurabili (fonte non li scomponeva). Voce distinta dal peperoncino fresco già nel database (spezia essiccata e macinata, molto più concentrata)" },
];

export const NUTRIENT_LABELS = [
  { key:"kcal", label:"Energia",      unit:"kcal", dec:0 },
  { key:"carb", label:"Carboidrati",  unit:"g",    dec:1 },
  { key:"sug",  label:"di cui zuccheri", unit:"g", dec:1, sub:true },
  { key:"prot", label:"Proteine",     unit:"g",    dec:1 },
  { key:"fat",  label:"Grassi",       unit:"g",    dec:1 },
  { key:"sat",  label:"di cui saturi", unit:"g",   dec:1, sub:true },
  { key:"fib",  label:"Fibre",        unit:"g",    dec:1 },
  { key:"salt", label:"Sale",         unit:"g",    dec:2 },
];
