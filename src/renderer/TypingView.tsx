import _, { useEffect, useContext } from 'react';
import { TimerPane } from './TimerPane';
import { RomanPane } from './RomanPane';
import { QueryPane } from './QueryPane';

import { GameStateContext } from './App';
import { TypingResultContext } from './App';

import { useQueryConstructor } from './useQueryConstructor';
import { useRomanEngine } from './useRomanEngine';
import { useMilliSecondTimer } from './useMilliSecondTimer';

export function TypingView(props: { library: Library }) {
  const querySource: QuerySource = {
    vocabularyEntryList: props.library.vocabularyEntryList,
    romanCountThreshold: 200,
    // FIXME ここは切り替えられるようにする
    type: 'word',
  };

  const queryInfo: QueryInfo = useQueryConstructor(querySource);
  const [sentenceViewPaneInfo, handleInput] = useRomanEngine(queryInfo);
  const [elapsedTime, startTimer, stopTimer, cancelTimer] = useMilliSecondTimer();

  const gameStateContext = useContext(GameStateContext);
  const typingResultContext = useContext(TypingResultContext);

  const cancelTyping = () => {
    // これもuseEffect内でやる必要があるかもしれない
    gameStateContext.setGameState('ModeSelect');
    cancelTimer();
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;

    if (key === 'Escape') {
      cancelTyping();
      return;
    }

    // ShiftとかAltとかの特殊文字を防ぐために長さでバリデーションをかける
    // 本当はもっといいやり方があるはず
    if (key.length == 1 && ' '.charCodeAt(0) <= key.charCodeAt(0) && key.charCodeAt(0) <= '~'.charCodeAt(0)) {
      handleInput(key as PrintableASCII, elapsedTime);
    }
  }

  const onTypingFinish = (e: CustomEventInit<TypingFinishEvent>) => {
    stopTimer();

    if (e.detail == undefined) {
      throw new Error('TypingFinishEvent should not be undefined');
    }

    typingResultContext.setTypingResult(e.detail);
    gameStateContext.setGameState('Finished');
  }


  // 初回レンダリング終了時にタイマーをスタートさせる
  useEffect(() => {
    startTimer();
  }, []);

  useEffect(() => {
    addEventListener('keydown', handleKeyDown);

    return () => { removeEventListener('keydown', handleKeyDown) }
  });

  useEffect(() => {
    addEventListener('typingFinish', onTypingFinish);

    return () => { removeEventListener('typingFinish', onTypingFinish) }
  });

  return (
    <>
      <div className='row'>
        <div className='col-3 offset-9'>
          <TimerPane elapsedTime={elapsedTime} />
        </div>
      </div>

      <div className='row mt-3 mx-0'>
        <div className='col-12'>
          <QueryPane queryInfo={queryInfo} paneInfo={sentenceViewPaneInfo.querySentencePaneInfo} />
        </div>
      </div>

      <div className='row mt-3 mx-0'>
        <div className='col-12'>
          <RomanPane paneInfo={sentenceViewPaneInfo.romanPaneInfo} />
        </div>
      </div>
    </>
  );
}
