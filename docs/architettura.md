# Architettura dei dati — Il mio Ricettario

Questo documento descrive come i dati si muovono nell'app, dopo il refactoring che ha
spostato le schermate in `src/screens/`, i pezzi riusabili in `src/components/`, la logica
pura in `src/utils/`, i dati iniziali in `src/data/` e il tema/contesto in `src/context.js`.
Lo stato vero e proprio vive tutto in `AppInner` (dentro `src/ricettario-v23.jsx`), che lo
passa alle schermate tramite props.

Solo documentazione: nessun file di codice è stato modificato per generare questi diagrammi.

---

## Diagramma 1 — Vista d'insieme

Le grandi aree dell'app: da dove entrano i dati digitati dall'utente, dove restano
"in memoria" (gli stati di `AppInner`), e quali schermate li leggono per mostrarli.
Le frecce piene sono scritture verso lo stato; quelle tratteggiate sono letture.

```mermaid
flowchart LR
    subgraph INPUT["📥 Dati in ENTRATA — form utente"]
        NR["📝 NewRecipeScreen<br/>crea/precompila ricetta"]
        ED["✏️ EditScreen<br/>modifica ricetta"]
        SC["📷 ScanScreen<br/>scansiona foto ricetta"]
        AM["📸 AddMemoryScreen<br/>nuovo ricordo + foto"]
        OI["⚙️ OrganizeIngredientsScreen<br/>aggregati · categorie · nutrizione · equivalenze"]
        EF["🧊 EmptyFridgeScreen<br/>scegli ingredienti disponibili"]
        BS["📚 BooksScreen<br/>crea/condividi/importa ricettari"]
    end

    subgraph STATE["🗄️ Stato centrale — AppInner (useState)"]
        RS[("recipes<br/>(con memories, comments, favorite)")]
        NM[("nutritionMap")]
        EQ[("equivalences")]
        IC[("ingredientCategories")]
        AG[("aggregates")]
        SBI[("sourceByIngredient")]
        CF[("customFoods")]
        ID[("ingredientDict")]
        SL[("shoppingList")]
        BK[("books / activeBookId")]
    end

    subgraph VIEW["📖 Schermate di LETTURA"]
        RC["📖 RecipeScreen<br/>scheda ricetta + NutritionCard"]
        CM["👩‍🍳 CookingMode<br/>(modalità dentro RecipeScreen)"]
        RL["🍝 RecipesScreen / BookViewScreen<br/>elenco e libro"]
        SLv["🛒 ShoppingListScreen"]
        MB["📔 MemoriesBookScreen"]
    end

    SC -- "saveScanned() → scanDraft" --> NR
    NR -- "saveNewRecipe(draft)" --> RS
    ED -- "updateRecipe(updated)" --> RS
    AM -- "addMemory(mem)" --> RS
    EF -- "addToShoppingList(...)" --> SL
    BS -- "createBook / switchBook / importShareCode" --> BK
    BS -. "copyRecipesToBook" .-> RS

    OI <-. "onSetSourcePriority / onSetIngredientCats" .-> SBI
    OI <-. "legge/scrive" .-> IC
    OI <-. "onSaveAggregate / onDeleteAggregate" .-> AG
    OI <-. "onSaveEquivalence" .-> EQ
    OI <-. "onSaveNutritionMapping / onSaveCustomFood" .-> NM
    OI <-. "legge/scrive" .-> CF

    RS -.-> RC
    RS -.-> RL
    RS -.-> MB
    NM -.-> RC
    EQ -.-> RC
    AG -.-> RC
    SBI -.-> RC
    ID -.-> RC
    RC --> CM

    SL -.-> SLv
    AG -.-> SLv
    EQ -.-> SLv
    ID -.-> SLv

    AG -.-> EF
    IC -.-> EF
    ID -.-> EF
```

**Note di lettura:**
- `memories` e `comments` non sono uno stato globale a parte: vivono dentro ogni ricetta
  (`recipe.memories`, `recipe.comments`). `MemoriesBookScreen` li raccoglie da tutte le
  ricette per mostrare il "Libro dei Ricordi".
- `OrganizeIngredientsScreen` è l'unica schermata che **legge e scrive insieme** quasi tutto
  lo stato "di sistema" (categorie, aggregati, nutrizione, equivalenze, priorità delle fonti):
  è il pannello di configurazione condiviso da tutto il resto dell'app.
- `AddFromLinkScreen` non è nel diagramma: è un segnaposto ("in arrivo"), non scrive ancora
  su nessuno stato.
- `books` con `data:null` per il libro attivo significa che i dati del ricettario in uso
  vivono negli stati sopra; cambiare libro (`switchBook`) fa uno snapshot dello stato
  corrente dentro `books` e ricarica quello nuovo.

---

## Diagramma 2 — Zoom sul cuore: nutrizione + aggregati

Questo è il flusso più "intelligente" dell'app: come si calcola la nutrizione di una
ricetta tenendo conto dell'ereditarietà dagli aggregati. L'idea chiave è che ogni
ingrediente ha un **ordine di priorità delle fonti** (`sourcePriorityFor`), e le tre
caratteristiche (nutrizione, equivalenze, categorie) lo usano ciascuna a modo suo per
decidere "chi vince": l'ingrediente stesso o uno degli aggregati di cui è membro.

