import { describe, expect, it } from 'vitest'
import { formatEnvValidationProblems, validateRequiredEnv } from './validateEnv'

const validEnv = {
  VITE_API_BASE_URL: 'https://api.example.com',
  VITE_DOWNLOAD_API: 'https://downloads.example.com',
  VITE_GITHUB_CLIENT_ID: 'Ov23liExampleClientId',
  VITE_GITHUB_AUTH_API: 'https://auth.example.com',
  VITE_FEATURE_COMPARISON_SHEET_CSV_URL: 'https://example.com/features.csv',
}

describe('validateRequiredEnv', () => {
  it('accepts a fully configured environment', () => {
    expect(validateRequiredEnv(validEnv).problems).toEqual([])
  })

  it('reports all missing required variables', () => {
    const { problems } = validateRequiredEnv({})
    expect(problems.map((problem) => problem.name)).toEqual([
      'VITE_API_BASE_URL',
      'VITE_DOWNLOAD_API',
      'VITE_GITHUB_CLIENT_ID',
      'VITE_GITHUB_AUTH_API',
      'VITE_FEATURE_COMPARISON_SHEET_CSV_URL',
    ])
  })

  it('treats whitespace-only values as missing', () => {
    const { problems } = validateRequiredEnv({ VITE_API_BASE_URL: '   ' })
    expect(problems.some((problem) => problem.name === 'VITE_API_BASE_URL')).toBe(true)
  })

  it('rejects URLs without a scheme', () => {
    const { problems } = validateRequiredEnv({ ...validEnv, VITE_API_BASE_URL: 'localhost:9380' })
    const problem = problems.find((p) => p.name === 'VITE_API_BASE_URL')
    expect(problem?.reason).toContain('absolute http(s) URL')
  })

  it('rejects non-http(s) protocols', () => {
    const { problems } = validateRequiredEnv({
      ...validEnv,
      VITE_DOWNLOAD_API: 'ftp://example.com',
    })
    expect(problems.some((problem) => problem.name === 'VITE_DOWNLOAD_API')).toBe(true)
  })

  it('rejects malformed URLs', () => {
    const { problems } = validateRequiredEnv({ ...validEnv, VITE_GITHUB_AUTH_API: 'not a url' })
    expect(problems.some((problem) => problem.name === 'VITE_GITHUB_AUTH_API')).toBe(true)
  })

  it('accepts http and https URLs', () => {
    const env = {
      ...validEnv,
      VITE_API_BASE_URL: 'http://localhost:9380',
      VITE_DOWNLOAD_API: 'https://example.com/',
    }
    expect(validateRequiredEnv(env).problems).toEqual([])
  })

  it('does not require an optional GA measurement ID', () => {
    expect(validateRequiredEnv(validEnv).problems).toEqual([])
  })

  it('accepts a valid GA4 measurement ID', () => {
    const env = { ...validEnv, VITE_GA_MEASUREMENT_ID: 'G-ABC123DEFG' }
    expect(validateRequiredEnv(env).problems).toEqual([])
  })

  it('accepts a valid GitHub issues URL using HTTPS', () => {
    const env = { ...validEnv, VITE_GITHUB_ISSUES_URL: 'https://github.com/Physiome/pmrapp-frontend/issues' }
    expect(validateRequiredEnv(env).problems).toEqual([])
  })

  it('rejects a GitHub issues URL that is not HTTPS', () => {
    const { problems } = validateRequiredEnv({
      ...validEnv,
      VITE_GITHUB_ISSUES_URL: 'http://github.com/Physiome/pmrapp-frontend/issues',
    })
    expect(problems.some((problem) => problem.name === 'VITE_GITHUB_ISSUES_URL')).toBe(true)
  })

  it('rejects an invalid GitHub issues URL', () => {
    const { problems } = validateRequiredEnv({ ...validEnv, VITE_GITHUB_ISSUES_URL: 'not a url' })
    expect(problems.some((problem) => problem.name === 'VITE_GITHUB_ISSUES_URL')).toBe(true)
  })

  it('rejects a GA measurement ID that is not GA4 format', () => {
    const { problems } = validateRequiredEnv({ ...validEnv, VITE_GA_MEASUREMENT_ID: 'UA-12345-1' })
    expect(problems.some((problem) => problem.name === 'VITE_GA_MEASUREMENT_ID')).toBe(true)
  })
})

describe('formatEnvValidationProblems', () => {
  it('lists each problem with its variable name and reason', () => {
    const message = formatEnvValidationProblems([
      { name: 'VITE_API_BASE_URL', reason: 'variable is missing or empty' },
      { name: 'VITE_DOWNLOAD_API', reason: 'expected an absolute http(s) URL' },
    ])
    expect(message).toContain('VITE_API_BASE_URL')
    expect(message).toContain('VITE_DOWNLOAD_API')
    expect(message).toContain('variable is missing or empty')
    expect(message).toContain('.env.example')
  })
})
