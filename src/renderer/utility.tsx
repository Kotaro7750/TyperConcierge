import React from 'react';
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
export function constructStyledStringElement(str: string, cursorPosition: number[], missedPosition: number[]): JSX.Element {
  const missedPositionDict: { [key: number]: boolean } = {};
  const cursorPositionDict: { [key:number]: boolean } = {};

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
    } else if (i < minCursorPosition) {
      cssClass = 'text-secondary';
    } else if (i in cursorPositionDict) {
      cssClass = 'text-primary';
    } else {
      cssClass = '';
    }

    element.push(<span key={i} className={cssClass}>{str[i]}</span>);
  }

  return (
    <span className='fs-3'>{element}</span>
  )
}

