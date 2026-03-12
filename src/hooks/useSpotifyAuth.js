import { useAppContext } from '../store/AppContext'

const CLIENT_ID = '06f4f8ffcc9a46d383b2ce2a8261d5ef'
const REDIRECT_URI = window.location.origin
const SCOPES = 'playlist-read-private playlist-read-collaborative user-read-private'

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer)
  let str = ''
  for (const byte of bytes) str += String.fromCharCode(byte)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function generateCodeVerifier() {
  const array = new Uint8Array(64)
  crypto.getRandomValues(array)
  return base64urlEncode(array)
}

async function generateCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return base64urlEncode(digest)
}

// ─── Storage helpers ───────────────────────────────────────────────────────────

function saveToken(accessToken, expiresIn) {
  sessionStorage.setItem('spotify_token', accessToken)
  sessionStorage.setItem('token_expiry', String(Date.now() + expiresIn * 1000))
}

export function getStoredToken() {
  const token = sessionStorage.getItem('spotify_token')
  const expiry = Number(sessionStorage.getItem('token_expiry'))
  if (!token || !expiry) return null
  if (Date.now() >= expiry) return null
  return token
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpotifyAuth() {
  const { setToken } = useAppContext()

  async function redirectToSpotifyAuth() {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)

    sessionStorage.setItem('pkce_verifier', verifier)

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      scope: SCOPES,
    })

    window.location.href = `https://accounts.spotify.com/authorize?${params}`
  }

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (!code) return

    const verifier = sessionStorage.getItem('pkce_verifier')
    if (!verifier) return

    // Limpiar ANTES del fetch para evitar doble ejecución (React StrictMode)
    sessionStorage.removeItem('pkce_verifier')
    window.history.replaceState({}, '', '/')

    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        code_verifier: verifier,
      })

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })

      if (!response.ok) throw new Error('Token exchange failed')

      const data = await response.json()
      console.log('✅ Scopes otorgados por Spotify:', data.scope)
      saveToken(data.access_token, data.expires_in)
      setToken(data.access_token, Date.now() + data.expires_in * 1000)
    } catch (err) {
      console.error('Error en handleCallback:', err)
    }
  }

  return { redirectToSpotifyAuth, handleCallback, getStoredToken }
}
