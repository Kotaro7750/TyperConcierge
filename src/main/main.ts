import path from 'path';
import { BrowserWindow, app, ipcMain } from 'electron';
import { LibraryManager } from './libraryManager';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  const execPath = '../../node_modules/.bin/electron';

  require('electron-reload')(path.resolve(__dirname, '..'), {
    electron: path.resolve(__dirname, execPath),
    forceHardReset: true,
    hardResetMethod: 'exit',
  });
}

// BrowserWindow インスタンスを作成する関数
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.resolve(__dirname, 'preload.js'),
      defaultFontSize: 16,
    },
    minHeight: 675,
    minWidth: 900,
  });

  if (isDev) {
    // 開発モードの場合はデベロッパーツールを開く
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // レンダラープロセスをロード
  mainWindow.loadFile('build/renderer/index.html');
};

let libraryManager: LibraryManager;

app.whenReady().then(async () => {
  libraryManager = await LibraryManager.init();

  createWindow();

  // osxでウィンドウが閉じていても起動し続けていた場合にはアプリをアクティブにした場合にウィンドウを生成する必要がある
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられたらアプリを終了する
app.once('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});


ipcMain.handle('getDictionaryList', async (_) => {
  await libraryManager.reloadLibrary();
  return libraryManager.getDictionaryList();
});

ipcMain.handle('getVocabularyEntryList', (_, usedDictionaryNameList) => {
  return libraryManager.getVocabularyEntryList(usedDictionaryNameList);
});
