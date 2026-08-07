// ══════════════════════════════════════════════════════════════
// TESTI GUIDA CONTESTUALE — un blocco per ogni pulsante "i"
// dell'app. Fonte: docs/guida-contestuale-bozza.md (rivisto).
// Tutti aprono dentro InfoButton, che ha un solo aspetto fisso
// (sfondo, font, colore testo) indipendentemente da dove si apre
// — niente colore esplicito da impostare qui, si eredita dal
// wrapper del popup.
// ══════════════════════════════════════════════════════════════
const p = { margin:"7px 0" };
const pFirst = { margin:"0 0 7px" };
const pLast = { margin:"7px 0 0" };

// ── Parte 1 — schermate con GlobalNav ──────────────────────────

export const guideRicette = (
  <>
    <p style={pFirst}>Qui vivono tutte le tue ricette. Tocca <b>＋ Nuova ricetta</b> per aggiungerne una — a mano, fotografando una pagina, o incollando un link.</p>
    <p style={p}>Usa la <b>ricerca</b> 🔍 in alto, le <b>pillole di sezione</b> per restringere a Dolci/Salati/ecc., e <b>🏷️ Filtra per tag</b> per caratteristiche come "Vegetariano" o "Feste".</p>
    <p style={pLast}>L'interruttore <b>▦ / 📖</b> in alto a destra passa dalla vista a elenco alla <b>vista libro</b>, che sfoglia le ricette una alla volta come un vero ricettario.</p>
  </>
);

export const guideRicordi = (
  <>
    <p style={pFirst}>Il diario fotografico del ricettario: foto vere legate ai piatti che avete cucinato insieme, non solo la ricetta ma il momento. Tocca <b>＋ Nuovo ricordo</b> per aggiungerne uno.</p>
    <p style={p}>I ricordi sono ordinati come un diario, dal più recente, raggruppati per periodo. L'interruttore <b>▦ / 📖</b> passa dalla vista a schede alla <b>vista libro</b>, che apre i ricordi a piena pagina.</p>
    <p style={pLast}>Ogni ricordo può essere collegato a una o più ricette: toccando il nome della ricetta sotto la foto ci vai direttamente.</p>
  </>
);

