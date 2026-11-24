/**
 * Keep a CSS custom property set to the rendered height of an element, updating it whenever the
 * element resizes (for example when the notification bar is closed or the toolbar wraps).
 * @param element The element to measure.
 * @param propertyName The CSS custom property to set, such as `--header-height`.
 * @param target The element that holds the property; defaults to the measured element.
 * @returns A function that stops observing and removes the property.
 */
export const syncHeightToCssProperty = (
  element: HTMLElement,
  propertyName: string,
  target: HTMLElement = element,
): (() => void) => {
  const update = () => {
    target.style.setProperty(propertyName, `${element.getBoundingClientRect().height}px`);
  };
  update();

  // Older browsers and jsdom do not have ResizeObserver; the first measurement is kept.
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
  observer?.observe(element);

  return () => {
    observer?.disconnect();
    target.style.removeProperty(propertyName);
  };
};
