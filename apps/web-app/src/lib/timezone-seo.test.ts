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
  const sanFrancisco = findTimezone('San Francisco')
  const hongKong = findTimezone('Hong Kong')

  assert.equal(sanFrancisco?.ianaName, 'America/Los_Angeles')
  assert.equal(sanFrancisco?.name, 'San Francisco')
  assert.equal(sanFrancisco?.urlSlug, 'san-francisco')
  assert.equal(hongKong?.ianaName, 'Asia/Hong_Kong')
  assert.equal(hongKong?.name, 'Hong Kong')
  assert.equal(hongKong?.urlSlug, 'hong-kong')
})
