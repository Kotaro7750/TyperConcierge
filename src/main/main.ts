import path from 'path';
import { BrowserWindow, app, ipcMain } from 'electron';
import { Vocabulary } from './vocabulary';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  const execPath = '../node_modules/.bin/electron';

  require('electron-reload')(__dirname, {
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
  mainWindow.loadFile('dist/index.html');
};

let vocabulary: Vocabulary;

app.whenReady().then(async () => {
  vocabulary = await Vocabulary.init();

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

ipcMain.handle('getDictionaryList', (_) => {
  return vocabulary.getDictionaryList();
});

ipcMain.handle('getVocabularyEntryList', (_, usedDictionaryNameList) => {
  return vocabulary.getVocabularyEntryList(usedDictionaryNameList);
});
