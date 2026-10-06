/**
 * Licence URL formatting utilities.
 */

interface LicenceMap {
  [key: string]: string
}

const LICENCE_NAMES: LicenceMap = {
  'creativecommons.org/licenses/by/3.0': 'CC BY 3.0',
  'creativecommons.org/licenses/by/4.0': 'CC BY 4.0',
  'creativecommons.org/licenses/by-sa/3.0': 'CC BY-SA 3.0',
  'creativecommons.org/licenses/by-sa/4.0': 'CC BY-SA 4.0',
  'creativecommons.org/licenses/by-nc/3.0': 'CC BY-NC 3.0',
  'creativecommons.org/licenses/by-nc/4.0': 'CC BY-NC 4.0',
  'creativecommons.org/licenses/by-nd/3.0': 'CC BY-ND 3.0',
  'creativecommons.org/licenses/by-nd/4.0': 'CC BY-ND 4.0',
  'creativecommons.org/licenses/by-nc-sa/3.0': 'CC BY-NC-SA 3.0',
  'creativecommons.org/licenses/by-nc-sa/4.0': 'CC BY-NC-SA 4.0',
  'creativecommons.org/licenses/by-nc-nd/3.0': 'CC BY-NC-ND 3.0',
  'creativecommons.org/licenses/by-nc-nd/4.0': 'CC BY-NC-ND 4.0',
  'opensource.org/licenses/MIT': 'MIT License',
  'opensource.org/licenses/Apache-2.0': 'Apache License 2.0',
  'gnu.org/licenses/gpl-3.0': 'GPL 3.0',
  'gnu.org/licenses/gpl-2.0': 'GPL 2.0',
  'gnu.org/licenses/lgpl-3.0': 'LGPL 3.0',
  'gnu.org/licenses/lgpl-2.0': 'LGPL 2.0',
  'gnu.org/licenses/agpl-3.0': 'AGPL 3.0',
  'opensource.org/licenses/BSD-2-Clause': 'BSD 2-Clause License',
  'opensource.org/licenses/BSD-3-Clause': 'BSD 3-Clause License',
}

/**
 * Format a licence URL to a human-readable name.
 * @param licenceUrl The licence URL.
 * @returns Human-readable licence name or the original URL if not recognised.
 */
export const formatLicenceUrl = (licenceUrl: string): string => {
  if (!licenceUrl) return ''

  // Try to find a matching licence in the map.
  for (const [key, name] of Object.entries(LICENCE_NAMES)) {
    if (licenceUrl.includes(key)) {
      return name
    }
  }

  // If no match is found, extract domain and path for a reasonable fallback.
  try {
    const url = new URL(licenceUrl)
    const hostname = url.hostname.replace('www.', '')
    const pathname = url.pathname.split('/').filter(Boolean).slice(-2).join(' ')
    if (pathname) {
      return `${hostname} - ${pathname}`.replace(/\//g, ' ').replace(/-/g, ' ')
    }
    return hostname
  } catch {
    // If URL parsing fails, return the original URL.
    return licenceUrl
  }
}
