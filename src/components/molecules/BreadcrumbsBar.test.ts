import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import BreadcrumbsBar from '@/components/molecules/BreadcrumbsBar.vue'
import type { BreadcrumbItem } from '@/types/breadcrumb'

describe('BreadcrumbsBar', () => {
  let target: HTMLDivElement

  beforeEach(() => {
    target = document.createElement('div')
    target.id = 'breadcrumbs-bar'
    document.body.appendChild(target)
  })

  afterEach(() => {
    target.remove()
  })

  it('renders the breadcrumbs into the layout bar under the header', async () => {
    const wrapper = mount(BreadcrumbsBar, {
      props: {
        items: [{ label: 'My workspace', to: '/workspace/abc' }, { label: 'model.cellml' }],
      },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
      attachTo: document.body,
    })
    await flushPromises()

    const nav = target.querySelector('nav[aria-label="Breadcrumb"]')
    expect(nav).not.toBeNull()
    expect(nav?.textContent).toContain('model.cellml')

    wrapper.unmount()
    expect(target.querySelector('nav')).toBeNull()
  })

  const mountBar = async (items: BreadcrumbItem[]) => {
    const wrapper = mount(BreadcrumbsBar, {
      props: { items },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
      attachTo: document.body,
    })
    await flushPromises()
    return wrapper
  }

  it('renders a lone crumb as the unlinked current page', async () => {
    const wrapper = await mountBar([{ label: 'My workspace' }])

    const current = target.querySelector('nav [aria-current="page"]')
    expect(current?.textContent?.trim()).toBe('My workspace')
    expect(target.querySelector('nav a')).toBeNull()
    wrapper.unmount()
  })
})
