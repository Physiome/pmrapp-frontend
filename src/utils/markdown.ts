/**
 * Simple markdown to HTML converter with basic support.
 */
export const renderMarkdown = (markdown: string): string => {
  if (!markdown) return '';

  // 1. Safety: Escape HTML to prevent XSS (basic implementation).
  let html = markdown.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 2. Extract Code Blocks to prevent internal formatting.
  // We store them in a map and replace them with a unique placeholder.
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  // Extract multi-line code blocks.
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code);
    return `__CODEBLOCK_${codeBlocks.length - 1}__`;
  });

  // Extract inline code.
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code);
    return `__INLINECODE_${inlineCodes.length - 1}__`;
  });

  // 3. Process General Markdown.
  html = html
    // Headers (H3 -> H1 order matters to prevent # matching ###).
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-0 mb-4">$1</h1>')

    // Bold & Italic.
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

    // Links.
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">$1</a>',
    )

    // Auto-linkify raw URLs (http:// and https://).
    // Match URLs that are not already inside <a> tags.
    // Uses negative lookbehind to exclude trailing punctuation.
    .replace(
      /(?<!href="|">)(https?:\/\/[^\s<]+(?<![.,;:!?)\]]))/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">$1</a>',
    )

    // Auto-linkify email addresses.
    // Match email patterns and convert to mailto: links.
    .replace(
      /(?<!href="|">|mailto:)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      '<a href="mailto:$1" class="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300">$1</a>',
    );

  // Convert list items - check for loose lists (items separated by blank lines) per item.
  html = html.replace(/^\s*[-*] (.*$)/gim, (match, content, offset, string) => {
    // Look ahead to see if this list item is followed by a blank line before the next list item.
    const remainingText = string.substring(offset + match.length);
    const hasBlankLineAfter = /^\n\n\s*[-*] /.test(remainingText);

    // Look behind to see if there was a blank line before this item.
    const precedingText = string.substring(0, offset);
    const hasBlankLineBefore = /[-*] .*\n\n\s*$/.test(precedingText);

    // If either before or after has blank lines, it's a loose list.
    if (hasBlankLineAfter || hasBlankLineBefore) {
      return `<li><p class="mb-4">${content}</p></li>`;
    }
    return `<li>${content}</li>`;
  });

  // Wrap lists in <ul>.
  // We use a non-greedy logic: Look for a group of <li> lines and wrap them.
  // Note: Regex list parsing is fragile. This handles basic contiguous lists.
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    return `\n\n<ul class="list-disc ml-6 mb-4">${match}</ul>\n\n`;
  });

  // 4. Handle Paragraphs and Line Breaks.
  // Split by double newlines for paragraphs, but ignore lines that are already HTML block elements.
  html = html
    .split('\n\n')
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';
      // If the paragraph starts with a block tag (h1, h2, ul, etc), don't wrap in <p>.
      if (trimmed.match(/^<(h\d|ul|pre|blockquote)/)) {
        return trimmed;
      }
      return `<p class="mb-4">${trimmed.replace(/\n/g, '')}</p>`;
    })
    .join('\n');

  // 5. Restore Code Blocks (Injecting back the HTML structure).
  html = html.replace(/__CODEBLOCK_(\d+)__/g, (_, index) => {
    return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto mb-4"><code class="text-sm font-mono">${codeBlocks[Number(index)]}</code></pre>`;
  });

  html = html.replace(/__INLINECODE_(\d+)__/g, (_, index) => {
    return `<code class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-mono">${inlineCodes[Number(index)]}</code>`;
  });

  return html;
};
