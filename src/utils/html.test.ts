import { describe, expect, it } from 'vitest'

import { markHtmlImagesLoaded, prepareHtmlImages } from './html'

describe('prepareHtmlImages', () => {
  it('returns the HTML unchanged when there are no images', () => {
    const html = '<p>Hello</p>'
    expect(prepareHtmlImages(html)).toBe(html)
  })

  it('adds lazy loading and async decoding to images', () => {
    const result = prepareHtmlImages('<img src="a.png">')
    expect(result).toContain('loading="lazy"')
    expect(result).toContain('decoding="async"')
  })

  it('marks images without dimensions as loading', () => {
    const result = prepareHtmlImages('<img src="a.png">')
    expect(result).toContain('data-img-loading')
  })

  it('does not mark images that already have dimensions', () => {
    const result = prepareHtmlImages('<img src="a.png" width="10">')
    expect(result).toContain('width="10"')
    expect(result).not.toContain('data-img-loading')
  })

  it('keeps existing loading and decoding attributes', () => {
    const result = prepareHtmlImages('<img src="a.png" loading="eager" decoding="sync">')
    expect(result).toContain('loading="eager"')
    expect(result).toContain('decoding="sync"')
  })
})

describe('markHtmlImagesLoaded', () => {
  const createContainer = () => {
    const container = document.createElement('div')
    container.innerHTML = prepareHtmlImages('<p>Text</p><img src="a.png">')
    return container
  }

  const getImage = (container: HTMLElement) => {
    const img = container.querySelector('img')
    if (!img) throw new Error('Image not found')
    return img
  }

  it('removes the loading marker when the image loads', () => {
    const container = createContainer()
    markHtmlImagesLoaded(container)

    const img = getImage(container)
    expect(img.hasAttribute('data-img-loading')).toBe(true)

    img.dispatchEvent(new Event('load'))
    expect(img.hasAttribute('data-img-loading')).toBe(false)
    expect(img.hasAttribute('data-img-error')).toBe(false)
  })

  it('flags the image when it fails to load', () => {
    const container = createContainer()
    markHtmlImagesLoaded(container)

    const img = getImage(container)
    img.dispatchEvent(new Event('error'))
    expect(img.hasAttribute('data-img-loading')).toBe(false)
    expect(img.hasAttribute('data-img-error')).toBe(true)
  })
})
