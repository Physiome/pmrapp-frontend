const IMAGE_LOADING_ATTR = 'data-img-loading'
const IMAGE_UNSIZED_ATTR = 'data-img-unsized'
const IMAGE_FRAME_CLASS = 'img-frame'
const IMAGE_FALLBACK_CLASS = 'img-fallback'
const IMAGE_FALLBACK_TEXT = 'Image not available'
const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Prepares `<img>` elements for progressive loading.
 * (Tag names are case-insensitive, so `<IMG>` must also be matched.)
 * All images are lazy-loaded and decoded asynchronously, and wrapped in a frame
 * that shows a placeholder and hides the image until it has fully loaded,
 * so partially downloaded (e.g. progressive) images are never shown.
 * Frames of images without width and height are marked
 * so that the placeholder can be given a default size.
 * Styles: `src/assets/html-images.css` (apply the `html-images` class to the container).
 */
export function prepareHtmlImages(html: string): string {
  if (!/<img\b/i.test(html)) return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const images = Array.from(doc.querySelectorAll('img[src]'))

  if (images.length === 0) return html

  images.forEach((img) => {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy')
    if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async')

    const frame = doc.createElement('span')
    frame.className = IMAGE_FRAME_CLASS
    frame.setAttribute(IMAGE_LOADING_ATTR, '')
    if (!img.hasAttribute('width') && !img.hasAttribute('height')) {
      frame.setAttribute(IMAGE_UNSIZED_ATTR, '')
    }
    img.replaceWith(frame)
    frame.appendChild(img)
  })

  return doc.body.innerHTML
}

/**
 * Returns the file name of an image source, or an empty string for data URIs
 * and sources without a usable path.
 */
function getImageFileName(src: string): string {
  if (!src || /^\s*data:/i.test(src)) return ''

  try {
    const { pathname } = new URL(src, window.location.href)
    return decodeURIComponent(pathname.split('/').pop() ?? '')
  } catch {
    return ''
  }
}

/**
 * Builds an accessible placeholder for an image that failed to load.
 * Built with DOM APIs (not `innerHTML`) since `alt` and `src` come from user data.
 */
function createImageFallback(img: HTMLImageElement): HTMLElement {
  const alt = img.getAttribute('alt')?.trim()
  const fileName = getImageFileName(img.getAttribute('src') ?? '')

  const fallback = document.createElement('span')
  fallback.className = IMAGE_FALLBACK_CLASS
  fallback.setAttribute('role', 'img')
  fallback.setAttribute('aria-label', alt ? `${IMAGE_FALLBACK_TEXT}: ${alt}` : IMAGE_FALLBACK_TEXT)

  const icon = document.createElementNS(SVG_NS, 'svg')
  icon.setAttribute('viewBox', '0 0 24 24')
  icon.setAttribute('fill', 'none')
  icon.setAttribute('stroke', 'currentColor')
  icon.setAttribute('stroke-width', '1.5')
  icon.setAttribute('aria-hidden', 'true')
  icon.setAttribute('class', `${IMAGE_FALLBACK_CLASS}-icon`)
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-linejoin', 'round')
  path.setAttribute(
    'd',
    'M3 3l18 18M21 15.5V5a2 2 0 0 0-2-2H8.5M3 7v12a2 2 0 0 0 2 2h12m-3-6-3-3-6 6m10-11h.01',
  )
  icon.appendChild(path)

  const label = document.createElement('span')
  label.textContent = alt ? `${IMAGE_FALLBACK_TEXT}: ${alt}` : IMAGE_FALLBACK_TEXT

  fallback.append(icon, label)

  if (fileName) {
    const name = document.createElement('span')
    name.className = `${IMAGE_FALLBACK_CLASS}-name`
    name.textContent = fileName
    name.title = fileName
    fallback.appendChild(name)
  }

  return fallback
}

/**
 * Removes the loading marker from the frames of images prepared by `prepareHtmlImages`
 * once they have fully loaded, which fades the image in over the placeholder,
 * and replaces images that fail to load with an accessible "Image not available" placeholder.
 */
export function markHtmlImagesLoaded(container: HTMLElement): void {
  const images = container.querySelectorAll<HTMLImageElement>('img[src]')

  images.forEach((img) => {
    const frame = img.parentElement?.classList.contains(IMAGE_FRAME_CLASS) ? img.parentElement : img
    const handleLoad = () => frame.removeAttribute(IMAGE_LOADING_ATTR)
    const handleError = () => frame.replaceWith(createImageFallback(img))

    if (img.complete) {
      // The load or error event has already fired, so check the result directly.
      // `decode()` rejects for broken images, without misreading images that have no intrinsic size.
      img.decode().then(handleLoad, handleError)
      return
    }

    img.addEventListener('load', handleLoad, { once: true })
    img.addEventListener('error', handleError, { once: true })
  })
}
