import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  getInvitados,
  getCartonesSobrantes,
  insertInvitadosBatch,
  preasignarCartones,
  cambiarCarton,
  agregarInvitado,
  eliminarInvitado,
  resetearAsignadoAt,
  getCartonesTrackIds,
  toggleOcultoInvitado,
} from '../../utils/supabaseEvento'
import { imprimirCartones } from '../../utils/imprimirCartones'
import styles from './EventoTab.module.css'

const MEDAL = ['🥇', '🥈', '🥉']

function parsearLista(texto) {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [nombre, apellido] = l.split('\t')
      return { nombre: nombre?.trim() ?? '', apellido: apellido?.trim() ?? '' }
    })
    .filter((inv) => inv.nombre && inv.apellido)
}

function normalizarStr(str = '') {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export function EventoTab() {
  const [playlists, setPlaylists] = useState([])
  const [playlistActivaId, setPlaylistActivaId] = useState('')
  const [cantidad, setCantidad] = useState(120)
  const [formato, setFormato] = useState('3x5')
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
  const [toggleStates, setToggleStates] = useState({})  // { [trackId]: 'loading' | 'ok' | 'err' }
  const [toggleErrors, setToggleErrors] = useState({})  // { [trackId]: string }

  // Ranking
  const [ranking, setRanking] = useState(null)
  const [loadingRanking, setLoadingRanking] = useState(false)
  const rankingIntervalRef = useRef(null)

  // Cartones
  const [estado, setEstado] = useState(null)
  const [loadingEstado, setLoadingEstado] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  // Invitados
  const [invitados, setInvitados] = useState([])
  const [cartonesSobrantes, setCartonesSobrantes] = useState([])
  const [loadingInvitados, setLoadingInvitados] = useState(false)
  const [txtLista, setTxtLista] = useState('')
  const [loadingCarga, setLoadingCarga] = useState(false)
  const [confirmReemplazar, setConfirmReemplazar] = useState(false)
  const [loadingPreasignar, setLoadingPreasignar] = useState(false)
  const [progresoPreasignar, setProgresoPreasignar] = useState('')
  const [buscadorInv, setBuscadorInv] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [nuevoCartonId, setNuevoCartonId] = useState('')
  const [confirmEliminarId, setConfirmEliminarId] = useState(null)
  const [confirmResetearId, setConfirmResetearId] = useState(null)
  const [mostrandoFormNuevo, setMostrandoFormNuevo] = useState(false)
  const [formNuevo, setFormNuevo] = useState({ nombre: '', apellido: '', cartonId: '' })
  const [loadingFormNuevo, setLoadingFormNuevo] = useState(false)

  // Impresión
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [modalImprimir, setModalImprimir] = useState(false)
  const [progresoImprimir, setProgresoImprimir] = useState('')
  const [generandoPDF, setGenerandoPDF] = useState(false)

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
    setInvitados([])
    setCartonesSobrantes([])
    try {
      await setPlaylistActiva(id)
    } catch {
      setError('Error al guardar la playlist activa')
    }
  }

  const formatoConfig = formato === '4x4'
    ? { cols: 4, rows: 4, minTracks: 16, label: '4×4 (16 temas por cartón)' }
    : { cols: 3, rows: 5, minTracks: 15, label: '3×5 (15 temas por cartón)' }

  async function handleGenerarCartones() {
    setError('')
    setExito('')
    setProgreso(null)
    if (!playlistActivaId) { setError('Seleccioná una playlist primero'); return }
    if (tracks.length < formatoConfig.minTracks) {
      setError(`La playlist tiene ${tracks.length} temas. Necesitás al menos ${formatoConfig.minTracks} para un cartón ${formato}`)
      return
    }
    setGenerando(true)
    try {
      const ids = generateAllUniqueCards(tracks, formatoConfig.cols, formatoConfig.rows, cantidad)
      await deleteCartonesByPlaylist(playlistActivaId)
      const cartones = ids.map((track_ids, i) => ({ numero: i + 1, playlist_id: playlistActivaId, track_ids }))
      await insertCartonesBatch(cartones, (ins, total) => setProgreso({ insertados: ins, total }))
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
      setCantadas(await getCancionesCantadas(playlistActivaId))
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
      if (isActive) next.delete(trackId); else next.add(trackId)
      return next
    })
    setToggleStates((prev) => ({ ...prev, [trackId]: 'loading' }))
    setToggleErrors((prev) => { const next = { ...prev }; delete next[trackId]; return next })

    try {
      if (isActive) await desactivarCancion(playlistActivaId, trackId)
      else await activarCancion(playlistActivaId, trackId)

      setToggleStates((prev) => ({ ...prev, [trackId]: 'ok' }))
      setTimeout(() => {
        setToggleStates((prev) => { const next = { ...prev }; delete next[trackId]; return next })
      }, 1000)
    } catch {
      setCantadas((prev) => {
        const next = new Set(prev)
        if (isActive) next.add(trackId); else next.delete(trackId)
        return next
      })
      setToggleStates((prev) => ({ ...prev, [trackId]: 'err' }))
      setToggleErrors((prev) => ({ ...prev, [trackId]: 'No se pudo guardar. Intentá de nuevo.' }))
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
      setRanking(await getRankingCartones(playlistActivaId))
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
      setEstado(await getEstadoEvento(playlistActivaId))
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

  // ── Invitados ─────────────────────────────────────────────────────────────────

  const handleCargarInvitados = useCallback(async () => {
    if (!playlistActivaId) return
    setLoadingInvitados(true)
    try {
      const [lista, sobrantes] = await Promise.all([
        getInvitados(playlistActivaId),
        getCartonesSobrantes(playlistActivaId),
      ])
      setInvitados(lista)
      setCartonesSobrantes(sobrantes)
    } catch {
      setError('Error al cargar invitados')
    } finally {
      setLoadingInvitados(false)
    }
  }, [playlistActivaId])

  useEffect(() => {
    if (subTab === 'invitados' && playlistActivaId) handleCargarInvitados()
  }, [subTab, playlistActivaId, handleCargarInvitados])

  const filteredInvitados = useMemo(() => {
    if (!buscadorInv.trim()) return invitados
    const q = normalizarStr(buscadorInv)
    return invitados.filter(
      (inv) => normalizarStr(inv.nombre).includes(q) || normalizarStr(inv.apellido).includes(q)
    )
  }, [invitados, buscadorInv])

  async function handleCargarLista() {
    const lista = parsearLista(txtLista)
    if (!lista.length) { setError('La lista está vacía o tiene un formato incorrecto'); return }
    if (invitados.length > 0) { setConfirmReemplazar(true); return }
    await ejecutarCargaLista(lista)
  }

  async function ejecutarCargaLista(lista) {
    setLoadingCarga(true)
    setConfirmReemplazar(false)
    try {
      await insertInvitadosBatch(lista, playlistActivaId)
      setTxtLista('')
      setExito(`✓ ${lista.length} invitados cargados`)
      await handleCargarInvitados()
    } catch {
      setError('Error al cargar la lista')
    } finally {
      setLoadingCarga(false)
    }
  }

  async function handlePreasignar() {
    setLoadingPreasignar(true)
    setProgresoPreasignar('')
    try {
      const result = await preasignarCartones(playlistActivaId, (n, total) => {
        setProgresoPreasignar(`Asignando ${n} de ${total}...`)
      })
      setExito(`✓ ${result.asignados} invitados asignados · ${result.sobrantes} cartones sobrantes`)
      await handleCargarInvitados()
    } catch (err) {
      setError(err.message ?? 'Error al pre-asignar cartones')
    } finally {
      setLoadingPreasignar(false)
      setProgresoPreasignar('')
    }
  }

  async function handleGuardarCambioCarton(inv) {
    if (!nuevoCartonId) return
    try {
      await cambiarCarton(inv.id, nuevoCartonId, inv.nombre, inv.apellido, inv.carton_id)
      setEditandoId(null)
      setNuevoCartonId('')
      await handleCargarInvitados()
    } catch {
      setError('Error al cambiar el cartón')
    }
  }

  async function handleResetearInvitado(inv) {
    if (confirmResetearId !== inv.id) { setConfirmResetearId(inv.id); return }
    try {
      await resetearAsignadoAt(inv.id)
      setConfirmResetearId(null)
      await handleCargarInvitados()
    } catch {
      setError('Error al resetear el invitado')
    }
  }

  async function handleEliminarInvitado(inv) {
    if (confirmEliminarId !== inv.id) { setConfirmEliminarId(inv.id); return }
    try {
      await eliminarInvitado(inv.id, inv.carton_id)
      setConfirmEliminarId(null)
      await handleCargarInvitados()
    } catch {
      setError('Error al eliminar el invitado')
    }
  }

  async function handleAgregarInvitado() {
    const { nombre, apellido, cartonId } = formNuevo
    if (!nombre.trim() || !apellido.trim()) { setError('Nombre y apellido son obligatorios'); return }
    setLoadingFormNuevo(true)
    try {
      await agregarInvitado(nombre.trim(), apellido.trim(), playlistActivaId, cartonId || null)
      setFormNuevo({ nombre: '', apellido: '', cartonId: '' })
      setMostrandoFormNuevo(false)
      await handleCargarInvitados()
    } catch {
      setError('Error al agregar el invitado')
    } finally {
      setLoadingFormNuevo(false)
    }
  }

  async function handleToggleOculto(inv) {
    try {
      await toggleOcultoInvitado(inv.id, !inv.oculto)
      await handleCargarInvitados()
    } catch {
      setError('Error al cambiar visibilidad del invitado')
    }
  }

  async function handleGenerarPDF() {
    setGenerandoPDF(true)
    try {
      const invSeleccionados = filteredInvitados.filter((inv) => seleccionados.has(inv.id))
      const idsConCarton = invSeleccionados.filter((inv) => inv.carton_id).map((inv) => inv.carton_id)
      const cartonesData = await getCartonesTrackIds(idsConCarton)
      const trackMap = Object.fromEntries(cartonesData.map((c) => [c.id, c]))

      const cartones = invSeleccionados
        .filter((inv) => inv.carton_id && trackMap[inv.carton_id])
        .map((inv) => {
          const carton = trackMap[inv.carton_id]
          const trackObjs = (carton.track_ids ?? []).map(
            (tid) => tracks.find((t) => t.id === tid) ?? { name: tid, artist: '' }
          )
          return {
            numero: carton.numero,
            nombre: inv.nombre,
            apellido: inv.apellido,
            tracks: trackObjs,
          }
        })

      await imprimirCartones(cartones, setProgresoImprimir)
      setModalImprimir(false)
      setSeleccionados(new Set())
    } catch (err) {
      setError(err?.message ?? 'Error al generar el PDF')
    } finally {
      setGenerandoPDF(false)
      setProgresoImprimir('')
    }
  }

  function badgeInvitado(inv) {
    if (!inv.carton_id) return <span className={styles.badgeGris}>⚪ Sin cartón</span>
    if (!inv.asignado_at) return <span className={styles.badgeAmarillo}>🟡 Asignado</span>
    return <span className={styles.badgeVerde}>🟢 Activo</span>
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
        <div className={styles.inputRow}>
          <label className={styles.label}>Formato</label>
          <select className={styles.select} value={formato} onChange={(e) => setFormato(e.target.value)}>
            <option value="3x5">3×5 — 15 temas por cartón (horizontal)</option>
            <option value="4x4">4×4 — 16 temas por cartón (vertical)</option>
          </select>
        </div>
        <p className={styles.hint}>Se generarán cartones de {formatoConfig.label}</p>
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
            { id: 'invitados', label: 'Invitados' },
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
                  const tState = toggleStates[track.id]
                  const tError = toggleErrors[track.id]
                  return (
                    <div key={track.id} className={`${styles.trackRow} ${isActive ? styles.trackRowActive : ''}`}>
                      <div className={styles.trackInfo}>
                        <span className={styles.trackName}>{track.name}</span>
                        <span className={styles.trackArtist}>{track.artist}</span>
                        {tError && <span className={styles.toggleError}>{tError}</span>}
                      </div>
                      <button
                        className={[
                          styles.toggle,
                          isActive ? styles.toggleOn : '',
                          tState === 'loading' ? styles.toggleLoading : '',
                          tState === 'ok' ? styles.toggleOk : '',
                        ].join(' ')}
                        onClick={() => handleToggleCancion(track.id, isActive)}
                        disabled={tState === 'loading'}
                        aria-label={isActive ? 'Desactivar' : 'Activar'}
                      >
                        {tState === 'loading' ? (
                          <span className={styles.toggleSpinner} />
                        ) : tState === 'ok' ? (
                          <span className={styles.toggleCheck}>✓</span>
                        ) : (
                          <span className={styles.toggleThumb} />
                        )}
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
              <button className={styles.secondaryBtn} onClick={handleCargarRanking} disabled={loadingRanking || !playlistActivaId}>
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
                  <div className={styles.stat}><span className={styles.statValue}>{estado.total}</span><span className={styles.statLabel}>Total</span></div>
                  <div className={styles.stat}><span className={styles.statValue}>{estado.entregados}</span><span className={styles.statLabel}>Entregados</span></div>
                  <div className={styles.stat}><span className={styles.statValue}>{estado.disponibles}</span><span className={styles.statLabel}>Disponibles</span></div>
                </div>
                {estado.lista.filter((c) => c.entregado).length > 0 && (
                  <table className={styles.table}>
                    <thead><tr><th>#</th><th>Invitado</th><th>Hora</th></tr></thead>
                    <tbody>
                      {estado.lista.filter((c) => c.entregado).map((c) => (
                        <tr key={c.id}>
                          <td>{c.numero}</td>
                          <td>{c.nombre_invitado ?? '—'}</td>
                          <td>{c.entregado_at ? new Date(c.entregado_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Sub-tab: Invitados ──────────────────────────────────────────── */}
        {subTab === 'invitados' && (
          <div className={styles.subTabContent}>
            {!playlistActivaId ? (
              <p className={styles.hint}>Seleccioná una playlist primero</p>
            ) : (
              <>
                {/* ── Carga masiva ── */}
                <div className={styles.invSection}>
                  <p className={styles.label}>Cargar lista (TSV: Nombre↹Apellido)</p>
                  <textarea
                    className={styles.textarea}
                    placeholder={'Laura\tDesmaras Luzuriaga\nGarlo\tDesmaras Luzuriaga'}
                    value={txtLista}
                    onChange={(e) => setTxtLista(e.target.value)}
                    rows={5}
                  />
                  {confirmReemplazar && (
                    <div className={styles.confirmBox}>
                      <p className={styles.hint}>Ya hay {invitados.length} invitados. ¿Reemplazar la lista?</p>
                      <div className={styles.actionRow}>
                        <button
                          className={`${styles.secondaryBtn} ${styles.dangerBtn}`}
                          onClick={() => ejecutarCargaLista(parsearLista(txtLista))}
                          disabled={loadingCarga}
                        >
                          Reemplazar
                        </button>
                        <button className={styles.cancelBtn} onClick={() => setConfirmReemplazar(false)}>Cancelar</button>
                      </div>
                    </div>
                  )}
                  <button
                    className={styles.secondaryBtn}
                    onClick={handleCargarLista}
                    disabled={loadingCarga || !txtLista.trim()}
                  >
                    {loadingCarga ? 'Cargando...' : 'Cargar lista'}
                  </button>
                </div>

                {/* ── Pre-asignación ── */}
                <div className={styles.invSection}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <p className={styles.label}>Pre-asignar cartones</p>
                      <p className={styles.hint}>Se asignan en el mismo orden que la lista</p>
                    </div>
                    <button
                      className={styles.secondaryBtn}
                      onClick={handlePreasignar}
                      disabled={loadingPreasignar || !invitados.length}
                    >
                      {loadingPreasignar ? progresoPreasignar || 'Asignando...' : 'Pre-asignar cartones'}
                    </button>
                  </div>
                </div>

                {/* ── Tabla ── */}
                <div className={styles.invSection}>
                  <div className={styles.sectionHeader}>
                    <p className={styles.label}>{invitados.length} invitados</p>
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => { setMostrandoFormNuevo((v) => !v); setFormNuevo({ nombre: '', apellido: '', cartonId: '' }) }}
                    >
                      {mostrandoFormNuevo ? 'Cancelar' : '+ Agregar'}
                    </button>
                  </div>

                  {mostrandoFormNuevo && (
                    <div className={styles.formNuevo}>
                      <input
                        className={styles.invInput}
                        placeholder="Nombre"
                        value={formNuevo.nombre}
                        onChange={(e) => setFormNuevo((f) => ({ ...f, nombre: e.target.value }))}
                      />
                      <input
                        className={styles.invInput}
                        placeholder="Apellido"
                        value={formNuevo.apellido}
                        onChange={(e) => setFormNuevo((f) => ({ ...f, apellido: e.target.value }))}
                      />
                      <select
                        className={styles.invSelect}
                        value={formNuevo.cartonId}
                        onChange={(e) => setFormNuevo((f) => ({ ...f, cartonId: e.target.value }))}
                      >
                        <option value="">Sin cartón</option>
                        {cartonesSobrantes.map((c) => (
                          <option key={c.id} value={c.id}>#{String(c.numero).padStart(3, '0')}</option>
                        ))}
                      </select>
                      <button className={styles.primaryBtn} onClick={handleAgregarInvitado} disabled={loadingFormNuevo}>
                        {loadingFormNuevo ? 'Guardando...' : 'Agregar'}
                      </button>
                    </div>
                  )}

                  {loadingInvitados ? (
                    <p className={styles.hint}>Cargando...</p>
                  ) : invitados.length === 0 ? (
                    <p className={styles.hint}>No hay invitados cargados</p>
                  ) : (
                    <>
                      {/* ── Barra de acciones de impresión ── */}
                      <div className={styles.printBar}>
                        <label className={styles.selectAllLabel}>
                          <input
                            type="checkbox"
                            checked={
                              filteredInvitados.length > 0 &&
                              filteredInvitados.every((inv) => seleccionados.has(inv.id))
                            }
                            ref={(el) => {
                              if (el) {
                                el.indeterminate =
                                  filteredInvitados.some((inv) => seleccionados.has(inv.id)) &&
                                  !filteredInvitados.every((inv) => seleccionados.has(inv.id))
                              }
                            }}
                            onChange={(e) => {
                              setSeleccionados((prev) => {
                                const next = new Set(prev)
                                if (e.target.checked) {
                                  filteredInvitados.forEach((inv) => next.add(inv.id))
                                } else {
                                  filteredInvitados.forEach((inv) => next.delete(inv.id))
                                }
                                return next
                              })
                            }}
                          />
                          Seleccionar todos
                        </label>
                        <button
                          className={styles.printBtn}
                          disabled={seleccionados.size === 0}
                          onClick={() => setModalImprimir(true)}
                        >
                          🖨️ Imprimir seleccionados
                        </button>
                        <input
                          className={styles.buscadorInv}
                          style={{ flex: 1, minWidth: 120 }}
                          placeholder="🔍 buscar..."
                          value={buscadorInv}
                          onChange={(e) => setBuscadorInv(e.target.value)}
                        />
                      </div>

                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th className={styles.checkCell}></th>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Cartón</th>
                            <th>Estado</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInvitados.map((inv) => (
                            <>
                              <tr key={inv.id} className={inv.oculto ? styles.trOculto : ''}>
                                <td className={styles.checkCell}>
                                  <input
                                    type="checkbox"
                                    checked={seleccionados.has(inv.id)}
                                    onChange={(e) => {
                                      setSeleccionados((prev) => {
                                        const next = new Set(prev)
                                        if (e.target.checked) next.add(inv.id)
                                        else next.delete(inv.id)
                                        return next
                                      })
                                    }}
                                  />
                                </td>
                                <td>{inv.nombre}</td>
                                <td>{inv.apellido}</td>
                                <td>{inv.carton_id ? `#${String(inv.cartones?.numero ?? '?').padStart(3, '0')}` : '—'}</td>
                                <td>{badgeInvitado(inv)}</td>
                                <td>
                                  <div className={styles.actionRow}>
                                    <button
                                      className={`${styles.iconBtn} ${inv.oculto ? styles.iconBtnOculto : ''}`}
                                      onClick={() => handleToggleOculto(inv)}
                                      title={inv.oculto ? 'Hacer visible en lista' : 'Ocultar de lista'}
                                    >{inv.oculto ? '🙈' : '👁'}</button>
                                    <button
                                      className={styles.iconBtn}
                                      onClick={() => {
                                        setEditandoId(editandoId === inv.id ? null : inv.id)
                                        setNuevoCartonId('')
                                        setConfirmEliminarId(null)
                                        setConfirmResetearId(null)
                                      }}
                                      title="Cambiar cartón"
                                    >✏</button>
                                    {inv.asignado_at && (
                                      confirmResetearId === inv.id ? (
                                        <>
                                          <button
                                            className={`${styles.iconBtn} ${styles.dangerIconBtn}`}
                                            onClick={() => handleResetearInvitado(inv)}
                                            title="Confirmar reset"
                                          >Sí</button>
                                          <button
                                            className={styles.iconBtn}
                                            onClick={() => setConfirmResetearId(null)}
                                          >No</button>
                                        </>
                                      ) : (
                                        <button
                                          className={styles.iconBtn}
                                          onClick={() => {
                                            setConfirmResetearId(inv.id)
                                            setConfirmEliminarId(null)
                                            setEditandoId(null)
                                          }}
                                          title={`Resetear sesión de ${inv.nombre}`}
                                        >↺</button>
                                      )
                                    )}
                                    {confirmEliminarId === inv.id ? (
                                      <>
                                        <button
                                          className={`${styles.iconBtn} ${styles.dangerIconBtn}`}
                                          onClick={() => handleEliminarInvitado(inv)}
                                        >Sí</button>
                                        <button
                                          className={styles.iconBtn}
                                          onClick={() => setConfirmEliminarId(null)}
                                        >No</button>
                                      </>
                                    ) : (
                                      <button
                                        className={styles.iconBtn}
                                        onClick={() => {
                                          setConfirmEliminarId(inv.id)
                                          setEditandoId(null)
                                          setConfirmResetearId(null)
                                        }}
                                        title={`Eliminar ${inv.nombre}`}
                                      >🗑</button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                              {editandoId === inv.id && (
                                <tr key={`edit-${inv.id}`} className={styles.editRow}>
                                  <td colSpan={6}>
                                    <div className={styles.editInline}>
                                      <span className={styles.hint}>
                                        Cartón actual: {inv.carton_id ? `#${String(inv.cartones?.numero ?? '?').padStart(3, '0')}` : 'Sin asignar'}
                                      </span>
                                      <select
                                        className={styles.invSelect}
                                        value={nuevoCartonId}
                                        onChange={(e) => setNuevoCartonId(e.target.value)}
                                      >
                                        <option value="">— Seleccioná un cartón —</option>
                                        {cartonesSobrantes.map((c) => (
                                          <option key={c.id} value={c.id}>#{String(c.numero).padStart(3, '0')}</option>
                                        ))}
                                      </select>
                                      <button
                                        className={styles.secondaryBtn}
                                        onClick={() => handleGuardarCambioCarton(inv)}
                                        disabled={!nuevoCartonId}
                                      >
                                        Guardar cambio
                                      </button>
                                      <button className={styles.cancelBtn} onClick={() => setEditandoId(null)}>
                                        Cancelar
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* ── Modal: confirmar impresión ─────────────────────────────────────── */}
      {modalImprimir && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            {generandoPDF ? (
              <p className={styles.progresoImprimir}>{progresoImprimir || 'Preparando...'}</p>
            ) : (
              <>
                <p className={styles.modalTitle}>
                  ¿Imprimir {seleccionados.size} {seleccionados.size === 1 ? 'cartón' : 'cartones'}?
                </p>
                <ul className={styles.modalList}>
                  {filteredInvitados
                    .filter((inv) => seleccionados.has(inv.id))
                    .map((inv) => (
                      <li key={inv.id}>
                        {inv.carton_id
                          ? `#${String(inv.cartones?.numero ?? '?').padStart(3, '0')}`
                          : '—'}{' '}
                        · {inv.nombre} {inv.apellido}
                      </li>
                    ))}
                </ul>
                <div className={styles.modalActions}>
                  <button className={styles.cancelBtn} onClick={() => setModalImprimir(false)}>
                    Cancelar
                  </button>
                  <button className={styles.primaryBtn} onClick={handleGenerarPDF}>
                    Generar PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
