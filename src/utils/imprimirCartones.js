import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { CARTON_CSS, buildCartonHTML, ajustarTexto } from './cartonTemplate'

const FONT_LINK_ID = 'carton-print-fonts'
const STYLE_ID = 'carton-print-style'

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = CARTON_CSS
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
