/* MarNar's Minecraft Server — admin UI
 *
 * Vanilla, no build step. The whole app is four fetches and a poller; a bundler
 * and a framework would be more machinery than the thing they build, and this
 * has to be deployable by rsync onto a box with one shared vCPU.
 *
 * Everything that comes back from the API is rendered as text nodes, never as
 * HTML. Gamertags are chosen by whoever gets invited, so they are untrusted
 * input even though the audience is four kids.
 */
(function () {
  "use strict";

  var CFG = window.__MCADMIN_CONFIG__ || {};
  var API = (CFG.API_BASE_URL || "/api").replace(/\/$/, "");
  var REFRESH = (CFG.REFRESH_SECONDS || 20) * 1000;

  // ---- tiny helpers ------------------------------------------------------
  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function el(tag, opts, kids) {
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.cls) node.className = opts.cls;
    if (opts.text != null) node.textContent = opts.text;   // text, never HTML
    if (opts.title) node.title = opts.title;
    if (opts.onclick) node.onclick = opts.onclick;
    (kids || []).forEach(function (k) { if (k) node.appendChild(k); });
    return node;
  }

  function api(path, opts) {
    opts = opts || {};
    opts.headers = opts.headers || {};
    // In same-origin proxy mode nginx injects the bearer token, so there is
    // nothing to add here and nothing sensitive in the page. A token in
    // config.js only happens in direct-LAN mode.
    if (CFG.API_TOKEN) opts.headers.Authorization = "Bearer " + CFG.API_TOKEN;
    if (opts.json) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(opts.json);
      delete opts.json;
    }
    return fetch(API + path, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
        if (data.error) throw new Error(data.error);
        return data;
      });
    });
  }

  function toast(msg, bad) {
    var node = el("div", { cls: "toast" + (bad ? " bad" : ""), text: msg });
    $("#toasts").appendChild(node);
    setTimeout(function () { node.remove(); }, bad ? 9000 : 4500);
  }

  function fail(err) { toast(err.message || String(err), true); }

  function bytes(n) {
    if (n > 1073741824) return (n / 1073741824).toFixed(1) + " GB";
    if (n > 1048576) return Math.round(n / 1048576) + " MB";
    return Math.round(n / 1024) + " KB";
  }

  function ago(epoch) {
    var mins = Math.round((Date.now() / 1000 - epoch) / 60);
    if (mins < 60) return "hace " + mins + " min";
    if (mins < 1440) return "hace " + Math.round(mins / 60) + " h";
    return "hace " + Math.round(mins / 1440) + " días";
  }

  // ---- confirm -----------------------------------------------------------
  // One dialog, by choice — the expensive safety (a forced backup, and moving
  // the old world aside instead of deleting it) lives on the server where it
  // cannot be clicked past.
  function confirmThen(title, body, onYes) {
    $("#confirm-title").textContent = title;
    $("#confirm-body").textContent = body;
    $("#confirm-overlay").classList.remove("is-hidden");
    $("#confirm-yes").onclick = function () {
      $("#confirm-overlay").classList.add("is-hidden");
      onYes();
    };
  }
  $("#confirm-no").onclick = function () { $("#confirm-overlay").classList.add("is-hidden"); };

  // ---- jobs --------------------------------------------------------------
  var jobTimer = null;

  function watchJob(id, title) {
    $("#job-title").textContent = title;
    $("#job-log").textContent = "";
    $("#job-overlay").classList.remove("is-hidden");
    clearInterval(jobTimer);

    function poll() {
      api("/jobs/" + id).then(function (job) {
        var log = $("#job-log");
        // Only scroll to the bottom if the operator is already there — nothing
        // is more annoying during a 45 minute job than being yanked away from
        // the line you were reading.
        var pinned = log.scrollTop + log.clientHeight >= log.scrollHeight - 30;
        log.textContent = (job.log || []).join("\n");
        if (pinned) log.scrollTop = log.scrollHeight;

        var state = $("#job-state");
        var mins = Math.floor(job.elapsed / 60), secs = job.elapsed % 60;
        state.className = "pill " + (job.state === "running" ? "busy" : job.state === "ok" ? "ok" : "bad");
        state.lastChild.textContent =
          job.state === "running" ? "en curso · " + mins + "m " + secs + "s"
          : job.state === "ok" ? "listo en " + mins + "m " + secs + "s"
          : "falló";

        if (job.state !== "running") {
          clearInterval(jobTimer);
          $("#job-note").textContent = job.state === "ok"
            ? "Terminado."
            : "Falló. Mirá el detalle de arriba — el mundo anterior sigue guardado en el servidor.";
          toast(job.state === "ok" ? title + ": listo" : title + ": falló", job.state !== "ok");
          refreshAll();
        }
      }).catch(function () { /* transient; the next tick retries */ });
    }
    poll();
    jobTimer = setInterval(poll, 3000);
  }

  function startJob(op, payload, title) {
    api("/jobs", { method: "POST", json: Object.assign({ op: op }, payload || {}) })
      .then(function (res) { watchJob(res.job, title); })
      .catch(fail);
  }

  $("#job-close").onclick = function () { $("#job-overlay").classList.add("is-hidden"); };

  // ---- status ------------------------------------------------------------
  function loadStatus() {
    return api("/status").then(function (s) {
      var up = s.state === "running";
      var pill = $("#side-status");
      pill.className = "pill " + (up ? "ok" : "bad");
      pill.lastChild.textContent = up ? "Servidor en línea" : "Servidor caído";

      $("#hdr-players").textContent = s.players_online + "/" + (s.players_max || 4);
      $("#hdr-tps").textContent = s.tps || "–";
      $("#hdr-version").textContent = s.version || "–";
      $("#st-online").textContent = s.players_online;
      $("#st-max").textContent = s.players_max || 4;
      $("#st-tps").textContent = s.tps || "–";

      // The PS5 path needs all three containers. A console failing because
      // bedrock-connect is down looks identical to the game server being down,
      // so it gets its own card rather than being buried in a log.
      var ps5 = s.bedrock_connect === "running" && s.mc_dns === "running" && up;
      $("#st-path").textContent = ps5 ? "OK" : "Revisar";
      $("#st-path").style.color = ps5 ? "" : "var(--redstone)";
    });
  }

  // ---- players -----------------------------------------------------------
  function loadPlayers() {
    return api("/players").then(function (data) {
      var rows = data.players || [];
      var body = $("#players-table tbody");
      body.textContent = "";
      $("#st-roster").textContent = rows.length;

      if (!rows.length) {
        var td = el("td", { cls: "empty", text: "Todavía no hay nadie. Agregá el primer gamertag →" });
        td.colSpan = 5;
        body.appendChild(el("tr", {}, [td]));
        return;
      }

      rows.forEach(function (p) {
        var status = p.online
          ? el("span", { cls: "badge badge-online", text: "jugando" })
          : p.enforced
            ? el("span", { cls: "badge badge-off", text: "permitido" })
            // In the roster but not in whitelist.json means the sync never ran
            // or failed. Left invisible, this is exactly the "I added him and
            // he still can't join" bug — so it is called out in the row.
            : el("span", {
                cls: "badge badge-warn", text: "sin sincronizar",
                title: "Está en la lista pero el servidor todavía no lo tiene. Tocá Sincronizar."
              });

        body.appendChild(el("tr", {}, [
          el("td", {}, [el("span", { cls: "tag", text: p.tag })]),
          el("td", {}, [el("span", {
            cls: "badge badge-" + (p.platform === "java" ? "java" : "bedrock"),
            text: p.platform === "java" ? "Java" : "Bedrock"
          })]),
          el("td", { text: p.note || "—" }),
          el("td", {}, [status]),
          el("td", {}, [
            p.online ? el("button", {
              cls: "btn btn-ghost btn-sm", text: "Desconectar",
              onclick: function () {
                api("/players/" + encodeURIComponent(p.tag) + "/kick", { method: "POST" })
                  .then(function () { toast(p.tag + " desconectado"); refreshAll(); })
                  .catch(fail);
              }
            }) : null,
            el("button", {
              cls: "btn btn-ghost btn-sm", text: "Quitar",
              onclick: function () {
                confirmThen("Quitar a " + p.tag + "?",
                  "No va a poder entrar más, y si está jugando lo desconecta. Podés volver a agregarlo cuando quieras.",
                  function () {
                    api("/players/" + encodeURIComponent(p.tag), { method: "DELETE" })
                      .then(function () { toast(p.tag + " quitado de la lista"); refreshAll(); })
                      .catch(fail);
                  });
              }
            })
          ])
        ]));
      });
    });
  }

  $("#add-form").onsubmit = function (ev) {
    ev.preventDefault();
    var form = ev.target;
    var btn = form.querySelector("button");
    btn.disabled = true;
    api("/players", {
      method: "POST",
      json: {
        platform: form.platform.value,
        tag: form.tag.value.trim(),
        note: form.note.value.trim()
      }
    }).then(function () {
      toast(form.tag.value.trim() + " agregado y sincronizado");
      form.reset();
      refreshAll();
    }).catch(fail).then(function () { btn.disabled = false; });
  };

  $("#btn-sync").onclick = function () {
    api("/players/sync", { method: "POST" })
      .then(function () { toast("Lista sincronizada con el servidor"); refreshAll(); })
      .catch(fail);
  };

  $("#btn-restart").onclick = function () {
    confirmThen("¿Reiniciar el servidor?",
      "Avisa a quien esté jugando, guarda el mundo y reinicia. Tarda alrededor de un minuto.",
      function () { startJob("restart", {}, "Reiniciando el servidor"); });
  };

  // ---- world -------------------------------------------------------------
  function loadWorld() {
    return api("/world").then(function (w) {
      $("#w-seed").textContent = w.seed || "–";
      $("#w-border").textContent = w.border || "–";
      $("#w-size").textContent = (w.world_mb || 0) + " MB";
      $("#w-backups").textContent = w.backup_count || 0;
    });
  }

  function loadBackups() {
    return api("/backups").then(function (data) {
      var rows = data.backups || [];
      var body = $("#backups-table tbody");
      body.textContent = "";
      if (!rows.length) {
        var td = el("td", { cls: "empty", text: "Todavía no hay respaldos." });
        td.colSpan = 4;
        body.appendChild(el("tr", {}, [td]));
        return;
      }
      rows.forEach(function (b) {
        body.appendChild(el("tr", {}, [
          el("td", {}, [el("span", { cls: "mono", text: b.name })]),
          el("td", { text: ago(b.mtime) }),
          el("td", { text: bytes(b.bytes) }),
          el("td", {}, [el("button", {
            cls: "btn btn-ghost btn-sm", text: "Restaurar",
            onclick: function () {
              confirmThen("¿Restaurar " + b.name + "?",
                "Reemplaza el mundo actual por esta copia. Todo lo construido después de " +
                ago(b.mtime).replace("hace ", "hace ") + " se pierde. " +
                "Antes se hace un respaldo del mundo actual y se guarda aparte, así que hay vuelta atrás.",
                function () { startJob("restore", { backup: b.name }, "Restaurando " + b.name); });
            }
          })])
        ]));
      });
    });
  }

  $("#btn-backup").onclick = function () { startJob("backup", {}, "Respaldando el mundo"); };

  $("#regen-form").onsubmit = function (ev) {
    ev.preventDefault();
    var seed = ev.target.seed.value.trim();
    var size = ev.target.size.value;
    confirmThen("¿Generar un mundo nuevo?",
      "Reemplaza el mundo actual con " + (seed ? "la semilla " + seed : "una semilla al azar") +
      " y un borde de " + size + " bloques. Tarda unos 45 minutos. " +
      "El mundo actual se respalda y se guarda aparte — no se borra.",
      function () { startJob("regenerate", { seed: seed, size: size }, "Generando un mundo nuevo"); });
  };

  // Upload goes through XHR rather than fetch purely for the progress event —
  // a 300 MB world over a home connection with no feedback looks like a hang.
  $("#import-form").onsubmit = function (ev) {
    ev.preventDefault();
    var file = ev.target.file.files[0];
    if (!file) return;
    var bar = $("#upload-progress");
    var btn = ev.target.querySelector("button");
    bar.classList.remove("is-hidden");
    btn.disabled = true;

    var xhr = new XMLHttpRequest();
    xhr.open("PUT", API + "/uploads/" + encodeURIComponent(file.name));
    if (CFG.API_TOKEN) xhr.setRequestHeader("Authorization", "Bearer " + CFG.API_TOKEN);
    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) bar.firstElementChild.style.width = (e.loaded / e.total * 100) + "%";
    };
    xhr.onload = function () {
      btn.disabled = false;
      bar.classList.add("is-hidden");
      bar.firstElementChild.style.width = "0";
      var res = {};
      try { res = JSON.parse(xhr.responseText); } catch (e) { /* handled below */ }
      if (xhr.status !== 200) return fail(new Error(res.error || "la subida falló"));
      confirmThen("¿Importar " + res.archive + "?",
        "Reemplaza el mundo actual por el que acabás de subir. " +
        "El mundo actual se respalda y se guarda aparte antes de tocar nada.",
        function () { startJob("import", { archive: res.archive }, "Importando " + res.archive); });
    };
    xhr.onerror = function () {
      btn.disabled = false;
      bar.classList.add("is-hidden");
      fail(new Error("la subida se cortó"));
    };
    xhr.send(file);
  };

  // ---- activity ----------------------------------------------------------
  function loadAudit() {
    return api("/audit").then(function (data) {
      var body = $("#audit-table tbody");
      body.textContent = "";
      var rows = data.entries || [];
      if (!rows.length) {
        var td = el("td", { cls: "empty", text: "Sin actividad todavía." });
        td.colSpan = 3;
        body.appendChild(el("tr", {}, [td]));
        return;
      }
      rows.forEach(function (e) {
        body.appendChild(el("tr", {}, [
          el("td", { text: e.at.replace("T", " ").slice(0, 16) }),
          el("td", {}, [el("span", { cls: "mono", text: e.actor })]),
          el("td", { text: e.what })
        ]));
      });
    });
  }

  function loadLogs() {
    return api("/logs").then(function (data) {
      $("#server-logs").textContent = (data.lines || []).join("\n");
      $("#server-logs").scrollTop = $("#server-logs").scrollHeight;
    });
  }
  $("#btn-logs").onclick = function () { loadLogs().catch(fail); };

  // ---- views -------------------------------------------------------------
  var TITLES = {
    players: ["Jugadores", "Quién puede entrar al servidor"],
    world: ["Mundo", "Respaldos, importar y generar de nuevo"],
    activity: ["Actividad", "Qué se hizo y qué dice el servidor"]
  };
  var view = "players";

  $$(".nav-item").forEach(function (btn) {
    btn.onclick = function () {
      view = btn.dataset.view;
      $$(".nav-item").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      $$(".view").forEach(function (v) { v.classList.toggle("is-hidden", v.id !== "view-" + view); });
      $("#view-title").textContent = TITLES[view][0];
      $("#view-sub").textContent = TITLES[view][1];
      refreshAll();
    };
  });

  function refreshAll() {
    loadStatus().catch(function () {
      var pill = $("#side-status");
      pill.className = "pill bad";
      pill.lastChild.textContent = "Sin conexión al agente";
    });
    if (view === "players") loadPlayers().catch(fail);
    if (view === "world") { loadWorld().catch(fail); loadBackups().catch(fail); }
    if (view === "activity") { loadAudit().catch(fail); loadLogs().catch(fail); }
  }

  $("#btn-refresh").onclick = refreshAll;

  // If a job is already running (someone reloaded the page mid-regeneration,
  // or opened it on their phone) reattach to it instead of pretending the box
  // is idle and letting them start a second one.
  api("/jobs").then(function (data) {
    var running = (data.jobs || []).filter(function (j) { return j.state === "running"; })[0];
    if (running) watchJob(running.id, "Trabajo en curso: " + running.op);
  }).catch(function () {});

  refreshAll();
  setInterval(refreshAll, REFRESH);
})();
