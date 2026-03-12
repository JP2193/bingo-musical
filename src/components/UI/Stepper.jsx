import styles from './Stepper.module.css'

export function Stepper({ value, min, max, step = 1, onChange }) {
  function decrement() {
    const next = value - step
    if (next >= min) onChange(next)
  }

  function increment() {
    const next = value + step
    if (next <= max) onChange(next)
  }

  return (
    <div className={styles.stepper}>
      <button
        className={styles.btn}
        onClick={decrement}
        disabled={value <= min}
        aria-label="Decrementar"
      >
        −
      </button>
      <span className={styles.value}>{value}</span>
      <button
        className={styles.btn}
        onClick={increment}
        disabled={value >= max}
        aria-label="Incrementar"
      >
        +
      </button>
    </div>
  )
}
