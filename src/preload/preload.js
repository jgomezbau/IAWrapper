// File: src/preload/preload.js
const { contextBridge, ipcRenderer, clipboard } = require('electron');
const { findCopyButtonFromEventTarget, getCodeTextFromButton } = require('./clipboard-fix');
const { clipboardStyles } = require('./inject-styles');

function showNotification(message, isError = false) {
  if (process.env.NODE_ENV !== 'development' || isError) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
  }
}

function handleClipboardCopy(text) {
  if (!text) return false;
  try {
    clipboard.writeText(text);
    showNotification('Copiado al portapapeles');
    return true;
  } catch (error) {
    console.error('Error copiando al portapapeles:', error);
    showNotification('Error al copiar', true);
    return false;
  }
}

function handleClipboardRead() {
  try {
    return clipboard.readText();
  } catch (error) {
    console.error('Error leyendo del portapapeles:', error);
    showNotification('Error al leer del portapapeles', true);
    return null;
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  copyToClipboard: (text) => handleClipboardCopy(text),
  readFromClipboard: () => handleClipboardRead(),
  getSystemInfo: () => ({ platform: process.platform, version: process.versions.electron }),
  invoke: (channel, ...args) => {
    const validChannels = ['clipboard:copy', 'clipboard:read', 'dialog:show'];
    if (validChannels.includes(channel)) return ipcRenderer.invoke(channel, ...args);
    return Promise.reject(new Error(`Canal no permitido: ${channel}`));
  }
});

function injectStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = clipboardStyles;
  document.head.appendChild(styleElement);

  // CSS de rendimiento: siempre activo.
  // El fix más importante para chats largos: content-visibility: auto hace que
  // Chromium omita el layout y paint de los mensajes fuera de la ventana visible.
  // Sin esto, un chat de 200 mensajes obliga al renderer a procesar TODOS los
  // nodos del DOM en cada repaint, saturando el único hilo del renderer.
  const perfCss = document.createElement('style');
  perfCss.id = 'cc-perf-css';
  perfCss.textContent = `
    /* Salta layout+paint de mensajes fuera del viewport (el cambio más crítico) */
    article[data-testid^="conversation-turn"],
    main article,
    [data-testid^="conversation-turn"] {
      content-visibility: auto;
      /* contain-intrinsic-size da una altura estimada para el scrollbar.
         1000px es conservador; evita saltos de scroll al hacer scroll rápido. */
      contain-intrinsic-size: 0 1000px;
    }

    /* Evita que el navegador recalcule el ancla de scroll en cada mensaje nuevo,
       lo cual relayoutea todo el documento en chats muy largos. */
    html, body { overflow-anchor: none !important; }

    /* Elimina backdrop-filter en elementos decorativos: es una operación
       extremadamente cara que fuerza compositing layers adicionales. */
    * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
  `;
  document.head.appendChild(perfCss);
}

/**
 * CSP-safe copy-code fix:
 * - No <script> injection
 * - Uses capture-phase click delegation from preload isolated world
 */
function installCopyDelegate() {
  document.addEventListener(
    'click',
    (event) => {
      const button = findCopyButtonFromEventTarget(event.target);
      if (!button) return;

      const text = getCodeTextFromButton(button);
      if (!text) return;

      // Prevent the page handler from doing extra work (often expensive in huge DOM)
      event.preventDefault();
      event.stopPropagation();

      const ok = handleClipboardCopy(text);
      if (ok) {
        button.classList.add('copied');
        setTimeout(() => button.classList.remove('copied'), 1200);
      }
    },
    true
  );
}

/**
 * Fallback for "copy" events in code blocks (CSP-safe).
 * Only triggers when the browser produced empty clipboardData.
 */
function installCopyFallback() {
  document.addEventListener('copy', (event) => {
    const target = event.target;
    if (!target || !target.closest) return;

    const isInCodeBlock =
      target.closest('pre, code') ||
      target.closest('.relative') ||
      target.closest('[class*="prose"]');

    if (isInCodeBlock && event.clipboardData && !event.clipboardData.getData('text')) {
      const selection = window.getSelection();
      const text = selection ? selection.toString() : '';
      if (text) {
        handleClipboardCopy(text);
        event.preventDefault();
      }
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  injectStyles();
  installCopyDelegate();
  installCopyFallback();
  installInputPriorityBoost();
});

/**
 * Durante el streaming de respuestas largas, ChatGPT dispara cientos de
 * MutationObserver callbacks por segundo (un nodo de texto nuevo por token).
 * Cada callback puede disparar microtareas de React que bloquean el event loop,
 * haciendo que los keystrokes del usuario se encolen y aparezcan con retraso.
 *
 * Fix: usamos scheduler.yield() (disponible en Chromium 115+) para ceder el
 * hilo al browser entre tareas pesadas, dando prioridad a los eventos de input.
 * En browsers sin scheduler.yield() esto es un no-op seguro.
 */
function installInputPriorityBoost() {
  if (typeof scheduler === 'undefined' || typeof scheduler.yield !== 'function') return;

  // Interceptamos postMessage/requestAnimationFrame que ChatGPT usa para
  // schedular actualizaciones de React, cediendo el hilo antes de cada batch.
  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function(callback) {
    return originalRAF.call(window, async (...args) => {
      // Cede el hilo al browser para procesar eventos de input pendientes
      // antes de ejecutar el callback de React/ChatGPT.
      await scheduler.yield();
      callback(...args);
    });
  };
}
