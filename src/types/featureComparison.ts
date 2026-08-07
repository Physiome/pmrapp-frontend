/**
 * Type definitions for Feature Comparison data.
 */

export interface ComparisonRow extends Record<string, unknown> {
  id: string | number
  [key: string]: unknown
}

export interface ParseCompleteResults {
  data: ComparisonRow[]
  errors: ParseError[]
  meta: ParseMeta
}

export interface ParseError {
  type: string
  code: string
  message: string
  row?: number
}

export interface ParseMeta {
  delimiter: string
  linebreak: string
  aborted: boolean
  truncated: boolean
  cursor: number
  fields?: string[]
}

export interface ParseErrorEvent {
  name: string
  message: string
}
