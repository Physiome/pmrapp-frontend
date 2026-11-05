import type { MathMLFormatOptions } from '@/types/mathml';
import { _MathTransforms as mathPolyfills } from '@/vendor/mathml-polyfills/all-polyfills-bundle.js';
import { formatNumber } from './format';

let sharedDOMParser: DOMParser | null = null;

const getDOMParser = (): DOMParser => {
  if (!sharedDOMParser) {
    sharedDOMParser = new DOMParser();
  }
  return sharedDOMParser;
};

let isMathPolyfillsInitialized = false;
const MATH_POLYFILLS_STYLE_ATTR = 'data-math-polyfills';
const OPEN_TO_CLOSE_FENCE: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>',
  '⟨': '⟩',
  '⌊': '⌋',
  '⌈': '⌉',
};
const INVISIBLE_TIMES_CHAR = '\u2062';
const VISIBLE_MULTIPLICATION_DOT = '·';
const EXPONENTIAL_E_CHAR = 'ⅇ';
const PIECEWISE_KEYWORDS = new Set(['if', 'otherwise']);
const LOGICAL_OPERATOR_LABELS: Record<string, string> = {
  '∧': 'and',
  '∨': 'or',
  '⊻': 'xor',
  '⊕': 'xor',
  '¬': 'not',
};
const GREEK_IDENTIFIER_SYMBOLS: Record<string, string> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
};

const isFenceOperator = (element: Element): element is HTMLElement =>
  element.tagName.toLowerCase() === 'mo' && element.getAttribute('fence') === 'true';

const getFenceText = (element: Element): string => (element.textContent || '').trim();

const fixMismatchedFencePairs = (root: ParentNode) => {
  const rows = root.querySelectorAll('mrow');

  rows.forEach((row) => {
    const children = Array.from(row.children);
    if (children.length < 2) return;

    const firstFence = children.find(isFenceOperator);
    const lastFence = [...children].reverse().find(isFenceOperator);

    if (!firstFence || !lastFence || firstFence === lastFence) return;

    const openingFence = getFenceText(firstFence);
    const closingFence = getFenceText(lastFence);
    const expectedClosingFence = OPEN_TO_CLOSE_FENCE[openingFence];

    if (expectedClosingFence && closingFence && closingFence !== expectedClosingFence) {
      // Remove only the mismatched trailing fence injected by polyfills.
      lastFence.remove();
    }
  });
};

const normaliseInvisibleTimesSeparators = (mathml: string): string =>
  mathml
    .replaceAll(INVISIBLE_TIMES_CHAR, VISIBLE_MULTIPLICATION_DOT)
    .replaceAll(EXPONENTIAL_E_CHAR, 'e')
    .replaceAll(/&#8290;|&#x2062;|&InvisibleTimes;/gi, VISIBLE_MULTIPLICATION_DOT);

const copyElementAttributes = (from: Element, to: Element) => {
  Array.from(from.attributes).forEach((attribute) => {
    to.setAttribute(attribute.name, attribute.value);
  });
};

const normaliseUnderscoreIdentifiers = (root: ParentNode) => {
  const identifiers = Array.from(root.querySelectorAll('mi'));

  identifiers.forEach((identifier) => {
    if (identifier.children.length > 0) return;

    const rawText = (identifier.textContent || '').trim();
    if (!rawText.includes('_')) return;

    const parts = rawText
      .split('_')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length < 2) return;

    const doc = identifier.ownerDocument;
    const namespace = identifier.namespaceURI || 'http://www.w3.org/1998/Math/MathML';
    const createIdentifier = (text: string) => {
      const mi = doc.createElementNS(namespace, 'mi');
      mi.textContent = text;
      return mi;
    };

    const baseIdentifier = createIdentifier(parts[0] || '');
    copyElementAttributes(identifier, baseIdentifier);

    let current: Element = doc.createElementNS(namespace, 'msub');
    current.appendChild(baseIdentifier);
    current.appendChild(createIdentifier(parts[1] || ''));

    parts.slice(2).forEach((part) => {
      const next = doc.createElementNS(namespace, 'msub');
      next.appendChild(current);
      next.appendChild(createIdentifier(part));
      current = next;
    });

    identifier.replaceWith(current);
  });
};

const normaliseLogicalOperators = (root: ParentNode) => {
  const operators = Array.from(root.querySelectorAll('mo'));

  operators.forEach((operator) => {
    if (operator.children.length > 0) return;

    const normalisedText = (operator.textContent || '').trim();
    const replacement = LOGICAL_OPERATOR_LABELS[normalisedText];
    if (!replacement) return;

    operator.textContent = replacement;
  });
};

