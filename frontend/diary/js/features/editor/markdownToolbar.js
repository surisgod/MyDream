import { handleTextDraftInput } from './editorModal.js';

export function insertMarkdown(startTag, endTag) {
  const textarea = document.getElementById('modalText');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  textarea.value = text.substring(0, start) + startTag + text.substring(start, end) + endTag + text.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + startTag.length, end + startTag.length);
  handleTextDraftInput();
}

export const actions = {
  insertMarkdown: (el) => insertMarkdown(el.dataset.start, el.dataset.end),
};
