export const GITHUB_OAUTH_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
export const GITHUB_OAUTH_SCOPE = 'user:email'
export const OAUTH_STATE_KEY = 'github_oauth_state'

/**
 * Disables login via `VITE_LOGIN_DISABLED`, hiding the login button
 * and making the login and profile pages inaccessible.
 * If `VITE_LOGIN_DISABLED` is not defined, login is shown by default.
 */
export const LOGIN_DISABLED = import.meta.env.VITE_LOGIN_DISABLED === 'true'

export const LOGIN_ERROR_MESSAGES = {
  invalidCredentials: 'Incorrect username or password. Please try again.',
  forbidden: 'Your account does not have permission to sign in here.',
  tooManyRequests: 'Too many login attempts. Please wait a moment and try again.',
  serviceUnavailable: 'The sign-in service is temporarily unavailable. Please try again later.',
  generic: 'Unable to sign in right now. Please try again.',
} as const

export const GITHUB_AUTH_ERROR_MESSAGES = {
  generic: 'GitHub authentication failed. Please try again.',
  stateVerification: 'Sign-in could not be verified. Please try again.',
  oAuthErrorPrefix: 'GitHub sign-in failed.',
  revoke: 'Failed to disconnect GitHub account. Please try again.',
} as const

export const LOGOUT_ERROR_MESSAGES = {
  generic: 'Failed to log out. Please try again.',
} as const
