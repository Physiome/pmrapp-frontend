import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import Header from '@/components/organisms/Header.vue'

const route = reactive({
  name: 'home',
  path: '/',
  fullPath: '/',
})

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('@/utils/analytics', () => ({
  trackButtonClick: vi.fn(),
}))

describe('Header', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    route.name = 'home'
    route.path = '/'
    route.fullPath = '/'
  })

  it('toggles the mobile navigation menu', async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          SearchIcon: true,
          SearchOverlay: true,
          UserDropdown: true,
          Tooltip: true,
        },
      },
    })

    expect(wrapper.find('#mobile-navigation-menu').exists()).toBe(false)

    const toggleButton = wrapper.find('button[aria-controls="mobile-navigation-menu"]')
    expect(toggleButton.attributes('aria-expanded')).toBe('false')

    await toggleButton.trigger('click')

    expect(wrapper.find('#mobile-navigation-menu').exists()).toBe(true)
    expect(toggleButton.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('Exposures')
    expect(wrapper.text()).toContain('Workspaces')
  })

  it('closes the mobile menu when the route changes', async () => {
    const wrapper = mount(Header, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          SearchIcon: true,
          SearchOverlay: true,
          UserDropdown: true,
          Tooltip: true,
        },
      },
    })

    await wrapper.find('button[aria-controls="mobile-navigation-menu"]').trigger('click')
    expect(wrapper.find('#mobile-navigation-menu').exists()).toBe(true)

    route.path = '/exposures'
    route.fullPath = '/exposures'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#mobile-navigation-menu').exists()).toBe(false)
  })
})
