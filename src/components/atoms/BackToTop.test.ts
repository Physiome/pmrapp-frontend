import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import BackToTop from '@/components/atoms/BackToTop.vue';

describe('BackToTop', () => {
  let wrapper: VueWrapper<InstanceType<typeof BackToTop>> | null = null;
  let originalScrollYDescriptor: PropertyDescriptor | undefined;

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = null;
    }

    // Restore original scrollY descriptor if it was captured.
    if (originalScrollYDescriptor !== undefined) {
      Object.defineProperty(window, 'scrollY', originalScrollYDescriptor);
      originalScrollYDescriptor = undefined;
    }
  });

  it('does not render the button when not scrolled down', () => {
    wrapper = mount(BackToTop);
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders button immediately when mounted with scrollY > 300', async () => {
    // Capture original descriptor before modifying.
    originalScrollYDescriptor =
      Object.getOwnPropertyDescriptor(window, 'scrollY') ||
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'scrollY');

    // Set scrollY before mounting to simulate deep link or scroll restoration.
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));

    wrapper = mount(BackToTop);
    await wrapper.vm.$nextTick();

    // Button should be visible immediately without needing a scroll event.
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.classes()).toContain('cursor-pointer');
  });

  it('button has cursor-pointer class when visible', async () => {
    wrapper = mount(BackToTop);

    // Capture original descriptor before modifying.
    originalScrollYDescriptor =
      Object.getOwnPropertyDescriptor(window, 'scrollY') ||
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), 'scrollY');

    // Simulate scrolling down more than 300px.
    Object.defineProperty(window, 'scrollY', { value: 400, writable: true, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    await wrapper.vm.$nextTick();
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.classes()).toContain('cursor-pointer');
  });
});
