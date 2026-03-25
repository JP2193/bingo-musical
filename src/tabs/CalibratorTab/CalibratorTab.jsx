import { useEffect, useRef, useState } from 'react'
import { useAppContext } from '../../store/AppContext'
import { useCalibrator } from '../../hooks/useCalibrator'
import { Slider } from '../../components/UI/Slider'
import { ColorPicker } from '../../components/UI/ColorPicker'
import { ErrorBanner } from '../../components/UI/ErrorBanner'
import { GridOverlay } from '../../components/GridOverlay/GridOverlay'
import styles from './CalibratorTab.module.css'

const GRID_OPTIONS = [
  { label: '3×3', cols: 3, rows: 3 },
  { label: '3×4', cols: 3, rows: 4 },
  { label: '4×4', cols: 4, rows: 4 },
  { label: '5×5', cols: 5, rows: 5 },
]

export function CalibratorTab({ onGoToCards }) {
  const { state, setGridSize } = useAppContext()
  const { calibration, gridSize } = state
  const { handleImageUpload, updateParam, saveToLocalStorage, loadFromLocalStorage, reset } =
    useCalibrator()

  const [error, setError] = useState(null)
  const [showGuides, setShowGuides] = useState(true)
  const [savedBadge, setSavedBadge] = useState(false)
  const [imgDimensions, setImgDimensions] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)

  // Cargar calibración guardada al montar
  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  function processFile(file) {
    const err = handleImageUpload(file)
    if (err) setError(err.error)

    const img = new Image()
    img.onload = () => {
      setImgDimensions({ w: img.naturalWidth, h: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  function onSave() {
    saveToLocalStorage()
    setSavedBadge(true)
    setTimeout(() => setSavedBadge(false), 2000)
  }

  function onSaveAndContinue() {
    saveToLocalStorage()
    onGoToCards?.()
  }

  return (
    <div className={styles.layout}>
      {/* Panel izquierdo: controles */}
      <aside className={styles.controls}>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />

        {/* Posición */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>📐 Posición</h3>
          <Slider
            label="Posición X"
            min={0}
            max={100}
            step={0.5}
            value={calibration.gridX}
            onChange={(v) => updateParam('gridX', v)}
            unit="%"
          />
          <Slider
            label="Posición Y"
            min={0}
            max={100}
            step={0.5}
            value={calibration.gridY}
            onChange={(v) => updateParam('gridY', v)}
            unit="%"
          />
        </section>

        {/* Tamaño */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>📏 Tamaño</h3>
          <Slider
            label="Ancho"
            min={10}
            max={100}
            step={0.5}
            value={calibration.gridWidth}
            onChange={(v) => updateParam('gridWidth', v)}
            unit="%"
          />
          <Slider
            label="Alto"
            min={10}
            max={100}
            step={0.5}
            value={calibration.gridHeight}
            onChange={(v) => updateParam('gridHeight', v)}
            unit="%"
          />
        </section>

        {/* Celdas */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>#️⃣ Celdas</h3>
          <p className={styles.readOnly}>
            Columnas: {gridSize.cols} · Filas: {gridSize.rows}
          </p>
          <Slider
            label="Radio de esquinas"
            min={0}
            max={20}
            step={1}
            value={calibration.cellBorderRadius}
            onChange={(v) => updateParam('cellBorderRadius', v)}
            unit="px"
          />
          <Slider
            label="Padding interno"
            min={0}
            max={12}
            step={1}
            value={calibration.cellPadding}
            onChange={(v) => updateParam('cellPadding', v)}
            unit="px"
          />
        </section>

        {/* Miniaturas */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>🖼 Miniaturas</h3>
          <label
            className={styles.toggleRow}
            onClick={() => updateParam('showThumbnail', !calibration.showThumbnail)}
          >
            <span className={styles.toggleLabel}>Mostrar miniaturas</span>
            <div className={`${styles.toggleSwitch} ${calibration.showThumbnail ? styles.toggleOn : ''}`} />
          </label>
          {calibration.showThumbnail && (
            <>
              <div className={styles.thumbSizeRow}>
                {[
                  { value: 'auto', label: 'Auto' },
                  { value: 'small', label: 'Pequeña' },
                  { value: 'medium', label: 'Mediana' },
                  { value: 'large', label: 'Grande' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    className={`${styles.thumbSizeBtn} ${calibration.thumbnailSize === value ? styles.active : ''}`}
                    onClick={() => updateParam('thumbnailSize', value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {calibration.thumbnailSize !== 'auto' && (
                <p className={styles.toggleHint}>
                  Mantiene el tamaño elegido si hay espacio. Si el texto lo necesita, la imagen se achica.
                </p>
              )}
            </>
          )}
        </section>

        {/* Texto */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>🔤 Texto</h3>
          <Slider
            label="Tamaño de fuente"
            min={4}
            max={18}
            step={0.5}
            value={calibration.fontSize}
            onChange={(v) => updateParam('fontSize', v)}
            unit="px"
          />
          <ColorPicker
            label="Color del texto"
            value={calibration.textColor}
            onChange={(v) => updateParam('textColor', v)}
          />
          <ColorPicker
            label="Fondo de celda"
            value={calibration.cellBg}
            onChange={(v) => updateParam('cellBg', v)}
          />
        </section>

        {/* Bordes */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>🎨 Bordes</h3>

          {/* Toggle: Solo bordes internos */}
          <label
            className={styles.toggleRow}
            onClick={() => updateParam('innerBordersOnly', !calibration.innerBordersOnly)}
          >
            <span className={styles.toggleLabel}>Solo bordes internos</span>
            <div className={`${styles.toggleSwitch} ${calibration.innerBordersOnly ? styles.toggleOn : ''}`} />
          </label>
          {calibration.innerBordersOnly && (
            <p className={styles.toggleHint}>
              El gap actúa como grosor de las líneas internas. El color interior define el color de las divisiones.
            </p>
          )}

          {calibration.innerBordersOnly ? (
            <>
              <Slider
                label="Grosor de líneas (gap)"
                min={0}
                max={20}
                step={1}
                value={calibration.gapSize}
                onChange={(v) => updateParam('gapSize', v)}
                unit="px"
              />
              <ColorPicker
                label="Color de líneas"
                value={calibration.borderColor}
                onChange={(v) => updateParam('borderColor', v)}
              />
            </>
          ) : (
            <>
              <Slider
                label="Grosor interno"
                min={0}
                max={5}
                step={0.5}
                value={calibration.borderWidth}
                onChange={(v) => updateParam('borderWidth', v)}
                unit="px"
              />
              <ColorPicker
                label="Color interno"
                value={calibration.borderColor}
                onChange={(v) => updateParam('borderColor', v)}
              />
              <Slider
                label="Gap entre celdas"
                min={0}
                max={20}
                step={1}
                value={calibration.gapSize}
                onChange={(v) => updateParam('gapSize', v)}
                unit="px"
              />
            </>
          )}

          <Slider
            label="Grosor exterior"
            min={0}
            max={8}
            step={0.5}
            value={calibration.outerBorderWidth}
            onChange={(v) => updateParam('outerBorderWidth', v)}
            unit="px"
          />
          <ColorPicker
            label="Color exterior"
            value={calibration.outerBorderColor}
            onChange={(v) => updateParam('outerBorderColor', v)}
          />
        </section>

        {/* Overlay (preview) */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>👁 Overlay</h3>
          <Slider
            label="Opacidad"
            min={0}
            max={1}
            step={0.05}
            value={calibration.overlayOpacity}
            onChange={(v) => updateParam('overlayOpacity', v)}
          />
          <p className={styles.toggleHint}>
            Al 100% las celdas se ven igual que en el cartón final. Bajá la opacidad para ver la imagen de fondo al calibrar.
          </p>
        </section>

        {/* Tamaño de grilla */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>⊞ Tamaño de grilla</h3>
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
        </section>

        {/* Acciones */}
        <div className={styles.btnRow}>
          <button className={styles.saveBtn} onClick={onSave}>
            💾 Guardar valores
            {savedBadge && <span className={styles.badge}>✓ Guardado</span>}
          </button>
          <button
            className={styles.toggleBtn}
            onClick={() => setShowGuides((v) => !v)}
          >
            {showGuides ? '🙈 Ocultar guías' : '👁 Mostrar guías'}
          </button>
          <button className={styles.resetBtn} onClick={reset}>
            ↩ Restablecer
          </button>
        </div>
      </aside>

      {/* Panel derecho: preview */}
      <div className={styles.preview}>
        {calibration.imageUrl ? (
          <div className={styles.imageWrapper}>
            <button className={styles.saveAndContinueBtn} onClick={onSaveAndContinue}>
              💾 Guardar y continuar al Generador de Cartones →
            </button>
            <div className={styles.imgCanvas}>
              <img
                src={calibration.imageUrl}
                alt="Vista previa del cartón"
                className={styles.previewImg}
              />
              {showGuides && (
                <GridOverlay
                  calibration={calibration}
                  gridSize={gridSize}
                  previewMode={true}
                />
              )}
            </div>
          </div>
        ) : (
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file) processFile(file)
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={onFileChange}
            />
            <div className={styles.dropZoneIcon}>+</div>
            <p className={styles.dropZoneText}>Cargá la imagen o arrastrá tu archivo</p>
          </div>
        )}
      </div>
    </div>
  )
}
