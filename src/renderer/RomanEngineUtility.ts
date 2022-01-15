import { hiraganaRomanDictionary } from './HiraganaRomanDictionary';
import { isPrintableASCII, allowSingleN } from './utility';

export function deepCopyChunk(src: Chunk): Chunk {
  const dst: Chunk = {
    chunkStr: src.chunkStr,
    minCandidateStr: src.minCandidateStr,
    romanCandidateList: [],
  };

  src.romanCandidateList.forEach(romanCandidate => {
    const romanElemList: string[] = [];
    romanCandidate.romanElemList.forEach(e => romanElemList.push(e));

    dst.romanCandidateList.push({
      romanElemList: romanElemList,
      nextChunkHeadConstraint: romanCandidate.nextChunkHeadConstraint,
    });
  });

  return dst;
}

// 複数文字に対応した候補を文字列に変換する
// Ex. ['ki','lyo'] -> 'kilyo'
export function reduceCandidate(romanElemList: string[]): string {
  return romanElemList.reduce((prev, current) => prev + current);
}

export function charInRomanElementAtPosition(romanElemList: string[], position: number): PrintableASCII {
  // TODO あまりキャストしたくないのでそのうちPrintableASCIIでできたstring型を定義する必要があるかもしれない
  return reduceCandidate(romanElemList)[position] as PrintableASCII;
}

// ローマ字系列候補の中でcursorPosition目にある文字は配列の何番目に存在するか
// Ex. ['ki','lyo']という候補のカーソル位置2（l）は，インデックス1番
export function inCandidateIndexAtPosition(romanElemList: string[], position: number): number {
  let index = 0;
  let tailPosition = romanElemList[0].length - 1;

  while (tailPosition < position) {
    index++;
    tailPosition += romanElemList[index].length;
  }

  return index;
}

export function selectEffectiveRomanChunkLength(minCandidateLength: number, actualCandidateLength: number): number {
  // TODO 最短なのか実際に打った文字数なのかを変えられるようにする
  return true ? minCandidateLength : actualCandidateLength;
}

// チャンク内にラップ区切りがあった場合に表示用ローマ字系列の何番目がラップ末尾なのかを計算する
// inLapRomanCountは，既に減算したあとのもの
export function calcLapLastIndexOfChunk(effectiveRomanChunkLength: number, inLapRomanCount: number, actualCandidateLen: number): number {
  let index: number;

  // 後ろから数えてinLapRomanCount目（0-インデックス）がラップの最後の文字
  const inChunkIndexOfLapLast = effectiveRomanChunkLength - inLapRomanCount - 1;

  // チャンクの最初のローマ字が最後だったらそのまま使う
  // Ex. 「kyo」の「k」が最後だったら，「kilyo」でも「k」がラップの最後
  if (inChunkIndexOfLapLast == 0) {
    index = 0;

    // チャンクの最後のローマ字が最後だったら最後の文字を使う
    // Ex. 「kyo」の「o」が最後だったら，「kilyo」では「o」がラップの最後
  } else if (inChunkIndexOfLapLast == effectiveRomanChunkLength - 1) {
    index = actualCandidateLen - 1;

    // それ以外ならどこでも良い（というか区切りを定められない）
  } else {
    // Ex. ここでは「kyo」の「y」がラップ末だったら，表示用文字列「kilyo」では「i」がラップの最後となる
    index = inChunkIndexOfLapLast;
  }

  return index;
}

// Uni,Bi-gramを用いて文章を入力単位に分割する
// Ex. "ひじょうに big" -> ['ひ','じょ','う','に',' ','b','i','g']
export function parseSentence(input: string): ChunkWithoutRoman[] {
  let chunkWithoutRomanList: ChunkWithoutRoman[] = [];

  let i: number = 0;
  while (i < input.length) {
    const uni: string = input.substring(i, i + 1);
    const bi: string = i !== input.length - 1 ? input.substring(i, i + 2) : '';

    let chunkStr: string;
    // 表示可能なASCII文字ならそのままパース結果とする
    if (isPrintableASCII(uni)) {
      chunkStr = uni;
      i++;

      // ひらがななら複数文字チャンクの可能性がある
    } else {
      // biがあるならそちらを優先
      if (bi in hiraganaRomanDictionary) {
        chunkStr = bi;
        i = i + 2;

      } else {
        // uniは辞書にあることが前提
        if (!(uni in hiraganaRomanDictionary)) {
          throw new Error(`${uni} is not in dictionary`);
        }

        chunkStr = uni;
        i++;
      }
    }

    chunkWithoutRomanList.push({ chunkStr: chunkStr });
  }

  return chunkWithoutRomanList;
}

