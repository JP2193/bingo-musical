import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

// ─── Templates ────────────────────────────────────────────────────────────────

export const TEMPLATES = {
  birthday: {
    label: 'Cumpleaños',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Pacifico&family=Nunito:wght@300;400;700&display=swap',
    titulo: '🎂 Bingo Musical 🎂',
    sepIcono: '🎉',
    css: `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .cp-carton {
    background: #fffef5;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #c8608a;
    border-radius: 0;
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cp-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 3mm 8mm 6mm;
    min-height: 0;
  }
  .cp-header {
    text-align: center;
    margin-top: 6mm;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-titulo {
    font-family: 'Pacifico', cursive;
    font-size: 24pt;
    font-weight: 400;
    color: #d43080;
    letter-spacing: 1px;
    line-height: 1;
  }
  .cp-evento {
    font-family: 'Nunito', sans-serif;
    font-size: 9pt;
    color: #7c3f6b;
    letter-spacing: 0.5px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 400;
  }
  .cp-numero {
    font-family: 'Nunito', sans-serif;
    font-size: 5.5pt;
    color: #c07898;
    letter-spacing: 1px;
    margin-top: 1mm;
  }
  .cp-id {
    position: absolute;
    top: 4mm;
    left: 4mm;
    font-family: 'Nunito', sans-serif;
    font-size: 6pt;
    color: #b06888;
    letter-spacing: 0.5px;
  }
  .cp-sep {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-sep-linea {
    flex: 1;
    height: 0.5px;
    background: #d43080;
    opacity: 0.5;
  }
  .cp-sep-icono {
    color: #d43080;
    font-size: 7pt;
  }
  .cp-grid {
    flex: 1;
    display: grid;
    gap: 2mm;
  }
  .cp-carton--vertical .cp-grid { max-height: 144mm; row-gap: 2mm; }
  .cp-carton--vertical .cp-header { margin-top: 14mm; margin-bottom: 8mm; }
  .cp-carton--vertical .cp-titulo { font-size: 26pt; margin-bottom: 4mm; }
  .cp-carton--vertical .cp-evento { font-size: 11pt; margin-bottom: 0; }
  .cp-carton--vertical .cp-numero { font-size: 6.5pt; margin-bottom: 2mm; }
  .cp-carton--vertical .cp-sep { margin-bottom: 6mm; }
  .cp-carton:not(.cp-carton--vertical) .cp-titulo { font-size: 26pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-evento { font-size: 11pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-numero { font-size: 6.5pt; }
  .cp-celda {
    border: 1px solid #e0a8c8;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1mm 1.5mm;
    background: white;
  }
  .cp-nombre {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    color: #7c3f6b;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .cp-artista {
    font-family: 'Nunito', sans-serif;
    font-weight: 300;
    color: #a85888;
    line-height: 1.2;
  }`,
  },

  blue: {
    label: 'Azul noche',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,600&family=Outfit:wght@300;400;600&display=swap',
    titulo: '♪ Bingo Musical ♪',
    sepIcono: '◆',
    css: `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .cp-carton {
    background: #edf1f8;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #4a70b0;
    border-radius: 0;
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cp-carton::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: #1d3461;
  }
  .cp-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 3mm 8mm 6mm;
    min-height: 0;
  }
  .cp-header {
    text-align: center;
    margin-top: 6mm;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-titulo {
    font-family: 'Fraunces', serif;
    font-size: 24pt;
    font-weight: 600;
    font-style: italic;
    color: #1d3461;
    letter-spacing: 0.5px;
    line-height: 1;
  }
  .cp-evento {
    font-family: 'Outfit', sans-serif;
    font-size: 9pt;
    color: #2a5090;
    letter-spacing: 2.5px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 400;
    text-transform: uppercase;
  }
  .cp-numero {
    font-family: 'Outfit', sans-serif;
    font-size: 5.5pt;
    color: #6080a8;
    letter-spacing: 1.5px;
    margin-top: 1mm;
    text-transform: uppercase;
  }
  .cp-id {
    position: absolute;
    top: 5mm;
    left: 4mm;
    font-family: 'Outfit', sans-serif;
    font-size: 6pt;
    color: #6080a8;
    letter-spacing: 0.5px;
  }
  .cp-sep {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-sep-linea {
    flex: 1;
    height: 1px;
    background: #3a6bc4;
    opacity: 0.4;
  }
  .cp-sep-icono {
    color: #2a5090;
    font-size: 7pt;
    opacity: 0.6;
  }
  .cp-grid {
    flex: 1;
    display: grid;
    gap: 2mm;
  }
  .cp-carton--vertical .cp-grid { max-height: 144mm; row-gap: 2mm; }
  .cp-carton--vertical .cp-header { margin-top: 14mm; margin-bottom: 8mm; }
  .cp-carton--vertical .cp-titulo { font-size: 26pt; margin-bottom: 4mm; }
  .cp-carton--vertical .cp-evento { font-size: 11pt; margin-bottom: 0; }
  .cp-carton--vertical .cp-numero { font-size: 6.5pt; margin-bottom: 2mm; }
  .cp-carton--vertical .cp-sep { margin-bottom: 6mm; }
  .cp-carton:not(.cp-carton--vertical) .cp-titulo { font-size: 26pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-evento { font-size: 11pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-numero { font-size: 6.5pt; }
  .cp-celda {
    border: 1px solid #a8c0e0;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1mm 1.5mm;
    background: white;
  }
  .cp-nombre {
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
    color: #1d3461;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .cp-artista {
    font-family: 'Outfit', sans-serif;
    font-weight: 300;
    color: #3a6090;
    line-height: 1.2;
  }`,
  },

  corporate: {
    label: 'Corporativo',
    fontUrl: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;600&display=swap',
    titulo: 'Bingo Musical',
    sepIcono: '◆',
    css: `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .cp-carton {
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #555;
    border-radius: 0;
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cp-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 3mm 8mm 6mm;
    min-height: 0;
  }
  .cp-header {
    text-align: center;
    margin-top: 6mm;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-titulo {
    font-family: 'DM Serif Display', serif;
    font-size: 24pt;
    font-weight: 400;
    color: #111;
    letter-spacing: 3px;
    line-height: 1;
    text-transform: uppercase;
  }
  .cp-evento {
    font-family: 'DM Sans', sans-serif;
    font-size: 9pt;
    color: #333;
    letter-spacing: 2px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 400;
    text-transform: uppercase;
  }
  .cp-numero {
    font-family: 'DM Sans', sans-serif;
    font-size: 5.5pt;
    color: #777;
    letter-spacing: 1.5px;
    margin-top: 1mm;
    text-transform: uppercase;
  }
  .cp-id {
    position: absolute;
    top: 4mm;
    left: 4mm;
    font-family: 'DM Sans', sans-serif;
    font-size: 6pt;
    color: #777;
    letter-spacing: 0.5px;
  }
  .cp-sep {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-sep-linea {
    flex: 1;
    height: 0.5px;
    background: #333;
    opacity: 0.4;
  }
  .cp-sep-icono {
    color: #333;
    font-size: 7pt;
    opacity: 0.6;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 2px;
  }
  .cp-grid {
    flex: 1;
    display: grid;
    gap: 2mm;
  }
  .cp-carton--vertical .cp-grid { max-height: 144mm; row-gap: 2mm; }
  .cp-carton--vertical .cp-header { margin-top: 14mm; margin-bottom: 8mm; }
  .cp-carton--vertical .cp-titulo { font-size: 26pt; margin-bottom: 4mm; }
  .cp-carton--vertical .cp-evento { font-size: 11pt; margin-bottom: 0; }
  .cp-carton--vertical .cp-numero { font-size: 6.5pt; margin-bottom: 2mm; }
  .cp-carton--vertical .cp-sep { margin-bottom: 6mm; }
  .cp-carton:not(.cp-carton--vertical) .cp-titulo { font-size: 26pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-evento { font-size: 11pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-numero { font-size: 6.5pt; }
  .cp-celda {
    border: 1px solid #bbb;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1mm 1.5mm;
    background: white;
  }
  .cp-nombre {
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    color: #111;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .cp-artista {
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    color: #444;
    line-height: 1.2;
  }`,
  },

  retro: {
    label: 'Retro',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Nunito:ital,wght@0,300;0,400;0,700;1,400&display=swap',
    titulo: '✦ Bingo Musical ✦',
    sepIcono: '✦',
    css: `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .cp-carton {
    background: #faf5e9;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #b06828;
    border-radius: 4px;
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cp-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 3mm 8mm 6mm;
    min-height: 0;
  }
  .cp-header {
    text-align: center;
    margin-top: 6mm;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-titulo {
    font-family: 'Unbounded', sans-serif;
    font-size: 20pt;
    font-weight: 900;
    color: #258a50;
    letter-spacing: -0.5px;
    line-height: 1;
    text-transform: uppercase;
  }
  .cp-evento {
    font-family: 'Nunito', sans-serif;
    font-size: 9pt;
    color: #c06018;
    letter-spacing: 0.5px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 700;
    font-style: italic;
  }
  .cp-numero {
    font-family: 'Nunito', sans-serif;
    font-size: 5.5pt;
    color: #906840;
    letter-spacing: 1px;
    margin-top: 1mm;
  }
  .cp-id {
    position: absolute;
    top: 4mm;
    left: 4mm;
    font-family: 'Nunito', sans-serif;
    font-size: 6pt;
    color: #906840;
    letter-spacing: 0.5px;
  }
  .cp-sep {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-sep-linea {
    flex: 1;
    height: 1.5px;
    background: #c08030;
    opacity: 0.7;
    border-radius: 2px;
  }
  .cp-sep-icono {
    color: #c06018;
    font-size: 9pt;
    line-height: 1;
  }
  .cp-grid {
    flex: 1;
    display: grid;
    gap: 2mm;
  }
  .cp-carton--vertical .cp-grid { max-height: 144mm; row-gap: 2mm; }
  .cp-carton--vertical .cp-header { margin-top: 14mm; margin-bottom: 8mm; }
  .cp-carton--vertical .cp-titulo { font-size: 22pt; margin-bottom: 4mm; }
  .cp-carton--vertical .cp-evento { font-size: 11pt; margin-bottom: 0; }
  .cp-carton--vertical .cp-numero { font-size: 6.5pt; margin-bottom: 2mm; }
  .cp-carton--vertical .cp-sep { margin-bottom: 6mm; }
  .cp-carton:not(.cp-carton--vertical) .cp-titulo { font-size: 22pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-evento { font-size: 11pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-numero { font-size: 6.5pt; }
  .cp-celda {
    border: 1px solid #c08030;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1mm 1.5mm;
    background: #f5c97e;
  }
  .cp-nombre {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    color: #3d2508;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .cp-artista {
    font-family: 'Nunito', sans-serif;
    font-weight: 400;
    color: #6a3a10;
    line-height: 1.2;
  }`,
  },

  wedding: {
    label: 'Casamiento',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Jost:wght@300;400;600&display=swap',
    titulo: '♪ Bingo Musical ♪',
    sepIcono: '♪',
    css: `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .cp-carton {
    background: white;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #a08050;
    border-radius: 0;
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cp-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 3mm 8mm 6mm;
    min-height: 0;
  }
  .cp-header {
    text-align: center;
    margin-top: 6mm;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-titulo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24pt;
    font-weight: 600;
    font-style: italic;
    color: #8a6830;
    letter-spacing: 2px;
    line-height: 1;
  }
  .cp-evento {
    font-family: 'Jost', sans-serif;
    font-size: 9pt;
    color: #5a3e2e;
    letter-spacing: 0.5px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 400;
  }
  .cp-numero {
    font-family: 'Jost', sans-serif;
    font-size: 5.5pt;
    color: #9a7850;
    letter-spacing: 1px;
    margin-top: 1mm;
  }
  .cp-id {
    position: absolute;
    top: 4mm;
    left: 4mm;
    font-family: 'Jost', sans-serif;
    font-size: 6pt;
    color: #8a6848;
    letter-spacing: 0.5px;
  }
  .cp-sep {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-sep-linea {
    flex: 1;
    height: 0.5px;
    background: #8a6830;
    opacity: 0.5;
  }
  .cp-sep-icono {
    color: #8a6830;
    font-size: 7pt;
    opacity: 0.8;
  }
  .cp-grid {
    flex: 1;
    display: grid;
    gap: 2mm;
  }
  .cp-carton--vertical .cp-grid { max-height: 144mm; row-gap: 2mm; }
  .cp-carton--vertical .cp-header { margin-top: 14mm; margin-bottom: 8mm; }
  .cp-carton--vertical .cp-titulo { font-size: 26pt; margin-bottom: 4mm; }
  .cp-carton--vertical .cp-evento { font-size: 11pt; margin-bottom: 0; }
  .cp-carton--vertical .cp-numero { font-size: 6.5pt; margin-bottom: 2mm; }
  .cp-carton--vertical .cp-sep { margin-bottom: 6mm; }
  .cp-carton:not(.cp-carton--vertical) .cp-titulo { font-size: 26pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-evento { font-size: 11pt; }
  .cp-carton:not(.cp-carton--vertical) .cp-numero { font-size: 6.5pt; }
  .cp-celda {
    border: 1px solid #b89060;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1mm 1.5mm;
    background: white;
  }
  .cp-nombre {
    font-family: 'Jost', sans-serif;
    font-weight: 600;
    color: #4a3020;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .cp-artista {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    color: #7a5838;
    line-height: 1.2;
  }`,
  },
}

