import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncHeightToCssProperty } from './elementHeight';

const createElement = (height: number) => {
  const element = document.createElement('div');
  element.getBoundingClientRect = vi.fn(() => ({ height }) as DOMRect);
  return element;
};

describe('syncHeightToCssProperty', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sets the property to the element height straight away', () => {
    const element = createElement(84);

    syncHeightToCssProperty(element, '--header-height');

    expect(element.style.getPropertyValue('--header-height')).toBe('84px');
  });

  it('sets the property on a separate target element', () => {
    const element = createElement(57);
    const target = document.createElement('div');

    syncHeightToCssProperty(element, '--toolbar-height', target);

    expect(target.style.getPropertyValue('--toolbar-height')).toBe('57px');
    expect(element.style.getPropertyValue('--toolbar-height')).toBe('');
  });

  it('updates the property when the element resizes and stops when cleaned up', () => {
    let notifyResize = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notifyResize = callback;
        }
        observe() {}
        disconnect = disconnect;
      },
    );
    let height = 130;
    const element = document.createElement('div');
    element.getBoundingClientRect = () => ({ height }) as DOMRect;

    const stop = syncHeightToCssProperty(element, '--header-height');
    height = 84;
    notifyResize();

    expect(element.style.getPropertyValue('--header-height')).toBe('84px');

    stop();

    expect(disconnect).toHaveBeenCalledOnce();
    expect(element.style.getPropertyValue('--header-height')).toBe('');
  });
});
