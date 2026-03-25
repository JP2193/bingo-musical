import { createContext, useContext, useReducer } from 'react'

const initialState = {
  // Auth
  spotifyToken: null,
  tokenExpiry: null,

  // Playlist
  playlist: null,      // { id, name, imageUrl, totalTracks }
  tracks: [],          // [{ id, name, artist, thumbnail }]

  // Config
  gridSize: { cols: 4, rows: 4 },
  cardQuantity: 10,

  // Calibrador
  calibration: {
    imageFile: null,
    imageUrl: null,
    gridX: 10,
    gridY: 30,
    gridWidth: 80,
    gridHeight: 60,
    gapSize: 2,
    borderColor: '#000000',
    borderWidth: 1,
    outerBorderColor: '#000000',
    outerBorderWidth: 2,
    overlayOpacity: 0.3,
    fontSize: 9,
    textColor: '#000000',
    cellBg: '#ffffff',
    // New visual params
    cellBorderRadius: 0,
    innerBordersOnly: false,
    overlayColor: '#ffffff',
    cellPadding: 2,
    // Thumbnail controls
    showThumbnail: true,
    thumbnailSize: 'auto',
  },

  // Cartones
  currentCard: null,
  previousCards: [],

  // Lote
  loteSize: 50,
  loteProgress: null,  // { current, total } | null
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, spotifyToken: action.payload.token, tokenExpiry: action.payload.expiry }

    case 'SET_PLAYLIST':
      return { ...state, playlist: action.payload }

    case 'SET_TRACKS':
      return { ...state, tracks: action.payload }

    case 'SET_GRID_SIZE':
      return { ...state, gridSize: action.payload }

    case 'SET_CARD_QUANTITY':
      return { ...state, cardQuantity: action.payload }

    case 'UPDATE_CALIBRATION':
      return { ...state, calibration: { ...state.calibration, ...action.payload } }

    case 'RESET_CALIBRATION':
      return { ...state, calibration: { ...initialState.calibration } }

    case 'SET_CURRENT_CARD':
      return { ...state, currentCard: action.payload }

    case 'UPDATE_CURRENT_CARD_CELL': {
      if (!state.currentCard) return state
      const updated = [...state.currentCard]
      updated[action.payload.index] = { ...updated[action.payload.index], ...action.payload.patch }
      return { ...state, currentCard: updated }
    }

    case 'ADD_TO_PREVIOUS_CARDS':
      return { ...state, previousCards: [...state.previousCards, action.payload] }

    case 'CLEAR_PREVIOUS_CARDS':
      return { ...state, previousCards: [] }

    case 'RESET_PLAYLIST':
      return { ...state, playlist: null, tracks: [], currentCard: null, previousCards: [] }

    case 'SET_LOTE_SIZE':
      return { ...state, loteSize: action.payload }

    case 'SET_LOTE_PROGRESS':
      return { ...state, loteProgress: action.payload }

    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const actions = {
    setToken: (token, expiry) => dispatch({ type: 'SET_TOKEN', payload: { token, expiry } }),
    setPlaylist: (playlist) => dispatch({ type: 'SET_PLAYLIST', payload: playlist }),
    setTracks: (tracks) => dispatch({ type: 'SET_TRACKS', payload: tracks }),
    setGridSize: (gridSize) => dispatch({ type: 'SET_GRID_SIZE', payload: gridSize }),
    setCardQuantity: (qty) => dispatch({ type: 'SET_CARD_QUANTITY', payload: qty }),
    updateCalibration: (patch) => dispatch({ type: 'UPDATE_CALIBRATION', payload: patch }),
    resetCalibration: () => dispatch({ type: 'RESET_CALIBRATION' }),
    setCurrentCard: (card) => dispatch({ type: 'SET_CURRENT_CARD', payload: card }),
    updateCurrentCardCell: (index, patch) =>
      dispatch({ type: 'UPDATE_CURRENT_CARD_CELL', payload: { index, patch } }),
    addToPreviousCards: (card) => dispatch({ type: 'ADD_TO_PREVIOUS_CARDS', payload: card }),
    clearPreviousCards: () => dispatch({ type: 'CLEAR_PREVIOUS_CARDS' }),
    resetPlaylist: () => dispatch({ type: 'RESET_PLAYLIST' }),
    setLoteSize: (size) => dispatch({ type: 'SET_LOTE_SIZE', payload: size }),
    setLoteProgress: (progress) => dispatch({ type: 'SET_LOTE_PROGRESS', payload: progress }),
  }

  return (
    <AppContext.Provider value={{ state, ...actions }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext debe usarse dentro de AppProvider')
  return ctx
}
