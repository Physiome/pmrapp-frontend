import type { RouteLocationRaw } from 'vue-router'

export interface BreadcrumbItem {
  label: string
  // Omit for the current page.
  to?: RouteLocationRaw
  // Label comes from an API that hasn't responded yet; render a placeholder.
  loading?: boolean
}
