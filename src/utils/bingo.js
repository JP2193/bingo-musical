/**
 * Fisher-Yates shuffle.
 * @param {Array} array
 * @returns {Array} nueva copia mezclada
 */
export function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Fingerprint de un cartón basado en el orden de sus tracks.
 * Dos cartones con las mismas canciones en distinto orden = cartones distintos.
 * @param {Array<string>} ids - array de UUIDs de tracks
 * @returns {string}
 */
export function cardFingerprint(ids) {
  return ids.join('|')
}

/**
 * Genera qty cartones únicos para el evento.
 * Cada cartón es un array de cols*rows UUIDs de tracks en el orden del grid.
 * @param {Array} tracks - array de objetos { id, name, artist }
 * @param {number} cols
 * @param {number} rows
 * @param {number} qty
 * @returns {Array<Array<string>>} array de arrays de IDs
 */
export function generateAllUniqueCards(tracks, cols, rows, qty) {
  const usedFingerprints = new Set()
  const result = []

  for (let i = 0; i < qty; i++) {
    let attempts = 0
    while (attempts < 1000) {
      const ids = shuffleArray([...tracks]).slice(0, cols * rows).map((t) => t.id)
      const fp = JSON.stringify([...ids].sort())
      if (!usedFingerprints.has(fp)) {
        usedFingerprints.add(fp)
        result.push(ids)
        break
      }
      attempts++
    }
    if (result.length <= i) {
      throw new Error(
        `No hay suficientes combinaciones únicas para generar ${qty} cartones con este pool de canciones.`
      )
    }
  }

  return result
}
