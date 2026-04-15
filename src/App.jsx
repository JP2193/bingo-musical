import { AppProvider } from './store/AppContext'
import { useAuth } from './hooks/useAuth'
import { PlaylistTab } from './tabs/PlaylistTab/PlaylistTab'
import { EventManager } from './screens/EventManager/EventManager'
import { EventDetail } from './screens/EventDetail/EventDetail'
import styles from './App.module.css'
import { useState } from 'react'

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

function LoginScreen({ onSignIn }) {
  const [codigoInvitado, setCodigoInvitado] = useState('')

  function handleInvitado() {
    const codigo = codigoInvitado.trim().toUpperCase()
    if (!codigo) return
    window.location.href = `https://bingo-boda.vercel.app/${codigo}`
  }

  return (
    <div className={styles.loginScreen}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>Bingo Musical</h1>

        <div className={styles.loginSection}>
          <p className={styles.loginSectionLabel}>Soy organizador</p>
          <button className={styles.loginBtn} onClick={onSignIn}>
            {GOOGLE_ICON}
            Iniciar sesión con Google
          </button>
        </div>

        <div className={styles.loginDivider}>
          <span>o</span>
        </div>

        <div className={styles.loginSection}>
          <p className={styles.loginSectionLabel}>Soy invitado</p>
          <input
            className={styles.loginInput}
            type="text"
            placeholder="Ingresar código del evento..."
            value={codigoInvitado}
            onChange={(e) => setCodigoInvitado(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInvitado()}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          <button
            className={styles.loginBtnGuest}
            onClick={handleInvitado}
            disabled={!codigoInvitado.trim()}
          >
            Ingresar al evento →
          </button>
        </div>
      </div>
    </div>
  )
}

function AppInner() {
  const { user, loading, signIn, signOut } = useAuth()
  const [screen, setScreen] = useState('events') // 'events' | 'eventDetail' | 'playlists'
  const [selectedEventoId, setSelectedEventoId] = useState(null)
  const [selectedEventoNombre, setSelectedEventoNombre] = useState('')

  if (loading) {
    return <div className={styles.loadingScreen}><span>Cargando...</span></div>
  }

  if (!user) {
    return <LoginScreen onSignIn={signIn} />
  }

  function handleAbrirEvento(id, nombre) {
    setSelectedEventoId(id)
    setSelectedEventoNombre(nombre ?? '')
    setScreen('eventDetail')
  }

  function handleVolverAEventos() {
    setSelectedEventoId(null)
    setSelectedEventoNombre('')
    setScreen('events')
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        {screen === 'events' ? (
          <span className={styles.logo}>Bingo Musical</span>
        ) : (
          <button className={styles.headerBackBtn} onClick={handleVolverAEventos}>
            ‹ Eventos
          </button>
        )}
        <div className={styles.userArea}>
          <span className={styles.userEmail}>{user.email}</span>
          <button className={styles.logoutBtn} onClick={signOut}>Salir</button>
        </div>
      </header>

      <main className={styles.main}>
        {screen === 'events' && (
          <EventManager
            onAbrirEvento={handleAbrirEvento}
            onGestionarPlaylists={() => setScreen('playlists')}
          />
        )}
        {screen === 'eventDetail' && selectedEventoId && (
          <EventDetail
            eventoId={selectedEventoId}
            onVolver={handleVolverAEventos}
            onGestionarPlaylists={() => setScreen('playlists')}
            onNombreChange={(nombre) => setSelectedEventoNombre(nombre)}
          />
        )}
        {screen === 'playlists' && (
          <PlaylistTab />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
