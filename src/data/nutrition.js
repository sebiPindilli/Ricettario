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

  // ── Frutta ──
  { cat:"Frutta", id:"mele", name:"Mele", kcal:57, carb:13.7, sug:13.7, prot:0.3, fat:0.1, sat:0, fib:1.7, salt:0.005, synonyms:["mela"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"pere", name:"Pere", kcal:41, carb:9.5, sug:9.5, prot:0.3, fat:0.1, sat:0, fib:3.8, salt:0.005, synonyms:["pera"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"banane", name:"Banane", kcal:69, carb:15.4, sug:12.8, prot:1.2, fat:0.3, sat:0.1, fib:1.8, salt:0.005, synonyms:["banana"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:120}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"limoni", name:"Limoni (succo e polpa)", kcal:16, carb:2.3, sug:2.3, prot:0.6, fat:0.2, sat:0, fib:1.9, salt:0.005, synonyms:["limone"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:100}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"arance", name:"Arance", kcal:39, carb:8.1, sug:8.1, prot:0.7, fat:0.2, sat:0, fib:1.6, salt:0.005, synonyms:["arancia"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"fragole", name:"Fragole", kcal:30, carb:5.3, sug:5.3, prot:0.9, fat:0.4, sat:0, fib:1.6, salt:0.005, synonyms:["fragola"], defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"pesche", name:"Pesche", kcal:28, carb:6.1, sug:6.1, prot:0.7, fat:0.1, sat:0, fib:2.1, salt:0.005, synonyms:["pesca"], defaultCategories:["ortofrutta"], defaultEquivalences:{pz:150}, source:"CREA (alimentinutrizione.it)" },
  { cat:"Frutta", id:"uva", name:"Uva", kcal:64, carb:15.6, sug:15.6, prot:0.5, fat:0.1, sat:0, fib:1.5, salt:0.005, defaultCategories:["ortofrutta"], source:"CREA (alimentinutrizione.it)" },

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

  // ── Bevande e alcolici (per cucina) ──
  { cat:"Bevande e alcolici (per cucina)", id:"vino_bianco", name:"Vino bianco da tavola", kcal:70, carb:0.1, sug:0.1, prot:0.1, fat:0, sat:0, fib:0, salt:0.01, synonyms:["vino bianco"], defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"vino_rosso", name:"Vino rosso da tavola", kcal:75, carb:0.2, sug:0.2, prot:0.1, fat:0, sat:0, fib:0, salt:0.01, synonyms:["vino rosso"], defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"birra", name:"Birra chiara", kcal:34, carb:3.5, sug:3.5, prot:0.2, fat:0, sat:0, fib:0, salt:0.005, synonyms:["birra"], defaultCategories:["alcolici"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Bevande e alcolici (per cucina)", id:"caffe", name:"Caffè espresso", kcal:2, carb:0.3, sug:0, prot:0.1, fat:0, sat:0, fib:0, salt:0.005, synonyms:["caffè"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },

  // ── Varie ──
  { cat:"Varie", id:"vaniglia", name:"Vaniglia (bacca/estratto)", kcal:288, carb:12.7, sug:12.7, prot:0.1, fat:0.1, sat:0, fib:0, salt:0.02, synonyms:["bacca di vaniglia","estratto di vaniglia"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"cannella", name:"Cannella in polvere", kcal:247, carb:27.5, sug:2.2, prot:4.0, fat:1.2, sat:0.3, fib:53.1, salt:0.03, synonyms:["cannella"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"rosmarino", name:"Rosmarino fresco", kcal:131, carb:13.5, sug:0, prot:3.3, fat:5.9, sat:2.8, fib:14.1, salt:0.07, synonyms:["rosmarino"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"timo", name:"Timo fresco", kcal:101, carb:10.5, sug:0, prot:5.6, fat:1.7, sat:0.5, fib:14.0, salt:0.02, synonyms:["timo"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"menta", name:"Menta fresca", kcal:70, carb:5.3, sug:0, prot:3.8, fat:0.9, sat:0.2, fib:8.0, salt:0.08, synonyms:["menta"], defaultCategories:["spezie"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"olive", name:"Olive da tavola", kcal:145, carb:1.0, sug:0.5, prot:0.8, fat:15.0, sat:2.3, fib:4.4, salt:3.5, synonyms:["olive nere","olive verdi"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"capperi", name:"Capperi sotto sale (dissalati)", kcal:23, carb:2.4, sug:0.4, prot:2.4, fat:0.9, sat:0.2, fib:3.2, salt:2.5, synonyms:["capperi"], defaultCategories:["altro"], source:"CREA (alimentinutrizione.it)" },
  { cat:"Varie", id:"zafferano", name:"Zafferano", kcal:310, carb:61.5, sug:0, prot:11.4, fat:5.9, sat:1.6, fib:3.9, salt:0.4, defaultCategories:["spezie"], defaultEquivalences:{bustina:0.1}, source:"CREA (alimentinutrizione.it)" },
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
