import { useState, useEffect } from 'react';

export function useVocabulary(): [string[], React.Dispatch<React.SetStateAction<string[]>>, VocabularyEntry[]] {
  const [availableDictionaryNameList, setAvailableDictionaryList] = useState<string[]>([]);
  const [usedDictionaryNameList, setUsedDictionaryNameList] = useState<string[]>([]);

  const [vocabularyEntryList, setVocabularyEntryList] = useState<VocabularyEntry[]>([]);

  // 依存なしなので初回のみ
  useEffect(() => {
    window.api.getDictionaryList().then(list => {
      setAvailableDictionaryList(list);
    });
  }, []);

  useEffect(() => {
    window.api.getVocabularyEntryList(usedDictionaryNameList).then(list => {
      setVocabularyEntryList(list);
    });
  }, [usedDictionaryNameList]);

  return [availableDictionaryNameList, setUsedDictionaryNameList, vocabularyEntryList];
}
