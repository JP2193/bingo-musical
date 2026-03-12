import styles from './ErrorBanner.module.css'

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className={styles.banner} role="alert">
      <span className={styles.message}>{message}</span>
      {onDismiss && (
        <button className={styles.dismiss} onClick={onDismiss} aria-label="Cerrar">
          ×
        </button>
      )}
    </div>
  )
}
