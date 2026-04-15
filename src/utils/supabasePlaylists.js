import { supabase } from '../lib/supabase'

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user.id
}

export async function getPlaylists() {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('playlists')
    .select('id, name, tracks, saved_at')
    .eq('user_id', userId)
    .order('saved_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

function handleSupabaseError(error, name) {
  if (error.code === '23505') {
    throw new Error(`Ya tenés una playlist llamada "${name}". Elegí otro nombre.`)
  }
  throw error
}

export async function createPlaylist(name, tracks) {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('playlists')
    .insert({ user_id: userId, name: name.trim(), tracks })
    .select('id, name, tracks, saved_at')
    .single()
  if (error) handleSupabaseError(error, name)
  return data
}

export async function updatePlaylist(id, name, tracks) {
  const userId = await getUserId()
  const { error } = await supabase
    .from('playlists')
    .update({ name: name.trim(), tracks })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) handleSupabaseError(error, name)
}

export async function renamePlaylist(id, name) {
  const userId = await getUserId()
  const { error } = await supabase
    .from('playlists')
    .update({ name: name.trim() })
    .eq('id', id)
    .eq('user_id', userId)
  if (error) handleSupabaseError(error, name)
}

export async function deletePlaylist(id) {
  const userId = await getUserId()
  const { error } = await supabase
    .from('playlists')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

/**
 * Parsea un CSV o JSON y retorna tracks con UUIDs.
 * CSV: líneas con "cancion,artista" o "song,artist" (header opcional)
 * JSON: array de { cancion, artista } o { name, artist } o { song, artist }
 */
export function parseImportedTracks(text, type) {
  if (type === 'json') {
    const raw = JSON.parse(text)
    if (!Array.isArray(raw)) throw new Error('El JSON debe ser un array')
    return raw.map((r) => ({
      id: crypto.randomUUID(),
      name: (r.cancion ?? r.name ?? r.song ?? '').trim(),
      artist: (r.artista ?? r.artist ?? '').trim(),
    })).filter((t) => t.name)
  }

  // CSV
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const tracks = []
  for (const line of lines) {
    const sep = line.includes(';') ? ';' : ','
    const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ''))
    const name = parts[0] ?? ''
    const artist = parts[1] ?? ''
    // Saltar header si coincide con palabras clave
    if (['cancion', 'song', 'name', 'titulo'].includes(name.toLowerCase())) continue
    if (name) tracks.push({ id: crypto.randomUUID(), name, artist })
  }
  return tracks
}
