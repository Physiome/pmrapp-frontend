import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import Breadcrumbs from '@/components/molecules/Breadcrumbs.vue'
import type { BreadcrumbItem } from '@/types/breadcrumb'

const RouterLinkStub = {
  props: ['to'],
  template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
}

const mountBreadcrumbs = (items: BreadcrumbItem[]) =>
  mount(Breadcrumbs, {
    props: { items },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })

const shortTrail: BreadcrumbItem[] = [
  { label: 'Workspaces', to: '/workspace' },
  { label: 'Baylor, Hollingworth, Chandler, 2002' },
]

const longTrail: BreadcrumbItem[] = [
  { label: 'Exposures', to: '/exposure' },
  { label: 'Baylor, Hollingworth, Chandler, 2002', to: '/exposure/abc' },
  { label: 'model.cellml', to: '/exposure/abc/model.cellml/' },
  { label: 'Mathematics' },
]

describe('Breadcrumbs', () => {
  it('renders a labelled navigation landmark with an ordered list', () => {
    const wrapper = mountBreadcrumbs(shortTrail)

    expect(wrapper.find('nav').attributes('aria-label')).toBe('Breadcrumb')
    expect(wrapper.find('nav > ol').exists()).toBe(true)
  })

  it('prepends a Home link with an icon and an accessible label', () => {
    const wrapper = mountBreadcrumbs(shortTrail)
    const home = wrapper.findAll('a')[0]

    expect(home?.attributes('data-to')).toBe('"/"')
    expect(home?.text()).toBe('Home')
    expect(home?.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('marks only the last item as the current page and does not link it', () => {
    const wrapper = mountBreadcrumbs(shortTrail)
    const current = wrapper.findAll('[aria-current]')

    expect(current).toHaveLength(1)
    expect(current[0]?.attributes('aria-current')).toBe('page')
    expect(current[0]?.element.tagName).toBe('SPAN')
    expect(current[0]?.text()).toBe('Baylor, Hollingworth, Chandler, 2002')
    expect(wrapper.findAll('a')).toHaveLength(2)
  })

  it('keeps the last item as a link when it has a target', () => {
    const wrapper = mountBreadcrumbs([
      { label: 'Workspaces', to: '/workspace' },
      { label: 'Baylor, Hollingworth, Chandler, 2002', to: '/workspace/abc/file/123' },
    ])

    expect(wrapper.find('[aria-current]').exists()).toBe(false)
    expect(wrapper.findAll('a').at(-1)?.attributes('data-to')).toBe('"/workspace/abc/file/123"')
  })

  it('hides separators from assistive technology', () => {
    const wrapper = mountBreadcrumbs(shortTrail)
    const separators = wrapper.findAll('li > svg')

    expect(separators).toHaveLength(2)
    for (const separator of separators) {
      expect(separator.attributes('aria-hidden')).toBe('true')
    }
  })

  it('exposes the full label as a title for truncated items', () => {
    const wrapper = mountBreadcrumbs(longTrail)

    expect(wrapper.find('a[title="Baylor, Hollingworth, Chandler, 2002"]').exists()).toBe(true)
    expect(wrapper.find('span[title="Mathematics"]').exists()).toBe(true)
  })

  it('does not render a collapse toggle for short trails', () => {
    const wrapper = mountBreadcrumbs(shortTrail)

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('collapses middle items on small screens for long trails and expands on click', async () => {
    const wrapper = mountBreadcrumbs(longTrail)
    const toggle = wrapper.find('button')

    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-label')).toBe('Show 2 more breadcrumb items')

    const items = wrapper.findAll('li').filter((li) => !li.find('button').exists())
    expect(items.map((li) => li.classes().includes('hidden'))).toEqual([
      false,
      true,
      true,
      false,
      false,
    ])

    await toggle.trigger('click')

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.findAll('li.hidden')).toHaveLength(0)
    expect(wrapper.find('ol').classes()).toContain('flex-wrap')
  })

  it('moves focus to the first revealed link after expanding', async () => {
    const wrapper = mount(Breadcrumbs, {
      props: { items: longTrail },
      global: { stubs: { RouterLink: { template: '<a href="#"><slot /></a>' } } },
      attachTo: document.body,
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(document.activeElement?.textContent?.trim()).toBe('Exposures')
    wrapper.unmount()
  })

  it('collapses again when the items change', async () => {
    const wrapper = mountBreadcrumbs(longTrail)

    await wrapper.find('button').trigger('click')
    await wrapper.setProps({ items: [...longTrail.slice(0, 3), { label: 'Generate code' }] })

    expect(wrapper.find('button').exists()).toBe(true)
  })
})
