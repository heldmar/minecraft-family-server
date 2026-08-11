/* MarNar's Minecraft Server — translations (A-1 … A-7)
 *
 * Two languages, one dictionary, no dependencies. Keys are dotted and grouped
 * by where they appear, so a missing string is obvious when reading either
 * block side by side.
 *
 * House rules for anyone adding a string here:
 *
 *   1. The reader is twelve. If a sentence needs a word like "sync", "chunk"
 *      or "restore" to make sense, either pick a different word or add a
 *      `help.*` entry that teaches it (B-1, B-2).
 *   2. `help.*` entries explain the CONCEPT, not the label. "The seed is the
 *      number the world was drawn from" teaches; "This is the seed" does not
 *      (B-3).
 *   3. Never translate data. Gamertags, seeds, filenames and log lines are
 *      values, not copy (A-7).
 */
(function () {
  "use strict";

  var DICT = {

    /* =====================================================================
     * ESPAÑOL — el idioma por defecto (A-4)
     * ===================================================================== */
    es: {
      "lang.name": "Español",
      "lang.switch": "Idioma",

      /* --- marco ------------------------------------------------------- */
      "brand.sub": "Servidor de Minecraft",
      "nav.players": "Jugadores",
      "nav.world": "Mundo",
      "nav.activity": "Novedades",
      "side.connecting": "Conectando…",
      "side.up": "El servidor está prendido",
      "side.down": "El servidor está apagado",
      "side.noagent": "No puedo hablar con el servidor",
      "btn.restart": "Reiniciar el servidor",
      "btn.refresh": "Actualizar",
      "hdr.online": "jugando",
      "hdr.tps": "velocidad",
      "hdr.version": "versión",

      "title.players": "Jugadores",
      "sub.players": "Quién puede entrar a tu servidor",
      "title.world": "Mundo",
      "sub.world": "Tu mundo, sus copias y cómo empezar uno nuevo",
      "title.activity": "Novedades",
      "sub.activity": "Qué se hizo y qué está diciendo el servidor",

      /* --- explicadores ------------------------------------------------ */
      "help.open": "¿Qué es esto?",

      "help.roster": "Tu servidor es privado: no entra cualquiera. Solo pueden entrar los jugadores que estén en esta lista. Si alguien no está en la lista e intenta entrar, el servidor lo rechaza y le muestra un mensaje. Por eso, para invitar a un amigo, primero tenés que agregar su nombre acá.",
      "help.online": "Cuántos están jugando ahora mismo, y cuántos caben a la vez. El límite es 4 porque la computadora donde vive tu servidor comparte su potencia con otras páginas web. Si entran más de los que caben, el juego empieza a andar a los tirones para todos.",
      "help.tps": "TPS quiere decir «tics por segundo». Minecraft piensa el mundo entero 20 veces por segundo: mueve a los animales, crece el pasto, cae el agua. Cada una de esas veces es un tic. Si el número dice 20, el servidor va perfecto. Si baja mucho, todo se mueve en cámara lenta.",
      "help.ps5": "Para que una PS5 pueda entrar hacen falta tres programas prendidos al mismo tiempo, no solo el juego. La PlayStation no te deja escribir la dirección de un servidor, así que usamos un truco: le cambiamos el DNS y le mostramos un menú propio. Si acá dice «Revisar», la PS5 no va a poder entrar aunque el juego esté andando.",

      "help.seed": "La semilla es el número con el que Minecraft dibujó tu mundo. Funciona como la receta: dos mundos hechos con la misma semilla salen exactamente iguales, con las mismas montañas, las mismas cuevas y los mismos pueblos. Por eso, si guardás este número, podés volver a crear este mundo desde cero cuando quieras.",
      "help.border": "El borde es una pared invisible que marca hasta dónde podés caminar. Tu mundo mide 3000 bloques de lado a lado. Sin borde, Minecraft seguiría inventando terreno para siempre y el mundo ocuparía cada vez más espacio en el disco. En el Nether cada bloque cuenta por ocho, así que ahí el borde es ocho veces más chico.",
      "help.size": "Lo que ocupa tu mundo guardado. Crece cada vez que alguien explora un lugar nuevo, porque el servidor tiene que anotar cómo es ese pedazo de terreno y recordarlo para siempre. Por eso existe el borde: sin un límite, esto no pararía de crecer.",
      "help.backups": "Una copia de seguridad es una foto de tu mundo guardada aparte. Si algo sale mal, podés volver a esa foto y recuperar todo como estaba. ⚠️ Estas copias no se hacen solas: se hacen cuando tocás «Hacer una copia», y también automáticamente justo antes de algo peligroso, por las dudas.",

      "help.sync": "Cuando agregás a alguien, su nombre se guarda en una lista y después hay que avisarle al juego que esa lista cambió. Eso es sincronizar. Normalmente pasa solo. Este botón está por si alguna vez agregaste a alguien y el servidor todavía no se enteró.",
      "help.import": "Traer un mundo que ya existe — uno que jugaste en tu tablet, o que te pasó un amigo — y ponerlo en el servidor para jugarlo entre todos. Reemplaza el mundo que hay ahora, así que antes se guarda una copia del actual.",
      "help.regen": "Empezar un mundo completamente nuevo, desde cero, con montañas y cuevas distintas. El mundo de ahora no se borra: se guarda aparte por si querés volver. Tarda como 45 minutos, porque el servidor dibuja todo el terreno de una vez para que después nadie sufra tirones al explorar.",
      "help.restart": "Apagar y volver a prender el servidor. Sirve cuando algo quedó raro o va lento. Antes de apagarse, avisa a todos los que estén jugando y guarda el mundo, así no se pierde nada. Tarda como un minuto.",
      "help.audit": "Una libreta donde queda anotado todo lo que se hizo desde acá: a quién agregaste, a quién sacaste, cuándo se hizo una copia. Sirve para responder «¿y esto cuándo pasó?» sin tener que acordarse.",
      "help.console": "Lo que el servidor va escribiendo mientras trabaja, en su propio idioma. No hace falta entender todo. Si algo falla, estas líneas son las que explican por qué.",
      "help.platform": "Minecraft viene en dos versiones que son distintas por dentro. La de PlayStation, tablets, celulares y Switch se llama Bedrock. La de computadora se llama Java. Tu servidor acepta las dos al mismo tiempo, pero necesita saber cuál usa cada jugador.",
      "help.disk": "Cuánto lugar están ocupando las copias de tu mundo. El disco no es infinito, y esta computadora también tiene otras páginas web adentro. Las copias viejas se borran solas y siempre se guarda la más nueva.",

      /* --- jugadores --------------------------------------------------- */
      "players.rosterLabel": "En la lista",
      "players.rosterFoot": "pueden entrar",
      "players.onlineLabel": "Jugando ahora",
      "players.onlineFoot": "de {max} lugares",
      "players.tpsLabel": "Velocidad",
      "players.tpsFoot": "20 es perfecto",
      "players.pathLabel": "Camino de la PS5",
      "players.pathFoot": "para que entre la consola",
      "players.pathOk": "Todo bien",
      "players.pathBad": "Revisar",

      "players.listTitle": "Quiénes pueden entrar",
      "players.sync": "Avisarle al servidor",
      "players.thTag": "Nombre de jugador",
      "players.thPlatform": "En qué juega",
      "players.thWho": "Quién es",
      "players.thState": "Estado",
      "players.loading": "Cargando…",
      "players.empty": "Todavía no hay nadie en la lista. Agregá el primero acá al lado →",
      "players.badgePlaying": "jugando",
      "players.badgeAllowed": "puede entrar",
      "players.badgeUnsynced": "falta avisar",
      "players.badgeUnsyncedHelp": "Está en tu lista, pero el servidor todavía no se enteró. Tocá «Avisarle al servidor».",
      "players.kick": "Sacar del juego",
      "players.remove": "Quitar de la lista",
      "players.kicked": "{tag} salió del juego",
      "players.removed": "{tag} ya no puede entrar",
      "players.added": "{tag} ya puede entrar",
      "players.synced": "Listo, el servidor ya tiene la lista al día",

      "players.addTitle": "Invitar a alguien",
      "players.platform": "¿En qué juega?",
      "players.platformBedrock": "PlayStation, iPad, Switch o celular",
      "players.platformJava": "Computadora",
      "players.tag": "Su nombre de jugador",
      "players.tagPh": "por ejemplo MarNarCraft99",
      "players.note": "¿Quién es?",
      "players.notePh": "por ejemplo MarNar — PS5",
      "players.hint": "⚠️ Para PlayStation, iPad y Switch hace falta el nombre de Xbox o Microsoft, no el de PlayStation. Casi siempre son distintos y solo funciona el de Xbox. Tampoco escribas el puntito que aparece adelante del nombre dentro del juego: ese lo agrega el servidor solo.",
      "players.submit": "Invitar",
      "players.removeTitle": "¿Quitar a {tag}?",
      "players.removeBody": "No va a poder entrar más, y si está jugando ahora lo saca. No pierde nada de lo que construyó, y lo podés volver a invitar cuando quieras.",

      /* --- mundo -------------------------------------------------------- */
      "world.seedLabel": "Semilla",
      "world.seedFoot": "el número que dibujó tu mundo",
      "world.borderLabel": "Borde",
      "world.borderFoot": "bloques de lado a lado",
      "world.sizeLabel": "Tamaño",
      "world.sizeFoot": "lo que ocupa guardado",
      "world.backupsLabel": "Copias",
      "world.backupsFoot": "guardadas ahora",

      "world.backupsTitle": "Copias de tu mundo",
      "world.backupNow": "Hacer una copia",
      "world.thFile": "Copia",
      "world.thWhen": "Cuándo",
      "world.thSize": "Tamaño",
      "world.noBackups": "No hay ninguna copia guardada.",
      "world.notAuto": "ℹ️ Las copias no se hacen solas. Se hacen cuando tocás el botón, y también solas justo antes de algo peligroso.",
      "world.diskUsed": "Las copias ocupan {mb} MB.",
      "world.restore": "Volver a esta copia",
      "world.restoreTitle": "¿Volver a esta copia?",
      "world.restoreBody": "Tu mundo vuelve a como estaba {when}. Todo lo que se construyó después de ese momento se pierde. Antes de cambiar nada se guarda una copia del mundo de ahora, así que también podés volver atrás de esto.",

      "world.importTitle": "Traer un mundo que ya existe",
      "world.importFile": "El archivo del mundo",
      "world.importHint": "Sirve un archivo .zip, .tar.gz o .tar.zst. Adentro tiene que estar el archivo level.dat, que es el que guarda la información del mundo. Tiene que ser la carpeta del mundo, no la del servidor entero.",
      "world.importSubmit": "Subir y usar este mundo",
      "world.importConfirmTitle": "¿Usar {name}?",
      "world.importConfirmBody": "Tu mundo de ahora se reemplaza por el que acabás de subir. Antes de tocar nada se guarda una copia del actual y se deja guardado aparte, así que se puede volver.",
      "world.uploadFailed": "No se pudo subir el archivo. Fijate que no sea enorme y probá de nuevo.",
      "world.uploadCut": "Se cortó la subida. Probá otra vez.",

      "world.regenTitle": "⛏️ Empezar un mundo nuevo",
      "world.regenSeed": "Semilla",
      "world.regenSeedOpt": "(vacío = al azar)",
      "world.regenSeedPh": "al azar",
      "world.regenSize": "Ancho del borde",
      "world.regenHint": "Esto reemplaza tu mundo actual y tarda unos 45 minutos. Tu mundo de ahora no se borra: primero se guarda una copia y después se deja apartado con otro nombre, por si querés volver.",
      "world.regenSubmit": "Empezar un mundo nuevo",
      "world.regenConfirmTitle": "¿Empezar un mundo nuevo?",
      "world.regenConfirmBody": "Tu mundo se reemplaza por uno nuevo con {seed} y un borde de {size} bloques. Tarda unos 45 minutos. El mundo de ahora se guarda antes, así que se puede volver.",
      "world.regenSeedNamed": "la semilla {seed}",
      "world.regenSeedRandom": "una semilla al azar",

      /* --- novedades ---------------------------------------------------- */
      "activity.auditTitle": "Qué se hizo",
      "activity.thWhen": "Cuándo",
      "activity.thFrom": "Desde dónde",
      "activity.thWhat": "Qué",
      "activity.auditEmpty": "Todavía no se hizo nada.",
      "activity.consoleTitle": "Lo que dice el servidor",
      "activity.refresh": "Actualizar",

      /* --- trabajos y avisos -------------------------------------------- */
      "job.working": "Trabajando…",
      "job.running": "trabajando · {m}m {s}s",
      "job.done": "listo en {m}m {s}s",
      "job.failed": "no salió bien",
      "job.note": "Podés cerrar esta ventana. El trabajo sigue solo en el servidor.",
      "job.noteOk": "Terminado.",
      "job.noteBad": "No salió bien. Mirá el detalle de arriba: tu mundo anterior sigue guardado en el servidor.",
      "job.close": "Cerrar",
      "job.toastOk": "{title}: listo",
      "job.toastBad": "{title}: no salió bien",
      "job.inProgress": "Ya hay algo en curso: {op}",
      "job.restartTitle": "Reiniciando el servidor",
      "job.backupTitle": "Guardando una copia de tu mundo",
      "job.restoreTitle": "Volviendo a {name}",
      "job.regenTitle": "Creando un mundo nuevo",
      "job.importTitle": "Trayendo {name}",

      "confirm.title": "¿Seguro?",
      "confirm.no": "No, dejalo así",
      "confirm.yes": "Sí, hacelo",
      "restart.title": "¿Reiniciar el servidor?",
      "restart.body": "Les avisa a todos los que estén jugando, guarda el mundo y lo prende de nuevo. Nadie pierde nada. Tarda como un minuto.",

      "time.mins": "hace {n} min",
      "time.hours": "hace {n} h",
      "time.days": "hace {n} días",
      "time.justNow": "recién"
    },

    /* =====================================================================
     * ENGLISH
     * ===================================================================== */
    en: {
      "lang.name": "English",
      "lang.switch": "Language",

      /* --- frame -------------------------------------------------------- */
      "brand.sub": "Minecraft Server",
      "nav.players": "Players",
      "nav.world": "World",
      "nav.activity": "What's new",
      "side.connecting": "Connecting…",
      "side.up": "The server is on",
      "side.down": "The server is off",
      "side.noagent": "Can't reach the server",
      "btn.restart": "Restart the server",
      "btn.refresh": "Refresh",
      "hdr.online": "playing",
      "hdr.tps": "speed",
      "hdr.version": "version",

      "title.players": "Players",
      "sub.players": "Who is allowed into your server",
      "title.world": "World",
      "sub.world": "Your world, its copies, and how to start a new one",
      "title.activity": "What's new",
      "sub.activity": "What was done, and what the server is saying",

      /* --- explainers --------------------------------------------------- */
      "help.open": "What is this?",

      "help.roster": "Your server is private — not just anyone can walk in. Only the players on this list are allowed. If someone who isn't on it tries to join, the server turns them away with a message. So to invite a friend, you have to add their name here first.",
      "help.online": "How many people are playing right now, and how many fit at once. The limit is 4 because the computer your server lives on shares its power with some websites. If more people join than fit, the game starts stuttering for everyone.",
      "help.tps": "TPS means \"ticks per second\". Minecraft thinks about the whole world 20 times every second: animals move, grass grows, water falls. Each one of those is a tick. If this says 20, your server is running perfectly. If it drops a lot, everything moves in slow motion.",
      "help.ps5": "Getting a PS5 in takes three programs running at once, not just the game. A PlayStation won't let you type a server address, so we use a trick: we change its DNS and show it a menu of our own. If this says \"Check it\", the PS5 won't get in even though the game itself is fine.",

      "help.seed": "The seed is the number Minecraft used to draw your world. Think of it as the recipe: two worlds made from the same seed come out exactly alike, with the same mountains, the same caves and the same villages. So if you keep this number, you can build this exact world again from scratch whenever you want.",
      "help.border": "The border is an invisible wall marking how far you can walk. Your world is 3000 blocks across. Without a border, Minecraft would keep inventing new land forever and the world would eat more and more disk space. In the Nether every block counts as eight, so the border there is eight times smaller.",
      "help.size": "How much space your saved world takes up. It grows every time someone explores somewhere new, because the server has to write down what that patch of land looks like and remember it forever. That's exactly why the border exists — without a limit, this would never stop growing.",
      "help.backups": "A backup is a photo of your world, kept somewhere safe. If something goes wrong, you can go back to that photo and get everything the way it was. ⚠️ These do not happen on their own: one is made when you press \"Make a copy\", and one is also made automatically right before anything risky, just in case.",

      "help.sync": "When you add someone, their name goes into a list — and then the game has to be told the list changed. That's what syncing is. It normally happens by itself. This button is here for the rare time you added someone and the server hasn't noticed yet.",
      "help.import": "Bring in a world that already exists — one you played on your tablet, or one a friend sent you — and put it on the server so everyone can play it together. It replaces the world you have now, so a copy of the current one is saved first.",
      "help.regen": "Start a completely new world from scratch, with different mountains and caves. Your current world isn't deleted: it's set aside in case you want it back. It takes about 45 minutes, because the server draws all the land in one go so nobody gets stutters exploring later.",
      "help.restart": "Turn the server off and on again. Useful when something has gone strange or slow. Before shutting down it warns everyone playing and saves the world, so nothing is lost. It takes about a minute.",
      "help.audit": "A notebook where everything done from this panel gets written down: who you added, who you removed, when a copy was made. It's for answering \"wait, when did that happen?\" without having to remember.",
      "help.console": "What the server writes down as it works, in its own language. You don't need to understand all of it. When something breaks, these lines are what explain why.",
      "help.platform": "Minecraft comes in two versions that are different on the inside. The one on PlayStation, tablets, phones and Switch is called Bedrock. The one on computers is called Java. Your server accepts both at the same time, but it needs to know which one each player uses.",
      "help.disk": "How much room your world's copies are taking up. The disk isn't infinite, and this computer has some websites living on it too. Old copies delete themselves, and the newest one is always kept.",

      /* --- players ------------------------------------------------------ */
      "players.rosterLabel": "On the list",
      "players.rosterFoot": "allowed in",
      "players.onlineLabel": "Playing now",
      "players.onlineFoot": "of {max} spots",
      "players.tpsLabel": "Speed",
      "players.tpsFoot": "20 is perfect",
      "players.pathLabel": "PS5 route",
      "players.pathFoot": "so the console can get in",
      "players.pathOk": "All good",
      "players.pathBad": "Check it",

      "players.listTitle": "Who's allowed in",
      "players.sync": "Tell the server",
      "players.thTag": "Player name",
      "players.thPlatform": "Plays on",
      "players.thWho": "Who they are",
      "players.thState": "Status",
      "players.loading": "Loading…",
      "players.empty": "Nobody's on the list yet. Add the first one over here →",
      "players.badgePlaying": "playing",
      "players.badgeAllowed": "allowed in",
      "players.badgeUnsynced": "not told yet",
      "players.badgeUnsyncedHelp": "They're on your list, but the server hasn't been told yet. Press \"Tell the server\".",
      "players.kick": "Kick out",
      "players.remove": "Remove",
      "players.kicked": "{tag} was kicked out",
      "players.removed": "{tag} can't get in any more",
      "players.added": "{tag} can get in now",
      "players.synced": "Done — the server has the up-to-date list",

      "players.addTitle": "Invite someone",
      "players.platform": "What do they play on?",
      "players.platformBedrock": "PlayStation, iPad, Switch or phone",
      "players.platformJava": "Computer",
      "players.tag": "Their player name",
      "players.tagPh": "for example MarNarCraft99",
      "players.note": "Who are they?",
      "players.notePh": "for example MarNar — PS5",
      "players.hint": "⚠️ For PlayStation, iPad and Switch you need their Xbox or Microsoft name, not their PlayStation one. They're almost always different, and only the Xbox one works. Also don't type the little dot that shows up in front of the name in game — the server adds that itself.",
      "players.submit": "Invite",
      "players.removeTitle": "Remove {tag}?",
      "players.removeBody": "They won't be able to get in any more, and if they're playing right now it kicks them out. They don't lose anything they built, and you can invite them back whenever you want.",

      /* --- world -------------------------------------------------------- */
      "world.seedLabel": "Seed",
      "world.seedFoot": "the number your world was drawn from",
      "world.borderLabel": "Border",
      "world.borderFoot": "blocks across",
      "world.sizeLabel": "Size",
      "world.sizeFoot": "space it takes up",
      "world.backupsLabel": "Copies",
      "world.backupsFoot": "saved right now",

      "world.backupsTitle": "Copies of your world",
      "world.backupNow": "Make a copy",
      "world.thFile": "Copy",
      "world.thWhen": "When",
      "world.thSize": "Size",
      "world.noBackups": "There are no saved copies.",
      "world.notAuto": "ℹ️ Copies are not made on their own. One is made when you press the button, and one is made automatically right before anything risky.",
      "world.diskUsed": "The copies take up {mb} MB.",
      "world.restore": "Go back to this copy",
      "world.restoreTitle": "Go back to this copy?",
      "world.restoreBody": "Your world goes back to how it was {when}. Everything built after that moment is lost. Before anything changes, a copy of the world you have now is saved, so you can undo this too.",

      "world.importTitle": "Bring in a world you already have",
      "world.importFile": "The world file",
      "world.importHint": "A .zip, .tar.gz or .tar.zst file works. Inside it there has to be a file called level.dat, which is the one holding the world's information. It has to be the world folder, not the whole server folder.",
      "world.importSubmit": "Upload and use this world",
      "world.importConfirmTitle": "Use {name}?",
      "world.importConfirmBody": "Your current world is replaced by the one you just uploaded. Before anything is touched, a copy of the current one is saved and set aside, so you can come back.",
      "world.uploadFailed": "The file couldn't be uploaded. Check it isn't enormous and try again.",
      "world.uploadCut": "The upload was cut off. Try again.",

      "world.regenTitle": "⛏️ Start a new world",
      "world.regenSeed": "Seed",
      "world.regenSeedOpt": "(empty = random)",
      "world.regenSeedPh": "random",
      "world.regenSize": "Border width",
      "world.regenHint": "This replaces your current world and takes about 45 minutes. Your current world isn't deleted: a copy is saved first, and then it's set aside under a different name in case you want it back.",
      "world.regenSubmit": "Start a new world",
      "world.regenConfirmTitle": "Start a new world?",
      "world.regenConfirmBody": "Your world is replaced by a new one using {seed} and a border {size} blocks across. It takes about 45 minutes. The world you have now is saved first, so you can come back.",
      "world.regenSeedNamed": "the seed {seed}",
      "world.regenSeedRandom": "a random seed",

      /* --- what's new ---------------------------------------------------- */
      "activity.auditTitle": "What was done",
      "activity.thWhen": "When",
      "activity.thFrom": "From where",
      "activity.thWhat": "What",
      "activity.auditEmpty": "Nothing has been done yet.",
      "activity.consoleTitle": "What the server is saying",
      "activity.refresh": "Refresh",

      /* --- jobs and messages --------------------------------------------- */
      "job.working": "Working…",
      "job.running": "working · {m}m {s}s",
      "job.done": "done in {m}m {s}s",
      "job.failed": "didn't work",
      "job.note": "You can close this window. The job keeps going on the server.",
      "job.noteOk": "Finished.",
      "job.noteBad": "That didn't work. Look at the details above — your previous world is still saved on the server.",
      "job.close": "Close",
      "job.toastOk": "{title}: done",
      "job.toastBad": "{title}: didn't work",
      "job.inProgress": "Something is already running: {op}",
      "job.restartTitle": "Restarting the server",
      "job.backupTitle": "Saving a copy of your world",
      "job.restoreTitle": "Going back to {name}",
      "job.regenTitle": "Creating a new world",
      "job.importTitle": "Bringing in {name}",

      "confirm.title": "Are you sure?",
      "confirm.no": "No, leave it",
      "confirm.yes": "Yes, do it",
      "restart.title": "Restart the server?",
      "restart.body": "It warns everyone who's playing, saves the world, and starts it up again. Nobody loses anything. It takes about a minute.",

      "time.mins": "{n} min ago",
      "time.hours": "{n} h ago",
      "time.days": "{n} days ago",
      "time.justNow": "just now"
    }
  };

  var STORE = "mcadmin.lang";
  var FALLBACK = "es";                       // A-4
  var listeners = [];
  var lang = FALLBACK;

  try {
    var saved = localStorage.getItem(STORE);  // A-3
    if (saved && DICT[saved]) lang = saved;
  } catch (e) {
    // Private browsing with storage denied. Not worth failing over: the panel
    // still works, the choice just doesn't survive the tab.
  }

  /* t("players.removed", {tag: "Notch"}) — missing keys return the key itself,
   * which is ugly on screen and therefore gets noticed and fixed. */
  function t(key, vars) {
    var s = (DICT[lang] && DICT[lang][key]);
    if (s == null) s = (DICT[FALLBACK] && DICT[FALLBACK][key]);
    if (s == null) return key;
    if (!vars) return s;
    return s.replace(/\{(\w+)\}/g, function (m, name) {
      return vars[name] != null ? String(vars[name]) : m;
    });
  }

  function set(next) {
    if (!DICT[next] || next === lang) return;
    lang = next;
    try { localStorage.setItem(STORE, next); } catch (e) { /* see above */ }
    document.documentElement.lang = next;    // A-6
    listeners.forEach(function (fn) { fn(next); });
  }

  /* Applies every string that lives in the markup. Called on boot and on every
   * language change — which is what makes switching a re-render rather than a
   * reload (A-5). */
  function applyStatic(root) {
    (root || document).querySelectorAll("[data-i18n]").forEach(function (node) {
      node.textContent = t(node.getAttribute("data-i18n"));
    });
    (root || document).querySelectorAll("[data-i18n-ph]").forEach(function (node) {
      node.placeholder = t(node.getAttribute("data-i18n-ph"));
    });
    (root || document).querySelectorAll("[data-i18n-title]").forEach(function (node) {
      node.title = t(node.getAttribute("data-i18n-title"));
    });
  }

  window.I18N = {
    t: t,
    set: set,
    get: function () { return lang; },
    languages: Object.keys(DICT),
    onChange: function (fn) { listeners.push(fn); },
    applyStatic: applyStatic
  };

  document.documentElement.lang = lang;
})();
