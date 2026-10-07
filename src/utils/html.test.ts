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

  it('wraps images in a loading frame', () => {
    const result = prepareHtmlImages('<img src="a.png">')
    expect(result).toBe(
      '<span class="img-frame" data-img-loading="" data-img-unsized="">' +
        '<img src="a.png" loading="lazy" decoding="async"></span>',
    )
  })

  it('does not mark frames of images that already have dimensions as unsized', () => {
    const result = prepareHtmlImages('<img src="a.png" width="10">')
    expect(result).toContain('width="10"')
    expect(result).toContain('data-img-loading')
    expect(result).not.toContain('data-img-unsized')
  })

  it('wraps the picture instead of the image to keep its sources', () => {
    const result = prepareHtmlImages(
      '<picture><source srcset="a.webp" type="image/webp"><img src="a.png"></picture>',
    )
    expect(result).toBe(
      '<span class="img-frame" data-img-loading="" data-img-unsized="">' +
        '<picture><source srcset="a.webp" type="image/webp">' +
        '<img src="a.png" loading="lazy" decoding="async"></picture></span>',
    )
  })

  it('wraps images that only have srcset', () => {
    const result = prepareHtmlImages('<img srcset="a.png 1x, a@2x.png 2x">')
    expect(result).toContain('class="img-frame"')
    expect(result).toContain('loading="lazy"')
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

  it('removes the loading marker from the frame when the image loads', () => {
    const container = createContainer()
    markHtmlImagesLoaded(container)

    const img = getImage(container)
    const frame = container.querySelector('.img-frame')
    expect(frame?.hasAttribute('data-img-loading')).toBe(true)

    img.dispatchEvent(new Event('load'))
    expect(frame?.hasAttribute('data-img-loading')).toBe(false)
    expect(container.querySelector('.img-fallback')).toBeNull()
  })

  it('replaces the image frame with a placeholder when it fails to load', () => {
    const container = createContainer()
    markHtmlImagesLoaded(container)

    getImage(container).dispatchEvent(new Event('error'))

    const fallback = container.querySelector('.img-fallback')
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.img-frame')).toBeNull()
    expect(fallback?.getAttribute('role')).toBe('img')
    expect(fallback?.getAttribute('aria-label')).toBe('Image not available')
    expect(fallback?.querySelector('.img-fallback-name')?.textContent).toBe('a.png')
  })

  it('removes the loading marker from the frame of an image in a picture', () => {
    const container = document.createElement('div')
    container.innerHTML = prepareHtmlImages(
      '<picture><source srcset="a.webp" type="image/webp"><img src="a.png"></picture>',
    )
    markHtmlImagesLoaded(container)

    const frame = container.querySelector('.img-frame')
    getImage(container).dispatchEvent(new Event('load'))
    expect(frame?.hasAttribute('data-img-loading')).toBe(false)
    expect(frame?.querySelector(':scope > picture > img')).not.toBeNull()
  })

  it('replaces the frame of a picture with a placeholder when its image fails to load', () => {
    const container = document.createElement('div')
    container.innerHTML = prepareHtmlImages(
      '<picture><source srcset="a.webp" type="image/webp"><img src="a.png"></picture>',
    )
    markHtmlImagesLoaded(container)

    getImage(container).dispatchEvent(new Event('error'))

    expect(container.querySelector('picture')).toBeNull()
    expect(container.querySelector('.img-frame')).toBeNull()
    expect(container.querySelector('.img-fallback')).not.toBeNull()
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
