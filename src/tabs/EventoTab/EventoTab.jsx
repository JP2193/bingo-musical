import { useState, useEffect, useCallback, useRef } from 'react'
import { generateAllUniqueCards } from '../../utils/bingo'
import { printCartones } from '../../utils/printCartones'
import {
  getPlaylists,
  getPlaylistActiva,
  setPlaylistActiva,
  deleteCartonesByPlaylist,
  insertCartonesBatch,
  getEstadoEvento,
  getCancionesCantadas,
  activarCancion,
  desactivarCancion,
  resetCancionesCantadas,
  getRankingCartones,
  getSimulacionData,
  getInvitados,
  getCartonesSobrantes,
  insertInvitadosBatch,
  preasignarCartones,
  cambiarCarton,
  agregarInvitado,
  eliminarInvitado,
  eliminarInvitadosBatch,
  resetearAsignadoAt,
  toggleOcultoInvitado,
  actualizarNombreInvitado,
  desasignarCartones,
  getCartonesTrackIds,
  normalizarStr,
  getNombreEvento,
  setNombreEvento,
} from '../../utils/supabaseEvento'
import styles from './EventoTab.module.css'

const MEDAL = ['🥇', '🥈', '🥉']


function parsearLista(texto) {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const sep = l.includes('\t') ? '\t' : l.includes(';') ? ';' : ','
      const parts = l.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ''))
      const nombre = parts[0] ?? ''
      const apellido = parts[1] ?? ''
      return { nombre, apellido }
    })
    .filter((inv) => {
      const n = inv.nombre.toLowerCase()
      if (['nombre', 'name', 'apellido', 'lastname'].includes(n)) return false
      return inv.nombre
    })
}

function Stepper({ value, onChange, min = 1, max, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.stepper}>
        <button
          className={styles.stepBtn}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >−</button>
        <input
          className={styles.numberInput}
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
        />
        <button
          className={styles.stepBtn}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={max !== undefined && value >= max}
        >+</button>
      </div>
    </div>
  )
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

const SUB_TABS = ['Canciones', 'Ranking', 'Cartones', 'Invitados', 'Simulación']

