// File: src/preload/clipboard-fix.js
// NOTE: No inline script injection. CSP blocks <script> textContent on chatgpt.com.

const COPY_BUTTON_SELECTORS = [
  '[aria-label="Copy code"]',
  '.copy-button',
  '.code-block-copy-button',
  '[data-testid="copy-code-button"]',
  'button[class*="copy"]',
  'div[class*="copyButton"]'
].join(',');

function findCopyButtonFromEventTarget(target) {
  if (!target || typeof target.closest !== 'function') return null;
  return target.closest(COPY_BUTTON_SELECTORS);
}

function getCodeTextFromButton(button) {
  if (!button) return null;

  let codeBlock = null;

  const relativeParent = button.closest && button.closest('.relative');
  if (relativeParent) codeBlock = relativeParent.querySelector('code, pre');

  if (!codeBlock) {
    const parent = button.parentElement;
    if (parent) codeBlock = parent.querySelector('pre, code');
  }

  if (!codeBlock && button.parentElement && button.parentElement.parentElement) {
    codeBlock = button.parentElement.parentElement.querySelector('pre, code');
  }

  return codeBlock ? codeBlock.textContent : null;
}

module.exports = {
  COPY_BUTTON_SELECTORS,
  findCopyButtonFromEventTarget,
  getCodeTextFromButton
};