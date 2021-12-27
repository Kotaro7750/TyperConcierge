type Mode = 'Ready' | 'Started' | 'Finished';

// TODO 記号はもっとあるよね
type PrintableASCII =
  'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' |
  'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z' |
  ' ';

type PrintableKeyDownEvent = {
  key: PrintableASCII,
  elapsedTime: number,
};

type TypingFinishEvent = TypingResult;

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
  // 最も短いローマ字表現の文字列
  minCandidateString: string,
  romanCandidateList: RomanCandidate[]
}

interface ConfirmedChunk {
  id: number,
  romanString: string,
  // このチャンクのローマ字表現の最短となるもの
  minCandidateString: string,
  keyStrokeList: KeyStrokeInformation[],
}

interface InflightChunkWithRoman extends ChunkWithRoman {
  id: number,
  // romanCandidateListのそれぞれに対応するカーソル位置の配列
  cursorPositionList: number[],
  // ミスタイプも含めたキーストロークのリスト
  keyStrokeList: KeyStrokeInformation[],
}

interface KeyStrokeInformation {
  elapsedTime: number,
  c: PrintableASCII,
  isHit: boolean
}

interface TypingResult {
  confirmedChunkList: ConfirmedChunk[],
}

interface QueryInformation {
  viewString: string,
  hiraganaString: string,
  // ひらがな文のそれぞれの文字が表示用文のどの位置に対応するか
  // Ex. 「漢字」と「かんじ」なら「か」と「ん」が「漢」，「じ」が「字」なので[0,0,1]となる
  viewStringPositionOfHiraganaString: number[],
}

interface RomanPaneInformation {
  romanString: string,
  // ローマ字系列でのカーソル位置・ミス位置
  currentCursorPosition: number,
  missedPosition: number[],
}

interface QuerySentencePaneInformation {
  // ひらがな文自体は既にあるのでわざわざ渡す必要はない
  // ひらがな文でのカーソル位置・位置
  hiraganaCursorPosition: number,
  missedPosition: number[],
}

interface SentenceViewPaneInformation {
  romanPaneInformation: RomanPaneInformation,
  querySentencePaneInforamtion: QuerySentencePaneInformation,
}

interface TypingStatisticsSummary {
  // 最短で打った場合のローマ字数
  idealWordCount: number,
  // 実際に打ったローマ字系列のローマ字数
  inputWordCount: number,
  missCount: number,
  totalTime: number,
}

interface TypingStatistics {
  summary: TypingStatisticsSummary
}
