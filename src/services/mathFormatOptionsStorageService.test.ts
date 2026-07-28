import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MATH_FORMAT_OPTIONS_STORAGE_KEY } from '@/constants/mathml'
import { mathFormatOptionsStorageService } from './mathFormatOptionsStorageService'

describe('mathFormatOptionsStorageService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('load', () => {
    it('returns null when there is no saved state', () => {
      expect(mathFormatOptionsStorageService.load()).toBeNull()
    })

    it('loads saved options when payload is valid', () => {
      localStorage.setItem(
        MATH_FORMAT_OPTIONS_STORAGE_KEY,
        JSON.stringify({
          options: {
            digitGrouping: false,
            greekSymbols: true,
            subscripts: true,
          },
        }),
      )

      expect(mathFormatOptionsStorageService.load()).toEqual({
        digitGrouping: false,
        greekSymbols: true,
        subscripts: true,
      })
    })

    it('defaults missing option fields to false', () => {
      localStorage.setItem(
        MATH_FORMAT_OPTIONS_STORAGE_KEY,
        JSON.stringify({
          options: {
            subscripts: true,
          },
        }),
      )

      expect(mathFormatOptionsStorageService.load()).toEqual({
        digitGrouping: false,
        greekSymbols: false,
        subscripts: true,
      })
    })

    it('defaults malformed option values to false', () => {
      localStorage.setItem(
        MATH_FORMAT_OPTIONS_STORAGE_KEY,
        JSON.stringify({
          options: {
            digitGrouping: 1,
            greekSymbols: null,
            subscripts: 'true',
          },
        }),
      )

      expect(mathFormatOptionsStorageService.load()).toEqual({
        digitGrouping: false,
        greekSymbols: false,
        subscripts: false,
      })
    })

    it('handles legacy payload with transformMaths field', () => {
      // Old format that included transformMaths — the service should ignore it and just return options.
      localStorage.setItem(
        MATH_FORMAT_OPTIONS_STORAGE_KEY,
        JSON.stringify({
          transformMaths: true,
          options: {
            digitGrouping: true,
            greekSymbols: false,
            subscripts: true,
          },
        }),
      )

      expect(mathFormatOptionsStorageService.load()).toEqual({
        digitGrouping: true,
        greekSymbols: false,
        subscripts: true,
      })
    })

    it('returns null when saved payload is not valid JSON', () => {
      localStorage.setItem(MATH_FORMAT_OPTIONS_STORAGE_KEY, '{broken-json')

      expect(mathFormatOptionsStorageService.load()).toBeNull()
    })

    it('returns null when localStorage throws while loading', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      expect(mathFormatOptionsStorageService.load()).toBeNull()
    })
  })

  describe('save', () => {
    it('writes normalised options to localStorage', () => {
      mathFormatOptionsStorageService.save({
        digitGrouping: false,
        greekSymbols: true,
        subscripts: true,
      })

      expect(localStorage.getItem(MATH_FORMAT_OPTIONS_STORAGE_KEY)).toBe(
        JSON.stringify({
          options: {
            digitGrouping: false,
            greekSymbols: true,
            subscripts: true,
          },
        }),
      )
    })

    it('swallows localStorage errors when saving', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })

      expect(() =>
        mathFormatOptionsStorageService.save({
          digitGrouping: false,
          greekSymbols: false,
          subscripts: false,
        }),
      ).not.toThrow()
    })

    it('preserves existing collapsed state when saving options', () => {
      localStorage.setItem(
        MATH_FORMAT_OPTIONS_STORAGE_KEY,
        JSON.stringify({
          options: { digitGrouping: true, greekSymbols: false, subscripts: false },
          collapsed: true,
        }),
      )

      mathFormatOptionsStorageService.save({
        digitGrouping: false,
        greekSymbols: true,
        subscripts: true,
      })

      const stored = JSON.parse(localStorage.getItem(MATH_FORMAT_OPTIONS_STORAGE_KEY) as string)
      expect(stored.collapsed).toBe(true)
      expect(stored.options).toEqual({
        digitGrouping: false,
        greekSymbols: true,
        subscripts: true,
      })
    })
  })

  describe('loadCollapsed', () => {
    it('returns null when there is no saved state', () => {
      expect(mathFormatOptionsStorageService.loadCollapsed()).toBeNull()
    })

    it('returns the saved collapsed state', () => {
      localStorage.setItem(
        MATH_FORMAT_OPTIONS_STORAGE_KEY,
        JSON.stringify({
          options: { digitGrouping: false, greekSymbols: false, subscripts: false },
          collapsed: true,
        }),
      )

      expect(mathFormatOptionsStorageService.loadCollapsed()).toBe(true)
    })

    it('returns false when collapsed is saved as false', () => {
      localStorage.setItem(
        MATH_FORMAT_OPTIONS_STORAGE_KEY,
        JSON.stringify({
          options: { digitGrouping: false, greekSymbols: false, subscripts: false },
          collapsed: false,
        }),
      )

      expect(mathFormatOptionsStorageService.loadCollapsed()).toBe(false)
    })

    it('returns null when collapsed field is absent', () => {
      localStorage.setItem(
        MATH_FORMAT_OPTIONS_STORAGE_KEY,
        JSON.stringify({
          options: { digitGrouping: false, greekSymbols: false, subscripts: false },
        }),
      )

      expect(mathFormatOptionsStorageService.loadCollapsed()).toBeNull()
    })

    it('returns null when localStorage throws while loading', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable')
      })

      expect(mathFormatOptionsStorageService.loadCollapsed()).toBeNull()
    })
  })

  describe('saveCollapsed', () => {
    it('writes collapsed state to localStorage', () => {
      mathFormatOptionsStorageService.saveCollapsed(true)

      const stored = JSON.parse(localStorage.getItem(MATH_FORMAT_OPTIONS_STORAGE_KEY) as string)
      expect(stored.collapsed).toBe(true)
      expect(stored.options).toBeUndefined()
    })

    it('persists collapsed state alongside existing options', () => {
      mathFormatOptionsStorageService.save({
        digitGrouping: true,
        greekSymbols: false,
        subscripts: false,
      })

      mathFormatOptionsStorageService.saveCollapsed(true)

      const stored = JSON.parse(localStorage.getItem(MATH_FORMAT_OPTIONS_STORAGE_KEY) as string)
      expect(stored.collapsed).toBe(true)
      expect(stored.options).toEqual({
        digitGrouping: true,
        greekSymbols: false,
        subscripts: false,
      })
    })

    it('swallows localStorage errors when saving', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })

      expect(() => mathFormatOptionsStorageService.saveCollapsed(true)).not.toThrow()
    })
  })
})
