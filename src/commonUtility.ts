export const WORD_DICTIONARY_EXTENSION = '.tconciergew';
export const SENTENCE_DICTIONARY_EXTENSION = '.tconcierges';

export function isValidVocabularyEntry(viewString: string, hiraganaElementList: string[]): boolean {
  return viewString.length == hiraganaElementList.length;
}

export function concatDictionaryFileName(dictionaryInfo: DictionaryInfo): string {
  return dictionaryInfo.name + (dictionaryInfo.type === 'word' ? WORD_DICTIONARY_EXTENSION : SENTENCE_DICTIONARY_EXTENSION);
}
