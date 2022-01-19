interface Window {
  api: {
    getDictionaryList: () => Promise<any>,
    getVocabularyEntryList: (usedDictionaryNameList: string[]) => Promise<any>
  }
}

type GameState = 'ModeSelect' | 'Started' | 'Finished';

interface GameStateContext {
  gameState: GameState,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
}

type VocabularyType = 'word' | 'sentence';

type WordVocabularyEntry = [string, string[]];
type VocabularyEntrySentence = [string, string[]];

type VocabularyEntry = WordVocabularyEntry | VocabularyEntrySentence;

type DictionaryInfo = {
  name: string,
  type: VocabularyType,
  enable: boolean,
  timestamp: number,
  errorLineList: number[],
}

type CategorizedDictionaryInfoList = {
  word: DictionaryInfo[],
  sentence: DictionaryInfo[],
}

type DictionaryContent = Array<VocabularyEntry>;

type Dictionary = DictionaryInfo & {
  content: DictionaryContent,
}

type Library = {
  availableDictionaryList: CategorizedDictionaryInfoList,
  usedDictionaryFileNameList: {
    word: string[],
    sentence: string[],
  },
  usedVocabularyType: VocabularyType,
  vocabularyEntryList: VocabularyEntry[],
}

type LibraryOperatorActionType = { type: 'use', dictionaryName: string } | { type: 'disuse', dictionaryName: string } | { type: 'load' } | { type: 'constructVocabulary' } | { type: 'type', vocabularyType: VocabularyType };

// TODO 記号はもっとあるよね
type PrintableASCII =
  'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' |
  'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z' |
  ' ';

type TypingFinishEvent = TypingResult;

interface ChunkWithoutRoman {
  chunkStr: string
};

// チャンクのローマ字表現候補の１つを表す
// 候補が配列になっているのは，ひらがな２文字以上のときに１文字ずつ入力しても上手く扱えるようにするため（現在打っている文字をハイライトする時などの利用を想定）
// Ex. 「きょ」というチャンクの候補の１つである「kilyo」に対しては，['ki','lyo']とする
interface RomanCandidate {
  romanElemList: string[],
  // 「っ」を連続する子音などで表現する場合に次のチャンクの先頭が制限するために使う
  nextChunkHeadConstraint: string,
}

interface Chunk extends ChunkWithoutRoman {
  // 最も短いローマ字表現の文字列
  minCandidateStr: string,
  romanCandidateList: RomanCandidate[]
}

interface ConfirmedChunk {
  id: number,
  confirmedCandidate: RomanCandidate,
  // このチャンクのローマ字表現の最短となるもの
  minCandidateString: string,
  keyStrokeList: KeyStrokeInformation[],
}

interface InflightChunk extends Chunk {
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

interface TypingResultContext {
  typingResult: TypingResult,
  setTypingResult: React.Dispatch<React.SetStateAction<TypingResult>>,
}

type QuerySource = {
  vocabularyEntryList: VocabularyEntry[],
  romanCountThreshold: number,
  type: VocabularyType,
}

interface QueryInfo {
  viewString: string,
  hiraganaString: string,
  // ひらがな文のそれぞれの文字が表示用文のどの位置に対応するか
  // Ex. 「漢字」と「かんじ」なら「か」と「ん」が「漢」，「じ」が「字」なので[0,0,1]となる
  viewStringPosOfHiraganaString: number[],
  chunkList: Chunk[],
}

interface RomanPaneInformation {
  romanString: string,
  // ローマ字系列でのカーソル位置・ミス位置
  cursorPos: number,
  missedPos: number[],
  lapEndPos: number[],
  lapElapsedTime: number[],
}

interface QuerySentencePaneInformation {
  // ひらがな文自体は既にあるのでわざわざ渡す必要はない
  // ひらがな文（表示用文ではない）でのカーソル位置・位置
  // 複数文字をまとめて入力する場合もあるので配列にしている
  hiraganaCursorPosition: number[],
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
