import type { RouteLocationRaw } from 'vue-router'

export interface BreadcrumbItem {
  label: string
  // Omit for the current page.
  // The last item may keep a link when the current page sits below it
  // (e.g. a folder inside a workspace).
  to?: RouteLocationRaw
}
