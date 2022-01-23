import { useState, useMemo, useRef } from 'react';
import { deepCopyChunk, reduceCandidate, charInRomanElementAtPosition, inCandidateIndexAtPosition, selectEffectiveRomanChunkLength, calcLapLastIndexOfChunk } from './RomanEngineUtility';

// もし1チャンク内で２つ以上ラップの切れ目があると上手く動かないので設定値に注意
// TODO ここはユーザー設定で変えられるようにする？でもそうすると記録の整合性がなくなる
export const LAP_LENGTH = 50;

// 表示用の情報を構築する
function constructSentenceViewPaneInformation(chunkList: Chunk[], confirmedChunkList: ConfirmedChunk[], inflightChunk: InflightChunk): SentenceViewPaneInformation {
  let chunkId = 0;

  let romanStr: string = '';
  let romanMissedPos: number[] = [];
  let romanCursorPos = 0;

  let inLapRomanCount = 0;
  const lapLastPos = [];
  const lapElapsedTime: number[] = [];

  const hiraganaMissedPos: number[] = [];
  let hiraganaCursorPos = 0;

  // 既に確定したチャンクについてはローマ字表現は確定している
  for (let confirmedChunk of confirmedChunkList) {
    const confirmedCandidate = confirmedChunk.confirmedCandidate;
    const confirmedCandidateStr = reduceCandidate(confirmedCandidate.romanElemList);

    romanStr += confirmedCandidateStr;

    // このチャンク内で規定の１ラップローマ字数に達していたら新しいラップにする
    const effectiveRomanChunkLen = selectEffectiveRomanChunkLength(confirmedChunk.minCandidateString.length, confirmedCandidateStr.length);

    let inChunkLapEndIndex = -1;
    inLapRomanCount += effectiveRomanChunkLen;
    if (inLapRomanCount >= LAP_LENGTH) {
      inLapRomanCount -= LAP_LENGTH;

      inChunkLapEndIndex = calcLapLastIndexOfChunk(effectiveRomanChunkLen, inLapRomanCount, confirmedCandidateStr.length);
      lapLastPos.push(romanCursorPos + inChunkLapEndIndex);
    }

    // チャンク先頭のローマ字のカーソル位置
    const chunkHeadRomanCursorPos = romanCursorPos;
    // 候補ローマ字系列の要素（２文字を個別で入力した場合に２つになる）のそれぞれがミスかどうか
    const dividedCandidateMissVector: boolean[] = confirmedCandidate.romanElemList.map(_ => false);

    let isMissed: boolean = false;
    confirmedChunk.keyStrokeList.forEach(keyStrokeInfo => {
      // 同じ位置で複数回ミスした時に重複するのを避ける
      if (keyStrokeInfo.isHit) {
        const inCandidateCursorPos = romanCursorPos - chunkHeadRomanCursorPos;
        const inCandidateIndex = inCandidateIndexAtPosition(confirmedCandidate.romanElemList, inCandidateCursorPos);

        if (isMissed) {
          dividedCandidateMissVector[inCandidateIndex] = true;

          romanMissedPos.push(romanCursorPos);
        }

        // このキーストロークがラップ終了のものだったら時間を記録する
        if (inChunkLapEndIndex == inCandidateCursorPos) {
          lapElapsedTime.push(keyStrokeInfo.elapsedTime);
        }

        isMissed = false;
        romanCursorPos++;
      } else {
        isMissed = true;
      }
    });

    // このチャンクのローマ字系列で一回でもミスしていたらこのチャンクではミスしていると判定する
    // 複数文字から成るチャンクの可能性があるためミスしたら全ての文字をミス登録する
    for (let i = 0; i < chunkList[chunkId].chunkStr.length; i++) {
      // ２文字を個別で入力した場合にはミス判定も個別になる
      const indexOfDividedCandidate = dividedCandidateMissVector.length == 1 ? 0 : i;
      if (dividedCandidateMissVector[indexOfDividedCandidate]) {
        hiraganaMissedPos.push(hiraganaCursorPos);
      }

      hiraganaCursorPos++;
    }

    chunkId = confirmedChunk.id + 1;
  }


  // 入力し終わっていたらこの時点でリターンする
  if (confirmedChunkList.length == chunkList.length) {
    return {
      progress: 1,
      querySentencePaneInfo: {
        // ここでのカーソル位置は必ず末尾+1となっているはずなのでそもそも複数文字とかは考えなくてよく，そのまま配列にしている
        hiraganaCursorPos: [hiraganaCursorPos],
        hiraganaMissedPos: hiraganaMissedPos,
        // ここでのカーソル位置は最後のチャンクの次のチャンク先頭に対応しているので-1する
        hiraganaLastPos: hiraganaCursorPos - 1,
      },
      romanPaneInfo: {
        romanStr: romanStr,
        cursorPos: romanCursorPos,
        missedPos: romanMissedPos,
        lapEndPos: lapLastPos,
        lapElapsedTime: lapElapsedTime,
      }
    };
  }

  // この時点では現在入力しているチャンクの1文字目がhiraganaCursorPosとなっているので-1する
  let hiraganaLastPos = hiraganaCursorPos + inflightChunk.chunkStr.length - 1;

  // 現在入力中のチャンクはローマ字表現候補が限られている
  const inflightCandidateString = reduceCandidate(inflightChunk.romanCandidateList[0].romanElemList);
  romanStr += inflightCandidateString;

  // このチャンク内で規定の１ラップローマ字数に達していたら新しいラップにする
  // ほとんど確定したチャンク列の処理と同じ
  const effectiveRomanInflightChunkLength = selectEffectiveRomanChunkLength(inflightChunk.minCandidateStr.length, inflightCandidateString.length);

  let inChunkLapEndIndex = -1;
  inLapRomanCount += effectiveRomanInflightChunkLength;
  if (inLapRomanCount >= LAP_LENGTH) {
    inLapRomanCount -= LAP_LENGTH;
    inChunkLapEndIndex = calcLapLastIndexOfChunk(effectiveRomanInflightChunkLength, inLapRomanCount, inflightCandidateString.length);
    lapLastPos.push(romanCursorPos + calcLapLastIndexOfChunk(effectiveRomanInflightChunkLength, inLapRomanCount, inflightCandidateString.length));
  }

  // 複数文字チャンクでかつまとめて入力する候補の優先順位が高いときには複数文字をハイライトする必要がある
  const isCombinedTwoWordChunk: boolean = inflightChunk.chunkStr.length == 2 && inflightChunk.romanCandidateList[0].romanElemList.length == 1;

  // チャンク先頭のカーソル位置
  const chunkHeaderCursorPos = romanCursorPos;
  // チャンク先頭のひらがなカーソル位置
  const chunkHeaderHiraganaCursorPosition = hiraganaCursorPos;

  let romanMissedPosDict: { [key: number]: boolean } = {};
  let hiraganaMissedPosDict: { [key: number]: boolean } = {};

  inflightChunk.keyStrokeList.forEach(keyStrokeInfo => {
    const inCandidateCursorPos = romanCursorPos - chunkHeaderCursorPos;

    if (keyStrokeInfo.isHit) {
      const currentInCandidateIndex = inCandidateIndexAtPosition(inflightChunk.romanCandidateList[0].romanElemList, inCandidateCursorPos);
      const nextInCandidateIndex = inCandidateIndexAtPosition(inflightChunk.romanCandidateList[0].romanElemList, inCandidateCursorPos + 1);
      if (currentInCandidateIndex != nextInCandidateIndex) {
        // 本当は+2する必要はない（hiraganaCursorPositionをinflightChunkで使う理由は複数文字チャンクを１文字ずつ入力する場合の処理のみ）
        hiraganaCursorPos += isCombinedTwoWordChunk ? 2 : 1;
      }

      // このキーストロークがラップ終了のものだったら時間を記録する
      if (inChunkLapEndIndex == inCandidateCursorPos) {
        lapElapsedTime.push(keyStrokeInfo.elapsedTime);
      }


      romanCursorPos++;
    } else {
      if (!(romanCursorPos in romanMissedPosDict)) {
        romanMissedPos.push(romanCursorPos);
      }

      if (!(hiraganaCursorPos in hiraganaMissedPosDict)) {
        hiraganaMissedPos.push(hiraganaCursorPos);
        // 複数文字チャンクでまとめて入力するローマ字系列だった場合には次のカーソル位置（まとめて入力するローマ字系列だった場合には必ず１文字目にカーソルがある）もミスとしてやる必要がある
        if (isCombinedTwoWordChunk) {
          hiraganaMissedPos.push(hiraganaCursorPos + 1);
        }
      }

      romanMissedPosDict[romanCursorPos] = true;
    }
  });
  // hiraganaCursorPositionを使ってしまうと複数文字まとめてだった場合の最後の文字を打ち終えた瞬間だけ次の文字にもカーソルがあたってしまう
  const hiraganaCursorPosArray = isCombinedTwoWordChunk ? [chunkHeaderHiraganaCursorPosition, chunkHeaderHiraganaCursorPosition + 1] : [hiraganaCursorPos];
  chunkId = inflightChunk.id + 1;


  // カーソル位置以降のチャンク
  let strictNextChunkHeader = inflightChunk.romanCandidateList[0].nextChunkHeadConstraint;

  // 未確定のチャンクでは全ての候補から選択する
  for (; chunkId < chunkList.length; chunkId++) {
    const chunk = chunkList[chunkId];

    let candidate: string[] = chunk.romanCandidateList[0].romanElemList;
    let tmpStrict = chunk.romanCandidateList[0].nextChunkHeadConstraint;

    // 前のチャンクから先頭文字が制限されている可能性もある
    if (strictNextChunkHeader != '' && charInRomanElementAtPosition(candidate, 0) != strictNextChunkHeader) {
      for (let romanCandidate of chunk.romanCandidateList) {
        if (charInRomanElementAtPosition(romanCandidate.romanElemList, 0) == strictNextChunkHeader) {
          candidate = romanCandidate.romanElemList;
          tmpStrict = romanCandidate.nextChunkHeadConstraint;
          break;
        }
      }

      if (charInRomanElementAtPosition(candidate, 0) != strictNextChunkHeader) {
        throw new Error(`${candidate[0]} in ${chunk.chunkStr} don't start with ${strictNextChunkHeader}`)
      }
    }

    strictNextChunkHeader = tmpStrict;

    // このチャンク内で規定の１ラップローマ字数に達していたら新しいラップにする
    // ほとんど確定したチャンク列の処理と同じ
    // まだタイプしていないので表示されるローマ字系列をそのまま使う
    const effectiveRomanChunkLength = reduceCandidate(candidate).length;

    inLapRomanCount += effectiveRomanChunkLength;
    if (inLapRomanCount >= LAP_LENGTH) {
      inLapRomanCount -= LAP_LENGTH;
      // 現在のローマ字数がこのチャンクの先頭インデックス
      lapLastPos.push(romanStr.length + calcLapLastIndexOfChunk(effectiveRomanChunkLength, inLapRomanCount, reduceCandidate(candidate).length));
    }

    romanStr += reduceCandidate(candidate);
    hiraganaLastPos += chunk.chunkStr.length;
  }

  return {
    progress: romanCursorPos / romanStr.length,
    querySentencePaneInfo: {
      hiraganaCursorPos: hiraganaCursorPosArray,
      hiraganaMissedPos: hiraganaMissedPos,
      hiraganaLastPos: hiraganaLastPos,
    },
    romanPaneInfo: {
      romanStr: romanStr,
      cursorPos: romanCursorPos,
      missedPos: romanMissedPos,
      lapEndPos: lapLastPos,
      lapElapsedTime: lapElapsedTime,
    },
  };
}

