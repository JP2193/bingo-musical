import { supabase } from '../lib/supabase'

const MAX = 10

// Genera (o recupera) un UUID estable por dispositivo/navegador
function getDeviceId() {
  let id = localStorage.getItem('bingo_device_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('bingo_device_id', id)
  }
  return id
}

export function useSavedPlaylists() {
  const deviceId = getDeviceId()

  async function getAll() {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('device_id', deviceId)
      .order('saved_at', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async function save(name, playlist, tracks) {
    const all = await getAll()
    if (all.length >= MAX) {
      throw new Error(`Ya tenés ${MAX} listas guardadas. Eliminá alguna para liberar espacio.`)
    }
    const { error } = await supabase.from('playlists').insert({
      device_id: deviceId,
      name: (name ?? '').trim() || playlist.name,
      playlist,
      tracks,
    })
    if (error) throw error
    return await getAll()
  }

  async function rename(id, newName) {
    const trimmed = (newName ?? '').trim()
    if (!trimmed) return getAll()
    const { error } = await supabase
      .from('playlists')
      .update({ name: trimmed })
      .eq('id', id)
      .eq('device_id', deviceId)
    if (error) throw error
    return await getAll()
  }

  async function remove(id) {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', id)
      .eq('device_id', deviceId)
    if (error) throw error
    return await getAll()
  }

  // Recibe las listas ya cargadas en estado (evita un fetch extra)
  function exportJSON(entries) {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bingo-listas.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importJSON(file) {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('Formato inválido')
    const limited = data.slice(0, MAX)

    // Reemplazar todas las listas del dispositivo con las importadas
    await supabase.from('playlists').delete().eq('device_id', deviceId)

    const rows = limited.map((e) => ({
      device_id: deviceId,
      name: e.name,
      playlist: e.playlist,
      tracks: e.tracks,
    }))
    const { error } = await supabase.from('playlists').insert(rows)
    if (error) throw error
    return await getAll()
  }

  return { getAll, save, rename, remove, exportJSON, importJSON }
}
