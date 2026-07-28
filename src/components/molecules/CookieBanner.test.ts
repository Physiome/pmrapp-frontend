import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CookieBanner from '@/components/molecules/CookieBanner.vue'
import { COOKIE } from '@/constants/global'

const { mockGet, mockSet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
}))

vi.mock('@/utils/cookie', () => ({
  Cookie: {
    get: mockGet,
    set: mockSet,
  },
}))

describe('CookieBanner', () => {
  let wrapper: VueWrapper<InstanceType<typeof CookieBanner>> | null = null

  afterEach(() => {
    vi.clearAllMocks()
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  it('renders the banner when the cookie has not been set', async () => {
    mockGet.mockResolvedValue(null)

    wrapper = mount(CookieBanner)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.text()).toContain('We use cookies')
  })

  it('does not render the banner when the cookie is already set to "true"', async () => {
    mockGet.mockResolvedValue('true')

    wrapper = mount(CookieBanner)
    // First nextTick: flush initial mount. Second nextTick: flush reactivity
    // after the async onMounted callback resolves and sets isVisible = false.
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('We use cookies')
  })

  it('hides the banner and sets the cookie when the accept button is clicked', async () => {
    mockGet.mockResolvedValue(null)
    mockSet.mockResolvedValue(undefined)

    wrapper = mount(CookieBanner)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').exists()).toBe(true)

    await wrapper.find('button').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockSet).toHaveBeenCalledWith(COOKIE.BANNER_NAME, 'true', COOKIE.BANNER_DAYS)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('hides the banner and sets the cookie when the close button is clicked', async () => {
    mockGet.mockResolvedValue(null)
    mockSet.mockResolvedValue(undefined)

    wrapper = mount(CookieBanner)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').exists()).toBe(true)

    await wrapper.findComponent({ name: 'CloseButton' }).trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockSet).toHaveBeenCalledWith(COOKIE.BANNER_NAME, 'true', COOKIE.BANNER_DAYS)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('calls Cookie.get with the banner name on mount', async () => {
    mockGet.mockResolvedValue(null)

    wrapper = mount(CookieBanner)
    // Two nextTicks to flush both the async onMounted and reactivity updates.
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockGet).toHaveBeenCalledWith(COOKIE.BANNER_NAME)
  })
})
