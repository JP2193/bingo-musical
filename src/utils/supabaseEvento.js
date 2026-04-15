import { supabase } from '../lib/supabase'
import { generateAllUniqueCards } from './bingo'

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user.id
}

export function normalizarStr(str = '') {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

// ─── Playlists ─────────────────────────────────────────────────────────────────

export async function getPlaylists() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('playlists')
    .select('id, name, tracks')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

async function getTracksDePlaylistLocal(playlistId) {
  const { data, error } = await supabase
    .from('playlists')
    .select('tracks')
    .eq('id', playlistId)
    .single()
  if (error) throw error
  return data?.tracks ?? []
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export async function getEventos() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('eventos')
    .select('id, nombre, playlist_id, cols, rows, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function crearEvento(nombre) {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('eventos')
    .insert({ user_id: userId, nombre })
    .select('id, nombre, playlist_id, cols, rows, created_at')
    .single()
  if (error) throw error
  return data
}

export async function actualizarEvento(id, campos) {
  const { error } = await supabase
    .from('eventos')
    .update(campos)
    .eq('id', id)
  if (error) throw error
}

export async function eliminarEvento(id) {
  // Limpiar invitados/cartones en cascada via ON DELETE CASCADE en DB
  const { error } = await supabase
    .from('eventos')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getEventoDetalle(id) {
  const { data, error } = await supabase
    .from('eventos')
    .select('id, nombre, playlist_id, cols, rows, created_at')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── Cartones ─────────────────────────────────────────────────────────────────

export async function deleteCartonesByEvento(eventoId) {
  const { error: e1 } = await supabase
    .from('invitados')
    .update({ carton_id: null, asignado_at: null, sesion_valida: false })
    .eq('evento_id', eventoId)
  if (e1) throw e1

  const { error: e2 } = await supabase
    .from('cartones')
    .delete()
    .eq('evento_id', eventoId)
  if (e2) throw e2
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

export async function generarCartones(eventoId, cols, rows, cantidad, playlistId, onProgress) {
  const tracks = await getTracksDePlaylistLocal(playlistId)
  const totalCeldas = cols * rows
  if (tracks.length < totalCeldas) {
    throw new Error(`La playlist tiene ${tracks.length} canciones pero el cartón necesita ${totalCeldas}.`)
  }

  const cards = generateAllUniqueCards(tracks, cols, rows, cantidad)

  await deleteCartonesByEvento(eventoId)

  // Guardar cols/rows en el evento
  await actualizarEvento(eventoId, { cols, rows, playlist_id: playlistId })

  const rowsData = cards.map((trackIds, i) => ({
    numero: i + 1,
    evento_id: eventoId,
    track_ids: trackIds,
  }))

  await insertCartonesBatch(rowsData, onProgress)
  return { total: cantidad }
}

export async function getMaxNumeroCarton(eventoId) {
  const { data } = await supabase
    .from('cartones')
    .select('numero')
    .eq('evento_id', eventoId)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.numero ?? 0
}

export async function generarCartonesAdicionales(eventoId, cantidad, onProgress) {
  const evento = await getEventoDetalle(eventoId)
  if (!evento.playlist_id) throw new Error('El evento no tiene playlist configurada.')

  const tracks = await getTracksDePlaylistLocal(evento.playlist_id)
  const totalCeldas = evento.cols * evento.rows
  if (tracks.length < totalCeldas) {
    throw new Error(`La playlist tiene ${tracks.length} canciones pero el cartón necesita ${totalCeldas}.`)
  }

  const lastNumero = await getMaxNumeroCarton(eventoId)
  const cards = generateAllUniqueCards(tracks, evento.cols, evento.rows, cantidad)

  const rowsData = cards.map((trackIds, i) => ({
    numero: lastNumero + i + 1,
    evento_id: eventoId,
    track_ids: trackIds,
  }))

  await insertCartonesBatch(rowsData, onProgress)
  return { generados: cantidad, desde: lastNumero + 1, hasta: lastNumero + cantidad }
}

export async function getEstadoEvento(eventoId) {
  const [{ data: cartones, error: e1 }, { data: invitados, error: e2 }] = await Promise.all([
    supabase
      .from('cartones')
      .select('id, numero')
      .eq('evento_id', eventoId),
    supabase
      .from('invitados')
      .select('id, nombre, apellido, carton_id, asignado_at, cartones(numero)')
      .eq('evento_id', eventoId)
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

export async function getCancionesCantadas(eventoId) {
  const { data, error } = await supabase
    .from('canciones_cantadas')
    .select('track_id')
    .eq('evento_id', eventoId)
  if (error) throw error
  return new Set(data.map((c) => c.track_id))
}

export async function activarCancion(eventoId, trackId) {
  const { error } = await supabase
    .from('canciones_cantadas')
    .insert({ evento_id: eventoId, track_id: trackId })
  if (error) throw error
}

export async function desactivarCancion(eventoId, trackId) {
  const { error } = await supabase
    .from('canciones_cantadas')
    .delete()
    .eq('evento_id', eventoId)
    .eq('track_id', trackId)
  if (error) throw error
}

export async function resetCancionesCantadas(eventoId) {
  const { error } = await supabase
    .from('canciones_cantadas')
    .delete()
    .eq('evento_id', eventoId)
  if (error) throw error
}

// ─── Invitados ────────────────────────────────────────────────────────────────

export async function getInvitados(eventoId) {
  const { data, error } = await supabase
    .from('invitados')
    .select('id, nombre, apellido, carton_id, asignado_at, oculto, cartones(numero)')
    .eq('evento_id', eventoId)
    .order('orden', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function getCartonesSobrantes(eventoId) {
  const { data: asignados } = await supabase
    .from('invitados')
    .select('carton_id')
    .eq('evento_id', eventoId)
    .not('carton_id', 'is', null)

  const idsAsignados = asignados?.map((a) => a.carton_id).filter(Boolean) ?? []

  let query = supabase
    .from('cartones')
    .select('id, numero')
    .eq('evento_id', eventoId)
    .order('numero', { ascending: true })

  if (idsAsignados.length > 0) {
    query = query.not('id', 'in', `(${idsAsignados.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getMaxOrden(eventoId) {
  const { data } = await supabase
    .from('invitados')
    .select('orden')
    .eq('evento_id', eventoId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.orden ?? -1
}

export async function insertInvitadosBatch(lista, eventoId) {
  const userId = await getUserId()
  await supabase.from('invitados').delete().eq('evento_id', eventoId)

  const rows = lista.map((inv, i) => ({
    user_id: userId,
    nombre: inv.nombre,
    apellido: inv.apellido,
    nombre_normalizado: normalizarStr(`${inv.nombre} ${inv.apellido}`),
    evento_id: eventoId,
    orden: i,
  }))

  const BATCH_SIZE = 50
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabase.from('invitados').insert(rows.slice(i, i + BATCH_SIZE))
    if (error) throw error
  }
}

export async function preasignarCartones(eventoId, onProgress) {
  const { data: invitados, error: e1 } = await supabase
    .from('invitados')
    .select('id, nombre, apellido')
    .eq('evento_id', eventoId)
    .is('carton_id', null)
    .order('orden', { ascending: true })
  if (e1) throw e1

  const sobrantes = await getCartonesSobrantes(eventoId)

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

export async function agregarInvitado(nombre, apellido, eventoId, cartonId) {
  const userId = await getUserId()
  const orden = (await getMaxOrden(eventoId)) + 1
  const { error } = await supabase.from('invitados').insert({
    user_id: userId,
    nombre,
    apellido,
    nombre_normalizado: normalizarStr(`${nombre} ${apellido}`),
    evento_id: eventoId,
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

export async function actualizarNombreInvitado(id, nombre, apellido) {
  const { error } = await supabase
    .from('invitados')
    .update({
      nombre,
      apellido,
      nombre_normalizado: normalizarStr(`${nombre} ${apellido}`),
    })
    .eq('id', id)
  if (error) throw error
}

export async function toggleOcultoInvitado(id, oculto) {
  const { error } = await supabase
    .from('invitados')
    .update({ oculto })
    .eq('id', id)
  if (error) throw error
}

// ─── Ranking / Simulación ─────────────────────────────────────────────────────

async function fetchDatosCartones(eventoId, filtroColumna) {
  const [{ data: cantadas, error: e1 }, { data: invitados, error: e2 }] = await Promise.all([
    supabase.from('canciones_cantadas').select('track_id').eq('evento_id', eventoId),
    supabase
      .from('invitados')
      .select('nombre, apellido, cartones(numero, track_ids)')
      .eq('evento_id', eventoId)
      .not(filtroColumna, 'is', null),
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

export async function getRankingCartones(eventoId) {
  return fetchDatosCartones(eventoId, 'asignado_at')
}

export async function getSimulacionData(eventoId) {
  return fetchDatosCartones(eventoId, 'carton_id')
}
