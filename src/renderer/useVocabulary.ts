import { useEffect, useReducer } from 'react';
import { concatDictionaryFileName } from '../commonUtility';

import { WORD_DICTIONARY_EXTENSION, SENTENCE_DICTIONARY_EXTENSION } from '../commonUtility';

import { LAP_LENGTH } from './useRomanEngine';

type LibraryReducerActionType = { type: 'use', dictionaryName: string } | { type: 'disuse', dictionaryName: string } | { type: 'load', availableDictionaryList: CategorizedDictionaryInfoList } | { type: 'vocabulary', vocabularyEntryList: VocabularyEntry[] } | { type: 'type', vocabularyType: VocabularyType } | { type: 'romanCountThreshold', romanCountThreshold: number };

export function useVocabulary(): [Library, (action: LibraryOperatorActionType) => void] {

  const existInAvailableDictionary = (availableDictionaryList: CategorizedDictionaryInfoList, dictionaryName: string, vocabularyType: VocabularyType) => {
    const dictionaryInfoList = vocabularyType == 'word' ? availableDictionaryList.word : availableDictionaryList.sentence;
    for (let dictionaryInfo of dictionaryInfoList) {
      if (dictionaryInfo.type != vocabularyType) {
        throw new Error(`VocabularyType mismatch in ${dictionaryInfo.name} expected ${vocabularyType}, but ${dictionaryInfo.type}`);
      }

      if (concatDictionaryFileName(dictionaryInfo) == dictionaryName) {
        return true;
      }
    }

    return false;
  };

  // 語彙関連をまとめて１つのstateとして管理する
  const libraryReducer: React.Reducer<Library, LibraryReducerActionType> = (state: Library, action: LibraryReducerActionType) => {
    switch (action.type) {
      // 現在有効になっている辞書タイプで利用可能な辞書から追加する
      case 'use':
        if (!existInAvailableDictionary(state.availableDictionaryList, action.dictionaryName, state.usedVocabularyType)) {
          throw new Error(`use dictionary(${action.dictionaryName}) not in availableDictionaryList`);
        }

        const addedUsedDictionaryFileNameList: { word: string[], sentence: string[] } = state.usedVocabularyType == 'word' ? {
          word: state.usedDictionaryFileNameList.word.concat([action.dictionaryName]),
          sentence: state.usedDictionaryFileNameList.sentence,
        } : {
          word: state.usedDictionaryFileNameList.word,
          sentence: state.usedDictionaryFileNameList.sentence.concat([action.dictionaryName]),
        };

        return {
          availableDictionaryList: state.availableDictionaryList,
          usedDictionaryFileNameList: addedUsedDictionaryFileNameList,
          usedVocabularyType: state.usedVocabularyType,
          vocabularyEntryList: state.vocabularyEntryList,
          romanCountThreshold: state.romanCountThreshold,
        };

      // 現在有効になっている辞書タイプで利用可能な辞書から追加する
      case 'disuse':
        if (!existInAvailableDictionary(state.availableDictionaryList, action.dictionaryName, state.usedVocabularyType)) {
          throw new Error(`disuse dictionary(${action.dictionaryName}) not in availableDictionaryList`);
        }

        const deletedUsedDictionaryFileNameList: { word: string[], sentence: string[] } = state.usedVocabularyType == 'word' ? {
          word: state.usedDictionaryFileNameList.word.filter(e => e !== action.dictionaryName),
          sentence: state.usedDictionaryFileNameList.sentence,
        } : {
          word: state.usedDictionaryFileNameList.word,
          sentence: state.usedDictionaryFileNameList.sentence.filter(e => e !== action.dictionaryName),
        };


        return {
          availableDictionaryList: state.availableDictionaryList,
          usedDictionaryFileNameList: deletedUsedDictionaryFileNameList,
          usedVocabularyType: state.usedVocabularyType,
          vocabularyEntryList: state.vocabularyEntryList,
          romanCountThreshold: state.romanCountThreshold,
        };

      case 'load':
        const wordAvailableDictionaryNameList = action.availableDictionaryList.word.map(e => `${e.name}${WORD_DICTIONARY_EXTENSION}`);
        const sentenceAvailableDictionaryNameList = action.availableDictionaryList.sentence.map(e => `${e.name}${SENTENCE_DICTIONARY_EXTENSION}`);

        return {
          availableDictionaryList: action.availableDictionaryList,
          usedDictionaryFileNameList: {
            word: state.usedDictionaryFileNameList.word.filter(e => wordAvailableDictionaryNameList.includes(e)),
            sentence: state.usedDictionaryFileNameList.sentence.filter(e => sentenceAvailableDictionaryNameList.includes(e)),
          },
          usedVocabularyType: state.usedVocabularyType,
          vocabularyEntryList: state.vocabularyEntryList,
          romanCountThreshold: state.romanCountThreshold,
        };
      case 'type':
        return {
          availableDictionaryList: state.availableDictionaryList,
          usedDictionaryFileNameList: state.usedDictionaryFileNameList,
          usedVocabularyType: action.vocabularyType,
          vocabularyEntryList: state.vocabularyEntryList,
          romanCountThreshold: state.romanCountThreshold,
        };
      case 'vocabulary':
        return {
          availableDictionaryList: state.availableDictionaryList,
          usedDictionaryFileNameList: state.usedDictionaryFileNameList,
          usedVocabularyType: state.usedVocabularyType,
          vocabularyEntryList: action.vocabularyEntryList,
          romanCountThreshold: state.romanCountThreshold,
        };
      case 'romanCountThreshold':
        return {
          availableDictionaryList: state.availableDictionaryList,
          usedDictionaryFileNameList: state.usedDictionaryFileNameList,
          usedVocabularyType: state.usedVocabularyType,
          vocabularyEntryList: state.vocabularyEntryList,
          romanCountThreshold: action.romanCountThreshold,
        };
    }
  }

  const [library, dispatchLibrary] = useReducer(libraryReducer, {
    availableDictionaryList: { word: [], sentence: [] },
    usedDictionaryFileNameList: { word: [], sentence: [] },
    usedVocabularyType: 'word',
    vocabularyEntryList: [],
    romanCountThreshold: LAP_LENGTH * 4,
  });

  const loadAvailableDictionaryList = () => {
    window.api.getDictionaryList().then(list => {
      dispatchLibrary({ type: 'load', availableDictionaryList: list });
    });
  };

  const updateVocabulary = () => {
    const usedDictionaryFileNameList = library.usedVocabularyType == 'word' ? library.usedDictionaryFileNameList.word : library.usedDictionaryFileNameList.sentence;
    window.api.getVocabularyEntryList(usedDictionaryFileNameList).then(list => {
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
      case 'type':
        dispatchLibrary({ type: 'type', vocabularyType: action.vocabularyType });
        break;
      case 'constructVocabulary':
        updateVocabulary();
        break;
      case 'romanCountThreshold':
        dispatchLibrary({ type: 'romanCountThreshold', romanCountThreshold: action.romanCountThreshold });
        break;
    }
  }

  // 依存なしなので初回のみ
  useEffect(() => {
    loadAvailableDictionaryList();
  }, []);

  return [library, operator];
}
