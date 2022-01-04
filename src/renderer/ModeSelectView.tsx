import React, { useState, useEffect, useContext, useRef } from 'react';

import { StartSignal } from './StartSignal';
import { SelectDictionaryPane } from './SelectDictionaryPane';

import { useCountdownTimer } from './useCountdownTimer';
import { GameStateContext } from './App';

export function ModeSelectView() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [countdownTimer, startCountdownTimer, initCountdownTimer] = useCountdownTimer(3, () => startTyping());
  const transitionToTyping = useRef<boolean>(false);
  const gameStateContext = useContext(GameStateContext);

  const confirmReady = () => {
    setIsReady(true);
    startCountdownTimer();
  }

  const cancelReady = () => {
    setIsReady(false);
    initCountdownTimer();
  }

  const startTyping = () => {
    // 本当ならここで直接GameStateを変更したいのだがそうすると「レンダリング中に親コンポーネントのstateを更新するな」という警告が出るのでuseEffectの中でやる
    transitionToTyping.current = true;
    initCountdownTimer();
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;

    if (key === 'Escape') {
      cancelReady();
    } else if (key === ' ') {
      confirmReady();
    }
  }

  useEffect(() => {
    if (transitionToTyping.current) {
      gameStateContext.setGameState('Started');
      transitionToTyping.current = false;
    }
  }, [gameStateContext, transitionToTyping.current]);


  useEffect(() => {
    addEventListener('keydown', handleKeyDown);

    return () => { removeEventListener('keydown', handleKeyDown) }
  });

  return (
    <div className='w-100'>
      {
        isReady
          ? <div className='position-absolute top-50 start-50 translate-middle vh-50'><StartSignal countdownTimer={countdownTimer} /></div>
          :
          (
            <div className='position-absolute top-50 start-50 translate-middle w-50'>
              <SelectDictionaryPane />
              <div className='row d-flex justify-content-center mt-3'>
                <div className='col-6 d-flex justify-content-center'>
                  <button onClick={confirmReady} className='btn btn-lg btn-outline-primary'>Start</button>
                </div>
              </div>
            </div>
          )
      }
    </div>
  );
}
