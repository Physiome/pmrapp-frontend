import { mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FeedbackButton from '@/components/atoms/FeedbackButton.vue'
import { GITHUB_ISSUES_URL } from '@/constants/global'

// Define the route with vi.hoisted so it is available before the mock factory
// runs. The component import is hoisted above this declaration, so referencing
// a plain const here would hit the temporal dead zone.
const { route } = vi.hoisted(() => ({
  route: {
    name: 'home',
    path: '/',
    fullPath: '/',
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => route,
}))

vi.mock('@/utils/analytics', () => ({
  trackButtonClick: vi.fn(),
}))

describe('FeedbackButton', () => {
  let wrapper: VueWrapper<InstanceType<typeof FeedbackButton>> | null = null

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
      wrapper = null
    }
  })

  const mountFeedbackButton = () =>
    mount(FeedbackButton, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
        },
      },
    })

  it('renders a button with the feedback aria-label', () => {
    wrapper = mountFeedbackButton()

    const button = wrapper.find('a[aria-label="Report a bug or give feedback"]')
    expect(button.exists()).toBe(true)
  })

  it('links to the GitHub new issue page with the current page URL in the body', () => {
    wrapper = mountFeedbackButton()

    const button = wrapper.find('a[aria-label="Report a bug or give feedback"]')
    const href = button.attributes('href')

    expect(href).toContain(`${GITHUB_ISSUES_URL}/new`)
    expect(href).toContain('title=')
    expect(href).toContain('body=')
    expect(href).toContain(encodeURIComponent('**Page:**'))
  })

  it('opens the link in a new tab with noopener and noreferrer', () => {
    wrapper = mountFeedbackButton()

    const button = wrapper.find('a[aria-label="Report a bug or give feedback"]')
    expect(button.attributes('target')).toBe('_blank')
    expect(button.attributes('rel')).toBe('noopener noreferrer')
  })

  it('shows the feedback content when the popover is triggered', async () => {
    wrapper = mountFeedbackButton()

    // The Popover handlers live on its wrapping span, and mouseenter does not
    // bubble, so trigger the event directly on that span.
    await wrapper.find('span.inline-flex').trigger('mouseenter')
    await wrapper.vm.$nextTick()

    // The popover content is teleported to the body.
    const popover = document.body.querySelector('[role="tooltip"]')
    expect(popover).not.toBeNull()
    expect(popover?.textContent).toContain('work in progress')
  })

  it('hides the popover content when the trigger is left', async () => {
    wrapper = mountFeedbackButton()

    await wrapper.find('span.inline-flex').trigger('mouseenter')
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[role="tooltip"]')).not.toBeNull()

    await wrapper.find('span.inline-flex').trigger('mouseleave')

    // The popover hides after a short delay.
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(document.body.querySelector('[role="tooltip"]')).toBeNull()
  })
})
