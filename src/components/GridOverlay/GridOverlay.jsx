import { BingoCell } from '../BingoCell/BingoCell'

/**
 * Overlay de grilla sobre la imagen del cartón.
 * previewMode=true  → celdas semitransparentes para calibrar (sin contenido)
 * previewMode=false → celdas con contenido (BingoCell)
 * editMode=true     → celdas editables con double-click (solo en preview de CardsTab)
 */
export function GridOverlay({
  calibration,
  gridSize,
  previewMode,
  card,
  base64Map,
  editMode = false,
  onEditCell,
}) {
  const {
    gridX,
    gridY,
    gridWidth,
    gridHeight,
    gapSize,
    borderColor,
    borderWidth,
    outerBorderColor,
    outerBorderWidth,
    overlayOpacity,
    fontSize,
    textColor = '#000000',
    cellBg = '#ffffff',
    // New visual params (with safe defaults for backwards compatibility)
    cellBorderRadius = 0,
    innerBordersOnly = false,
    cellPadding = 2,
  } = calibration

  const { cols, rows } = gridSize
  const totalCells = cols * rows

  // Convert overlayOpacity (0–1) to 2-char hex suffix for colour
  const alphaHex = Math.round(overlayOpacity * 255).toString(16).padStart(2, '0')

  // When cells have rounded corners the container needs a slightly larger radius
  // to avoid showing square corners through the gap + border.
  const containerRadius =
    cellBorderRadius > 0
      ? cellBorderRadius + Math.max(outerBorderWidth, 1) + Math.ceil(gapSize / 2)
      : 0

  const containerStyle = {
    position: 'absolute',
    left: `${gridX}%`,
    top: `${gridY}%`,
    width: `${gridWidth}%`,
    height: `${gridHeight}%`,
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap: `${gapSize}px`,
    border: `${outerBorderWidth}px solid ${outerBorderColor}`,
    boxSizing: 'border-box',
    // innerBordersOnly: container background shows through the gap acting as inner border
    background: innerBordersOnly ? borderColor : 'transparent',
    borderRadius: containerRadius > 0 ? `${containerRadius}px` : undefined,
    overflow: containerRadius > 0 ? 'hidden' : undefined,
  }

  const cellStyle = previewMode
    ? {
        // Usa cellBg con opacidad para que el calibrador muestre el color real de la celda
        backgroundColor: `${cellBg}${alphaHex}`,
        border: innerBordersOnly ? 'none' : `${borderWidth}px solid ${borderColor}`,
        borderRadius: cellBorderRadius > 0 ? `${cellBorderRadius}px` : undefined,
        boxSizing: 'border-box',
        overflow: cellBorderRadius > 0 ? 'hidden' : undefined,
        padding: cellPadding > 0 ? `${cellPadding}px` : undefined,
      }
    : {
        border: innerBordersOnly ? 'none' : `${borderWidth}px solid ${borderColor}`,
        borderRadius: cellBorderRadius > 0 ? `${cellBorderRadius}px` : undefined,
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        padding: cellPadding > 0 ? `${cellPadding}px` : undefined,
      }

  return (
    <div style={containerStyle}>
      {Array.from({ length: totalCells }).map((_, i) => {
        const track = card?.[i]
          ? { ...card[i], _fontSize: fontSize }
          : null

        return (
          <div key={i} style={cellStyle}>
            {!previewMode && track && (
              <BingoCell
                track={track}
                base64Url={base64Map?.[track.id]}
                textColor={textColor}
                cellBg={cellBg}
                editMode={editMode}
                onEdit={(patch) => onEditCell?.(i, patch)}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
