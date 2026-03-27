import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const FONT_LINK_ID = 'carton-print-fonts'
const STYLE_ID = 'carton-print-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .cp-page {
      width: 420mm;
      height: 296mm;
      display: grid;
      grid-template-columns: 210mm 210mm;
      grid-template-rows: 148mm 148mm;
      background: white;
    }
    .cp-carton {
      width: 210mm;
      height: 148mm;
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
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeat(3, 1fr);
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

function buildCartonHTML(numero, tracks) {
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
    <div class="cp-carton">
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
        <div class="cp-grid">${celdas}</div>
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
 * Genera un PDF A3 landscape con los cartones dados (4 por página en grilla 2×2).
 * @param {Array<{ numero: number, nombre: string, apellido: string, tracks: Array<{name: string, artist: string}> }>} cartones
 * @param {(mensaje: string) => void} [onProgreso]
 */
export async function imprimirCartones(cartones, onProgreso) {
  injectStyles()
  await ensureFonts()

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })

  const groups = []
  for (let i = 0; i < cartones.length; i += 4) {
    groups.push(cartones.slice(i, i + 4))
  }

  for (let gi = 0; gi < groups.length; gi++) {
    onProgreso?.(`Generando página ${gi + 1} de ${groups.length}...`)

    const group = groups[gi]
    const pageEl = document.createElement('div')
    pageEl.className = 'cp-page'
    pageEl.style.cssText = 'position: fixed; left: -9999px; top: 0; z-index: -1;'

    const htmlParts = group.map((card) => buildCartonHTML(card.numero, card.tracks))
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

    if (gi > 0) pdf.addPage('a3', 'landscape')
    const imgData = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(imgData, 'JPEG', 0, 0, 420, 297)
  }

  onProgreso?.('')
  pdf.save('cartones-bingo.pdf')
}
