import { useState, useEffect } from 'react';

export function useCountdownTimer(initialCount: number, callback: () => void): [boolean, number, () => void, () => void] {
  type TimerState = 'Ready' | 'Started' | 'Stopped';

  const [timerState, setTimerState] = useState<TimerState>('Ready');
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    let timerId: NodeJS.Timer;

    if (timerState == 'Started') {
      timerId = setInterval(() => {
        // カウントダウンタイマーなのでそこまで厳密な時間を計る必要はない
        setCount(prevCount => {
          if (prevCount == 1) {
            callback();
            setTimerState('Ready');
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timerId);
    }
  });

  function startCountdown() {
    setTimerState('Started');
  }

  function initCountdown() {
    setTimerState('Ready');
    setCount(initialCount);
  }

  return [timerState === 'Started', count, startCountdown, initCountdown];
}
