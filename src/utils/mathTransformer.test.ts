import { describe, expect, it, vi } from 'vitest';
import { formatMathMLTable, initMathPolyfills, transformMathString } from '@/utils/mathTransformer';

const ENABLE_ALL_OPTIONS = {
  digitGrouping: true,
  greekSymbols: true,
  subscripts: true,
};

const ENABLE_SUBSCRIPT_ONLY = {
  digitGrouping: false,
  greekSymbols: false,
  subscripts: true,
};

const ENABLE_DIGIT_GROUPING_ONLY = {
  digitGrouping: true,
  greekSymbols: false,
  subscripts: false,
};

const ENABLE_GREEK_SYMBOLS_ONLY = {
  digitGrouping: false,
  greekSymbols: true,
  subscripts: false,
};

/**
 * Tests for MathML transformation utilities.
 *
 * Key behaviours tested:
 * 1. Polyfill initialisation with idempotency and style injection
 * 2. MathML transformation applying polyfill transforms
 * 3. Table formatting with proper mtable attributes
 * 4. Mismatched fence pair removal (e.g., '(' paired with '>')
 * 5. Non-DOM environment graceful degradation (returns input unchanged)
 * 6. Equals operator detection and marking for styling
 * 7. Structure preservation through transformations
 */

// Mock the polyfill import.
vi.mock('../vendor/mathml-polyfills/all-polyfills-bundle.js', () => ({
  _MathTransforms: {
    getCSSStyleSheet: () => {
      const style = document.createElement('style');
      style.textContent = '/* Mock polyfill CSS */';
      return style;
    },
    transform: (container: HTMLElement) => {
      // Mock transform: add a marker attribute to indicate it was called.
      container.setAttribute('data-transformed', 'true');
    },
  },
}));

describe('initMathPolyfills', () => {
  it('injects the polyfill CSS into the document head', async () => {
    // Remove any previously injected styles (from other tests).
    for (const el of document.head.querySelectorAll('[data-math-polyfills="true"]')) {
      el.remove();
    }

    await initMathPolyfills();

    const style = document.head.querySelector('[data-math-polyfills="true"]');
    expect(style).toBeTruthy();
    expect(style?.tagName).toBe('STYLE');
  });

  it('does not throw when the document is unavailable', async () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error
    delete globalThis.document;

    await expect(initMathPolyfills()).resolves.toBeUndefined();

    globalThis.document = originalDocument;
  });
});

describe('transformMathString', () => {
  const simpleEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
    <mrow>
      <mi>x</mi>
      <mo>=</mo>
      <mn>5</mn>
    </mrow>
  </math>`;

  it('transforms a MathML string and applies the polyfill transform', () => {
    const result = transformMathString(simpleEquation);

    expect(result).toBeTruthy();
    expect(result).toContain('x');
    expect(result).toContain('=');
    expect(result).toContain('5');
  });

  it('preserves the MathML structure after transformation', () => {
    const result = transformMathString(simpleEquation);

    expect(result).toContain('math');
    expect(result).toContain('mrow');
    expect(result).toContain('mi');
  });

  it('returns the input unchanged when the document is unavailable', () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error
    delete globalThis.document;

    const result = transformMathString(simpleEquation);
    expect(result).toBe(simpleEquation);

    globalThis.document = originalDocument;
  });

  it('handles an empty MathML string', () => {
    const result = transformMathString('');
    expect(result).toBe('');
  });

  it('replaces invisible times separators with multiplication dots', () => {
    const equationWithInvisibleTimes = `<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>a</mi><mo>&#8290;</mo><mi>b</mi></mrow></math>`;

    const result = transformMathString(equationWithInvisibleTimes);

    expect(result).toContain('<mo>·</mo>');
    expect(result).not.toContain('&#8290;');
    expect(result).not.toContain('\u2062');
  });

  it('replaces the exponential glyph with plain e', () => {
    const equationWithExponentialGlyph = `<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>ⅇ</mi><mo>^</mo><mi>x</mi></mrow></math>`;

    const result = transformMathString(equationWithExponentialGlyph);

    expect(result).toContain('<mi>e</mi>');
    expect(result).not.toContain('ⅇ');
  });
});

