import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGoogleUsername, normalizeGoogleRedirectPath } from './google'

test('buildGoogleUsername derives a safe username from an email', () => {
  assert.equal(buildGoogleUsername('jane.doe@gmail.com'), 'jane.doe')
})

test('buildGoogleUsername preserves a fallback when the email is missing', () => {
  assert.equal(buildGoogleUsername('', 'google-user'), 'google-user')
})

test('normalizeGoogleRedirectPath blocks external redirects', () => {
  assert.equal(normalizeGoogleRedirectPath('https://evil.example/steal'), '/dashboard')
})

test('normalizeGoogleRedirectPath preserves safe relative redirects', () => {
  assert.equal(normalizeGoogleRedirectPath('/dashboard'), '/dashboard')
})
