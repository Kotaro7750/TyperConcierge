import { useState, useEffect, useMemo, useRef } from 'react';
import { hiraganaRomanDictionary } from './HiraganaRomanDictionary';
import { isPrintableASCII, allowSingleN } from './utility';

// Uni,Bi-gramを用いて文章を入力単位に分割する
// Ex. "ひじょうに big" -> ['ひ','じょ','う','に',' ','b','i','g']
function parseSentence(input: string): Chunk[] {
  let parsedSentence: Chunk[] = [];
  let i: number = 0;

  while (i < input.length) {
    const uni: string = input.substring(i, i + 1);
    const bi: string = i !== input.length - 1 ? input.substring(i, i + 2) : '';

    let chunkString: string;
    // 表示可能なASCII文字ならそのままパース結果とする
    if (isPrintableASCII(uni)) {
      chunkString = uni;
      i++;

    } else {
      // biがあるならそちらを優先
      if (bi in hiraganaRomanDictionary) {
        chunkString = bi;
        i = i + 2;

      } else {
        // uniは辞書にあることが前提
        if (!(uni in hiraganaRomanDictionary)) {
          throw new Error(`${uni} is not in dictionary`);
        }
        chunkString = uni;
        i++;
      }
    }

    parsedSentence.push({ chunkString: chunkString });
  }

  return parsedSentence;
}

