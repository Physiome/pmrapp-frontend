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
  { label: 'Baylor, Hollingworth, Chandler, 2002', to: '/exposure/abc' },
  { label: 'model.cellml' },
]

const longTrail: BreadcrumbItem[] = [
  { label: 'Baylor, Hollingworth, Chandler, 2002', to: '/workspace/abc' },
  { label: 'src', to: '/workspace/abc?path=src' },
  { label: 'models', to: '/workspace/abc?path=src/models' },
  { label: 'model.cellml', to: '/workspace/abc/file/123/src/models/model.cellml' },
  { label: 'Mathematics' },
]

describe('Breadcrumbs', () => {
  it('renders a labelled navigation landmark with an ordered list', () => {
    const wrapper = mountBreadcrumbs(shortTrail)

    expect(wrapper.find('nav').attributes('aria-label')).toBe('Breadcrumb')
    expect(wrapper.find('nav > ol').exists()).toBe(true)
  })

  it('starts the trail at the first item without a Home link', () => {
    const wrapper = mountBreadcrumbs(shortTrail)
    const first = wrapper.findAll('a')[0]

    expect(first?.attributes('data-to')).toBe('"/exposure/abc"')
    expect(first?.text()).toBe('Baylor, Hollingworth, Chandler, 2002')
    expect(wrapper.text()).not.toContain('Home')
    expect(wrapper.find('li > svg').exists()).toBe(true)
    expect(wrapper.findAll('li')[0]?.find('svg').exists()).toBe(false)
  })

  it('marks only the last item as the current page and does not link it', () => {
    const wrapper = mountBreadcrumbs(shortTrail)
    const current = wrapper.findAll('[aria-current]')

    expect(current).toHaveLength(1)
    expect(current[0]?.attributes('aria-current')).toBe('page')
    expect(current[0]?.element.tagName).toBe('SPAN')
    expect(current[0]?.text()).toBe('model.cellml')
    expect(wrapper.findAll('a')).toHaveLength(1)
  })

  it('keeps the last item as a link when it has a target', () => {
    const wrapper = mountBreadcrumbs([
      { label: 'Baylor, Hollingworth, Chandler, 2002', to: '/workspace/abc/file/123' },
    ])

    expect(wrapper.find('[aria-current]').exists()).toBe(false)
    expect(wrapper.findAll('a').at(-1)?.attributes('data-to')).toBe('"/workspace/abc/file/123"')
  })

  it('hides separators from assistive technology', () => {
    const wrapper = mountBreadcrumbs(shortTrail)
    const separators = wrapper.findAll('li > svg')

    expect(separators).toHaveLength(1)
    for (const separator of separators) {
      expect(separator.attributes('aria-hidden')).toBe('true')
    }
  })

  it('exposes the full label as a title for truncated items', () => {
    const wrapper = mountBreadcrumbs(longTrail)

    expect(wrapper.find('a[title="Baylor, Hollingworth, Chandler, 2002"]').exists()).toBe(true)
    expect(wrapper.find('span[title="Mathematics"]').exists()).toBe(true)
  })

  it('does not cap item widths, so labels truncate only when the trail overflows', () => {
    const wrapper = mountBreadcrumbs(longTrail)

    for (const el of wrapper.findAll('a, span[title]')) {
      expect(el.classes().some((c) => c.includes('max-w-'))).toBe(false)
    }
  })

  it('lets every loaded item shrink, ancestors before the current page', () => {
    const wrapper = mountBreadcrumbs([
      { label: 'abc', loading: true },
      { label: 'A label longer than sixteen', to: '/a' },
      { label: 'short label', to: '/b' },
      { label: 'model.cellml' },
    ])
    const shrink = (index: number) => {
      const classes = wrapper.find(`li[data-index="${index}"]`).classes()
      return classes.filter((c) => c.startsWith('shrink') || c === 'min-w-0')
    }

    expect(shrink(0)).toEqual(['shrink-0'])
    expect(shrink(1)).toEqual(['min-w-0', 'shrink-4'])
    expect(shrink(2)).toEqual(['min-w-0', 'shrink-2'])
    expect(shrink(3)).toEqual(['min-w-0'])
  })

  it('renders a placeholder instead of the label while it loads', () => {
    const wrapper = mountBreadcrumbs([
      { label: 'abc', to: '/exposure/abc', loading: true },
      { label: 'model.cellml' },
    ])
    const status = wrapper.find('[role="status"]')

    expect(status.exists()).toBe(true)
    expect(status.find('.sr-only').text()).toBe('Loading…')
    expect(wrapper.text()).not.toContain('abc')
    expect(wrapper.findAll('a')).toHaveLength(0)
    expect(wrapper.findAll('[aria-current]')).toHaveLength(1)
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

    expect(document.activeElement?.textContent?.trim()).toBe('src')
    wrapper.unmount()
  })

  it('moves focus to the first revealed link while the first item is loading', async () => {
    const [first, ...rest] = longTrail
    const wrapper = mount(Breadcrumbs, {
      props: { items: [{ ...first, loading: true }, ...rest] },
      global: { stubs: { RouterLink: { template: '<a href="#"><slot /></a>' } } },
      attachTo: document.body,
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(document.activeElement?.textContent?.trim()).toBe('src')
    wrapper.unmount()
  })

  it('collapses again when the items change', async () => {
    const wrapper = mountBreadcrumbs(longTrail)

    await wrapper.find('button').trigger('click')
    await wrapper.setProps({ items: [...longTrail.slice(0, 4), { label: 'Generate code' }] })

    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('stays expanded when the parent passes an equal list of items', async () => {
    const wrapper = mountBreadcrumbs(longTrail)

    await wrapper.find('button').trigger('click')
    await wrapper.setProps({ items: longTrail.map((item) => ({ ...item })) })

    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('stays expanded when the first item finishes loading', async () => {
    const [first, ...rest] = longTrail
    const wrapper = mountBreadcrumbs([{ ...first, label: 'abc', loading: true }, ...rest])

    await wrapper.find('button').trigger('click')
    await wrapper.setProps({ items: longTrail })

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).toContain('Baylor, Hollingworth, Chandler, 2002')
  })
})
