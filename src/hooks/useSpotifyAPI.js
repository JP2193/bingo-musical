import { normalizeTrack } from '../utils/spotify'

const BASE = 'https://api.spotify.com/v1'

export function useSpotifyAPI(token) {
  async function apiFetch(url) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (res.status === 401) {
      throw new Error('TOKEN_EXPIRED')
    }
    if (!res.ok) {
      let body = ''
      try { body = await res.text() } catch (_) {}
      console.error(`API ${res.status} on ${url}:`, body)
      throw new Error(`API error: ${res.status} — ${body}`)
    }

    return res.json()
  }

  async function fetchPlaylist(playlistId) {
    // market=from_token es OBLIGATORIO: sin él Spotify no incluye tracks en la respuesta
    // (docs dicen "content is considered unavailable" si no hay market)
    const data = await apiFetch(
      `${BASE}/playlists/${playlistId}?market=from_token&additional_types=track`
    )

    const meta = {
      id: data.id,
      name: data.name,
      imageUrl: data.images?.[0]?.url ?? null,
      totalTracks: data.tracks?.total ?? 0,
    }

    let items = data.tracks?.items ?? []
    let nextUrl = data.tracks?.next

    // Fallback al endpoint dedicado si el principal no devolvió items.
    // NOTA: /playlists/{id}/items (NO /tracks — ese endpoint está deprecated)
    // Solo funciona para playlists que el usuario posea o en las que colabore.
    if (items.length === 0) {
      console.warn('▶ items vacíos en respuesta principal, intentando /items...')
      try {
        const page = await apiFetch(
          `${BASE}/playlists/${playlistId}/items?market=from_token&limit=100&additional_types=track`
        )
        items = page.items ?? []
        nextUrl = page.next
        console.log('▶ /items items:', items.length)
      } catch (e) {
        if (e.message.includes('403')) {
          throw new Error('PLAYLIST_FORBIDDEN')
        }
        console.warn('▶ Fallback /items falló:', e.message)
      }
    }

    const tracks = items.map(normalizeTrack).filter(Boolean)

    // Paginar si hay más de 100 tracks
    while (nextUrl) {
      try {
        const page = await apiFetch(nextUrl)
        const pageNormalized = (page.items ?? []).map(normalizeTrack).filter(Boolean)
        tracks.push(...pageNormalized)
        nextUrl = page.next
      } catch (e) {
        console.warn('Paginación detenida:', e.message)
        break
      }
    }

    return { meta, tracks }
  }

  return { fetchPlaylist }
}
