import { useState } from "react";
import { useTheme } from "../context.js";
import { F } from "../data/constants.js";

// ══════════════════════════════════════════════════════════════
// GUIDA IN-APP — stessa struttura del manuale utente
// ══════════════════════════════════════════════════════════════
export default function GuideScreen({ onBack }) {
  const th = useTheme();
  const [open, setOpen] = useState("idea"); // capitolo espanso (il primo, all'apertura)

  const Chapter = ({ id, icon, title, children }) => {
    const isOpen = open === id;
    return (
      <div style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:13, marginBottom:8, overflow:"hidden" }}>
        <button onClick={() => setOpen(isOpen ? null : id)} style={{
          width:"100%", display:"flex", alignItems:"center", gap:10, padding:"13px 14px",
          background:"none", border:"none", cursor:"pointer", textAlign:"left",
        }}>
          <span style={{ fontSize:18 }}>{icon}</span>
          <span style={{ flex:1, fontFamily:F.ui, fontSize:13, fontWeight:700, color:th.appInk }}>
            {title}
          </span>
          <span style={{ color:th.appFaded, fontSize:12 }}>{isOpen ? "▴" : "▾"}</span>
        </button>
        {isOpen && (
          <div style={{ padding:"0 15px 15px", fontFamily:F.body, fontSize:12.5, color:th.appInk, lineHeight:1.65 }}>
            {children}
          </div>
        )}
      </div>
    );
  };
  const Key = ({ children }) => (
    <div style={{ background:"#faf5e6", borderLeft:"3px solid #b8973a", borderRadius:7, padding:"9px 11px", margin:"10px 0", fontSize:11.5, color:"#6f5c25", lineHeight:1.55 }}>{children}</div>
  );
  const Tip = ({ children }) => (
    <div style={{ background:"#eef3ee", borderLeft:"3px solid #6b8c6e", borderRadius:7, padding:"9px 11px", margin:"10px 0", fontSize:11.5, color:"#41603f", lineHeight:1.55 }}>{children}</div>
  );

  return (
    <div style={{ background:th.appBg, minHeight:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"12px 18px 6px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={onBack} style={{ background:th.appCard, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"6px 12px", cursor:"pointer", color:th.appInk, fontFamily:F.ui, fontSize:12 }}>‹ Indietro</button>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:F.display, fontSize:17, color:th.appInk }}>Guida</div>
          <div style={{ fontFamily:F.ui, fontSize:10.5, color:th.appFaded }}>come funziona l'app</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"8px 16px 36px" }}>

        <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.1, color:th.appAccent, fontWeight:700, textTransform:"uppercase", margin:"2px 0 7px" }}>Come funziona</div>

        <Chapter id="idea" icon="💡" title="L'idea in un minuto">
          <p style={{margin:"6px 0"}}>Questa è la vostra cucina digitale condivisa: le ricette di famiglia, cosa comprare, cosa cucinare con quello che avete in casa, quante calorie ha un piatto — e i ricordi legati ai piatti che fate.</p>
          <p style={{margin:"6px 0"}}>La parte speciale: <b>le sezioni non sono scollegate</b>. Se scrivi bene una ricetta e compili le impostazioni, l'app usa quelle informazioni ovunque, senza che tu ripeta niente.</p>
          <Key>🔑 <b>La regola d'oro:</b> più curi le ricette e la sezione Organizza, più l'app diventa intelligente. Insegni una volta, raccogli i frutti sempre.</Key>
          <Tip>💡 Non serve capire tutto subito: parti dalle ricette, il resto lo aggiungi quando ti serve.</Tip>
        </Chapter>

        <Chapter id="mappa" icon="🗺️" title="Come tutto si collega">
          <p style={{margin:"6px 0"}}>Una ricetta nasce in <b>tre modi</b>: la scrivi a mano ✏️, la fotografi 📷, o scegli una foto dalla galleria 🗃️. In tutti i casi finisce nello stesso posto.</p>
          <div style={{ background:th.appBg, border:`1px solid ${th.appBorder}`, borderRadius:10, padding:"12px 10px", margin:"10px 0", textAlign:"center", fontFamily:F.ui, fontSize:11, lineHeight:1.9 }}>
            <div style={{ color:th.appFaded, fontSize:9.5 }}>✏️ a mano · 📷 foto · 🗃️ galleria</div>
            <div style={{ color:th.appFaded }}>↓</div>
            <div style={{ fontWeight:700, color:th.appAccent, fontSize:12.5 }}>📖 LA RICETTA</div>
            <div style={{ color:th.appFaded, fontSize:9.5 }}>↓ i suoi ingredienti alimentano ↓</div>
            <div style={{ fontWeight:700, color:th.appInk }}>🧊 Frigo · 🛒 Spesa · 🍎 Nutrizione</div>
            <div style={{ color:"#b8973a", fontStyle:"italic", fontSize:9.5 }}>↑ le regole arrivano a tutte e tre ↑</div>
            <div style={{ fontWeight:700, color:"#b8973a" }}>🍎⚙️ ORGANIZZA</div>
          </div>
          <p style={{margin:"6px 0"}}><b>Dall'alto:</b> gli ingredienti che scrivi in una ricetta alimentano da soli Frigo, Spesa e Nutrizione. Non li reinserisci mai.</p>
          <p style={{margin:"6px 0"}}><b>Dal basso:</b> le regole che imposti in <b>Organizza</b> (conversioni, categorie, collegamenti) arrivano a tutte e tre. Le definisci una volta, valgono sempre.</p>
          <p style={{margin:"6px 0"}}>Quando è ora di cucinare, la stessa ricetta si apre in <b>Modalità Cucina</b>: lì il lavoro delle altre sezioni diventa un piatto in tavola.</p>
          <Key>🔑 <b>Esempio:</b> in Organizza dici una volta che «1 cucchiaio di farina = 10 g». Da allora la Spesa somma bene anche se una ricetta usa cucchiai e un'altra grammi, e la Nutrizione sa quanti grammi contare.</Key>
          <Tip>💡 Se salti Organizza l'app funziona lo stesso, ma "alla cieca": non unisce cipolla bianca e rossa nella spesa, non calcola le calorie di ciò che non è collegato.</Tip>
        </Chapter>

        <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.1, color:th.appAccent, fontWeight:700, textTransform:"uppercase", margin:"16px 0 7px" }}>Cosa ci metti dentro</div>

        <Chapter id="ricette" icon="📖" title="Le ricette">
          <p style={{margin:"6px 0"}}>In <b>Libro Ricette</b> tocca <b>＋ Nuova ricetta</b> in alto. Puoi scriverla a mano, fotografare una pagina di ricettario, o scegliere una foto dalla galleria: negli ultimi due casi l'app legge il testo e ti porta allo <b>stesso form già compilato</b>, così controlli e correggi prima di salvare.</p>
          <p style={{margin:"6px 0"}}>Scrivi bene nome, quantità e unità di ogni ingrediente (es. <i>Farina — 100 — g</i>): sono la base per spesa, dosi e calorie.</p>
          <p style={{margin:"6px 0"}}><b>Trovare una ricetta:</b> la ricerca 🔍 è sempre in alto; le pillole filtrano per sezione (Dolci, Salati…) e ⭐ Preferiti. Una ricetta si segna come preferita col ☆ nella sua scheda.</p>
          <p style={{margin:"6px 0"}}><b>Etichette:</b> puoi assegnare tag (Vegetariano, Feste, Forno…) per ritrovare le ricette per occasione o caratteristica.</p>
          <Tip>💡 Puoi <b>rinominare</b> un ingrediente in Organizza senza rompere nulla: i suoi collegamenti (calorie, categorie) restano attaccati.</Tip>
        </Chapter>

        <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.1, color:th.appAccent, fontWeight:700, textTransform:"uppercase", margin:"16px 0 7px" }}>Come la usi ogni giorno</div>

        <Chapter id="cucina" icon="👨‍🍳" title="Modalità Cucina">
          <p style={{margin:"6px 0"}}>Il momento per cui esiste l'app. Da una ricetta tocca <b>👨‍🍳 Cucina</b>: parte una guida a schermo intero.</p>
          <p style={{margin:"6px 0"}}><b>1. Prima gli ingredienti</b> — tutto ciò che serve, già nelle dosi che hai scelto: prepari il piano prima di iniziare.</p>
          <p style={{margin:"6px 0"}}><b>2. Un passo alla volta</b> — solo l'istruzione corrente, grande e leggibile da lontano.</p>
          <p style={{margin:"6px 0"}}><b>3. Spunti mentre procedi</b> — la barra in alto mostra a che punto sei; toccando un pallino torni a quel passo.</p>
          <Key>👆 <b>I comandi al tocco</b> (per le mani impegnate):<br/>· metà <b>destra</b> dello schermo → passo <b>successivo</b><br/>· metà <b>sinistra</b> → passo <b>precedente</b><br/>· <b>doppio tocco</b> → segna il passo come fatto ✓ e avanza</Key>
          <Tip>💡 Usa automaticamente le dosi impostate col Calcolo dosi: niente conti a mente davanti ai fornelli.</Tip>
        </Chapter>

        <Chapter id="dosi" icon="⚖️" title="Il calcolo dosi">
          <p style={{margin:"6px 0"}}>Dentro ogni ricetta, il pulsante <b>⚖️ Calcolo dosi</b> ti fa scegliere:</p>
          <p style={{margin:"6px 0"}}>· <b>Standard</b> — le dosi scritte nella ricetta.</p>
          <p style={{margin:"6px 0"}}>· <b>Per persone</b> — ricalcola per il numero di commensali (da 16 a 32 porzioni: raddoppia tutto).</p>
          <p style={{margin:"6px 0"}}>· <b>Per ingrediente</b> — «ho solo 200 g di farina, quanto viene?»: scala tutto di conseguenza.</p>
          <Key>🔑 La dose scelta viene usata <b>automaticamente</b> dalla Lista Spesa e dalla Modalità Cucina, e le quantità mostrate negli ingredienti sono già ricalcolate. Si azzera a "standard" quando riapri la ricetta.</Key>
        </Chapter>

        <Chapter id="nutri" icon="🍎" title="I valori nutrizionali">
          <p style={{margin:"6px 0"}}>Nella scheda ricetta, la tab <b>Nutrizione</b> (accanto a Ingredienti e Preparazione) mostra calorie, carboidrati, proteine e grassi — <b>per porzione</b> o <b>per 100 g</b>.</p>
          <p style={{margin:"6px 0"}}>Sotto trovi l'elenco degli ingredienti col loro contributo. Ognuno ha una <b>pesatura</b> (0–100%): quanto conta nel calcolo. Es. l'olio per friggere di cui poco resta nel piatto → impostalo al 10%. Si regola con una barra, dal form ingredienti (icona 🍎).</p>
          <Tip>⚠️ Un ingrediente conta solo se <b>collegato</b> al database alimenti in Organizza. Se manca il collegamento, l'app te lo segnala e non lo conteggia.</Tip>
        </Chapter>

        <Chapter id="spesa" icon="🛒" title="La Lista Spesa">
          <p style={{margin:"6px 0"}}>Da una ricetta tocca <b>🛒 Spesa</b>, spunta cosa ti serve e aggiungi alla lista. L'app poi:</p>
          <p style={{margin:"6px 0"}}>· <b>somma</b> le quantità uguali (100 g + 100 g = 200 g);</p>
          <p style={{margin:"6px 0"}}>· <b>unisce gli aggregati</b> (cipolla bianca + rossa = cipolla) — regola presa da Organizza;</p>
          <p style={{margin:"6px 0"}}>· <b>raggruppa per ricetta</b> in fondo, così sai da dove viene ogni cosa.</p>
          <p style={{margin:"6px 0"}}>Togli un singolo ingrediente con la <b>×</b> accanto alla voce, un'intera ricetta con <b>🗑 Rimuovi</b>, o azzeri tutto con <b>Svuota lista</b>.</p>
          <Key>🔑 La lista resta <b>collegata</b> alla ricetta: se modifichi una ricetta già in lista, l'app ti chiede se <b>aggiornare</b> le quantità, <b>mantenerle</b> com'erano o <b>toglierla</b> dalla spesa.</Key>
        </Chapter>

        <Chapter id="frigo" icon="🧊" title="Svuota Frigo">
          <p style={{margin:"6px 0"}}>Segni cosa hai in casa e l'app confronta con tutte le tue ricette, dicendoti <b>cosa puoi già cucinare</b> e cosa ti manca di poco.</p>
          <p style={{margin:"6px 0"}}>Gli ingredienti sono ordinati per scaffale (verdure, latticini, dispensa…): quegli scaffali sono le <b>categorie</b> che imposti in Organizza.</p>
        </Chapter>

        <div style={{ fontFamily:F.ui, fontSize:10, letterSpacing:1.1, color:th.appAccent, fontWeight:700, textTransform:"uppercase", margin:"16px 0 7px" }}>Come la rendi tua</div>

        <Chapter id="organizza" icon="⚙️" title="Organizza">
          <p style={{margin:"6px 0"}}>Il cervello dell'app: qui stanno le regole che rendono intelligenti tutte le altre sezioni. Due parti: <b>Gestisci database</b> (le quattro impostazioni) e <b>Gestisci ingredienti</b> (la lista con ricerca, dove colleghi e rinomini).</p>
          <p style={{margin:"6px 0"}}><b>⊕ Aggregati</b> — uniscono ingredienti simili sotto un nome unico («passata» e «pelati» → «pomodoro»). Servono a Spesa e Frigo.</p>
          <p style={{margin:"6px 0"}}><b>🏷 Categorie</b> — gli scaffali (verdura, latticini…): ordinano Frigo e Spesa.</p>
          <p style={{margin:"6px 0"}}><b>⚖️ Equivalenze</b> — le conversioni («1 cucchiaio = 10 g», «1 uovo = 60 g»): fanno sommare la Spesa e calcolare la Nutrizione.</p>
          <p style={{margin:"6px 0"}}><b>🍎 Valori nutrizionali</b> — collegano i tuoi ingredienti al database alimenti (con calorie e macro ufficiali). Puoi anche creare alimenti personalizzati.</p>
          <Key>🔑 Qui imposti le regole <b>una volta</b> e valgono per <b>ogni ricetta</b>, presente e futura. È l'investimento che ripaga di più.</Key>
          <Tip>💡 Non serve fare tutto subito: compila man mano che l'app ti segnala cosa manca (le schede con l'avviso rosso, o i suggerimenti 💡 in Frigo e Spesa che ti portano qui).</Tip>
        </Chapter>

        <Chapter id="ricordi" icon="📸" title="I Ricordi">
          <p style={{margin:"6px 0"}}>In <b>Libro dei Ricordi</b> leghi <b>foto vere</b> (dal telefono o dalla galleria) e un <b>racconto</b> a una ricetta: «la prima volta che l'abbiamo fatta insieme», una cena speciale. Tocca <b>＋ Nuovo ricordo</b> in alto, scegli la foto, scrivi un titolo breve e — se vuoi — il racconto di com'è andata, poi associa una o più ricette.</p>
          <p style={{margin:"6px 0"}}>I ricordi sono ordinati come un <b>diario</b>, dal più recente, con intestazioni per periodo (es. "Inverno 2024"). Con l'interruttore <b>▦ / 📖</b> passi dalla vista a schede alla <b>vista libro</b>, che apre i ricordi a piena pagina (due per pagina) con foto grande e racconto. I ricordi compaiono anche nella scheda della ricetta collegata.</p>
          <div style={{ background:"#fdece8", borderLeft:"3px solid #c4593a", borderRadius:7, padding:"9px 11px", margin:"10px 0", fontSize:11.5, color:"#8f3a29", lineHeight:1.55 }}>
            ❤️ Se Organizza è il cervello dell'app, questo è il suo cuore: non solo cosa cucinate, ma i momenti attorno al cibo.
          </div>
        </Chapter>

        <Chapter id="libri" icon="📚" title="Libri e condivisione">
          <p style={{margin:"6px 0"}}>Puoi avere <b>più libri</b> (es. "Casa nostra", "Ricette della nonna") e passare dall'uno all'altro: ogni libro ha le sue ricette e le sue impostazioni. Li gestisci dal pulsante <b>📚 libri</b> in Home.</p>
          <p style={{margin:"10px 0 4px", fontWeight:700, color:th.appAccent}}>Due modi per condividere</p>
          <p style={{margin:"6px 0"}}><b>1 · Un intero ricettario, sincronizzato 👥</b><br/>Dalla schermata Libri, ogni libro ha la sua lista <b>Membri (sincronizzati)</b>: scrivi l'<b>email</b> della persona e tocca <b>＋ Invita</b>. Da quel momento condividete lo <b>stesso libro</b>: ricette, lista spesa e impostazioni sono in comune, e le modifiche di uno si vedono anche all'altro. È il modo pensato per una coppia o una famiglia. Puoi rimuovere un membro con la <b>×</b> (il proprietario del libro non si può rimuovere).</p>
          <p style={{margin:"6px 0"}}><b>2 · Solo alcune ricette, come copia 🔗</b><br/>Seleziona le ricette e genera un <b>codice</b>; chi lo riceve (WhatsApp, email…) lo incolla nel suo ricettario con <b>"Importa da codice"</b>. Sono <b>copie indipendenti</b>: restano sue, e le vostre modifiche non si toccano più. Utile per passare una ricetta a un amico.</p>
          <Key>🔑 In breve: <b>invito email</b> = stesso libro condiviso e sincronizzato · <b>codice</b> = regali una copia delle ricette.</Key>
          <p style={{margin:"6px 0"}}><b>Esportare (link o PDF):</b> dalla scheda di una ricetta, il tasto 📤 chiede se vuoi esportare <b>solo quella ricetta</b> o <b>sceglierne più di una</b> (con una schermata a spunte e "seleziona tutto il ricettario"). Poi scegli il formato: un <b>link</b> (codice da incollare in un altro ricettario) o un <b>PDF</b> da stampare o inviare.</p>
          <p style={{margin:"6px 0"}}>Puoi anche <b>copiare ricette</b> da un libro all'altro e scegliere quale libro aprire all'avvio.</p>
          <Tip>💡 Nel prototipo la sincronizzazione è simulata sul dispositivo. Nella versione finale, con l'account, i libri condivisi si aggiorneranno davvero in tempo reale tra i vostri telefoni.</Tip>
        </Chapter>

        <Chapter id="aspetto" icon="🎨" title="L'aspetto">
          <p style={{margin:"6px 0"}}>Dal pulsante <b>🎨 temi</b> in Home cambi i colori e lo stile del ricettario.</p>
          <p style={{margin:"6px 0"}}>La <b>copertina</b> è la schermata d'apertura: toccala per entrare. In <b>Libro Ricette</b>, nel banner in alto trovi un interruttore <b>▦ / 📖</b>: passa dalla vista a <b>schede</b> (la lista) alla vista <b>libro</b>, che sfoglia tutte le ricette pagina per pagina. E dalla scheda di una singola ricetta puoi passare alla vista Libro (interruttore 📖) che la mostra come una pagina di ricettario stampato.</p>
        </Chapter>

        <Chapter id="faq" icon="❓" title="Domande frequenti">
          <p style={{margin:"8px 0 2px", fontWeight:700}}>Da dove comincio?</p>
          <p style={{margin:"0 0 8px"}}>Inserisci due o tre ricette che fate spesso. Poi prova la Modalità Cucina. Organizza compilalo dopo, quando l'app ti segnala che manca qualcosa.</p>
          <p style={{margin:"8px 0 2px", fontWeight:700}}>Devo compilare Organizza per usare l'app?</p>
          <p style={{margin:"0 0 8px"}}>No, ma compilandola l'app diventa molto più utile (somme corrette, calorie, scaffali). Fallo con calma, un pezzo alla volta.</p>
          <p style={{margin:"8px 0 2px", fontWeight:700}}>Se rinomino un ingrediente perdo i suoi dati?</p>
          <p style={{margin:"0 0 8px"}}>No: calorie, categorie ed equivalenze restano attaccate. L'app lo riconosce col nome nuovo.</p>
          <p style={{margin:"8px 0 2px", fontWeight:700}}>Se cambio una ricetta, la spesa si aggiorna?</p>
          <p style={{margin:"0 0 8px"}}>Te lo chiede: puoi aggiornarla, lasciarla com'era, o togliere quella ricetta dalla lista.</p>
          <p style={{margin:"8px 0 2px", fontWeight:700}}>Perché una ricetta non mostra le calorie?</p>
          <p style={{margin:"0 0 8px"}}>Perché i suoi ingredienti non sono ancora collegati al database in Organizza › 🍎 Valori nutrizionali.</p>
          <p style={{margin:"8px 0 2px", fontWeight:700}}>I dati sono condivisi tra me e la mia compagna?</p>
          <p style={{margin:"0 0 8px"}}>Sì: invitala come <b>membro</b> del libro con la sua email (📚 libri › Membri › ＋ Invita) e condividete lo stesso ricettario. In alternativa, per passare solo alcune ricette, usa il codice di condivisione. Nel prototipo la sincronizzazione è simulata; nella versione finale sarà reale tra i vostri telefoni.</p>
        </Chapter>

        <div style={{ textAlign:"center", fontFamily:F.ui, fontSize:10, color:th.appFaded, marginTop:14 }}>
          Il mio Ricettario · guida · versione prototipo
        </div>
      </div>
    </div>
  );
}