// ローマ字出力できる単位に分けられたひらがなチャンク（ASCII文字も含む）にローマ字表現を追加する
function constructChunkWithRomanList(chunkList: Chunk[]): ChunkWithRoman[] {
  let chunkWithRomanList: ChunkWithRoman[] = new Array<ChunkWithRoman>(chunkList.length);

  // 「ん」など次のチャンクによっては使えないローマ字系列があるチャンクに対処するために先読みをする
  let nextChunkString: string = '';
  // 「っ」を処理するために次のチャンク先頭にある子音などのリストを保持しておく
  // 子音などとしているのは，な行・にゃ行・「ん」の「n」も含むため
  let nextChunkCanLtuByRepeatList: string[] = [];

  // 後ろから走査していくことで次のチャンクに依存する処理の実装が楽になる
  for (let i = chunkList.length - 1; i >= 0; i--) {
    const chunk: Chunk = chunkList[i];
    const chunkString: string = chunk.chunkString;
    let isASCII = false;

    // このチャンクのローマ字系列のリスト
    // ２次元配列になっているのは，２文字のひらがなのそれぞれの文字の区切れも表現するため
    let romanCandidateList: RomanCandidate[] = [];

    // ASCIIならそのまま
    if (chunkString.length == 1 && isPrintableASCII(chunkString)) {
      romanCandidateList.push({ candidate: [chunkString], strictNextChunkHeader: '' });
      isASCII = true;

    } else if (chunkString == 'ん') {
      const nRomanStringList = hiraganaRomanDictionary[chunkString];

      let tmpList: string[] = [];
      for (let str of nRomanStringList) {
        // 単語・チャンク末だったり後ろに母音，あ行，な行，や行が続く「ん」は「n」と入力できない
        if (str == 'n' && !allowSingleN(nextChunkString, i == chunkList.length - 1)) {
          continue;
        }
        tmpList.push(str);
      }

      tmpList.forEach(e => {
        romanCandidateList.push({
          candidate: [e],
          strictNextChunkHeader: ''
        });
      });

      // 小さい「つ」
      // ltuやxtuで打つ以外にも次のチャンクの子音で済ませる（「った」なら「tta」）ことができる
      // これを表そうとすると「った」を辞書に登録するという方法があるがこうすると辞書のサイズが膨大になる
      // 「あ」，「い」，「え」，「お」（「っう」は「wwu」「wwhu」などにできる），な行，にゃ行
      // 「っん」は「xxn」とできる
    } else if (chunkString == 'っ') {
      // 「ltu」「ltsu」「xtu」に関しては次のチャンクの文字に制限はない
      hiraganaRomanDictionary[chunkString].forEach(e => {
        romanCandidateList.push({
          candidate: [e],
          strictNextChunkHeader: ''
        });
      });

      // 子音などの連続で済ませるなら次のチャンクの先頭は制限する必要がある
      nextChunkCanLtuByRepeatList.forEach(e => {
        romanCandidateList.push({
          candidate: [e],
          strictNextChunkHeader: e
        });
      });

      // ２文字の場合にはまとめて入力した場合と１文字ずつ入力した場合のローマ字系列がある
    } else if (chunkString.length == 2) {
      if (!(chunkString in hiraganaRomanDictionary)) {
        throw new Error(`${chunkString} is not in dictionary`);
      }

      // まずは２文字をまとめて入力できるローマ字系列をpushする
      hiraganaRomanDictionary[chunkString].forEach(e => {
        romanCandidateList.push({
          candidate: [e],
          strictNextChunkHeader: ''
        });
      });

      const chunkStringFirst: string = chunkString[0];
      const chunkStringSecond: string = chunkString[1];

      // 単独で入力できないものはないはず
      if (!(chunkStringFirst in hiraganaRomanDictionary) || !(chunkStringSecond in hiraganaRomanDictionary)) {
        throw new Error(`${chunkStringFirst} is not in dictionary`);
      }

      // １文字ずつ単独で入力したものを組み合わせてpushする
      for (let first of hiraganaRomanDictionary[chunkStringFirst]) {
        for (let second of hiraganaRomanDictionary[chunkStringSecond]) {
          romanCandidateList.push({
            candidate: [first, second],
            strictNextChunkHeader: ''
          });
        }
      }
    } else {
      if (!(chunkString in hiraganaRomanDictionary)) {
        throw new Error(`${chunkString} is not in dictionary`);
      }

      hiraganaRomanDictionary[chunkString].forEach(e => {
        romanCandidateList.push({
          candidate: [e],
          strictNextChunkHeader: ''
        });
      });
    }

    // ひとまずは文字数の少ない候補を第一候補として選択する
    // TODO 文字数が最小の候補が複数ある場合に関しては設定で選べるようにする
    romanCandidateList.sort((a: RomanCandidate, b: RomanCandidate) => {
      return reduceCandidate(a.candidate).length - reduceCandidate(b.candidate).length;
    });

    chunkWithRomanList[i] = {
      chunkString: chunkString,
      // 最短の候補を選んでいけば文章全体でも最短になるはず（候補のソートは安定ソートだと思う）
      // もし安定ソートじゃないと，「っち」が「cti」とするのが最短みたいになってしまうかもしれない（[['t'],['c'],['ltu']...]と['ti','chi']にはなってるけどtとcが逆転してしまう）
      minCandidateString: reduceCandidate(romanCandidateList[0].candidate),
      romanCandidateList: romanCandidateList,
    };
    nextChunkString = chunkString;

    nextChunkCanLtuByRepeatList = [];
    // 次のチャンクがASCIIだったら促音を子音などの連続で表すことはできない
    if (!isASCII) {
      // 同じ子音などが連続するのを防ぐ
      let isDuplicate: { [key: string]: boolean } = {};

      romanCandidateList.forEach(romanCandidate => {
        const head = characterAtCursorPosition(romanCandidate.candidate, 0);
        // 次のチャンクの先頭が「n」を除く子音の可能性がある場合に促音を子音などの連続で表せる
        if (head != 'a' && head != 'i' && head != 'u' && head != 'e' && head != 'o' && head != 'n') {
          if (!(head in isDuplicate)) {
            nextChunkCanLtuByRepeatList.push(head);
            isDuplicate[head] = true;
          }
        }
      });
    }
  }

  return chunkWithRomanList;
}

