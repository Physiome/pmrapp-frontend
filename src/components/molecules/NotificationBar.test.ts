import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NotificationBar from '@/components/molecules/NotificationBar.vue'

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

describe('NotificationBar', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('removes the resize listener after the notification has already been dismissed', async () => {
    mockGet.mockResolvedValue('true')
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const wrapper = mount(NotificationBar)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    wrapper.unmount()
  })

  it('removes the resize listener when the notification is closed', async () => {
    mockGet.mockResolvedValue(null)
    mockSet.mockResolvedValue(undefined)
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const wrapper = mount(NotificationBar)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    await wrapper.findComponent({ name: 'CloseButton' }).trigger('click')
    await wrapper.vm.$nextTick()

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))

    wrapper.unmount()
  })
})
