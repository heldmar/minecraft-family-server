# Admin panel — Revision 2

**Requested by:** Helder, 2026-08-11
**Applies to:** the admin panel at <https://minecraft-admin.example.net> (`admin/`)
**Parent document:** [`REQUIREMENTS.md`](REQUIREMENTS.md) — F-10b, S-9, S-10, S-11 still hold
**Status:** ✅ Done, 2026-08-11 — deployed and walked through §4. Two checks (7, 8) are
verified by component rather than end-to-end, on purpose; the reasons are in that table.

Revision 1 built a panel for an operator. Revision 2 changes who it is for.

---

## 0. The change in audience, which drives everything else

The panel's reader is **MarNar, who is 12**, not a system administrator. That single fact is
the reason for three of the four requests below: the language switch exists because he
reads Spanish; the rewrite exists because the current copy assumes knowledge he does not
have yet; and the backup changes exist because scheduled machinery he did not ask for and
cannot see is machinery he cannot reason about.

Helder's framing, which is the useful part: the explanatory text is **not just a
safety measure, it is a chance for MarNar to learn something**. A panel that says "Semilla:
1944975880419099066" teaches nothing. A panel that explains what a seed *is* turns an
admin screen into a reason to be curious.

So the bar for every string in this panel is: **would a curious 12-year-old understand
this, and would reading it leave him knowing something he didn't know before?**

---

## 1. Requirements

### A — Language (request 1)

| ID | Requirement |
|---|---|
| **A-1** | The panel SHALL be fully available in **Spanish and English**. No string may be left untranslated in either language — including toasts, confirm dialogs, table headers, empty states, error text and job status. |
| **A-2** | A **language switch** SHALL be visible on every screen, reachable without opening a menu. |
| **A-3** | The chosen language SHALL **persist across visits and reloads**, per browser (`localStorage`). |
| **A-4** | The default for a browser that has never chosen SHALL be **Spanish** — it is MarNar's language and every player-facing document in this repo is already Spanish. |
| **A-5** | Switching language SHALL re-render the page in place. It SHALL NOT reload, and SHALL NOT interrupt a running job or lose an in-progress form. |
| **A-6** | `<html lang>` SHALL track the active language, so screen readers and browser translation behave correctly. |
| **A-7** | ⚠️ Translation SHALL NOT be applied to data. Gamertags, seeds, filenames, log lines and audit entries are values, not copy, and are rendered as-is. |

### B — Writing for a 12-year-old (request 2)

| ID | Requirement |
|---|---|
| **B-1** | All copy SHALL be rewritten in plain language. Terms assuming prior knowledge — *TPS*, *sync*, *chunk*, *seed*, *allowlist*, *border*, *restore*, *import*, *agent* — SHALL either be replaced with everyday words or explained where they appear. |
| **B-2** | Each setting or figure SHALL carry an expandable **"¿Qué es esto?" / "What is this?"** explainer, collapsed by default, that teaches the concept rather than restating the label. |
| **B-3** | Explainers SHALL be **educational, not merely reassuring**: what the thing is, why it exists, and what changes if it changes. Two to four sentences. Concrete over abstract. |
| **B-4** | Destructive actions SHALL state their consequence in terms a child can act on — what is lost, how long it takes, and whether it can be undone. |
| **B-5** | Error messages SHALL say what to try next, not only what failed. |
| **B-6** | ⚠️ The rewrite SHALL NOT remove information an operator needs. The Xbox-gamertag warning, the "not synced yet" state and the PS5-path check are load-bearing — they are reworded, never dropped. |

### C — No scheduled backups (request 3)

