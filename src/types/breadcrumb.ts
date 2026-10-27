import type { RouteLocationRaw } from 'vue-router'

export interface BreadcrumbItem {
  label: string
  // Omit for the current page.
  to?: RouteLocationRaw
}