export const guideNuovoRicordo = (
  <>
    <p style={pFirst}>Compila data, una foto (o un'emoji se non ne hai una a portata di mano) e — se vuoi — un titolo e un racconto di com'è andata.</p>
    <p style={pLast}>L'unica cosa obbligatoria oltre alla foto è <b>collegare almeno una ricetta</b>: è quello che rende il ricordo ritrovabile dalla scheda della ricetta stessa, non solo dal diario.</p>
  </>
);

export const guideFrigo = (
  <>
    <p style={pFirst}>Segna cosa hai in casa e l'app ti dice cosa puoi cucinare <b>subito</b> e cosa ti manca di poco. Gli ingredienti "base" (sale, farina, olio…) partono già selezionati — deselezionali se non è il tuo caso.</p>
    <p style={p}>Tieni premuto su una voce con l'icona ⊕ per vedere cosa raggruppa.</p>
    <p style={p}>Tocca <b>"Mostra ricette"</b> per l'elenco ordinato da quella con più ingredienti disponibili. Da lì puoi aprire la ricetta, mandare gli ingredienti mancanti in <b>Lista Spesa</b>, o partire con <b>Modalità Cucina</b>.</p>
    <p style={pLast}>💡 Più aggregati e categorie hai impostato in <b>Organizza</b>, più questo elenco è preciso. Sarà l'applicazione stessa a suggerirti se esistono azioni da intraprendere per migliorare l'elenco.</p>
  </>
);

export const guideSpesa = (
  <>
    <p style={pFirst}>Qui finiscono gli ingredienti che aggiungi da una ricetta. L'app somma da sola le quantità uguali e unisce gli ingredienti aggregati, secondo le regole di Organizza.</p>
    <p style={p}>Gli ingredienti <b>base</b> finiscono in "Controlla in dispensa": conferma <b>✅ Ce l'ho</b> se li hai già, o <b>🛒 Non ce l'ho</b> per spostarli tra quelli da comprare.</p>
    <p style={p}>Il tasto <b>📋 Copia tutto</b> ti dà il testo pronto da incollare ovunque.</p>
    <p style={p}>💡 Più aggregati e equivalenze hai impostato in <b>Organizza</b>, più questo elenco è preciso. Sarà l'applicazione stessa a suggerirti se esistono azioni da intraprendere per migliorare l'elenco.</p>
    <p style={pLast}>🔑 La lista resta collegata alle ricette: se ne modifichi una già in lista, l'app ti chiede se aggiornare le quantità, lasciarle com'erano, o toglierla dalla spesa.</p>
  </>
);

export const guideOrganizza = (
  <>
    <p style={pFirst}>Il "cervello" del ricettario: qui imposti le regole che rendono intelligenti Frigo, Spesa e Nutrizione.</p>
    <p style={p}><b>⊕ Aggregati</b> unisce ingredienti simili sotto un nome unico (es. zucchero bianco e zucchero semolato bianco sono la stessa cosa). <b>🏷️ Categorie</b> sono gli scaffali che ordinano Frigo e Spesa. <b>⚖️ Equivalenze</b> sono le conversioni tra unità (es. 1 cucchiaino di sale = 5 g di sale). <b>🍎 Valori nutrizionali</b> collega i tuoi ingredienti al database alimenti per il calcolo delle calorie e dei valori nutrizionali.</p>
    <p style={p}>Usa il filtro <b>"Da gestire"</b> per vedere solo ciò che manca.</p>
    <p style={pLast}>🔑 Non è obbligatorio compilarlo per usare l'app: senza, tutto funziona comunque, solo "alla cieca" (niente somme tra ingredienti simili, niente calorie). Sarà l'applicazione stessa a reindirizzarti qui dalle altre sezioni se esistono delle azioni da intraprendere per migliorare il funzionamento.</p>
  </>
);

export const guideLibri = (
  <>
    <p style={pFirst}>Qui gestisci i tuoi ricettari: puoi averne più di uno e passare dall'uno all'altro con <b>Apri</b>.</p>
    <p style={p}>Due modi per condividere: <b>invitare un membro</b> (email) rende il libro <b>sincronizzato</b> — stesso ricettario per entrambi, pensato per famiglia/coppia. <b>Esportare ricette</b> genera invece un <b>codice</b>: chi lo riceve ottiene una copia indipendente, non collegata alle tue modifiche future.</p>
    <p style={p}>Chi inviti ha un <b>ruolo</b>: il <b>collaboratore</b> ha gli stessi poteri di gestione del proprietario tranne eliminare il libro (può anche invitare e gestire redattori/lettori); il <b>redattore</b> aggiunge e modifica ricette, ricordi e Organizza, ma non può eliminare nulla; il <b>lettore</b> può solo consultare. Puoi cambiare il ruolo di un membro o rimuoverlo in qualsiasi momento dalla sua scheda.</p>
    <p style={pLast}>🔑 Solo tu e gli eventuali collaboratori potete eliminare ricette e ricordi: è l'unica azione che resta riservata a chi ha il controllo pieno del libro, anche se un redattore può crearli e modificarli liberamente.</p>
  </>
);

// ── Parte 2 — funzioni senza GlobalNav, dentro InfoButton ──────
// (colore ereditato dal wrapper di InfoButton — nessun colore esplicito qui)

export const guideDettaglioRicetta = (
  <>
    <p style={pFirst}>La scheda di ogni ricetta. <b>Ingredienti</b>, <b>Preparazione</b> e <b>Nutrizione</b> mostrano cosa serve, come si prepara, e (se collegata in Organizza) calorie e macronutrienti.</p>
    <p style={p}>Nell'header: <b>📤</b> esporta/condivide, <b>⭐</b> segna preferita, <b>✏️</b> modifica, <b>🗑️</b> elimina. L'interruttore <b>App/📖</b> la mostra come pagina di ricettario stampato.</p>
    <p style={p}><b>⚖️ Calcolo dosi</b> ti permette di adattare automaticamente le quantità di ingredienti in base al numero di dosi che vuoi preparare, o di adattarle in base ad un ingrediente limitante (es. la ricetta prevede 100g di farina ma io ne ho solo 80g, come cambiano in proporzione tutte le altre quantità?). Da qui si aggiornano in automatico le quantità da inviare in <b>🛒 Spesa</b> o da visualizzare in <b>👨‍🍳 Cucina</b>.</p>
    <p style={p}>Più in basso: i <b>ricordi</b> collegati a questa ricetta e uno spazio per <b>commenti</b> tuoi (es. variazioni alla ricetta da tenere a mente per il futuro, senza modificare la ricetta di base).</p>
    <p style={pLast}>💡 Più valori nutrizionali ed equivalenze hai impostato in <b>Organizza</b>, più il calcolo dei valori nutrizionali della ricetta sarà preciso. Sarà l'applicazione stessa a suggerirti se esistono azioni da intraprendere per migliorare il calcolo.</p>
  </>
);

export const guideCucina = (
  <>
    <p style={pFirst}>Guida a schermo intero per cucinare senza scorrere con le mani sporche. Si parte da un riepilogo ingredienti, poi un passo alla volta.</p>
    <p style={pLast}><b>Tocca a destra</b> per andare avanti, <b>a sinistra</b> per tornare indietro. La barra in alto mostra tutti i passi: toccane uno per saltarci direttamente.</p>
  </>
);

export const guideCalcoloDosi = (
  <>
    <p style={pFirst}>Scegli come calcolare le quantità prima di <b>Cucina</b> o <b>Spesa</b>: <b>Standard</b> lascia le dosi originali, <b>Persone</b> ricalcola per i commensali, <b>Ingrediente</b> parte da "ho solo 200 g di farina, quanto mi viene?" e scala tutto.</p>
    <p style={pLast}>La scelta vale solo per questa apertura — riaprendo la ricetta si riparte da Standard.</p>
  </>
);

export const guideModalitaSpesa = (
  <p style={{ margin:0 }}>L'ultimo passaggio prima che gli ingredienti finiscano davvero nella <b>Lista Spesa</b>: una checklist di tutto ciò che serve, già nelle quantità scelte. Deseleziona quello che hai già in casa, poi conferma per aggiungere solo il resto.</p>
);

export const guideEsporta = (
  <p style={{ margin:0 }}>Porta le tue ricette fuori dall'app. Scegli se esportarne una sola o più di una, poi il formato: un <b>link/codice</b> (chi lo riceve lo incolla nel suo ricettario — copia indipendente, non sincronizzata) o un <b>PDF</b> pronto da stampare o inviare.</p>
);

export const guideNuovaModificaRicetta = (
  <p style={{ margin:0 }}>Il form per scrivere o correggere una ricetta, in quattro tab: <b>Info</b> (titolo, sezione, fonte, tempi, porzioni, tag), <b>Ingredienti</b> (scritti bene qui alimentano da soli Spesa, Frigo e Nutrizione), <b>Preparazione</b> (i passi, anche raggruppati, con foto) e <b>Note</b>.</p>
);

export const guideScansiona = (
  <p style={{ margin:0 }}>Fotografa una ricetta scritta a mano o stampata (o scegli una foto già scattata) e lascia che l'AI la legga per te. Dopo l'analisi ti ritrovi nel form di <b>Nuova Ricetta</b>, già compilato: controlla e correggi prima di salvare, l'estrazione automatica non è infallibile.</p>
);

export const guideLink = (
  <>
    <p style={pFirst}>Incolla il link di una ricetta trovata online: l'AI la legge e ti porta al form di <b>Nuova Ricetta</b> già compilato, pronto da controllare e salvare.</p>
    <p style={pLast}>💡 Se il sito blocca l'accesso automatico, puoi incollare il testo della pagina o caricare il file HTML salvato dal browser.</p>
  </>
);
