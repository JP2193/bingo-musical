import { useState } from 'react'
import { AppProvider } from './store/AppContext'
import { SpotifyTab } from './tabs/SpotifyTab/SpotifyTab'
import { CalibratorTab } from './tabs/CalibratorTab/CalibratorTab'
import { CardsTab } from './tabs/CardsTab/CardsTab'
import { EventoTab } from './tabs/EventoTab/EventoTab'
import styles from './App.module.css'

const TABS = [
  { id: 'evento', label: 'Evento' },
  { id: 'spotify', label: 'Inicio' },
  { id: 'calibrador', label: 'Calibrador' },
  { id: 'cartones', label: 'Cartones' },
]

function AppInner() {
  const [activeTab, setActiveTab] = useState('evento')
  const [homeSignal, setHomeSignal] = useState(0)

  function handleLogoClick() {
    setActiveTab('evento')
    setHomeSignal((s) => s + 1)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <button className={styles.logo} onClick={handleLogoClick}>
          Bingo Musical
        </button>
        <nav className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.main}>
        {activeTab === 'evento' && <EventoTab />}
        {activeTab === 'spotify' && (
          <SpotifyTab
            onGoToCalibrator={() => setActiveTab('calibrador')}
            homeSignal={homeSignal}
          />
        )}
        {activeTab === 'calibrador' && <CalibratorTab onGoToCards={() => setActiveTab('cartones')} />}
        {activeTab === 'cartones' && <CardsTab />}
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