// ─── Dimensiones efectivas ────────────────────────────────────────────────────

export function getEffectiveDimensions(cols, rows, orientacion) {
  if (orientacion === 'portrait') {
    return { effectiveCols: Math.min(cols, rows), effectiveRows: Math.max(cols, rows) }
  } else {
    return { effectiveCols: Math.max(cols, rows), effectiveRows: Math.min(cols, rows) }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function chunkArray(arr, size) {
  const result = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

const AJUSTAR_TEXTO_SCRIPT = `
<script>
  function ajustarTexto() {
    document.querySelectorAll('.cp-celda').forEach(celda => {
      const nombre = celda.querySelector('.cp-nombre')
      const artista = celda.querySelector('.cp-artista')
      if (!nombre || !artista) return
      const maxH = celda.clientHeight - 6
      const maxW = celda.clientWidth - 6
      let size = 16
      nombre.style.fontSize = size + 'px'
      while ((nombre.scrollWidth > maxW || nombre.scrollHeight > maxH * 0.6) && size > 6) {
        size -= 0.5
        nombre.style.fontSize = size + 'px'
      }
      artista.style.fontSize = (size * 0.82) + 'px'
    })
  }
  window.addEventListener('load', ajustarTexto)
<\/script>`

function buildCartonInner(carton, effectiveCols, effectiveRows, tmpl, isVertical, eventoNombre, eventoId) {
  const vertClass = isVertical ? ' cp-carton--vertical' : ''
  const w = isVertical ? '148mm' : '210mm'
  const h = isVertical ? '210mm' : '148mm'
  const celdas = carton.tracks.slice(0, effectiveCols * effectiveRows).map((t) => `
    <div class="cp-celda">
      <div class="cp-nombre">${esc(t.name)}</div>
      <div class="cp-artista">${esc(t.artist)}</div>
    </div>`).join('')

  return `
  <div class="cp-carton${vertClass}" style="width:${w};height:${h};">
    <div class="cp-content">
      <div class="cp-id">${esc(eventoId ? eventoId.substring(0, 8).toUpperCase() : '')}</div>
      <div class="cp-header">
        <div class="cp-titulo">${tmpl.titulo}</div>
        <div class="cp-evento">${esc(eventoNombre)}</div>
        <div class="cp-numero">Cartón #${String(carton.numero).padStart(3, '0')}</div>
      </div>
      <div class="cp-grid" style="grid-template-columns:repeat(${effectiveCols},1fr);grid-template-rows:repeat(${effectiveRows},1fr);">
        ${celdas}
      </div>
    </div>
  </div>`
}

// ─── PDF A3 (descarga directa con jsPDF + html2canvas) ───────────────────────

export async function printCartonesEstilizadoPDF(cartones, cols, rows, prefs, eventoNombre, eventoId, onProgreso) {
  const tmpl = TEMPLATES[prefs.template]
  const isVertical = prefs.orientacion === 'portrait'
  const { effectiveCols, effectiveRows } = getEffectiveDimensions(cols, rows, prefs.orientacion)

  // A3: portrait 297×420mm · landscape 420×297mm
  // Cartón A5: portrait 148×210mm · landscape 210×148mm → 4 cartones encajan exactamente
  const cardW = isVertical ? 148 : 210
  const cardH = isVertical ? 210 : 148

  // 1. Cargar fuente en el documento principal
  const fontLinkId = `_bingo-font-${prefs.template}`
  if (!document.getElementById(fontLinkId)) {
    const link = document.createElement('link')
    link.id = fontLinkId
    link.rel = 'stylesheet'
    link.href = tmpl.fontUrl
    document.head.appendChild(link)
  }

  // 2. Agregar CSS del template
  const styleId = `_bingo-css-${prefs.template}`
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style')
    styleEl.id = styleId
    styleEl.textContent = tmpl.css
    document.head.appendChild(styleEl)
  }

  // 3. Esperar fonts
  await document.fonts.ready

  // 4. Crear PDF A3
  const pdf = new jsPDF({
    orientation: isVertical ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a3',
  })

  const pages = chunkArray(cartones, 4)
  let totalRendered = 0

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    if (pageIdx > 0) pdf.addPage()
    const grupo = pages[pageIdx]

    for (let i = 0; i < grupo.length; i++) {
      const c = grupo[i]
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = col * cardW
      const y = row * cardH

      const inner = buildCartonInner(c, effectiveCols, effectiveRows, tmpl, isVertical, eventoNombre, eventoId)
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
      wrapper.innerHTML = inner
      document.body.appendChild(wrapper)

      await new Promise((r) => setTimeout(r, 80))

      const canvas = await html2canvas(wrapper.firstElementChild, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
      })

      document.body.removeChild(wrapper)

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, cardW, cardH)

      totalRendered++
      onProgreso?.(totalRendered, cartones.length)
    }
  }

  pdf.save('cartones-bingo.pdf')
}

