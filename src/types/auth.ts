export interface LoginCredentials {
  login: string
  password: string
}

export interface GitHubAuthData {
  token: string
  username: string
  name: string
  email: string
  avatar_url: string
}

/**
 * Decoded JWT payload with the standard `exp` claim.
 * The `exp` value is a Unix timestamp (seconds since epoch).
 */
export interface JwtPayload {
  exp: number
  [key: string]: unknown
}
