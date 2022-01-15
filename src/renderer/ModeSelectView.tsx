import _, { useState, useEffect, useContext, useRef } from 'react';

import { StartSignal } from './StartSignal';
import { SelectDictionaryPane } from './SelectDictionaryPane';

import { useCountdownTimer } from './useCountdownTimer';

import { GameStateContext } from './App';
import { VocabularyContext } from './App';

export function ModeSelectView() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [countdownTimer, startCountdownTimer, initCountdownTimer] = useCountdownTimer(3, () => startTyping());
  const transitionToTyping = useRef<boolean>(false);

  const gameStateContext = useContext(GameStateContext);
  const vocabularyContext = useContext(VocabularyContext);

  const library = vocabularyContext.library;
  const libraryOperator = vocabularyContext.libraryOperator;

  const canStart = () => {
    return library.usedDictionaryFileNameList.length !== 0;
  }

  const confirmReady = () => {
    if (!canStart()) {
      return;
    }

    libraryOperator({ type: 'constructVocabulary' });
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
    <div className='w-100 vh-100 d-flex flex-row justify-content-center'>
      {
        isReady
          ? <div className='w-50 d-flex flex-column justify-content-center'><StartSignal countdownTimer={countdownTimer} /></div>
          :
          (
            <div className='w-50 d-flex flex-column justify-content-center'>
              <div className='row mb-1'>
                <div className='p-0 d-flex justify-content-end'>
                  <button className='btn btn-sm btn-outline-success' onClick={() => { libraryOperator({ type: 'load' }); }}><i className="bi bi-arrow-clockwise"></i></button>
                </div>
              </div>

              <div className='h-25 row p-2 border border-secondary rounded-3 border-2 bg-white'>
                <SelectDictionaryPane availableDictionaryList={library.availableDictionaryList} usedDictionaryList={library.usedDictionaryFileNameList} libraryOperator={libraryOperator} />
              </div>
              <div className='row d-flex justify-content-center mt-3'>
                <div className='col-6 d-flex justify-content-center'>
                  <button onClick={confirmReady} className='btn btn-lg btn-primary' disabled={!canStart()}>Start</button>
                </div>
              </div>
            </div>
          )
      }
    </div>
  );
}