| ID | Requirement |
|---|---|
| **C-1** | The **scheduled nightly backup SHALL be turned off**. `marnar-mc-backup.timer` is disabled and stopped; nothing writes to `/home/mcadmin/backups/` on a schedule. |
| **C-2** | ✅ **The backup taken immediately before a destructive world operation SHALL remain.** *(Decided by Helder, 2026-08-11.)* It is on-demand rather than scheduled, and it is the only reason "generate a new world" and "import a world" are undoable — which matters more, not less, when a 12-year-old is the one pressing them. |
| **C-3** | The manual **"Back up now"** button SHALL remain. Turning off the schedule removes automation, not the ability. |
| **C-4** | The panel SHALL NOT claim or imply that backups happen automatically. Wherever backups are shown, the UI SHALL say plainly that they are made only when asked, or before something risky. |
| **C-5** | ⚠️ `marnar-mc-backup` itself SHALL keep working unchanged. C-1 disables the **timer**, not the script — C-2 depends on the script. |
| **C-6** | O-6 in the parent document (nightly backup) is **superseded** by this section and SHALL be marked as such, with the reason and the date. |

### D — Disk space (request 4)

| ID | Requirement |
|---|---|
| **D-1** | The **existing backups SHALL be deleted**. *(Decided by Helder, 2026-08-11: delete all, not keep-newest.)* |
| **D-2** | Disk SHALL NOT silently refill. Because C-2 keeps making pre-operation backups, retention SHALL be enforced rather than left unbounded. |
| **D-3** | ⚠️ **`world.replaced-*` directories SHALL be pruned to the most recent one.** These are the real consumer — roughly **816 MB each, uncompressed, forever** — and nothing deleted them before. A compressed backup is ~283 MB by comparison. |
| **D-4** | Pruning SHALL always leave the most recent copy of each kind. "Free disk" must never mean "no way back from the last thing you did". |
| **D-5** | The panel SHALL show how much disk the backups and replaced worlds are using, so the question "is this filling up?" is answerable without SSH. |

---

## 2. Decisions taken, with their reasoning

| # | Decision | Why |
|---|---|---|
| 1 | Pre-operation backup **stays** | Asked 2026-08-11; Helder chose to keep it. Without it, "Generate a new world" destroys the pre-generated world (seed `1944975880419099066`, ~45 min of terrain generation) with no way back. |
| 2 | Existing backups **all deleted** | Asked 2026-08-11; Helder chose delete-all over keep-newest. ⚠️ Recorded consequence below. |
| 3 | Explainers are **collapsed by default** | Asked 2026-08-11; chosen over always-visible one-liners. Keeps the screen calm while rewarding curiosity — and gives room for a real explanation rather than a caption. |
| 4 | Default language **Spanish** | Not asked; MarNar's language, and consistent with `SETUP-PS5.md` and `SETUP-IPAD-Y-PC.md`. Reversible in one click. |
| 5 | Retention added rather than just a one-time delete | Not asked. A one-time delete satisfies the request today and regrows silently; D-2/D-3 make it stay solved. |

### ⚠️ Recorded consequence of decision 2

After this change, **the world exists in exactly one place** — live on the server. There is
no backup, no offsite copy, and S3 (O-4a) is explicitly parked. If the volume or the world
files are lost, the world is lost, including everything MarNar and his friends build.

The risk was raised before the decision and accepted. The first destructive operation will
create a fresh backup automatically (C-2), so this window narrows the moment anything
interesting happens — but until then it is genuinely one copy. This is the argument for
picking O-4a back up once people are actually playing.

---

## 3. Out of scope

Named so nobody has to guess whether they were forgotten:

- **S3 / offsite backups (O-4a)** — still parked. Request 3 explicitly anticipates it.
- **Per-user accounts or roles.** Authentication is still the NPM Access List (S-10). MarNar
  and Helder share one credential; the panel cannot tell them apart, so it cannot show
  MarNar a smaller set of buttons.
- **Translating the player-facing setup guides.** `SETUP-PS5.md` and `SETUP-IPAD-Y-PC.md`
  stay Spanish-only; they are for the other parents, not for this panel.
- **A build step.** The panel stays three-plus-one static files served by nginx.

---

## 4. Acceptance

Revision 2 is done when all of the following hold:

