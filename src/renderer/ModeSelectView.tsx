import React, { useState, useEffect, useContext, useRef, useReducer } from 'react';

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

  const usedDictionaryReducer = (state: string[], action: { type: string, name: string }) => {
    switch (action.type) {
      case 'add':
        return state.concat([action.name]);

      case 'delete':
        return state.filter(dictionaryName => action.name != dictionaryName);
      default:
        throw new Error(`${action.type} is not supportted`);
    }
  };
  const [usedDictionary, dispatchUsedDictionary] = useReducer(usedDictionaryReducer, []);

  const confirmReady = () => {
    // TODO ここで判定するの汚い
    if (usedDictionary.length == 0 || vocabularyContext.setUsedDictionaryList == undefined) {
      return;
    }

    vocabularyContext.setUsedDictionaryList(usedDictionary);
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
              <div className='h-25 row p-2 border border-secondary rounded-3 border-2 bg-white'>
                <SelectDictionaryPane availableDictionaryList={vocabularyContext.availableDictionaryList} usedDictionaryList={usedDictionary} usedDictionaryDispatcher={dispatchUsedDictionary} />
              </div>
              <div className='row d-flex justify-content-center mt-3'>
                <div className='col-6 d-flex justify-content-center'>
                  <button onClick={confirmReady} className='btn btn-lg btn-primary' disabled={usedDictionary.length == 0}>Start</button>
                </div>
              </div>
            </div>
          )
      }
    </div>
  );
}
