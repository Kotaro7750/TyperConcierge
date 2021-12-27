import { hiraganaRomanDictionary } from './HiraganaRomanDictionary';
import { isPrintableASCII, allowSingleN } from './utility';

export function deepCopyChunkWithRoman(src: ChunkWithRoman): ChunkWithRoman {
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
export function reduceCandidate(candidate: string[]): string {
  return candidate.reduce((prev, current) => prev + current);
}

export function characterAtCursorPosition(candidate: string[], cursorPosition: number): PrintableASCII {
  // TODO あまりキャストしたくないのでそのうちPrintableASCIIでできたstring型を定義する必要があるかもしれない
  return reduceCandidate(candidate)[cursorPosition] as PrintableASCII;
}

// ローマ字系列候補の中でcursorPosition目にある文字は配列の何番目に存在するか
// Ex. ['ki','lyo']という候補のカーソル位置2（l）は，インデックス1番
export function inCandidateIndexAtCursorPosition(candidate: string[], cursorPosition: number): number {
  let index = 0;
  let tailPosition = candidate[0].length - 1;

  while (tailPosition < cursorPosition) {
    index++;
    tailPosition += candidate[index].length;
  }

  return index;
}

// Uni,Bi-gramを用いて文章を入力単位に分割する
// Ex. "ひじょうに big" -> ['ひ','じょ','う','に',' ','b','i','g']
export function parseSentence(input: string): Chunk[] {
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
export function constructChunkWithRomanList(chunkList: Chunk[]): ChunkWithRoman[] {
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
