# MarNar Minecraft — Requirements

> **Status:** Draft v2 — host changed from the Pi to a cloud VM after the Pi proved
> unreachable from the internet. Implementation not started.
> **Date:** 2026-08-10
> **Owner:** Helder Martins
> **Host:** a single Linux VM with Docker.

---

## 1. Purpose

Run a small, private, invitation-only Minecraft server so that Helder's son ("MarNar") can play
with a fixed group of friends, at no cost to the players, reachable at
`minecraft.example.net`.

This repository versions the server configuration, the allowlist, the deployment stack and the
operational runbooks.

---

## 2. Users

| User | Devices | Edition |
|---|---|---|
| MarNar (primary) | PS5, iPad | Bedrock |
| MarNar's approved friends | mostly PS5; some PC, some iPad | Bedrock |
| Approved PC players | Windows/macOS/Linux | **Java** (crossplay required) |
| Helder (admin) | Mac, SSH | operator, not necessarily a player |

**Approved decision:** Java Edition and Bedrock Edition players share **one world**.

---

## 3. Measured environment (baseline, 2026-08-10)

### 3.1 Host — a small ARM cloud VM

| Property | Value |
|---|---|
| CPU | **1 vCPU**, Arm, 3.0 GHz, `aarch64` |
| RAM | 5642 MiB total · **~2921 MiB available** |
| Swap | 4096 MiB |
| Disk | 183 GB root, 163 GB free |
| Public IP | **`198.51.100.20` — static, no NAT** |
| OS | An RHEL-family Linux 9, SELinux **Enforcing**, `dnf`, `firewall-cmd` |
| Load average | 0.14 |
| Existing containers | 9 — two other sites, four other application containers, NPM, MariaDB and Portainer |
| `firewalld` open | `http`, `https`, `dhcpv6-client` only |
| Latency to the players' region | **~134 ms RTT** (measured) |

### 3.2 Operating rules inherited from the host

- Stacks live at `/home/mcadmin/stacks/<name>/` and are **CLI-managed**. Portainer there is a
  **viewer, not a deploy path** — do not deploy from its UI.
- Every image must have a real **`arm64`/`aarch64` manifest** and be **pinned**, never `latest`.
- SELinux is Enforcing — bind mounts need correct labelling (`:z`/`:Z`).
- ⚠️ **The host's own notes declare that box permanently out of scope.** This project
  overrides that by owner decision (2026-08-10). See §4.2.

---

## 4. Architecture decisions

### 4.1 Server software — Paper + GeyserMC + Floodgate

**Decision:** **PaperMC** (Minecraft Java Edition server) with **GeyserMC** and **Floodgate**,
containerised via the multi-arch `itzg/minecraft-server` image.

**Rationale — forced, not preferred:** Mojang's **Bedrock Dedicated Server ships x86_64 only.
There is no ARM64 build**, and the server is `aarch64`. Emulation is not viable for a real-time
tick loop. A Java server *is* ARM-native, and Geyser translates the Bedrock protocol so
PS5/iPad/PC-Bedrock clients connect natively. Floodgate lets them join **without a Java
account**, authenticating against Xbox Live instead. This also delivers the crossplay
requirement at no extra cost.

**Rejected:** official BDS (no ARM64 build) · BDS under emulation (unusable performance) ·
PocketMine-MP (poor vanilla parity, no Java crossplay).

### 4.2 Host — a cloud VM (the Pi was tried and rejected)

**Decision:** Host on the cloud VM, at its **current 1 vCPU / 6 GB**, sized for **4 concurrent
players**. *(Owner decision, 2026-08-10.)*

**Why the Pi was abandoned — measured, not assumed.** The Pi was the original choice and the
plan was fully specified against it. It failed on one thing: **nothing inbound from the
internet reaches it.**

Diagnostics performed 2026-08-10:

| Check | Result |
|---|---|
| Public IP genuinely the Pi's | ✅ STUN reports `203.0.113.10` — **CGNAT ruled out** |
| Double NAT | ✅ ruled out — the router's own WAN IP *is* `203.0.113.10` |
| router port-forward rules (53 and 19132, TCP & UDP, correct host, saved, Enabled) | ✅ correct |
| router static DHCP reservation for the Pi | ✅ in place |
| Pi host firewall | ✅ none (`iptables` INPUT policy ACCEPT, no rules) |
| Test listener answering on the LAN, UDP **and** TCP | ✅ verified |
| Probe host able to reach port 19132/53 on other servers | ✅ verified (`portquiz.net`) |
| `ping` to the home IP from the internet | ✅ 0% loss |
| **TCP and UDP to 19132 and 53 from the internet** | ❌ **ICMP "no route to host"** |

