import { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../../store/AppContext'
import { useSpotifyAuth, getStoredToken } from '../../hooks/useSpotifyAuth'
import { useSpotifyAPI } from '../../hooks/useSpotifyAPI'
import { useSavedPlaylists } from '../../hooks/useSavedPlaylists'
import { extractPlaylistId } from '../../utils/spotify'
import { ErrorBanner } from '../../components/UI/ErrorBanner'
import styles from './SpotifyTab.module.css'

const GRID_OPTIONS = [
  { label: '3×3', cols: 3, rows: 3 },
  { label: '3×4', cols: 3, rows: 4 },
  { label: '4×4', cols: 4, rows: 4 },
  { label: '5×5', cols: 5, rows: 5 },
]

export function SpotifyTab({ onGoToCalibrator, homeSignal = 0 }) {
  const { state, setToken, setPlaylist, setTracks, setGridSize, resetPlaylist } = useAppContext()
  const { spotifyToken, playlist, tracks, gridSize } = state

  const { redirectToSpotifyAuth, handleCallback } = useSpotifyAuth()
  const useSP = useSavedPlaylists()

  const importInputRef = useRef(null)

  const [playlistInput, setPlaylistInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Modo invitado (sin Spotify)
  const [guestMode, setGuestMode] = useState(false)

  // Saved playlists
  const [savedPlaylists, setSavedPlaylists] = useState([])
  const [saveForm, setSaveForm] = useState(false)
  const [saveName, setSaveName] = useState('')

  // Guest: IDs ocultos de la vista (solo local, no borra de DB)
  const [hiddenGuestIds, setHiddenGuestIds] = useState([])

  // Nombre de la entrada seleccionada en modo invitado (nombre personalizado, no el de Spotify)
  const [selectedEntryName, setSelectedEntryName] = useState(null)

  // Rename inline
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  // Save as new playlist (desde el editor de tracks)
  const [saveAsForm, setSaveAsForm] = useState(false)
  const [saveAsName, setSaveAsName] = useState('')

  // Track editor draft
  const [draftTracks, setDraftTracks] = useState([])
  const [isDirty, setIsDirty] = useState(false)
  const [trackSaved, setTrackSaved] = useState(false)

  // Sincronizar draft cuando cambia la playlist
  useEffect(() => {
    setDraftTracks(tracks)
    setIsDirty(false)
    setTrackSaved(false)
  }, [tracks])

  // Volver a pantalla de inicio cuando el logo es clickeado
  useEffect(() => {
    if (homeSignal > 0) {
      setGuestMode(false)
      resetPlaylist()
      setError(null)
      setSaveForm(false)
      setSaveAsForm(false)
      setRenamingId(null)
      setSelectedEntryName(null)
    }
  }, [homeSignal])

  // Verificar token almacenado al montar
  useEffect(() => {
    const stored = getStoredToken()
    if (stored && !spotifyToken) {
      setToken(stored, Number(sessionStorage.getItem('token_expiry')))
    }
  }, [])

  // Interceptar callback de OAuth
  useEffect(() => {
    if (window.location.search.includes('code=')) {
      handleCallback()
    }
  }, [])

  // Cargar listas guardadas desde Supabase
  useEffect(() => {
    useSP.getAll()
      .then(setSavedPlaylists)
      .catch(() => {})
  }, [])

  const token = spotifyToken ?? getStoredToken()
  const { fetchPlaylist } = useSpotifyAPI(token)

  function disconnect() {
    sessionStorage.removeItem('spotify_token')
    sessionStorage.removeItem('token_expiry')
    sessionStorage.removeItem('pkce_verifier')
    setToken(null, null)
  }

  async function loadPlaylist() {
    setError(null)
    const id = extractPlaylistId(playlistInput)
    if (!id) {
      setError('Formato inválido. Pegá una URL como: open.spotify.com/playlist/...')
      return
    }

    setLoading(true)
    try {
      const { meta, tracks: loaded } = await fetchPlaylist(id)
      if (loaded.length === 0) {
        const hint = meta.totalTracks > 0
          ? `La playlist tiene ${meta.totalTracks} canciones pero no se pudieron cargar.`
          : 'La playlist no tiene canciones accesibles.'
        setError(hint)
      } else {
        setPlaylist(meta)
        setTracks(loaded)
      }
    } catch (err) {
      if (err.message === 'TOKEN_EXPIRED') {
        setError('Tu sesión de Spotify expiró. Reconectando...')
        setTimeout(() => redirectToSpotifyAuth(), 1500)
      } else if (err.message === 'PLAYLIST_FORBIDDEN') {
        setError('Solo podés cargar playlists que vos creaste o en las que sos colaborador.')
      } else if (err.message.includes('404')) {
        setError('No encontramos esa playlist. Verificá que sea pública o tengas acceso.')
      } else {
        setError(`Error: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Guardar lista en Supabase
  async function handleSave() {
    if (!playlist) return
    try {
      const updated = await useSP.save(saveName, playlist, tracks)
      setSavedPlaylists(updated)
      setSaveForm(false)
      setSaveName('')
    } catch (err) {
      setError(err.message)
    }
  }

  // Eliminar lista de Supabase (solo Spotify mode)
  async function handleDelete(id) {
    try {
      const updated = await useSP.remove(id)
      setSavedPlaylists(updated)
    } catch {
      setError('Error al eliminar la lista.')
    }
  }

  // Ocultar lista de la vista (solo Guest mode, no borra de DB)
  function handleGuestHide(id) {
    setHiddenGuestIds((prev) => [...prev, id])
  }

  function handleLoadSaved(entry) {
    setPlaylist(entry.playlist)
    setTracks(entry.tracks)
    setSelectedEntryName(entry.name)
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const updated = await useSP.importJSON(file)
      setSavedPlaylists(updated)
    } catch {
      setError('Archivo inválido o corrupto.')
    }
    e.target.value = ''
  }

  // Editor de tracks
  function updateDraftTrack(index, field, value) {
    setDraftTracks((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
    setIsDirty(true)
  }

  function handleSaveTracks() {
    setTracks(draftTracks)
    setIsDirty(false)
    setTrackSaved(true)
    setTimeout(() => setTrackSaved(false), 2000)
  }

  async function handleRename(id) {
    if (!renameValue.trim()) { setRenamingId(null); return }
    try {
      const updated = await useSP.rename(id, renameValue)
      setSavedPlaylists(updated)
    } catch {
      setError('Error al renombrar la lista.')
    }
    setRenamingId(null)
  }

  async function handleSaveAs() {
    if (!playlist) return
    try {
      const updated = await useSP.save(saveAsName, playlist, draftTracks)
      setSavedPlaylists(updated)
      setSaveAsForm(false)
      setSaveAsName('')
    } catch (err) {
      setError(err.message)
    }
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const requiredTracks = gridSize.cols * gridSize.rows
  const notEnoughTracks = draftTracks.length > 0 && draftTracks.length < requiredTracks

  // ── Pantalla 1: Login ──────────────────────────────────────────────────────
  if (!token && !guestMode) {
    return (
      <div className={styles.loginScreen}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>Bingo Musical</h1>
          <button className={styles.ingresoBtn} onClick={() => setGuestMode(true)}>
            Ingresar
          </button>
          <button className={styles.spotifyBtn} onClick={redirectToSpotifyAuth}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            Conectar con Spotify
          </button>
        </div>
      </div>
    )
  }

  // ── Pantalla 2: Modo Invitado ──────────────────────────────────────────────
  if (guestMode && !token) {
    const guestList = savedPlaylists.filter((e) => !hiddenGuestIds.includes(e.id))

    const guestLeft = (
      <>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        <div className={styles.guestHeader}>
          <h2 className={styles.sectionTitle}>Elegí una lista</h2>
          <button
            className={styles.disconnectBtn}
            onClick={() => { setGuestMode(false); resetPlaylist() }}
          >
            ← Volver
          </button>
        </div>

        {!playlist && (
          <p className={styles.guestSubtitle}>
            Seleccioná una lista para jugar. Podés ocultar las que no te interesan.
          </p>
        )}

        {guestList.length === 0 ? (
          <p className={styles.emptyLists}>
            No hay listas disponibles. Importá un archivo JSON para empezar.
          </p>
        ) : (
          <div className={styles.guestList}>
            {guestList.map((entry) => (
              <div
                key={entry.id}
                className={`${styles.guestListItem} ${
                  playlist?.id === entry.playlist?.id ? styles.guestListItemSelected : ''
                }`}
                onClick={() => !renamingId && handleLoadSaved(entry)}
              >
                {entry.playlist?.imageUrl && (
                  <img
                    src={entry.playlist.imageUrl}
                    alt=""
                    className={styles.guestListThumb}
                  />
                )}
                {renamingId === entry.id ? (
                  <input
                    className={styles.renameInput}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(entry.id)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onBlur={() => handleRename(entry.id)}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div className={styles.guestListInfo}>
                    <span className={styles.guestListName}>{entry.name}</span>
                    <span className={styles.guestListMeta}>{entry.tracks.length} canciones</span>
                  </div>
                )}
                {renamingId !== entry.id && (
                  <button
                    className={styles.renameBtn}
                    onClick={(e) => { e.stopPropagation(); setRenamingId(entry.id); setRenameValue(entry.name) }}
                    title="Renombrar"
                  >✏</button>
                )}
                <button
                  className={styles.guestHideBtn}
                  onClick={(e) => { e.stopPropagation(); handleGuestHide(entry.id) }}
                  title="Ocultar de mi vista"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Importar JSON */}
        <div className={styles.savedActions}>
          <button
            className={styles.jsonBtn}
            onClick={() => importInputRef.current?.click()}
          >
            ↑ Importar listas
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>

        {/* Card de confirmación — aparece cuando hay playlist seleccionada */}
        {playlist && (
          <div className={styles.guestSelectedCard}>
            {playlist.imageUrl && (
              <img src={playlist.imageUrl} alt="" className={styles.guestSelectedThumb} />
            )}
            <div>
              <div className={styles.guestSelectedName}>
                {selectedEntryName ?? playlist.name}
              </div>
              <div className={styles.guestSelectedCount}>{tracks.length} canciones cargadas</div>
            </div>
          </div>
        )}

        {/* Tamaño de grilla */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tamaño de grilla</h2>
          <div className={styles.gridOptions}>
            {GRID_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                className={`${styles.gridBtn} ${
                  gridSize.cols === opt.cols && gridSize.rows === opt.rows ? styles.active : ''
                }`}
                onClick={() => setGridSize({ cols: opt.cols, rows: opt.rows })}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {notEnoughTracks && (
            <ErrorBanner
              message={`La playlist tiene ${draftTracks.length} canciones pero el cartón necesita ${requiredTracks}. Elegí una grilla más chica.`}
            />
          )}
        </section>

        <div className={styles.actions}>
          {playlist && (
            <button className={styles.reiniciarBtn} onClick={resetPlaylist}>
              ✕ Reiniciar
            </button>
          )}
          <button
            className={styles.goBtn}
            onClick={onGoToCalibrator}
            disabled={!playlist || draftTracks.length < requiredTracks}
          >
            Ir al Calibrador →
          </button>
        </div>
      </>
    )

    if (!playlist) {
      return <div className={styles.guestScreen}>{guestLeft}</div>
    }

    return (
      <div className={styles.twoCol}>
        <div className={styles.leftPanel}>
          {guestLeft}
        </div>

        {/* Panel derecho: editor de tracks */}
        <div className={styles.rightPanel}>
          <div className={styles.trackEditorHeader}>
            <span>{draftTracks.length} canciones{isDirty ? ' · cambios sin guardar' : ''}</span>
            <div className={styles.trackEditorBtns}>
              {!saveAsForm && (
                <button
                  className={styles.saveAsBtn}
                  onClick={() => { setSaveAsForm(true); setSaveAsName(playlist?.name ?? '') }}
                  title="Guardar las canciones editadas como nueva lista"
                >
                  + Nueva lista
                </button>
              )}
              <button
                className={styles.saveTracksBtn}
                onClick={handleSaveTracks}
                disabled={!isDirty}
              >
                {trackSaved ? '✓ Guardado' : 'Guardar cambios'}
              </button>
            </div>
          </div>
          {saveAsForm && (
            <div className={styles.saveAsRow}>
              <input
                className={styles.saveAsInput}
                value={saveAsName}
                onChange={(e) => setSaveAsName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAs()
                  if (e.key === 'Escape') setSaveAsForm(false)
                }}
                placeholder="Nombre de la nueva lista"
                autoFocus
              />
              <button className={styles.saveConfirmBtn} onClick={handleSaveAs}>Guardar</button>
              <button className={styles.saveCancelBtn} onClick={() => setSaveAsForm(false)}>✕</button>
            </div>
          )}
          <div className={styles.trackList}>
            {draftTracks.map((track, i) => (
              <div key={track.id} className={styles.trackRow}>
                <span className={styles.trackIdx}>{i + 1}</span>
                {track.thumbnail
                  ? <img src={track.thumbnail} className={styles.trackThumbSmall} alt="" />
                  : <div className={styles.trackThumbEmpty} />}
                <input
                  className={styles.trackInput}
                  value={track.name}
                  onChange={(e) => updateDraftTrack(i, 'name', e.target.value)}
                  placeholder="Nombre"
                />
                <input
                  className={`${styles.trackInput} ${styles.trackInputArtist}`}
                  value={track.artist}
                  onChange={(e) => updateDraftTrack(i, 'artist', e.target.value)}
                  placeholder="Artista"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Pantalla 3: Modo Spotify ───────────────────────────────────────────────
  const spotifyLeft = (
    <>
      <ErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Playlist */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Playlist</h2>
          <button className={styles.disconnectBtn} onClick={disconnect}>
            Desconectar Spotify
          </button>
        </div>

        <div className={styles.inputRow}>
          <input
            className={styles.textInput}
            type="text"
            placeholder="https://open.spotify.com/playlist/..."
            value={playlistInput}
            onChange={(e) => setPlaylistInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPlaylist()}
          />
          <button
            className={styles.loadBtn}
            onClick={loadPlaylist}
            disabled={loading || !playlistInput.trim()}
          >
            {loading ? 'Cargando...' : 'Cargar'}
          </button>
        </div>

        {playlist && (
          <>
            <div className={styles.playlistMeta}>
              {playlist.imageUrl && (
                <img src={playlist.imageUrl} alt={playlist.name} className={styles.playlistImg} />
              )}
              <div>
                <div className={styles.playlistName}>{playlist.name}</div>
                <div className={styles.playlistTracks}>{tracks.length} canciones cargadas</div>
              </div>
            </div>

            {!saveForm ? (
              <button
                className={styles.saveListBtn}
                onClick={() => { setSaveForm(true); setSaveName(playlist.name) }}
              >
                + Guardar lista
              </button>
            ) : (
              <div className={styles.saveForm}>
                <input
                  className={styles.saveInput}
                  type="text"
                  placeholder="Nombre de la lista"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaveForm(false) }}
                  autoFocus
                />
                <button className={styles.saveConfirmBtn} onClick={handleSave}>Guardar</button>
                <button className={styles.saveCancelBtn} onClick={() => setSaveForm(false)}>✕</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Mis listas */}
      <section className={styles.section}>
        <div className={styles.savedHeader}>
          <h2 className={styles.sectionTitle}>Mis listas</h2>
          <div className={styles.savedActions}>
            <button
              className={styles.jsonBtn}
              onClick={() => useSP.exportJSON(savedPlaylists)}
              disabled={savedPlaylists.length === 0}
            >
              ↓ Exportar
            </button>
            <button
              className={styles.jsonBtn}
              onClick={() => importInputRef.current?.click()}
            >
              ↑ Importar
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
        </div>

        {savedPlaylists.length === 0 ? (
          <p className={styles.emptyLists}>No hay listas guardadas.</p>
        ) : (
          <div className={styles.savedList}>
            {savedPlaylists.map((entry) => (
              <div
                key={entry.id}
                className={styles.savedItem}
                onClick={() => !renamingId && handleLoadSaved(entry)}
                title={renamingId === entry.id ? undefined : 'Click para cargar'}
              >
                <div className={styles.savedInfo}>
                  {renamingId === entry.id ? (
                    <input
                      className={styles.renameInput}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(entry.id)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      onBlur={() => handleRename(entry.id)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className={styles.savedName}>{entry.name}</span>
                      <span className={styles.savedMeta}>
                        {entry.tracks.length} canciones · {formatDate(entry.saved_at)}
                      </span>
                    </>
                  )}
                </div>
                <div className={styles.savedItemBtns}>
                  {renamingId !== entry.id && (
                    <button
                      className={styles.renameBtn}
                      onClick={(e) => { e.stopPropagation(); setRenamingId(entry.id); setRenameValue(entry.name) }}
                      title="Renombrar"
                    >✏</button>
                  )}
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }}
                    title="Eliminar lista"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tamaño de grilla */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tamaño de grilla</h2>
        <div className={styles.gridOptions}>
          {GRID_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              className={`${styles.gridBtn} ${
                gridSize.cols === opt.cols && gridSize.rows === opt.rows ? styles.active : ''
              }`}
              onClick={() => setGridSize({ cols: opt.cols, rows: opt.rows })}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {notEnoughTracks && (
          <ErrorBanner
            message={`La playlist tiene ${draftTracks.length} canciones pero el cartón necesita ${requiredTracks}. Elegí una grilla más chica.`}
          />
        )}
      </section>

      <div className={styles.actions}>
        {playlist && (
          <button className={styles.reiniciarBtn} onClick={resetPlaylist}>
            ✕ Reiniciar
          </button>
        )}
        <button
          className={styles.goBtn}
          onClick={onGoToCalibrator}
          disabled={!playlist || draftTracks.length < requiredTracks}
        >
          Ir al Calibrador →
        </button>
      </div>
    </>
  )

  if (!playlist) {
    return <div className={styles.config}>{spotifyLeft}</div>
  }

  return (
    <div className={styles.twoCol}>
      <div className={styles.leftPanel}>
        {spotifyLeft}
      </div>

      {/* Panel derecho: editor de tracks */}
      <div className={styles.rightPanel}>
        <div className={styles.trackEditorHeader}>
          <span>{draftTracks.length} canciones{isDirty ? ' · cambios sin guardar' : ''}</span>
          <div className={styles.trackEditorBtns}>
            {!saveAsForm && (
              <button
                className={styles.saveAsBtn}
                onClick={() => { setSaveAsForm(true); setSaveAsName(playlist?.name ?? '') }}
                title="Guardar las canciones editadas como nueva lista"
              >
                + Nueva lista
              </button>
            )}
            <button
              className={styles.saveTracksBtn}
              onClick={handleSaveTracks}
              disabled={!isDirty}
            >
              {trackSaved ? '✓ Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>
        {saveAsForm && (
          <div className={styles.saveAsRow}>
            <input
              className={styles.saveAsInput}
              value={saveAsName}
              onChange={(e) => setSaveAsName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveAs()
                if (e.key === 'Escape') setSaveAsForm(false)
              }}
              placeholder="Nombre de la nueva lista"
              autoFocus
            />
            <button className={styles.saveConfirmBtn} onClick={handleSaveAs}>Guardar</button>
            <button className={styles.saveCancelBtn} onClick={() => setSaveAsForm(false)}>✕</button>
          </div>
        )}
        <div className={styles.trackList}>
          {draftTracks.map((track, i) => (
            <div key={track.id} className={styles.trackRow}>
              <span className={styles.trackIdx}>{i + 1}</span>
              {track.thumbnail
                ? <img src={track.thumbnail} className={styles.trackThumbSmall} alt="" />
                : <div className={styles.trackThumbEmpty} />}
              <input
                className={styles.trackInput}
                value={track.name}
                onChange={(e) => updateDraftTrack(i, 'name', e.target.value)}
                placeholder="Nombre"
              />
              <input
                className={`${styles.trackInput} ${styles.trackInputArtist}`}
                value={track.artist}
                onChange={(e) => updateDraftTrack(i, 'artist', e.target.value)}
                placeholder="Artista"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
