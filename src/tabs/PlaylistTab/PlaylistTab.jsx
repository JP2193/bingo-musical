import { useEffect, useRef, useState } from 'react'
import {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  parseImportedTracks,
} from '../../utils/supabasePlaylists'
import styles from './PlaylistTab.module.css'

function emptyTrack() {
  return { id: crypto.randomUUID(), name: '', artist: '' }
}

function initialTracks() {
  return Array.from({ length: 10 }, emptyTrack)
}

export function PlaylistTab() {
  const [playlists, setPlaylists] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  // Draft del editor
  const [draftName, setDraftName] = useState('')
  const [draftTracks, setDraftTracks] = useState(initialTracks())
  const [isNew, setIsNew] = useState(false)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const [saveAsOpen, setSaveAsOpen] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')

  const [confirmDelete, setConfirmDelete] = useState(false)

  const importRef = useRef(null)

  // ── Cargar playlists al montar ─────────────────────────────────────────────
  useEffect(() => {
    getPlaylists()
      .then(setPlaylists)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // ── Seleccionar playlist ───────────────────────────────────────────────────
  function selectPlaylist(pl) {
    setSelectedId(pl.id)
    setDraftName(pl.name)
    setDraftTracks(pl.tracks?.length ? pl.tracks : initialTracks())
    setIsNew(false)
    setError(null)
    setSuccessMsg(null)
    setSaveAsOpen(false)
    setConfirmDelete(false)
  }

  // ── Crear nueva ────────────────────────────────────────────────────────────
  function handleNew() {
    setSelectedId(null)
    setDraftName('')
    setDraftTracks(initialTracks())
    setIsNew(true)
    setError(null)
    setSuccessMsg(null)
    setSaveAsOpen(false)
    setConfirmDelete(false)
  }

  // ── Editar track ───────────────────────────────────────────────────────────
  function updateTrack(index, field, value) {
    setDraftTracks((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function removeTrack(index) {
    setDraftTracks((prev) => prev.filter((_, i) => i !== index))
  }

  function addTrack() {
    setDraftTracks((prev) => [...prev, emptyTrack()])
  }

  // ── Guardar ────────────────────────────────────────────────────────────────
  function cleanTracks(tracks) {
    return tracks.filter((t) => t.name.trim())
  }

  async function handleSave() {
    const name = draftName.trim()
    if (!name) { setError('Ponele un nombre a la playlist.'); return }
    const tracks = cleanTracks(draftTracks)
    if (tracks.length === 0) { setError('Agregá al menos una canción.'); return }

    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        const created = await createPlaylist(name, tracks)
        setPlaylists((prev) => [...prev, created])
        setSelectedId(created.id)
        setDraftTracks(tracks)
        setIsNew(false)
      } else {
        await updatePlaylist(selectedId, name, tracks)
        setPlaylists((prev) =>
          prev.map((p) => p.id === selectedId ? { ...p, name, tracks } : p)
        )
        setDraftTracks(tracks)
      }
      showSuccess('Guardado.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Guardar como nueva ─────────────────────────────────────────────────────
  async function handleSaveAs() {
    const name = saveAsName.trim()
    if (!name) return
    const tracks = cleanTracks(draftTracks)
    if (tracks.length === 0) { setError('Agregá al menos una canción.'); return }

    setSaving(true)
    setError(null)
    try {
      const created = await createPlaylist(name, tracks)
      setPlaylists((prev) => [...prev, created])
      setSelectedId(created.id)
      setDraftName(name)
      setDraftTracks(tracks)
      setIsNew(false)
      setSaveAsOpen(false)
      setSaveAsName('')
      showSuccess('Guardado como nueva playlist.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ───────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!selectedId) return
    try {
      await deletePlaylist(selectedId)
      setPlaylists((prev) => prev.filter((p) => p.id !== selectedId))
      setSelectedId(null)
      setDraftName('')
      setDraftTracks(initialTracks())
      setIsNew(false)
      setConfirmDelete(false)
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Importar CSV / JSON ────────────────────────────────────────────────────
  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const text = await file.text()
      const type = file.name.endsWith('.json') ? 'json' : 'csv'
      const imported = parseImportedTracks(text, type)
      if (imported.length === 0) { setError('No se encontraron canciones válidas en el archivo.'); return }
      setDraftTracks((prev) => {
        // Eliminar filas completamente vacías del draft antes de agregar
        const existing = prev.filter((t) => t.name.trim() || t.artist.trim())
        return [...existing, ...imported]
      })
      showSuccess(`${imported.length} canciones importadas.`)
    } catch {
      setError('Archivo inválido. Verificá el formato CSV o JSON.')
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 2500)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasEditor = isNew || selectedId !== null

  return (
    <div className={styles.container}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newBtn} onClick={handleNew}>+ Nueva playlist</button>
        </div>
        <div className={styles.playlistList}>
          {loading ? (
            <div style={{ padding: '16px', color: 'var(--muted)', fontSize: 13 }}>Cargando...</div>
          ) : playlists.map((pl) => (
            <div
              key={pl.id}
              className={`${styles.playlistItem} ${pl.id === selectedId ? styles.active : ''}`}
              onClick={() => selectPlaylist(pl)}
            >
              <div className={styles.playlistItemInfo}>
                <div className={styles.playlistItemName}>{pl.name}</div>
                <div className={styles.playlistItemMeta}>{pl.tracks?.length ?? 0} canciones</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Editor ── */}
      <div className={styles.editor}>
        {!hasEditor ? (
          <div className={styles.empty}>
            <span style={{ fontSize: 14, color: 'var(--muted)' }}>
              {playlists.length === 0
                ? 'No tenés playlists todavía.'
                : 'Seleccioná una playlist o creá una nueva.'}
            </span>
            <button className={styles.emptyNewBtn} onClick={handleNew}>+ Crear playlist</button>
          </div>
        ) : (
          <>
            {/* Banner error / success */}
            {error && (
              <div className={`${styles.banner} ${styles.bannerError}`}>
                {error}
                <button style={{ marginLeft: 8 }} onClick={() => setError(null)}>✕</button>
              </div>
            )}
            {successMsg && (
              <div className={`${styles.banner} ${styles.bannerSuccess}`}>{successMsg}</div>
            )}

            {/* Confirm delete */}
            {confirmDelete && (
              <div className={styles.confirmRow}>
                <span>¿Eliminar "{draftName}"? Esta acción no se puede deshacer.</span>
                <button className={styles.confirmDanger} onClick={handleDelete}>Eliminar</button>
                <button className={styles.confirmCancel} onClick={() => setConfirmDelete(false)}>Cancelar</button>
              </div>
            )}

            {/* Save-as form */}
            {saveAsOpen && (
              <div className={styles.saveAsRow}>
                <input
                  className={styles.saveAsInput}
                  placeholder="Nombre de la nueva playlist"
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveAs()
                    if (e.key === 'Escape') setSaveAsOpen(false)
                  }}
                  autoFocus
                />
                <button className={styles.saveAsConfirm} onClick={handleSaveAs} disabled={saving}>Guardar</button>
                <button className={styles.saveAsCancel} onClick={() => setSaveAsOpen(false)}>✕</button>
              </div>
            )}

            {/* Header del editor */}
            <div className={styles.editorHeader}>
              <input
                className={styles.nameInput}
                placeholder="Nombre de la playlist"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
              />
              <div className={styles.headerActions}>
                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                {!isNew && (
                  <button
                    className={styles.saveAsBtn}
                    onClick={() => { setSaveAsOpen(true); setSaveAsName(draftName) }}
                  >
                    Guardar como nueva
                  </button>
                )}
                {!isNew && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* Lista de tracks */}
            <div className={styles.trackListWrapper}>
              <div className={styles.trackListHeader}>
                <span>#</span>
                <span>Canción</span>
                <span>Artista</span>
                <span />
              </div>
              {draftTracks.map((track, i) => (
                <div key={track.id} className={styles.trackRow}>
                  <span className={styles.trackIdx}>{i + 1}</span>
                  <input
                    className={styles.trackInput}
                    value={track.name}
                    onChange={(e) => updateTrack(i, 'name', e.target.value)}
                    placeholder="Canción"
                  />
                  <input
                    className={styles.trackInput}
                    value={track.artist}
                    onChange={(e) => updateTrack(i, 'artist', e.target.value)}
                    placeholder="Artista"
                  />
                  <button
                    className={styles.removeTrackBtn}
                    onClick={() => removeTrack(i)}
                    title="Eliminar fila"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className={styles.editorFooter}>
              <button className={styles.addBtn} onClick={addTrack}>+ Añadir canción</button>
              <button className={styles.importBtn} onClick={() => importRef.current?.click()}>
                ↑ Importar temas (CSV / JSON)
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".csv,.json"
                style={{ display: 'none' }}
                onChange={handleImport}
              />
              <span className={styles.footerMeta}>
                {cleanTracks(draftTracks).length} canciones
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
