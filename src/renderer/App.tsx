import React, { useState, useEffect } from 'react';
import { TypingPane } from './TypingPane';

import { useMilliSecondTimer } from './useMilliSecondTimer';

export function App() {
  const [mode, setMode] = useState<Mode>('Ready');
  const [elapsedTime, startTimer, stopTimer, cancelTimer] = useMilliSecondTimer();

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
          startTyping();
          break;
      }
    } else if (mode === 'Started') {
      if (' '.charCodeAt(0) <= key.charCodeAt(0) && key.charCodeAt(0) <= '~'.charCodeAt(0)) {
        dispatchEvent(new CustomEvent('printableKeydown', {
          detail: {
            key: e.key
          }
        }));
      }
    }
  }

  function onTypingFinish(e: CustomEventInit) {
    stopTimer();
  }

  function startTyping() {
    setMode('Started');
    startTimer();
  }

  function cancelTyping() {
    setMode('Ready');
    cancelTimer();
  }

  function onClicked() {
    switch (mode) {
      case 'Ready':
        startTyping();
        break;
      case 'Started':
        cancelTyping();
        break;
    }
  }

  const VIEW_STRING = '永遠 かみそり はまる 公園';
  const TYPED_STRING = 'eien kamisori hamaru kouenn';
  const queryString: QueryString = {
    viewString: VIEW_STRING,
    romanString: TYPED_STRING
  };

  return (
    <div>
      <button onClick={onClicked}>{mode}</button>
      {elapsedTime / 1000}
      {mode === 'Started' ? <TypingPane query={queryString} /> : undefined}
    </div>
  );
}
