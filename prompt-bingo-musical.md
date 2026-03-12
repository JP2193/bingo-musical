# PROMPT — Bingo Musical con Spotify API

## Contexto del proyecto

Construir una **aplicación web de Bingo Musical** para un organizador de eventos que:
1. Se conecta con Spotify para leer una playlist propia
2. Permite calibrar visualmente un cartón de diseño personalizado (imagen exportada de Canva)
3. Genera cartones de bingo aleatorios con miniatura + nombre de canción + artista superpuestos sobre esa imagen
4. Guarda cartones individuales como PNG en alta resolución
5. Exporta lotes de N cartones únicos directamente a una carpeta del sistema (sin ZIP, sin límite de memoria)

Uso en escritorio Chrome/Edge únicamente. El usuario final (organizador) opera la app — los compradores reciben los cartones ya generados.

---

## Stack

- **React + Vite** (JS puro, sin TypeScript)
- **CSS Modules** por componente
- **Google Fonts** como única dependencia de estilos externos
- Librerías JS:
  - `html2canvas` → captura de cartón como PNG (`scale: 2` para alta resolución)
- **File System Access API** nativa del browser → exportación de lote a carpeta local (sin ZIP, sin descarga masiva)
- Sin librerías de UI externas
- Sin backend

---

## Estructura de archivos

```
/bingo-musical/
├── index.html
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                        → tabs + estado global
│   ├── App.module.css
│   │
│   ├── store/
│   │   └── AppContext.jsx
│   │
│   ├── tabs/
│   │   ├── SpotifyTab/
│   │   │   ├── SpotifyTab.jsx
│   │   │   └── SpotifyTab.module.css
│   │   ├── CalibratorTab/
│   │   │   ├── CalibratorTab.jsx
│   │   │   └── CalibratorTab.module.css
│   │   └── CardsTab/
│   │       ├── CardsTab.jsx
│   │       └── CardsTab.module.css
│   │
│   ├── components/
│   │   ├── BingoCard/
│   │   │   ├── BingoCard.jsx
│   │   │   └── BingoCard.module.css
│   │   ├── BingoCell/
│   │   │   ├── BingoCell.jsx
│   │   │   └── BingoCell.module.css
│   │   ├── GridOverlay/
│   │   │   ├── GridOverlay.jsx
│   │   │   └── GridOverlay.module.css
│   │   └── UI/
│   │       ├── Slider.jsx             → props: label, min, max, step, value, onChange, unit
│   │       ├── Stepper.jsx            → props: value, min, max, step, onChange
│   │       ├── ColorPicker.jsx        → input color con preview
│   │       ├── ProgressBar.jsx        → barra animada con label de texto
│   │       └── ErrorBanner.jsx        → banner de error inline
│   │
│   ├── hooks/
│   │   ├── useSpotifyAuth.js
│   │   ├── useSpotifyAPI.js
│   │   └── useCalibrator.js
│   │
│   └── utils/
│       ├── spotify.js
│       ├── bingo.js
│       └── export.js
```

---

## Estado global — AppContext

```js
const initialState = {
  // Auth
  spotifyToken: null,
  tokenExpiry: null,

  // Playlist
  playlist: null,        // { id, name, imageUrl, totalTracks }
  tracks: [],            // [{ id, name, artist, thumbnail }]
                         // thumbnail = URL de Spotify (NO base64, se convierte solo al exportar)

  // Config
  gridSize: { cols: 4, rows: 4 },
  cardQuantity: 10,

  // Calibrador
  calibration: {
    imageFile: null,
    imageUrl: null,          // object URL de la imagen local
    gridX: 10,               // % desde izquierda
    gridY: 30,               // % desde arriba
    gridWidth: 80,           // % del ancho de imagen
    gridHeight: 60,          // % del alto de imagen
    gapSize: 2,              // px
    borderColor: '#000000',
    borderWidth: 1,          // px
    outerBorderColor: '#000000',
    outerBorderWidth: 2,     // px
    overlayOpacity: 0.3,     // solo visible durante calibración
    fontSize: 9,             // px — texto en celdas
  },

  // Cartones
  currentCard: null,         // array de tracks del cartón visible
  previousCards: [],         // historial de cartones generados en esta sesión (para evitar repetidos)

  // Lote
  loteSize: 50,              // stepper de 5 en 5, mínimo 5, máximo 500
  loteProgress: null,        // { current, total } o null si no está exportando
}
```

Acciones: `setToken`, `setPlaylist`, `setTracks`, `setGridSize`, `setCardQuantity`,
`updateCalibration`, `resetCalibration`, `setCurrentCard`,
`addToPreviousCards`, `clearPreviousCards`, `setLoteSize`, `setLoteProgress`

---

## Tab 1 — Spotify (`SpotifyTab`)

