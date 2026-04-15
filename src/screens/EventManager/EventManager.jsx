import { useState, useEffect } from 'react'
import { getEventos, crearEvento, eliminarEvento } from '../../utils/supabaseEvento'
import styles from './EventManager.module.css'

export function EventManager({ onAbrirEvento, onGestionarPlaylists }) {
  const [eventos, setEventos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [creando, setCreando] = useState(false)
  const [confirmEliminarId, setConfirmEliminarId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setCargando(true)
    try {
      const data = await getEventos()
      setEventos(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function handleCrear() {
    const nombre = nuevoNombre.trim()
    if (!nombre) return
    setCreando(true)
    setError('')
    try {
      const evento = await crearEvento(nombre)
      setNuevoNombre('')
      setMostrarForm(false)
      onAbrirEvento(evento.id)
    } catch (e) {
      setError(e.message)
      setCreando(false)
    }
  }

  async function handleEliminar(id) {
    try {
      await eliminarEvento(id)
      setConfirmEliminarId(null)
      setEventos((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  function eventoCode(id) {
    return id.substring(0, 8).toUpperCase()
  }

  return (
    <div className={styles.container}>
      <div className={styles.inner}>

        {error && (
          <div className={styles.errorBar}>
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Mis Eventos</h2>
          <div className={styles.headerActions}>
            <button className={styles.playlistsBtn} onClick={onGestionarPlaylists}>
              Playlists
            </button>
            {!mostrarForm && (
              <button className={styles.newBtn} onClick={() => setMostrarForm(true)}>
                + Nuevo evento
              </button>
            )}
          </div>
        </div>

        {mostrarForm && (
          <div className={styles.formNuevo}>
            <input
              className={styles.input}
              type="text"
              placeholder="Nombre del evento (ej: Boda Juan y Carla)"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCrear()}
              autoFocus
              disabled={creando}
            />
            <div className={styles.formActions}>
              <button
                className={styles.primaryBtn}
                onClick={handleCrear}
                disabled={!nuevoNombre.trim() || creando}
              >
                {creando ? 'Creando...' : 'Crear evento →'}
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => { setMostrarForm(false); setNuevoNombre('') }}
                disabled={creando}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {cargando ? (
          <p className={styles.hint}>Cargando eventos...</p>
        ) : eventos.length === 0 ? (
          <p className={styles.hint}>No tenés eventos aún. Creá uno para empezar.</p>
        ) : (
          <ul className={styles.lista}>
            {eventos.map((ev) => {
              const configurado = !!(ev.playlist_id && ev.cols && ev.rows)
              return (
                <li key={ev.id} className={styles.item}>
                  {confirmEliminarId === ev.id ? (
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmText}>¿Eliminar "{ev.nombre}"? Se borrarán los cartones e invitados.</span>
                      <button
                        className={`${styles.iconBtn} ${styles.dangerBtn}`}
                        onClick={() => handleEliminar(ev.id)}
                      >
                        Confirmar
                      </button>
                      <button className={styles.cancelBtn} onClick={() => setConfirmEliminarId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <button className={styles.itemMain} onClick={() => onAbrirEvento(ev.id, ev.nombre)}>
                        <span className={styles.itemNombre}>{ev.nombre}</span>
                        <div className={styles.itemMeta}>
                          <span className={styles.itemCode}>{eventoCode(ev.id)}</span>
                          <span className={`${styles.itemBadge} ${configurado ? styles.badgeOk : styles.badgePendiente}`}>
                            {configurado ? 'Configurado' : 'Sin configurar'}
                          </span>
                        </div>
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setConfirmEliminarId(ev.id)}
                        title="Eliminar evento"
                      >
                        ✕
                      </button>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}

      </div>
    </div>
  )
}