Walked 2026-08-11. The UI checks were run against a local stub serving the **real**
`admin/ui/html` files with a faked `/api/*`, so nothing touched the live world.

| # | Check | Result |
|---|---|---|
| 1 | Every screen renders fully in English and fully in Spanish, with no leftover strings from the other language | ✅ All three views (Players / World / What's new) screenshotted in both languages. Also machine-checked: **148 keys per language, exact parity**, and all 146 keys referenced by the code resolve in both. |
| 2 | The chosen language survives a reload, and a hard reload, in the same browser | ✅ Set to EN, reloaded, still EN. Stored as `mcadmin.lang` in `localStorage`. |
| 3 | Switching language mid-job does not detach the job view or reload the page | ✅ — **but only after a fix.** See the note below. Verified with a job stuck in `running`: the overlay relabelled in place, the elapsed clock kept counting through the switch (2m25s → 2m34s) rather than resetting, the log stayed put, and the log lines were **not** translated. |
| 4 | Every stat and every setting has a working "What is this?" explainer that teaches the concept | ✅ **16** `<details class="help">` blocks; every one resolves to a non-empty body in both languages, and no body is accidentally identical across languages (which would mean an untranslated string). Expansion confirmed visually. |
| 5 | `systemctl is-enabled marnar-mc-backup.timer` → `disabled`, and `list-timers` no longer shows it | ✅ `disabled`, `inactive`. `list-timers --all` shows only `marnar-mc-restart.timer`. |
| 6 | `/home/mcadmin/backups/minecraft` contains no `world-*.tar.zst` | ✅ Zero archives; both `daily/` and `weekly/` empty (directories kept). 566 MB freed, disk 14% → 13%, 160 G free. |
| 7 | Triggering a destructive operation still produces a backup first, and still moves the old world aside | ⚠️ **Verified by component, not end-to-end.** `preserve_current_world` calls `marnar-mc-backup` then `mv`s the world aside, and `marnar-mc-backup` was run live twice against the real world (283 MB each, saving re-enabled both times, no overwrite on the same-day repeat). The end-to-end path was **deliberately not run**: it would destroy the current world, and per decision 2 there is no restore point. Worth doing on the next intentional world regeneration. |
| 8 | After two destructive operations, only one `world.replaced-*` directory remains | ⚠️ **Verified by unit test, not end-to-end**, for the same reason. `prune_keeping_newest` was exercised against the actual shipped function: keeps the newest **by mtime** (creation order deliberately shuffled so a name-sorted implementation would fail), refuses via `die` when `keep=0`, exits 0 on no match. |
| 9 | The panel states plainly that backups are not automatic | ✅ Notice on the backups card, in both languages: *"Las copias no se hacen solas. Se hacen cuando tocás el botón, y también solas justo antes de algo peligroso."* Styled as `.notice`, not `.hint`, so it does not read as an error. |
| 10 | Nothing in `admin/` or `scripts/` regressed: players add/remove/sync, jobs, uploads, audit | ✅ All endpoints 200 through the container's nginx (`status`, `players`, `backups`, `audit`, `logs`, `jobs`), all static assets 200 including the new `i18n.js`. `players.sync` and `players.remove` appear in the live audit log from this session's testing. `bash -n` on both scripts, `node --check` on both JS files. |

> **Defect found and fixed while walking check 3.** The job overlay's backdrop
> (`z-index: 50`, `inset: 0`) covered the top bar, so the language switch was
> **completely dead for the whole length of a job** — and a world regeneration
> takes about 45 minutes. The overlay says in as many words that you can close
> it and the job keeps going, so it is modal-looking rather than genuinely
> modal; the switch now sits above it (`z-index: 70`). The **confirm** dialog was
> deliberately raised *above* the switch instead (`z-index: 80`), because
> `confirmThen()` renders its text once and does not re-render on a language
> change — a live switch there would leave a stale sentence over a live "yes"
> button. That dialog lasts seconds; waiting costs nothing.
