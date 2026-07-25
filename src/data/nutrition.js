// ══════════════════════════════════════════════════════════════
// VALORI NUTRIZIONALI — dataset locale (per 100 g di parte edibile)
// Valori indicativi elaborati dalle Tabelle di Composizione degli
// Alimenti CREA (alimentinutrizione.it) — citare la fonte nell'app.
// kcal · carb=carboidrati · sug=zuccheri · prot=proteine
// fat=grassi · sat=saturi · fib=fibre · salt=sale (g)
// ══════════════════════════════════════════════════════════════
export const NUTRITION_DB = [
  // ── Farine, cereali e derivati ──
  { cat:"Farine, cereali e derivati", id:"farina_00", name:"Farina di frumento tipo 00", kcal:340, carb:77.3, sug:1.7, prot:11.0, fat:0.7, sat:0.1, fib:2.2, salt:0.005 },
  { cat:"Farine, cereali e derivati", id:"farina_int", name:"Farina di frumento integrale", kcal:319, carb:67.8, sug:2.1, prot:11.9, fat:1.9, sat:0.3, fib:8.4, salt:0.008 },
  { cat:"Farine, cereali e derivati", id:"farina_mandorle", name:"Farina di mandorle", kcal:603, carb:4.6, sug:3.7, prot:22.0, fat:55.3, sat:4.6, fib:12.7, salt:0.01 },
  { cat:"Farine, cereali e derivati", id:"semola", name:"Semola di grano duro", kcal:339, carb:76.9, sug:3.2, prot:11.5, fat:0.5, sat:0.1, fib:3.6, salt:0.005 },
  { cat:"Farine, cereali e derivati", id:"pasta_secca", name:"Pasta di semola", kcal:353, carb:79.1, sug:4.2, prot:10.9, fat:1.4, sat:0.2, fib:2.7, salt:0.01 },
  { cat:"Farine, cereali e derivati", id:"pasta_uovo", name:"Pasta all'uovo secca", kcal:366, carb:72.1, sug:2.1, prot:13.0, fat:2.4, sat:0.7, fib:3.2, salt:0.03 },
  { cat:"Farine, cereali e derivati", id:"riso", name:"Riso brillato (Carnaroli, Arborio…)", kcal:332, carb:80.4, sug:0.2, prot:6.7, fat:0.4, sat:0.1, fib:1.0, salt:0.01 },
  { cat:"Farine, cereali e derivati", id:"riso_integrale", name:"Riso integrale", kcal:337, carb:77.4, sug:0.9, prot:7.5, fat:1.9, sat:0.5, fib:1.9, salt:0.01 },
  { cat:"Farine, cereali e derivati", id:"pane", name:"Pane comune", kcal:275, carb:57.6, sug:2.0, prot:8.6, fat:0.4, sat:0.1, fib:3.1, salt:1.5 },
  { cat:"Farine, cereali e derivati", id:"pangrattato", name:"Pane grattugiato", kcal:351, carb:70.3, sug:2.5, prot:11.5, fat:2.2, sat:0.5, fib:4.0, salt:1.7 },
  { cat:"Farine, cereali e derivati", id:"orzo", name:"Orzo perlato", kcal:319, carb:70.5, sug:1.2, prot:10.4, fat:1.4, sat:0.3, fib:9.2, salt:0.01 },
  { cat:"Farine, cereali e derivati", id:"farro", name:"Farro", kcal:335, carb:67.1, sug:2.7, prot:15.1, fat:2.5, sat:0.4, fib:6.8, salt:0.01 },
  { cat:"Farine, cereali e derivati", id:"avena_fiocchi", name:"Fiocchi d'avena", kcal:376, carb:66.8, sug:1.0, prot:13.0, fat:7.1, sat:1.3, fib:10.6, salt:0.005 },
  { cat:"Farine, cereali e derivati", id:"mais_polenta", name:"Farina di mais (polenta)", kcal:354, carb:80.8, sug:1.5, prot:8.7, fat:2.7, sat:0.4, fib:3.1, salt:0.005 },
  { cat:"Farine, cereali e derivati", id:"couscous", name:"Cous cous secco", kcal:358, carb:77.4, sug:1.6, prot:12.8, fat:0.6, sat:0.1, fib:5.0, salt:0.02 },
  { cat:"Farine, cereali e derivati", id:"lievito_birra", name:"Lievito di birra fresco", kcal:82, carb:1.1, sug:0, prot:12.1, fat:0.4, sat:0.1, fib:6.9, salt:0.09 },
  { cat:"Farine, cereali e derivati", id:"lievito_chimico", name:"Lievito chimico (per dolci)", kcal:110, carb:27.0, sug:0, prot:0.5, fat:0.1, sat:0, fib:0.2, salt:26.0 },

  // ── Zuccheri e dolcificanti ──
  { cat:"Zuccheri e dolcificanti", id:"zucchero", name:"Zucchero (saccarosio)", kcal:392, carb:100, sug:100, prot:0, fat:0, sat:0, fib:0, salt:0 },
  { cat:"Zuccheri e dolcificanti", id:"zucchero_canna", name:"Zucchero di canna grezzo", kcal:377, carb:97.0, sug:96.0, prot:0.1, fat:0, sat:0, fib:0, salt:0.03 },
  { cat:"Zuccheri e dolcificanti", id:"zucchero_velo", name:"Zucchero a velo", kcal:392, carb:99.8, sug:99.5, prot:0, fat:0, sat:0, fib:0, salt:0 },
  { cat:"Zuccheri e dolcificanti", id:"miele", name:"Miele", kcal:304, carb:80.3, sug:80.3, prot:0.6, fat:0, sat:0, fib:0, salt:0.01 },
  { cat:"Zuccheri e dolcificanti", id:"marmellata", name:"Marmellata / confettura", kcal:222, carb:58.7, sug:58.7, prot:0.5, fat:0, sat:0, fib:1.0, salt:0.03 },
  { cat:"Zuccheri e dolcificanti", id:"nutella", name:"Crema spalmabile alle nocciole", kcal:539, carb:57.5, sug:56.3, prot:6.3, fat:30.9, sat:10.6, fib:3.4, salt:0.11 },

  // ── Latticini e uova ──
  { cat:"Latticini e uova", id:"latte_intero", name:"Latte intero", kcal:64, carb:4.9, sug:4.9, prot:3.3, fat:3.6, sat:2.1, fib:0, salt:0.13 },
  { cat:"Latticini e uova", id:"latte_ps", name:"Latte parzialmente scremato", kcal:46, carb:5.0, sug:5.0, prot:3.5, fat:1.5, sat:0.9, fib:0, salt:0.13 },
  { cat:"Latticini e uova", id:"panna", name:"Panna fresca da montare (35%)", kcal:337, carb:3.4, sug:3.4, prot:2.3, fat:35.0, sat:22.0, fib:0, salt:0.08 },
  { cat:"Latticini e uova", id:"panna_cucina", name:"Panna da cucina (20%)", kcal:207, carb:4.0, sug:4.0, prot:2.6, fat:20.0, sat:12.5, fib:0, salt:0.09 },
  { cat:"Latticini e uova", id:"burro", name:"Burro", kcal:758, carb:1.1, sug:1.1, prot:0.8, fat:83.4, sat:51.4, fib:0, salt:0.02 },
  { cat:"Latticini e uova", id:"yogurt_intero", name:"Yogurt intero bianco", kcal:66, carb:4.3, sug:4.3, prot:3.8, fat:3.9, sat:2.4, fib:0, salt:0.12 },
  { cat:"Latticini e uova", id:"yogurt_greco", name:"Yogurt greco", kcal:97, carb:3.9, sug:3.9, prot:9.0, fat:5.0, sat:3.4, fib:0, salt:0.09 },
  { cat:"Latticini e uova", id:"ricotta", name:"Ricotta di vacca", kcal:146, carb:3.5, sug:3.5, prot:8.8, fat:10.9, sat:7.1, fib:0, salt:0.22 },
  { cat:"Latticini e uova", id:"mascarpone", name:"Mascarpone", kcal:455, carb:4.6, sug:4.6, prot:4.6, fat:47.0, sat:30.0, fib:0, salt:0.09 },
  { cat:"Latticini e uova", id:"mozzarella", name:"Mozzarella di vacca", kcal:253, carb:0.7, sug:0.7, prot:18.7, fat:19.5, sat:12.5, fib:0, salt:0.5 },
  { cat:"Latticini e uova", id:"parmigiano", name:"Parmigiano Reggiano", kcal:392, carb:0, sug:0, prot:33.0, fat:28.4, sat:18.5, fib:0, salt:1.6 },
  { cat:"Latticini e uova", id:"grana", name:"Grana Padano", kcal:398, carb:0, sug:0, prot:33.0, fat:29.0, sat:19.0, fib:0, salt:1.5 },
  { cat:"Latticini e uova", id:"pecorino", name:"Pecorino", kcal:392, carb:0.2, sug:0.2, prot:28.5, fat:30.6, sat:19.6, fib:0, salt:1.9 },
  { cat:"Latticini e uova", id:"gorgonzola", name:"Gorgonzola", kcal:324, carb:0.1, sug:0.1, prot:19.1, fat:27.1, sat:18.0, fib:0, salt:1.6 },
  { cat:"Latticini e uova", id:"uova", name:"Uova di gallina intere", kcal:128, carb:0.5, sug:0.5, prot:12.4, fat:8.7, sat:2.7, fib:0, salt:0.35 },

  // ── Carni e salumi ──
  { cat:"Carni e salumi", id:"pollo_petto", name:"Pollo, petto", kcal:100, carb:0, sug:0, prot:23.3, fat:0.8, sat:0.3, fib:0, salt:0.08 },
  { cat:"Carni e salumi", id:"pollo_intero", name:"Pollo intero con pelle", kcal:171, carb:0, sug:0, prot:19.1, fat:10.6, sat:3.0, fib:0, salt:0.09 },
  { cat:"Carni e salumi", id:"tacchino", name:"Tacchino, fesa", kcal:107, carb:0, sug:0, prot:24.0, fat:1.2, sat:0.4, fib:0, salt:0.06 },
  { cat:"Carni e salumi", id:"manzo_magro", name:"Bovino adulto, tagli magri", kcal:129, carb:0, sug:0, prot:21.8, fat:4.6, sat:1.8, fib:0, salt:0.1 },
  { cat:"Carni e salumi", id:"macinato_misto", name:"Carne macinata mista (bovino/suino)", kcal:220, carb:0, sug:0, prot:18.5, fat:16.0, sat:6.5, fib:0, salt:0.12 },
  { cat:"Carni e salumi", id:"maiale_lonza", name:"Suino, lonza", kcal:157, carb:0, sug:0, prot:21.3, fat:8.0, sat:2.8, fib:0, salt:0.08 },
  { cat:"Carni e salumi", id:"salsiccia", name:"Salsiccia di suino fresca", kcal:304, carb:0.6, sug:0.6, prot:15.4, fat:26.7, sat:9.5, fib:0, salt:2.2 },
  { cat:"Carni e salumi", id:"prosciutto_crudo", name:"Prosciutto crudo", kcal:224, carb:0, sug:0, prot:25.5, fat:13.0, sat:4.5, fib:0, salt:5.5 },
  { cat:"Carni e salumi", id:"prosciutto_cotto", name:"Prosciutto cotto", kcal:215, carb:0.9, sug:0.9, prot:19.8, fat:14.7, sat:5.0, fib:0, salt:1.8 },
  { cat:"Carni e salumi", id:"speck", name:"Speck", kcal:303, carb:0.5, sug:0.5, prot:28.3, fat:20.9, sat:7.7, fib:0, salt:4.4 },
  { cat:"Carni e salumi", id:"pancetta", name:"Pancetta tesa", kcal:337, carb:0.8, sug:0.8, prot:20.9, fat:28.1, sat:10.1, fib:0, salt:2.8 },
  { cat:"Carni e salumi", id:"guanciale", name:"Guanciale", kcal:655, carb:0.2, sug:0.2, prot:8.6, fat:69.6, sat:24.5, fib:0, salt:2.0 },

  // ── Pesce ──
  { cat:"Pesce", id:"tonno_fresco", name:"Tonno fresco", kcal:159, carb:0.1, sug:0.1, prot:21.5, fat:8.1, sat:2.8, fib:0, salt:0.1 },
  { cat:"Pesce", id:"tonno_olio", name:"Tonno sott'olio sgocciolato", kcal:192, carb:0, sug:0, prot:25.2, fat:10.1, sat:2.4, fib:0, salt:0.9 },
  { cat:"Pesce", id:"salmone", name:"Salmone fresco", kcal:185, carb:1.0, sug:1.0, prot:18.4, fat:12.0, sat:2.9, fib:0, salt:0.1 },
  { cat:"Pesce", id:"merluzzo", name:"Merluzzo / nasello", kcal:71, carb:0, sug:0, prot:17.0, fat:0.3, sat:0.1, fib:0, salt:0.2 },
  { cat:"Pesce", id:"gamberi", name:"Gamberi", kcal:71, carb:0.6, sug:0, prot:13.6, fat:0.6, sat:0.2, fib:0, salt:0.6 },
  { cat:"Pesce", id:"acciughe", name:"Acciughe sott'olio", kcal:206, carb:0.2, sug:0.2, prot:25.9, fat:11.3, sat:2.7, fib:0, salt:9.3 },

  // ── Legumi ──
  { cat:"Legumi", id:"ceci_secchi", name:"Ceci secchi", kcal:343, carb:46.9, sug:3.7, prot:20.9, fat:6.3, sat:0.7, fib:13.6, salt:0.02 },
  { cat:"Legumi", id:"ceci_cotti", name:"Ceci in scatola scolati", kcal:113, carb:15.0, sug:0.9, prot:6.7, fat:2.3, sat:0.2, fib:5.7, salt:0.6 },
  { cat:"Legumi", id:"lenticchie_secche", name:"Lenticchie secche", kcal:325, carb:51.1, sug:1.8, prot:22.7, fat:1.0, sat:0.2, fib:13.7, salt:0.02 },
  { cat:"Legumi", id:"fagioli_borlotti", name:"Fagioli borlotti in scatola scolati", kcal:91, carb:14.9, sug:0.6, prot:6.9, fat:0.6, sat:0.1, fib:6.5, salt:0.7 },
  { cat:"Legumi", id:"fagioli_cannellini", name:"Fagioli cannellini in scatola scolati", kcal:85, carb:13.5, sug:0.5, prot:6.6, fat:0.5, sat:0.1, fib:6.2, salt:0.7 },
  { cat:"Legumi", id:"piselli", name:"Piselli freschi/surgelati", kcal:76, carb:11.4, sug:3.3, prot:5.5, fat:0.6, sat:0.1, fib:5.2, salt:0.01 },

  // ── Verdure e ortaggi ──
  { cat:"Verdure e ortaggi", id:"pomodori", name:"Pomodori da insalata", kcal:19, carb:2.8, sug:2.8, prot:1.0, fat:0.2, sat:0, fib:1.1, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"pomodori_pelati", name:"Pomodori pelati in scatola", kcal:23, carb:3.5, sug:3.5, prot:1.2, fat:0.5, sat:0.1, fib:0.9, salt:0.1 },
  { cat:"Verdure e ortaggi", id:"passata", name:"Passata di pomodoro", kcal:30, carb:5.5, sug:5.0, prot:1.4, fat:0.2, sat:0, fib:1.2, salt:0.1 },
  { cat:"Verdure e ortaggi", id:"cipolla", name:"Cipolla", kcal:28, carb:5.7, sug:5.7, prot:1.0, fat:0.1, sat:0, fib:1.0, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"aglio", name:"Aglio", kcal:44, carb:8.4, sug:2.4, prot:0.9, fat:0.6, sat:0.1, fib:3.1, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"carote", name:"Carote", kcal:39, carb:7.6, sug:7.6, prot:1.1, fat:0.2, sat:0, fib:3.1, salt:0.1 },
  { cat:"Verdure e ortaggi", id:"sedano", name:"Sedano", kcal:23, carb:2.4, sug:2.2, prot:2.3, fat:0.2, sat:0, fib:1.6, salt:0.14 },
  { cat:"Verdure e ortaggi", id:"zucchine", name:"Zucchine", kcal:14, carb:1.4, sug:1.3, prot:1.3, fat:0.1, sat:0, fib:1.2, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"melanzane", name:"Melanzane", kcal:21, carb:2.6, sug:2.6, prot:1.1, fat:0.4, sat:0.1, fib:2.6, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"peperoni", name:"Peperoni", kcal:24, carb:4.2, sug:4.2, prot:0.9, fat:0.3, sat:0.1, fib:1.9, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"patate", name:"Patate", kcal:81, carb:17.9, sug:0.4, prot:2.1, fat:1.0, sat:0.1, fib:1.6, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"spinaci", name:"Spinaci", kcal:35, carb:2.9, sug:0.4, prot:3.4, fat:0.7, sat:0.1, fib:1.9, salt:0.18 },
  { cat:"Verdure e ortaggi", id:"broccoli", name:"Broccoli", kcal:30, carb:3.1, sug:3.1, prot:3.0, fat:0.4, sat:0.1, fib:3.1, salt:0.02 },
  { cat:"Verdure e ortaggi", id:"funghi", name:"Funghi champignon", kcal:22, carb:0.9, sug:0.9, prot:3.9, fat:0.3, sat:0, fib:2.3, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"zucca", name:"Zucca", kcal:19, carb:3.5, sug:2.6, prot:1.1, fat:0.1, sat:0, fib:1.3, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"lattuga", name:"Lattuga", kcal:21, carb:2.2, sug:2.2, prot:1.8, fat:0.4, sat:0.1, fib:1.5, salt:0.02 },
  { cat:"Verdure e ortaggi", id:"rucola", name:"Rucola", kcal:30, carb:3.9, sug:2.0, prot:2.6, fat:0.3, sat:0.1, fib:1.6, salt:0.07 },
  { cat:"Verdure e ortaggi", id:"basilico", name:"Basilico fresco", kcal:32, carb:5.1, sug:0.3, prot:3.1, fat:0.6, sat:0, fib:1.6, salt:0.01 },
  { cat:"Verdure e ortaggi", id:"prezzemolo", name:"Prezzemolo fresco", kcal:30, carb:1.7, sug:1.7, prot:3.7, fat:0.6, sat:0.1, fib:5.0, salt:0.05 },

  // ── Frutta ──
  { cat:"Frutta", id:"mele", name:"Mele", kcal:57, carb:13.7, sug:13.7, prot:0.3, fat:0.1, sat:0, fib:1.7, salt:0.005 },
  { cat:"Frutta", id:"pere", name:"Pere", kcal:41, carb:9.5, sug:9.5, prot:0.3, fat:0.1, sat:0, fib:3.8, salt:0.005 },
  { cat:"Frutta", id:"banane", name:"Banane", kcal:69, carb:15.4, sug:12.8, prot:1.2, fat:0.3, sat:0.1, fib:1.8, salt:0.005 },
  { cat:"Frutta", id:"limoni", name:"Limoni (succo e polpa)", kcal:16, carb:2.3, sug:2.3, prot:0.6, fat:0.2, sat:0, fib:1.9, salt:0.005 },
  { cat:"Frutta", id:"arance", name:"Arance", kcal:39, carb:8.1, sug:8.1, prot:0.7, fat:0.2, sat:0, fib:1.6, salt:0.005 },
  { cat:"Frutta", id:"fragole", name:"Fragole", kcal:30, carb:5.3, sug:5.3, prot:0.9, fat:0.4, sat:0, fib:1.6, salt:0.005 },
  { cat:"Frutta", id:"pesche", name:"Pesche", kcal:28, carb:6.1, sug:6.1, prot:0.7, fat:0.1, sat:0, fib:2.1, salt:0.005 },
  { cat:"Frutta", id:"uva", name:"Uva", kcal:64, carb:15.6, sug:15.6, prot:0.5, fat:0.1, sat:0, fib:1.5, salt:0.005 },

  // ── Frutta secca e semi ──
  { cat:"Frutta secca e semi", id:"mandorle", name:"Mandorle sgusciate", kcal:628, carb:4.6, sug:3.7, prot:22.0, fat:55.3, sat:4.6, fib:12.7, salt:0.01 },
  { cat:"Frutta secca e semi", id:"noci", name:"Noci sgusciate", kcal:689, carb:5.1, sug:3.1, prot:14.3, fat:68.1, sat:6.1, fib:6.2, salt:0.005 },
  { cat:"Frutta secca e semi", id:"nocciole", name:"Nocciole sgusciate", kcal:655, carb:6.1, sug:4.1, prot:13.8, fat:64.1, sat:4.5, fib:8.1, salt:0.01 },
  { cat:"Frutta secca e semi", id:"pinoli", name:"Pinoli", kcal:595, carb:4.0, sug:3.9, prot:31.9, fat:50.3, sat:4.3, fib:4.5, salt:0.01 },
  { cat:"Frutta secca e semi", id:"pistacchi", name:"Pistacchi", kcal:608, carb:8.1, sug:7.6, prot:18.1, fat:56.1, sat:6.9, fib:10.6, salt:0.01 },
  { cat:"Frutta secca e semi", id:"uvetta", name:"Uva passa / uvetta", kcal:283, carb:72.0, sug:72.0, prot:1.9, fat:0.6, sat:0.2, fib:3.1, salt:0.05 },

  // ── Grassi e condimenti ──
  { cat:"Grassi e condimenti", id:"olio_evo", name:"Olio extravergine di oliva", kcal:899, carb:0, sug:0, prot:0, fat:99.9, sat:14.5, fib:0, salt:0 },
  { cat:"Grassi e condimenti", id:"olio_semi", name:"Olio di semi (girasole)", kcal:899, carb:0, sug:0, prot:0, fat:99.9, sat:11.2, fib:0, salt:0 },
  { cat:"Grassi e condimenti", id:"aceto", name:"Aceto di vino", kcal:19, carb:0.6, sug:0.5, prot:0.4, fat:0, sat:0, fib:0, salt:0.02 },
  { cat:"Grassi e condimenti", id:"aceto_balsamico", name:"Aceto balsamico", kcal:88, carb:17.0, sug:15.0, prot:0.5, fat:0, sat:0, fib:0, salt:0.06 },
  { cat:"Grassi e condimenti", id:"maionese", name:"Maionese", kcal:655, carb:2.1, sug:1.4, prot:1.2, fat:70.0, sat:10.5, fib:0, salt:1.5 },
  { cat:"Grassi e condimenti", id:"sale", name:"Sale da cucina", kcal:0, carb:0, sug:0, prot:0, fat:0, sat:0, fib:0, salt:100 },
  { cat:"Grassi e condimenti", id:"pepe", name:"Pepe nero", kcal:255, carb:38.3, sug:0.6, prot:10.9, fat:3.3, sat:1.4, fib:26.5, salt:0.05 },
  { cat:"Grassi e condimenti", id:"concentrato_pomodoro", name:"Concentrato di pomodoro", kcal:88, carb:17.8, sug:13.7, prot:4.9, fat:0.4, sat:0.1, fib:3.0, salt:0.5 },
  { cat:"Grassi e condimenti", id:"brodo_carne", name:"Brodo di carne (pronto)", kcal:9, carb:0.4, sug:0.2, prot:1.1, fat:0.4, sat:0.2, fib:0, salt:0.9 },
  { cat:"Grassi e condimenti", id:"brodo_vegetale", name:"Brodo vegetale (pronto)", kcal:6, carb:0.6, sug:0.3, prot:0.4, fat:0.2, sat:0.1, fib:0, salt:0.9 },
  { cat:"Grassi e condimenti", id:"dado", name:"Dado da brodo", kcal:245, carb:15.0, sug:8.0, prot:12.0, fat:15.5, sat:8.5, fib:0.5, salt:47.0 },

  // ── Cioccolato, cacao e dolci ──
  { cat:"Cioccolato, cacao e dolci", id:"cioccolato_fondente", name:"Cioccolato fondente (70%)", kcal:531, carb:33.0, sug:28.0, prot:7.9, fat:38.0, sat:23.0, fib:10.0, salt:0.02 },
  { cat:"Cioccolato, cacao e dolci", id:"cioccolato_latte", name:"Cioccolato al latte", kcal:552, carb:56.7, sug:54.0, prot:7.0, fat:33.6, sat:20.5, fib:2.1, salt:0.2 },
  { cat:"Cioccolato, cacao e dolci", id:"cacao_amaro", name:"Cacao amaro in polvere", kcal:355, carb:11.5, sug:0.5, prot:20.4, fat:25.6, sat:15.3, fib:29.8, salt:0.05 },
  { cat:"Cioccolato, cacao e dolci", id:"biscotti_secchi", name:"Biscotti secchi", kcal:429, carb:80.4, sug:21.9, prot:7.6, fat:8.1, sat:2.7, fib:2.6, salt:0.5 },
  { cat:"Cioccolato, cacao e dolci", id:"savoiardi", name:"Savoiardi", kcal:392, carb:75.5, sug:41.0, prot:9.5, fat:5.9, sat:1.9, fib:1.8, salt:0.25 },

  // ── Bevande e alcolici (per cucina) ──
  { cat:"Bevande e alcolici (per cucina)", id:"vino_bianco", name:"Vino bianco da tavola", kcal:70, carb:0.1, sug:0.1, prot:0.1, fat:0, sat:0, fib:0, salt:0.01 },
  { cat:"Bevande e alcolici (per cucina)", id:"vino_rosso", name:"Vino rosso da tavola", kcal:75, carb:0.2, sug:0.2, prot:0.1, fat:0, sat:0, fib:0, salt:0.01 },
  { cat:"Bevande e alcolici (per cucina)", id:"birra", name:"Birra chiara", kcal:34, carb:3.5, sug:3.5, prot:0.2, fat:0, sat:0, fib:0, salt:0.005 },
  { cat:"Bevande e alcolici (per cucina)", id:"caffe", name:"Caffè espresso", kcal:2, carb:0.3, sug:0, prot:0.1, fat:0, sat:0, fib:0, salt:0.005 },

  // ── Varie ──
  { cat:"Varie", id:"vaniglia", name:"Vaniglia (bacca/estratto)", kcal:288, carb:12.7, sug:12.7, prot:0.1, fat:0.1, sat:0, fib:0, salt:0.02 },
  { cat:"Varie", id:"cannella", name:"Cannella in polvere", kcal:247, carb:27.5, sug:2.2, prot:4.0, fat:1.2, sat:0.3, fib:53.1, salt:0.03 },
  { cat:"Varie", id:"rosmarino", name:"Rosmarino fresco", kcal:131, carb:13.5, sug:0, prot:3.3, fat:5.9, sat:2.8, fib:14.1, salt:0.07 },
  { cat:"Varie", id:"timo", name:"Timo fresco", kcal:101, carb:10.5, sug:0, prot:5.6, fat:1.7, sat:0.5, fib:14.0, salt:0.02 },
  { cat:"Varie", id:"menta", name:"Menta fresca", kcal:70, carb:5.3, sug:0, prot:3.8, fat:0.9, sat:0.2, fib:8.0, salt:0.08 },
  { cat:"Varie", id:"olive", name:"Olive da tavola", kcal:145, carb:1.0, sug:0.5, prot:0.8, fat:15.0, sat:2.3, fib:4.4, salt:3.5 },
  { cat:"Varie", id:"capperi", name:"Capperi sotto sale (dissalati)", kcal:23, carb:2.4, sug:0.4, prot:2.4, fat:0.9, sat:0.2, fib:3.2, salt:2.5 },
  { cat:"Varie", id:"zafferano", name:"Zafferano", kcal:310, carb:61.5, sug:0, prot:11.4, fat:5.9, sat:1.6, fib:3.9, salt:0.4 },
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
