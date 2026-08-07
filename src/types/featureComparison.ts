/**
 * Type definitions for Feature Comparison data.
 */

export interface ComparisonRow extends Record<string, unknown> {
  id: string | number
  [key: string]: unknown
}

/**
 * Parse result from Papa Parse.
 * @see https://www.papaparse.com/docs#results
 */
export interface ParseCompleteResults {
  /** Array of parsed rows—each row is an array or object depending on header setting. */
  data: ComparisonRow[]
  /** Array of errors encountered during parsing. */
  errors: ParseError[]
  /** Metadata about the parse operation. */
  meta: ParseMeta
}

/**
 * Error object from Papa Parse.
 * @see https://www.papaparse.com/docs#errors
 */
export interface ParseError {
  /** Type of error: 'Quotes', 'Delimiter', or 'FieldMismatch'. */
  type: 'Quotes' | 'Delimiter' | 'FieldMismatch'
  /** Standardised error code. */
  code:
    | 'MissingQuotes'
    | 'UndetectableDelimiter'
    | 'TooFewFields'
    | 'TooManyFields'
  /** Human-readable error message. */
  message: string
  /** Row index where the error occurred. */
  row?: number
}

/**
 * Metadata from a Papa Parse operation.
 * @see https://www.papaparse.com/docs#meta
 */
export interface ParseMeta {
  /** Delimiter used in the parse. */
  delimiter: string
  /** Line break sequence used in the parse. */
  linebreak: string
  /** Whether the parse was aborted. */
  aborted: boolean
  /** Whether preview consumed all input. */
  truncated: boolean
  /** Current cursor position in the input. */
  cursor: number
  /** Array of field names (only when header: true). */
  fields?: string[]
  /** Headers that were automatically renamed to avoid duplication. */
  renamedHeaders?: Record<string, string>
}

/**
 * Parse error event from Papa Parse error callback.
 * Note: This may differ from ParseError depending on the error context.
 */
export interface ParseErrorEvent {
  name: string
  message: string
}
