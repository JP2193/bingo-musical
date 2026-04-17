import html2canvas from 'html2canvas'

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
    border: 0.8px solid #f5c6e8;
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
    color: #e63f8e;
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
    color: #f5c6e8;
    letter-spacing: 1px;
    margin-top: 1mm;
  }
  .cp-id {
    position: absolute;
    top: 4mm;
    left: 4mm;
    font-family: 'Nunito', sans-serif;
    font-size: 6pt;
    color: #c47faa;
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
    background: #e63f8e;
    opacity: 0.4;
  }
  .cp-sep-icono {
    color: #e63f8e;
    font-size: 7pt;
    opacity: 0.7;
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
    border: 1px solid #f5c6e8;
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
    color: #c47faa;
    line-height: 1.2;
  }`,
  },

  blue: {
    label: 'Azul noche',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,600&family=Outfit:wght@300;400;600&display=swap',
    titulo: '♪ Bingo Musical ♪',
    sepIcono: null, // uses ::before on .cp-sep-icono (diamond shape via CSS)
    css: `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .cp-carton {
    background: #f4f6fb;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #c8d4e8;
    border-radius: 0;
    position: relative;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .cp-carton::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #1d3461 0%, #3a6bc4 50%, #1d3461 100%);
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
    color: #3a6bc4;
    letter-spacing: 2.5px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 300;
    text-transform: uppercase;
  }
  .cp-numero {
    font-family: 'Outfit', sans-serif;
    font-size: 5.5pt;
    color: #a8bed8;
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
    color: #a8bed8;
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
    background: linear-gradient(90deg, transparent, #3a6bc4 40%, #3a6bc4 60%, transparent);
    opacity: 0.25;
  }
  .cp-sep-icono {
    width: 6px;
    height: 6px;
    background: #3a6bc4;
    opacity: 0.35;
    transform: rotate(45deg);
    flex-shrink: 0;
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
    border: 1px solid #dae3f0;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1mm 1.5mm;
    background: linear-gradient(160deg, #ffffff 60%, #eef3fb 100%);
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
    color: #5b84c0;
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
    background: #f8f8f6;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 0.8px solid #d0cfc8;
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
    color: #1a1a2e;
    letter-spacing: 3px;
    line-height: 1;
    text-transform: uppercase;
  }
  .cp-evento {
    font-family: 'DM Sans', sans-serif;
    font-size: 9pt;
    color: #4a4a5a;
    letter-spacing: 2px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 400;
    text-transform: uppercase;
  }
  .cp-numero {
    font-family: 'DM Sans', sans-serif;
    font-size: 5.5pt;
    color: #b0afaa;
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
    color: #8a8a96;
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
    background: #1a1a2e;
    opacity: 0.25;
  }
  .cp-sep-icono {
    color: #1a1a2e;
    font-size: 7pt;
    opacity: 0.4;
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
    border: 1px solid #d0cfc8;
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
    color: #1a1a2e;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .cp-artista {
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    color: #6a6a7a;
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
    border: none;
    border-radius: 16px;
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
    color: #3daa72;
    letter-spacing: -0.5px;
    line-height: 1;
    text-transform: uppercase;
  }
  .cp-evento {
    font-family: 'Nunito', sans-serif;
    font-size: 9pt;
    color: #e07c2a;
    letter-spacing: 0.5px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 700;
    font-style: italic;
  }
  .cp-numero {
    font-family: 'Nunito', sans-serif;
    font-size: 5.5pt;
    color: #c8b898;
    letter-spacing: 1px;
    margin-top: 1mm;
  }
  .cp-id {
    position: absolute;
    top: 4mm;
    left: 4mm;
    font-family: 'Nunito', sans-serif;
    font-size: 6pt;
    color: #c8b898;
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
    background: #e8c07a;
    opacity: 0.6;
    border-radius: 2px;
  }
  .cp-sep-icono {
    color: #e07c2a;
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
    border: none;
    border-radius: 10px;
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
    color: #7a5030;
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
    border: 0.8px solid #ede4ce;
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
    color: #b8935a;
    letter-spacing: 2px;
    line-height: 1;
  }
  .cp-evento {
    font-family: 'Jost', sans-serif;
    font-size: 9pt;
    color: #6b5040;
    letter-spacing: 0.5px;
    margin-top: 2mm;
    margin-bottom: 1mm;
    font-weight: 400;
  }
  .cp-numero {
    font-family: 'Jost', sans-serif;
    font-size: 5.5pt;
    color: #ddd0bc;
    letter-spacing: 1px;
    margin-top: 1mm;
  }
  .cp-id {
    position: absolute;
    top: 4mm;
    left: 4mm;
    font-family: 'Jost', sans-serif;
    font-size: 6pt;
    color: #a8917a;
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
    background: #b8935a;
    opacity: 0.4;
  }
  .cp-sep-icono {
    color: #b8935a;
    font-size: 7pt;
    opacity: 0.7;
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
    border: 1px solid #ecdec4;
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
    color: #6b5040;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .cp-artista {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    color: #a8917a;
    line-height: 1.2;
  }`,
  },
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

function buildCartonInner(carton, cols, rows, tmpl, isVertical, eventoNombre, eventoId) {
  const vertClass = isVertical ? ' cp-carton--vertical' : ''
  const w = isVertical ? '148mm' : '210mm'
  const h = isVertical ? '210mm' : '148mm'
  const celdas = carton.tracks.slice(0, cols * rows).map((t) => `
    <div class="cp-celda">
      <div class="cp-nombre">${esc(t.name)}</div>
      <div class="cp-artista">${esc(t.artist)}</div>
    </div>`).join('')

  const sepIcono = tmpl.sepIcono != null
    ? `<div class="cp-sep-icono">${tmpl.sepIcono}</div>`
    : `<div class="cp-sep-icono"></div>`

  return `
  <div class="cp-carton${vertClass}" style="width:${w};height:${h};">
    <div class="cp-content">
      <div class="cp-id">${esc(eventoId ? eventoId.substring(0, 8).toUpperCase() : '')}</div>
      <div class="cp-header">
        <div class="cp-titulo">${tmpl.titulo}</div>
        <div class="cp-evento">${esc(eventoNombre)}</div>
        <div class="cp-numero">Cartón #${String(carton.numero).padStart(3, '0')} · ${esc(carton.nombre)} ${esc(carton.apellido)}</div>
      </div>
      <div class="cp-sep">
        <div class="cp-sep-linea"></div>
        ${sepIcono}
        <div class="cp-sep-linea"></div>
      </div>
      <div class="cp-grid" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);">
        ${celdas}
      </div>
    </div>
  </div>`
}

// ─── PDF A3 (ventana de impresión) ────────────────────────────────────────────

export function printCartonesEstilizadoPDF(cartones, cols, rows, prefs, eventoNombre, eventoId) {
  const tmpl = TEMPLATES[prefs.template]
  const isVertical = prefs.orientacion === 'portrait'

  // A3: 420×297mm landscape · 297×420mm portrait
  // Cada cartón A5: landscape 210×148mm · portrait 148×210mm
  // 4 cartones en A3 = 2 cols × 2 rows, encaja perfectamente
  const pageW = isVertical ? '297mm' : '420mm'
  const pageH = isVertical ? '420mm' : '297mm'
  const a3Size = isVertical ? 'A3' : 'A3 landscape'

  const pages = chunkArray(cartones, 4).map((grupo) => {
    const cards = grupo.map((c) => buildCartonInner(c, cols, rows, tmpl, isVertical, eventoNombre, eventoId)).join('')
    return `<div class="page">${cards}</div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cartones Bingo Musical</title>
  <link rel="stylesheet" href="${tmpl.fontUrl}">
  <style>
    ${tmpl.css}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; }
    .page {
      width: ${pageW};
      height: ${pageH};
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
    }
    .page > .cp-carton {
      width: 100% !important;
      height: 100% !important;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .page { page-break-after: always; break-after: page; }
      .page:last-of-type { page-break-after: avoid; break-after: avoid; }
      @page { size: ${a3Size}; margin: 0; }
    }
  </style>
</head>
<body>
  ${pages}
  ${AJUSTAR_TEXTO_SCRIPT}
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) {
    alert('Habilitá las ventanas emergentes para imprimir los cartones.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 600)
}

// ─── PNG individual (html2canvas) ─────────────────────────────────────────────

export async function printCartonesEstilizadoPNG(cartones, cols, rows, prefs, eventoNombre, eventoId, onProgreso) {
  const tmpl = TEMPLATES[prefs.template]
  const isVertical = prefs.orientacion === 'portrait'

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

    const inner = buildCartonInner(c, cols, rows, tmpl, isVertical, eventoNombre, eventoId)

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
