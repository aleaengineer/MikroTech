const test = require('node:test');
const assert = require('node:assert/strict');
const { createSlug } = require('../src/utils/slug');

test('createSlug makes readable lowercase slugs', () => {
  assert.equal(createSlug('Konfigurasi DHCP Server'), 'konfigurasi-dhcp-server');
});

test('createSlug removes accents and punctuation', () => {
  assert.equal(createSlug('Jaringan Wi-Fi & Hotspot!'), 'jaringan-wi-fi-hotspot');
});

test('createSlug trims separators and caps the result length', () => {
  assert.equal(createSlug('  --RouterOS--- '), 'routeros');
  assert.equal(createSlug('a'.repeat(250)).length, 190);
});
