import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const FONT_LINK_ID = 'carton-print-fonts'
const STYLE_ID = 'carton-print-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .cp-carton {
      background: white;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 0.8px solid rgba(184, 147, 90, 0.25);
      border-radius: 0;
    }
    .cp-floral {
      width: 100%;
      height: 23mm;
      object-fit: cover;
      object-position: bottom;
      flex-shrink: 0;
      display: block;
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
      margin-bottom: 2mm;
      flex-shrink: 0;
    }
    .cp-titulo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 22pt;
      font-weight: 600;
      font-style: italic;
      color: #b8935a;
      letter-spacing: 2px;
      line-height: 1;
    }
    .cp-numero {
      font-family: 'Jost', sans-serif;
      font-size: 5.5pt;
      color: #ddd0bc;
      letter-spacing: 1px;
      margin-top: 1mm;
    }
    .cp-sep {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2mm;
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
    .cp-celda {
      border: 1px solid rgba(212, 188, 148, 0.45);
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
    }
  `
  document.head.appendChild(style)
}

async function ensureFonts() {
  if (!document.getElementById(FONT_LINK_ID)) {
    const link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Jost:wght@300;600&display=swap'
    document.head.appendChild(link)
  }
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))])
}

function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildCartonHTML(numero, tracks, is4x4) {
  const cartonStyle = is4x4
    ? 'width:148mm;height:210mm;'
    : 'width:210mm;height:148mm;'
  const gridCols = is4x4 ? 4 : 5
  const gridRows = is4x4 ? 4 : 3
  const gridStyle = `grid-template-columns:repeat(${gridCols},1fr);grid-template-rows:repeat(${gridRows},1fr);`

  const celdas = tracks
    .map(
      (t) => `
      <div class="cp-celda">
        <div class="cp-nombre">${escapeHTML(t.name)}</div>
        <div class="cp-artista">${escapeHTML(t.artist)}</div>
      </div>`
    )
    .join('')

  return `
    <div class="cp-carton" style="${cartonStyle}">
      <img class="cp-floral" src="/img/1.png" alt="" crossorigin="anonymous">
      <div class="cp-content">
        <div class="cp-header">
          <div class="cp-titulo">♪ Bingo Musical ♪</div>
          <div class="cp-numero">Cartón #${String(numero).padStart(3, '0')}</div>
        </div>
        <div class="cp-sep">
          <div class="cp-sep-linea"></div>
          <div class="cp-sep-icono">✦</div>
          <div class="cp-sep-linea"></div>
        </div>
        <div class="cp-grid" style="${gridStyle}">${celdas}</div>
      </div>
    </div>`
}

function ajustarTexto(container) {
  container.querySelectorAll('.cp-celda').forEach((celda) => {
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
    artista.style.fontSize = size * 0.82 + 'px'
  })
}

function waitForImages(container) {
  const imgs = Array.from(container.querySelectorAll('img'))
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) resolve()
          else {
            img.onload = resolve
            img.onerror = resolve
          }
        })
    )
  )
}

/**
 * Genera un PDF A3 con los cartones dados (4 por página en grilla 2×2).
 * Detecta el formato automáticamente según tracks.length: 15 → 3×5 landscape, 16 → 4×4 portrait.
 * @param {Array<{ numero: number, nombre: string, apellido: string, tracks: Array<{name: string, artist: string}> }>} cartones
 * @param {(mensaje: string) => void} [onProgreso]
 */
export async function imprimirCartones(cartones, onProgreso) {
  injectStyles()
  await ensureFonts()

  const is4x4 = cartones[0]?.tracks?.length === 16
  const orientation = is4x4 ? 'portrait' : 'landscape'
  const pageW = is4x4 ? 297 : 420
  const pageH = is4x4 ? 420 : 297
  const cardW = is4x4 ? 148 : 210
  const cardH = is4x4 ? 210 : 148

  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a3' })

  const groups = []
  for (let i = 0; i < cartones.length; i += 4) {
    groups.push(cartones.slice(i, i + 4))
  }

  for (let gi = 0; gi < groups.length; gi++) {
    onProgreso?.(`Generando página ${gi + 1} de ${groups.length}...`)

    const group = groups[gi]
    const pageEl = document.createElement('div')
    pageEl.style.cssText = `
      position: fixed; left: -9999px; top: 0; z-index: -1;
      width: ${pageW}mm; height: ${pageH}mm;
      display: grid;
      grid-template-columns: ${cardW}mm ${cardW}mm;
      grid-template-rows: ${cardH}mm ${cardH}mm;
      background: white;
    `

    const htmlParts = group.map((card) => buildCartonHTML(card.numero, card.tracks, is4x4))
    for (let i = group.length; i < 4; i++) {
      htmlParts.push('<div style="background:white;"></div>')
    }
    pageEl.innerHTML = htmlParts.join('')

    document.body.appendChild(pageEl)

    await waitForImages(pageEl)
    // Two rAF cycles ensure layout is computed
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    ajustarTexto(pageEl)
    await new Promise((r) => requestAnimationFrame(r))

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
    })

    document.body.removeChild(pageEl)

    if (gi > 0) pdf.addPage('a3', orientation)
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(imgData, 'JPEG', 0, 0, pageW, pageH)
  }

  onProgreso?.('')
  pdf.save('cartones-bingo.pdf')
}
