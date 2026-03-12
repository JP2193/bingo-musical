import html2canvas from 'html2canvas'

/**
 * Convierte una URL de imagen a base64 data URL.
 * Necesario para html2canvas (evita problemas de CORS con CDN de Spotify).
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function imageUrlToBase64(url) {
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Captura un elemento DOM como blob PNG en alta resolución.
 * @param {HTMLElement} element
 * @returns {Promise<Blob>}
 */
export async function captureCard(element) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: false,    // false: las URLs de Spotify ya fueron convertidas a base64
    allowTaint: true,  // requerido cuando useCORS es false
    logging: false,
    backgroundColor: null,
  })
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

/**
 * Descarga un blob PNG con el nombre indicado.
 * @param {Blob} blob
 * @param {string} filename
 */
export function saveCardPNG(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
