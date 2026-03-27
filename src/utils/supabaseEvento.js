import { supabase } from '../lib/supabase'
import { supabaseAdmin } from '../lib/supabaseAdmin'

export async function getPlaylists() {
  const { data, error } = await supabase
    .from('playlists')
    .select('id, name, tracks')
    .order('saved_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPlaylistActiva() {
  const { data, error } = await supabase
    .from('config')
    .select('value')
    .eq('key', 'playlist_activa')
    .single()
  if (error) return ''
  return data?.value ?? ''
}

export async function setPlaylistActiva(playlistId) {
  const { error } = await supabase
    .from('config')
    .update({ value: playlistId, updated_at: new Date().toISOString() })
    .eq('key', 'playlist_activa')
  if (error) throw error
}

export async function deleteCartonesByPlaylist(playlistId) {
  const { error } = await supabaseAdmin
    .from('cartones')
    .delete()
    .eq('playlist_id', playlistId)
  if (error) throw error
}

/**
 * Inserta cartones en batches de 50.
 * @param {Array<{numero, playlist_id, track_ids}>} cartones
 * @param {Function} onProgress - (insertados, total) => void
 */
export async function insertCartonesBatch(cartones, onProgress) {
  const BATCH_SIZE = 50
  let insertados = 0

  for (let i = 0; i < cartones.length; i += BATCH_SIZE) {
    const batch = cartones.slice(i, i + BATCH_SIZE)
    const { error } = await supabaseAdmin.from('cartones').insert(batch)
    if (error) throw error
    insertados += batch.length
    onProgress?.(insertados, cartones.length)
  }
}

export async function getEstadoEvento(playlistId) {
  const { data, error } = await supabase
    .from('cartones')
    .select('id, numero, nombre_invitado, entregado, entregado_at')
    .eq('playlist_id', playlistId)
    .order('numero', { ascending: true })
  if (error) throw error

  const total = data.length
  const entregados = data.filter((c) => c.entregado).length
  return {
    total,
    entregados,
    disponibles: total - entregados,
    lista: data,
  }
}

export async function resetEvento(playlistId) {
  const { error } = await supabaseAdmin
    .from('cartones')
    .update({ entregado: false, nombre_invitado: null, entregado_at: null })
    .eq('playlist_id', playlistId)
  if (error) throw error
}

export async function getCancionesCantadas(playlistId) {
  const { data, error } = await supabase
    .from('canciones_cantadas')
    .select('track_id')
    .eq('playlist_id', playlistId)
  if (error) throw error
  return new Set(data.map((c) => c.track_id))
}

export async function activarCancion(playlistId, trackId) {
  const { error } = await supabaseAdmin
    .from('canciones_cantadas')
    .insert({ playlist_id: playlistId, track_id: trackId })
  if (error) throw error
}

export async function desactivarCancion(playlistId, trackId) {
  const { error } = await supabaseAdmin
    .from('canciones_cantadas')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)
  if (error) throw error
}

export async function resetCancionesCantadas(playlistId) {
  const { error } = await supabaseAdmin
    .from('canciones_cantadas')
    .delete()
    .eq('playlist_id', playlistId)
  if (error) throw error
}

export async function getRankingCartones(playlistId) {
  const [{ data: cantadas, error: e1 }, { data: cartones, error: e2 }] = await Promise.all([
    supabase.from('canciones_cantadas').select('track_id').eq('playlist_id', playlistId),
    supabase
      .from('cartones')
      .select('numero, nombre_invitado, track_ids')
      .eq('playlist_id', playlistId)
      .eq('entregado', true),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const cantadasSet = new Set(cantadas.map((c) => c.track_id))
  return cartones
    .map((c) => {
      const tachadas = c.track_ids.filter((id) => cantadasSet.has(id)).length
      return {
        numero: c.numero,
        nombre: c.nombre_invitado,
        tachadas,
        total: c.track_ids.length,
        pct: Math.round((tachadas / c.track_ids.length) * 100),
      }
    })
    .sort((a, b) => b.tachadas - a.tachadas)
}