const normaliseNumericLiterals = (root: ParentNode) => {
  const numerals = Array.from(root.querySelectorAll('mn'));

  numerals.forEach((numeral) => {
    if (numeral.children.length > 0) return;

    const rawText = (numeral.textContent || '').trim();
    if (!/^-?\d+$/.test(rawText)) return;

    const parsed = Number(rawText);
    if (!Number.isInteger(parsed) || Math.abs(parsed) < 1000) return;

    numeral.textContent = formatNumber(parsed);
  });
};

const isNumberToken = (value: string): boolean => /^[-+]?\d*\.?\d+$/.test(value);
const isIntegerToken = (value: string): boolean => /^[-+]?\d+$/.test(value);

const normaliseScientificENotation = (root: ParentNode) => {
  const rows = Array.from(root.querySelectorAll('mrow'));

  rows.forEach((row) => {
    const children = Array.from(row.children);
    if (children.length < 3) return;

    for (let i = 0; i <= children.length - 3; i += 1) {
      const baseNode = children[i];
      const eNode = children[i + 1];
      const exponentNode = children[i + 2];
      if (!baseNode || !eNode || !exponentNode) continue;

      if (
        baseNode.tagName.toLowerCase() !== 'mn' ||
        eNode.tagName.toLowerCase() !== 'mo' ||
        exponentNode.tagName.toLowerCase() !== 'mn'
      ) {
        continue;
      }

      const baseText = (baseNode.textContent || '').trim();
      const eText = (eNode.textContent || '').trim().toLowerCase();
      const exponentText = (exponentNode.textContent || '').trim();
      if (eText !== 'e' || !isNumberToken(baseText) || !isIntegerToken(exponentText)) {
        continue;
      }

      const doc = row.ownerDocument;
      const namespace = row.namespaceURI || 'http://www.w3.org/1998/Math/MathML';
      const multiplication = doc.createElementNS(namespace, 'mo');
      multiplication.textContent = VISIBLE_MULTIPLICATION_DOT;

      const msup = doc.createElementNS(namespace, 'msup');
      const ten = doc.createElementNS(namespace, 'mn');
      ten.textContent = '10';
      const exponent = doc.createElementNS(namespace, 'mn');
      exponent.textContent = exponentText;
      msup.appendChild(ten);
      msup.appendChild(exponent);

      const afterExponent = exponentNode.nextSibling;
      row.insertBefore(multiplication, eNode);
      row.insertBefore(msup, afterExponent);
      row.removeChild(eNode);
      row.removeChild(exponentNode);
    }
  });
};

const normaliseNamedGreekIdentifiers = (root: ParentNode) => {
  const identifiers = Array.from(root.querySelectorAll('mi'));

  identifiers.forEach((identifier) => {
    if (identifier.children.length > 0) return;

    const rawText = (identifier.textContent || '').trim();
    if (!rawText) return;

    if (rawText.includes('_')) {
      const parts = rawText.split('_');
      let hasReplacement = false;

      const normalisedParts = parts.map((part) => {
        const replacement = GREEK_IDENTIFIER_SYMBOLS[part.trim().toLowerCase()];
        if (!replacement) return part;

        hasReplacement = true;
        return replacement;
      });

      if (hasReplacement) {
        identifier.textContent = normalisedParts.join('_');
      }
      return;
    }

    const replacement = GREEK_IDENTIFIER_SYMBOLS[rawText.toLowerCase()];
    if (!replacement) return;

    identifier.textContent = replacement;
  });
};

const isMathMLElement = (node: Node, tagName: string): node is Element =>
  node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === tagName;

