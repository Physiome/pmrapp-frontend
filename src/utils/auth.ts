import { GITHUB_OAUTH_SCOPE, OAUTH_STATE_KEY } from '@/constants/auth'
import type { JwtPayload } from '@/types/auth'

export const getGitHubRedirectUri = (appBaseUrl: string): string =>
  new URL('login', new URL(appBaseUrl, window.location.origin)).toString()

export const getGitHubOAuthParams = (clientId: string, redirectUri: string) => ({
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: GITHUB_OAUTH_SCOPE,
})

/**
 * Generates a cryptographically random state value for OAuth CSRF protection.
 */
export const generateOAuthState = (): string => crypto.randomUUID()

/**
 * Stores the OAuth state value in sessionStorage before redirecting to GitHub.
 */
export const storeOAuthState = (state: string): void => {
  sessionStorage.setItem(OAUTH_STATE_KEY, state)
}

/**
 * Validates the incoming OAuth state against the stored value and removes it
 * from sessionStorage (one-time use). Uses a constant-time comparison to
 * prevent timing attacks.
 */
export const validateOAuthState = (expectedState: string | null): boolean => {
  if (!expectedState) return false

  const storedState = sessionStorage.getItem(OAUTH_STATE_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)

  if (!storedState) return false
  if (storedState.length !== expectedState.length) return false

  let result = 0
  for (let i = 0; i < storedState.length; i++) {
    result |= storedState.charCodeAt(i) ^ expectedState.charCodeAt(i)
  }

  return result === 0
}

/**
 * Decodes the payload (middle segment) of a JWT without verifying the signature.
 * Used to read the `exp` claim so the client can proactively clear local auth state
 * and redirect when a stored token has expired.
 *
 * Returns `null` if the token is malformed or the payload cannot be parsed.
 *
 * @example { "exp": 1785288286, "iat": 1785284686, "sub": "abc1234567DEF" } (full token)
 * @example { "exp": 1785288286 } (minimal token)
 * @example null (malformed token)
 */
export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const segments = token.split('.')
    if (segments.length !== 3) return null

    const payload = segments[1]
    // Convert URL-safe base64 to standard base64 and add padding.
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const decoded = atob(padded)

    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

/**
 * Checks whether a JWT has expired by comparing its `exp` claim
 * against the current time. Returns `true` if expired or malformed.
 */
export const isJwtExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true

  return payload.exp < 0.001 * Date.now()
}
