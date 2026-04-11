const { ipcMain, clipboard, dialog } = require('electron');

function setupIPC() {
  ipcMain.handle('clipboard:copy', async (_, text) => {
    try {
      clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('clipboard:read', async () => {
    try {
      const text = clipboard.readText();
      return { success: true, text };
    } catch (error) {
      console.error('Error al leer del portapapeles:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('dialog:show', async (_, options) => {
    try {
      const result = await dialog.showMessageBox(options);
      return result;
    } catch (error) {
      console.error('Error al mostrar diálogo:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { setupIPC };