export function useRomanEngine(queryInfo: QueryInfo): [SentenceViewPaneInformation, (c: PrintableASCII, elapsedTime: number) => void] {
  const [finished, setFinished] = useState<boolean>(false);
  const chunkList = queryInfo.chunkList;

  let confirmedChunkList = useRef<ConfirmedChunk[]>([]);

  // 現在入力中のチャンク
  let inflightChunk = useRef<InflightChunk>({
    ...deepCopyChunk(chunkList[0]),
    id: 0,
    minCandidateStr: reduceCandidate(chunkList[0].romanCandidateList[0].romanElemList),
    // 候補数だけの0を要素とした配列
    cursorPositionList: chunkList[0].romanCandidateList.map(_ => 0),
    keyStrokeList: []
  });

  // あまりきれいではないが変更が起こった時のタイムスタンプの値を用いてメモ化を行う
  let timeStamp = useRef<number>(new Date().getTime());
  const sentenceViewPaneInformation = useMemo(() => constructSentenceViewPaneInformation(chunkList, confirmedChunkList.current, inflightChunk.current), [timeStamp.current]);

  // 現在入力中のチャンクに対して文字を入力して情報を更新する
  // もしチャンクが打ち終わりかつ最後のチャンクだった場合にはtrueを返す
  // それ以外はfalseを返す
  function updateInflightChunk(c: PrintableASCII, elapsedTime: number): boolean {
    let hitCandidateList: RomanCandidate[] = [];
    let hitCursorPositionList: number[] = [];

    inflightChunk.current.romanCandidateList.forEach((romanCandidate: RomanCandidate, i: number) => {
      const cursorPosition: number = inflightChunk.current.cursorPositionList[i];

      // それぞれの候補にヒットしているかを確かめる
      if (charInRomanElementAtPosition(romanCandidate.romanElemList, cursorPosition) == c) {
        hitCandidateList.push(romanCandidate);
        hitCursorPositionList.push(cursorPosition + 1);
      }
    });

    let isHit: boolean;
    // 何かしらヒットしていたらヒットしていたものだけを残す
    if (hitCandidateList.length != 0) {
      inflightChunk.current.romanCandidateList = hitCandidateList;
      inflightChunk.current.cursorPositionList = hitCursorPositionList;
      isHit = true;
    } else {
      isHit = false;
    }

    const keyStrokeInformation: KeyStrokeInformation = {
      elapsedTime: elapsedTime,
      c: c,
      isHit: isHit,
    };

    inflightChunk.current.keyStrokeList.push(keyStrokeInformation);

    let isFinish = false;

    let hasFinishedCandidate = false;
    // チャンクが終了したときの処理
    // 「っっち」を「ltutti」と打ちたい場合でも最初の「l」を入力した段階で１つ目のチャンクが終了してしまうがこれは仕様とする
    for (let i = 0; i < inflightChunk.current.romanCandidateList.length; ++i) {
      const romanCandidate = inflightChunk.current.romanCandidateList[i];

      // iは0インデックスなので候補の長さとなったとき（１つはみだしたとき）にチャンクが終了したと判定できる
      if (reduceCandidate(romanCandidate.romanElemList).length == inflightChunk.current.cursorPositionList[i]) {
        // 1つの候補が終了したら即座に確定したとみなす
        // 通常のチャンクであればそのような候補はないのだが制限されたチャンクで候補が重複していたりした場合には生じうる
        if (hasFinishedCandidate) {
          throw new Error(`Some candidate finish simultaneously`);
        }
        hasFinishedCandidate = true;

        // 確定したチャンクにinflightChunkを追加する
        confirmedChunkList.current.push({
          id: inflightChunk.current.id,
          // TODO これディープコピーしなくていいの？
          confirmedCandidate: romanCandidate,
          minCandidateString: inflightChunk.current.minCandidateStr,
          // TODO これディープコピーしなくていいの？
          keyStrokeList: inflightChunk.current.keyStrokeList,
        });

        const strictNextChunkHeader = romanCandidate.nextChunkHeadConstraint;

        // inflightChunkを更新する
        if (inflightChunk.current.id != chunkList.length - 1) {
          const nextInflightChunkId = inflightChunk.current.id + 1;
          const nextInflightChunk = deepCopyChunk(chunkList[nextInflightChunkId]);

          // 枝刈りする前にやらないと全体でみた最短にならないことがある
          // Ex. 「たっっち」を「tal」と入力していたときに「tatltuti」が最短とされてしまう
          // もともとのchunkListが短い順にソートされているので0番目のインデックスに最短のローマ字表現候補が入っている
          const minCandidateString = reduceCandidate(nextInflightChunk.romanCandidateList[0].romanElemList);

          // 次のチャンクの先頭が制限されているときには候補を枝刈りする必要がある
          if (strictNextChunkHeader != '') {
            nextInflightChunk.romanCandidateList = nextInflightChunk.romanCandidateList.filter(romanCandidate => charInRomanElementAtPosition(romanCandidate.romanElemList, 0) == strictNextChunkHeader);
          }


          inflightChunk.current = {
            id: nextInflightChunkId,
            ...nextInflightChunk,
            minCandidateStr: minCandidateString,
            cursorPositionList: nextInflightChunk.romanCandidateList.map(_ => 0),
            keyStrokeList: [],
          }
          // 最後のチャンクだったらinflightChunkの更新処理は行わない
          // 本来なら無効値にするべきなんだろうけど読み出されないのでそのままにする
        } else {
          isFinish = true;
        }
      }
    };

    return isFinish;
  }

  function onInput(c: PrintableASCII, elapsedTime: number) {
    if (finished) {
      return
    }

    timeStamp.current = new Date().getTime();
    const isFinish: boolean = updateInflightChunk(c, elapsedTime);

    if (isFinish) {
      onFinish();
    }
  }

  function onFinish() {
    setFinished(true);
    dispatchEvent(new CustomEvent<TypingFinishEvent>('typingFinish', {
      detail: {
        confirmedChunkList: confirmedChunkList.current,
      }
    }));
  }

  return [sentenceViewPaneInformation, onInput];
}
