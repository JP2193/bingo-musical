import { useState, useEffect, useCallback, useRef } from 'react'
import { ErrorBanner } from '../../components/UI/ErrorBanner'
import { generateAllUniqueCards } from '../../utils/bingo'
import {
  getPlaylists,
  getPlaylistActiva,
  setPlaylistActiva,
  deleteCartonesByPlaylist,
  insertCartonesBatch,
  getEstadoEvento,
  resetEvento,
  getCancionesCantadas,
  activarCancion,
  desactivarCancion,
  resetCancionesCantadas,
  getRankingCartones,
} from '../../utils/supabaseEvento'
import styles from './EventoTab.module.css'

const MEDAL = ['🥇', '🥈', '🥉']

export function EventoTab() {
  const [playlists, setPlaylists] = useState([])
  const [playlistActivaId, setPlaylistActivaId] = useState('')
  const [cantidad, setCantidad] = useState(120)
  const [error, setError] = useState('')
  const [progreso, setProgreso] = useState(null)
  const [exito, setExito] = useState('')
  const [generando, setGenerando] = useState(false)

  // Sub-tabs
  const [subTab, setSubTab] = useState('canciones')

  // Canciones
  const [cantadas, setCantadas] = useState(new Set())
  const [loadingCanciones, setLoadingCanciones] = useState(false)
  const [confirmResetCanciones, setConfirmResetCanciones] = useState(false)

  // Ranking
  const [ranking, setRanking] = useState(null)
  const [loadingRanking, setLoadingRanking] = useState(false)
  const rankingIntervalRef = useRef(null)

  // Cartones
  const [estado, setEstado] = useState(null)
  const [loadingEstado, setLoadingEstado] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [listas, activa] = await Promise.all([getPlaylists(), getPlaylistActiva()])
        setPlaylists(listas)
        setPlaylistActivaId(activa)
      } catch {
        setError('Error al cargar playlists')
      }
    }
    cargarDatos()
  }, [])

  const playlistActiva = playlists.find((p) => p.id === playlistActivaId)
  const tracks = playlistActiva?.tracks ?? []

  async function handleCambiarPlaylist(e) {
    const id = e.target.value
    setPlaylistActivaId(id)
    setError('')
    setExito('')
    setCantadas(new Set())
    setRanking(null)
    setEstado(null)
    try {
      await setPlaylistActiva(id)
    } catch {
      setError('Error al guardar la playlist activa')
    }
  }

  async function handleGenerarCartones() {
    setError('')
    setExito('')
    setProgreso(null)
    if (!playlistActivaId) { setError('Seleccioná una playlist primero'); return }
    if (tracks.length < 15) {
      setError(`La playlist tiene ${tracks.length} temas. Necesitás al menos 15 para un cartón 3×5`)
      return
    }
    setGenerando(true)
    try {
      const ids = generateAllUniqueCards(tracks, 3, 5, cantidad)
      await deleteCartonesByPlaylist(playlistActivaId)
      const cartones = ids.map((track_ids, i) => ({ numero: i + 1, playlist_id: playlistActivaId, track_ids }))
      await insertCartonesBatch(cartones, (insertados, total) => setProgreso({ insertados, total }))
      setExito(`✓ ${cantidad} cartones listos para el evento`)
      setProgreso(null)
    } catch {
      setError('Error al guardar los cartones. Intentá de nuevo')
      setProgreso(null)
    } finally {
      setGenerando(false)
    }
  }

  // ── Canciones ─────────────────────────────────────────────────────────────────

  const handleCargarCanciones = useCallback(async () => {
    if (!playlistActivaId) return
    setLoadingCanciones(true)
    try {
      const set = await getCancionesCantadas(playlistActivaId)
      setCantadas(set)
    } catch {
      setError('Error al cargar canciones cantadas')
    } finally {
      setLoadingCanciones(false)
    }
  }, [playlistActivaId])

  useEffect(() => {
    if (subTab === 'canciones' && playlistActivaId) handleCargarCanciones()
  }, [subTab, playlistActivaId, handleCargarCanciones])

  async function handleToggleCancion(trackId, isActive) {
    setCantadas((prev) => {
      const next = new Set(prev)
      if (isActive) next.delete(trackId)
      else next.add(trackId)
      return next
    })
    try {
      if (isActive) await desactivarCancion(playlistActivaId, trackId)
      else await activarCancion(playlistActivaId, trackId)
    } catch {
      setCantadas((prev) => {
        const next = new Set(prev)
        if (isActive) next.add(trackId)
        else next.delete(trackId)
        return next
      })
      setError('Error al actualizar la canción')
    }
  }

  async function handleResetCanciones() {
    if (!confirmResetCanciones) { setConfirmResetCanciones(true); return }
    try {
      await resetCancionesCantadas(playlistActivaId)
      setCantadas(new Set())
      setConfirmResetCanciones(false)
    } catch {
      setError('Error al resetear el juego')
    }
  }

  // ── Ranking ───────────────────────────────────────────────────────────────────

  const handleCargarRanking = useCallback(async () => {
    if (!playlistActivaId) return
    setLoadingRanking(true)
    try {
      const data = await getRankingCartones(playlistActivaId)
      setRanking(data)
    } catch {
      setError('Error al cargar el ranking')
    } finally {
      setLoadingRanking(false)
    }
  }, [playlistActivaId])

  useEffect(() => {
    if (subTab === 'ranking' && playlistActivaId) {
      handleCargarRanking()
      rankingIntervalRef.current = setInterval(handleCargarRanking, 10000)
    }
    return () => clearInterval(rankingIntervalRef.current)
  }, [subTab, playlistActivaId, handleCargarRanking])

  // ── Cartones ──────────────────────────────────────────────────────────────────

  const handleCargarEstado = useCallback(async () => {
    if (!playlistActivaId) return
    setLoadingEstado(true)
    try {
      const data = await getEstadoEvento(playlistActivaId)
      setEstado(data)
    } catch {
      setError('Error al cargar el estado del evento')
    } finally {
      setLoadingEstado(false)
    }
  }, [playlistActivaId])

  useEffect(() => {
    if (subTab === 'cartones' && playlistActivaId) handleCargarEstado()
  }, [subTab, playlistActivaId, handleCargarEstado])

  async function handleResetear() {
    if (!confirmReset) { setConfirmReset(true); return }
    try {
      await resetEvento(playlistActivaId)
      setConfirmReset(false)
      setExito('Evento reseteado correctamente')
      handleCargarEstado()
    } catch {
      setError('Error al resetear el evento')
    }
  }

  return (
    <div className={styles.container}>
      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* ── Sección 1: Playlist activa ─────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Playlist activa</h2>

        <select className={styles.select} value={playlistActivaId} onChange={handleCambiarPlaylist}>
          <option value="">— Seleccioná una playlist —</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {playlistActiva && (
          <div className={styles.playlistInfo}>
            <span className={styles.playlistName}>{playlistActiva.name}</span>
            <span className={styles.badge}>✓ Activa</span>
            <span className={styles.trackCount}>{tracks.length} temas disponibles</span>
          </div>
        )}
      </section>

      {/* ── Sección 2: Generar cartones ────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Generar cartones</h2>
        <p className={styles.hint}>Se generarán cartones de 3×5 (15 temas por cartón)</p>

        <div className={styles.inputRow}>
          <label className={styles.label}>Cantidad de cartones</label>
          <div className={styles.stepper}>
            <button type="button" className={styles.stepBtn} onClick={() => setCantidad((c) => Math.max(10, c - 10))}>−</button>
            <input
              type="number"
              className={styles.numberInput}
              value={cantidad}
              min={10}
              max={500}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (!isNaN(v)) setCantidad(Math.max(10, Math.min(500, v)))
              }}
            />
            <button type="button" className={styles.stepBtn} onClick={() => setCantidad((c) => Math.min(500, c + 10))}>+</button>
          </div>
        </div>

        {progreso && <p className={styles.progreso}>Generando {progreso.insertados} de {progreso.total}...</p>}
        {exito && <p className={styles.exitoMsg}>{exito}</p>}

        <button className={styles.primaryBtn} onClick={handleGenerarCartones} disabled={generando}>
          {generando ? 'Generando...' : '🎲 Generar cartones para el evento'}
        </button>
      </section>

      {/* ── Sección 3: Conducir el juego (sub-tabs) ───────────────────────── */}
      <section className={`${styles.section} ${styles.sectionLast}`}>
        <h2 className={styles.sectionTitle}>Conducir el juego</h2>

        <div className={styles.subTabsNav}>
          {[
            { id: 'canciones', label: 'Canciones' },
            { id: 'ranking',   label: 'Ranking' },
            { id: 'cartones',  label: 'Cartones' },
          ].map((t) => (
            <button
              key={t.id}
              className={`${styles.subTabBtn} ${subTab === t.id ? styles.subTabActive : ''}`}
              onClick={() => setSubTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Sub-tab: Canciones ──────────────────────────────────────────── */}
        {subTab === 'canciones' && (
          <div className={styles.subTabContent}>
            <div className={styles.sectionHeader}>
              <span className={styles.hint}>
                {loadingCanciones ? 'Cargando...' : `${cantadas.size} de ${tracks.length} canciones sonaron`}
              </span>
              <div className={styles.actionRow}>
                <button
                  className={`${styles.secondaryBtn} ${confirmResetCanciones ? styles.dangerBtn : ''}`}
                  onClick={handleResetCanciones}
                  disabled={!playlistActivaId}
                >
                  {confirmResetCanciones ? '¿Confirmar?' : '↩ Resetear juego'}
                </button>
                {confirmResetCanciones && (
                  <button className={styles.cancelBtn} onClick={() => setConfirmResetCanciones(false)}>Cancelar</button>
                )}
              </div>
            </div>

            {!playlistActivaId ? (
              <p className={styles.hint}>Seleccioná una playlist primero</p>
            ) : tracks.length === 0 ? (
              <p className={styles.hint}>La playlist no tiene temas</p>
            ) : (
              <div className={styles.trackList}>
                {tracks.map((track) => {
                  const isActive = cantadas.has(track.id)
                  return (
                    <div key={track.id} className={`${styles.trackRow} ${isActive ? styles.trackRowActive : ''}`}>
                      <div className={styles.trackInfo}>
                        <span className={styles.trackName}>{track.name}</span>
                        <span className={styles.trackArtist}>{track.artist}</span>
                      </div>
                      <button
                        className={`${styles.toggle} ${isActive ? styles.toggleOn : ''}`}
                        onClick={() => handleToggleCancion(track.id, isActive)}
                        aria-label={isActive ? 'Desactivar' : 'Activar'}
                      >
                        <span className={styles.toggleThumb} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Sub-tab: Ranking ────────────────────────────────────────────── */}
        {subTab === 'ranking' && (
          <div className={styles.subTabContent}>
            <div className={styles.sectionHeader}>
              <span className={styles.hint}>Se actualiza cada 10 seg</span>
              <button
                className={styles.secondaryBtn}
                onClick={handleCargarRanking}
                disabled={loadingRanking || !playlistActivaId}
              >
                🔄 Actualizar
              </button>
            </div>

            {!playlistActivaId ? (
              <p className={styles.hint}>Seleccioná una playlist primero</p>
            ) : !ranking ? (
              <p className={styles.hint}>Cargando ranking...</p>
            ) : ranking.length === 0 ? (
              <p className={styles.hint}>No hay cartones entregados aún</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}></th>
                    <th>Invitado</th>
                    <th style={{ width: 70 }}>Canciones</th>
                    <th style={{ width: 120 }}>Progreso</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((row, i) => (
                    <tr key={row.numero} className={row.tachadas === row.total ? styles.trBingo : ''}>
                      <td className={styles.rankPos}>{MEDAL[i] ?? i + 1}</td>
                      <td>
                        {row.nombre ?? `Cartón #${row.numero}`}
                        {row.tachadas === row.total && <span className={styles.bingoBadge}>BINGO 🎉</span>}
                      </td>
                      <td className={styles.rankScore}>{row.tachadas}/{row.total}</td>
                      <td>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${row.pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Sub-tab: Cartones ───────────────────────────────────────────── */}
        {subTab === 'cartones' && (
          <div className={styles.subTabContent}>
            <div className={styles.sectionHeader}>
              <div className={styles.actionRow}>
                <button className={styles.secondaryBtn} onClick={handleCargarEstado} disabled={loadingEstado || !playlistActivaId}>
                  🔄 Actualizar
                </button>
                <button
                  className={`${styles.secondaryBtn} ${confirmReset ? styles.dangerBtn : ''}`}
                  onClick={handleResetear}
                  disabled={!playlistActivaId || !estado}
                >
                  {confirmReset ? '¿Confirmar reset?' : '↩ Resetear evento'}
                </button>
                {confirmReset && (
                  <button className={styles.cancelBtn} onClick={() => setConfirmReset(false)}>Cancelar</button>
                )}
              </div>
            </div>

            {!estado ? (
              <p className={styles.hint}>
                {playlistActivaId ? 'Hacé clic en Actualizar para ver el estado' : 'Seleccioná una playlist primero'}
              </p>
            ) : (
              <>
                <div className={styles.statsRow}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{estado.total}</span>
                    <span className={styles.statLabel}>Total</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{estado.entregados}</span>
                    <span className={styles.statLabel}>Entregados</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>{estado.disponibles}</span>
                    <span className={styles.statLabel}>Disponibles</span>
                  </div>
                </div>

                {estado.lista.filter((c) => c.entregado).length > 0 && (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Invitado</th>
                        <th>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estado.lista
                        .filter((c) => c.entregado)
                        .map((c) => (
                          <tr key={c.id}>
                            <td>{c.numero}</td>
                            <td>{c.nombre_invitado ?? '—'}</td>
                            <td>
                              {c.entregado_at
                                ? new Date(c.entregado_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
