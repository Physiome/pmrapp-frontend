/**
 * Build-time validation of the environment variables required to build the app.
 *
 * `vite build` runs this validation before compiling: if a required variable is
 * missing or invalid, the build fails with a list of every problem so the
 * deployment can be fixed instead of shipping a broken bundle.
 *
 * Note that only `VITE_`-prefixed variables are read from `.env` files; the
 * `SKIP_ENV_VALIDATION` bypass flag must be provided as a real environment
 * variable (for example in CI) rather than in a `.env` file.
 */

export interface EnvVarProblem {
  /** The name of the environment variable, for example `VITE_API_BASE_URL`. */
  name: string
  /** A human-readable explanation of why the variable is not acceptable. */
  reason: string
}

export interface EnvValidationResult {
  problems: EnvVarProblem[]
}

interface RequiredVarSpec {
  name: string
  description: string
  type: 'url' | 'text'
}

/**
 * Variables that must be set for a production build. See DEPLOYMENT.md for the
 * full list and descriptions.
 */
const REQUIRED_VARS: RequiredVarSpec[] = [
  {
    name: 'VITE_API_BASE_URL',
    description: 'base URL of the PMR backend API (search, exposures, workspaces)',
    type: 'url',
  },
  {
    name: 'VITE_DOWNLOAD_API',
    description: 'base URL of the download service (COMBINE and workspace archives)',
    type: 'url',
  },
  {
    name: 'VITE_GITHUB_CLIENT_ID',
    description: 'public client ID of the GitHub OAuth application',
    type: 'text',
  },
  {
    name: 'VITE_GITHUB_AUTH_API',
    description: 'base URL of the GitHub OAuth authentication API',
    type: 'url',
  },
  {
    name: 'VITE_FEATURE_COMPARISON_SHEET_CSV_URL',
    description: 'CSV file URL for the feature comparison page',
    type: 'url',
  },
]

/** GA4 measurement IDs look like `G-XXXXXXXXXX`. */
const GA4_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{6,}$/i

/**
 * Validate the environment variables required to build the app.
 * @param env - The environment variables available to the build (typically the
 * result of Vite's `loadEnv`).
 * @returns The list of problems found; empty when the environment is acceptable.
 */
export function validateRequiredEnv(env: Record<string, string | undefined>): EnvValidationResult {
  const problems: EnvVarProblem[] = []

  for (const spec of REQUIRED_VARS) {
    const value = env[spec.name]

    if (!isPresent(value)) {
      problems.push({
        name: spec.name,
        reason: `variable is missing or empty (${spec.description})`,
      })
      continue
    }

    if (spec.type === 'url' && !isValidHttpUrl(value)) {
      problems.push({
        name: spec.name,
        reason: `expected an absolute http(s) URL but got "${value}" (${spec.description})`,
      })
    }
  }

  // Analytics is optional, but when it is set it must look like a GA4 ID.
  const gaMeasurementId = env.VITE_GA_MEASUREMENT_ID
  if (isPresent(gaMeasurementId) && !GA4_MEASUREMENT_ID_PATTERN.test(gaMeasurementId)) {
    problems.push({
      name: 'VITE_GA_MEASUREMENT_ID',
      reason: `expected a GA4 measurement ID in the format G-XXXXXXXXXX but got "${gaMeasurementId}" (optional; leave unset to disable analytics)`,
    })
  }

  // Feedback URL is optional, but when it is set it must be an absolute http(s) URL.
  const githubIssuesUrl = env.VITE_GITHUB_ISSUES_URL
  if (isPresent(githubIssuesUrl) && !isValidHttpUrl(githubIssuesUrl)) {
    problems.push({
      name: 'VITE_GITHUB_ISSUES_URL',
      reason: `expected an absolute http(s) URL but got "${githubIssuesUrl}" (optional; leave unset to use the default issues link)`,
    })
  }

  return { problems }
}

/**
 * Format the validation problems into a single actionable error message.
 * @param problems - The problems reported by {@link validateRequiredEnv}.
 * @returns A multi-line message listing every variable that needs attention.
 */
export function formatEnvValidationProblems(problems: EnvVarProblem[]): string {
  const lines = [
    'Build aborted: required environment variables are missing or invalid.',
    '',
    ...problems.map((problem) => `  - ${problem.name}: ${problem.reason}`),
    '',
    'Set the missing or invalid variables in your environment or in a local .env file,',
    'then run the build again. See .env.example for the full template and',
    'DEPLOYMENT.md for deployment guidance.',
  ]
  return lines.join('\n')
}

function isPresent(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
