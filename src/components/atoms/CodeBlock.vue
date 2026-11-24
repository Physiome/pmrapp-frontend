<script setup lang="ts">
import type { editor as MonacoEditor } from 'monaco-editor/editor/editor.api';
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import '@/assets/monaco.css';
import PlainCodeBlock from '@/components/atoms/PlainCodeBlock.vue';
import SkeletonBlock from '@/components/atoms/SkeletonBlock.vue';
import { CODE_VIEW_MAX_HEIGHT, CODE_VIEW_THEMES } from '@/constants/codeLanguage';
import { FILE_PANEL_SCROLL_SYNC } from '@/constants/filePanel';
import { detectCodeLanguage, toMonacoLanguage } from '@/utils/codeLanguage';
import { loadMonaco, type Monaco } from '@/utils/monaco';

const props = defineProps<{
  code: string;
  filename: string;
  startWrapped?: boolean;
}>();

const host = ref<HTMLElement | null>(null);
const contentHeight = ref<number | null>(null);
const loadFailed = ref(false);
// The content height is known once the editor has been created.
const isEditorReady = computed(() => contentHeight.value !== null);
const detectedLanguage = computed(() => detectCodeLanguage(props.filename));

// Inside a sticky file panel, the editor scrolls with the page and uses the browser's scrollbar.
const scrollSync = inject(FILE_PANEL_SCROLL_SYNC, null);

// Short files fit their content. Long files are capped so that a sticky file panel fits below the
// header, and the editor only renders the visible lines.
const hostStyle = computed(() =>
  contentHeight.value === null
    ? undefined
    : { height: `min(${contentHeight.value}px, ${CODE_VIEW_MAX_HEIGHT})` },
);

let monaco: Monaco | null = null;
let editor: MonacoEditor.IStandaloneCodeEditor | null = null;
let model: MonacoEditor.ITextModel | null = null;
let colourSchemeQuery: MediaQueryList | null = null;
let isUnmounted = false;
// Set while the editor follows the page, so that the editor does not scroll the page back.
let isFollowingPage = false;

const ariaLabel = (filename: string) => `Code view of ${filename || 'file'}`;

const themeName = (isDark: boolean) => (isDark ? CODE_VIEW_THEMES.dark : CODE_VIEW_THEMES.light);

/**
 * Send vertical mouse-wheel scrolling to the page instead of the editor, when the editor follows
 * the page scroll. Horizontal scrolling (including Shift + wheel) still scrolls long lines.
 */
const handleWheel = (event: WheelEvent) => {
  if (!event.shiftKey && Math.abs(event.deltaY) >= Math.abs(event.deltaX)) {
    event.stopPropagation();
  }
};

/**
 * Keep the page where it is when the find widget (Ctrl/Cmd + F) takes focus.
 */
const handleFocusIn = (event: FocusEvent) => {
  const target = event.target;
  if (!(target instanceof Element) || !target.closest('.find-widget')) return;

  const positions: { element: Element; top: number; left: number }[] = [];
  for (let element = target.parentElement; element; element = element.parentElement) {
    positions.push({ element, top: element.scrollTop, left: element.scrollLeft });
  }
  const { scrollX, scrollY } = window;

  queueMicrotask(() => {
    for (const { element, top, left } of positions) {
      if (element.scrollTop !== top) element.scrollTop = top;
      if (element.scrollLeft !== left) element.scrollLeft = left;
    }
    if (window.scrollX !== scrollX || window.scrollY !== scrollY) window.scrollTo(scrollX, scrollY);
  });
};

const handleColourSchemeChange = (event: MediaQueryListEvent) => {
  monaco?.editor.setTheme(themeName(event.matches));
};

/**
 * Create the editor in the host element and connect it to the colour scheme and, inside a sticky
 * file panel, to the page scroll.
 */
