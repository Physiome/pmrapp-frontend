/**
 * Links the page scroll to a scrolling viewer inside a sticky file panel, so that the viewer uses
 * the browser's scrollbar. The panel sticks below the header inside a track as tall as the
 * viewer's full content; scrolling the page then scrolls the viewer by the same amount.
 */
export interface FilePanelScrollSync {
  /** Set the full height of the viewer's content in pixels, or null when there is no viewer. */
  setContentHeight: (height: number | null) => void;
  /** Register the handler that scrolls the viewer to an offset when the page scrolls. */
  onPageScroll: (handler: ((offset: number) => void) | null) => void;
  /** Scroll the page so that the viewer shows the given offset, after it scrolled itself. */
  scrollPageTo: (offset: number) => void;
}
