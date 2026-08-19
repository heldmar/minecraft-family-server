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
      "nav.settings": "Cómo jugamos",
      "title.settings": "Cómo jugamos",
      "sub.settings": "Las reglas de tu mundo — se cambian en el momento",
      "settings.title": "Reglas del juego",
      "settings.instant": "Todo esto se cambia al toque y no rompe nada. No se reinicia el servidor y tu mundo queda igual, con todo lo que construiste.",
      "settings.saved": "Listo: {what}",
      "settings.offline": "El servidor está apagado, así que no puedo leer las reglas.",
      "help.settings": "Minecraft tiene reglas que deciden qué tan bravo es el mundo: si los monstruos pegan fuerte, si perdés tus cosas al morir, si se hace de noche. No son parte del terreno, así que se pueden cambiar cuando quieras sin empezar un mundo nuevo. Probá una, jugá un rato, y si no te gustó volvé a cambiarla.",

      "set.difficulty.name": "Dificultad",
      "set.difficulty.note": "Qué tan fuerte te pegan los monstruos. Ojo: no cambia cuántos golpes hay que darles a ellos — para eso hace falta una espada mejor.",
      "set.difficulty.peaceful": "Sin monstruos",
      "set.difficulty.easy": "Fácil",
      "set.difficulty.normal": "Normal",
      "set.difficulty.hard": "Difícil",

      "set.keep_inventory.name": "Guardar tus cosas al morir",
      "set.keep_inventory.note": "Si está en Sí, cuando te morís no perdés nada. Vale en los tres mundos: el normal, el Nether y el End.",
      "set.keep_inventory.true": "Sí",
      "set.keep_inventory.false": "No",

      "set.sleep.name": "Cuántos tienen que dormir",
      "set.sleep.note": "Para saltear la noche entre todos. Con seis jugadores, pedir que duerman todos casi nunca funciona.",
      "set.sleep.1": "Con uno alcanza",
      "set.sleep.50": "La mitad",
      "set.sleep.100": "Todos",

      "set.spawn_monsters.name": "Aparecen monstruos",
      "set.spawn_monsters.note": "Zombis, esqueletos, creepers. Si lo apagás, el mundo queda tranquilo para construir.",
      "set.spawn_monsters.true": "Sí",
      "set.spawn_monsters.false": "No",

      "set.spawn_phantoms.name": "Aparecen fantasmas",
      "set.spawn_phantoms.note": "Los bichos que vuelan y te atacan cuando hace muchos días que no dormís.",
      "set.spawn_phantoms.true": "Sí",
      "set.spawn_phantoms.false": "No",

      "set.mob_griefing.name": "Los monstruos rompen bloques",
      "set.mob_griefing.note": "Si está en No, los creepers explotan igual y te lastiman, pero no te hacen pozos ni te vuelan lo que construiste.",
      "set.mob_griefing.true": "Sí",
      "set.mob_griefing.false": "No",

      "set.fall_damage.name": "Te lastimás al caer",
      "set.fall_damage.note": "Si está en No, podés caerte de donde sea sin perder corazones.",
      "set.fall_damage.true": "Sí",
      "set.fall_damage.false": "No",

      "set.advance_time.name": "Pasa el día y la noche",
      "set.advance_time.note": "Si lo apagás queda de día para siempre, y el reloj del mundo se congela ahí.",
      "set.advance_time.true": "Sí",
      "set.advance_time.false": "No",

      "set.advance_weather.name": "Cambia el clima",
      "set.advance_weather.note": "Si lo apagás no llueve nunca más y el cielo queda despejado.",
      "set.advance_weather.true": "Sí",
      "set.advance_weather.false": "No",

      "title.activity": "Novedades",
      "sub.activity": "Qué se hizo y qué está diciendo el servidor",

      /* --- explicadores ------------------------------------------------ */
      "help.open": "¿Qué es esto?",

      "help.roster": "Tu servidor es privado: no entra cualquiera. Solo pueden entrar los jugadores que estén en esta lista. Si alguien no está en la lista e intenta entrar, el servidor lo rechaza y le muestra un mensaje. Por eso, para invitar a un amigo, primero tenés que agregar su nombre acá.",
      "help.online": "Cuántos están jugando ahora mismo, y cuántos caben a la vez. El límite es 4 porque la computadora donde vive tu servidor comparte su potencia con otras páginas web. Si entran más de los que caben, el juego empieza a andar a los tirones para todos.",
      "help.tps": "TPS quiere decir «tics por segundo». Minecraft piensa el mundo entero 20 veces por segundo: mueve a los animales, crece el pasto, cae el agua. Cada una de esas veces es un tic. Si el número dice 20, el servidor va perfecto. Si baja mucho, todo se mueve en cámara lenta.",
      "help.connect": "Un servidor es una computadora que está prendida todo el día en otro lado esperando que entren. Para llegar hasta ella hacen falta dos cosas: la dirección, que funciona como el nombre de una calle, y el puerto, que es como el número de la puerta. En una misma computadora pueden estar funcionando muchas cosas a la vez, y el puerto dice a cuál de todas le estás tocando el timbre. Los que juegan con Java no tienen que escribir el puerto porque el servidor se lo pasa solo. La PlayStation es distinta: Sony no le puso ningún lugar para escribir una dirección, así que hay que hacerle una trampita — se le cambia el DNS, que es la guía de teléfonos que usa la consola para saber a dónde llamar, y así cuando busca sus servidores nos encuentra a nosotros.",

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

      /* --- cómo entrar -------------------------------------------------- */
      "connect.title": "Cómo entrar al servidor",
      "connect.sub": "Esto es lo que le tenés que pasar a un amigo para que entre. Tocá «Copiar» y mandáselo.",
      "connect.bedrockWhat": "iPad, celular, Switch o compu con Bedrock",
      "connect.javaWhat": "Compu con Java",
      "connect.ps5What": "PlayStation 5",
      "connect.addressLabel": "Dirección",
      "connect.portLabel": "Puerto",
      "connect.noPort": "no hace falta",
      "connect.copy": "Copiar",
      "connect.copied": "Copiado: {v}",
      "connect.copyFail": "No pude copiarlo solo. Marcá el texto con el dedo o el mouse y copialo a mano.",
      "connect.ps5Plus": "necesita PlayStation Plus",
      "connect.ps5DnsIntro": "En la PS5 no hay ningún lugar para escribir la dirección del servidor. Se arregla cambiando estos dos números en los ajustes de red de la consola. Lo hace el papá o la mamá de tu amigo, una sola vez:",
      "connect.ps5Dns1Label": "DNS primario",
      "connect.ps5Dns2Label": "DNS secundario",
      "connect.ps5Dns2Warn": "⚠️ El segundo número hay que ponerlo sí o sí. Nuestro servidor contesta solamente por Minecraft, así que sin el segundo la consola se queda sin internet para todo lo demás: la tienda, los videos y los otros juegos.",
      "connect.ps5StepsIntro": "Después de eso, cada vez que quiera jugar:",
      "connect.ps5Step1": "Abrir Minecraft y tocar Jugar, y arriba la pestaña Servidores.",
      "connect.ps5Step2": "Tocar cualquiera de los servidores grandes que aparecen en la lista. Cuál toque no importa.",
      "connect.ps5Step3": "Va a aparecer un menú nuestro. Ahí elegir «MarNar Server» y listo.",
      "connect.ps5Roster": "⚠️ Dos cosas lo dejan afuera aunque haga todo bien: que no tenga PlayStation Plus, que es la suscripción paga de Sony y sin ella la consola no entra a ningún servidor; y que su gamertag no esté en la lista de acá arriba. Pedile el gamertag de Xbox, no el nombre de PlayStation, que casi siempre es distinto.",

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
      "players.badgeUnsyncedHelp": "Está en tu lista, pero el servidor todavía no se enteró. Tocá «Avisarle al servidor». Si después de tocarlo sigue igual, pedile que intente entrar una vez (lo va a rechazar, está bien) y tocá «Avisarle al servidor» de nuevo: ese intento es lo que hace que el servidor lo reconozca.",
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
      "nav.settings": "How we play",
      "title.settings": "How we play",
      "sub.settings": "Your world's rules — they change straight away",
      "settings.title": "Game rules",
      "settings.instant": "All of this changes straight away and breaks nothing. The server doesn't restart, and your world stays exactly as it is, with everything you built.",
      "settings.saved": "Done: {what}",
      "settings.offline": "The server is off, so I can't read the rules.",
      "help.settings": "Minecraft has rules that decide how tough your world is: whether monsters hit hard, whether you lose your things when you die, whether night falls. They aren't part of the land, so you can change them whenever you like without starting a new world. Try one, play for a bit, and change it back if you didn't like it.",

      "set.difficulty.name": "Difficulty",
      "set.difficulty.note": "How hard monsters hit you. Careful: it does not change how many hits THEY take — that needs a better sword.",
      "set.difficulty.peaceful": "No monsters",
      "set.difficulty.easy": "Easy",
      "set.difficulty.normal": "Normal",
      "set.difficulty.hard": "Hard",

      "set.keep_inventory.name": "Keep your stuff when you die",
      "set.keep_inventory.note": "Set to Yes, dying costs you nothing. It counts in all three worlds: the normal one, the Nether and the End.",
      "set.keep_inventory.true": "Yes",
      "set.keep_inventory.false": "No",

      "set.sleep.name": "How many must sleep",
      "set.sleep.note": "To skip the night together. With six players, needing everyone in bed almost never happens.",
      "set.sleep.1": "Just one is enough",
      "set.sleep.50": "Half of you",
      "set.sleep.100": "Everyone",

      "set.spawn_monsters.name": "Monsters appear",
      "set.spawn_monsters.note": "Zombies, skeletons, creepers. Turn it off and the world is calm for building.",
      "set.spawn_monsters.true": "Yes",
      "set.spawn_monsters.false": "No",

      "set.spawn_phantoms.name": "Phantoms appear",
      "set.spawn_phantoms.note": "The flying ones that swoop at you when you haven't slept for days.",
      "set.spawn_phantoms.true": "Yes",
      "set.spawn_phantoms.false": "No",

      "set.mob_griefing.name": "Monsters break blocks",
      "set.mob_griefing.note": "Set to No, creepers still explode and still hurt you, but they don't leave craters or blow up what you built.",
      "set.mob_griefing.true": "Yes",
      "set.mob_griefing.false": "No",

      "set.fall_damage.name": "Falling hurts you",
      "set.fall_damage.note": "Set to No, you can fall from anywhere without losing hearts.",
      "set.fall_damage.true": "Yes",
      "set.fall_damage.false": "No",

      "set.advance_time.name": "Day and night pass",
      "set.advance_time.note": "Turn it off and it stays daytime forever — the world's clock freezes there.",
      "set.advance_time.true": "Yes",
      "set.advance_time.false": "No",

      "set.advance_weather.name": "Weather changes",
      "set.advance_weather.note": "Turn it off and it never rains again; the sky stays clear.",
      "set.advance_weather.true": "Yes",
      "set.advance_weather.false": "No",

      "title.activity": "What's new",
      "sub.activity": "What was done, and what the server is saying",

      /* --- explainers --------------------------------------------------- */
      "help.open": "What is this?",

      "help.roster": "Your server is private — not just anyone can walk in. Only the players on this list are allowed. If someone who isn't on it tries to join, the server turns them away with a message. So to invite a friend, you have to add their name here first.",
      "help.online": "How many people are playing right now, and how many fit at once. The limit is 4 because the computer your server lives on shares its power with some websites. If more people join than fit, the game starts stuttering for everyone.",
      "help.tps": "TPS means \"ticks per second\". Minecraft thinks about the whole world 20 times every second: animals move, grass grows, water falls. Each one of those is a tick. If this says 20, your server is running perfectly. If it drops a lot, everything moves in slow motion.",
      "help.connect": "A server is a computer sitting somewhere else, switched on all day, waiting for people to join. Getting to it takes two things: the address, which works like a street name, and the port, which is like the door number. One computer can be running lots of things at once, and the port says which of them you're ringing the bell for. Java players don't have to type the port because the server hands it to them automatically. A PlayStation is different: Sony never gave it anywhere to type an address, so it needs a little trick — you change its DNS, which is the phone book the console uses to look up where to call, and then when it goes looking for its own servers it finds us instead.",

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

      /* --- how to join -------------------------------------------------- */
      "connect.title": "How to join the server",
      "connect.sub": "This is what you send a friend so they can get in. Tap \"Copy\" and send it to them.",
      "connect.bedrockWhat": "iPad, phone, Switch or Bedrock on a computer",
      "connect.javaWhat": "Java on a computer",
      "connect.ps5What": "PlayStation 5",
      "connect.addressLabel": "Address",
      "connect.portLabel": "Port",
      "connect.noPort": "not needed",
      "connect.copy": "Copy",
      "connect.copied": "Copied: {v}",
      "connect.copyFail": "Couldn't copy it for you. Select the text with your finger or mouse and copy it by hand.",
      "connect.ps5Plus": "needs PlayStation Plus",
      "connect.ps5DnsIntro": "A PS5 has nowhere to type a server address. You get around it by changing these two numbers in the console's network settings. Your friend's mum or dad does this, once:",
      "connect.ps5Dns1Label": "Primary DNS",
      "connect.ps5Dns2Label": "Secondary DNS",
      "connect.ps5Dns2Warn": "⚠️ The second number is not optional. Our server only answers for Minecraft, so without the second one the console loses internet for everything else: the store, videos and other games.",
      "connect.ps5StepsIntro": "After that, every time they want to play:",
      "connect.ps5Step1": "Open Minecraft, tap Play, then the Servers tab along the top.",
      "connect.ps5Step2": "Tap any of the big servers in the list. It doesn't matter which one.",
      "connect.ps5Step3": "A menu of ours will come up. Choose \"MarNar Server\" and you're in.",
      "connect.ps5Roster": "⚠️ Two things keep them out even if they do everything right: not having PlayStation Plus, which is Sony's paid subscription and without it the console can't join any server at all; and their gamertag not being on the list above. Ask them for their Xbox gamertag, not their PlayStation name — they're usually different.",

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
      "players.badgeUnsyncedHelp": "They're on your list, but the server hasn't been told yet. Press \"Tell the server\". If it still looks the same afterwards, ask them to try to join once (it will turn them away, that's fine) and press \"Tell the server\" again: that attempt is what makes the server recognise them.",
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
