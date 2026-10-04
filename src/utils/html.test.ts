import { afterEach, describe, expect, it, vi } from 'vitest'

import { addImageDimensions } from './html'

describe('addImageDimensions', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const stubImage = (width: number, height: number, fail = false) => {
    class MockImage {
      naturalWidth = width
      naturalHeight = height
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()))
      }
    }
    vi.stubGlobal('Image', MockImage)
  }

  it('returns the HTML unchanged when there are no images', async () => {
    const html = '<p>Hello</p>'
    expect(await addImageDimensions(html)).toBe(html)
  })

  it('adds width and height to images without dimensions', async () => {
    stubImage(300, 200)
    const result = await addImageDimensions('<img src="a.png">')
    expect(result).toContain('width="300"')
    expect(result).toContain('height="200"')
  })

  it('keeps images that already have dimensions', async () => {
    stubImage(300, 200)
    const result = await addImageDimensions('<img src="a.png" width="10">')
    expect(result).toContain('width="10"')
    expect(result).not.toContain('height=')
  })

  it('leaves images untouched when they fail to load', async () => {
    stubImage(0, 0, true)
    const result = await addImageDimensions('<img src="a.png">')
    expect(result).not.toContain('width=')
  })
})