### Pantalla 1a — Login
- Botón "Conectar con Spotify"
- OAuth 2.0 PKCE en `useSpotifyAuth.js`
- Constantes al inicio del hook:
  ```js
  const CLIENT_ID = '06f4f8ffcc9a46d383b2ce2a8261d5ef'
  const REDIRECT_URI = 'http://localhost:5173'
  const SCOPES = 'playlist-read-private playlist-read-collaborative'
  ```
- Al volver del callback: interceptar `?code=`, intercambiar por token, guardar en `sessionStorage` y Context

### Pantalla 1b — Configuración (tras auth)
- Input: URL o URI de playlist de Spotify
- Botón "Cargar Playlist"
- Tras cargar: nombre de playlist, total de tracks, thumbnails de las primeras 6 canciones
- Selector de grilla: `3×3` / `3×4` / `4×4` / `5×5`
- Input numérico: cantidad de cartones en preview (1–50)
- Botón "Ir al Calibrador →"
- **Las miniaturas se guardan como URLs normales** en el estado — NO convertir a base64 aquí
- Validación: si `tracks.length < cols × rows` → ErrorBanner con cuántas canciones faltan

### Funciones `useSpotifyAuth.js`
```js
generateCodeVerifier()
generateCodeChallenge(verifier)       // SHA-256 + base64url
redirectToSpotifyAuth()
handleCallback()                      // intercambia code por token
saveToken(accessToken, expiresIn)     // sessionStorage
getStoredToken()                      // token válido o null
```

### Funciones `useSpotifyAPI.js`
```js
fetchPlaylistMeta(playlistId)
fetchAllTracks(playlistId)            // paginación automática, offset de 100 en 100
```

### Funciones `utils/spotify.js`
```js
extractPlaylistId(input)              // acepta URL completa, URI o ID directo
normalizeTrack(rawItem)               // → { id, name, artist, thumbnail }
getImageFallbackColor(str)            // color hex determinístico desde string (para fallback)
```

---

## Tab 2 — Calibrador (`CalibratorTab`)

### Layout: dos paneles lado a lado

**Panel izquierdo — Controles**

**📁 Imagen**
- Botón "Cargar imagen del cartón" → `<input type="file" accept="image/*">`
- Límite: 10MB → ErrorBanner si supera
- Mostrar nombre del archivo y dimensiones en px tras cargar

**📐 Posición**
- `<Slider>` Posición X: 0%–100%
- `<Slider>` Posición Y: 0%–100%

**📏 Tamaño**
- `<Slider>` Ancho: 10%–100%
- `<Slider>` Alto: 10%–100%

**#️⃣ Celdas** *(solo lectura)*
- Texto: `Columnas: N` / `Filas: N` — del Context

**🔤 Texto**
- `<Slider>` Tamaño de fuente: 4px–18px (paso 0.5)

**🎨 Bordes**
- `<Slider>` Grosor bordes internos: 0–5px
- `<ColorPicker>` Color bordes internos
- `<Slider>` Grosor borde exterior: 0–8px
- `<ColorPicker>` Color borde exterior
- `<Slider>` Gap entre celdas: 0–20px

**👁 Overlay**
- `<Slider>` Opacidad del overlay: 0–1

**Botones:**
- "💾 Guardar valores" → persiste en `localStorage`
- "👁 Ocultar/mostrar guías" → toggle overlay
- "↩ Restablecer" → resetCalibration()
- Badge "✓ Guardado" con fade in/out tras guardar

**Panel derecho — Preview**
- Imagen a full width del panel
- `<GridOverlay>` encima en tiempo real

### Componente `GridOverlay`
```jsx
// Props: calibration, gridSize, previewMode (bool)
// Contenedor absoluto con left/top/width/height en %
// CSS Grid con cols y rows
// Celdas en previewMode=true: fondo rgba blanco con overlayOpacity (para calibrar)
// Celdas en previewMode=false: fondo transparente, contienen <BingoCell>
// Borde interno: borderColor / borderWidth
// Borde exterior del contenedor: outerBorderColor / outerBorderWidth
// Gap: gapSize px
```

### Hook `useCalibrator.js`
```js
handleImageUpload(file)
updateParam(key, value)
resetCalibration()
saveToLocalStorage()       // persiste calibration (excluir imageFile, imageUrl)
loadFromLocalStorage()     // restaura al montar el componente
```

---

## Tab 3 — Cartones (`CardsTab`)

### Grid de 4 botones (2×2)

```
┌──────────────────────┬───────────────────────────┐
│  ✦ Generar tarjeta   │   ↺ Otra aleatoria        │
├──────────────────────┼───────────────────────────┤
│  💾 Guardar PNG      │  📁 Exportar lote         │
│                      │  [−]  [ 50 ]  [+]         │
└──────────────────────┴───────────────────────────┘
```

