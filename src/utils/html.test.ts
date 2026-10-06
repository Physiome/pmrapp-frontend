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

  it('matches image tags case-insensitively', () => {
    const result = prepareHtmlImages('<IMG src="a.png">')
    expect(result).toContain('loading="lazy"')
    expect(result).toContain('data-img-loading')
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
    expect(container.querySelector('.img-fallback')).toBeNull()
  })

  it('replaces the image with a placeholder when it fails to load', () => {
    const container = createContainer()
    markHtmlImagesLoaded(container)

    getImage(container).dispatchEvent(new Event('error'))

    const fallback = container.querySelector('.img-fallback')
    expect(container.querySelector('img')).toBeNull()
    expect(fallback?.getAttribute('role')).toBe('img')
    expect(fallback?.getAttribute('aria-label')).toBe('Image not available')
    expect(fallback?.querySelector('.img-fallback-name')?.textContent).toBe('a.png')
  })

  it('includes the alt text in the placeholder when present', () => {
    const container = document.createElement('div')
    container.innerHTML = '<img src="b.png" alt="Model diagram" width="10" height="10">'
    markHtmlImagesLoaded(container)

    getImage(container).dispatchEvent(new Event('error'))

    const fallback = container.querySelector('.img-fallback')
    expect(fallback?.getAttribute('aria-label')).toBe('Image not available: Model diagram')
    expect(fallback?.textContent).toContain('Image not available: Model diagram')
  })

  it.each([
    'data:image/png;base64,AAAA',
    'DATA:image/png;base64,AAAA',
    ' Data:image/png;base64,AAAA',
  ])('omits the file name for data URI %s', (src) => {
    const container = document.createElement('div')
    const img = document.createElement('img')
    img.setAttribute('src', src)
    container.appendChild(img)
    markHtmlImagesLoaded(container)

    img.dispatchEvent(new Event('error'))

    expect(container.querySelector('.img-fallback')).not.toBeNull()
    expect(container.querySelector('.img-fallback-name')).toBeNull()
    expect(container.textContent).not.toContain('AAAA')
  })

  it('does not render user data as HTML in the placeholder', () => {
    const container = document.createElement('div')
    const img = document.createElement('img')
    img.src = 'c.png'
    img.alt = '<b>bold</b>'
    container.appendChild(img)
    markHtmlImagesLoaded(container)

    img.dispatchEvent(new Event('error'))

    expect(container.querySelector('b')).toBeNull()
    expect(container.textContent).toContain('<b>bold</b>')
  })
})
