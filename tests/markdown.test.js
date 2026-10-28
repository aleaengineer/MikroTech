const test = require('node:test');
const assert = require('node:assert/strict');
const { renderMarkdown } = require('../src/utils/markdown');

test('renderMarkdown formats common article Markdown', () => {
  const html = renderMarkdown([
    '### Konfigurasi Dasar',
    '',
    'Gunakan **Winbox** untuk mulai.',
    '',
    '---',
    '',
    '- Atur alamat IP',
    '- Uji koneksi',
    '',
    '```routeros',
    '/ip address print',
    '```'
  ].join('\n'));

  assert.match(html, /<h3>Konfigurasi Dasar<\/h3>/);
  assert.match(html, /<strong>Winbox<\/strong>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<code class="language-routeros">/);
  assert.match(html, /\/ip address print/);
});

test('renderMarkdown formats Markdown markers pasted without line breaks', () => {
  const html = renderMarkdown(
    'Ringkasan ### Topologi **utama** --- ### Langkah * **ether1**: ISP 1. Sambungkan router 2. Uji koneksi'
  );

  assert.match(html, /<h3>Topologi <strong>utama<\/strong><\/h3>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<h3>Langkah<\/h3>/);
  assert.match(html, /<li><strong>ether1<\/strong>: ISP/);
  assert.match(html, /<li>Sambungkan router<\/li>/);
  assert.match(html, /<li>Uji koneksi<\/li>/);
});

test('renderMarkdown escapes raw HTML and rejects unsafe link protocols', () => {
  const html = renderMarkdown(
    '<script>alert(1)</script>\n\n[tautan](javascript:alert%281%29)'
  );

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /href="javascript:/i);
});

test('renderMarkdown preserves ordinary text as paragraphs', () => {
  assert.equal(renderMarkdown('Panduan konfigurasi MikroTik.'), '<p>Panduan konfigurasi MikroTik.</p>\n');
});