const normalisePiecewiseTables = (root: ParentNode, doc: Document, namespace: string) => {
  const mathTables = Array.from(root.querySelectorAll('mtable'));

  mathTables.forEach((table) => {
    const rows = Array.from(table.children).filter(
      (child) => child.tagName.toLowerCase() === 'mtr',
    );
    if (!rows.length) return;

    let hasPiecewiseRows = false;

    rows.forEach((row) => {
      const rowCells = Array.from(row.children).filter(
        (child) => child.tagName.toLowerCase() === 'mtd',
      );
      if (rowCells.length !== 1) return;

      const [singleCell] = rowCells;
      if (!singleCell) return;

      const cellNodes = Array.from(singleCell.childNodes);
      const keywordIndex = cellNodes.findIndex(
        (node) =>
          isMathMLElement(node, 'mtext') &&
          PIECEWISE_KEYWORDS.has((node.textContent || '').trim().toLowerCase()),
      );

      if (keywordIndex <= 0) return;

      hasPiecewiseRows = true;

      const expressionCell = doc.createElementNS(namespace, 'mtd');
      expressionCell.setAttribute('data-math-piecewise', 'expression');

      cellNodes.slice(0, keywordIndex).forEach((node) => {
        expressionCell.appendChild(node);
      });

      const keywordCell = doc.createElementNS(namespace, 'mtd');
      keywordCell.setAttribute('data-math-piecewise', 'keyword');

      const keywordNode = cellNodes[keywordIndex];
      const keywordText = (keywordNode?.textContent || '').trim().toLowerCase();
      if (keywordText) {
        keywordCell.setAttribute('data-math-piecewise-keyword', keywordText);
      }
      if (keywordNode) {
        keywordCell.appendChild(keywordNode);
      }

      const conditionCell = doc.createElementNS(namespace, 'mtd');
      conditionCell.setAttribute('data-math-piecewise', 'condition');
      cellNodes.slice(keywordIndex + 1).forEach((node) => {
        conditionCell.appendChild(node);
      });

      while (row.firstChild) {
        row.removeChild(row.firstChild);
      }

      row.appendChild(expressionCell);
      row.appendChild(keywordCell);
      row.appendChild(conditionCell);
    });

    if (hasPiecewiseRows) {
      table.setAttribute('data-math-piecewise', 'true');
      table.setAttribute('columnalign', 'right left left');
    }
  });
};

/**
 * Injects the necessary CSS for polyfills into the document head.
 */
export async function initMathPolyfills() {
  if (typeof document === 'undefined' || isMathPolyfillsInitialized) return;
  if (!mathPolyfills) return;

  const existingStyle = document.head.querySelector(`[${MATH_POLYFILLS_STYLE_ATTR}="true"]`);
  if (existingStyle) {
    isMathPolyfillsInitialized = true;
    return;
  }

  const style = mathPolyfills.getCSSStyleSheet();
  style.setAttribute(MATH_POLYFILLS_STYLE_ATTR, 'true');
  document.head.appendChild(style);
  isMathPolyfillsInitialized = true;
}

/**
 * Transforms a raw MathML string from an API into modern MathML Core.
 * @param rawMathML The string containing legacy <math> tags.
 */
export function transformMathString(rawMathML: string): string {
  if (typeof document === 'undefined') return rawMathML;

  const container = document.createElement('div');
  container.innerHTML = rawMathML;

  mathPolyfills?.transform(container);

  return normaliseInvisibleTimesSeparators(container.innerHTML);
}

/**
 * Formats a MathML string into a table structure for better rendering.
 * @param rawMathML The string containing updated <math> tags.
 * @param options Configuration options to control which normalisation steps are applied.
 * @returns The formatted MathML string.
 */
export const formatMathMLTable = (rawMathML: string, options: MathMLFormatOptions): string => {
  if (typeof document === 'undefined') return rawMathML;

  const {
    digitGrouping = false,
    greekSymbols = false,
    subscripts = false,
  }: MathMLFormatOptions = options;

  const parser = getDOMParser();
  const doc = parser.parseFromString(rawMathML, 'text/html');
  const mathBlocks = doc.querySelectorAll('math');
  const NS = 'http://www.w3.org/1998/Math/MathML';

  mathBlocks.forEach((math) => {
    fixMismatchedFencePairs(math);
    if (subscripts) {
      normaliseUnderscoreIdentifiers(math);
    }
    normaliseLogicalOperators(math);
    normaliseScientificENotation(math);
    if (digitGrouping) {
      normaliseNumericLiterals(math);
    }
    if (greekSymbols) {
      normaliseNamedGreekIdentifiers(math);
    }

    const rows = Array.from(math.children).filter(
      (child) => child.tagName.toLowerCase() === 'mrow',
    );

    if (rows.length) {
      const mtable = doc.createElementNS(NS, 'mtable');
      mtable.setAttribute('columnalign', 'right center left');
      mtable.setAttribute('rowspacing', '0.75em');

      rows.forEach((row) => {
        const mtr = doc.createElementNS(NS, 'mtr');

        Array.from(row.childNodes).forEach((node) => {
          const mtd = doc.createElementNS(NS, 'mtd');

          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).tagName.toLowerCase() === 'mo' &&
            ((node.textContent || '').trim() === '=' ||
              (node as Element).getAttribute('form') === 'infix')
          ) {
            mtd.setAttribute('data-math-operator', 'equals');
          }

          mtd.appendChild(node);
          mtr.appendChild(mtd);
        });

        mtable.appendChild(mtr);
        row.remove();
      });

      math.appendChild(mtable);
    }

    normalisePiecewiseTables(math, doc, NS);
  });

  return normaliseInvisibleTimesSeparators(doc.body.innerHTML);
};
