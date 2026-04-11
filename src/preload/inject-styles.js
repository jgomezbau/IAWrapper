// Estilos CSS para inyectar en la página web
// para mejorar la funcionalidad del portapapeles en los bloques de código

const clipboardStyles = `
/* Estilos para botones de copiado */
[aria-label="Copy code"],
.copy-button,
.code-block-copy-button,
[data-testid="copy-code-button"],
button[class*="copy"],
div[class*="copyButton"] {
  position: relative;
  z-index: 10 !important;
  cursor: pointer !important;
}

/* Indicador visual de éxito de copiado */
[aria-label="Copy code"].copied:after,
.copy-button.copied:after,
.code-block-copy-button.copied:after,
[data-testid="copy-code-button"].copied:after,
button[class*="copy"].copied:after,
div[class*="copyButton"].copied:after {
  content: "Copiado!";
  position: absolute;
  right: 100%;
  top: 0;
  background: #10a37f;
  color: white;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  margin-right: 8px;
  opacity: 1;
  animation: fadeIn 0.3s, fadeOut 0.5s 1s forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Asegurar que los bloques de código sean seleccionables */
.relative pre,
.relative code,
pre, code {
  user-select: text !important;
  -webkit-user-select: text !important;
}

/* Hacer que el botón sea más visible en modo hover */
[aria-label="Copy code"]:hover,
.copy-button:hover,
.code-block-copy-button:hover,
[data-testid="copy-code-button"]:hover,
button[class*="copy"]:hover,
div[class*="copyButton"]:hover {
  opacity: 1 !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/*
 * ── OPTIMIZACIONES DE RENDIMIENTO PARA CHATS LARGOS ──────────────────────────
 *
 * content-visibility: auto  →  el renderer omite layout+paint de los elementos
 * que están fuera del viewport. En un chat de 100+ mensajes, esto reduce el
 * trabajo del hilo principal del renderer hasta en un 80%.
 *
 * Selectores cubiertos:
 *   - ChatGPT:  article[data-testid^="conversation-turn"]
 *   - Claude:   .font-claude-message, [data-testid="conversation"]
 *   - Genérico: main article, .message, [class*="message-"]
 */
article[data-testid^="conversation-turn"],
[data-testid^="conversation-turn"],
.font-claude-message,
[data-testid="conversation"] > *,
main article,
.message,
[class*="message-row"],
[class*="chat-message"] {
  content-visibility: auto;
  contain-intrinsic-size: 0 1000px;
}

/* Evita relayout de todo el documento cuando llega un mensaje nuevo */
html, body {
  overflow-anchor: none !important;
}

/* backdrop-filter fuerza compositing layers adicionales y es muy caro
   en elementos decorativos (sidebars, headers translúcidos, etc.) */
header *,
nav *,
aside * {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/*
 * ── AISLAMIENTO DEL ÁREA DE INPUT (fix para tipeo lento con DOM grande) ──────
 *
 * Problema: al escribir, React actualiza el estado del input, el browser lanza
 * una "style recalculation" que recorre TODOS los nodos del documento (~85k).
 * content-visibility ya evita layout+paint de mensajes offscreen, pero el
 * style recalc sigue siendo global.
 *
 * Solución: contain: layout style en el contenedor de mensajes Y en el área de
 * input. Esto le dice al browser que los cambios de estilo dentro de cada zona
 * no pueden afectar a la otra — el style recalc queda aislado a ~500 nodos
 * en lugar de 85.000.
 */

/* Contenedor principal de mensajes — ChatGPT / Claude / genérico */
main > div:first-of-type,
[class*="conversation-list"],
[class*="messages-container"],
[class*="chat-list"],
[role="presentation"] > div {
  contain: layout style;
  will-change: scroll-position;
}

/* Área de input — aislada del resto del documento.
   Cuando escribes, el style recalc queda confinado a esta zona. */
[data-testid="composer-footer"],
[data-testid="send-button-container"],
form:has(textarea),
.stretch,
div:has(> #prompt-textarea),
div:has(> textarea) {
  contain: layout style;
  isolation: isolate;
}

/* El textarea en sí: promote a compositor layer para evitar repaints
   del documento al mostrar/ocultar el cursor de texto */
#prompt-textarea,
textarea[data-id],
textarea[placeholder*="Message"],
textarea[placeholder*="mensaje"],
textarea[placeholder*="Ask"],
textarea[placeholder*="Pregunta"] {
  will-change: contents;
  contain: layout style;
}
`;


// Función para inyectar estilos CSS
function injectStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = clipboardStyles;
  document.head.appendChild(styleElement);
}

module.exports = { clipboardStyles, injectStyles };
