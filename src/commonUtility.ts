export function isValidVocabulary(viewString: string, hiraganaElementList: string[]): boolean {
  return viewString.length == hiraganaElementList.length;
}
