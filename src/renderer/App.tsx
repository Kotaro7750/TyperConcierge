import React, { useState, useEffect, useRef } from 'react';
import { TypingPane } from './TypingPane';
import { StartSignal } from './StartSignal';
import { TimerPane } from './TimerPane';
import { ResultPane } from './ResultPane';

import { useMilliSecondTimer } from './useMilliSecondTimer';
import { useCountdownTimer } from './useCountdownTimer';

export function App() {
  const [mode, setMode] = useState<Mode>('Ready');
  const [elapsedTime, startTimer, stopTimer, cancelTimer] = useMilliSecondTimer();
  const [countdownTimer, startCountdownTimer, initCountdownTimer] = useCountdownTimer(3, () => startTyping());

  let typingResult = useRef<TypingResult>();

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

  function onClicked() {
    switch (mode) {
      case 'Ready':
        startGame();
        break;
      case 'Started':
        cancelTyping();
        break;
    }
  }

  const VIEW_STRING = 'きょだい';
  const TYPED_STRING = 'きょだい';
  const VIEW_POSITION_HIRAGANA_STRING = [0, 1, 2, 3];

  const queryInformation: QueryInformation = {
    viewString: VIEW_STRING,
    hiraganaString: TYPED_STRING,
    viewStringPositionOfHiraganaString: VIEW_POSITION_HIRAGANA_STRING,
  };

  return (
    <div className='container-fluid'>
      <div className='row'>
        <div className='col-4'>
          <StartSignal countdownTimer={countdownTimer} />
        </div>
        <div className='col-3 offset-1'>
          <button onClick={onClicked} className='btn btn-lg btn-outline-secondary'>{mode}</button>
        </div>
        <div className='col-3 offset-1'>
          <TimerPane elapsedTime={elapsedTime / 1000} />
        </div>
      </div>

      <div className='row'>
        {
          mode === 'Started' ? <div className='col-12'><TypingPane queryInformation={queryInformation} /></div>
            : mode === 'Finished' ? <div className='col-12'><ResultPane result={typingResult.current} /></div>
              : undefined
        }
      </div>
    </div>
  );
}
