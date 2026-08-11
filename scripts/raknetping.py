"""RakNet unconnected ping — proves a Bedrock listener answers from the internet.

Used to verify both halves of the PS5 path independently:
  19132 -> BedrockConnect (the server-list menu the console lands in)
  19133 -> Geyser (the actual game server)
"""
import socket
import struct
import sys
import time

MAGIC = bytes.fromhex("00ffff00fefefefefdfdfdfd12345678")


def ping(host: str, port: int) -> str | None:
    pkt = b"\x01" + struct.pack(">q", int(time.time() * 1000)) + MAGIC + struct.pack(">q", 2)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(6)
    try:
        s.sendto(pkt, (host, port))
        data, _ = s.recvfrom(4096)
    except socket.timeout:
        return None
    finally:
        s.close()
    # id(1) + time(8) + serverGUID(8) + magic(16) + strlen(2) + payload
    return data[35:].decode("utf-8", "replace")


for host, port, label in [
    ("198.51.100.20", 19132, "BedrockConnect"),
    ("198.51.100.20", 19133, "Geyser"),
    ("minecraft.example.net", 19133, "Geyser via hostname"),
]:
    got = ping(host, port)
    print(f"{label:22s} {host}:{port}")
    print(f"  {'NO REPLY' if got is None else got}")
    if got is None:
        sys.exit(1)
