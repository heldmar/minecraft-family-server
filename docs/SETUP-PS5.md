# Entrar al servidor desde PS5

> # ⚠️ Antes de empezar: hace falta PlayStation Plus
>
> **Para entrar a este servidor desde una PS5 hace falta PlayStation Plus**, la
> suscripción paga de Sony. Sin ella la consola no deja entrar a **ningún**
> servidor de Minecraft, ni siquiera a uno privado como el nuestro.
>
> Eso **no lo podemos arreglar de nuestro lado**, y no tiene nada que ver con el
> servidor, el DNS ni la lista de jugadores: lo decide Sony.
>
> - **Si en tu casa ya tienen PlayStation Plus** — seguí esta guía, funciona.
> - **Si no lo tienen** — no hagas los pasos de abajo, le vas a cambiar la
>   configuración de red a la consola para nada. Pero el chico igual puede
>   jugar: **iPad, celular y Minecraft en la compu** (Bedrock o Java) entran
>   gratis, sin ninguna suscripción, y la guía es
>   **[SETUP-IPAD-Y-PC.md](SETUP-IPAD-Y-PC.md)**.
>
> *Comprobado el 2026-08-11.*

---

Esta guía es para los papás y mamás que configuran la consola. Hay que hacerlo
**una sola vez**. Después, entrar al servidor son tres clicks.

Si algo no sale como acá dice, no sigas adelante: escribile a Helder.

---

## Antes de empezar

Necesitás dos cosas:

1. Que Helder te haya confirmado que **el gamertag de tu hijo/a ya está en la
   lista**. El servidor rechaza a cualquiera que no esté en la lista, aunque
   haga todo el resto bien. Mandale el gamertag exacto de Xbox/Microsoft (el que
   aparece en Minecraft, no el nombre de la cuenta de PlayStation).
2. La consola prendida y conectada a internet.

---

## Parte 1 — Cambiar el DNS de la consola (una sola vez)

La PS5 no deja escribir la dirección de un servidor de Minecraft. No es una
limitación de este servidor: Sony directamente no puso esa opción. La forma de
resolverlo es cambiar un ajuste de red de la consola, para que cuando Minecraft
busque sus servidores oficiales, la consola pregunte primero a nuestro servidor.

1. **Ajustes** (el engranaje arriba a la derecha)
2. **Red**
3. **Configuración**
4. **Configurar conexión a Internet**
5. Buscá tu red WiFi en la lista. **No la selecciones todavía.** Apretá el botón
   de **Opciones** del control (el de las tres rayitas) estando parado encima, y
   elegí **Configuración avanzada**.
   *Si tu conexión es por cable, elegí **Configuración de conexión por cable** →
   **Configuración avanzada**.*
6. **Ajustes de DNS** → cambialo de *Automático* a **Manual**
7. Escribí exactamente esto:

   | Campo | Valor |
   |---|---|
   | **DNS primario** | `198.51.100.20` |
   | **DNS secundario** | `1.1.1.1` |

8. **Aceptar** / **Guardar**, y dejá que la consola pruebe la conexión.

> ### ⚠️ El DNS secundario no es opcional
>
> Ponelo. Nuestro servidor contesta **únicamente** las direcciones de Minecraft
> y rechaza todo lo demás a propósito — es lo que evita que cualquiera en
> internet lo use para otra cosa. El secundario (`1.1.1.1`, que es de
> Cloudflare) es el que se encarga del resto: la PlayStation Store, Netflix,
> los otros juegos. Si dejás el secundario vacío, la consola va a quedar sin
> internet para todo lo que no sea este servidor.

---

## Parte 2 — Entrar al servidor

Esto es lo que hace tu hijo/a cada vez que quiere jugar:

1. Abrir **Minecraft**
2. **Jugar** → pestaña **Servidores** (arriba, a la derecha de *Mundos* y
   *Amigos*)
3. Tocar **cualquiera** de los servidores destacados que aparecen en la lista
   — *The Hive*, *Mineplex*, *CubeCraft*, el que sea. Da igual cuál.
4. En vez del servidor de esa lista, va a aparecer un menú nuestro. Ahí elegir:

   **MarNar Server**

5. Listo, adentro.

Después de la primera vez, el servidor queda en la lista de servidores recientes
y se entra directo.

---

## Si no funciona

**"No se pudo conectar al mundo" apenas toca un servidor destacado**
El DNS no quedó guardado. Volvé a la Parte 1 y fijate que diga *Manual* y no
*Automático*. Algunas consolas piden reiniciar para tomarlo — probá apagando y
prendiendo la consola.

**Aparece nuestro menú, pero al elegir el servidor lo saca**
Casi seguro el gamertag todavía no está en la lista. Mandale a Helder el
gamertag exacto, con mayúsculas y espacios como aparece en el juego.

Si ya se lo mandaste y sigue pasando: **probá entrar una vez más y avisale.** El
intento que falla es justamente lo que le permite al servidor reconocer el
gamertag; después de eso Helder lo agrega y entra.

**Anda el servidor pero la consola perdió internet para todo lo demás**
Faltó el DNS secundario. Volvé a la Parte 1, punto 7.

**Quiero dejar todo como estaba**
Parte 1, y en el paso 6 poné **Ajustes de DNS: Automático**. No queda nada
instalado en la consola; es un solo ajuste.

---

## Lo que este cambio hace y lo que no hace

Es razonable desconfiar de una instrucción que dice "cambiá un ajuste de red".
Concretamente:

- **Qué hace:** cuando la consola necesita traducir un nombre a una dirección,
  le pregunta primero a nuestro servidor. Nuestro servidor contesta sólo por
  seis nombres — los de los servidores destacados de Minecraft — y para todo lo
  demás contesta "no soy yo, preguntale a otro", y ahí entra Cloudflare.
- **Qué no hace:** no instala nada, no toca la cuenta de PlayStation, no ve
  contraseñas ni tráfico de la consola, y se deshace con un solo ajuste.
- **Quién lo opera:** Helder, en un servidor propio. No hay terceros en el medio,
  y el servidor no cobra nada.
- ⚠️ **Lo que sí cuesta plata:** PlayStation Plus, que Sony exige para jugar en
  línea en la PS5 — ver el aviso del principio. Eso se le paga a Sony, no a
  nosotros. Nuestro servidor sigue siendo gratis; la consola no.