A **forwarded** port and an **unforwarded** port behaved identically, which means the router was
not honouring rules it displayed as Enabled. Two hypotheses were raised and then killed by
measurement — ISP blocking of port 53, and CGNAT — and are recorded here so they are not
revisited.

The router has **no local admin interface** (cloud-only), and its cloud API could not be
authenticated because the account uses Amazon SSO, which the unofficial API predates. So the
fault could not be pursued further programmatically.

**Consequences of moving to a cloud VM, accepted by the owner:**

- ⚠️ **~134 ms latency** for players in the target region, versus a few ms on the Pi. Acceptable for
  survival Minecraft; noticeable in mob combat and block-breaking.
- ⚠️ **Contention:** Minecraft shares **one vCPU** with nine existing containers, including two
  other live sites. See §6.
- ✅ **The networking problem disappears entirely** — static public IP, no NAT, no router, no
  DDNS, and PS5/BedrockConnect on port 53 becomes possible.

**Not chosen:** resizing to 2 vCPU / 12 GB. It is within quota (verified: regional limits are
2 cores / 12 GB, 1/6 in use) and the shape reports `is-flexible: true`, but resizing requires
stopping the instance, and an out-of-capacity AD-2 could leave it unable to boot — taking the
live sites down indefinitely. **Player count was cut instead.** If 4 players proves too tight,
this is the lever to revisit, with a boot-volume backup taken first.

---

## 5. Functional requirements

| ID | Requirement |
|---|---|
| **F-1** | Survival mode, with a persistent world surviving restarts, host reboots and container recreation. |
| **F-1a** | **PvP disabled** (`pvp=false`). |
| **F-1b** | **`keepInventory` true** — players keep items on death. |
| **F-1c** | Difficulty **Normal** (vanilla default). *Confirmed 2026-08-10.* |
| **F-1d** | **Nether and End both enabled** — standard vanilla progression. *Confirmed 2026-08-10.* The world border (P-5) SHALL apply to them as well, and pre-generation (P-6) SHALL cover the Nether, whose 8:1 coordinate ratio makes it cheap to pre-generate and expensive not to. |
| **F-1e** | Pin to the **latest Minecraft version fully supported by Geyser**. Bedrock clients are force-updated by Mojang and cannot stay behind, so trailing the client breaks joins. |
| **F-2** | Bedrock clients (PS5, iPad, PC Bedrock) SHALL be able to join. |
| **F-3** | Java clients SHALL join **the same world** as Bedrock clients. |
| **F-4** | Bedrock players SHALL NOT need a Java Edition account (Floodgate). |
| **F-5** | No player SHALL be charged anything; the server SHALL NOT collect payments or donations. |
| **F-6** | Reachable at `minecraft.example.net`. |
| **F-7** | Java clients SHOULD connect by hostname alone, with no port — via an SRV record. |
| **F-8** | ~~Bedrock clients SHOULD connect by hostname alone, by using the default Bedrock port 19132.~~ **NOT MET — deliberately traded away, 2026-08-10.** BedrockConnect must own 19132 (see N-11a), so Geyser was moved to **19133** and direct-connect Bedrock clients must type the port explicitly. This costs nothing on PS5, which reaches the server through the BedrockConnect menu and never types an address; it costs one extra field on iPad and Bedrock PC. PS5 is the stated primary objective, so the SHOULD yields to it. |
| **F-9** | **4 concurrent players** at acceptable performance (§6). |
| **F-10** | An operator SHALL add or remove an approved player by editing a file in this repo and running a documented deploy step — never ad-hoc on the box. **Met 2026-08-10**: `players/allowlist.txt` is the source of truth, `scripts/marnar-mc-sync-players` applies it, and the sync removes anyone on the server who is not in the file — which is what makes the file authoritative rather than advisory. Handles the Bedrock/Java split (`fwhitelist` vs `whitelist`) and has a `--dry-run`. |
| **F-11** | The world SHALL be backed up automatically, with restore documented and tested. |

---

## 6. Performance & capacity requirements

The single vCPU, shared with nine containers, is the binding constraint.

