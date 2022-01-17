import path from 'path';
import { BrowserWindow, app, ipcMain, Menu, shell } from 'electron';
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

const isMac = process.platform === 'darwin';

const menu = Menu.buildFromTemplate(
  [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []) as Electron.MenuItemConstructorOptions[],
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Vocabulary Folder',
          click: () => {
            // showItemInFolderだと何故かOSXで動かなかったこちらにする
            shell.openPath(libraryManager.libraryDirPath);
          }
        },
        isMac ? { role: 'close' } : { role: 'quit' }
      ] as Electron.MenuItemConstructorOptions[]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ]) as Electron.MenuItemConstructorOptions[]
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ]) as Electron.MenuItemConstructorOptions[]
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://github.com/Kotaro7750/TyperConcierge')
          }
        }
      ]
    }
  ]
);

Menu.setApplicationMenu(menu);


ipcMain.handle('getDictionaryList', async (_) => {
  await libraryManager.reloadLibrary();
  return libraryManager.getDictionaryList();
});

ipcMain.handle('getVocabularyEntryList', (_, usedDictionaryNameList) => {
  return libraryManager.getVocabularyEntryList(usedDictionaryNameList);
});
