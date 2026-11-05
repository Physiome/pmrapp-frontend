import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from '@/components/atoms/ConfirmDialog.vue';

// Mock analytics (used by ActionButton via vue-router).
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/' }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/utils/analytics', () => ({
  trackButtonClick: vi.fn(),
}));

describe('ConfirmDialog', () => {
  it('does not render when show is false', () => {
    const wrapper = mount(ConfirmDialog, { props: { show: false } });
    expect(wrapper.find('.fixed').exists()).toBe(false);
  });

  it('renders with default props when show is true', () => {
    const wrapper = mount(ConfirmDialog, { props: { show: true } });
    expect(wrapper.find('.fixed').exists()).toBe(true);
    expect(wrapper.find('h2').text()).toBe('Confirm');
    expect(wrapper.find('p').text()).toBe('Are you sure?');
  });

  it('renders custom title and message', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { show: true, title: 'Log out', message: 'Are you sure you want to log out?' },
    });
    expect(wrapper.find('h2').text()).toBe('Log out');
    expect(wrapper.find('p').text()).toBe('Are you sure you want to log out?');
  });

  it('emits confirm when confirm button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, { props: { show: true } });
    const buttons = wrapper.findAll('button');
    const confirmButton = buttons.find((b) => b.text() === 'Confirm');
    expect(confirmButton).toBeDefined();
    await confirmButton?.trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, { props: { show: true } });
    const buttons = wrapper.findAll('button');
    const cancelButton = buttons.find((b) => b.text() === 'Cancel');
    expect(cancelButton).toBeDefined();
    await cancelButton?.trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('emits cancel when backdrop is clicked', async () => {
    const wrapper = mount(ConfirmDialog, { props: { show: true } });
    await wrapper.find('.fixed').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('emits cancel when Escape key is pressed', async () => {
    const wrapper = mount(ConfirmDialog, { props: { show: false } });
    await wrapper.setProps({ show: true });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('cancel')).toBeTruthy();
    wrapper.unmount();
  });
});