| ID | Requirement |
|---|---|
| **P-1** | Hard memory ceiling of **2048 MiB** (`mem_limit`), leaving ~870 MiB of the measured 2921 MiB available. |
| **P-2** | JVM heap fixed at **`-Xms1536M -Xmx1536M`** (equal min/max to avoid resize pauses), with Aikar's G1GC flags. |
| **P-3** | The JVM SHALL NOT swap. Memory pressure is an incident, not something to absorb. |
| **P-4** | `view-distance` **6**, `simulation-distance` **4**. |
| **P-5** | A **world border** (initial target 3000 blocks) to bound disk growth and chunk generation. |
| **P-6** | The world SHALL be **pre-generated** to the border (e.g. Chunky) before players are invited. **This is the single most important requirement in this section** — chunk generation is the dominant CPU spike, and on a shared single core it is what would stall the other sites. Pre-generating moves that cost to a controlled window. |
| **P-7** | Tick rate **≥ 18 TPS** with 4 players online in pre-generated terrain. |
| **P-8** | ⚠️ **CPU contention with the existing tenants SHALL be measured before the server is opened to friends.** The other tenants share this core. If Minecraft degrades them, the resolution is P-9, not silence. |
| **P-9** | If contention proves unacceptable, the documented options are: reduce further (2–3 players, view-distance 4), apply Docker CPU weighting so Minecraft yields under load, or revisit the 2 vCPU resize with a boot-volume backup first. |
| **P-10** | No performance-heavy mods or plugins. The plugin set is Geyser, Floodgate, and operational plugins (backup, pre-gen) only, unless re-evaluated against P-7. |
| **P-11** | Running Minecraft raises sustained CPU utilisation, which **helps** against the provider's idle-instance reclamation. A welcome side effect, not a design goal. |

> **Honest risk note:** 4 players on one shared vCPU is the tightest part of this design. P-7 and
> P-8 exist to catch it early rather than discovering it with four kids online.

---

## 7. Networking & DNS requirements

Vastly simpler than the Pi design — a static public IP removes DDNS entirely.

| ID | Requirement |
|---|---|
| **N-1** | `minecraft.example.net` SHALL be a **DNS-only (grey cloud) A record** → `198.51.100.20`. Cloudflare's proxy does not carry Minecraft traffic on the free plan. |
| **N-2** | ⚠️ It SHALL be an **explicit record overriding the proxied `*.example.net` wildcard**. Verified 2026-08-10: `minecraft.example.net` currently resolves to Cloudflare proxy IPs (shared proxy addresses) via that wildcard, which would silently break every client. |
| **N-3** | The hostname SHALL stay a **single subdomain level with a hyphen** — Universal SSL covers one level only. That is a certificate constraint, not a style choice. |
| **N-4** | **No DDNS of any kind is required.** The IP is static. *(The Cloudflare API updater specified in v1 is obsolete and SHALL NOT be built.)* |
| **N-5** | **UDP 19133** (Bedrock/Geyser) SHALL be opened in **both** `firewalld` **and** the cloud firewall. Both layers are required; either alone silently fails. *(19133, not the Bedrock default 19132 — see N-11a.)* **Met 2026-08-10**, verified by RakNet unconnected ping from off-site returning the MOTD on both the IP and `minecraft.example.net`. |
| **N-6** | **TCP 25565** (Java Edition) SHALL be opened in both layers. |
| **N-7** | An **SRV record** `_minecraft._tcp.minecraft.example.net` → `minecraft.example.net` port 25565, satisfying F-7. |
| **N-8** | The container SHALL be isolated from unrelated containers on the box, sharing only what ingress requires. |
| **N-9** | ⚠️ The **Cloudflare origin lockdown** currently restricting inbound to Cloudflare ranges SHALL NOT be weakened for HTTP. The Minecraft ports are separate and SHALL be opened without touching the existing HTTP posture. |
| **N-10** | Opening these ports SHALL NOT affect the server's SSH posture — **port 22 stays closed**, access remains via the SSH tunnel (`sshtunnel.example.net`). |

### 7.1 PS5 connectivity

**PS5 Minecraft does not allow entering a custom server address.** A platform restriction with
no server-side fix.

