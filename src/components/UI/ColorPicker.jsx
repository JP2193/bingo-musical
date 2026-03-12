import { useRef } from 'react'
import styles from './ColorPicker.module.css'

export function ColorPicker({ label, value, onChange }) {
  const inputRef = useRef(null)

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div
        className={styles.preview}
        style={{ backgroundColor: value }}
        onClick={() => inputRef.current?.click()}
        title={value}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.input}
        aria-label={label}
      />
    </div>
  )
}
