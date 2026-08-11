# MarNar Minecraft

Private, invitation-only Minecraft server for MarNar and his friends, hosted on a small cloud
box and reachable at `minecraft.example.net`.

**Free to play, closed to the public.** No payments are collected; access is by explicit
allowlist only.

## Status

📋 **Requirements drafted (v2) — implementation not started.**

Start here: **[`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)**

## Shape of the thing

- **Host:** a small ARM cloud VM — static public IP `198.51.100.20`, 1 vCPU / 6 GB
- **Server:** PaperMC (Java Edition) + GeyserMC + Floodgate, in Docker
- **Why not the official Bedrock server:** it is x86_64-only; the host is `aarch64`
- **Players:** PS5, iPad and PC Bedrock via Geyser; PC Java Edition natively — one shared world
- **Target:** 4 concurrent players (cut from 8 to fit a shared single vCPU)
- **PS5:** requires self-hosted BedrockConnect on port 53 — PS5 cannot type a server address

## Why not the Pi

The Pi was the original choice and the plan was fully written against it. It was abandoned on
2026-08-10 because **nothing inbound from the internet reaches it**. CGNAT, double NAT, ISP port
blocking and host firewalling were each ruled out by measurement; the router appears not to apply
port-forwarding rules it displays as Enabled, and it has no local admin interface to debug.
Full diagnostic table in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) §4.2.

## Related projects on this machine

| Project | Relationship |
|---|---|
| The host | This project is a **tenant** — it follows the host's stack, pinning and SELinux rules. |
| A Raspberry Pi homelab | Evaluated as host and **rejected**; no longer involved. |

## Repository layout

```
docs/
  REQUIREMENTS.md   ← the requirements, decision log and open questions
```

Stack definitions, configuration and player-facing setup guides will be added as
implementation proceeds.
