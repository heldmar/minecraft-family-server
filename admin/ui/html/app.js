/* MarNar's Minecraft Server — admin UI
 *
 * Vanilla, no build step. The whole app is four fetches and a poller; a bundler
 * and a framework would be more machinery than the thing they build, and this
 * has to be deployable by rsync onto a box with one shared vCPU.
 *
 * Everything that comes back from the API is rendered as text nodes, never as
 * HTML. Gamertags are chosen by whoever gets invited, so they are untrusted
 * input even though the audience is four kids.
 *
 * Every visible string comes from i18n.js. If you find yourself typing a word
 * a user will read directly into this file, it belongs in the dictionary
 * instead — otherwise it silently stays Spanish in English mode (A-1).
 */
(function () {
  "use strict";

  var CFG = window.__MCADMIN_CONFIG__ || {};
  var API = (CFG.API_BASE_URL || "/api").replace(/\/$/, "");
  var REFRESH = (CFG.REFRESH_SECONDS || 20) * 1000;
  var t = window.I18N.t;

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
    if (mins < 1) return t("time.justNow");
    if (mins < 60) return t("time.mins", { n: mins });
    if (mins < 1440) return t("time.hours", { n: Math.round(mins / 60) });
    return t("time.days", { n: Math.round(mins / 1440) });
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
  // The running job's title is kept as a key plus its variables rather than as
  // finished text, so switching language mid-job relabels it instead of
  // leaving a Spanish heading over an English page (A-5).
  var job = null;

  function jobTitle() {
    return job ? t(job.titleKey, job.titleVars) : "";
  }

  function renderJob(data) {
    if (!job) return;
    $("#job-title").textContent = jobTitle();
    if (!data) return;

    var log = $("#job-log");
    // Only scroll to the bottom if the operator is already there — nothing is
    // more annoying during a 45 minute job than being yanked away from the
    // line you were reading.
    var pinned = log.scrollTop + log.clientHeight >= log.scrollHeight - 30;
    log.textContent = (data.log || []).join("\n");
    if (pinned) log.scrollTop = log.scrollHeight;

    var state = $("#job-state");
    var mins = Math.floor(data.elapsed / 60), secs = data.elapsed % 60;
    state.className = "pill " + (data.state === "running" ? "busy" : data.state === "ok" ? "ok" : "bad");
    state.lastChild.textContent =
      data.state === "running" ? t("job.running", { m: mins, s: secs })
      : data.state === "ok" ? t("job.done", { m: mins, s: secs })
      : t("job.failed");

    $("#job-note").textContent =
      data.state === "running" ? t("job.note")
      : data.state === "ok" ? t("job.noteOk")
      : t("job.noteBad");
  }

  function watchJob(id, titleKey, titleVars) {
    job = { id: id, titleKey: titleKey, titleVars: titleVars || {}, last: null };
    $("#job-log").textContent = "";
    $("#job-overlay").classList.remove("is-hidden");
    renderJob(null);
    clearInterval(jobTimer);

    function poll() {
      api("/jobs/" + id).then(function (data) {
        job.last = data;
        renderJob(data);
        if (data.state !== "running") {
          clearInterval(jobTimer);
          toast(t(data.state === "ok" ? "job.toastOk" : "job.toastBad", { title: jobTitle() }),
                data.state !== "ok");
          refreshAll();
        }
      }).catch(function () { /* transient; the next tick retries */ });
    }
    poll();
    jobTimer = setInterval(poll, 3000);
  }

  function startJob(op, payload, titleKey, titleVars) {
    api("/jobs", { method: "POST", json: Object.assign({ op: op }, payload || {}) })
      .then(function (res) { watchJob(res.job, titleKey, titleVars); })
      .catch(fail);
  }

  $("#job-close").onclick = function () { $("#job-overlay").classList.add("is-hidden"); };

  // ---- status ------------------------------------------------------------
  var lastStatus = null;

  function loadStatus() {
    return api("/status").then(function (s) {
      lastStatus = s;
      var up = s.state === "running";
      var pill = $("#side-status");
      pill.className = "pill " + (up ? "ok" : "bad");
      pill.lastChild.textContent = up ? t("side.up") : t("side.down");

      $("#hdr-players").textContent = s.players_online + "/" + (s.players_max || 4);
      $("#hdr-tps").textContent = s.tps || "–";
      $("#hdr-version").textContent = s.version || "–";
      $("#st-online").textContent = s.players_online;
      $("#st-online-foot").textContent = t("players.onlineFoot", { max: s.players_max || 4 });
      $("#st-tps").textContent = s.tps || "–";

      // The PS5 path needs all three containers. A console failing because
      // bedrock-connect is down looks identical to the game server being down,
      // so it gets its own card rather than being buried in a log.
      var ps5 = s.bedrock_connect === "running" && s.mc_dns === "running" && up;
      $("#st-path").textContent = ps5 ? t("players.pathOk") : t("players.pathBad");
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
        var td = el("td", { cls: "empty", text: t("players.empty") });
        td.colSpan = 5;
        body.appendChild(el("tr", {}, [td]));
        return;
      }

      rows.forEach(function (p) {
        var status = p.online
          ? el("span", { cls: "badge badge-online", text: t("players.badgePlaying") })
          : p.enforced
            ? el("span", { cls: "badge badge-off", text: t("players.badgeAllowed") })
            // In the roster but not in whitelist.json means the sync never ran
            // or failed. Left invisible, this is exactly the "I added him and
            // he still can't join" bug — so it is called out in the row.
            : el("span", {
                cls: "badge badge-warn", text: t("players.badgeUnsynced"),
                title: t("players.badgeUnsyncedHelp")
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
              cls: "btn btn-ghost btn-sm", text: t("players.kick"),
              onclick: function () {
                api("/players/" + encodeURIComponent(p.tag) + "/kick", { method: "POST" })
                  .then(function () { toast(t("players.kicked", { tag: p.tag })); refreshAll(); })
                  .catch(fail);
              }
            }) : null,
            el("button", {
              cls: "btn btn-ghost btn-sm", text: t("players.remove"),
              onclick: function () {
                confirmThen(t("players.removeTitle", { tag: p.tag }), t("players.removeBody"),
                  function () {
                    api("/players/" + encodeURIComponent(p.tag), { method: "DELETE" })
                      .then(function () { toast(t("players.removed", { tag: p.tag })); refreshAll(); })
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
    var tag = form.tag.value.trim();
    btn.disabled = true;
    api("/players", {
      method: "POST",
      json: { platform: form.platform.value, tag: tag, note: form.note.value.trim() }
    }).then(function () {
      toast(t("players.added", { tag: tag }));
      form.reset();
      refreshAll();
    }).catch(fail).then(function () { btn.disabled = false; });
  };

  $("#btn-sync").onclick = function () {
    api("/players/sync", { method: "POST" })
      .then(function () { toast(t("players.synced")); refreshAll(); })
      .catch(fail);
  };

  $("#btn-restart").onclick = function () {
    confirmThen(t("restart.title"), t("restart.body"),
      function () { startJob("restart", {}, "job.restartTitle"); });
  };

  // ---- world -------------------------------------------------------------
  function loadWorld() {
    return api("/world").then(function (w) {
      $("#w-seed").textContent = w.seed || "–";
      $("#w-border").textContent = w.border || "–";
      $("#w-size").textContent = (w.world_mb || 0) + " MB";
      $("#w-backups").textContent = w.backup_count || 0;
      // D-5: "is this filling up?" answerable without SSH.
      $("#backup-disk").textContent = t("world.diskUsed", { mb: w.backups_mb || 0 });
    });
  }

  function loadBackups() {
    return api("/backups").then(function (data) {
      var rows = data.backups || [];
      var body = $("#backups-table tbody");
      body.textContent = "";
      if (!rows.length) {
        var td = el("td", { cls: "empty", text: t("world.noBackups") });
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
            cls: "btn btn-ghost btn-sm", text: t("world.restore"),
            onclick: function () {
              confirmThen(t("world.restoreTitle"),
                t("world.restoreBody", { when: ago(b.mtime) }),
                function () {
                  startJob("restore", { backup: b.name }, "job.restoreTitle", { name: b.name });
                });
            }
          })])
        ]));
      });
    });
  }

  $("#btn-backup").onclick = function () { startJob("backup", {}, "job.backupTitle"); };

  $("#regen-form").onsubmit = function (ev) {
    ev.preventDefault();
    var seed = ev.target.seed.value.trim();
    var size = ev.target.size.value;
    confirmThen(t("world.regenConfirmTitle"), t("world.regenConfirmBody", {
      seed: seed ? t("world.regenSeedNamed", { seed: seed }) : t("world.regenSeedRandom"),
      size: size
    }), function () {
      startJob("regenerate", { seed: seed, size: size }, "job.regenTitle");
    });
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
      if (xhr.status !== 200) return fail(new Error(res.error || t("world.uploadFailed")));
      confirmThen(t("world.importConfirmTitle", { name: res.archive }),
        t("world.importConfirmBody"),
        function () {
          startJob("import", { archive: res.archive }, "job.importTitle", { name: res.archive });
        });
    };
    xhr.onerror = function () {
      btn.disabled = false;
      bar.classList.add("is-hidden");
      fail(new Error(t("world.uploadCut")));
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
        var td = el("td", { cls: "empty", text: t("activity.auditEmpty") });
        td.colSpan = 3;
        body.appendChild(el("tr", {}, [td]));
        return;
      }
      rows.forEach(function (e) {
        body.appendChild(el("tr", {}, [
          el("td", { text: e.at.replace("T", " ").slice(0, 16) }),
          el("td", {}, [el("span", { cls: "mono", text: e.actor })]),
          // Audit text is a record of what happened, written by the server.
          // It is data, not copy, so it is shown as-is rather than translated (A-7).
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
  var view = "players";

  function paintTitles() {
    $("#view-title").textContent = t("title." + view);
    $("#view-sub").textContent = t("sub." + view);
  }

  $$(".nav-item").forEach(function (btn) {
    btn.onclick = function () {
      view = btn.dataset.view;
      $$(".nav-item").forEach(function (b) { b.classList.toggle("is-active", b === btn); });
      $$(".view").forEach(function (v) { v.classList.toggle("is-hidden", v.id !== "view-" + view); });
      paintTitles();
      refreshAll();
    };
  });

  function refreshAll() {
    loadStatus().catch(function () {
      var pill = $("#side-status");
      pill.className = "pill bad";
      pill.lastChild.textContent = t("side.noagent");
    });
    if (view === "players") loadPlayers().catch(fail);
    if (view === "world") { loadWorld().catch(fail); loadBackups().catch(fail); }
    if (view === "activity") { loadAudit().catch(fail); loadLogs().catch(fail); }
  }

  $("#btn-refresh").onclick = refreshAll;

  // ---- language ----------------------------------------------------------
  function paintLangButtons() {
    $$(".lang-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.dataset.lang === window.I18N.get());
    });
  }

  $$(".lang-btn").forEach(function (b) {
    b.onclick = function () { window.I18N.set(b.dataset.lang); };
  });

  // Switching re-renders in place: no reload, the running job keeps its poller
  // and its elapsed time, and anything half-typed into a form stays there,
  // because applyStatic only ever touches labels and placeholders (A-5).
  window.I18N.onChange(function () {
    window.I18N.applyStatic();
    paintTitles();
    paintLangButtons();
    renderJob(job && job.last);
    refreshAll();
  });

  // ---- boot --------------------------------------------------------------
  window.I18N.applyStatic();
  paintTitles();
  paintLangButtons();

  // If a job is already running (someone reloaded the page mid-regeneration,
  // or opened it on their phone) reattach to it instead of pretending the box
  // is idle and letting them start a second one.
  api("/jobs").then(function (data) {
    var running = (data.jobs || []).filter(function (j) { return j.state === "running"; })[0];
    if (running) watchJob(running.id, "job.inProgress", { op: running.op });
  }).catch(function () {});

  refreshAll();
  setInterval(refreshAll, REFRESH);
})();
