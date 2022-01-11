import React from 'react';

import {isValidVocabularyEntry} from '../commonUtility';

export function constructQueryInformation(vocabularyEntryList: VocabularyEntry[], roughRomanCount: number): QueryInformation {

  let viewString = '';
  let hiraganaString = '';
  let hiraganaCount = 0;
  const inViewPositionOfHiraganaString: number[] = [];

  const vocabularyNumber = vocabularyEntryList.length;

  // ここでのwordはローマ字じゃなくて単語
  // １単語につき平均5ローマ字だという根拠のない仮定
  // FIXME 語彙数0だとチャンクが生成されなくてクラッシュするのでどこかで弾く必要がある
  const wordCount = vocabularyNumber == 0 ? 0 : Math.floor(roughRomanCount / 5);

  for (let i = 0; i < wordCount; ++i) {
    const randIndex = Math.floor(Math.random() * (vocabularyNumber));
    const [wordViewString, wordHiraganaElementList] = vocabularyEntryList[randIndex];

    if (!isValidVocabularyEntry(wordViewString,wordHiraganaElementList)) {
      throw new Error(`Length mismatch detected in word ${wordViewString}`);
    }

    viewString += wordViewString;
    for (let elem of wordHiraganaElementList) {
      hiraganaString += elem;
      for (let j = 0; j < elem.length; ++j) {
        inViewPositionOfHiraganaString.push(hiraganaCount);
      }
      hiraganaCount++;
    }

    if (i != wordCount - 1) {
      viewString += ' ';
      hiraganaString += ' '
      inViewPositionOfHiraganaString.push(hiraganaCount);
      hiraganaCount++;
    }
  }

  return {
    viewString: viewString,
    hiraganaString: hiraganaString,
    viewStringPositionOfHiraganaString: inViewPositionOfHiraganaString,
  }
}

export function isPrintableASCII(input: string) {
  return /^[\x20-\x7E]*$/.test(input);
}

// 「ん」のローマ字入力として「n」を使ってもいいかの判定
export function allowSingleN(ncs: string, isLastChunk: boolean): boolean {
  // 文末・単語末の場合には許容しない
  if (isLastChunk || ncs == ' ') {
    return false;
    // 次のチャンクが母音・な行・や行（「ゃ」「ゅ」「ょ」を除く）のときは許容しない
  } else if (
    ncs == 'あ'   || ncs == 'い'   || ncs == 'う'   || ncs   == 'え'  || ncs == 'お'   ||
    ncs == 'な'   || ncs == 'に'   || ncs == 'ぬ'   || ncs   == 'ね'  || ncs == 'の'   ||
    ncs == 'にゃ' || ncs == 'にぃ' || ncs == 'にゅ' || ncs   == 'にぇ'|| ncs == 'にょ' ||
    ncs == 'や'   || ncs == 'ゆ'   || ncs == 'よ'   || ncs   == 'ん') {
    return false;

    // 次のチャンクがASCIIのときは許容しない
  } else if (isPrintableASCII(ncs)) {
    return false;
  } else {
    return true;
  }
}

// カーソル位置が配列になっているのは複数文字からなるチャンクをまとめて入力する場合があるため
export function constructStyledStringElement(str: string, cursorPosition: number[], missedPosition: number[]): JSX.Element[] {
  const missedPositionDict: { [key: number]: boolean } = {};
  const cursorPositionDict: { [key: number]: boolean } = {};

  missedPosition.forEach(position => {
    missedPositionDict[position] = true;
  });

  let minCursorPosition = cursorPosition[0];
  cursorPosition.forEach(position => {
    minCursorPosition = position < minCursorPosition ? position : minCursorPosition;
    cursorPositionDict[position] = true;
  });

  let element: JSX.Element[] = [];

  for (let i = 0; i < str.length; ++i) {
    let cssClass;
    if (i in missedPositionDict) {
      cssClass = 'text-danger';
      // 半角スペースだけだとわかりにくい場合には下線を引く
      if (str[i] == ' ') {
        cssClass += ' text-decoration-underline';
      }
    } else if (i < minCursorPosition) {
      cssClass = 'text-secondary';
    } else if (i in cursorPositionDict) {
      cssClass = 'text-primary';
      if (str[i] == ' ') {
        cssClass += ' text-decoration-underline';
      }
    } else {
      cssClass = '';
    }

    // 行の最初と最後にスペースがあるときに' 'としてしまうとレンダリングエンジンが消してしまう
    element.push(<span key={i} className={cssClass}>{str[i] == ' ' ? '\u00A0' : str[i]}</span>);
  }

  return element;
}
