import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LocationQuery } from 'vue-router'

export type ListingRouteName = 'workspaces' | 'exposures'

const LISTING_ROUTE_NAMES: ListingRouteName[] = ['workspaces', 'exposures']

export const isListingRouteName = (name: unknown): name is ListingRouteName =>
  LISTING_ROUTE_NAMES.includes(name as ListingRouteName)

// Remembers the last query (filter, sort) used on each listing page,
// so breadcrumb links back to a listing restore the user's filters.
export const useNavigationStore = defineStore('navigation', () => {
  const listingQuery = ref<Record<ListingRouteName, LocationQuery>>({
    workspaces: {},
    exposures: {},
  })

  const setListingQuery = (name: ListingRouteName, query: LocationQuery) => {
    listingQuery.value[name] = { ...query }
  }

  return {
    listingQuery,
    setListingQuery,
  }
})
