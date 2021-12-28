import { useState, useMemo, useRef } from 'react';
import { deepCopyChunkWithRoman, reduceCandidate, characterAtCursorPosition, inCandidateIndexAtCursorPosition, parseSentence, constructChunkWithRomanList, selectEffectiveRomanChunkLength, calcInChunkLapEndIndex } from './RomanEngineUtility';

// 表示用の情報を構築する
function constructSentenceViewPaneInformation(chunkWithRomanList: ChunkWithRoman[], confirmedChunkList: ConfirmedChunk[], inflightChunk: InflightChunkWithRoman): SentenceViewPaneInformation {
  let chunkId = 0;

  let romanString: string = '';
  let romanMissedPosition: number[] = [];
  let romanCursorPosition = 0;

  // もし1チャンク内で２つ以上ラップの切れ目があると上手く動かないので設定値に注意
  // TODO ここはユーザー設定で変えられるようにする？でもそうすると記録の整合性がなくなる
  const LAP_LENGTH = 50;
  let inLapRomanCount = 0;
  let lapEndPosition = [];

  let hiraganaMissedPosition: number[] = [];
  let hiraganaCursorPosition = 0;

  // 既に確定したチャンクについてはローマ字表現は確定している
  for (let confirmedChunk of confirmedChunkList) {
    const confirmedCandidateString = reduceCandidate(confirmedChunk.confirmedCandidate.candidate);
    romanString += confirmedCandidateString;

    // このチャンク内で規定の１ラップローマ字数に達していたら新しいラップにする
    const effectiveRomanChunkLength = selectEffectiveRomanChunkLength(confirmedChunk.minCandidateString.length, confirmedCandidateString.length);

    inLapRomanCount += effectiveRomanChunkLength;
    if (inLapRomanCount >= LAP_LENGTH) {
      inLapRomanCount -= LAP_LENGTH;
      lapEndPosition.push(romanCursorPosition + calcInChunkLapEndIndex(effectiveRomanChunkLength, inLapRomanCount, confirmedCandidateString.length));
    }

    // チャンク先頭のカーソル位置
    const chunkHeaderCursorPosition = romanCursorPosition;
    // 候補ローマ字系列の要素（２文字を個別で入力した場合に２つになる）のそれぞれがミスかどうか
    let dividedCandidateMissVector: boolean[] = confirmedChunk.confirmedCandidate.candidate.map(_ => false);

    let isMissed: boolean = false;
    confirmedChunk.keyStrokeList.forEach(keyStrokeInformation => {
      // 同じ位置で複数回ミスした時に重複するのを避ける
      if (keyStrokeInformation.isHit) {
        if (isMissed) {
          const inCandidateCursorPosition = romanCursorPosition - chunkHeaderCursorPosition;
          const inCandidateIndex = inCandidateIndexAtCursorPosition(confirmedChunk.confirmedCandidate.candidate, inCandidateCursorPosition);
          dividedCandidateMissVector[inCandidateIndex] = true;

          romanMissedPosition.push(romanCursorPosition);
        }
        isMissed = false;
        romanCursorPosition++;
      } else {
        isMissed = true;
      }
    });

    // このチャンクのローマ字系列で一回でもミスしていたらこのチャンクではミスしていると判定する
    // 複数文字から成るチャンクの可能性があるためミスしたら全ての文字をミス登録する
    for (let i = 0; i < chunkWithRomanList[chunkId].chunkString.length; i++) {
      // ２文字を個別で入力した場合にはミス判定も個別になる
      const indexOfDividedCandidate = dividedCandidateMissVector.length == 1 ? 0 : i;
      if (dividedCandidateMissVector[indexOfDividedCandidate]) {
        hiraganaMissedPosition.push(hiraganaCursorPosition);
      }

      hiraganaCursorPosition++;
    }

    chunkId = confirmedChunk.id + 1;
  }


  // 入力し終わっていたらこの時点でリターンする
  if (confirmedChunkList.length == chunkWithRomanList.length) {
    return {
      querySentencePaneInforamtion: {
        // ここでのカーソル位置は必ず末尾+1となっているはずなのでそもそも複数文字とかは考えなくてよく，そのまま配列にしている
        hiraganaCursorPosition: [hiraganaCursorPosition],
        missedPosition: hiraganaMissedPosition,
      },
      romanPaneInformation: {
        romanString: romanString,
        currentCursorPosition: romanCursorPosition,
        missedPosition: romanMissedPosition,
        lapEndPosition: lapEndPosition,
      }
    };
  }

  // 現在入力中のチャンクはローマ字表現候補が限られている
  const inflightCandidateString = reduceCandidate(inflightChunk.romanCandidateList[0].candidate);
  romanString += inflightCandidateString;

  // このチャンク内で規定の１ラップローマ字数に達していたら新しいラップにする
  // ほとんど確定したチャンク列の処理と同じ
  const effectiveRomanInflightChunkLength = selectEffectiveRomanChunkLength(inflightChunk.minCandidateString.length, inflightCandidateString.length);

  inLapRomanCount += effectiveRomanInflightChunkLength;
  if (inLapRomanCount >= LAP_LENGTH) {
    inLapRomanCount -= LAP_LENGTH;
    lapEndPosition.push(romanCursorPosition + calcInChunkLapEndIndex(effectiveRomanInflightChunkLength, inLapRomanCount, inflightCandidateString.length));
  }

  // 複数文字チャンクでかつまとめて入力する候補の優先順位が高いときには複数文字をハイライトする必要がある
  const isCombinedTwoWordChunk: boolean = inflightChunk.chunkString.length == 2 && inflightChunk.romanCandidateList[0].candidate.length == 1;

  // チャンク先頭のカーソル位置
  const chunkHeaderCursorPosition = romanCursorPosition;
  // チャンク先頭のひらがなカーソル位置
  const chunkHeaderHiraganaCursorPosition = hiraganaCursorPosition;

  let romanMissedPositionDict: { [key: number]: boolean } = {};
  let hiraganaMissedPositionDict: { [key: number]: boolean } = {};

  inflightChunk.keyStrokeList.forEach(keyStrokeInformation => {
    const inCandidateCursorPosition = romanCursorPosition - chunkHeaderCursorPosition;

    if (keyStrokeInformation.isHit) {
      const currentInCandidateIndex = inCandidateIndexAtCursorPosition(inflightChunk.romanCandidateList[0].candidate, inCandidateCursorPosition);
      const nextInCandidateIndex = inCandidateIndexAtCursorPosition(inflightChunk.romanCandidateList[0].candidate, inCandidateCursorPosition + 1);
      if (currentInCandidateIndex != nextInCandidateIndex) {
        // 本当は+2する必要はない（hiraganaCursorPositionをinflightChunkで使う理由は複数文字チャンクを１文字ずつ入力する場合の処理のみ）
        hiraganaCursorPosition += isCombinedTwoWordChunk ? 2 : 1;
      }

      romanCursorPosition++;
    } else {
      if (!(romanCursorPosition in romanMissedPositionDict)) {
        romanMissedPosition.push(romanCursorPosition);
      }

      if (!(hiraganaCursorPosition in hiraganaMissedPositionDict)) {
        hiraganaMissedPosition.push(hiraganaCursorPosition);
        // 複数文字チャンクでまとめて入力するローマ字系列だった場合には次のカーソル位置（まとめて入力するローマ字系列だった場合には必ず１文字目にカーソルがある）もミスとしてやる必要がある
        if (isCombinedTwoWordChunk) {
          hiraganaMissedPosition.push(hiraganaCursorPosition + 1);
        }
      }

      romanMissedPositionDict[romanCursorPosition] = true;
    }
  });
  // hiraganaCursorPositionを使ってしまうと複数文字まとめてだった場合の最後の文字を打ち終えた瞬間だけ次の文字にもカーソルがあたってしまう
  const hiraganaCursorPositionArray = isCombinedTwoWordChunk ? [chunkHeaderHiraganaCursorPosition, chunkHeaderCursorPosition + 1] : [hiraganaCursorPosition];
  chunkId = inflightChunk.id + 1;


  // カーソル位置以降のチャンク
  let strictNextChunkHeader = inflightChunk.romanCandidateList[0].strictNextChunkHeader;

  // 未確定のチャンクでは全ての候補から選択する
  for (; chunkId < chunkWithRomanList.length; chunkId++) {
    const chunkWithRoman = chunkWithRomanList[chunkId];

    let candidate: string[] = chunkWithRoman.romanCandidateList[0].candidate;
    let tmpStrict = chunkWithRoman.romanCandidateList[0].strictNextChunkHeader;

    // 前のチャンクから先頭文字が制限されている可能性もある
    if (strictNextChunkHeader != '' && characterAtCursorPosition(candidate, 0) != strictNextChunkHeader) {
      for (let romanCandidate of chunkWithRoman.romanCandidateList) {
        if (characterAtCursorPosition(romanCandidate.candidate, 0) == strictNextChunkHeader) {
          candidate = romanCandidate.candidate;
          tmpStrict = romanCandidate.strictNextChunkHeader;
          break;
        }
      }

      if (characterAtCursorPosition(candidate, 0) != strictNextChunkHeader) {
        throw new Error(`${candidate[0]} in ${chunkWithRoman.chunkString} don't start with ${strictNextChunkHeader}`)
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
      lapEndPosition.push(romanString.length + calcInChunkLapEndIndex(effectiveRomanChunkLength, inLapRomanCount, reduceCandidate(candidate).length));
    }

    romanString += reduceCandidate(candidate);
  }

  return {
    querySentencePaneInforamtion: {
      hiraganaCursorPosition: hiraganaCursorPositionArray,
      missedPosition: hiraganaMissedPosition,
    },
    romanPaneInformation: {
      romanString: romanString,
      currentCursorPosition: romanCursorPosition,
      missedPosition: romanMissedPosition,
      lapEndPosition: lapEndPosition,
    },
  };
}

export function useRomanEngine(initSentence: string): [SentenceViewPaneInformation, (c: PrintableASCII, elapsedTime: number) => void] {
  const [finished, setFinished] = useState<boolean>(false);
  const [sentence] = useState<string>(initSentence);
  const memorizedChunkWithRomanList = useMemo(() => constructChunkWithRomanList(parseSentence(sentence)), [sentence]);

  let confirmedChunkList = useRef<ConfirmedChunk[]>([]);

  // 現在入力中のチャンク
  let inflightChunk = useRef<InflightChunkWithRoman>({
    ...deepCopyChunkWithRoman(memorizedChunkWithRomanList[0]),
    id: 0,
    minCandidateString: reduceCandidate(memorizedChunkWithRomanList[0].romanCandidateList[0].candidate),
    // 候補数だけの0を要素とした配列
    cursorPositionList: memorizedChunkWithRomanList[0].romanCandidateList.map(_ => 0),
    keyStrokeList: []
  });

  // あまりきれいではないが変更が起こった時のタイムスタンプの値を用いてメモ化を行う
  let timeStamp = useRef<number>(new Date().getTime());
  const sentenceViewPaneInformation = useMemo(() => constructSentenceViewPaneInformation(memorizedChunkWithRomanList, confirmedChunkList.current, inflightChunk.current), [timeStamp.current, sentence]);

  // 現在入力中のチャンクに対して文字を入力して情報を更新する
  // もしチャンクが打ち終わりかつ最後のチャンクだった場合にはtrueを返す
  // それ以外はfalseを返す
  function updateInflightChunk(c: PrintableASCII, elapsedTime: number): boolean {
    let hitCandidateList: RomanCandidate[] = [];
    let hitCursorPositionList: number[] = [];

    inflightChunk.current.romanCandidateList.forEach((romanCandidate: RomanCandidate, i: number) => {
      const cursorPosition: number = inflightChunk.current.cursorPositionList[i];

      // それぞれの候補にヒットしているかを確かめる
      if (characterAtCursorPosition(romanCandidate.candidate, cursorPosition) == c) {
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

    // チャンクが終了したときの処理
    // 「っっち」を「ltutti」と打ちたい場合でも最初の「l」を入力した段階で１つ目のチャンクが終了してしまうがこれは仕様とする
    inflightChunk.current.romanCandidateList.forEach((romanCandidate, i) => {

      // iは0インデックスなので候補の長さとなったとき（１つはみだしたとき）にチャンクが終了したと判定できる
      if (reduceCandidate(romanCandidate.candidate).length == inflightChunk.current.cursorPositionList[i]) {

        // 確定したチャンクにinflightChunkを追加する
        confirmedChunkList.current.push({
          id: inflightChunk.current.id,
          // TODO これディープコピーしなくていいの？
          confirmedCandidate: romanCandidate,
          minCandidateString: inflightChunk.current.minCandidateString,
          // TODO これディープコピーしなくていいの？
          keyStrokeList: inflightChunk.current.keyStrokeList,
        });

        const strictNextChunkHeader = romanCandidate.strictNextChunkHeader;

        // inflightChunkを更新する
        if (inflightChunk.current.id != memorizedChunkWithRomanList.length - 1) {
          const nextInflightChunkId = inflightChunk.current.id + 1;
          const nextInflightChunk = deepCopyChunkWithRoman(memorizedChunkWithRomanList[nextInflightChunkId]);

          // 枝刈りする前にやらないと全体でみた最短にならないことがある
          // Ex. 「たっっち」を「tal」と入力していたときに「tatltuti」が最短とされてしまう
          const minCandidateString = reduceCandidate(nextInflightChunk.romanCandidateList[0].candidate);

          // 次のチャンクの先頭が制限されているときには候補を枝刈りする必要がある
          if (strictNextChunkHeader != '') {
            nextInflightChunk.romanCandidateList = nextInflightChunk.romanCandidateList.filter(romanCandidate => characterAtCursorPosition(romanCandidate.candidate, 0) == strictNextChunkHeader);
          }


          inflightChunk.current = {
            id: nextInflightChunkId,
            ...nextInflightChunk,
            // もともとのmemorizedChunkWithRomanListが短い順にソートされているので0番目のインデックスに最短のローマ字表現候補が入っている
            minCandidateString: minCandidateString,
            cursorPositionList: nextInflightChunk.romanCandidateList.map(_ => 0),
            keyStrokeList: [],
          }
          // 最後のチャンクだったらinflightChunkの更新処理は行わない
          // 本来なら無効値にするべきなんだろうけど読み出されないのでそのままにする
        } else {
          isFinish = true;
        }
      }
    });

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
