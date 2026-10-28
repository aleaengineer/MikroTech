const MarkdownIt = require('markdown-it');

const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false
});

function renderMarkdown(content) {
  const source = normalizePastedMarkdown(content);
  return markdown.render(source);
}

function normalizePastedMarkdown(content) {
  if (content.includes('\n')) return content;

  return content
    .replace(/[ \t]+(---|___|\*\*\*)[ \t]+/g, '\n\n$1\n\n')
    .replace(/[ \t]+(#{1,6}[ \t]+)/g, '\n\n$1')
    .replace(/[ \t]+\*[ \t]+(?=\S)/g, '\n- ')
    .replace(/[ \t]+(\d{1,2}\.)[ \t]+(?=[A-Z(])/g, '\n$1 ');
}

module.exports = { renderMarkdown };
