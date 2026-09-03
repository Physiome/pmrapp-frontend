/**
 * Resolves relative paths in HTML content by replacing src and href attributes.
 * Handles various path patterns: ../, ./, /, ../../, etc.
 *
 * @param html - The HTML content to process.
 * @param baseUrl - The base API URL.
 * @param routePath - The current route path for context.
 * @returns The processed HTML with resolved paths.
 */
export function resolveHtmlPaths(html: string, baseUrl: string, routePath: string): string {
  let result = html

  // Replace src="../" and src="../../" etc. with full paths.
  result = result.replace(/src="(\.\.\/)+/g, () => {
    return `src="${baseUrl}${routePath}/`
  })

  // Replace src="./" with full paths.
  result = result.replace(/src="\.\//g, `src="${baseUrl}${routePath}/`)

  // Replace href="../" and href="../../" etc. with full paths.
  result = result.replace(/href="(\.\.\/)+/g, () => {
    return `href="${baseUrl}${routePath}/`
  })

  // Replace href="./" with full paths.
  result = result.replace(/href="\.\//g, `href="${baseUrl}${routePath}/`)

  // Replace src="/" (root-relative paths) with full URL.
  // But avoid replacing src="//" (protocol-relative URLs).
  result = result.replace(/src="\/(?!\/)/g, `src="${baseUrl}/`)

  // Replace href="/" (root-relative paths) with full URL.
  // But avoid replacing href="//" (protocol-relative URLs).
  result = result.replace(/href="\/(?!\/)/g, `href="${baseUrl}/`)

  // Note: Absolute URLs (http://, https://, //, data:, blob:) are left unchanged.

  return result
}

/**
 * Ensures that a URL path ends with a single trailing slash.
 * If the path is empty, returns an empty string.
 * Multiple consecutive trailing slashes are collapsed into a single slash.
 */
export const ensureTrailingSlash = (path: string): string => {
  const trimmed = path.trim()
  if (!trimmed) return ''
  return `${trimmed.replace(/\/+$/, '')}/`
}
