/**
 * Constants related to exposure pages.
 */

/**
 * License URL used as a fallback when an exposure does not provide one.
 */
export const DEFAULT_LICENSE = 'https://creativecommons.org/licenses/by/3.0/'

/**
 * Views offered alongside the default exposure preview.
 */
export const AVAILABLE_VIEWS = [
  {
    name: 'Generate code',
    view_key: 'cellml_codegen',
  },
  {
    name: 'Mathematics',
    view_key: 'cellml_math',
  },
]

/**
 * Languages supported by the CellML code generation view.
 */
export const CODEGEN_LANGUAGES = [
  {
    name: 'C',
    path: 'code.C.c',
    fileName: 'code.c',
  },
  {
    name: 'C (IDA solver)',
    path: 'code.C_IDA.c',
    fileName: 'code.ida.c',
  },
  {
    name: 'FORTRAN 77',
    path: 'code.F77.f77',
    fileName: 'code.f77',
  },
  {
    name: 'MATLAB',
    path: 'code.MATLAB.m',
    fileName: 'code.m',
  },
  {
    name: 'Python',
    path: 'code.Python.py',
    fileName: 'code.py',
  },
]
