/**
 * Abre una ventana de impresión con los cartones en formato HTML.
 * @param {Array<{ numero: number, nombre: string, apellido: string, tracks: Array<{name: string, artist: string}> }>} cartones
 * @param {number} cols
 * @param {number} rows
 */
export function printCartones(cartones, cols, rows) {
  const html = buildHTML(cartones, cols, rows)
  const win = window.open('', '_blank')
  if (!win) {
    alert('Habilitá las ventanas emergentes para imprimir los cartones.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}

function buildHTML(cartones, cols, rows) {
  const cells = cols * rows
  const isLandscape = cols > rows

  const cartonesHTML = cartones.map(({ numero, nombre, apellido, tracks }) => {
    const cellsHTML = tracks.slice(0, cells).map((t) => `
      <div class="cell">
        <div class="cell-name">${esc(t.name)}</div>
        <div class="cell-artist">${esc(t.artist)}</div>
      </div>
    `).join('')

    return `
      <div class="carton">
        <div class="carton-header">
          <span class="carton-title">BINGO MUSICAL</span>
          <span class="carton-num">#${String(numero).padStart(3, '0')}</span>
        </div>
        <div class="carton-invitado">${esc(nombre)} ${esc(apellido)}</div>
        <div class="grid" style="grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);">
          ${cellsHTML}
        </div>
      </div>
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cartones Bingo Musical</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'DM Sans', sans-serif;
      background: #fff;
      color: #111;
    }

    .page {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 8mm;
      padding: 8mm;
      width: 100%;
      min-height: 100vh;
    }

    .carton {
      border: 2px solid #111;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .carton-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4mm 5mm 2mm;
      border-bottom: 1px solid #333;
    }

    .carton-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18pt;
      letter-spacing: 0.06em;
      color: #111;
    }

    .carton-num {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 11pt;
      color: #555;
      letter-spacing: 0.04em;
    }

    .carton-invitado {
      font-size: 9pt;
      color: #444;
      padding: 1mm 5mm 2mm;
      border-bottom: 1px solid #e0e0e0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .grid {
      display: grid;
      flex: 1;
    }

    .cell {
      border: 1px solid #ccc;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      overflow: hidden;
    }

    .cell:nth-child(odd) {
      background: #fafafa;
    }

    .cell-name {
      font-size: 7.5pt;
      font-weight: 500;
      line-height: 1.2;
      word-break: break-word;
    }

    .cell-artist {
      font-size: 6pt;
      color: #666;
      margin-top: 1mm;
      line-height: 1.2;
      word-break: break-word;
    }

    @media print {
      body { margin: 0; }
      .page {
        gap: 6mm;
        padding: 6mm;
        page-break-after: always;
      }
      @page {
        size: ${isLandscape ? 'A4 landscape' : 'A4'};
        margin: 0;
      }
    }
  </style>
</head>
<body>
  ${chunkArray(cartones, 4).map((grupo) => `
    <div class="page">
      ${grupo.map(({ numero, nombre, apellido, tracks }) => `
        <div class="carton">
          <div class="carton-header">
            <span class="carton-title">BINGO MUSICAL</span>
            <span class="carton-num">#${String(numero).padStart(3, '0')}</span>
          </div>
          <div class="carton-invitado">${esc(nombre)} ${esc(apellido)}</div>
          <div class="grid" style="grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);">
            ${tracks.slice(0, cells).map((t) => `
              <div class="cell">
                <div class="cell-name">${esc(t.name)}</div>
                <div class="cell-artist">${esc(t.artist)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `).join('')}
</body>
</html>`
}

function chunkArray(arr, size) {
  const result = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
