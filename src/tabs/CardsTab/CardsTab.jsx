import { useRef, useState } from 'react'
import * as ReactDOM from 'react-dom/client'
import { useAppContext } from '../../store/AppContext'
import { generateCard, generateUniqueCard } from '../../utils/bingo'
import { imageUrlToBase64, captureCard, saveCardPNG } from '../../utils/export'
import { BingoCard } from '../../components/BingoCard/BingoCard'
import { Stepper } from '../../components/UI/Stepper'
import { ProgressBar } from '../../components/UI/ProgressBar'
import { ErrorBanner } from '../../components/UI/ErrorBanner'
import styles from './CardsTab.module.css'

export function CardsTab() {
  const {
    state,
    setCurrentCard,
    addToPreviousCards,
    clearPreviousCards,
    setLoteSize,
    setLoteProgress,
    updateCurrentCardCell,
  } = useAppContext()

  const { tracks, gridSize, calibration, currentCard, previousCards, loteSize, loteProgress } =
    state

  const cardRef = useRef(null)
  const cancelRef = useRef(false)
  const [cardNumber, setCardNumber] = useState(0)
  const [error, setError] = useState(null)
  const [exportDone, setExportDone] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  const { cols, rows } = gridSize
  const requiredTracks = cols * rows
  const canGenerate = tracks.length >= requiredTracks && calibration.imageUrl

  function handleGenerate() {
    setError(null)
    setExportDone(null)
    if (!canGenerate) {
      if (!calibration.imageUrl) setError('Cargá una imagen en el Calibrador primero.')
      else setError('Cargá una playlist con suficientes canciones primero.')
      return
    }

    try {
      const card = generateCard(tracks, cols, rows)
      const n = cardNumber + 1
      setCardNumber(n)
      setCurrentCard(card)
      addToPreviousCards(card)
      clearPreviousCards()
      addToPreviousCards(card)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleAleatoria() {
    setError(null)
    setExportDone(null)
    if (!canGenerate) {
      if (!calibration.imageUrl) setError('Cargá una imagen en el Calibrador primero.')
      else setError('Cargá una playlist con suficientes canciones primero.')
      return
    }

    try {
      const card = generateUniqueCard(tracks, cols, rows, previousCards)
      const n = cardNumber + 1
      setCardNumber(n)
      setCurrentCard(card)
      addToPreviousCards(card)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSavePNG() {
    if (!currentCard || !cardRef.current) return
    setError(null)

    try {
      // Convertir miniaturas del cartón actual a base64
      const base64Map = {}
      await Promise.all(
        currentCard.map(async (track) => {
          if (track.thumbnail) {
            try {
              base64Map[track.id] = await imageUrlToBase64(track.thumbnail)
            } catch {
              // fallback se encargará en BingoCell
            }
          }
        })
      )

      // Actualizar el cardRef con base64Map inyectado
      // Como el BingoCard visible no tiene base64, hacemos captura del elemento ya visible
      // pero primero debemos re-renderizarlo con base64Map off-screen
      const container = document.createElement('div')
      container.style.cssText =
        'position:absolute;left:-9999px;top:-9999px;width:800px;pointer-events:none;'
      document.body.appendChild(container)

      const root = ReactDOM.createRoot(container)
      root.render(
        <BingoCard
          card={currentCard}
          calibration={calibration}
          gridSize={gridSize}
          base64Map={base64Map}
        />
      )

      await new Promise((r) => setTimeout(r, 80))

      const cardEl = container.firstChild
      const blob = await captureCard(cardEl)
      const filename = `bingo-${String(cardNumber).padStart(3, '0')}.png`
      saveCardPNG(blob, filename)

      root.unmount()
      document.body.removeChild(container)
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    }
  }

  async function handleExportLote() {
    if (!canGenerate) {
      setError('Necesitás playlist e imagen cargadas para exportar.')
      return
    }

    if (typeof window.showDirectoryPicker !== 'function') {
      setError('Tu navegador no soporta esta función. Usá Chrome o Edge.')
      return
    }

    setError(null)
    setExportDone(null)
    cancelRef.current = false

    let dirHandle
    try {
      dirHandle = await window.showDirectoryPicker()
    } catch {
      // Usuario canceló el selector
      return
    }

    setIsExporting(true)
    const allCards = []

    try {
      for (let i = 1; i <= loteSize; i++) {
        if (cancelRef.current) break

        // Generar cartón único
        let card
        try {
          card = generateUniqueCard(tracks, cols, rows, allCards)
        } catch {
          // Si se agota el pool, usar generateCard sin unicidad
          card = generateCard(tracks, cols, rows)
        }
        allCards.push(card)

        // Convertir miniaturas a base64
        const base64Map = {}
        await Promise.all(
          card.map(async (track) => {
            if (track.thumbnail) {
              try {
                base64Map[track.id] = await imageUrlToBase64(track.thumbnail)
              } catch {
                // fallback
              }
            }
          })
        )

        // Render off-screen
        const container = document.createElement('div')
        container.style.cssText =
          'position:absolute;left:-9999px;top:-9999px;width:800px;pointer-events:none;'
        document.body.appendChild(container)

        const root = ReactDOM.createRoot(container)
        root.render(
          <BingoCard
            card={card}
            calibration={calibration}
            gridSize={gridSize}
            base64Map={base64Map}
          />
        )

        await new Promise((r) => setTimeout(r, 80))

        const cardEl = container.firstChild
        const blob = await captureCard(cardEl)

        root.unmount()
        document.body.removeChild(container)

        // Escribir en carpeta
        const filename = `bingo-${String(i).padStart(3, '0')}.png`
        const fh = await dirHandle.getFileHandle(filename, { create: true })
        const writable = await fh.createWritable()
        await writable.write(blob)
        await writable.close()

        setLoteProgress({ current: i, total: loteSize })
        await new Promise((r) => setTimeout(r, 0)) // ceder el hilo
      }

      if (!cancelRef.current) {
        setExportDone(`✓ ${loteSize} cartones guardados en la carpeta seleccionada`)
      }
    } catch (err) {
      setError('Error durante la exportación: ' + err.message)
    } finally {
      setIsExporting(false)
      setLoteProgress(null)
    }
  }

  return (
    <div className={styles.layout}>

      {/* ── Panel izquierdo: controles ── */}
      <aside className={styles.controls}>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {exportDone && (
          <div className={styles.successBanner}>{exportDone}</div>
        )}

        {/* Grid 2×2 de botones */}
        <div className={styles.btnGrid}>
          {/* Generar tarjeta */}
          <button
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={handleGenerate}
            disabled={isExporting}
          >
            <span className={styles.btnIcon}>✦</span>
            <span>Generar tarjeta</span>
          </button>

          {/* Otra aleatoria */}
          <button
            className={`${styles.actionBtn} ${styles.secondary}`}
            onClick={handleAleatoria}
            disabled={isExporting}
          >
            <span className={styles.btnIcon}>↺</span>
            <span>Otra aleatoria</span>
          </button>

          {/* Guardar PNG */}
          <button
            className={`${styles.actionBtn} ${styles.secondary}`}
            onClick={handleSavePNG}
            disabled={!currentCard || isExporting}
          >
            <span className={styles.btnIcon}>💾</span>
            <span>Guardar PNG</span>
          </button>

          {/* Exportar lote */}
          <div className={styles.loteBtnWrapper}>
            <button
              className={`${styles.actionBtn} ${styles.loteBtn}`}
              onClick={handleExportLote}
              disabled={isExporting}
            >
              <span className={styles.btnIcon}>📁</span>
              <span>Exportar lote</span>
            </button>
            <div className={styles.stepperRow}>
              <Stepper
                value={loteSize}
                min={5}
                max={500}
                step={5}
                onChange={setLoteSize}
              />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {loteProgress && (
          <div className={styles.progressSection}>
            <ProgressBar
              current={loteProgress.current}
              total={loteProgress.total}
              label={`Guardando ${loteProgress.current} de ${loteProgress.total}...`}
            />
            <button
              className={styles.cancelBtn}
              onClick={() => { cancelRef.current = true }}
            >
              Cancelar
            </button>
          </div>
        )}
      </aside>

      {/* ── Panel derecho: preview del cartón ── */}
      <div className={styles.preview}>
        {currentCard ? (
          <div className={styles.cardWrapper} ref={cardRef}>
            <BingoCard
              card={currentCard}
              calibration={calibration}
              gridSize={gridSize}
              base64Map={null}
              editMode={true}
              onEditCell={(index, patch) => updateCurrentCardCell(index, patch)}
            />
            {cardNumber > 0 && (
              <div className={styles.cardNumber}>#{String(cardNumber).padStart(3, '0')}</div>
            )}
          </div>
        ) : (
          <div className={styles.noCard}>
            {calibration.imageUrl
              ? 'Generá un cartón para ver la vista previa'
              : 'Cargá una imagen en el Calibrador primero'}
          </div>
        )}
      </div>

    </div>
  )
}
