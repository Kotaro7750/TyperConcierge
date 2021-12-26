type Mode = 'Ready' | 'Started' | 'Finished';

type PrintableASCII =
  'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z' |
  'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z' |
  ' ';

type PrintableKeyDownEvent = {
  key: PrintableASCII,
  elapsedTime: number,
};


interface QueryString {
  viewString: string,
  hiraganaString: string,
}

interface RomanPaneInformation {
  romanString: string,
  currentCursorPosition: number,
  missedPosition: number[],
}
