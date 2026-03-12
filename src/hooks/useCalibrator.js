import { useAppContext } from '../store/AppContext'

const STORAGE_KEY = 'bingo_calibration'

export function useCalibrator() {
  const { state, updateCalibration, resetCalibration } = useAppContext()
  const { calibration } = state

  function handleImageUpload(file) {
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      return { error: 'La imagen supera los 10MB. Usá una imagen más liviana.' }
    }

    // Revocar URL anterior para liberar memoria
    if (calibration.imageUrl) {
      URL.revokeObjectURL(calibration.imageUrl)
    }

    const imageUrl = URL.createObjectURL(file)
    updateCalibration({ imageFile: file, imageUrl })
    return null
  }

  function updateParam(key, value) {
    updateCalibration({ [key]: value })
  }

  function saveToLocalStorage() {
    // Excluir imageFile e imageUrl (no serializables)
    const { imageFile, imageUrl, ...persistable } = calibration
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable))
  }

  function loadFromLocalStorage() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const stored = JSON.parse(raw)
      // imageUrl e imageFile quedan null — el usuario re-carga la imagen
      updateCalibration(stored)
    } catch {
      // JSON inválido, ignorar
    }
  }

  function reset() {
    if (calibration.imageUrl) {
      URL.revokeObjectURL(calibration.imageUrl)
    }
    resetCalibration()
  }

  return { handleImageUpload, updateParam, saveToLocalStorage, loadFromLocalStorage, reset }
}