// ─── PNG individual (html2canvas) ─────────────────────────────────────────────

export async function printCartonesEstilizadoPNG(cartones, cols, rows, prefs, eventoNombre, eventoId, onProgreso) {
  const tmpl = TEMPLATES[prefs.template]
  const isVertical = prefs.orientacion === 'portrait'
  const { effectiveCols, effectiveRows } = getEffectiveDimensions(cols, rows, prefs.orientacion)

  // 1. Cargar la fuente en el documento principal (si no está ya)
  const fontLinkId = `_bingo-font-${prefs.template}`
  if (!document.getElementById(fontLinkId)) {
    const link = document.createElement('link')
    link.id = fontLinkId
    link.rel = 'stylesheet'
    link.href = tmpl.fontUrl
    document.head.appendChild(link)
  }

  // 2. Agregar el CSS del template al documento (si no está ya)
  const styleId = `_bingo-css-${prefs.template}`
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style')
    styleEl.id = styleId
    styleEl.textContent = tmpl.css
    document.head.appendChild(styleEl)
  }

  // 3. Esperar a que los fonts estén listos
  await document.fonts.ready

  // 4. Generar cada cartón
  for (let i = 0; i < cartones.length; i++) {
    const c = cartones[i]
    onProgreso?.(i + 1, cartones.length)

    const inner = buildCartonInner(c, effectiveCols, effectiveRows, tmpl, isVertical, eventoNombre, eventoId)

    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
    wrapper.innerHTML = inner
    document.body.appendChild(wrapper)

    const cardEl = wrapper.firstElementChild

    // Pequeña pausa para que el browser renderice
    await new Promise((r) => setTimeout(r, 80))

    const canvas = await html2canvas(cardEl, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null,
      logging: false,
    })

    document.body.removeChild(wrapper)

    // Descargar PNG
    const slug = `${esc(c.nombre)}-${esc(c.apellido)}`.replace(/[^a-zA-Z0-9-]/g, '_').slice(0, 40)
    const filename = `carton-${String(c.numero).padStart(3, '0')}-${slug}.png`
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // Pequeña pausa entre descargas para no saturar el browser
    if (i < cartones.length - 1) {
      await new Promise((r) => setTimeout(r, 150))
    }
  }
}
