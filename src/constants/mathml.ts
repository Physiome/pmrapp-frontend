export const MATH_FORMAT_OPTIONS_STORAGE_KEY = 'math_format_options_v1'

export const MATHML_FORMAT_OPTIONS = [
  {
    key: 'digitGrouping',
    label: 'Digit grouping',
    preview: '#,###',
    description: 'Format numeric literals with thousands separator.',
    example: '<math><mn>1234567.89</mn></math> → <math><mn>1,234,567.89</mn></math>',
  },
  {
    key: 'greekSymbols',
    label: 'Greek symbols',
    preview: 'α β',
    description: 'Convert Greek letter names into Greek symbols.',
    example:
      '<math><mi>alpha</mi><mo>+</mo><mi>beta</mi></math> → <math><mi>α</mi><mo>+</mo><mi>β</mi></math>',
  },
  {
    key: 'subscripts',
    label: 'Subscripts',
    preview: 'x<sub class="text-[0.7em] leading-none">n</sub>',
    description: 'Split underscore-delimited identifiers into nested subscripts.',
    example:
      '<math><mi>q_Ca_o</mi></math> → <math><msub><msub><mi>q</mi><mi>Ca</mi></msub><mi>o</mi></msub></math>',
  },
] as const
