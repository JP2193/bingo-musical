import { supabase } from '../lib/supabase'

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user.id
}

function normalizarStr(str = '') {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// ─── Playlists ─────────────────────────────────────────────────────────────────

export async function getPlaylists() {
  const { data, error } = await supabase
    .from('playlists')
    .select('id, name, tracks')
    .order('saved_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

// ─── Config: playlist activa ──────────────────────────────────────────────────

export async function getPlaylistActiva() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ''
  const { data } = await supabase
    .from('config')
    .select('value')
    .eq('user_id', user.id)
    .eq('key', 'playlist_activa')
    .maybeSingle()
  return data?.value ?? ''
}

export async function setPlaylistActiva(playlistId) {
  const userId = await getUserId()
  const { error } = await supabase
    .from('config')
    .upsert(
      { user_id: userId, key: 'playlist_activa', value: playlistId, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    )
  if (error) throw error
}

// ─── Cartones ─────────────────────────────────────────────────────────────────

export async function deleteCartonesByPlaylist(playlistId) {
  const { error } = await supabase
    .from('cartones')
    .delete()
    .eq('playlist_id', playlistId)
  if (error) throw error
}

export async function insertCartonesBatch(cartones, onProgress) {
  const userId = await getUserId()
  const BATCH_SIZE = 50
  let insertados = 0

  const rows = cartones.map((c) => ({ ...c, user_id: userId }))

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('cartones').insert(batch)
    if (error) throw error
    insertados += batch.length
    onProgress?.(insertados, rows.length)
  }
}

export async function getEstadoEvento(playlistId) {
  const [{ data: cartones, error: e1 }, { data: invitados, error: e2 }] = await Promise.all([
    supabase
      .from('cartones')
      .select('id, numero')
      .eq('playlist_id', playlistId),
    supabase
      .from('invitados')
      .select('id, nombre, apellido, carton_id, asignado_at, cartones(numero)')
      .eq('playlist_id', playlistId)
      .not('asignado_at', 'is', null)
      .order('asignado_at', { ascending: true }),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const total = cartones.length
  const entregados = invitados.length
  return {
    total,
    entregados,
    disponibles: total - entregados,
    lista: invitados.map((inv) => ({
      id: inv.id,
      numero: inv.cartones?.numero ?? '?',
      nombre_invitado: `${inv.nombre} ${inv.apellido}`,
      entregado_at: inv.asignado_at,
    })),
  }
}

export async function getCartonesTrackIds(cartonIds) {
  const { data, error } = await supabase
    .from('cartones')
    .select('id, numero, track_ids')
    .in('id', cartonIds)
  if (error) throw error
  return data ?? []
}

// ─── Canciones cantadas ───────────────────────────────────────────────────────

export async function getCancionesCantadas(playlistId) {
  const { data, error } = await supabase
    .from('canciones_cantadas')
    .select('track_id')
    .eq('playlist_id', playlistId)
  if (error) throw error
  return new Set(data.map((c) => c.track_id))
}

export async function activarCancion(playlistId, trackId) {
  const { error } = await supabase
    .from('canciones_cantadas')
    .insert({ playlist_id: playlistId, track_id: trackId })
  if (error) throw error
}

export async function desactivarCancion(playlistId, trackId) {
  const { error } = await supabase
    .from('canciones_cantadas')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)
  if (error) throw error
}

export async function resetCancionesCantadas(playlistId) {
  const { error } = await supabase
    .from('canciones_cantadas')
    .delete()
    .eq('playlist_id', playlistId)
  if (error) throw error
}

// ─── Invitados ────────────────────────────────────────────────────────────────

export async function getInvitados(playlistId) {
  const { data, error } = await supabase
    .from('invitados')
    .select('id, nombre, apellido, carton_id, asignado_at, oculto, cartones(numero)')
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
  const userId = await getUserId()
  await supabase.from('invitados').delete().eq('playlist_id', playlistId)

  const rows = lista.map((inv, i) => ({
    user_id: userId,
    nombre: inv.nombre,
    apellido: inv.apellido,
    nombre_normalizado: normalizarStr(`${inv.nombre} ${inv.apellido}`),
    playlist_id: playlistId,
    orden: i,
  }))

  const BATCH_SIZE = 50
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabase.from('invitados').insert(rows.slice(i, i + BATCH_SIZE))
    if (error) throw error
  }
}

export async function preasignarCartones(playlistId, onProgress) {
  const { data: invitados, error: e1 } = await supabase
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
    await supabase.from('invitados').update({ carton_id: carton.id }).eq('id', inv.id)
    await supabase
      .from('cartones')
      .update({ nombre_invitado: `${inv.nombre} ${inv.apellido}` })
      .eq('id', carton.id)
    onProgress?.(i + 1, invitados.length)
  }

  return { asignados: invitados.length, sobrantes: sobrantes.length - invitados.length }
}

export async function cambiarCarton(invitadoId, nuevoCartonId, nombre, apellido, viejoCartonId) {
  if (viejoCartonId) {
    await supabase.from('cartones').update({ nombre_invitado: null }).eq('id', viejoCartonId)
  }
  await supabase.from('invitados').update({ carton_id: nuevoCartonId }).eq('id', invitadoId)
  await supabase
    .from('cartones')
    .update({ nombre_invitado: `${nombre} ${apellido}` })
    .eq('id', nuevoCartonId)
}

export async function agregarInvitado(nombre, apellido, playlistId, cartonId) {
  const userId = await getUserId()
  const orden = (await getMaxOrden(playlistId)) + 1
  const { error } = await supabase.from('invitados').insert({
    user_id: userId,
    nombre,
    apellido,
    nombre_normalizado: normalizarStr(`${nombre} ${apellido}`),
    playlist_id: playlistId,
    carton_id: cartonId || null,
    orden,
  })
  if (error) throw error
  if (cartonId) {
    await supabase
      .from('cartones')
      .update({ nombre_invitado: `${nombre} ${apellido}` })
      .eq('id', cartonId)
  }
}

export async function resetearAsignadoAt(invitadoId) {
  const { error } = await supabase
    .from('invitados')
    .update({ asignado_at: null, sesion_valida: false })
    .eq('id', invitadoId)
  if (error) throw error
}

export async function eliminarInvitado(invitadoId, cartonId) {
  if (cartonId) {
    await supabase.from('cartones').update({ nombre_invitado: null }).eq('id', cartonId)
  }
  const { error } = await supabase.from('invitados').delete().eq('id', invitadoId)
  if (error) throw error
}

export async function eliminarInvitadosBatch(invitadoIds, cartonIds) {
  if (cartonIds.length > 0) {
    await supabase.from('cartones').update({ nombre_invitado: null }).in('id', cartonIds)
  }
  await supabase
    .from('invitados')
    .update({ carton_id: null, asignado_at: null, sesion_valida: false })
    .in('id', invitadoIds)
  await supabase.from('invitados').delete().in('id', invitadoIds)
}

export async function desasignarCartones(invitadoIds) {
  const { error } = await supabase
    .from('invitados')
    .update({ carton_id: null, asignado_at: null, sesion_valida: false })
    .in('id', invitadoIds)
  if (error) throw error
}

export async function toggleOcultoInvitado(id, oculto) {
  const { error } = await supabase
    .from('invitados')
    .update({ oculto })
    .eq('id', id)
  if (error) throw error
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

export async function getRankingCartones(playlistId) {
  const [{ data: cantadas, error: e1 }, { data: invitados, error: e2 }] = await Promise.all([
    supabase.from('canciones_cantadas').select('track_id').eq('playlist_id', playlistId),
    supabase
      .from('invitados')
      .select('nombre, apellido, cartones(numero, track_ids)')
      .eq('playlist_id', playlistId)
      .not('asignado_at', 'is', null),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const cantadasSet = new Set(cantadas.map((c) => c.track_id))
  return invitados
    .filter((inv) => inv.cartones?.track_ids)
    .map((inv) => {
      const tachadas = inv.cartones.track_ids.filter((id) => cantadasSet.has(id)).length
      return {
        numero: inv.cartones.numero,
        nombre: `${inv.nombre} ${inv.apellido}`,
        tachadas,
        total: inv.cartones.track_ids.length,
        pct: Math.round((tachadas / inv.cartones.track_ids.length) * 100),
      }
    })
    .sort((a, b) => b.tachadas - a.tachadas)
}

// ─── Simulación ───────────────────────────────────────────────────────────────
// Igual que ranking pero incluye todos los invitados con cartón asignado
// sin importar si abrieron sesión (asignado_at).

export async function getSimulacionData(playlistId) {
  const [{ data: cantadas, error: e1 }, { data: invitados, error: e2 }] = await Promise.all([
    supabase.from('canciones_cantadas').select('track_id').eq('playlist_id', playlistId),
    supabase
      .from('invitados')
      .select('nombre, apellido, cartones(numero, track_ids)')
      .eq('playlist_id', playlistId)
      .not('carton_id', 'is', null),
  ])
  if (e1) throw e1
  if (e2) throw e2

  const cantadasSet = new Set(cantadas.map((c) => c.track_id))
  return invitados
    .filter((inv) => inv.cartones?.track_ids)
    .map((inv) => {
      const tachadas = inv.cartones.track_ids.filter((id) => cantadasSet.has(id)).length
      return {
        numero: inv.cartones.numero,
        nombre: `${inv.nombre} ${inv.apellido}`,
        tachadas,
        total: inv.cartones.track_ids.length,
        pct: Math.round((tachadas / inv.cartones.track_ids.length) * 100),
      }
    })
    .sort((a, b) => b.tachadas - a.tachadas)
}
