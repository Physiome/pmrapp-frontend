import { describe, expect, it } from 'vitest'
import { encodePathSegments, getPathSegments } from './path'

describe('encodePathSegments', () => {
  it('leaves plain paths unchanged', () => {
    expect(encodePathSegments('src/models/model.cellml')).toBe('src/models/model.cellml')
  })

  it('encodes special characters in each segment but keeps the separators', () => {
    expect(encodePathSegments('sub dir/a#b/model?x%.cellml')).toBe(
      'sub%20dir/a%23b/model%3Fx%25.cellml',
    )
  })
})

describe('getPathSegments', () => {
  it('returns no segments for an empty path', () => {
    expect(getPathSegments('')).toEqual([])
  })

  it('pairs each segment with the path up to it', () => {
    expect(getPathSegments('src/models/model.cellml')).toEqual([
      { name: 'src', path: 'src' },
      { name: 'models', path: 'src/models' },
      { name: 'model.cellml', path: 'src/models/model.cellml' },
    ])
  })

  it('ignores leading, trailing and repeated slashes', () => {
    expect(getPathSegments('/src//models/')).toEqual([
      { name: 'src', path: 'src' },
      { name: 'models', path: 'src/models' },
    ])
  })
})
