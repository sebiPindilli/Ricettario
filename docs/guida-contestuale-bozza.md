# Bozza — Guida contestuale per pulsante "i"

Come funziona questo documento: una sezione per ogni schermata o funzione dell'app che merita un testo guida contestuale. Ogni sezione ha tre parti:

- **Dove si trova** — in che schermata/file vive quella funzione, per orientarti nel codice se vuoi controllare.
- **Funzioni della scheda** — cosa fa davvero oggi, dedotto leggendo il codice attuale (non a memoria).
- **Testo guida proposto** — la bozza vera e propria. Tono e lunghezza ricalcano lo stile già usato in `GuideScreen.jsx` (i capitoli "L'idea in un minuto" ecc.), ma più compatti — sono tendine, non pagine.

Modifica pure ogni "Testo guida proposto" liberamente. Quando hai finito, rimandami il file e lo traduco nel codice reale.

**Decisioni prese insieme prima di questa versione** (per ricordarcele):
1. Ogni funzione aperta da una scheda — anche un pop-up come Modalità Cucina o Calcolo Dosi — merita il suo "i" dedicato, non solo le 7 schermate con `GlobalNav`. Questo allarga il documento rispetto alla prima bozza: vedi la sezione **"Funzioni senza pulsante 'i' oggi"** più sotto, e la nota implementativa in fondo.
2. Tema e Copertina: tagliati del tutto, nessuna guida da nessuna parte.
3. Il capitolo FAQ di `GuideScreen` è stato smontato: ogni domanda è confluita nella sezione pertinente qui sotto (segnalato dove).
4. La sezione "Gestione utenti" (admin) è rimandata — vedi l'appendice in fondo, fuori dal giro di revisione principale.

---

## Parte 1 — Schermate con `GlobalNav` (pulsante "i" già esistente)

### 🍽️ Ricette (Libro Ricette — vista schede e vista libro)

**Dove si trova:** `RecipesScreen.jsx` (vista a schede, `activeScreen="recipes"`) e `RecipeFilterBarBook.jsx` (vista libro, `activeScreen="book"`) — stessa tab "Ricette", stesso pulsante "i".

**Funzioni della scheda:**
- Elenco di tutte le ricette del ricettario attivo, con pulsante "＋ Nuova ricetta" in alto
- Ricerca testuale sempre visibile
- Filtro per sezione (Dolci, Salati, …) a pillole, con conteggio ricette
- Filtro per tag (accordion "🏷️ Filtra per tag"), combinabile con la sezione
- Filtro "⭐ Preferiti"
- Interruttore vista **schede** / vista **libro** (sfogliabile con "‹ Prec." / "Succ. ›")

**Testo guida proposto:**

> Qui vivono tutte le tue ricette. Tocca **＋ Nuova ricetta** per aggiungerne una — a mano, fotografando una pagina, o incollando un link.
>
> Usa la **ricerca** 🔍 in alto, le **pillole di sezione** per restringere a Dolci/Salati/ecc., e **🏷️ Filtra per tag** per caratteristiche come "Vegetariano" o "Feste".
>
> L'interruttore **▦ / 📖** in alto a destra passa dalla vista a elenco alla **vista libro**, che sfoglia le ricette una alla volta come un vero ricettario.

---

### 📒 Ricordi (Libro dei Ricordi)

**Dove si trova:** `MemoriesBookScreen.jsx`, `activeScreen="memories"`.

**Funzioni della scheda:**
- Raccoglie tutti i ricordi (foto + racconto) di tutte le ricette, deduplicati
- Pulsante "＋ Nuovo ricordo" in alto
- Vista a **schede**, raggruppate per periodo (diario cronologico, dal più recente)
- Vista **libro** (interruttore ▦/📖), due ricordi per pagina, sfogliabile
- Lightbox a schermo intero toccando la foto in vista schede

**Testo guida proposto:**