```mermaid
flowchart TD
    ING["Ingrediente nella ricetta<br/>{name, qty, unit}"]
    DICT["resolveIngId(dictIdx, name)<br/>via ingredientDict + ingDictIndex"]
    KEY["ingKey<br/>(id univoco dell'ingrediente)"]

    ING --> DICT --> KEY

    PRIO["sourcePriorityFor(ingKey, aggregates, sourceByIngredient)<br/>['ingredient', aggId, ...] in ordine di priorità<br/>(utils/aggregates.js)"]
    KEY --> PRIO

    AGGS[("Aggregato es. 'Zuccheri'<br/>members: [...ingredienti]")]
    CUSTOM["OrganizeIngredientsScreen<br/>onSetSourcePriority → sourceByIngredient"]
    AGGS -. "l'ingrediente è suo membro" .-> PRIO
    CUSTOM -. "personalizza l'ordine" .-> PRIO

    subgraph RESOLVE["Risoluzione fonte — una per caratteristica"]
        ENK["effectiveNutritionKey<br/>prima fonte presente in nutritionMap"]
        EEK["effectiveEquivalenceKey<br/>prima fonte presente in equivalences"]
        ECAT["effectiveCategories<br/>prima fonte con categorie proprie"]
    end

    PRIO --> ENK
    PRIO --> EEK
    PRIO --> ECAT

    NM[("nutritionMap")]
    EQ[("equivalences")]
    IC[("ingredientCategories / agg.categories")]

    ENK --> NM
    EEK --> EQ
    ECAT --> IC

    VAL["Valori per 100g<br/>NUTRITION_DB oppure customFoods"]
    NM --> VAL

    GR["ingredientToGrams(ing, equivalences, ...)<br/>quantità → grammi effettivi"]
    EQ --> GR

    CRN["computeRecipeNutrition(recipe, ...)<br/>(dentro NutritionCard.jsx)"]
    VAL --> CRN
    GR --> CRN
    ING -. "qty, nutriPct" .-> CRN

    OUT["{ total, perServing, per100, covered, excluded, details }"]
    CRN --> OUT

    CARD["🍎 NutritionCard<br/>scheda Nutrizione nella ricetta"]
    OUT --> CARD

    ICAT_UI["EmptyFridgeScreen / OrganizeIngredientsScreen<br/>mostrano categoria effettiva (con 'eredita da «Nome»')"]
    ECAT -.-> ICAT_UI
```

**Note di lettura:**
- `sourcePriorityFor` scarta automaticamente le priorità salvate che non sono più valide
  (aggregato cancellato, ingrediente non più membro): non serve nessuna pulizia manuale.
- `effectiveCategories` è leggermente diverso dagli altri due: non ritorna solo una
  "chiave" ma già il risultato pronto (`{ categories, inheritedFrom }`), perché le categorie
  di un aggregato non vivono in una mappa condivisa ma direttamente su `agg.categories`.
- Se nessuna fonte nell'ordine di priorità possiede il dato (es. nessuna mappatura
  nutrizionale, né sull'ingrediente né sugli aggregati), l'ingrediente finisce in
  `excluded`/`details` con lo stato `"unlinked"` — mai un valore inventato.
- `ingredientToGrams` converte in grammi solo se l'unità è di peso diretta (g/kg/ml/l/cl/dl)
  oppure se l'equivalenza risolta ha una `base` di peso con un fattore per quell'unità.

---

## Diagramma 3 — Creazione/importazione di una ricetta

Flusso a parte perché intreccia tre percorsi di ingresso (manuale, scansione, link) che
convergono tutti sullo stesso form, e usa uno stato-ponte temporaneo (`scanDraft`) che
il codice commenta esplicitamente: *"NON salva subito, ma apre il form manuale
precompilato... così si possono correggere prima di salvare."*

```mermaid
flowchart LR
    HUB["➕ AddRecipeHubScreen<br/>scegli come aggiungere"]

    HUB --> MANUAL["📝 Manuale"]
    HUB --> SCANBTN["📷 Scansiona foto"]
    HUB --> LINKBTN["🔗 Da link<br/>(AddFromLinkScreen — placeholder)"]

    SCANBTN --> SC["ScanScreen<br/>OCR sulla foto"]
    SC -- "onSave → saveScanned(name, tags, ocrData, ...)" --> SD["scanDraft<br/>(stato temporaneo in AppInner)"]
    SD -- "initialDraft" --> NRS["📝 NewRecipeScreen<br/>form precompilato, da rivedere"]
    MANUAL --> NRS

    NRS -- "onSave → normalizeIngredients + saveNewRecipe(draft)" --> RS[("recipes")]

    EDT["✏️ EditScreen<br/>(da una ricetta esistente)"]
    EDT -- "onSave → normalizeIngredients + updateRecipe(updated)" --> RS

    RS -- "setSelected + setScreen('recipe')" --> RC["📖 RecipeScreen"]
```

**Note di lettura:**
- `scanDraft` esiste solo per far transitare i dati letti dalla foto (OCR) dentro il form
  di `NewRecipeScreen`: non tocca mai direttamente `recipes`.
- Sia la creazione (`saveNewRecipe`) sia la modifica (`updateRecipe`, via `EditScreen`)
  passano dalla stessa funzione `normalizeIngredients` prima di scrivere su `recipes`, per
  garantire coerenza dei dati (quantità numeriche, righe vuote scartate, `nutriPct`
  validata).
- `AddFromLinkScreen` è collegato al menu ma non è ancora attivo: mostra un messaggio
  "in arrivo" (`ComingSoon`) e non scrive nulla.

---

*Generato leggendo `src/ricettario-v23.jsx` (funzione `AppInner`), `src/utils/aggregates.js`,
`src/utils/helpers.js`, `src/components/NutritionCard.jsx` e le schermate in `src/screens/`.*
