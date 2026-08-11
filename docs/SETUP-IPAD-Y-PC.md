# Entrar al servidor desde iPad, celular o computadora

Mucho más simple que la PS5: acá sí se puede escribir la dirección del servidor,
así que **no hay que tocar ningún ajuste de red**.

Antes de empezar, confirmá con Helder que el gamertag ya está en la lista. El
servidor rechaza a quien no esté, aunque escriba todo bien.

---

## iPad, iPhone, Android, Nintendo Switch, Xbox

Todos usan **Minecraft Bedrock**, que es la versión que se compra en la App
Store / Play Store / tienda de la consola.

1. Abrir Minecraft
2. **Jugar** → pestaña **Servidores** → bajar hasta el final → **Añadir
   servidor**
3. Completar:

   | Campo | Valor |
   |---|---|
   | Nombre del servidor | `MarNar` (o lo que quieras) |
   | Dirección del servidor | `minecraft.example.net` |
   | Puerto | `19133` |

4. **Guardar**, y después tocar el servidor para entrar.

> ### ⚠️ El puerto es 19133, no el que viene puesto
>
> Minecraft rellena `19132` solo. **Hay que cambiarlo a `19133`.** Es el error
> más común y da un "no se pudo conectar" que parece un problema del servidor.
>
> El motivo: el `19132` lo ocupa la pieza que hace funcionar la PS5, así que el
> juego se corrió un número al lado.

### En Xbox y Switch

Igual que arriba, pero algunas versiones de Minecraft en esas consolas esconden
el botón de *Añadir servidor*. Si no aparece, se resuelve igual que en PS5:
seguí [SETUP-PS5.md](SETUP-PS5.md), que funciona idéntico en Xbox y en Switch.

---

## Computadora — Minecraft Java Edition

1. **Multijugador** → **Añadir servidor**
2. Dirección del servidor: `minecraft.example.net`

   Sin puerto. En Java el puerto va solo.

3. **Listo** y entrar.

---

## Computadora — Minecraft Bedrock (la de la Microsoft Store)

Igual que el iPad: dirección `minecraft.example.net`, puerto **`19133`**.

---

## Java y Bedrock juegan juntos

Es el mismo mundo para todos. Alguien en iPad, alguien en PS5 y alguien en una
PC con Java se ven entre sí y construyen en el mismo lugar.

Los que entran desde Bedrock no necesitan cuenta de Minecraft Java: aparecen con
su nombre precedido de un punto (por ejemplo `.MarNar`). Es normal y es así como
el servidor los distingue.

---

## Si no funciona

**"No se pudo conectar al servidor" desde iPad o celular**
Casi siempre es el puerto. Editá el servidor guardado y verificá que diga
`19133`.

**Entra y lo saca enseguida**
El gamertag no está en la lista todavía. Mandáselo a Helder.

**"Versión incompatible" / "Outdated client" o "Outdated server"**
Se actualizó Minecraft y el servidor todavía no. Avisale a Helder; es esperable
cada vez que Mojang saca una versión y se arregla del lado del servidor.
