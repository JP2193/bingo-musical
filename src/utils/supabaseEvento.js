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

function normalizarStr(str = '') {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export async function getInvitados(playlistId) {
  const { data, error } = await supabase
    .from('invitados')
    .select('id, nombre, apellido, carton_id, asignado_at, cartones(numero)')
    .eq('playlist_id', playlistId)
    .order('orden', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getCartonesSobrantes(playlistId) {
  const { data: asignados } = await supabase
    .from('invitados')
    .select('carton_id')
    .eq('playlist_id', playlistId)
    .not('carton_id', 'is', null)

  const idsAsignados = asignados?.map((a) => a.carton_id).filter(Boolean) ?? []

  let query = supabase
    .from('cartones')
    .select('id, numero')
    .eq('playlist_id', playlistId)
    .order('numero', { ascending: true })

  if (idsAsignados.length > 0) {
    query = query.not('id', 'in', `(${idsAsignados.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getMaxOrden(playlistId) {
  const { data } = await supabase
    .from('invitados')
    .select('orden')
    .eq('playlist_id', playlistId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.orden ?? -1
}

export async function insertInvitadosBatch(lista, playlistId) {
  await supabaseAdmin.from('invitados').delete().eq('playlist_id', playlistId)

  const rows = lista.map((inv, i) => ({
    nombre: inv.nombre,
    apellido: inv.apellido,
    nombre_normalizado: normalizarStr(`${inv.nombre} ${inv.apellido}`),
    playlist_id: playlistId,
    orden: i,
  }))

  const BATCH_SIZE = 50
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabaseAdmin.from('invitados').insert(rows.slice(i, i + BATCH_SIZE))
    if (error) throw error
  }
}

export async function preasignarCartones(playlistId, onProgress) {
  const { data: invitados, error: e1 } = await supabaseAdmin
    .from('invitados')
    .select('id, nombre, apellido')
    .eq('playlist_id', playlistId)
    .is('carton_id', null)
    .order('orden', { ascending: true })
  if (e1) throw e1

  const sobrantes = await getCartonesSobrantes(playlistId)

  if (sobrantes.length < invitados.length) {
    throw new Error(
      `Faltan cartones: hay ${invitados.length} invitados sin asignar y solo ${sobrantes.length} disponibles`
    )
  }

  for (let i = 0; i < invitados.length; i++) {
    const inv = invitados[i]
    const carton = sobrantes[i]
    await supabaseAdmin.from('invitados').update({ carton_id: carton.id }).eq('id', inv.id)
    await supabaseAdmin
      .from('cartones')
      .update({ nombre_invitado: `${inv.nombre} ${inv.apellido}` })
      .eq('id', carton.id)
    onProgress?.(i + 1, invitados.length)
  }

  return { asignados: invitados.length, sobrantes: sobrantes.length - invitados.length }
}

export async function cambiarCarton(invitadoId, nuevoCartonId, nombre, apellido, viejoCartonId) {
  if (viejoCartonId) {
    await supabaseAdmin.from('cartones').update({ nombre_invitado: null }).eq('id', viejoCartonId)
  }
  await supabaseAdmin.from('invitados').update({ carton_id: nuevoCartonId }).eq('id', invitadoId)
  await supabaseAdmin
    .from('cartones')
    .update({ nombre_invitado: `${nombre} ${apellido}` })
    .eq('id', nuevoCartonId)
}

export async function agregarInvitado(nombre, apellido, playlistId, cartonId) {
  const orden = (await getMaxOrden(playlistId)) + 1
  const { error } = await supabaseAdmin.from('invitados').insert({
    nombre,
    apellido,
    nombre_normalizado: normalizarStr(`${nombre} ${apellido}`),
    playlist_id: playlistId,
    carton_id: cartonId || null,
    orden,
  })
  if (error) throw error
  if (cartonId) {
    await supabaseAdmin
      .from('cartones')
      .update({ nombre_invitado: `${nombre} ${apellido}` })
      .eq('id', cartonId)
  }
}

export async function eliminarInvitado(invitadoId, cartonId) {
  if (cartonId) {
    await supabaseAdmin.from('cartones').update({ nombre_invitado: null }).eq('id', cartonId)
  }
  const { error } = await supabaseAdmin.from('invitados').delete().eq('id', invitadoId)
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
