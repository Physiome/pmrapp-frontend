import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PreviewBanner from '@/components/molecules/PreviewBanner.vue'
import { PMR2_URL } from '@/constants/global'

const ActionButtonStub = {
  name: 'ActionButton',
  props: ['href', 'to', 'variant', 'size'],
  template: '<a :href="href" :data-to="to"><slot /></a>',
}

const NotificationBarStub = {
  name: 'NotificationBar',
  template: '<div><slot /></div>',
}

describe('PreviewBanner', () => {
  it('renders the preview notification text', () => {
    const wrapper = mount(PreviewBanner, {
      global: {
        stubs: {
          ActionButton: ActionButtonStub,
          NotificationBar: NotificationBarStub,
        },
      },
    })

    expect(wrapper.text()).toContain('You are viewing a preview version.')
  })

  it('renders action buttons for production site and feature comparison', () => {
    const wrapper = mount(PreviewBanner, {
      global: {
        stubs: {
          ActionButton: ActionButtonStub,
          NotificationBar: NotificationBarStub,
        },
      },
    })

    const buttons = wrapper.findAll('a')
    expect(buttons).toHaveLength(2)
    expect(buttons[0].text()).toBe('Go back to production')
    expect(buttons[0].attributes('href')).toBe(PMR2_URL)
    expect(buttons[1].text()).toBe('Feature comparison')
    expect(buttons[1].attributes('data-to')).toBe('/feature-comparison')
  })
})