> Il diario fotografico del ricettario: foto vere legate ai piatti che avete cucinato insieme, non solo la ricetta ma il momento. Tocca **＋ Nuovo ricordo** per aggiungerne uno.
>
> I ricordi sono ordinati come un diario, dal più recente, raggruppati per periodo. L'interruttore **▦ / 📖** passa dalla vista a schede alla **vista libro**, che apre i ricordi a piena pagina.
>
> Ogni ricordo può essere collegato a una o più ricette: toccando il nome della ricetta sotto la foto ci vai direttamente.

---

### 📸 Nuovo Ricordo

**Dove si trova:** `AddMemoryScreen.jsx`, `activeScreen="add"`.

**Funzioni della scheda:**
- Form: data (default oggi), foto (upload) o in alternativa un'emoji, titolo breve opzionale, racconto opzionale
- Associazione obbligatoria a una o più ricette

**Testo guida proposto:**

> Compila data, una foto (o un'emoji se non ne hai una a portata di mano) e — se vuoi — un titolo e un racconto di com'è andata.
>
> L'unica cosa obbligatoria oltre alla foto è **collegare almeno una ricetta**: è quello che rende il ricordo ritrovabile dalla scheda della ricetta stessa, non solo dal diario.

---

### 🧊 Svuota Frigo

**Dove si trova:** `EmptyFridgeScreen.jsx`, `activeScreen="fridge"`. Due fasi interne: selezione ingredienti e risultati.

**Funzioni della scheda:**
- Fase 1 — selezione: ingredienti/aggregati per categoria, con ricerca; ingredienti "base" preselezionati automaticamente; tocco lungo su un aggregato mostra cosa include
- Fase 2 — risultati: ricette ordinate per % di ingredienti posseduti, dettaglio "✓ HAI" / "✗ MANCA"; da ogni risultato si apre la ricetta, si avvia Modalità Spesa (solo ciò che manca) o Modalità Cucina

**Testo guida proposto:**

> Segna cosa hai in casa e l'app ti dice cosa puoi cucinare **subito** e cosa ti manca di poco. Gli ingredienti "base" (sale, farina, olio…) partono già selezionati — deselezionali se non è il tuo caso.
>
> Tieni premuto su una voce con l'icona ⊕ per vedere cosa raggruppa.
>
> Tocca **"Mostra ricette"** per l'elenco ordinato da quella con più ingredienti disponibili. Da lì puoi aprire la ricetta, mandare gli ingredienti mancanti in **Lista Spesa**, o partire con **Modalità Cucina**.
>
> 💡 Più aggregati e categorie hai impostato in **Organizza**, più questo elenco è preciso. Sarà l'applicazione stessa a suggerirti se esistono azioni da intraprendere per migiorare l'elenco.

---

### 🛒 Lista Spesa

**Dove si trova:** `ShoppingListScreen.jsx`, `activeScreen="shopping"`.

**Funzioni della scheda:**
- Aggrega gli ingredienti aggiunti da più ricette, sommando quantità con la stessa unità e raggruppando per aggregato
- Sezione "🧂 Controlla in dispensa" per ingredienti base, separata da quelli da comprare
- Selettore "Separate / Converti in…" per ingredienti con più unità convertibili
- "Ricette attive" con rimozione in blocco
- Rimozione singola voce, svuota tutto, copia negli appunti

**Testo guida proposto:**

> Qui finiscono gli ingredienti che aggiungi da una ricetta. L'app somma da sola le quantità uguali e unisce gli ingredienti aggregati, secondo le regole di Organizza.
>
> Gli ingredienti **base** finiscono in "Controlla in dispensa": conferma **✅ Ce l'ho** se li hai già, o **🛒 Non ce l'ho** per spostarli tra quelli da comprare.
>
> Il tasto **📋 Copia tutto** ti dà il testo pronto da incollare ovunque.
>
> 💡 Più aggregati e equivalenze hai impostato in **Organizza**, più questo elenco è preciso. Sarà l'applicazione stessa a suggerirti se esistono azioni da intraprendere per migiorare l'elenco.
> 🔑 La lista resta collegata alle ricette: se ne modifichi una già in lista, l'app ti chiede se aggiornare le quantità, lasciarle com'erano, o toglierla dalla spesa. *(era la FAQ "se cambio una ricetta, la spesa si aggiorna?" — già coperta qui, nessuna aggiunta necessaria)*

---

### ⚙️ Organizza Ingredienti

**Dove si trova:** `OrganizeIngredientsScreen.jsx`, montata da `ricettario-v23.jsx` con `activeScreen="organize"`.

**Funzioni della scheda:**
- Elenco ingredienti con ricerca e filtro "Da gestire" (solo problemi: categoria/nutrizione/equivalenza mancante)
- Rinomina ingrediente (senza perdere collegamenti)
- Editor inline per categoria, nutrizione, equivalenza per singolo ingrediente
- Gestione **Aggregati**, con suggerimenti automatici di somiglianze
- Gestione **Categorie** (scaffali)
- Gestione **Equivalenze** (conversioni tra unità)
- Database alimenti (ufficiale + personalizzati) per i valori nutrizionali
- **Ingredienti non utilizzati**: quelli non più referenziati da nessuna ricetta, eliminabili in blocco

**Testo guida proposto:**

> Il "cervello" del ricettario: qui imposti le regole che rendono intelligenti Frigo, Spesa e Nutrizione.
>
> **⊕ Aggregati** unisce ingredienti simili sotto un nome unico (es. zucchero bianco e zucchero semolato bianco sono la stessa cosa). **🏷️ Categorie** sono gli scaffali che ordinano Frigo e Spesa. **⚖️ Equivalenze** sono le conversioni tra unità (es. 1 cucchiaino di sale = 5 g di sale). **🍎 Valori nutrizionali** collega i tuoi ingredienti al database alimenti per il calcolo delle calorie e dei valori nutrizionali.
>
> Usa il filtro **"Da gestire"** per vedere solo ciò che manca.
>
> 🔑 Non è obbligatorio compilarlo per usare l'app: senza, tutto funziona comunque, solo "alla cieca" (niente somme tra ingredienti simili, niente calorie). Sarà l'applicazione stessa a reindirizzarti qui dalle altre sezioni se esistono delle azioni da intraprendere per migliorare il funzionamento. *(FAQ "devo compilare Organizza?")*

---

### 📚 I miei Ricettari

**Dove si trova:** `BooksScreen.jsx`, `activeScreen="books"`.

**Funzioni della scheda:**
- Elenco ricettari, cambio attivo, rinomina, predefinito all'avvio
- Ricettari condivisi: membri (invito email, permessi lettura/modifica, rimozione), eliminazione (solo proprietario)
- Creazione nuovo ricettario condiviso (fino a 10 di proprietà)
- Esportazione ricette: copia in altro proprio ricettario, o codice per chi non è nel libro
- Import da codice

**Testo guida proposto:**

> Qui gestisci i tuoi ricettari: puoi averne più di uno e passare dall'uno all'altro con **Apri**.
>
> Due modi per condividere: **invitare un membro** (email) rende il libro **sincronizzato** — stesso ricettario per entrambi, pensato per famiglia/coppia. **Esportare ricette** genera invece un **codice**: chi lo riceve ottiene una copia indipendente, non collegata alle tue modifiche future.
>

---

## Parte 2 — Funzioni senza pulsante "i" oggi (aperte da dentro una scheda)

Nessuna di queste ha `GlobalNav` — sono overlay, popup o schermate di flusso. Per dargli un "i" servirà un pattern nuovo (vedi nota in fondo). Ho scritto comunque i testi, così sono pronti quando si implementa.

### 📖 Dettaglio Ricetta

**Dove si trova:** `RecipeScreen.jsx`, aperta toccando una ricetta da Ricette, Frigo o Ricordi.

**Funzioni della scheda:**
- Tab **Ingredienti / Preparazione / Nutrizione**
- Header: 📤 Esporta, ⭐ Preferiti, ✏️ Modifica, 🗑️ Elimina, interruttore vista App/📖 Libro
- Foto del piatto (upload/rimozione)
- Ricordi collegati e commenti liberi in fondo pagina
- Punto di partenza per Cucina, Calcolo dosi, Modalità Spesa, Esporta

**Testo guida proposto:**

> La scheda di ogni ricetta. **Ingredienti**, **Preparazione** e **Nutrizione** mostrano cosa serve, come si prepara, e (se collegata in Organizza) calorie e macronutrienti.
>
> Nell'header: **📤** esporta/condivide, **⭐** segna preferita, **✏️** modifica, **🗑️** elimina. L'interruttore **App/📖** la mostra come pagina di ricettario stampato.
>
> **⚖️ Calcolo dosi** ti permette di adattare automaticamente le quantità di ingredienti in base al numero di dosi che vuoi preparare, o di adattarle in base ad un ingrediente limitante (es. la ricetta prevede 100g di farina ma io ne ho solo 80g, come cambiano in proporzione tutte le altre quantità?). Da qui si aggiornano in automatico le quantità da inviare in **🛒 Spesa** o da visualizzare in **👨‍🍳 Cucina**. 
>
> Più in basso: i **ricordi** collegati a questa ricetta e uno spazio per **commenti** tuoi (es. variazioni alla ricetta da tenere a mente per il futuro, senza modificare la ricetta di base). 
>
> 💡 Più valori nutrizionali ed equivalenze hai impostato in **Organizza**, più il calcolo dei valori nutrizionali della ricetta sarà preciso. Sarà l'applicazione stessa a suggerirti se esistono azioni da intraprendere per migiorare il calcolo.

---

### 👨‍🍳 Modalità Cucina

**Dove si trova:** `screens/CookingMode.jsx`, overlay a schermo intero aperto da una ricetta (dopo aver scelto le dosi) o dai risultati di Svuota Frigo.

**Funzioni della scheda:**
- Intro con lista ingredienti già scalati
- Un passo alla volta, con foto opzionali per passo
- Barra di progresso cliccabile, raggruppata per sezione
- Tap a destra = avanti, tap a sinistra = indietro
- Schermata finale "Buon appetito"

**Testo guida proposto:**

> Guida a schermo intero per cucinare senza scorrere con le mani sporche. Si parte da un riepilogo ingredienti, poi un passo alla volta.
>
> **Tocca a destra** per andare avanti, **a sinistra** per tornare indietro. La barra in alto mostra tutti i passi: toccane uno per saltarci direttamente.

---

### ⚖️ Calcolo Dosi

**Dove si trova:** `ServingsDialog.jsx`, popup aperto da una ricetta (⚖️ Calcolo dosi) o dai risultati di Svuota Frigo.

**Funzioni della scheda:**
- **Standard** — dosi della ricetta
- **Persone** — contatore ± (1–50), ricalcola tutto
- **Ingrediente** — scegli un ingrediente e quanto ne hai, l'app scala la ricetta di conseguenza

**Testo guida proposto:**

> Scegli come calcolare le quantità prima di **Cucina** o **Spesa**: **Standard** lascia le dosi originali, **Persone** ricalcola per i commensali, **Ingrediente** parte da "ho solo 200 g di farina, quanto mi viene?" e scala tutto.
>
> La scelta vale solo per questa apertura — riaprendo la ricetta si riparte da Standard.

---

### 🛒 Modalità Spesa *(popup — non è la Lista Spesa)*

**Dove si trova:** `ShoppingMode.jsx`, popup aperto da una ricetta (🛒 Spesa) o dai risultati di Svuota Frigo, dopo aver scelto le dosi.

**Funzioni della scheda:**
- Checklist di tutti gli ingredienti della ricetta (già scalati)
- Preselezionati tutti, o solo i mancanti se aperto da Svuota Frigo
- Deseleziona quelli che hai già, poi conferma per aggiungerli alla Lista Spesa

**Testo guida proposto:**

> L'ultimo passaggio prima che gli ingredienti finiscano davvero nella **Lista Spesa**: una checklist di tutto ciò che serve, già nelle quantità scelte. Deseleziona quello che hai già in casa, poi conferma per aggiungere solo il resto.

---

### 📤 Esporta

**Dove si trova:** `ExportFlow.jsx`, popup aperto da una ricetta (tasto 📤).

**Funzioni della scheda:**
- Passo 1: solo questa ricetta o selezione multipla
- Passo 2 (se multipla): checklist con "seleziona tutto"
- Passo 3: formato — link/codice (copia indipendente per un altro ricettario) o PDF

**Testo guida proposto:**

> Porta le tue ricette fuori dall'app. Scegli se esportarne una sola o più di una, poi il formato: un **link/codice** (chi lo riceve lo incolla nel suo ricettario — copia indipendente, non sincronizzata) o un **PDF** pronto da stampare o inviare.

---

### ✏️ Nuova Ricetta / Modifica Ricetta

**Dove si trova:** `NewRecipeScreen.jsx` (da "＋ Nuova ricetta") e `EditScreen.jsx` (dal tasto ✏️ in una ricetta) — quasi identiche.

**Funzioni della scheda:**
- Tab **Info** (titolo, sezione, fonte/link, tempi prep/cottura, porzioni, tag)
- Tab **Ingredienti** (nome, quantità, unità, autocomplete)
- Tab **Preparazione** (step, anche in sottosezioni, con foto)
- Tab **Note**
- Anteprima live (colore/emoji/titolo) in alto

**Testo guida proposto:**

> Il form per scrivere o correggere una ricetta, in quattro tab: **Info** (titolo, sezione, fonte, tempi, porzioni, tag), **Ingredienti** (scritti bene qui alimentano da soli Spesa, Frigo e Nutrizione), **Preparazione** (i passi, anche raggruppati, con foto) e **Note**.
>

---

### 📷 Scansiona / Importa dalla Galleria

**Dove si trova:** `ScanScreen.jsx`, aperta dall'hub "＋ Nuova ricetta" (📷 fotocamera o 🗃️ galleria).

**Funzioni della scheda:**
- Carica una o più foto (scattate o dalla libreria)
- L'AI legge il testo (OCR) ed estrae la ricetta
- Apre l'editor già precompilato per controllo/correzione

**Testo guida proposto:**

> Fotografa una ricetta scritta a mano o stampata (o scegli una foto già scattata) e lascia che l'AI la legga per te. Dopo l'analisi ti ritrovi nel form di **Nuova Ricetta**, già compilato: controlla e correggi prima di salvare, l'estrazione automatica non è infallibile.

---

### 🔗 Aggiungi da Link

**Dove si trova:** `AddFromLinkScreen.jsx`, aperta dall'hub "＋ Nuova ricetta" (🔗).

**Funzioni della scheda:**
- Incolla l'URL di una ricetta trovata online
- In alternativa (se il sito blocca l'accesso): incolla il testo o carica un file HTML
- L'AI estrae la ricetta e apre l'editor precompilato

**Testo guida proposto:**

> Incolla il link di una ricetta trovata online: l'AI la legge e ti porta al form di **Nuova Ricetta** già compilato, pronto da controllare e salvare.
>
> 💡 Se il sito blocca l'accesso automatico, puoi incollare il testo della pagina o caricare il file HTML salvato dal browser.

---

*Nota su `AddRecipeHubScreen.jsx` (il menu con le 4 scelte "manuale / fotocamera / galleria / link"): non gli ho scritto un "i" — è già autoesplicativo, ogni scelta ha icona e descrizione in una riga. Dimmi se non sei d'accordo.*

---

## Guida generale — cosa resta in `GuideScreen.jsx`

- **💡 L'idea in un minuto** (capitolo `idea`) — invariato
- **🗺️ Come tutto si collega** (capitolo `mappa`) — invariato, con i tre diagrammi tecnici
- La domanda FAQ **"Da dove comincio?"** resta qui (dentro `idea`): è l'unica delle FAQ che non riguarda una sezione specifica, quindi non aveva un posto naturale altrove — segnalo la scelta, dimmi se preferisci diversamente
- **Tagliato del tutto:** il capitolo "🎨 L'aspetto" (Tema/Copertina) — nessuna guida da nessuna parte, come deciso
- **Smontato:** il capitolo "❓ Domande frequenti" — ogni domanda è confluita nella sezione pertinente qui sopra (segnalato con *"FAQ …"* in corsivo ovunque compare)

---

## Appendice — posticipato, fuori da questo giro di revisione

### 🔑 Gestione utenti *(solo admin)*

**Dove si trova:** `AdminUsersScreen.jsx`, `activeScreen="adminUsers"` — visibile solo a chi ha ruolo `admin`.

**Testo guida proposto (già scritto, da rivedere quando torna in scope):**

> Solo per chi ha ruolo admin. Qui decidi chi può accedere all'app: aggiungi un'email, scegli se **base** o **tester**, e ottieni subito un messaggio d'invito pronto da copiare e mandare.
>
> Il ruolo **admin** non è assegnabile da qui per sicurezza — va gestito direttamente da Firebase Console.

---

## Nota implementativa (non oggi, ma da tenere presente)

La "Parte 2" sopra copre 8 funzioni che oggi non hanno alcun pulsante "i", perché non passano da `GlobalNav`. Implementarle richiederà un pattern leggero nuovo — probabilmente una piccola icona "i" nell'header di ciascun overlay/schermata, simile a quella di `GlobalNav` ma senza il resto della barra. È un lavoro di UI in più rispetto al piano iniziale (che presumeva di riempire solo la tendina già esistente in `GlobalNav`), da dimensionare quando arriviamo alla fase di implementazione vera e propria.

---

## Ricognizione — copertura funzioni vs. guida

| Funzione reale dell'app | Dove vive | Coperta da |
|---|---|---|
| Elenco/ricerca/filtri ricette, vista schede/libro | RecipesScreen, RecipeFilterBarBook | ✅ Parte 1 — "Ricette" |
| Dettaglio ricetta (tab Ingredienti/Preparazione/Nutrizione, header) | RecipeScreen | ✅ Parte 2 — "Dettaglio Ricetta" (nessun "i" oggi) |
| Modalità Cucina | CookingMode | ✅ Parte 2 (nessun "i" oggi) |
| Calcolo dosi | ServingsDialog | ✅ Parte 2 (nessun "i" oggi) |
| Modalità Spesa (popup da ricetta) | ShoppingMode | ✅ Parte 2 (nessun "i" oggi) |
| Esportazione (PDF / codice) | ExportFlow | ✅ Parte 2 (nessun "i" oggi) |
| Creazione manuale / modifica ricetta | NewRecipeScreen, EditScreen | ✅ Parte 2 (nessun "i" oggi) |
| Scansione foto → ricetta | ScanScreen | ✅ Parte 2 (nessun "i" oggi) |
| Importa da link → ricetta | AddFromLinkScreen | ✅ Parte 2 (nessun "i" oggi) |
| Hub scelta metodo creazione | AddRecipeHubScreen | ⚠️ deliberatamente non coperta — già autoesplicativa |
| Ricordi: elenco, vista libro | MemoriesBookScreen | ✅ Parte 1 |
| Creazione ricordo | AddMemoryScreen | ✅ Parte 1 |
| Svuota Frigo | EmptyFridgeScreen | ✅ Parte 1 |
| Lista Spesa | ShoppingListScreen | ✅ Parte 1 |
| Organizza | OrganizeIngredientsScreen | ✅ Parte 1 |
| Gestione ricettari, condivisione | BooksScreen | ✅ Parte 1 |
| Gestione utenti (whitelist) | AdminUsersScreen | ⏸️ posticipata — vedi appendice |
| Tema/aspetto | ThemePickerScreen | ❌ tagliata del tutto, come deciso |
| Copertina | CoverScreen | ❌ tagliata del tutto, come deciso |
| Ricerca dedicata (SearchScreen) | `SearchScreen.jsx` | ℹ️ importata ma mai montata in `ricettario-v23.jsx` — sembra codice morto, non un buco di guida. Segnalo, non serve azione ora |

**In sintesi:** con la Parte 2 aggiunta, la copertura è quasi completa. Restano fuori solo scelte deliberate (hub autoesplicativo, Tema/Copertina tagliati, Admin posticipato) e un possibile codice morto (SearchScreen) che non riguarda la guida ma vale la pena notare.