**Stepper del lote:**
- Paso: **5 en 5**
- Mínimo: 5 / Máximo: 500

---

### Comportamiento de cada botón

#### ✦ Generar tarjeta
```js
// Llama generateCard(tracks, cols, rows)
// Guarda en currentCard y agrega a previousCards
// Muestra el cartón en el preview
```

#### ↺ Otra aleatoria
```js
// Genera un nuevo cartón con generateUniqueCard(tracks, cols, rows, previousCards)
// Garantiza que no sea idéntico a ningún cartón anterior de esta sesión
// Reemplaza currentCard, agrega a previousCards
```

#### 💾 Guardar PNG
```js
// 1. Convierte SOLO las miniaturas del currentCard a base64 (fetch al momento)
// 2. Inyecta el base64 temporalmente en el cartón renderizado
// 3. Captura con html2canvas({ scale: 2, useCORS: false })
// 4. Descarga como bingo-001.png
// 5. Descarta el base64 — no se guarda en el estado
```

#### 📁 Exportar lote
```js
// 1. Verifica soporte: if (!window.showDirectoryPicker) → ErrorBanner
//    "Tu navegador no soporta esta función. Usá Chrome o Edge."
//
// 2. Abre el selector de carpeta:
//    const dirHandle = await window.showDirectoryPicker()
//
// 3. Por cada cartón i de 1 a loteSize:
//    a. generateUniqueCard() → distinto a todos los anteriores del lote
//    b. Renderizar off-screen (div con position:absolute; left:-9999px)
//    c. Convertir miniaturas de ESE cartón a base64 (fetch en el momento)
//    d. Capturar con html2canvas({ scale: 2 })
//    e. Guardar directamente en la carpeta:
//         const fh = await dirHandle.getFileHandle(`bingo-${String(i).padStart(3,'0')}.png`, { create: true })
//         const writable = await fh.createWritable()
//         await writable.write(blob)
//         await writable.close()
//    f. Remover el div off-screen
//    g. Liberar base64 de memoria
//    h. setLoteProgress({ current: i, total: loteSize })
//    i. await new Promise(r => setTimeout(r, 0))  // ceder el hilo entre cartones
//
// 4. Al finalizar: setLoteProgress(null) + mensaje "✓ 130 cartones guardados"
```

**Durante la exportación:**
- Mostrar `<ProgressBar>` con texto: `"Guardando 23 de 130..."`
- Botones deshabilitados mientras exporta
- Botón "Cancelar" que interrumpe el loop (usar ref `cancelRef`)

---

### Funciones `utils/bingo.js`
```js
shuffleArray(array)
// Fisher-Yates puro:
// for (let i = array.length - 1; i > 0; i--) {
//   const j = Math.floor(Math.random() * (i + 1));
//   [array[i], array[j]] = [array[j], array[i]];
// }
// NUNCA usar .sort(() => Math.random() - 0.5)

generateCard(tracks, cols, rows)
// → shuffleArray([...tracks]).slice(0, cols * rows)
// → devuelve array de cols*rows tracks únicos

generateUniqueCard(tracks, cols, rows, previousCards)
// → genera cartones hasta encontrar uno no idéntico a ninguno en previousCards
// → comparación por IDs de tracks (JSON.stringify de los IDs ordenados)
// → máximo 1000 intentos antes de lanzar error (pool insuficiente)
// → en la práctica con C(40,16) = 62 mil millones de combinaciones, nunca llega al límite

cardFingerprint(card)
// → devuelve string único del cartón: IDs de tracks ordenados alfabéticamente
// → usado por generateUniqueCard para comparar
```

### Funciones `utils/export.js`
```js
imageUrlToBase64(url)
// → fetch(url) → blob → FileReader → dataURL
// → solo se llama al momento de exportar, no antes

captureCard(element)
// → html2canvas(element, { scale: 2, useCORS: false, allowTaint: true })
// → devuelve blob PNG

saveCardPNG(blob, filename)
// → descarga directa via <a download>

exportLoteToFolder(tracks, cols, rows, qty, calibration, onProgress, cancelRef)
// → implementa el flujo de File System Access API descripto arriba
// → chequea cancelRef.current en cada iteración para permitir cancelación
```

---

## Componentes

### `BingoCard`
```jsx
// Props: card, calibration, cardNumber, base64Map (objeto { trackId: dataURL })
// background-image: calibration.imageUrl
// Encima: <GridOverlay previewMode={false}> con <BingoCell> en cada celda
// Pasa base64Map a cada BingoCell para que use base64 al renderizar para captura
```

### `BingoCell`
```jsx
// Props: track, base64Url (opcional)
// En preview normal: usa track.thumbnail (URL de Spotify) como src
// Al exportar: usa base64Url si está disponible (para html2canvas sin CORS)
// Fallback si imagen falla: fondo getImageFallbackColor(track.artist) + inicial
// Nombre canción: bold, fontSize del calibrador, max 2 líneas, ellipsis
// Artista: muted, fontSize * 0.85, max 1 línea, ellipsis
```

