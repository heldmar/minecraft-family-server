# MarNar Minecraft

Private, invitation-only Minecraft server for MarNar and his friends, hosted on the MarNar Pi
homelab and reachable at `minecraft.example.net`.

**Free to play, closed to the public.** No payments are collected; access is by explicit
allowlist only.

## Status

📋 **Requirements drafted — implementation not started.**

Start here: **[`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md)**

## Shape of the thing

- **Host:** Raspberry Pi 4B (`192.168.4.200`), world on the USB disk at `/mnt/storage`
- **Server:** PaperMC (Java Edition) + GeyserMC + Floodgate, in Docker
- **Why not the official Bedrock server:** it is x86_64-only; the Pi is `aarch64`
- **Players:** PS5, iPad and PC Bedrock via Geyser; PC Java Edition natively — one shared world
- **Target:** 8 concurrent players

## Related projects on this machine

| Project | Relationship |
|---|---|
| A Raspberry Pi homelab | The original host. This project is a **tenant**; the dependency is one-directional. |
| A cloud VM | Evaluated as a host and **rejected** at the time. |

## Repository layout

```
docs/
  REQUIREMENTS.md   ← the requirements, decision log and open questions
```

Stack definitions, configuration and player-facing setup guides will be added as
implementation proceeds.
