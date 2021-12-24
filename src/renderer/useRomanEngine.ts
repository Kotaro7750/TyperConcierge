import { useState, useEffect } from 'react';

export function useRomanEngine(initRomanString: string): [RomanPaneInformation, (c: Alphabet) => void] {
  const [romanString] = useState<string>(initRomanString);
  const [cursorPosition, setCursorPosition] = useState(0);

  function onInput(c: Alphabet) {
    let isFinish: boolean = false;
    if (romanString[cursorPosition] == c) {
      if (cursorPosition == romanString.length - 1) {
        isFinish = true;
      }
      setCursorPosition((prevPosition) => prevPosition + 1);
    }

    if (isFinish) {
      onFinish();
    }
  }

  function onFinish() {
    dispatchEvent(new CustomEvent('typingFinish'));
  }

  return [{ romanString: romanString, currentCursorPosition: cursorPosition }, onInput];
}
