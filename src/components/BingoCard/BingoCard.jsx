import { GridOverlay } from '../GridOverlay/GridOverlay'
import styles from './BingoCard.module.css'

/**
 * Cartón de bingo renderizable.
 * card        → array de tracks para este cartón
 * calibration → configuración de posición y estilos
 * gridSize    → { cols, rows }
 * base64Map   → { [trackId]: dataURL } — solo al exportar, null en preview
 * editMode    → true en preview de CardsTab para permitir editar celdas con double-click
 * onEditCell  → (cellIndex, patch) => void
 */
export function BingoCard({
  card,
  calibration,
  gridSize,
  base64Map = null,
  editMode = false,
  onEditCell,
}) {
  if (!calibration.imageUrl) {
    return (
      <div className={styles.empty}>
        Cargá una imagen en el Calibrador
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <img
        src={calibration.imageUrl}
        alt=""
        className={styles.img}
      />
      {card ? (
        <GridOverlay
          calibration={calibration}
          gridSize={gridSize}
          previewMode={false}
          card={card}
          base64Map={base64Map}
          editMode={editMode}
          onEditCell={onEditCell}
        />
      ) : (
        <div className={styles.noCard}>Generá un cartón</div>
      )}
    </div>
  )
}
