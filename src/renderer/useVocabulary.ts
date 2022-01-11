import { useEffect, useReducer } from 'react';

import { WORD_DICTIONARY_EXTENSION, SENTENCE_DICTIONARY_EXTENSION } from '../commonUtility';

type LibraryReducerActionType = { type: 'use', dictionaryName: string } | { type: 'disuse', dictionaryName: string } | { type: 'load', availableDictionaryList: DictionaryInfo[] } | { type: 'vocabulary', vocabularyEntryList: VocabularyEntry[] };

export function useVocabulary(): [Library, (action: LibraryOperatorActionType) => void] {

  // 語彙関連をまとめて１つのstateとして管理する
  const libraryReducer: React.Reducer<Library, LibraryReducerActionType> = (state: Library, action: LibraryReducerActionType) => {
    switch (action.type) {
      case 'use':
        return {
          availableDictionaryList: state.availableDictionaryList,
          usedDictionaryFileNameList: state.usedDictionaryFileNameList.concat([action.dictionaryName]),
          vocabularyEntryList: state.vocabularyEntryList,
        };
      case 'disuse':
        return {
          availableDictionaryList: state.availableDictionaryList,
          usedDictionaryFileNameList: state.usedDictionaryFileNameList.filter(e => e !== action.dictionaryName),
          vocabularyEntryList: state.vocabularyEntryList,
        };
      case 'load':
        const availableDictionaryNameList = action.availableDictionaryList.map(e => `${e.name}${e.type === 'word' ? WORD_DICTIONARY_EXTENSION : SENTENCE_DICTIONARY_EXTENSION}`);
        return {
          availableDictionaryList: action.availableDictionaryList,
          usedDictionaryFileNameList: state.usedDictionaryFileNameList.filter(e => availableDictionaryNameList.includes(e)),
          vocabularyEntryList: state.vocabularyEntryList,
        };
      case 'vocabulary':
        return {
          availableDictionaryList: state.availableDictionaryList,
          usedDictionaryFileNameList: state.usedDictionaryFileNameList,
          vocabularyEntryList: action.vocabularyEntryList,
        };
    }
  }

  const [library, dispatchLibrary] = useReducer(libraryReducer, {
    availableDictionaryList: [],
    usedDictionaryFileNameList: [],
    vocabularyEntryList: []
  });

  const loadAvailableDictionaryList = () => {
    window.api.getDictionaryList().then(list => {
      dispatchLibrary({ type: 'load', availableDictionaryList: list });
    });
  };

  const updateVocabulary = () => {
    window.api.getVocabularyEntryList(library.usedDictionaryFileNameList).then(list => {
      dispatchLibrary({ type: 'vocabulary', vocabularyEntryList: list });
    });
  }

  // stateの変更は一部非同期なのでreducerの中で全部を行うことはできない
  const operator = (action: LibraryOperatorActionType) => {
    switch (action.type) {
      case 'use':
        dispatchLibrary({ type: 'use', dictionaryName: action.dictionaryName });
        break;
      case 'disuse':
        dispatchLibrary({ type: 'disuse', dictionaryName: action.dictionaryName });
        break;
      case 'load':
        loadAvailableDictionaryList();
        break;
      case 'constructVocabulary':
        updateVocabulary();
        break;
    }
  }

  // 依存なしなので初回のみ
  useEffect(() => {
    loadAvailableDictionaryList();
  }, []);

  return [library, operator];
}
