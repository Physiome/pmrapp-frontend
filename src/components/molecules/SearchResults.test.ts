import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SearchResults from '@/components/molecules/SearchResults.vue'
import type { SearchResult } from '@/types/search'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ query: {} }),
}))

const createResult = (
  overrides: Partial<SearchResult['data']> & { resource_path?: string } = {},
): SearchResult => ({
  resource_path: overrides.resource_path ?? '/exposure/1/file.cellml',
  data: {
    aliased_uri: overrides.aliased_uri ?? [],
    cellml_keyword: overrides.cellml_keyword ?? [],
    commit_authored_ts: overrides.commit_authored_ts ?? [],
    created_ts: overrides.created_ts ?? [],
    description: overrides.description ?? ['Test description'],
    exposure_alias: overrides.exposure_alias ?? [],
    citation_author_family_name: overrides.citation_author_family_name ?? [],
    citation_id: overrides.citation_id ?? [],
    model_author: overrides.model_author ?? [],
    _title: overrides._title,
    _brief: overrides._brief,
  },
})

describe('SearchResults.vue link handling', () => {
  const globalOptions = {
    stubs: {
      RouterLink: RouterLinkStub,
      SearchResultsMessage: true,
      FileIcon: true,
    },
  }

  it('renders link with a single trailing slash when aliased_uri lacks trailing slash', () => {
    const results = [createResult({ aliased_uri: ['/e/210f6601f6461be8443592ff071d2592'] })]
    const wrapper = mount(SearchResults, {
      props: {
        results,
        isLoading: false,
        error: null,
        term: 'heart',
        kind: 'cellml_keyword',
      },
      global: globalOptions,
    })

    const linkComponent = wrapper.findComponent(RouterLinkStub)
    expect(linkComponent.exists()).toBe(true)
    expect(linkComponent.props().to).toBe('/e/210f6601f6461be8443592ff071d2592/')
  })

  it('does not produce double slashes when aliased_uri already ends with a slash', () => {
    const results = [createResult({ aliased_uri: ['/exposure/123/'] })]
    const wrapper = mount(SearchResults, {
      props: {
        results,
        isLoading: false,
        error: null,
        term: 'heart',
        kind: 'cellml_keyword',
      },
      global: globalOptions,
    })

    const linkComponent = wrapper.findComponent(RouterLinkStub)
    expect(linkComponent.exists()).toBe(true)
    expect(linkComponent.props().to).toBe('/exposure/123/')
  })

  it('does not produce "undefined/" when aliased_uri is an empty array', () => {
    const results = [
      createResult({
        aliased_uri: [],
        exposure_alias: [],
        resource_path: '/other/path',
      }),
    ]
    const wrapper = mount(SearchResults, {
      props: {
        results,
        isLoading: false,
        error: null,
        term: 'heart',
        kind: 'cellml_keyword',
      },
      global: globalOptions,
    })

    const links = wrapper.findAllComponents(RouterLinkStub)
    const brokenLink = links.find((l) => String(l.props().to).includes('undefined'))
    expect(brokenLink).toBeUndefined()
  })

  it('falls back to exposure_alias when aliased_uri is empty', () => {
    const results = [
      createResult({
        aliased_uri: [],
        exposure_alias: ['my-alias'],
      }),
      createResult({
        aliased_uri: [],
        exposure_alias: [],
        resource_path: '/exposure/55/file.cellml',
      }),
    ]
    const wrapper = mount(SearchResults, {
      props: {
        results,
        isLoading: false,
        error: null,
        term: 'heart',
        kind: 'cellml_keyword',
      },
      global: globalOptions,
    })

    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(1)
    expect(links[0].props().to).toBe('/exposure/my-alias/')
  })
})
