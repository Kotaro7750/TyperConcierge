import React, { useState, useEffect, useRef, useMemo, useContext, createContext } from 'react';
import { TypingView } from './TypingView';
import { ResultView } from './ResultView';
import { ReadyView } from './ReadyView';

import { constructQueryInformation } from './utility';

import { useMilliSecondTimer } from './useMilliSecondTimer';
import { useCountdownTimer } from './useCountdownTimer';
import { useVocabulary } from './useVocabulary';

// FIXME 関数の初期値を渡す場合にはどうしたらいいのだろうか
export const VocabularyContext = createContext<{ availableDictionaryNameList: string[], setUsedDictionaryList: React.Dispatch<React.SetStateAction<string[]>> | undefined }>(
  {
    availableDictionaryNameList: [],
    setUsedDictionaryList: undefined,
  }
);

export function App() {
  const [mode, setMode] = useState<Mode>('Ready');
  // TODO ここらへんuseReduceが使えそう
  const [elapsedTime, startTimer, stopTimer, cancelTimer] = useMilliSecondTimer();
  const [isCountdownStarted, countdownTimer, startCountdownTimer, initCountdownTimer] = useCountdownTimer(3, () => startTyping());
  const [availableDictionaryNameList, setUsedDictionaryList, vocabularyEntryList] = useVocabulary();

  const queryInformation: QueryInformation = useMemo(() => constructQueryInformation(vocabularyEntryList, 100), [vocabularyEntryList]);

  const typingResult = useRef<TypingResult>();

  // キー入力のイベント
  useEffect(() => {
    addEventListener('keydown', handleKeyDown);

    return () => { removeEventListener('keydown', handleKeyDown) }
  });

  // タイピング終了のイベント
  useEffect(() => {
    addEventListener('typingFinish', onTypingFinish);

    return () => { removeEventListener('typingFinish', onTypingFinish) }
  });

  function handleKeyDown(e: KeyboardEvent) {
    const key = e.key;

    if (key === 'Escape') {
      cancelTyping();
      return;
    }

    if (mode === 'Ready') {
      switch (key) {
        case ' ':
          startGame();
          break;
      }

    } else if (mode === 'Started') {
      // ShiftとかAltとかの特殊文字を防ぐために長さでバリデーションをかける
      // 本当はもっといいやり方があるはず
      if (key.length == 1 && ' '.charCodeAt(0) <= key.charCodeAt(0) && key.charCodeAt(0) <= '~'.charCodeAt(0)) {
        dispatchEvent(new CustomEvent('printableKeydown', {
          detail: {
            key: e.key,
            elapsedTime: elapsedTime,
          }
        }));
      }
    }
  }

  function onTypingFinish(e: CustomEventInit<TypingFinishEvent>) {
    stopTimer();
    typingResult.current = e.detail;
    setMode('Finished');
  }

  function startGame() {
    startCountdownTimer();
  }

  function startTyping() {
    setMode('Started');
    startTimer();
  }

  function cancelTyping() {
    setMode('Ready');
    cancelTimer();
    initCountdownTimer();
  }


  return (
    <div className='container-fluid'>
      {
        mode === 'Ready'
          ? <VocabularyContext.Provider value={{ availableDictionaryNameList: availableDictionaryNameList, setUsedDictionaryList: setUsedDictionaryList }}>
            <ReadyView isCountdownStarted={isCountdownStarted} countdownTimer={countdownTimer} startCountdown={startCountdownTimer} />
          </VocabularyContext.Provider>

          : mode === 'Started' ? <TypingView queryInformation={queryInformation} elapsedTime={elapsedTime} />

            : <ResultView result={typingResult.current} />
      }
    </div>
  );
}
