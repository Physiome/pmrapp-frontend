import type { InjectionKey } from 'vue';
import type { FilePanelScrollSync } from '@/types/filePanel';

/** Provided by a sticky `FilePanel` so that the code viewer inside it can follow the page scroll. */
export const FILE_PANEL_SCROLL_SYNC: InjectionKey<FilePanelScrollSync> =
  Symbol('filePanelScrollSync');