// 入力補助用のローマ字文を生成する
function generateRomanPaneInformation(chunkWithRomanList: ChunkWithRoman[], confirmedChunkList: ConfirmedChunk[], inflightChunk: InflightChunkWithRoman): RomanPaneInformation {
  let generatedString: string = '';
  let missedPosition: number[] = [];
  let chunkId = 0;

  let cursorPosition = 0;

  // 既に確定したチャンクについてはローマ字表現は確定している
  for (let confirmedChunk of confirmedChunkList) {
    chunkId = confirmedChunk.id + 1;
    generatedString += confirmedChunk.string;

    let isMissed: boolean = false;
    confirmedChunk.keyStrokeList.forEach(keyStrokeInformation => {
      if (keyStrokeInformation.isHit) {
        if (isMissed) {
          missedPosition.push(cursorPosition);
        }
        isMissed = false;
        cursorPosition++;
      } else {
        isMissed = true;
      }
    });
  }


  // 入力し終わっていたらこの時点でリターンする
  if (confirmedChunkList.length == chunkWithRomanList.length) {
    return { romanString: generatedString, currentCursorPosition: cursorPosition, missedPosition: missedPosition };
  }

  // 現在入力中のチャンクはローマ字表現候補が限られている
  generatedString += reduceCandidate(inflightChunk.romanCandidateList[0].candidate);

  let isMissed: boolean = false;
  inflightChunk.keyStrokeList.forEach(keyStrokeInformation => {
    if (keyStrokeInformation.isHit) {
      if (isMissed) {
        missedPosition.push(cursorPosition);
      }
      isMissed = false;
      cursorPosition++;
    } else {
      isMissed = true;
    }
  });

  chunkId = inflightChunk.id + 1;

  let strictNextChunkHeader = inflightChunk.romanCandidateList[0].strictNextChunkHeader;

  // 未確定のチャンクでは全ての候補から選択する
  for (; chunkId < chunkWithRomanList.length; chunkId++) {
    const chunkWithRoman = chunkWithRomanList[chunkId];

    let candidate: string[] = chunkWithRoman.romanCandidateList[0].candidate;
    let tmpStrict = chunkWithRoman.romanCandidateList[0].strictNextChunkHeader;

    // 前のチャンクから先頭文字が制限されている可能性もある
    if (strictNextChunkHeader != '' && candidate[0][0] != strictNextChunkHeader) {
      for (let romanCandidate of chunkWithRoman.romanCandidateList) {
        if (romanCandidate.candidate[0][0] == strictNextChunkHeader) {
          candidate = romanCandidate.candidate;
          tmpStrict = romanCandidate.strictNextChunkHeader;
          break;
        }
      }

      if (candidate[0][0] != strictNextChunkHeader) {
        throw new Error(`${candidate[0]} in ${chunkWithRoman.chunkString} don't start with ${strictNextChunkHeader}`)
      }
    }

    strictNextChunkHeader = tmpStrict;
    generatedString += reduceCandidate(candidate);
  }

  return {
    romanString: generatedString,
    currentCursorPosition: cursorPosition,
    missedPosition: missedPosition,
  };
}

function deepCopyChunkWithRoman(src: ChunkWithRoman): ChunkWithRoman {
  let dst: ChunkWithRoman = {
    chunkString: src.chunkString,
    minCandidateString: src.minCandidateString,
    romanCandidateList: [],
  };

  src.romanCandidateList.forEach(romanCandidate => {
    let candidate: string[] = [];
    romanCandidate.candidate.forEach(e => candidate.push(e));

    dst.romanCandidateList.push({
      candidate: candidate,
      strictNextChunkHeader: romanCandidate.strictNextChunkHeader,
    });
  });

  return dst;
}

// 複数文字に対応した候補を文字列に変換する
// Ex. ['ki','lyo'] -> 'kilyo'
function reduceCandidate(candidate: string[]): string {
  return candidate.reduce((prev, current) => prev + current);
}

function characterAtCursorPosition(candidate: string[], cursorPosition: number): PrintableASCII {
  // TODO あまりキャストしたくないのでそのうちPrintableASCIIでできたstring型を定義する必要があるかもしれない
  return reduceCandidate(candidate)[cursorPosition] as PrintableASCII;
}

export function useRomanEngine(initSentence: string): [RomanPaneInformation, (c: PrintableASCII, elapsedTime: number) => void] {
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
  const romanPaneInformation = useMemo(() => generateRomanPaneInformation(memorizedChunkWithRomanList, confirmedChunkList.current, inflightChunk.current), [timeStamp.current, sentence]);

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
          string: reduceCandidate(romanCandidate.candidate),
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

  return [romanPaneInformation, onInput];
}
