# Spec: Comparador de Horarios Bursátiles vs. Hora de Chile

## 1. Objetivo

Una vista única donde puedas ver, en tiempo real, cuándo están abiertas las bolsas de **Taiwán, Corea del Sur, China, India y EE.UU.**, comparadas contra tu hora local en **Chile**. Al pasar el cursor (o el dedo, en móvil) sobre la línea de Chile, una línea vertical debe atravesar todas las demás filas mostrando el horario equivalente de cada mercado en ese instante, con la apertura/cierre bursátil resaltada visualmente.

## 2. Mercados a incluir

| Mercado | Bolsa | Zona horaria (IANA) | Horario regular (hora local) | Particularidades |
|---|---|---|---|---|
| Taiwán | TWSE | `Asia/Taipei` (UTC+8, sin DST) | 09:00–13:30 | Sesión continua, sin almuerzo |
| Corea del Sur | KRX | `Asia/Seoul` (UTC+9, sin DST) | 09:00–15:30 | Sesión continua (eliminó el almuerzo en 2000) |
| China | SSE / SZSE | `Asia/Shanghai` (UTC+8, sin DST) | 09:30–11:30 y 13:00–15:00 | Almuerzo 11:30–13:00; subasta de apertura 09:15–09:25 |
| India | NSE / BSE | `Asia/Kolkata` (UTC+5:30, sin DST) | 09:15–15:30 | Pre-apertura 09:00–09:15, sesión continua |
| EE.UU. | NYSE / NASDAQ | `America/New_York` (UTC-5/-4, con DST) | 09:30–16:00 | Pre-market y after-hours opcionales (extendido) |
| **Chile** (referencia) | — | `America/Santiago` (UTC-4/-3, con DST) | — | Fila "ancla" del usuario |

## 3. El punto crítico: zonas horarias que se mueven

Esto no es una simple resta de horas fija, por dos motivos:

- **Chile tiene horario de verano.** Ahora mismo (desde el 6 de septiembre de 2026 hasta abril de 2027) está en UTC-3; el resto del año está en UTC-4.
- **EE.UU. también tiene DST, pero en fechas de hemisferio norte** — casi opuestas a las de Chile. Eso significa que la diferencia horaria Chile↔EE.UU. cambia varias veces al año, y en ciertas semanas de marzo/abril y septiembre/octubre incluso se cruzan los cambios de ambos países.
- **Taiwán, Corea, China e India NO tienen horario de verano.** Su horario "en tu hora" igual se mueve dos veces al año, aunque el mercado no cambie nada.

**Implicancia técnica:** nunca hardcodear offsets (ej. "Corea = Chile + 12h"). Todo el cálculo debe hacerse convirtiendo con la base de datos de zonas horarias IANA (vía `Intl.DateTimeFormat`, Luxon o `date-fns-tz`), recalculando en cada carga — no una vez al año.

## 4. Concepto de UI/UX

### 4.1 Layout

- Filas horizontales apiladas, una por mercado, cada una representando un día de 24h.
- La fila de **Chile va fija arriba**, como regla de referencia.
- Todas las filas comparten el mismo eje horizontal (hora de Chile), pero cada una muestra su propia hora local convertida.
- Dentro de cada fila, un tramo de color marca el horario bursátil regular, con sub-tramos distintos para pre-apertura, almuerzo (China) y after-hours.

### 4.2 El cursor / línea vertical (la pieza central)

- Al hacer hover (o tocar y arrastrar en móvil) sobre cualquier punto de la fila de Chile, aparece una **línea vertical** que cruza todas las filas de abajo.
- En cada fila, un tooltip muestra la hora local exacta de ese mercado en ese instante + su estado (abierto / cerrado / almuerzo / pre-apertura).
- El tramo bursátil de cada fila se ilumina o cambia de color cuando el cursor cae dentro de su ventana de apertura — refuerza visualmente "ahora mismo este mercado está operando".
- En mobile: drag horizontal tipo "scrubber" en vez de hover; tap simple también fija la línea.

### 4.3 Línea de "ahora"

Además de la línea interactiva del cursor, una segunda línea (punteada, con color distinto) marca la hora actual real y se actualiza sola cada minuto — así siempre sabes de un vistazo qué mercados están abiertos ahora, sin tocar nada.

### 4.4 Mockup en texto

```
           00:00      06:00      12:00      18:00      00:00
Chile     |──────────────────┊─────────────────────────────|
                              ┊ ← cursor
Taiwán    |░░░░░░░████████░░░┊░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|
Corea     |░░░░░░░░████████░░┊░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|
China     |░░░░░░░░███░▓▓░███┊░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|
India     |░░░░░░░░░░██████░░┊░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|
EE.UU.    |░░░░░░░░░░░░░░░░░░┊██████████░░░░░░░░░░░░░░░░░░░|
```
`█` = mercado abierto · `▓` = almuerzo · `░` = cerrado · `┊` = línea del cursor

### 4.5 Paleta sugerida

- Verde → mercado abierto
- Azul grisáceo oscuro → cerrado
- Ámbar/naranja → almuerzo o pre-apertura
- Línea de cursor → blanco/acento claro, alto contraste
- Línea de "ahora" → rojo o acento vivo, punteada

## 5. Modelo de datos

```json
{
  "id": "krx",
  "nombre": "Corea del Sur",
  "bolsa": "KRX",
  "timezone": "Asia/Seoul",
  "sesiones": [
    { "tipo": "regular", "inicio": "09:00", "fin": "15:30" }
  ]
}
```
China tendría dos entradas de tipo `regular` separadas por una de tipo `almuerzo`; India sumaría una de tipo `pre_apertura`.

## 6. Alcance: MVP vs. extensiones

**MVP**
- Las 5 bolsas + fila de Chile, con cursor interactivo y línea de "ahora"
- Colores por estado, cálculo correcto de DST para Chile y EE.UU.

**Extensiones (V2)**
- Feriados bursátiles por mercado (afecta el estado "cerrado" ese día puntual)
- **Resaltar ventanas de solapamiento** — momentos donde 2+ mercados están abiertos a la vez (útil dado que sigues la sesión Asia)
- Alertas ("Corea abre en 15 min")
- Empaquetarla como PWA instalable para chequearla rápido desde el celular

## 7. Stack sugerido

- **Frontend:** React o vanilla JS, con SVG/Canvas para dibujar las líneas de tiempo
- **Zonas horarias:** Luxon o `date-fns-tz` — evitar cálculos manuales de offset
- **Actualización en vivo:** `setInterval` liviano para mover la línea de "ahora"
- Encaja bien como PWA instalable, similar al enfoque que ya usaste en tu juego multiplayer
