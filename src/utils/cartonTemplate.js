// ─── Estilos del cartón físico ────────────────────────────────────────────────
// Clases con prefijo "cp-" (carton-print).
// Las dimensiones de .cp-carton y el grid-template de .cp-grid se aplican
// como inline styles en buildCartonHTML() para soportar ambos formatos.

export const CARTON_CSS = `
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
    filter: contrast(1.15) saturate(1.1);
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
    margin-bottom: 4mm;
    flex-shrink: 0;
  }
  .cp-titulo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 26pt;
    font-weight: 600;
    font-style: italic;
    color: #6b4410;
    letter-spacing: 2px;
    line-height: 1;
  }
  .cp-numero {
    font-family: 'Jost', sans-serif;
    font-size: 8pt;
    color: #7a6858;
    letter-spacing: 1px;
    margin-top: 1mm;
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
    opacity: 0.8;
  }
  .cp-sep-icono {
    color: #8a6830;
    font-size: 7pt;
    opacity: 1;
  }
  .cp-grid {
    flex: 1;
    display: grid;
    gap: 2mm;
  }
  .cp-carton--vertical .cp-grid {
    max-height: 144mm;
    row-gap: 6mm;
  }
  .cp-carton--vertical .cp-header {
    margin-bottom: 6mm;
  }
  .cp-carton--vertical .cp-sep {
    margin-bottom: 6mm;
  }
  .cp-celda {
    border: 1px solid rgba(140, 100, 60, 0.75);
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
    color: #3a2010;
    line-height: 1.25;
    margin-bottom: 2px;
  }
  .cp-artista {
    font-family: 'Jost', sans-serif;
    font-weight: 300;
    color: #5a3e28;
    line-height: 1.2;
  }
`

// ─── HTML de un cartón individual ─────────────────────────────────────────────
// is4x4: true → A5 portrait 148×210mm, grid 4×4
//        false → A5 landscape 210×148mm, grid 5×3

function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildCartonHTML(numero, tracks, is4x4) {
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
    <div class="cp-carton${is4x4 ? ' cp-carton--vertical' : ''}" style="${cartonStyle}">
      <img class="cp-floral" src="/img/1.png" alt="" crossorigin="anonymous">
      <div class="cp-content">
        <div class="cp-header">
          <div class="cp-titulo">♪ Bingo Musical ♪</div>
          <div class="cp-numero">#${String(numero).padStart(3, '0')}</div>
        </div>
        <div class="cp-grid" style="${gridStyle}">${celdas}</div>
      </div>
    </div>`
}

// ─── Ajuste de font-size por celda ───────────────────────────────────────────
// Reduce el tamaño de fuente hasta que el contenido entre en la celda.

export function ajustarTexto(container) {
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
