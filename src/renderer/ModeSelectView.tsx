import _, { useState, useEffect, useContext, useRef } from 'react';

import { WORD_DICTIONARY_EXTENSION, SENTENCE_DICTIONARY_EXTENSION } from '../commonUtility';

import { StartSignal } from './StartSignal';
import { SelectDictionaryPane } from './SelectDictionaryPane';

import { useCountdownTimer } from './useCountdownTimer';
import { LAP_LENGTH } from './useRomanEngine';

import { GameStateContext } from './App';
import { VocabularyContext } from './App';

export function ModeSelectView() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [romanCountThreshold, setRomanCountThreshold] = useState<number>(LAP_LENGTH*3);
  const [countdownTimer, startCountdownTimer, initCountdownTimer] = useCountdownTimer(3, () => startTyping());
  const transitionToTyping = useRef<boolean>(false);

  const gameStateContext = useContext(GameStateContext);
  const vocabularyContext = useContext(VocabularyContext);

  const library = vocabularyContext.library;
  const libraryOperator = vocabularyContext.libraryOperator;

  const canStart = () => {
    const usedDictionaryFileNameList = library.usedVocabularyType == 'word' ? library.usedDictionaryFileNameList.word : library.usedDictionaryFileNameList.sentence;
    return usedDictionaryFileNameList.length !== 0;
  }

  const confirmReady = () => {
    if (!canStart()) {
      return;
    }

    libraryOperator({ type: 'romanCountThreshold', romanCountThreshold: romanCountThreshold });
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

  const WORD_TOOLTIP_TEXT = `辞書（${WORD_DICTIONARY_EXTENSION}形式のファイル）に含まれる単語からいくつかランダムに選びます。\n文章との併用はできません。`;
  const SENTENCE_TOOLTIP_TEXT =`辞書（${SENTENCE_DICTIONARY_EXTENSION}形式のファイル）に含まれる文章からランダムに選びます。\n単語との併用はできません。` 

  const ROMAN_THRESHOLD_TOOLTIP_TEXT = 'ローマ字を何文字打ったらゲームが終了するかというタイプ数です。\n平均的な人だと1分間に150から250タイプできるとされているので、1分間のゲームをしたい場合にはこれくらいの値にすると良いです。';

  // 現在有効になっている語彙タイプに合わせて辞書リストを変える
  const effectiveAvailableDictionaryList = library.usedVocabularyType == 'word' ? library.availableDictionaryList.word : library.availableDictionaryList.sentence;
  const effectiveUsedDictionaryList = library.usedVocabularyType == 'word' ? library.usedDictionaryFileNameList.word : library.usedDictionaryFileNameList.sentence;

  return (
    <div className='w-100 vh-100 d-flex flex-row justify-content-center'>
      {
        isReady
          ? <div className='w-50 d-flex flex-column justify-content-center'><StartSignal countdownTimer={countdownTimer} /></div>
          :
          (
            <div className='w-50 d-flex flex-column justify-content-center'>
              <div className='row mb-1'>
                <div className='p-0 d-flex w-100'>

                  <div className='p-0 d-flex bg-white'>
                    <div className='btn-group'>
                      <label className={`btn ${library.usedVocabularyType == 'word' ? 'btn-secondary' : 'btn-outline-secondary'} text-dark border border-secondary border-2`} data-bs-toggle='tooltip' data-bs-placement='top' title={WORD_TOOLTIP_TEXT}>
                        単語<input type='radio' className='btn-check' onClick={() => libraryOperator({ type: 'type', vocabularyType: 'word' })} />
                      </label>

                      <label className={`btn ${library.usedVocabularyType == 'sentence' ? 'btn-secondary' : 'btn-outline-secondary'} text-dark border border-secondary border-2 border-start-0`} data-bs-toggle='tooltip' data-bs-placement='top' title={SENTENCE_TOOLTIP_TEXT}>
                        文章<input type='radio' className='btn-check' onClick={() => libraryOperator({ type: 'type', vocabularyType: 'sentence' })} />
                      </label>
                    </div>
                  </div>

                  <div className='p-0 pt-2 d-flex justify-content-end ms-auto'>
                    <button className='btn btn-sm btn-outline-success' onClick={() => { libraryOperator({ type: 'load' }); }}><i className='bi bi-arrow-clockwise'></i></button>
                  </div>
                </div>
              </div>

              <div className='h-25 row p-2 border border-secondary rounded-3 border-2 bg-white'>
                <SelectDictionaryPane availableDictionaryList={effectiveAvailableDictionaryList} usedDictionaryList={effectiveUsedDictionaryList} libraryOperator={libraryOperator} />
              </div>

              {
                library.usedVocabularyType == 'word'
                  ? (
                    <div className='row d-flex justify-content-center mt-2'>
                      <div className='d-flex justify-content-center'>
                        <label className='form-label w-75 d-flex'>
                          <input type='range' className='form-range w-75' min={LAP_LENGTH} max={600} step={LAP_LENGTH} value={romanCountThreshold} onChange={e => setRomanCountThreshold(Number(e.target.value))}/>
                          <span className='fs-6 text-nowrap ms-auto'>{romanCountThreshold}<i className='bi bi-question-circle' data-bs-toggle='tooltip' data-bs-placement='top' title={ROMAN_THRESHOLD_TOOLTIP_TEXT} /></span>
                        </label>
                      </div>
                    </div>
                  )
                  : undefined
              }

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
