import test from 'node:test'
import assert from 'node:assert/strict'
import { getDashboardPath } from './dashboard-path'

test('getDashboardPath sends managers to publisher management', () => {
  assert.equal(getDashboardPath('MANAGER'), '/account/publishers')
})

test('getDashboardPath keeps publishers on the dashboard', () => {
  assert.equal(getDashboardPath('PUBLISHER'), '/dashboard')
})

test('getDashboardPath defaults unknown roles to the dashboard', () => {
  assert.equal(getDashboardPath(null), '/dashboard')
  assert.equal(getDashboardPath(undefined), '/dashboard')
})
