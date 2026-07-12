import assert from 'node:assert/strict'
import test from 'node:test'

import { searchTimezones } from './timezone-search'
import { timezoneDatabase } from './timezone'

test('indexes San Francisco as a city alias for Pacific Time', () => {
  const results = searchTimezones(timezoneDatabase, 'San Francisco')

  assert.equal(results.length, 1)
  assert.equal(results[0].ianaName, 'America/Los_Angeles')
  assert.ok(results[0].aliases?.includes('San Francisco'))
})
