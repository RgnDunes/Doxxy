import { marked } from 'marked';

export function convertMarkdownToHtml(markdownContent) {
  if (!markdownContent) {
    return '';
  }
  // Configure marked to be GitHub Flavored Markdown compliant
  marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
  });
  return marked.parse(markdownContent);
}