---

## CSS — Diseño y estética

### Dirección: **Editorial nocturna / club de música**

Variables globales en `src/index.css`:
```css
:root {
  --black: #080808;
  --surface: #111111;
  --surface2: #1c1c1c;
  --white: #f0ece2;
  --muted: #666;
  --yellow: #F5C842;
  --spotify-green: #1DB954;
  --danger: #e74c3c;
  --success: #2ecc71;
  --font-display: 'Bebas Neue', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --transition: 0.15s ease;
}
```

Reglas:
- **Bebas Neue** → títulos, labels de tabs, encabezados de sección
- **DM Sans** → textos, controles, valores numéricos
- Sin `border-radius` — formas rectas
- Tabs: indicador activo con línea inferior `--yellow`
- Sliders: track `--surface2`, thumb `--yellow`
- Stepper: bordes rectos, botones `−` / `+` flanqueando el valor, sin border-radius
- Grid de botones 2×2: igual altura en todas las celdas, el botón de lote contiene el stepper interno
- Barra de progreso: línea animada `--yellow` con texto encima
- Badge "✓ Guardado": fade in → espera 2s → fade out
- Fondo general: textura noise sutil via pseudo-elemento `opacity: 0.03`
- Hover en celdas del cartón: `scale(1.02)` + borde `--yellow`

### Print styles
```css
@media print {
  /* Ocultar todo excepto el cartón activo */
  /* BingoCard: width 100%, page-break-after: always */
  /* -webkit-print-color-adjust: exact */
}
```

---

## Manejo de errores

`<ErrorBanner>` inline, nunca `alert()`:

| Situación | Mensaje |
|---|---|
| Token vencido | "Tu sesión de Spotify expiró. Reconectando..." + redirect automático |
| Playlist no encontrada | "No encontramos esa playlist. Verificá que sea pública o tengas acceso." |
| Pocos tracks | "La playlist tiene X canciones pero el cartón necesita Y. Elegí una grilla más chica." |
| Imagen > 10MB | "La imagen supera los 10MB. Usá una imagen más liviana." |
| URL inválida | "Formato inválido. Pegá una URL como: open.spotify.com/playlist/..." |
| Error de red | "No pudimos conectarnos. Verificá tu conexión." |
| Browser sin File System API | "Tu navegador no soporta esta función. Usá Chrome o Edge." |
| Pool insuficiente para lote | "No hay suficientes combinaciones únicas para generar X cartones distintos con este pool de canciones." |

---

## Consideraciones técnicas críticas

- **Base64 solo al momento de exportar**: las URLs de Spotify se convierten a base64 únicamente durante la captura con `html2canvas`. Nunca se almacenan en el estado de React.
- **Memoria constante durante el lote**: se procesa un cartón a la vez. El base64 se genera, se usa para capturar y se descarta. Nunca se acumulan en memoria.
- **Fisher-Yates obligatorio**: nunca usar `.sort(() => Math.random() - 0.5)` — produce distribuciones sesgadas.
- **Unicidad por fingerprint**: `cardFingerprint()` ordena los IDs de tracks para que dos cartones con las mismas canciones en distinto orden se consideren diferentes (son cartones distintos para el jugador).
- **Cancelación limpia**: el loop de exportación chequea `cancelRef.current` en cada iteración. Al cancelar, los archivos ya guardados permanecen en la carpeta.
- **Calibración en localStorage**: persiste entre sesiones. Excluir `imageFile` e `imageUrl` al serializar (no son serializables). Al cargar, si hay valores guardados, restaurar todo menos la imagen (el usuario la vuelve a cargar).
- **Token en sessionStorage**: nunca localStorage.
- **objectURL**: revocar con `URL.revokeObjectURL()` al desmontar o reemplazar imagen del calibrador.
- **GridOverlay en %**: todos los valores de posición/tamaño son `%` relativos al contenedor para escalar correctamente en captura `scale: 2`.

---

## Flujo completo del usuario

1. **Tab Spotify** → conecta cuenta → pega URL de playlist → elige grilla → carga tracks
2. **Tab Calibrador** → carga imagen de Canva → ajusta sliders → guarda (persiste en localStorage)
3. **Tab Cartones** →
   - "Generar tarjeta" → ve el primer cartón con su diseño
   - "Otra aleatoria" → regenera hasta encontrar una que le guste
   - "Guardar PNG" → descarga ese cartón en alta resolución
   - "Exportar lote" → elige cantidad con stepper → clic → selecciona carpeta → la app guarda cada cartón uno a uno con progreso visible → "✓ 130 cartones guardados"
