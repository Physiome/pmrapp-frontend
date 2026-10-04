const IMAGE_LOADING_ATTR = 'data-img-loading'
const IMAGE_ERROR_ATTR = 'data-img-error'

/**
 * Prepares `<img>` elements for progressive loading.
 * All images are lazy-loaded and decoded asynchronously,
 * and images without width and height are marked
 * so that a placeholder can be shown until they load.
 */
export function prepareHtmlImages(html: string): string {
  if (!html.includes('<img')) return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const images = Array.from(doc.querySelectorAll('img[src]'))

  if (images.length === 0) return html

  images.forEach((img) => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy')
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async')
    if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
      img.setAttribute(IMAGE_LOADING_ATTR, '')
    }
  })

  return doc.body.innerHTML
}

/**
 * Removes the placeholder marker from images prepared by `prepareHtmlImages`
 * once they have loaded, or flags them when they fail to load.
 */
export function markHtmlImagesLoaded(container: HTMLElement): void {
  const images = container.querySelectorAll<HTMLImageElement>(`img[${IMAGE_LOADING_ATTR}]`)

  images.forEach((img) => {
    const handleLoad = () => img.removeAttribute(IMAGE_LOADING_ATTR)
    const handleError = () => {
      img.removeAttribute(IMAGE_LOADING_ATTR)
      img.setAttribute(IMAGE_ERROR_ATTR, '')
    }

    if (img.complete && img.naturalWidth > 0) {
      handleLoad()
      return
    }

    img.addEventListener('load', handleLoad, { once: true })
    img.addEventListener('error', handleError, { once: true })
  })
}
