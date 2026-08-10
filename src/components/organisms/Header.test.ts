import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import Header from '@/components/organisms/Header.vue'
import UserDropdown from '@/components/molecules/UserDropdown.vue'

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

  const mountHeader = () =>
    mount(Header, {
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

  it('has the logo with alt text', () => {
    const wrapper = mountHeader()
    const logo = wrapper.find('img[alt="Physiome Model Repository"]')

    expect(logo.exists()).toBe(true)
    expect(logo.attributes('src')).toBe('/logo.png')
  })

  it('does not show the toggle mobile menu button on desktop screen size', () => {
    const wrapper = mountHeader()
    const toggleMenuButton = wrapper.find('button[aria-controls="mobile-navigation-menu"]')
    const toggleMenuContainer = toggleMenuButton.element.closest('li')

    expect(toggleMenuButton.exists()).toBe(true)
    expect(toggleMenuContainer).not.toBeNull()
    expect(toggleMenuContainer?.classList.contains('md:hidden')).toBe(true)
  })

  it('toggles mobile menu visibility when the toggle button is clicked', async () => {
    const wrapper = mountHeader()
    const toggleMenuButton = wrapper.find('button[aria-controls="mobile-navigation-menu"]')
    const mobileMenu = wrapper.find('#mobile-navigation-menu')

    expect(toggleMenuButton.attributes('aria-expanded')).toBe('false')
    expect(mobileMenu.classes()).toContain('hidden')

    await toggleMenuButton.trigger('click')

    expect(toggleMenuButton.attributes('aria-expanded')).toBe('true')
    expect(mobileMenu.classes()).toContain('block')

    await toggleMenuButton.trigger('click')

    expect(toggleMenuButton.attributes('aria-expanded')).toBe('false')
    expect(mobileMenu.classes()).toContain('hidden')
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
    expect(wrapper.find('#mobile-navigation-menu').classes()).toContain('block')

    route.path = '/exposures'
    route.fullPath = '/exposures'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#mobile-navigation-menu').classes()).toContain('hidden')
  })

  it('shows the user dropdown when showUserDropdown is true', () => {
    const wrapper = mount(Header, {
      props: {
        showUserDropdown: true,
      },
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

    expect(wrapper.findComponent(UserDropdown).exists()).toBe(true)
  })

  it('hides the user dropdown when showUserDropdown is false', () => {
    const wrapper = mount(Header, {
      props: {
        showUserDropdown: false,
      },
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

    expect(wrapper.findComponent(UserDropdown).exists()).toBe(false)
  })
})
