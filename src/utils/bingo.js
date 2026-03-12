/**
 * Fisher-Yates shuffle. Nunca usar .sort(() => Math.random() - 0.5).
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
 * Genera un cartón de bingo: cols*rows canciones aleatorias únicas.
 * @param {Array} tracks
 * @param {number} cols
 * @param {number} rows
 * @returns {Array}
 */
export function generateCard(tracks, cols, rows) {
  return shuffleArray([...tracks]).slice(0, cols * rows)
}

/**
 * Devuelve un fingerprint del cartón.
 * DECISIÓN: fingerprint sensible al orden (sin sort).
 * Dos cartones con las mismas canciones en distinto orden = distinto fingerprint = cartones distintos.
 * En bingo, la posición de cada canción importa para el jugador.
 * @param {Array} card
 * @returns {string}
 */
export function cardFingerprint(card) {
  return card.map((t) => t.id).join('|')
}

/**
 * Genera un cartón único que no haya aparecido antes en esta sesión.
 * @param {Array} tracks
 * @param {number} cols
 * @param {number} rows
 * @param {Array} previousCards - array de cartones anteriores
 * @returns {Array}
 */
export function generateUniqueCard(tracks, cols, rows, previousCards) {
  const usedFingerprints = new Set(previousCards.map(cardFingerprint))

  let attempts = 0
  while (attempts < 1000) {
    const card = generateCard(tracks, cols, rows)
    const fp = cardFingerprint(card)
    if (!usedFingerprints.has(fp)) return card
    attempts++
  }

  throw new Error(
    `No hay suficientes combinaciones únicas para generar ${previousCards.length + 1} cartones distintos con este pool de canciones.`
  )
}
