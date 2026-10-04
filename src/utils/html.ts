const IMAGE_PRELOAD_TIMEOUT_MS = 5000

const preloadImageSize = (src: string): Promise<{ width: number; height: number } | null> =>
  new Promise((resolve) => {
    const image = new Image()
    const timer = setTimeout(() => resolve(null), IMAGE_PRELOAD_TIMEOUT_MS)

    image.onload = () => {
      clearTimeout(timer)
      resolve(
        image.naturalWidth && image.naturalHeight
          ? { width: image.naturalWidth, height: image.naturalHeight }
          : null,
      )
    }
    image.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    image.src = src
  })

/**
 * Adds the intrinsic width and height to `<img>` elements that do not specify them,
 * so that the browser can reserve the correct space before the images are rendered.
 */
export async function addImageDimensions(html: string): Promise<string> {
  if (!html.includes('<img')) return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const images = Array.from(doc.querySelectorAll('img[src]')).filter(
    (img) => !img.hasAttribute('width') && !img.hasAttribute('height'),
  )

  if (images.length === 0) return html

  const sizes = await Promise.all(images.map((img) => preloadImageSize(img.getAttribute('src')!)))

  images.forEach((img, index) => {
    const size = sizes[index]
    if (size) {
      img.setAttribute('width', String(size.width))
      img.setAttribute('height', String(size.height))
    }
  })

  return doc.body.innerHTML
}
