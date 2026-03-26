import { useState, useEffect, useCallback } from 'react'
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
} from '../../utils/supabaseEvento'
import styles from './EventoTab.module.css'

export function EventoTab() {
  const [playlists, setPlaylists] = useState([])
  const [playlistActivaId, setPlaylistActivaId] = useState('')
  const [cantidad, setCantidad] = useState(120)
  const [error, setError] = useState('')
  const [progreso, setProgreso] = useState(null) // null | { insertados, total }
  const [exito, setExito] = useState('')
  const [estado, setEstado] = useState(null) // { total, entregados, disponibles, lista }
  const [loadingEstado, setLoadingEstado] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [generando, setGenerando] = useState(false)

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

  async function handleCambiarPlaylist(e) {
    const id = e.target.value
    setPlaylistActivaId(id)
    setError('')
    setExito('')
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

    if (!playlistActivaId) {
      setError('Seleccioná una playlist primero')
      return
    }

    const tracks = playlistActiva?.tracks ?? []
    if (tracks.length < 15) {
      setError(`La playlist tiene ${tracks.length} temas. Necesitás al menos 15 para un cartón 3×5`)
      return
    }

    setGenerando(true)
    try {
      const ids = generateAllUniqueCards(tracks, 3, 5, cantidad)

      await deleteCartonesByPlaylist(playlistActivaId)

      const cartones = ids.map((track_ids, i) => ({
        numero: i + 1,
        playlist_id: playlistActivaId,
        track_ids,
      }))

      await insertCartonesBatch(cartones, (insertados, total) => {
        setProgreso({ insertados, total })
      })

      setExito(`✓ ${cantidad} cartones listos para el evento`)
      setProgreso(null)
    } catch (err) {
      setError('Error al guardar los cartones. Intentá de nuevo')
      setProgreso(null)
    } finally {
      setGenerando(false)
    }
  }

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

  async function handleResetear() {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
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

        <select
          className={styles.select}
          value={playlistActivaId}
          onChange={handleCambiarPlaylist}
        >
          <option value="">— Seleccioná una playlist —</option>
          {playlists.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {playlistActiva && (
          <div className={styles.playlistInfo}>
            <span className={styles.playlistName}>{playlistActiva.name}</span>
            <span className={styles.badge}>✓ Activa</span>
            <span className={styles.trackCount}>
              {playlistActiva.tracks?.length ?? 0} temas disponibles
            </span>
          </div>
        )}
      </section>

      {/* ── Sección 2: Generar cartones ────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Generar cartones</h2>

        <p className={styles.hint}>Se generarán cartones de 3×5 (15 temas por cartón)</p>

        <div className={styles.inputRow}>
          <label className={styles.label}>Cantidad de cartones</label>
          <input
            type="number"
            className={styles.numberInput}
            value={cantidad}
            min={10}
            max={500}
            onChange={(e) => setCantidad(Math.max(10, Math.min(500, Number(e.target.value))))}
          />
        </div>

        {progreso && (
          <p className={styles.progreso}>
            Generando {progreso.insertados} de {progreso.total}...
          </p>
        )}

        {exito && <p className={styles.exitoMsg}>{exito}</p>}

        <button
          className={styles.primaryBtn}
          onClick={handleGenerarCartones}
          disabled={generando}
        >
          {generando ? 'Generando...' : '🎲 Generar cartones para el evento'}
        </button>
      </section>

      {/* ── Sección 3: Estado del evento ──────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Estado del evento</h2>
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
              <button className={styles.cancelBtn} onClick={() => setConfirmReset(false)}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        {!estado && (
          <p className={styles.hint}>
            {playlistActivaId ? 'Hacé clic en Actualizar para ver el estado' : 'Seleccioná una playlist primero'}
          </p>
        )}

        {estado && (
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
                            ? new Date(c.entregado_at).toLocaleTimeString('es-AR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>
    </div>
  )
}
