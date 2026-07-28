import { MATH_FORMAT_OPTIONS_STORAGE_KEY } from '@/constants/mathml'
import type { MathMLFormatOptions } from '@/types/mathml'

type NormalisedMathFormatOptions = Required<MathMLFormatOptions>

type StoredPayload = {
  options?: Partial<MathMLFormatOptions>
  collapsed?: boolean
}

const normaliseOptionFlag = (value: unknown): boolean => value === true

const normaliseMathFormatOptions = (
  options: Partial<MathMLFormatOptions> | null | undefined,
): NormalisedMathFormatOptions => ({
  digitGrouping: normaliseOptionFlag(options?.digitGrouping),
  greekSymbols: normaliseOptionFlag(options?.greekSymbols),
  subscripts: normaliseOptionFlag(options?.subscripts),
})

const readPayload = (): StoredPayload | null => {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(MATH_FORMAT_OPTIONS_STORAGE_KEY)
    if (!raw) return null

    return JSON.parse(raw) as StoredPayload
  } catch {
    return null
  }
}

const writePayload = (payload: StoredPayload) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(MATH_FORMAT_OPTIONS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota/storage errors to avoid blocking rendering.
  }
}

export const mathFormatOptionsStorageService = {
  load(): NormalisedMathFormatOptions | null {
    const payload = readPayload()
    if (!payload) return null
    return normaliseMathFormatOptions(payload?.options)
  },

  save(options: MathMLFormatOptions) {
    const payload = readPayload() ?? {}
    payload.options = normaliseMathFormatOptions(options)
    writePayload(payload)
  },

  loadCollapsed(): boolean | null {
    const payload = readPayload()
    return payload?.collapsed ?? null
  },

  saveCollapsed(collapsed: boolean) {
    const payload = readPayload() ?? {}
    payload.collapsed = collapsed
    writePayload(payload)
  },
}
