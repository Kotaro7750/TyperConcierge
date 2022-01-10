import { useState, useEffect } from 'react';

export function useVocabulary(): [DictionaryInfo[], React.Dispatch<React.SetStateAction<string[]>>, () => void, VocabularyEntry[]] {
  const [availableDictionaryList, setAvailableDictionaryList] = useState<DictionaryInfo[]>([]);
  const [usedDictionaryFileNameList, setUsedDictionaryFileNameList] = useState<string[]>([]);

  const [vocabularyEntryList, setVocabularyEntryList] = useState<VocabularyEntry[]>([]);

  const loadAvailableDictionaryList = () => {
    window.api.getDictionaryList().then(list => {
      setAvailableDictionaryList(list);
    });
  };

  // 依存なしなので初回のみ
  useEffect(() => {
    loadAvailableDictionaryList();
  }, []);

  useEffect(() => {
    window.api.getVocabularyEntryList(usedDictionaryFileNameList).then(list => {
      setVocabularyEntryList(list);
    });
  }, [usedDictionaryFileNameList]);

  return [availableDictionaryList, setUsedDictionaryFileNameList, loadAvailableDictionaryList, vocabularyEntryList];
}