export function EventoTab() {
  // ── Playlists ──────────────────────────────────────────────────────────────
  const [nombreEvento, setNombreEventoState] = useState('')
  const [savingNombre, setSavingNombre] = useState(false)

  const [playlists, setPlaylists] = useState([])
  const [playlistActivaId, setPlaylistActivaId] = useState('')
  const [settingActiva, setSettingActiva] = useState(false)

  // ── Generador ──────────────────────────────────────────────────────────────
  const [filas, setFilas] = useState(4)
  const [columnas, setColumnas] = useState(4)
  const [cantidad, setCantidad] = useState(120)
  const [generando, setGenerando] = useState(false)
  const [progreso, setProgreso] = useState(null)
  const [exito, setExito] = useState('')
  const [error, setError] = useState('')

  // ── Sub-tabs ───────────────────────────────────────────────────────────────
  const [subTab, setSubTab] = useState('Canciones')

  // ── Canciones ──────────────────────────────────────────────────────────────
  const [cantadas, setCantadas] = useState(new Set())
  const [loadingCanciones, setLoadingCanciones] = useState(false)
  const [confirmResetCanciones, setConfirmResetCanciones] = useState(false)
  const [toggleStates, setToggleStates] = useState({})
  const [toggleErrors, setToggleErrors] = useState({})

  // ── Ranking ────────────────────────────────────────────────────────────────
  const [ranking, setRanking] = useState(null)
  const [loadingRanking, setLoadingRanking] = useState(false)
  const rankingIntervalRef = useRef(null)
  const fileImportRef = useRef(null)

  // ── Cartones (estado evento) ───────────────────────────────────────────────
  const [estado, setEstado] = useState(null)
  const [loadingEstado, setLoadingEstado] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmEliminarCartones, setConfirmEliminarCartones] = useState(false)

  // ── Invitados ──────────────────────────────────────────────────────────────
  const [invitados, setInvitados] = useState([])
  const [cartonesSobrantes, setCartonesSobrantes] = useState([])
  const [loadingInvitados, setLoadingInvitados] = useState(false)
  const [listaImportada, setListaImportada] = useState([])
  const [loadingCarga, setLoadingCarga] = useState(false)
  const [confirmReemplazar, setConfirmReemplazar] = useState(false)
  const [loadingPreasignar, setLoadingPreasignar] = useState(false)
  const [progresoPreasignar, setProgresoPreasignar] = useState('')
  const [buscadorInv, setBuscadorInv] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [nuevoCartonId, setNuevoCartonId] = useState('')
  const [editandoNombreId, setEditandoNombreId] = useState(null)
  const [formEditarNombre, setFormEditarNombre] = useState({ nombre: '', apellido: '' })
  const [loadingEditarNombre, setLoadingEditarNombre] = useState(false)
  const [confirmResetearId, setConfirmResetearId] = useState(null)
  const [mostrandoFormNuevo, setMostrandoFormNuevo] = useState(false)
  const [formNuevo, setFormNuevo] = useState({ nombre: '', apellido: '', cartonId: '' })
  const [loadingFormNuevo, setLoadingFormNuevo] = useState(false)
  const [invMsgExito, setInvMsgExito] = useState('')

  // Selección unificada (impresión y eliminación)
  const [selectedInvitados, setSelectedInvitados] = useState(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loadingDeleteBatch, setLoadingDeleteBatch] = useState(false)


  // ── Simulación ─────────────────────────────────────────────────────────────
  const [simActivada, setSimActivada] = useState(false)
  const [simData, setSimData] = useState(null)
  const [loadingSim, setLoadingSim] = useState(false)
  const simIntervalRef = useRef(null)

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getPlaylists(), getPlaylistActiva(), getNombreEvento()])
      .then(([pls, activa, nombre]) => {
        setPlaylists(pls)
        setPlaylistActivaId(activa)
        setNombreEventoState(nombre)
      })
      .catch(() => {})
  }, [])

  // ── Cargar datos al cambiar playlist activa ────────────────────────────────
  useEffect(() => {
    if (!playlistActivaId) return
    handleCargarCanciones()
  }, [playlistActivaId])

  // ── Limpiar ranking interval al desmontar ──────────────────────────────────
  useEffect(() => {
    return () => {
      clearInterval(rankingIntervalRef.current)
      clearInterval(simIntervalRef.current)
    }
  }, [])

  // ── Cargar datos de sub-tab al cambiar ─────────────────────────────────────
  useEffect(() => {
    if (!playlistActivaId) return
    if (subTab === 'Ranking') handleCargarRanking()
    if (subTab === 'Cartones') handleCargarEstado()
    if (subTab === 'Invitados') handleCargarInvitados()
    if (subTab !== 'Ranking') clearInterval(rankingIntervalRef.current)
    if (subTab !== 'Simulación') clearInterval(simIntervalRef.current)
  }, [subTab, playlistActivaId])

  // ─── Nombre del evento ──────────────────────────────────────────────────────

  async function handleGuardarNombre(valor) {
    setSavingNombre(true)
    try {
      await setNombreEvento(valor.trim())
    } catch {
      // silencioso — no es crítico
    } finally {
      setSavingNombre(false)
    }
  }

  // ─── Playlist activa ────────────────────────────────────────────────────────

  async function handleSetPlaylistActiva(id) {
    setSettingActiva(true)
    try {
      await setPlaylistActiva(id)
      setPlaylistActivaId(id)
      // Limpiar estado de evento anterior
      setCantadas(new Set())
      setRanking(null)
      setEstado(null)
      setInvitados([])
      setSubTab('Canciones')
    } catch (e) {
      setError(e.message)
    } finally {
      setSettingActiva(false)
    }
  }

  const playlistActiva = playlists.find((p) => p.id === playlistActivaId)

  // ─── Generador de cartones ──────────────────────────────────────────────────

  const totalCeldas = filas * columnas
  const tracksDisponibles = playlistActiva?.tracks?.length ?? 0

  async function handleGenerarCartones() {
    if (!playlistActivaId) { setError('Seleccioná una playlist activa primero.'); return }
    if (tracksDisponibles < totalCeldas) {
      setError(`La playlist tiene ${tracksDisponibles} canciones pero el cartón necesita ${totalCeldas}.`)
      return
    }

    setGenerando(true)
    setProgreso(null)
    setExito('')
    setError('')

    try {
      const tracks = playlistActiva.tracks
      const cards = generateAllUniqueCards(tracks, columnas, filas, cantidad)

      await deleteCartonesByPlaylist(playlistActivaId)
      const rows = cards.map((trackIds, i) => ({
        numero: i + 1,
        playlist_id: playlistActivaId,
        track_ids: trackIds,
      }))

      await insertCartonesBatch(rows, (ins, total) =>
        setProgreso(`Guardando... ${ins}/${total}`)
      )

      setExito(`✓ ${cantidad} cartones generados correctamente.`)
      setTimeout(() => setExito(''), 4000)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerando(false)
      setProgreso(null)
    }
  }

  // ─── Canciones ──────────────────────────────────────────────────────────────

  async function handleCargarCanciones() {
    if (!playlistActivaId) return
    setLoadingCanciones(true)
    try {
      const set = await getCancionesCantadas(playlistActivaId)
      setCantadas(set)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingCanciones(false)
    }
  }

  async function handleToggleCancion(trackId, isActive) {
    setToggleStates((prev) => ({ ...prev, [trackId]: 'loading' }))
    setToggleErrors((prev) => { const n = { ...prev }; delete n[trackId]; return n })

    const prev = new Set(cantadas)
    setCantadas((s) => {
      const next = new Set(s)
      isActive ? next.add(trackId) : next.delete(trackId)
      return next
    })

    try {
      if (isActive) await activarCancion(playlistActivaId, trackId)
      else await desactivarCancion(playlistActivaId, trackId)
      setToggleStates((s) => ({ ...s, [trackId]: 'ok' }))
      setTimeout(() => setToggleStates((s) => { const n = { ...s }; delete n[trackId]; return n }), 1200)
    } catch (e) {
      setCantadas(prev)
      setToggleStates((s) => { const n = { ...s }; delete n[trackId]; return n })
      setToggleErrors((s) => ({ ...s, [trackId]: 'Error al guardar' }))
    }
  }

  async function handleResetCanciones() {
    try {
      await resetCancionesCantadas(playlistActivaId)
      setCantadas(new Set())
      setConfirmResetCanciones(false)
    } catch (e) {
      setError(e.message)
    }
  }

  // ─── Ranking ────────────────────────────────────────────────────────────────

  const handleCargarRanking = useCallback(async () => {
    if (!playlistActivaId) return
    setLoadingRanking(true)
    try {
      const data = await getRankingCartones(playlistActivaId)
      setRanking(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingRanking(false)
    }
  }, [playlistActivaId])

  useEffect(() => {
    if (subTab !== 'Ranking' || !playlistActivaId) return
    clearInterval(rankingIntervalRef.current)
    rankingIntervalRef.current = setInterval(handleCargarRanking, 10000)
    return () => clearInterval(rankingIntervalRef.current)
  }, [subTab, playlistActivaId, handleCargarRanking])

  // ─── Cartones (estado) ──────────────────────────────────────────────────────

  async function handleCargarEstado() {
    if (!playlistActivaId) return
    setLoadingEstado(true)
    try {
      const data = await getEstadoEvento(playlistActivaId)
      setEstado(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingEstado(false)
    }
  }

  // ─── Invitados ──────────────────────────────────────────────────────────────

  async function handleCargarInvitados(showSuccess = false) {
    if (!playlistActivaId) return
    setLoadingInvitados(true)
    try {
      const [inv, sobrantes] = await Promise.all([
        getInvitados(playlistActivaId),
        getCartonesSobrantes(playlistActivaId),
      ])
      setInvitados(inv)
      setCartonesSobrantes(sobrantes)
      if (showSuccess) {
        setInvMsgExito('Lista actualizada correctamente')
        setTimeout(() => setInvMsgExito(''), 3000)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingInvitados(false)
    }
  }

  async function ejecutarCargaLista(lista) {
    setLoadingCarga(true)
    try {
      await insertInvitadosBatch(lista, playlistActivaId)
      await handleCargarInvitados()
      setListaImportada([])
      setConfirmReemplazar(false)
      setInvMsgExito(`${lista.length} invitados importados correctamente`)
      setTimeout(() => setInvMsgExito(''), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingCarga(false)
    }
  }

  function handleFileImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lista = parsearLista(ev.target.result)
      if (lista.length === 0) { setError('El archivo no tiene filas válidas. Formato esperado: Nombre,Apellido'); return }
      setListaImportada(lista)
      if (invitados.length > 0) { setConfirmReemplazar(true); return }
      ejecutarCargaLista(lista)
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handlePreasignar() {
    setLoadingPreasignar(true)
    setProgresoPreasignar('')
    try {
      const result = await preasignarCartones(playlistActivaId, (i, total) =>
        setProgresoPreasignar(`Asignando... ${i}/${total}`)
      )
      setProgresoPreasignar(`✓ ${result.asignados} asignados. Sobrantes: ${result.sobrantes}`)
      await handleCargarInvitados()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingPreasignar(false)
    }
  }

  async function handleCambiarCarton(inv) {
    if (!nuevoCartonId) return
    try {
      await cambiarCarton(inv.id, nuevoCartonId, inv.nombre, inv.apellido, inv.carton_id)
      setEditandoId(null)
      setNuevoCartonId('')
      await handleCargarInvitados()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleEliminarInvitado(inv) {
    try {
      await eliminarInvitado(inv.id, inv.carton_id)
      setConfirmEliminarId(null)
      await handleCargarInvitados()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleResetearSesion(invitadoId) {
    try {
      await resetearAsignadoAt(invitadoId)
      setConfirmResetearId(null)
      await handleCargarInvitados()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleAgregarInvitado() {
    const { nombre, apellido, cartonId } = formNuevo
    if (!nombre.trim() || !apellido.trim()) { setError('Completá nombre y apellido.'); return }
    setLoadingFormNuevo(true)
    try {
      await agregarInvitado(nombre.trim(), apellido.trim(), playlistActivaId, cartonId || null)
      setFormNuevo({ nombre: '', apellido: '', cartonId: '' })
      setMostrandoFormNuevo(false)
      await handleCargarInvitados()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingFormNuevo(false)
    }
  }

  // ── Editar nombre ───────────────────────────────────────────────────────────
  async function handleActualizarNombre(inv) {
    const { nombre, apellido } = formEditarNombre
    if (!nombre.trim()) { setError('El nombre no puede estar vacío.'); return }
    setLoadingEditarNombre(true)
    try {
      await actualizarNombreInvitado(inv.id, nombre.trim(), apellido.trim())
      setEditandoNombreId(null)
      await handleCargarInvitados()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingEditarNombre(false)
    }
  }

  // ── Delete batch invitados ──────────────────────────────────────────────────
  async function handleDeleteBatch() {
    setLoadingDeleteBatch(true)
    try {
      const ids = [...selectedInvitados]
      const cartonIds = invitados
        .filter((inv) => ids.includes(inv.id) && inv.carton_id)
        .map((inv) => inv.carton_id)
      await eliminarInvitadosBatch(ids, cartonIds)
      setSelectedInvitados(new Set())
      setShowDeleteModal(false)
      await handleCargarInvitados()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingDeleteBatch(false)
    }
  }

  // ── Toggle oculto ───────────────────────────────────────────────────────────
  async function handleToggleOculto(inv) {
    try {
      await toggleOcultoInvitado(inv.id, !inv.oculto)
      await handleCargarInvitados()
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Imprimir HTML ───────────────────────────────────────────────────────────
  async function handlePrintSelected() {
    const ids = [...selectedInvitados]
    const withCarton = invitados.filter((inv) => ids.includes(inv.id) && inv.carton_id)
    if (withCarton.length === 0) { setError('Los invitados seleccionados no tienen cartón asignado.'); return }

    try {
      const cartonData = await getCartonesTrackIds(withCarton.map((inv) => inv.carton_id))
      const tracks = playlistActiva?.tracks ?? []
      const cartones = withCarton.map((inv) => {
        const c = cartonData.find((cd) => cd.id === inv.carton_id)
        if (!c) return null
        const trackObjs = (c.track_ids ?? [])
          .map((tid) => tracks.find((t) => t.id === tid))
          .filter(Boolean)
        return { numero: c.numero, nombre: inv.nombre, apellido: inv.apellido, tracks: trackObjs }
      }).filter(Boolean)

      printCartones(cartones, columnas, filas)
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Simulación ──────────────────────────────────────────────────────────────
  const handleCargarSim = useCallback(async () => {
    if (!playlistActivaId) return
    setLoadingSim(true)
    try {
      const data = await getSimulacionData(playlistActivaId)
      setSimData(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoadingSim(false)
    }
  }, [playlistActivaId])

  useEffect(() => {
    if (!simActivada || subTab !== 'Simulación') {
      clearInterval(simIntervalRef.current)
      return
    }
    handleCargarSim()
    simIntervalRef.current = setInterval(handleCargarSim, 10000)
    return () => clearInterval(simIntervalRef.current)
  }, [simActivada, subTab, handleCargarSim])

  // ── Búsqueda invitados ──────────────────────────────────────────────────────
  const invFiltrados = invitados.filter((inv) => {
    if (!buscadorInv.trim()) return true
    return normalizarStr(`${inv.nombre} ${inv.apellido}`).includes(normalizarStr(buscadorInv))
  })

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>

      {/* Modal eliminar invitados */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox}>
            <p className={styles.modalTitle}>¿Eliminar invitados?</p>
            <p className={styles.modalBody}>
              Estás a punto de eliminar <strong>{selectedInvitados.size} invitado{selectedInvitados.size !== 1 ? 's' : ''}</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalActions}>
              <button
                className={`${styles.secondaryBtn} ${styles.dangerBtn}`}
                onClick={handleDeleteBatch}
                disabled={loadingDeleteBatch}
              >
                {loadingDeleteBatch ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error global */}
      {error && (
        <div style={{
          padding: '10px 14px',
          background: '#2a1010',
          color: 'var(--danger)',
          fontSize: 13,
          borderLeft: '3px solid var(--danger)',
        }}>
          {error}
          <button style={{ marginLeft: 10, color: 'var(--muted)' }} onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* ── Nombre del evento ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Nombre del Evento</h2>
        <input
          className={styles.buscadorInv}
          type="text"
          placeholder="Ej: Boda Juan y Carla"
          value={nombreEvento}
          onChange={(e) => setNombreEventoState(e.target.value)}
          onBlur={(e) => handleGuardarNombre(e.target.value)}
        />
        {savingNombre && <p className={styles.hint}>Guardando...</p>}
      </section>

      {/* ── Playlist activa ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Playlist activa</h2>
        <div className={styles.activaBox}>
          <div className={styles.activaSelectRow}>
            <select
              className={styles.select}
              value={playlistActivaId}
              onChange={(e) => handleSetPlaylistActiva(e.target.value)}
              disabled={settingActiva}
            >
              <option value="">Seleccionar playlist...</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {playlistActiva && (
            <div className={styles.activaInfo}>
              {playlistActiva.tracks?.length ?? 0} canciones disponibles
            </div>
          )}
        </div>
      </section>

      {/* ── Generador de cartones ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Generar cartones</h2>

        <div className={styles.gridRow}>
          <Stepper label="Columnas" value={columnas} onChange={setColumnas} min={2} max={4} />
          <Stepper label="Filas" value={filas} onChange={setFilas} min={2} max={5} />
        </div>

        <div className={styles.gridHint}>
          Cartones de {columnas}×{filas} — {totalCeldas} canciones por cartón
          {tracksDisponibles > 0 && tracksDisponibles < totalCeldas && (
            <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
              — la playlist solo tiene {tracksDisponibles} canciones
            </span>
          )}
        </div>

        <div className={styles.inputRow}>
          <Stepper label="Cantidad" value={cantidad} onChange={setCantidad} min={1} max={9999} />
        </div>

        {progreso && <p className={styles.progreso}>{progreso}</p>}
        {exito && <p className={styles.exitoMsg}>{exito}</p>}

        <button
          className={styles.primaryBtn}
          onClick={handleGenerarCartones}
          disabled={generando || !playlistActivaId}
        >
          {generando ? 'Generando...' : `Generar ${cantidad} cartones para el evento`}
        </button>
      </section>

      {/* ── Sub-tabs ── */}
      <section className={`${styles.section} ${styles.sectionLast}`}>
        <div className={styles.subTabsNav}>
          {SUB_TABS.map((t) => (
            <button
              key={t}
              className={`${styles.subTabBtn} ${subTab === t ? styles.subTabActive : ''}`}
              onClick={() => setSubTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className={styles.subTabContent}>
          {subTab === 'Canciones' && renderCanciones()}
          {subTab === 'Ranking' && renderRanking()}
          {subTab === 'Cartones' && renderCartones()}
          {subTab === 'Invitados' && renderInvitados()}
          {subTab === 'Simulación' && renderSimulacion()}
        </div>
      </section>
    </div>
  )

  // ─── Renders de sub-tabs ─────────────────────────────────────────────────────

  function renderCanciones() {
    const tracks = playlistActiva?.tracks ?? []

    return (
      <>
        <div className={styles.actionRow}>
          <button className={styles.secondaryBtn} onClick={handleCargarCanciones} disabled={loadingCanciones}>
            {loadingCanciones ? 'Cargando...' : '↺ Actualizar'}
          </button>
          {cantadas.size > 0 && !confirmResetCanciones && (
            <button className={`${styles.secondaryBtn} ${styles.dangerBtn}`} onClick={() => setConfirmResetCanciones(true)}>
              Reiniciar canciones
            </button>
          )}
          {confirmResetCanciones && (
            <>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>¿Reiniciar todas?</span>
              <button className={`${styles.secondaryBtn} ${styles.dangerBtn}`} onClick={handleResetCanciones}>Confirmar</button>
              <button className={styles.cancelBtn} onClick={() => setConfirmResetCanciones(false)}>Cancelar</button>
            </>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)' }}>
            {cantadas.size}/{tracks.length} cantadas
          </span>
        </div>

        {!playlistActiva ? (
          <p className={styles.hint}>Seleccioná una playlist activa para ver las canciones.</p>
        ) : tracks.length === 0 ? (
          <p className={styles.hint}>La playlist no tiene canciones.</p>
        ) : (
          <div className={styles.trackList}>
            {tracks.map((track) => {
              const activa = cantadas.has(track.id)
              const st = toggleStates[track.id]
              const err = toggleErrors[track.id]
              return (
                <div key={track.id} className={`${styles.trackRow} ${activa ? styles.trackRowActive : ''}`}>
                  <div className={styles.trackInfo}>
                    <span className={styles.trackName}>{track.name}</span>
                    <span className={styles.trackArtist}>{track.artist}</span>
                    {err && <span className={styles.toggleError}>{err}</span>}
                  </div>
                  <button
                    className={`${styles.toggle} ${activa ? styles.toggleOn : ''} ${st === 'loading' ? styles.toggleLoading : ''} ${st === 'ok' ? styles.toggleOk : ''}`}
                    onClick={() => st !== 'loading' && handleToggleCancion(track.id, !activa)}
                    disabled={st === 'loading'}
                  >
                    {st === 'loading'
                      ? <span className={styles.toggleSpinner} />
                      : st === 'ok'
                        ? <span className={styles.toggleCheck}>✓</span>
                        : <span className={styles.toggleThumb} />
                    }
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  function renderRanking() {
    return (
      <>
        <div className={styles.actionRow}>
          <button className={styles.secondaryBtn} onClick={handleCargarRanking} disabled={loadingRanking}>
            {loadingRanking ? 'Cargando...' : '↺ Actualizar'}
          </button>
          <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>Auto-actualiza cada 10s</span>
        </div>

        {!ranking ? (
          <p className={styles.hint}>Cargando ranking...</p>
        ) : ranking.length === 0 ? (
          <p className={styles.hint}>No hay invitados con cartón activo todavía.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Invitado</th>
                <th>Cartón</th>
                <th>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row, i) => {
                const bingo = row.tachadas === row.total
                return (
                  <tr key={row.numero} className={bingo ? styles.trBingo : ''}>
                    <td className={styles.rankPos}>{MEDAL[i] ?? i + 1}</td>
                    <td>
                      {row.nombre}
                      {bingo && <span className={styles.bingoBadge}>BINGO</span>}
                    </td>
                    <td>#{row.numero}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span className={styles.rankScore}>{row.tachadas}/{row.total}</span>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${row.pct}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </>
    )
  }

  function renderCartones() {
    return (
      <>
        <div className={styles.actionRow}>
          <button className={styles.secondaryBtn} onClick={handleCargarEstado} disabled={loadingEstado}>
            {loadingEstado ? 'Cargando...' : '↺ Actualizar'}
          </button>
          {estado && !confirmEliminarCartones && (
            <button
              className={`${styles.secondaryBtn} ${styles.dangerBtn}`}
              onClick={() => setConfirmEliminarCartones(true)}
            >
              Eliminar todos los cartones
            </button>
          )}
          {confirmEliminarCartones && (
            <>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>¿Eliminar todos?</span>
              <button
                className={`${styles.secondaryBtn} ${styles.dangerBtn}`}
                onClick={async () => {
                  try {
                    await deleteCartonesByPlaylist(playlistActivaId)
                    setEstado(null)
                    setConfirmEliminarCartones(false)
                  } catch (e) { setError(e.message) }
                }}
              >
                Confirmar
              </button>
              <button className={styles.cancelBtn} onClick={() => setConfirmEliminarCartones(false)}>Cancelar</button>
            </>
          )}
        </div>

        {!estado ? (
          <p className={styles.hint}>Sin datos. Generá cartones primero.</p>
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

            {estado.lista.length > 0 && (
              <table className={styles.table}>
                <thead>
                  <tr><th>Cartón</th><th>Invitado</th><th>Entregado</th></tr>
                </thead>
                <tbody>
                  {estado.lista.map((e) => (
                    <tr key={e.id}>
                      <td>#{e.numero}</td>
                      <td>{e.nombre_invitado}</td>
                      <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {e.entregado_at ? new Date(e.entregado_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </>
    )
  }

  function renderInvitados() {
    const allIds = invFiltrados.map((i) => i.id)
    const todosChecked = allIds.length > 0 && allIds.every((id) => selectedInvitados.has(id))

    return (
      <>
        {/* Input file oculto */}
        <input
          ref={fileImportRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={handleFileImport}
        />

        {/* Acciones principales */}
        <div className={styles.actionRow}>
          <button
            className={styles.secondaryBtn}
            onClick={() => setMostrandoFormNuevo(true)}
          >
            + Agregar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              className={styles.secondaryBtn}
              onClick={() => fileImportRef.current?.click()}
              disabled={loadingCarga}
            >
              {loadingCarga ? 'Cargando...' : 'Importar lista de invitados'}
            </button>
            <span
              className={styles.infoIcon}
              title="CSV con una persona por línea. Columnas: Nombre,Apellido (o separados por tabulación)"
            >ℹ</span>
          </div>
          <button className={styles.secondaryBtn} onClick={() => handleCargarInvitados(true)} disabled={loadingInvitados}>
            ↺
          </button>
        </div>

        {/* Confirmación reemplazar lista */}
        {confirmReemplazar && (
          <div className={styles.confirmBox}>
            <span style={{ fontSize: 13 }}>
              Esto reemplazará la lista actual ({invitados.length} invitados) con {listaImportada.length} invitados del CSV. ¿Continuar?
            </span>
            <div className={styles.actionRow}>
              <button className={`${styles.secondaryBtn} ${styles.dangerBtn}`} onClick={() => ejecutarCargaLista(listaImportada)} disabled={loadingCarga}>
                {loadingCarga ? 'Cargando...' : 'Reemplazar'}
              </button>
              <button className={styles.cancelBtn} onClick={() => { setConfirmReemplazar(false); setListaImportada([]) }}>Cancelar</button>
            </div>
          </div>
        )}

        {/* Formulario agregar */}
        {mostrandoFormNuevo && (
          <div className={styles.formNuevo}>
            <input
              className={styles.invInput}
              placeholder="Nombre"
              value={formNuevo.nombre}
              onChange={(e) => setFormNuevo((p) => ({ ...p, nombre: e.target.value }))}
            />
            <input
              className={styles.invInput}
              placeholder="Apellido"
              value={formNuevo.apellido}
              onChange={(e) => setFormNuevo((p) => ({ ...p, apellido: e.target.value }))}
            />
            <select
              className={styles.invSelect}
              value={formNuevo.cartonId}
              onChange={(e) => setFormNuevo((p) => ({ ...p, cartonId: e.target.value }))}
            >
              <option value="">Sin cartón</option>
              {cartonesSobrantes.map((c) => (
                <option key={c.id} value={c.id}>#{c.numero}</option>
              ))}
            </select>
            <button className={styles.secondaryBtn} onClick={handleAgregarInvitado} disabled={loadingFormNuevo}>
              {loadingFormNuevo ? '...' : 'Agregar'}
            </button>
            <button className={styles.cancelBtn} onClick={() => setMostrandoFormNuevo(false)}>Cancelar</button>
          </div>
        )}

        {/* Pre-asignar */}
        <div className={styles.invSection}>
          <div className={styles.actionRow}>
            <button className={styles.secondaryBtn} onClick={handlePreasignar} disabled={loadingPreasignar}>
              {loadingPreasignar ? 'Asignando...' : 'Pre-asignar cartones en orden'}
            </button>
            {progresoPreasignar && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{progresoPreasignar}</span>}
          </div>
        </div>

        {/* Buscador */}
        <input
          className={styles.buscadorInv}
          placeholder="Buscar invitado..."
          value={buscadorInv}
          onChange={(e) => setBuscadorInv(e.target.value)}
        />

        {/* Mensaje de éxito */}
        {invMsgExito && (
          <p className={styles.exitoMsg}>{invMsgExito}</p>
        )}

        {/* Barra de selección */}
        {selectedInvitados.size > 0 && (
          <div className={styles.selectionBar}>
            <div className={styles.selectionGroup}>
              <span className={styles.selectionCount}>{selectedInvitados.size} seleccionados</span>
              <button className={styles.printBtn} onClick={handlePrintSelected}>
                Imprimir selección
              </button>
            </div>
            <div className={styles.selectionDivider} />
            <div className={styles.selectionGroup}>
              <button className={`${styles.secondaryBtn} ${styles.dangerBtn}`} onClick={() => setShowDeleteModal(true)}>
                Eliminar selección
              </button>
            </div>
          </div>
        )}

        {/* Tabla de invitados */}
        {loadingInvitados ? (
          <p className={styles.hint}>Cargando...</p>
        ) : invFiltrados.length === 0 ? (
          <p className={styles.hint}>{buscadorInv ? 'Sin resultados.' : 'No hay invitados cargados.'}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    checked={todosChecked}
                    onChange={(e) => setSelectedInvitados(e.target.checked ? new Set(allIds) : new Set())}
                  />
                </th>
                <th>Invitado</th>
                <th>Cartón</th>
                <th>Estado</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {invFiltrados.map((inv) => {
                const isEditing = editandoId === inv.id
                const isEditingNombre = editandoNombreId === inv.id
                const isConfirmReset = confirmResetearId === inv.id
                const estadoBadge = inv.asignado_at
                  ? <span className={styles.badgeVerde}>● Activo</span>
                  : inv.carton_id
                    ? <span className={styles.badgeAmarillo}>● Asignado</span>
                    : <span className={styles.badgeGris}>○ Sin cartón</span>

                if (isEditingNombre) {
                  return (
                    <tr key={inv.id} className={styles.editRow}>
                      <td colSpan={5}>
                        <div className={styles.editInline}>
                          <input
                            className={styles.invInput}
                            placeholder="Nombre"
                            value={formEditarNombre.nombre}
                            onChange={(e) => setFormEditarNombre((p) => ({ ...p, nombre: e.target.value }))}
                          />
                          <input
                            className={styles.invInput}
                            placeholder="Apellido"
                            value={formEditarNombre.apellido}
                            onChange={(e) => setFormEditarNombre((p) => ({ ...p, apellido: e.target.value }))}
                          />
                          <button className={styles.iconBtn} onClick={() => handleActualizarNombre(inv)} disabled={loadingEditarNombre}>
                            {loadingEditarNombre ? '...' : 'Guardar'}
                          </button>
                          <button className={styles.cancelBtn} onClick={() => setEditandoNombreId(null)}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                if (isEditing) {
                  return (
                    <tr key={inv.id} className={styles.editRow}>
                      <td colSpan={5}>
                        <div className={styles.editInline}>
                          <span style={{ fontSize: 13 }}>{inv.nombre} {inv.apellido}</span>
                          <select
                            className={styles.invSelect}
                            value={nuevoCartonId}
                            onChange={(e) => setNuevoCartonId(e.target.value)}
                          >
                            <option value="">Seleccionar cartón...</option>
                            {cartonesSobrantes.map((c) => (
                              <option key={c.id} value={c.id}>#{c.numero}</option>
                            ))}
                          </select>
                          <button className={styles.iconBtn} onClick={() => handleCambiarCarton(inv)} disabled={!nuevoCartonId}>Asignar</button>
                          <button className={styles.cancelBtn} onClick={() => { setEditandoId(null); setNuevoCartonId('') }}>Cancelar</button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={inv.id} className={inv.oculto ? styles.trOculto : ''}>
                    <td className={styles.checkCell}>
                      <input
                        type="checkbox"
                        checked={selectedInvitados.has(inv.id)}
                        onChange={(e) => {
                          setSelectedInvitados((prev) => {
                            const next = new Set(prev)
                            e.target.checked ? next.add(inv.id) : next.delete(inv.id)
                            return next
                          })
                        }}
                      />
                    </td>
                    <td>{inv.nombre} {inv.apellido}</td>
                    <td>{inv.cartones?.numero ? `#${inv.cartones.numero}` : '—'}</td>
                    <td>{estadoBadge}</td>
                    <td>
                      {isConfirmReset ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className={`${styles.iconBtn} ${styles.dangerIconBtn}`} onClick={() => handleResetearSesion(inv.id)}>✓</button>
                          <button className={styles.cancelBtn} onClick={() => setConfirmResetearId(null)}>✕</button>
                        </div>
                      ) : (
                        <div className={styles.rowActions}>
                          <button
                            className={styles.iconBtn}
                            title="Editar nombre"
                            onClick={() => { setEditandoNombreId(inv.id); setFormEditarNombre({ nombre: inv.nombre, apellido: inv.apellido }) }}
                          >✎</button>
                          <button
                            className={styles.iconBtn}
                            title="Cambiar cartón"
                            onClick={() => { setEditandoId(inv.id); setNuevoCartonId('') }}
                          >⇅</button>
                          <button
                            className={styles.iconBtn}
                            title="Reiniciar sesión"
                            onClick={() => setConfirmResetearId(inv.id)}
                          >↺</button>
                          <button
                            className={`${styles.iconBtn} ${inv.oculto ? styles.iconBtnActive : ''}`}
                            title={inv.oculto ? 'Mostrar en juego' : 'Ocultar del juego'}
                            onClick={() => handleToggleOculto(inv)}
                          >👁</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </>
    )
  }

  function renderSimulacion() {
    return (
      <>
        <div className={styles.simHeader}>
          <div className={styles.simToggleRow}>
            <span>Activar simulación</span>
            <button
              className={`${styles.toggle} ${simActivada ? styles.toggleOn : ''}`}
              onClick={() => setSimActivada(!simActivada)}
            >
              <span className={styles.toggleThumb} />
            </button>
            <span>{simActivada ? 'SÍ' : 'NO'}</span>
          </div>
          {simActivada && (
            <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>Auto-actualiza cada 10s</span>
          )}
        </div>

        {!simActivada ? (
          <div className={styles.simOff}>
            Activá la simulación para ver los cartones de todos los invitados en tiempo real.
          </div>
        ) : loadingSim ? (
          <p className={styles.hint}>Cargando...</p>
        ) : !simData || simData.length === 0 ? (
          <p className={styles.hint}>No hay invitados con cartón asignado todavía.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Invitado</th>
                <th>Cartón</th>
                <th>Temas</th>
                <th>Progreso</th>
              </tr>
            </thead>
            <tbody>
              {simData.map((row, i) => {
                const bingo = row.tachadas === row.total
                return (
                  <tr key={row.numero} className={bingo ? styles.trBingo : ''}>
                    <td className={styles.rankPos}>{MEDAL[i] ?? i + 1}</td>
                    <td>
                      {row.nombre}
                      {bingo && <span className={styles.bingoBadge}>BINGO</span>}
                    </td>
                    <td>#{row.numero}</td>
                    <td className={styles.rankScore}>{row.tachadas}/{row.total}</td>
                    <td>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${row.pct}%` }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </>
    )
  }
}
