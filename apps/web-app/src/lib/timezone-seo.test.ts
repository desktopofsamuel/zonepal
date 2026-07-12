import assert from 'node:assert/strict'
import test from 'node:test'

import { slugToTimezone } from './timezone-seo'
import { findTimezone } from './timezone'

test('resolves major city aliases from URL slugs', () => {
  assert.equal(slugToTimezone('san-francisco'), 'America/Los_Angeles')
  assert.equal(slugToTimezone('new-york'), 'America/New_York')
  assert.equal(slugToTimezone('hong-kong'), 'Asia/Hong_Kong')
})

test('resolves query timezone parameters from city aliases', () => {
  assert.equal(findTimezone('San Francisco')?.ianaName, 'America/Los_Angeles')
  assert.equal(findTimezone('Hong Kong')?.ianaName, 'Asia/Hong_Kong')
})