// ローマ字出力できる単位に分けられたひらがなチャンク（ASCII文字も含む）にローマ字表現を追加する
export function constructChunkList(chunkWithoutRomanList: ChunkWithoutRoman[]): Chunk[] {
  const chunkWithoutRomanListLen: number = chunkWithoutRomanList.length;

  const chunkList: Chunk[] = new Array<Chunk>(chunkWithoutRomanListLen);

  // 「ん」など次のチャンクによっては使えないローマ字系列があるチャンクに対処するために先読みをする
  let nextChunkStr: string = '';

  // 「っ」を処理するために次のチャンク先頭にある子音などのリストを保持しておく
  // 子音などとしているのは，な行・にゃ行・「ん」の「n」も含むため
  let nextChunkCanLtuByRepeatList: string[] = [];

  // 後ろから走査していくことで次のチャンクに依存する処理の実装が楽になる
  for (let i = chunkWithoutRomanListLen - 1; i >= 0; i--) {
    const chunkWithoutRoman: ChunkWithoutRoman = chunkWithoutRomanList[i];

    const chunkStr: string = chunkWithoutRoman.chunkStr;
    let isASCII = false;

    // このチャンクのローマ字系列候補のリスト
    const romanCandidateList: RomanCandidate[] = [];

    // ASCIIならそのまま
    if (chunkStr.length == 1 && isPrintableASCII(chunkStr)) {
      romanCandidateList.push({ romanElemList: [chunkStr], nextChunkHeadConstraint: '' });
      isASCII = true;

    } else if (chunkStr == 'ん') {
      const nRomanElementList = hiraganaRomanDictionary[chunkStr];

      let availableRomanElementList: string[] = [];
      availableRomanElementList = nRomanElementList.filter(romanElem => {
        const isLastChunk = i == chunkWithoutRomanListLen - 1;

        // 単語・チャンク末だったり後ろに母音，あ行，な行，や行が続く「ん」は「n」と入力できない
        return romanElem != 'n' || allowSingleN(nextChunkStr, isLastChunk);
      });

      availableRomanElementList.forEach(e => {
        romanCandidateList.push({
          romanElemList: [e],
          nextChunkHeadConstraint: ''
        });
      });

      // 小さい「つ」
      // ltuやxtuで打つ以外にも次のチャンクの子音で済ませる（「った」なら「tta」）ことができる
      // これを表そうとすると「った」を辞書に登録するという方法があるがこうすると辞書のサイズが膨大になる
      // 「あ」，「い」，「え」，「お」（「っう」は「wwu」「wwhu」などにできる），な行，にゃ行
      // 「っん」は「xxn」とできる
    } else if (chunkStr == 'っ') {
      // 「ltu」「ltsu」「xtu」に関しては次のチャンクの文字に制限はない
      hiraganaRomanDictionary[chunkStr].forEach(e => {
        romanCandidateList.push({
          romanElemList: [e],
          nextChunkHeadConstraint: ''
        });
      });

      // 子音などの連続で済ませるなら次のチャンクの先頭は制限する必要がある
      nextChunkCanLtuByRepeatList.forEach(e => {
        romanCandidateList.push({
          romanElemList: [e],
          nextChunkHeadConstraint: e
        });
      });

      // ２文字の場合にはまとめて入力した場合と１文字ずつ入力した場合のローマ字系列がある
    } else if (chunkStr.length == 2) {
      if (!(chunkStr in hiraganaRomanDictionary)) {
        throw new Error(`${chunkStr} is not in dictionary`);
      }

      // まずは２文字をまとめて入力できるローマ字系列をpushする
      hiraganaRomanDictionary[chunkStr].forEach(e => {
        romanCandidateList.push({
          romanElemList: [e],
          nextChunkHeadConstraint: ''
        });
      });

      const chunkStrFirst: string = chunkStr[0];
      const chunkStrSecond: string = chunkStr[1];

      // 単独で入力できないものはないはず
      if (!(chunkStrFirst in hiraganaRomanDictionary) || !(chunkStrSecond in hiraganaRomanDictionary)) {
        throw new Error(`${chunkStrFirst} is not in dictionary`);
      }

      // １文字ずつ単独で入力したものを組み合わせてpushする
      for (let first of hiraganaRomanDictionary[chunkStrFirst]) {
        for (let second of hiraganaRomanDictionary[chunkStrSecond]) {
          romanCandidateList.push({
            romanElemList: [first, second],
            nextChunkHeadConstraint: ''
          });
        }
      }

    } else {
      if (!(chunkStr in hiraganaRomanDictionary)) {
        throw new Error(`${chunkStr} is not in dictionary`);
      }

      hiraganaRomanDictionary[chunkStr].forEach(e => {
        romanCandidateList.push({
          romanElemList: [e],
          nextChunkHeadConstraint: ''
        });
      });
    }

    // ひとまずは文字数の少ない候補を第一候補として選択する
    // TODO 文字数が最小の候補が複数ある場合に関しては設定で選べるようにする
    romanCandidateList.sort((a: RomanCandidate, b: RomanCandidate) => {
      return reduceCandidate(a.romanElemList).length - reduceCandidate(b.romanElemList).length;
    });

    chunkList[i] = {
      chunkStr: chunkStr,
      // 最短の候補を選んでいけば文章全体でも最短になるはず（候補のソートは安定ソートだと思う）
      // もし安定ソートじゃないと，「っち」が「cti」とするのが最短みたいになってしまうかもしれない（[['t'],['c'],['ltu']...]と['ti','chi']にはなってるけどtとcが逆転してしまう）
      minCandidateStr: reduceCandidate(romanCandidateList[0].romanElemList),
      romanCandidateList: romanCandidateList,
    };

    nextChunkStr = chunkStr;

    // 次に処理するチャンク（後ろから処理しているので１つ前のチャンク）が「っ」だった場合に備えて子音などのリストを構築する
    nextChunkCanLtuByRepeatList = [];
    // 次のチャンクがASCIIだったら促音を子音などの連続で表すことはできない
    if (!isASCII) {
      // 同じ子音などが連続するのを防ぐ
      const isDuplicate: { [key: string]: boolean } = {};

      romanCandidateList.forEach(romanCandidate => {
        const head = charInRomanElementAtPosition(romanCandidate.romanElemList, 0);

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

  return chunkList;
}
