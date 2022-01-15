import _, { useMemo } from 'react';

import { isValidVocabularyEntry } from '../commonUtility';
import { parseSentence, constructChunkList, reduceCandidate } from './RomanEngineUtility';

function constructWithWord(vocabularyEntryList: VocabularyEntry[], romanCountThreshold: number): QueryInfo {
  let romanCount = 0;
  let viewStr = '';
  let hiraganaStr = '';
  const chunkList: Chunk[] = [];
  const vStrPosOfHStr: number[] = [];

  const vocabularyNumber = vocabularyEntryList.length;

  // 要求ローマ字数を満たすまで以下を繰り返す
  // 1. 語彙リストからランダムに１つ選ぶ（もしくは空白）
  // 2. パースしてチャンクを構成する
  // 3. チャンクを追加する（語彙の途中で超えた場合には途中まで追加する）
  // 4. クエリ文字列に語彙の文字列を追加する（語彙の途中で超えた場合でも最後まで追加する）
  let isPrevWord = false;
  while (romanCount < romanCountThreshold) {
    // 1
    let wordViewString = '';
    let wordHiraganaElementList: string[] = [];

    if (isPrevWord) {
      wordViewString = ' ';
      wordHiraganaElementList = [' '];

      isPrevWord = false;
    } else {
      const randIndex = Math.floor(Math.random() * vocabularyNumber);
      [wordViewString, wordHiraganaElementList] = vocabularyEntryList[randIndex];

      isPrevWord = true;
    }

    if (!isValidVocabularyEntry(wordViewString, wordHiraganaElementList)) {
      throw new Error(`Length mismatch detected in word ${wordViewString}`);
    }

    // 2
    const wordHiraganaStr = reduceCandidate(wordHiraganaElementList)
    const wordChunkList = constructChunkList(parseSentence(wordHiraganaStr));

    // 3
    for (let chunk of wordChunkList) {
      const chunkRomanLen = chunk.minCandidateStr.length;
      romanCount += chunkRomanLen;

      chunkList.push(chunk);

      // このチャンクで閾値を超える場合には追加を終了する
      if (romanCount >= romanCountThreshold) {
        break;
      }
    }

    // 4
    wordHiraganaElementList.forEach((elem, i) => {
      for (let j = 0; j < elem.length; ++j) {
        vStrPosOfHStr.push(viewStr.length + i);
      }
    });

    viewStr += wordViewString;
    hiraganaStr += wordHiraganaStr;
  }

  return {
    viewString: viewStr,
    hiraganaString: hiraganaStr,
    viewStringPosOfHiraganaString: vStrPosOfHStr,
    chunkList: chunkList,
  }
}

export function useQueryConstructor(querySource: QuerySource): QueryInfo {
  return useMemo(() => {
    if (querySource.type === 'word') {
      return constructWithWord(querySource.vocabularyEntryList, querySource.romanCountThreshold);
    } else {
      // FIXME
      throw new Error(`type ${querySource.type} is not supportted`);
    }
  }, [querySource.vocabularyEntryList, querySource.romanCountThreshold, querySource.type]);
}
