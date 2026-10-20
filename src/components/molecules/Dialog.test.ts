import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Dialog from '@/components/molecules/Dialog.vue'

describe('Dialog', () => {
  it('does not render when show is false', () => {
    const wrapper = mount(Dialog, { props: { show: false } })
    expect(wrapper.find('.fixed').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders title and slot content when shown', () => {
    const wrapper = mount(Dialog, {
      props: { show: true, title: 'Dialog Title' },
      slots: {
        default: '<p data-test="dialog-content">Dialog body content</p>',
      },
    })
    expect(wrapper.find('.fixed').exists()).toBe(true)
    expect(wrapper.find('h2').text()).toBe('Dialog Title')
    expect(wrapper.find('[data-test="dialog-content"]').text()).toBe('Dialog body content')
    wrapper.unmount()
  })

  it('hides title element when title is not provided', () => {
    const wrapper = mount(Dialog, {
      props: { show: true },
      slots: {
        default: '<div>Content</div>',
      },
    })
    expect(wrapper.find('h2').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits close when close button is clicked', async () => {
    const wrapper = mount(Dialog, {
      props: { show: true },
      slots: {
        default: '<div>Content</div>',
      },
    })
    await wrapper.find('button[aria-label="Close"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits close when backdrop is clicked', async () => {
    const wrapper = mount(Dialog, {
      props: { show: true },
      slots: {
        default: '<div>Content</div>',
      },
    })
    const backdrop = wrapper.find('.fixed')
    await backdrop.trigger('mousedown', { button: 0 })
    await backdrop.trigger('mouseup')
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits close when Escape key is pressed', async () => {
    const wrapper = mount(Dialog, {
      props: { show: true },
      slots: {
        default: '<div>Content</div>',
      },
    })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('does not emit close when Escape was already handled by a child', async () => {
    const wrapper = mount(Dialog, {
      props: { show: true },
      slots: {
        default: '<div>Content</div>',
      },
    })
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true })
    event.preventDefault()
    document.dispatchEvent(event)
    expect(wrapper.emitted('close')).toBeFalsy()
    wrapper.unmount()
  })
})
