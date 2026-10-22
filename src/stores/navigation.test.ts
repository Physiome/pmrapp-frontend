import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { isListingRouteName, useNavigationStore } from '@/stores/navigation'

describe('navigation store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with empty listing queries', () => {
    const store = useNavigationStore()

    expect(store.listingQuery).toEqual({ workspaces: {}, exposures: {} })
  })

  it('remembers the last query for each listing separately', () => {
    const store = useNavigationStore()

    store.setListingQuery('workspaces', { filter: 'heart', sort: 'name' })
    store.setListingQuery('exposures', { filter: 'calcium' })
    store.setListingQuery('workspaces', { filter: 'lung' })

    expect(store.listingQuery.workspaces).toEqual({ filter: 'lung' })
    expect(store.listingQuery.exposures).toEqual({ filter: 'calcium' })
  })

  it('recognises listing route names only', () => {
    expect(isListingRouteName('workspaces')).toBe(true)
    expect(isListingRouteName('exposures')).toBe(true)
    expect(isListingRouteName('workspace-detail')).toBe(false)
    expect(isListingRouteName(undefined)).toBe(false)
  })
})