const createEditor = (monaco: Monaco, hostElement: HTMLElement) => {
  colourSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  colourSchemeQuery.addEventListener('change', handleColourSchemeChange);

  // The editor creates its own model from `value` and `language`,
  // so that its options (notably `largeFileOptimizations`) apply
  // before the model decides whether it can be highlighted.
  editor = monaco.editor.create(hostElement, {
    value: props.code,
    language: toMonacoLanguage(detectedLanguage.value),
    theme: themeName(colourSchemeQuery.matches),
    ariaLabel: ariaLabel(props.filename),
    readOnly: true,
    domReadOnly: true,
    automaticLayout: true,
    // Keep highlighting files up to the 20 MB preview limit;
    // Monaco otherwise turns it off for files of 20 MB or 300,000 lines.
    // The model fixes this when it is created.
    largeFileOptimizations: false,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: props.startWrapped ? 'on' : 'off',
    lineNumbers: 'on',
    folding: true,
    contextmenu: false,
    renderLineHighlight: 'none',
    // The find widget overlays the first lines instead of adding space above them,
    // which would change the content height and scroll the editor, and with it the page.
    find: { addExtraSpaceOnTop: false },
    occurrencesHighlight: 'off',
    selectionHighlight: false,
    fontFamily: "Consolas, Monaco, 'Courier New', monospace",
    fontSize: 14,
    lineHeight: 21,
    padding: { top: 16, bottom: 16 },
    // In a sticky file panel the page scrollbar is used, so the editor's own is hidden.
    scrollbar: scrollSync
      ? { vertical: 'hidden', verticalScrollbarSize: 0, alwaysConsumeMouseWheel: false }
      : { alwaysConsumeMouseWheel: false },
  });
  model = editor.getModel();
  hostElement.addEventListener('focusin', handleFocusIn, { capture: true });

  editor.onDidContentSizeChange((event) => {
    contentHeight.value = event.contentHeight;
    scrollSync?.setContentHeight(event.contentHeight);
  });
  contentHeight.value = editor.getContentHeight();

  if (scrollSync) {
    scrollSync.setContentHeight(contentHeight.value);
    // Scrolling the page scrolls the editor; when the editor scrolls itself, for example to a
    // search match or with the keyboard, the page scrolls to match.
    scrollSync.onPageScroll((offset) => {
      isFollowingPage = true;
      editor?.setScrollTop(offset);
      isFollowingPage = false;
    });
    editor.onDidScrollChange((event) => {
      if (event.scrollTopChanged && !isFollowingPage) scrollSync.scrollPageTo(event.scrollTop);
    });
    // Capture the wheel before it reaches the editor's own handler.
    hostElement.addEventListener('wheel', handleWheel, { capture: true, passive: true });
  }
};

/** Dispose of the editor and disconnect everything that `createEditor` connected. */
const destroyEditor = () => {
  colourSchemeQuery?.removeEventListener('change', handleColourSchemeChange);
  colourSchemeQuery = null;
  host.value?.removeEventListener('wheel', handleWheel, { capture: true });
  host.value?.removeEventListener('focusin', handleFocusIn, { capture: true });
  scrollSync?.onPageScroll(null);
  scrollSync?.setContentHeight(null);
  // The editor owns its model and disposes of it too.
  editor?.dispose();
  editor = null;
  model = null;
};

const showFallback = (err: unknown) => {
  console.error('Error loading the code viewer:', err);
  loadFailed.value = true;
};

onMounted(async () => {
  try {
    monaco = await loadMonaco();
  } catch (err) {
    showFallback(err);
    return;
  }

  // The component may have been unmounted while Monaco was loading.
  if (isUnmounted || !host.value) return;

  try {
    createEditor(monaco, host.value);
  } catch (err) {
    // Do not leave a half-created editor behind the plain-text fallback.
    destroyEditor();
    showFallback(err);
  }
});

onBeforeUnmount(() => {
  isUnmounted = true;
  destroyEditor();
});

watch(
  () => props.code,
  (code) => {
    if (model && model.getValue() !== code) model.setValue(code);
  },
);

watch(
  () => props.filename,
  (filename) => {
    if (model && monaco) {
      monaco.editor.setModelLanguage(model, toMonacoLanguage(detectedLanguage.value));
    }
    editor?.updateOptions({ ariaLabel: ariaLabel(filename) });
  },
);

watch(
  () => props.startWrapped,
  (isWrapped) => {
    editor?.updateOptions({ wordWrap: isWrapped ? 'on' : 'off' });
  },
);
</script>

<template>
  <PlainCodeBlock v-if="loadFailed" :code="code" :start-wrapped="startWrapped" />
  <div
    v-else
    class="code-block relative rounded overflow-hidden outline outline-gray-200 dark:outline-gray-700"
    :data-language="detectedLanguage ?? 'plaintext'"
    :data-wrapped="startWrapped ? 'true' : 'false'"
  >
    <div
      ref="host"
      class="code-block-editor"
      :class="{ 'is-loading': !isEditorReady }"
      :style="hostStyle"
    />
    <!-- Shown while Monaco loads, matching the placeholder in LazyCodeBlock. -->
    <SkeletonBlock v-if="!isEditorReady" class="code-block-skeleton" />
  </div>
</template>

<style scoped>
.code-block-editor {
  min-height: 3rem;
}

/* The height of the skeleton: three lines with gaps, plus padding. */
.code-block-editor.is-loading {
  min-height: 5.75rem;
}

/*
 * Monaco draws tooltips, such as those of the find widget's buttons, inside the editor,
 * where the code block clips them and they can cover the buttons.
 * The buttons keep their accessible labels.
 */
.code-block-editor :deep(.workbench-hover) {
  display: none;
}

/*
 * The find widget has no replace toggle in a read-only editor, so it does not keep space for it,
 * and it keeps the same gap from the right edge as from the top, also when no scrollbar is shown.
 */
.code-block-editor :deep(.find-widget) {
  margin-right: 4px;
  padding-left: 4px;
  border-radius: 4px 4px;
}

.code-block-editor :deep(.find-widget > .find-part) {
  margin-left: 4px;
}

.code-block-skeleton {
  position: absolute;
  inset: 0;
  padding: 1rem;
  background-color: var(--color-surface);
}
</style>
