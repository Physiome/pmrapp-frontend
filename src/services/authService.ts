import type { LoginCredentials } from '@/types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const LOGIN_ERROR_MESSAGES = {
  invalidCredentials: 'Incorrect username or password. Please try again.',
  forbidden: 'Your account does not have permission to sign in here.',
  tooManyRequests: 'Too many login attempts. Please wait a moment and try again.',
  serviceUnavailable: 'The sign-in service is temporarily unavailable. Please try again later.',
  generic: 'Unable to sign in right now. Please try again.',
} as const

const normaliseErrorText = (errorText: string): string => {
  const trimmed = errorText.trim()
  return trimmed.replace(/^['\"]|['\"]$/g, '')
}

const getKnownLoginErrorMessage = (key: string): string | undefined => {
  if (key === 'invalidcredentials' || key === 'invalid_credentials') {
    return LOGIN_ERROR_MESSAGES.invalidCredentials
  }

  return undefined
}

const getLoginErrorMessageByStatus = (status: number): string => {
  if (status === 401) {
    return LOGIN_ERROR_MESSAGES.invalidCredentials
  }

  if (status === 403) {
    return LOGIN_ERROR_MESSAGES.forbidden
  }

  if (status === 429) {
    return LOGIN_ERROR_MESSAGES.tooManyRequests
  }

  if (status >= 500) {
    return LOGIN_ERROR_MESSAGES.serviceUnavailable
  }

  return LOGIN_ERROR_MESSAGES.generic
}

const mapLoginErrorMessage = (errorText: string, status: number): string => {
  if (!errorText) {
    return getLoginErrorMessageByStatus(status)
  }

  const normalisedText = normaliseErrorText(errorText)
  const normalisedKey = normalisedText.toLowerCase()
  const mappedMessage = getKnownLoginErrorMessage(normalisedKey)

  if (mappedMessage) {
    return mappedMessage
  }

  // If backend returns machine-style codes, avoid exposing raw text.
  const looksLikeMachineCode = /^[a-z0-9_-]+$/i.test(normalisedText) || /^[A-Z][a-zA-Z0-9]+$/.test(normalisedText)
  if (looksLikeMachineCode) {
    return getLoginErrorMessageByStatus(status)
  }

  // Preserve human-readable backend detail for unknown cases.
  return normalisedText || getLoginErrorMessageByStatus(status)
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/bearer/from_login_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const errorMessage = mapLoginErrorMessage(errorText, response.status)
      throw new Error(errorMessage)
    }

    const token = await response.text()
    return token
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('auth_token')

    const response = await fetch(`${API_BASE_URL}/api/sign_out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.status}`)
    }
  },
}
