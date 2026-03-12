/**
 * Extrae el ID de playlist de una URL, URI o ID directo de Spotify.
 * @param {string} input
 * @returns {string|null}
 */
export function extractPlaylistId(input) {
  if (!input) return null
  const trimmed = input.trim()

  // URI: spotify:playlist:XXXX
  const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]+)/)
  if (uriMatch) return uriMatch[1]

  // URL: open.spotify.com/playlist/XXXX
  const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]+)/)
  if (urlMatch) return urlMatch[1]

  // ID directo (22 chars alfanuméricos)
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) return trimmed

  return null
}

/**
 * Normaliza un item de la API de Spotify a { id, name, artist, thumbnail }.
 * @param {object} rawItem
 * @returns {{ id: string, name: string, artist: string, thumbnail: string|null }|null}
 */
export function normalizeTrack(rawItem) {
  // La API de Spotify usa "item" en el nuevo endpoint /items,
  // y "track" (deprecated) en el antiguo /tracks y en la respuesta embebida de /playlists/{id}.
  // Priorizamos "item", con fallback a "track" para compatibilidad.
  const track = rawItem?.item ?? rawItem?.track
  if (!track || !track.id) return null

  // Usar imagen mediana (index 1, ~300x300) para economizar memoria en preview
  const images = track.album?.images ?? []
  const thumbnail = images[1]?.url ?? images[0]?.url ?? null

  return {
    id: track.id,
    name: track.name,
    artist: track.artists?.[0]?.name ?? 'Artista desconocido',
    thumbnail,
  }
}

/**
 * Devuelve un color hex determinístico basado en un string (para fallback de imágenes).
 * @param {string} str
 * @returns {string}
 */
export function getImageFallbackColor(str) {
  const palette = [
    '#2C3E50',
    '#8E44AD',
    '#1A5276',
    '#145A32',
    '#7B241C',
    '#D35400',
    '#1F618D',
    '#117A65',
    '#784212',
    '#4D5656',
  ]

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  return palette[Math.abs(hash) % palette.length]
}
