import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import BreadcrumbsBar from '@/components/molecules/BreadcrumbsBar.vue'

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
      props: { items: [{ label: 'Workspaces', to: '/workspace' }, { label: 'My workspace' }] },
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
      attachTo: document.body,
    })
    await flushPromises()

    const nav = target.querySelector('nav[aria-label="Breadcrumb"]')
    expect(nav).not.toBeNull()
    expect(nav?.textContent).toContain('My workspace')

    wrapper.unmount()
    expect(target.querySelector('nav')).toBeNull()
  })
})
