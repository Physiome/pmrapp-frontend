<script setup lang="ts">
import type { editor as MonacoEditor } from 'monaco-editor/editor/editor.api';
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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

const handleColourSchemeChange = (event: MediaQueryListEvent) => {
  monaco?.editor.setTheme(themeName(event.matches));
};

onMounted(async () => {
  try {
    monaco = await loadMonaco();
  } catch (err) {
    console.error('Error loading the code viewer:', err);
    loadFailed.value = true;
    return;
  }

  // The component may have been unmounted while Monaco was loading.
  if (isUnmounted || !host.value) return;

  colourSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  colourSchemeQuery.addEventListener('change', handleColourSchemeChange);

  // The editor creates its own model from `value` and `language`,
  // so that its options (notably `largeFileOptimizations`) apply
  // before the model decides whether it can be highlighted.
  editor = monaco.editor.create(host.value, {
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
    host.value.addEventListener('wheel', handleWheel, { capture: true, passive: true });
  }
});

onBeforeUnmount(() => {
  isUnmounted = true;
  colourSchemeQuery?.removeEventListener('change', handleColourSchemeChange);
  host.value?.removeEventListener('wheel', handleWheel, { capture: true });
  scrollSync?.onPageScroll(null);
  scrollSync?.setContentHeight(null);
  // The editor owns its model and disposes of it too.
  editor?.dispose();
  editor = null;
  model = null;
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
  <div
    class="code-block"
    :data-language="detectedLanguage ?? 'plaintext'"
    :data-wrapped="startWrapped ? 'true' : 'false'"
  >
    <pre
      v-if="loadFailed"
      class="code-block-fallback"
      :style="{ maxHeight: CODE_VIEW_MAX_HEIGHT, whiteSpace: startWrapped ? 'pre-wrap' : 'pre' }"
    >{{ code }}</pre>
    <div v-else ref="host" class="code-block-editor" :style="hostStyle" />
  </div>
</template>

<style scoped>
.code-block {
  border-radius: 0.25rem;
  overflow: hidden;
  outline: 1px solid var(--color-gray-200, #e5e7eb);
}

.code-block-editor {
  min-height: 3rem;
}

.code-block-fallback {
  margin: 0;
  padding: 1em;
  overflow: auto;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

@media (prefers-color-scheme: dark) {
  .code-block {
    outline-color: var(--color-gray-700, #374151);
  }
}
</style>
