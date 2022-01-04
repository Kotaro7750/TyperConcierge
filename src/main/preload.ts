import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
  'api',
  {
    getDictionaryList: () => ipcRenderer.invoke('getDictionaryList'),
    getVocabularyEntryList: (usedDictionaryNameList: string[]) => ipcRenderer.invoke('getVocabularyEntryList', usedDictionaryNameList),
  }
);
