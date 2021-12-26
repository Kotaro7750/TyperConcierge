import { useState, useEffect, useMemo, useRef } from 'react';
import { hiraganaRomanDictionary } from './HiraganaRomanDictionary';
import { isPrintableASCII, allowSingleN } from './utility';

interface Chunk {
  chunkString: string
};

// チャンクのローマ字表現候補の１つを表す
// 候補が配列になっているのは，ひらがな２文字以上のときに１文字ずつ入力しても上手く扱えるようにするため（現在打っている文字をハイライトする時などの利用を想定）
// Ex. 「きょ」というチャンクの候補の１つである「kilyo」に対しては，['ki','lyo']とする
interface RomanCandidate {
  candidate: string[],
  // 「っ」を連続する子音などで表現する場合に次のチャンクの先頭が制限するために使う
  strictNextChunkHeader: string,
}

interface ChunkWithRoman extends Chunk {
  romanCandidateList: RomanCandidate[]
}

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

    chunkWithRomanList[i] = { chunkString: chunkString, romanCandidateList: romanCandidateList };
    nextChunkString = chunkString;

    nextChunkCanLtuByRepeatList = [];
    // 次のチャンクがASCIIだったら促音を子音などの連続で表すことはできない
    if (!isASCII) {
      // 同じ子音などが連続するのを防ぐ
      let isDuplicate: { [key: string]: boolean } = {};

      romanCandidateList.forEach(romanCandidate => {
        const head = romanCandidate['candidate'][0][0];
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

  console.log(chunkWithRomanList);
  return chunkWithRomanList;
}

// 入力補助用のローマ字文を生成する
function generateRomanPaneInformation(chunkWithRomanList: ChunkWithRoman[], confirmedChunkList: ConfirmedChunk[], inflightChunk: InflightChunkWithRoman): RomanPaneInformation {
  let generatedString: string = '';
  let chunkId = 0;

  // 既に確定したチャンクについてはローマ字表現は確定している
  for (let confirmedChunk of confirmedChunkList) {
    chunkId = confirmedChunk.id + 1;
    generatedString += confirmedChunk.string;
  }

  let cursorPosition = generatedString.length;

  // 入力し終わっていたらこの時点でリターンする
  if (confirmedChunkList.length == chunkWithRomanList.length) {
    return { romanString: generatedString, currentCursorPosition: cursorPosition };
  }

  // 現在入力中のチャンクはローマ字表現候補が限られている
  generatedString += reduceCandidate(inflightChunk.romanCandidateList[0].candidate);
  cursorPosition += inflightChunk.cursorPositionList[0];
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
    currentCursorPosition: cursorPosition
  };
}

interface ConfirmedChunk {
  id: number,
  string: string,
}

interface InflightChunkWithRoman extends ChunkWithRoman {
  id: number,
  // romanCandidateListのそれぞれに対応するカーソル位置の配列
  cursorPositionList: number[]
}

function deepCopyChunkWithRoman(src: ChunkWithRoman): ChunkWithRoman {
  let dst: ChunkWithRoman = {
    chunkString: src.chunkString,
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

export function useRomanEngine(initSentence: string): [RomanPaneInformation, (c: PrintableASCII) => void] {
  const [finished, setFinished] = useState<boolean>(false);
  const [sentence] = useState<string>(initSentence);
  const memorizedChunkWithRomanList = useMemo(() => constructChunkWithRomanList(parseSentence(sentence)), [sentence]);

  let confirmedChunkList = useRef<ConfirmedChunk[]>([]);

  // 現在入力中のチャンク
  let inflightChunk = useRef<InflightChunkWithRoman>({
    ...deepCopyChunkWithRoman(memorizedChunkWithRomanList[0]),
    id: 0,
    // 候補数だけの0を要素とした配列
    cursorPositionList: memorizedChunkWithRomanList[0].romanCandidateList.map(_ => 0)
  });

  // あまりきれいではないが変更が起こった時のタイムスタンプの値を用いてメモ化を行う
  let timeStamp = useRef<number>(new Date().getTime());
  const romanPaneInformation = useMemo(() => generateRomanPaneInformation(memorizedChunkWithRomanList, confirmedChunkList.current, inflightChunk.current), [timeStamp.current, sentence]);

  // 現在入力中のチャンクに対して文字を入力して情報を更新する
  // もしチャンクが打ち終わりかつ最後のチャンクだった場合にはtrueを返す
  // それ以外はfalseを返す
  function updateInflightChunk(c: PrintableASCII): boolean {
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

    // 何かしらヒットしていたらヒットしていたものだけを残す
    if (hitCandidateList.length != 0) {
      inflightChunk.current.romanCandidateList = hitCandidateList;
      inflightChunk.current.cursorPositionList = hitCursorPositionList;
    }


    let isFinish = false;

    // チャンクが終了したときの処理
    inflightChunk.current.romanCandidateList.forEach((romanCandidate, i) => {
      // iは0インデックスなので候補の長さとなったとき（１つはみだしたとき）にチャンクが終了したと判定できる
      if (reduceCandidate(romanCandidate.candidate).length == inflightChunk.current.cursorPositionList[i]) {
        // 確定したチャンクにinflightChunkを追加する
        confirmedChunkList.current.push({
          id: inflightChunk.current.id,
          string: reduceCandidate(romanCandidate.candidate),
        });

        const strictNextChunkHeader = romanCandidate.strictNextChunkHeader;

        // 最後のチャンクだったらinflightChunkの更新処理は行わない
        // 本来なら無効値にするべきなんだろうけど読み出されないのでそのままにする
        if (inflightChunk.current.id != memorizedChunkWithRomanList.length - 1) {
          const nextInflightChunkId = inflightChunk.current.id + 1;
          const nextInflightChunk = deepCopyChunkWithRoman(memorizedChunkWithRomanList[nextInflightChunkId]);

          // 次のチャンクの先頭が制限されているときには候補を枝刈りする必要がある
          if (strictNextChunkHeader != '') {
            nextInflightChunk.romanCandidateList = nextInflightChunk.romanCandidateList.filter(romanCandidate => romanCandidate.candidate[0][0] == strictNextChunkHeader);
          }

          inflightChunk.current = {
            id: nextInflightChunkId,
            ...nextInflightChunk,
            cursorPositionList: nextInflightChunk.romanCandidateList.map(_ => 0),
          }
        } else {
          isFinish = true;
        }
      }
    });

    return isFinish;
  }

  function onInput(c: PrintableASCII) {
    if (finished) {
      return
    }

    timeStamp.current = new Date().getTime();
    const isFinish: boolean = updateInflightChunk(c);

    if (isFinish) {
      onFinish();
    }
  }

  function onFinish() {
    setFinished(true);
    dispatchEvent(new CustomEvent('typingFinish'));
  }

  return [romanPaneInformation, onInput];
}