| ID | Requirement |
|---|---|
| **N-11** | **BedrockConnect** SHALL be self-hosted on the server, so approved players point their console DNS at the server's own resolver rather than a public third-party one. |
| **N-12** | Its server list SHALL contain **only** this server. |
| **N-11a** | **BedrockConnect SHALL own UDP 19132**, and Geyser SHALL move to 19133. This is forced, not a preference: every console "featured server" entry hard-codes port 19132, so whatever the console is redirected to must answer there. The two cannot share the port. This is what makes F-8 unachievable. |
| **N-13** | **UDP/TCP 53** SHALL be opened in both `firewalld` and the cloud firewall. *(Unlike the home connection, no ISP or router sits in the path here.)* |
| **N-14** | The DNS service SHALL apply **per-source-IP rate limiting** so it cannot be used as a traffic amplifier. **Met 2026-08-10**: `marnar-mc-dns-ratelimit`, 5/sec per source with a burst of 20; an 80-query flood from one address yielded exactly 20 replies and 60 drops, and a normal query still answered afterwards. ⚠️ The rule matches **`--dport 1053`**, not 53 — `DOCKER-USER` sits in the FORWARD path, *after* Docker's DNAT has already rewritten the published port to the container port. A rule written against 53 installs cleanly and matches nothing. |
| **N-15** | Recursion SHALL be **disabled**; it answers only BedrockConnect's fixed hostname set and refuses everything else. It SHALL NOT be a general-purpose resolver. |
| **N-16** | Amplification factor SHALL be **measured, not assumed**, before port 53 is opened, and SHALL stay below 2×. **Measured 2026-08-10: worst case 1.95×** (a minimal 37-byte A query for one of the six redirected names drawing a 72-byte reply). The original text of this requirement guessed "≈1×"; the real figure is recorded here instead. 1.95× is a poor reflector — the classic open-resolver attacks run 30–50× — and N-14 caps the sustained output per source regardless, but the number is not 1 and should not be written down as if it were. Anything above 2× means the Corefile has started answering something it should refuse; re-run `amptest.py` after any Corefile change. |
| **N-17** | A **player-facing setup guide** SHALL be written for PS5, iPad and PC, in plain language suitable for a child or a friend's parent. |

---

## 8. Access control requirements

Core requirement: **only explicitly approved people can connect.**

| ID | Requirement |
|---|---|
| **A-1** | The allowlist (`white-list=true`) SHALL be enforced; unlisted accounts rejected at login. |
| **A-1a** | The server SHALL be commissioned with an **empty allowlist and enforcement ON**, so it is closed to everyone — including MarNar — until gamertags are supplied. *Confirmed 2026-08-10.* |
| **A-2** | `online-mode` SHALL be **true** — Java players authenticated against Mojang/Microsoft. |
| **A-3** | Bedrock players SHALL be authenticated against **Xbox Live via Floodgate**, so gamertags cannot be spoofed. |
| **A-4** | Floodgate players SHALL carry a distinguishing username prefix (default `.`) so identities cannot collide. |
| **A-5** | The allowlist SHALL live **in this Git repository** as the source of truth and be deployed to the server. |
| **A-6** | Operator (`op`) privileges SHALL be Helder's only, not granted to child players by default. |
| **A-7** | The server SHALL NOT be published to any public server list; `enable-query` disabled. |
| **A-8** | Removing a player from the allowlist SHALL also disconnect them if online. |

---

## 9. Security requirements

| ID | Requirement |
|---|---|
| **S-1** | The container SHALL run **non-root**, with `no-new-privileges:true` and unnecessary capabilities dropped — matching the hardening standard already used on this box. |
| **S-2** | Only 19132/UDP, 25565/TCP and 53 SHALL be exposed. No management, RCON or query port SHALL reach the internet. |
| **S-3** | If RCON is enabled, it SHALL bind to localhost only, with a strong generated password stored outside this repo. |
| **S-4** | ⚠️ **Blast radius SHALL be understood:** this box hosts live third-party sites. A Minecraft compromise SHALL NOT be able to reach them. Container isolation is a real security boundary here, not hygiene. |
| **S-5** | No secrets SHALL be committed. `.gitignore` SHALL enforce this; secrets injected as environment variables. |
| **S-6** | The repository SHALL be **private**. |
| **S-7** | Paper, Geyser and Floodgate SHALL be updated on a defined cadence. Geyser tracks Bedrock client releases and **will break joins when Mojang ships a client update** — see O-2. |
| **S-8** | A documented rollback SHALL exist: close the three ports and remove the DNS record, restoring the box's prior posture exactly. |

---

## 10. Operations requirements

