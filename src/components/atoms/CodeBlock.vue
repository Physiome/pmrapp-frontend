<script setup lang="ts">
import Prism from 'prismjs';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-fortran';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-matlab';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

const props = defineProps<{
  code: string;
  filename: string;
  startWrapped?: boolean;
}>();

const codeBlock = ref<HTMLElement | null>(null);
const preBlock = ref<HTMLElement | null>(null);
const darkThemeMediaQuery = ref<MediaQueryList | null>(null);
const isWrapped = ref(false);
let observer: ResizeObserver | null = null;

const preformatClass = computed(() =>
  [
    'line-numbers',
    'bg-gray-50',
    'dark:bg-gray-900',
    'rounded',
    'overflow-x-auto',
    'text-sm!',
    'm-0!',
  ].join(' '),
);

const detectedLanguage = computed(() => {
  const ext = props.filename.split('.').pop()?.toLowerCase();

  // Map file extensions to Prism language names.
  const languageMap: Record<string, string> = {
    c: 'c',
    cellml: 'markup',
    conf: 'json',
    cpp: 'cpp',
    css: 'css',
    f77: 'fortran',
    fortran: 'fortran',
    h: 'cpp',
    htm: 'markup',
    html: 'markup',
    js: 'javascript',
    json: 'json',
    jsx: 'javascript',
    m: 'matlab',
    markdown: 'markdown',
    matlab: 'matlab',
    md: 'markdown',
    neon: 'json',
    py: 'python',
    python: 'python',
    rdf: 'markup',
    sass: 'css',
    scss: 'css',
    sedml: 'markup',
    svg: 'markup',
    ts: 'javascript',
    tsx: 'javascript',
    xml: 'markup',
    xul: 'markup',
  };

  return ext ? languageMap[ext] || 'plaintext' : 'none';
});

const highlightCode = async () => {
  await nextTick();
  if (codeBlock.value && props.code) {
    try {
      // Clear previous highlighting.
      codeBlock.value.removeAttribute('data-highlighted');

      if (detectedLanguage.value !== 'none') {
        Prism.highlightElement(codeBlock.value);
      }
    } catch (err) {
      console.error('Error highlighting code:', err);
    }
  }
};

const syncWrapAndLineNumbers = async () => {
  if (!preBlock.value || !codeBlock.value) return;

  // Keep wrap classes in sync after Prism mutates highlighted markup.
  preBlock.value.classList.toggle('!whitespace-pre-wrap', isWrapped.value);
  codeBlock.value.classList.toggle('!whitespace-pre-wrap', isWrapped.value);

  await nextTick();

  // Re-check refs after await in case the component was unmounted.
  if (!preBlock.value) return;

  if (!isWrapped.value) {
    const lineSpans = preBlock.value.querySelectorAll('.line-numbers-rows > span');
    lineSpans.forEach((span) => {
      const lineSpan = span as HTMLElement;
      lineSpan.style.height = '';
    });
  }

  if (Prism.plugins.lineNumbers?.resize) {
    Prism.plugins.lineNumbers.resize(preBlock.value);
  }
};

const refreshCodeBlock = async () => {
  await highlightCode();
  await syncWrapAndLineNumbers();
};

const loadPrismTheme = async (isDark: boolean) => {
  // Remove existing Prism theme stylesheets.
  const existingThemes = document.querySelectorAll('link[data-prism-theme]');
  existingThemes.forEach((link) => {
    link.remove();
  });

  // Create and add new theme stylesheet.
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.setAttribute('data-prism-theme', 'true');

  // Import from local node_modules.
  if (isDark) {
    const theme = await import('prismjs/themes/prism-okaidia.css?url');
    link.href = theme.default;
  } else {
    const theme = await import('prismjs/themes/prism.css?url');
    link.href = theme.default;
  }

  document.head.appendChild(link);
};

const handleThemeChange = (e: MediaQueryListEvent) => {
  loadPrismTheme(e.matches);
};

onMounted(() => {
  if (props.startWrapped) {
    isWrapped.value = true;
  }

  void refreshCodeBlock();

  darkThemeMediaQuery.value = window.matchMedia('(prefers-color-scheme: dark)');

  // Load initial theme.
  loadPrismTheme(darkThemeMediaQuery.value.matches);

  // Listen for theme changes.
  darkThemeMediaQuery.value.addEventListener('change', handleThemeChange);

  if (preBlock.value && typeof ResizeObserver === 'function') {
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (Prism.plugins.lineNumbers?.resize) {
          Prism.plugins.lineNumbers.resize(entry.target as HTMLElement);
        }
      }
    });

    observer.observe(preBlock.value);
  }
});

onBeforeUnmount(() => {
  if (darkThemeMediaQuery.value) {
    darkThemeMediaQuery.value.removeEventListener('change', handleThemeChange);
  }

  if (observer) {
    observer.disconnect();
  }
});

watch(
  () => props.code,
  () => {
    void refreshCodeBlock();
  },
);

watch(
  () => props.startWrapped,
  (newVal) => {
    if (!preBlock.value || !codeBlock.value) return;

    if (newVal !== undefined) {
      isWrapped.value = newVal;
      void syncWrapAndLineNumbers();
    }
  },
);
</script>

<template>
  <pre ref="preBlock" :class="preformatClass"><code
    ref="codeBlock"
    :class="`language-${detectedLanguage}`"
  >{{ code }}</code></pre>
</template>

<style scoped>
pre {
  margin: 0;
  padding: 1em;
  padding-left: 3.8em;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  line-height: 1.5;
}

code {
  font-family: inherit;
}
</style>

<!-- biome-ignore lint/suspicious/useScopedStyles: global overrides for Prism token styles rendered outside this component -->
<style>
@media (prefers-color-scheme: light) {
  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    /* biome-ignore lint/complexity/noImportantStyles: needed to override the Prism theme background */
    background: transparent !important;
  }
}
</style>
