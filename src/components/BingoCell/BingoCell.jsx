import { useRef, useState } from 'react'
import { getImageFallbackColor } from '../../utils/spotify'
import styles from './BingoCell.module.css'

export function BingoCell({
  track,
  base64Url,
  textColor = '#000000',
  cellBg = '#ffffff',
  editMode = false,
  onEdit,
  showThumbnail = true,
  thumbnailSize = 'auto',
}) {
  const [imgError, setImgError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftArtist, setDraftArtist] = useState('')
  const nameRef = useRef(null)

  if (!track) return <div className={styles.cell} style={{ background: cellBg }} />

  const imgSrc = base64Url ?? track.thumbnail
  const fallbackColor = getImageFallbackColor(track.artist ?? '')
  const initial = track.artist?.[0]?.toUpperCase() ?? '?'
  const fontSize = track._fontSize ?? 9
  const artistSize = Math.round(fontSize * 0.85)

  const imgAreaStyle = !showThumbnail
    ? { display: 'none' }
    : thumbnailSize === 'small'  ? { flex: '0 1 25%', minHeight: 0 }
    : thumbnailSize === 'medium' ? { flex: '0 1 45%', minHeight: 0 }
    : thumbnailSize === 'large'  ? { flex: '0 1 65%', minHeight: 0 }
    : {} // auto: la clase CSS maneja flex: 1

  function handleDoubleClick() {
    if (!editMode) return
    setDraftName(track.name)
    setDraftArtist(track.artist)
    setEditing(true)
    setTimeout(() => nameRef.current?.select(), 30)
  }

  function handleSave() {
    onEdit?.({
      name: draftName.trim() || track.name,
      artist: draftArtist.trim() || track.artist,
    })
    setEditing(false)
  }

  function handleCancel() {
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  return (
    <div
      className={`${styles.cell} ${editMode ? styles.editMode : ''} ${!showThumbnail ? styles.noThumb : ''}`}
      style={{ background: cellBg }}
      onDoubleClick={handleDoubleClick}
    >
      {/* Área de imagen */}
      <div className={styles.imgArea} style={imgAreaStyle}>
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={track.name}
            className={styles.img}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.fallback} style={{ backgroundColor: fallbackColor }}>
            <span>{initial}</span>
          </div>
        )}
      </div>

      {/* Área de texto */}
      <div className={styles.textArea}>
        <span
          className={styles.name}
          style={{ fontSize: `${fontSize}px`, color: textColor }}
        >
          {track.name}
        </span>
        <span
          className={styles.artist}
          style={{ fontSize: `${artistSize}px`, color: textColor }}
        >
          {track.artist}
        </span>
      </div>

      {/* Form de edición inline */}
      {editing && (
        <div className={styles.editForm} onClick={(e) => e.stopPropagation()}>
          <input
            ref={nameRef}
            className={styles.editInput}
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nombre de la canción"
          />
          <input
            className={styles.editInput}
            value={draftArtist}
            onChange={(e) => setDraftArtist(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Artista"
          />
          <div className={styles.editBtns}>
            <button className={styles.editSave} onClick={handleSave} title="Guardar (Enter)">✓</button>
            <button className={styles.editCancel} onClick={handleCancel} title="Cancelar (Esc)">✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