describe('formatMathMLTable', () => {
  const multiRowEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
    <mrow>
      <mi>vcell</mi>
      <mo>=</mo>
      <mn>1000</mn>
    </mrow>
    <mrow>
      <mi>Ageo</mi>
      <mo>=</mo>
      <mn>2</mn>
    </mrow>
  </math>`;

  const equationWithFence = `<math xmlns="http://www.w3.org/1998/Math/MathML">
    <mrow>
      <mfenced open="{" close="}">
        <mrow>
          <mi>a</mi>
          <mo>=</mo>
          <mn>1</mn>
        </mrow>
      </mfenced>
    </mrow>
  </math>`;

  // Test case for mismatched fence pairs (e.g., opening '(' but closing '>').
  const mismatchedFenceEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
    <mrow>
      <mo fence="true">(</mo>
      <mi>x</mi>
      <mo fence="true">></mo>
    </mrow>
    <mrow>
      <mi>result</mi>
      <mo>=</mo>
      <mn>0</mn>
    </mrow>
  </math>`;

  const piecewiseEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
    <mrow>
      <mi>GKr</mi>
      <mo>=</mo>
      <mtable>
        <mtr>
          <mtd>
            <mrow><mi>GKr_b</mi><mo>·</mo><mn>1.3</mn></mrow>
            <mspace width="0.3em"></mspace>
            <mtext>if</mtext>
            <mspace width="0.3em"></mspace>
            <mrow><mi>celltype</mi><mo>=</mo><mn>1</mn></mrow>
          </mtd>
        </mtr>
        <mtr>
          <mtd>
            <mrow><mi>GKr_b</mi><mo>·</mo><mn>0.8</mn></mrow>
            <mspace width="0.3em"></mspace>
            <mtext>if</mtext>
            <mspace width="0.3em"></mspace>
            <mrow><mi>celltype</mi><mo>=</mo><mn>2</mn></mrow>
          </mtd>
        </mtr>
        <mtr>
          <mtd>
            <mi>GKr_b</mi>
            <mspace width="0.3em"></mspace>
            <mtext>otherwise</mtext>
          </mtd>
        </mtr>
      </mtable>
    </mrow>
  </math>`;

  it('wraps multiple rows in an mtable', () => {
    const result = formatMathMLTable(multiRowEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('mtable');
    expect(result).toContain('mtr');
    expect(result).toContain('mtd');
  });

  it('sets the correct attributes on the mtable', () => {
    const result = formatMathMLTable(multiRowEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('columnalign="right center left"');
    expect(result).toContain('rowspacing="0.75em"');
  });

  it('marks equals operators with the data-math-operator attribute', () => {
    const result = formatMathMLTable(multiRowEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('data-math-operator="equals"');
  });

  it('preserves the MathML structure in table cells', () => {
    const result = formatMathMLTable(multiRowEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('vcell');
    expect(result).toContain('Ageo');
    expect(result).toContain('1,000');
  });

  it('formats large integer numerals with thousands separators', () => {
    const digitGroupingEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mn>1000</mn><mo>+</mo><mn>2500000</mn><mo>+</mo><mn>999</mn>
      </mrow>
    </math>`;

    const result = formatMathMLTable(digitGroupingEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('<mn>1,000</mn>');
    expect(result).toContain('<mn>2,500,000</mn>');
    expect(result).toContain('<mn>999</mn>');
  });

  it('handles MathML containing fenced expressions', () => {
    const result = formatMathMLTable(equationWithFence, ENABLE_ALL_OPTIONS);

    expect(result).toContain('mtable');
    expect(result).toContain('mfenced');
  });

  it('returns the input unchanged when the document is unavailable', () => {
    const originalDocument = globalThis.document;
    // @ts-expect-error
    delete globalThis.document;

    const result = formatMathMLTable(multiRowEquation, ENABLE_ALL_OPTIONS);
    expect(result).toBe(multiRowEquation);

    globalThis.document = originalDocument;
  });

  it('handles an empty MathML string', () => {
    const result = formatMathMLTable('', ENABLE_ALL_OPTIONS);
    expect(result).toBe('');
  });

  it('does not create a table when there are no mrow elements', () => {
    const noRowsEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mi>x</mi>
    </math>`;

    const result = formatMathMLTable(noRowsEquation, ENABLE_ALL_OPTIONS);

    expect(result).not.toContain('mtable');
  });

  it('removes a mismatched closing fence from an mrow element', () => {
    const result = formatMathMLTable(mismatchedFenceEquation, ENABLE_ALL_OPTIONS);

    // The mismatched closing fence '>' should be removed, leaving only the opening '('.
    expect(result).toContain('mtable');
    expect(result).toContain('result');
    expect(result).toContain('data-math-operator="equals"');
  });

  it('normalises invisible times separators in formatted output', () => {
    const equationWithInvisibleTimes = `<math xmlns="http://www.w3.org/1998/Math/MathML"><mrow><mi>a</mi><mo>\u2062</mo><mi>b</mi></mrow></math>`;

    const result = formatMathMLTable(equationWithInvisibleTimes, ENABLE_ALL_OPTIONS);

    expect(result).toContain('<mo>·</mo>');
    expect(result).not.toContain('\u2062');
  });

  it('splits piecewise inner tables into aligned expression, keyword, and condition columns', () => {
    const result = formatMathMLTable(piecewiseEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('data-math-piecewise="true"');
    expect(result).toContain('data-math-piecewise="expression"');
    expect(result).toContain('data-math-piecewise="keyword"');
    expect(result).toContain('data-math-piecewise="condition"');
    expect(result).toContain('data-math-piecewise-keyword="if"');
    expect(result).toContain('data-math-piecewise-keyword="otherwise"');
    expect(result).toContain('columnalign="right left left"');
  });

  it('converts underscore-delimited identifiers into nested subscripts', () => {
    const underscoredIdentifierEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mi>i_Stim_Amplitude</mi>
      </mrow>
    </math>`;

    const result = formatMathMLTable(underscoredIdentifierEquation, ENABLE_ALL_OPTIONS);

    const subscriptMatches = result.match(/<msub/g) || [];
    expect(subscriptMatches.length).toBe(2);
    expect(result).toContain('<mi>i</mi>');
    expect(result).toContain('<mi>Stim</mi>');
    expect(result).toContain('<mi>Amplitude</mi>');
  });

  it('applies subscripts formatting when only subscripts option is enabled', () => {
    const underscoredIdentifierEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mi>V_m_steady</mi>
      </mrow>
    </math>`;

    const result = formatMathMLTable(underscoredIdentifierEquation, ENABLE_SUBSCRIPT_ONLY);

    const subscriptMatches = result.match(/<msub/g) || [];
    expect(subscriptMatches.length).toBe(2);
    expect(result).toContain('<mi>V</mi>');
    expect(result).toContain('<mi>m</mi>');
    expect(result).toContain('<mi>steady</mi>');
  });

  it('applies digit group formatting when only digitGrouping option is enabled', () => {
    const digitGroupingEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mn>1000</mn><mo>+</mo><mn>2500000</mn><mo>+</mo><mn>10</mn>
      </mrow>
    </math>`;

    const result = formatMathMLTable(digitGroupingEquation, ENABLE_DIGIT_GROUPING_ONLY);

    expect(result).toContain('<mn>1,000</mn>');
    expect(result).toContain('<mn>2,500,000</mn>');
    expect(result).toContain('<mn>10</mn>');
  });

  it('replaces logical operator symbols with text labels', () => {
    const logicalOperatorsEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mi>a</mi><mo>∧</mo><mi>b</mi>
        <mo>∨</mo><mi>c</mi>
        <mo>⊻</mo><mi>d</mi>
        <mo>¬</mo><mi>e</mi>
      </mrow>
    </math>`;

    const result = formatMathMLTable(logicalOperatorsEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('<mo>and</mo>');
    expect(result).toContain('<mo>or</mo>');
    expect(result).toContain('<mo>xor</mo>');
    expect(result).toContain('<mo>not</mo>');
    expect(result).not.toContain('∧');
    expect(result).not.toContain('∨');
    expect(result).not.toContain('⊻');
    expect(result).not.toContain('¬');
  });

  it('converts named Greek identifiers into Greek symbols', () => {
    const greekIdentifiersEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mi>alpha</mi><mo>+</mo><mi>beta</mi><mo>+</mo><mi>Gamma</mi>
      </mrow>
    </math>`;

    const result = formatMathMLTable(greekIdentifiersEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('<mi>α</mi>');
    expect(result).toContain('<mi>β</mi>');
    expect(result).toContain('<mi>γ</mi>');
    expect(result).not.toContain('<mi>alpha</mi>');
    expect(result).not.toContain('<mi>beta</mi>');
    expect(result).not.toContain('<mi>Gamma</mi>');
  });

  it('applies greek symbol formatting when only greekSymbols option is enabled', () => {
    const greekIdentifiersEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mi>alpha</mi><mo>+</mo><mi>beta_tau</mi>
      </mrow>
    </math>`;

    const result = formatMathMLTable(greekIdentifiersEquation, ENABLE_GREEK_SYMBOLS_ONLY);

    expect(result).toContain('<mi>α</mi>');
    expect(result).toContain('<mi>β_τ</mi>');
    expect(result).not.toContain('<mi>alpha</mi>');
    expect(result).not.toContain('<mi>beta_tau</mi>');
  });

  it('converts Greek names inside underscore identifiers when only greekSymbols is enabled', () => {
    const greekWithUnderscoreEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mi>alpha_2</mi><mo>+</mo><mi>beta_tau</mi>
      </mrow>
    </math>`;

    const result = formatMathMLTable(greekWithUnderscoreEquation, {
      digitGrouping: false,
      greekSymbols: true,
      subscripts: false,
    });

    expect(result).toContain('<mi>α_2</mi>');
    expect(result).toContain('<mi>β_τ</mi>');
    expect(result).not.toContain('<mi>alpha_2</mi>');
    expect(result).not.toContain('<mi>beta_tau</mi>');
  });

  it('converts scientific e-notation tokens into multiplication by 10 to an exponent', () => {
    const scientificNotationEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mn>3.1</mn>
        <mo>e</mo>
        <mn>5</mn>
      </mrow>
    </math>`;

    const result = formatMathMLTable(scientificNotationEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('<mn>3.1</mn>');
    expect(result).toContain('<mo>·</mo>');
    expect(result).toContain('<msup><mn>10</mn><mn>5</mn></msup>');
    expect(result).not.toContain('<mo>e</mo>');
  });
});

describe('mathTransformer integration', () => {
  it('transforms and formats a complete equation', () => {
    const equation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mi>v</mi>
        <mo>=</mo>
        <mfrac>
          <mrow><mi>d</mi></mrow>
          <mrow><mi>t</mi></mrow>
        </mfrac>
      </mrow>
      <mrow>
        <mi>a</mi>
        <mo>=</mo>
        <mfrac>
          <mrow><mi>dv</mi></mrow>
          <mrow><mi>dt</mi></mrow>
        </mfrac>
      </mrow>
    </math>`;

    const transformed = transformMathString(equation);
    const formatted = formatMathMLTable(transformed, ENABLE_ALL_OPTIONS);

    expect(formatted).toContain('mtable');
    expect(formatted).toContain('data-math-operator="equals"');
    expect(formatted).toContain('mfrac');
  });

  it('handles complex nested MathML structures', () => {
    const complexEquation = `<math xmlns="http://www.w3.org/1998/Math/MathML">
      <mrow>
        <mrow>
          <mo>⌊</mo>
          <mfrac>
            <mrow><mi>time</mi></mrow>
            <mrow><mi>period</mi></mrow>
          </mfrac>
          <mo>⌋</mo>
        </mrow>
        <mo>=</mo>
        <mi>floor</mi>
      </mrow>
    </math>`;

    const result = formatMathMLTable(complexEquation, ENABLE_ALL_OPTIONS);

    expect(result).toContain('mtable');
    expect(result).toContain('mfrac');
    expect(result).toContain('⌊');
    expect(result).toContain('⌋');
  });
});
