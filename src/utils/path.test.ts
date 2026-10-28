import { describe, expect, it } from 'vitest'
import { encodePathSegments } from './path'

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