| ID | Requirement |
|---|---|
| **O-1** | Deployment SHALL be a **Docker Compose stack** versioned in this repo, deployed **CLI-first** to `/home/mcadmin/stacks/`, per the host's rules. **Not** via the Portainer UI. |
| **O-2** | A documented procedure SHALL exist for **Bedrock-client-update breakage**: when Mojang updates the Bedrock client, Geyser must be updated before players can rejoin. Expected and recurring, not an incident. |
| **O-3** | Images SHALL be **pinned** (never `latest`) and SHALL have a real `arm64`/`aarch64` manifest. |
| **O-4** | World backups SHALL run **daily**, retaining ≥14 dailies and 4 weeklies. |
| **O-5** | A restore SHALL be **tested once** before the server is opened to friends. An untested backup is not a backup. |
| **O-6** | The server SHALL be **always-on**, restarting automatically on host reboot (`restart: unless-stopped`). |
| **O-6a** | A **scheduled nightly restart** SHALL clear JVM memory pressure and heap fragmentation. It SHALL warn players online and force a world save first. |
| **O-7** | Server health SHOULD be visible via a documented check. |
| **O-8** | Player-facing setup guides (N-17) SHALL live in this repo under `docs/`. |
| **O-9** | Disk growth SHALL be monitored; the world border (P-5) is the primary control. |
| **O-10** | ⚠️ Adding a tenant to the host SHALL be reflected in the host's documentation, so its operators are not surprised by new ports and a new stack. |

---

## 11. Out of scope

- Monetisation of any kind (F-5).
- Public access or any public server listing (A-7).
- **The Raspberry Pi** — tried, unreachable inbound, abandoned as host (§4.2).
- Debugging the router's port forwarding. Parked, not solved.
- Modded Minecraft — Geyser crossplay does not survive most mods.
- Resizing the instance (§4.2), unless P-9 forces a revisit.
- Reopening SSH port 22 on the server (N-10).

---

## 12. Open questions

| # | Question | Blocks |
|---|---|---|
| **Q-2** | What are the actual gamertags/usernames for the initial allowlist? | A-5 |
| **Q-7** | Is an offsite copy of the world backup wanted, or is the boot volume sufficient? | O-4 |
| ~~Q-9~~ | ~~Confirm difficulty and dimensions.~~ **Resolved 2026-08-10: Normal difficulty, Nether and End both enabled.** | — |
| **Q-11** | Is ~134 ms latency acceptable to MarNar in practice? Worth a real test before inviting friends. | §4.2 |
| **Q-12** | Should the world be seeded fresh, or is there an existing world to import? ⚠️ **Answered by default, and it is now costly to change.** A fresh world was generated with seed **`1944975880419099066`** and pre-generated to the 3000-block border. Importing a different world after this point means discarding that work and re-running pre-generation (~1h per dimension on this box). If there *is* an existing world to bring over, say so before anyone starts building. | F-1 |

---

## 13. Decision log

| Date | Decision | By |
|---|---|---|
| 2026-08-10 | Paper + Geyser + Floodgate (forced: no ARM64 Bedrock Dedicated Server exists) | Analysis |
| 2026-08-10 | Support Java + Bedrock crossplay in one world | Helder |
| 2026-08-10 | Private GitHub repository | Helder |
| 2026-08-10 | Host on the Raspberry Pi; cloud VM rejected over resize capacity risk | Helder |
| 2026-08-10 | DDNS via a Cloudflare API updater; ingress via NPM Streams | Helder |
| 2026-08-10 | **Pi abandoned** — inbound unreachable; CGNAT, double NAT, ISP blocking and host firewall all ruled out by measurement; router not honouring saved forwards | Analysis |
| 2026-08-10 | **Host on the cloud VM at 1 vCPU, player target cut 8 → 4** rather than accept the resize risk | Helder |
| 2026-08-10 | DDNS and NPM Streams both dropped — a static IP makes them unnecessary | Analysis |
| 2026-08-10 | Self-host BedrockConnect with rate limiting; pin to latest Geyser-supported version; PvP off, keepInventory on; always-on with nightly restart | Helder |
| 2026-08-10 | Correction recorded: recorded free-tier allowance is 2 vCPU / 12 GB, not 4 / 24 | Analysis |
| 2026-08-10 | Pi test artefacts removed; six containers untouched | Analysis |
| 2026-08-10 | Difficulty Normal; **Nether and End enabled**; allowlist commissioned empty with enforcement on | Helder |
| 2026-08-10 | Full unattended install authorised, **including exposing port 53** for BedrockConnect, subject to N-14/N-15/N-16 | Helder |
| 2026-08-10 | **F-8 abandoned**: Geyser moved to 19133 so BedrockConnect can own 19132. PS5 is the primary objective and is unaffected; iPad/PC pay one extra field | Analysis |
| 2026-08-10 | N-16 rewritten from the assumed "≈1×" to the **measured 1.95×**, with a <2× ceiling as the actual gate | Analysis |
| 2026-08-10 | Nether border set to **375**, i.e. overworld ÷ 8, so every in-border overworld location has a reachable Nether counterpart and no more | Analysis |
