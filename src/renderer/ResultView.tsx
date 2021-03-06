import _, { useMemo, useEffect, useContext } from 'react';
import { ResultSummaryPane } from './ResultSummaryPane';

import { GameStateContext } from './App';

import { reduceCandidate } from './RomanEngineUtility';

function calcStatistics(result: TypingResult): TypingStatistics {
  let idealWordCount = 0;
  let inputWordCount = 0;
  let missCount = 0;
  let elapsedTime = 0;

  for (let confirmedChunk of result.confirmedChunkList) {
    idealWordCount += confirmedChunk.minCandidateString.length;
    inputWordCount += reduceCandidate(confirmedChunk.confirmedCandidate.romanElemList).length;

    confirmedChunk.keyStrokeList.forEach(keyStroke => {
      elapsedTime = keyStroke.elapsedTime;
      missCount += keyStroke.isHit ? 0 : 1;
    });
  }

  return {
    summary: {
      idealWordCount: idealWordCount,
      inputWordCount: inputWordCount,
      missCount: missCount,
      totalTime: elapsedTime,
    }
  }
}

// | undefinedとしているのは初回には結果はないため
export function ResultView(props: { result: TypingResult | undefined }): JSX.Element {
  const result = props.result;

  const statisticsSummery = useMemo(() => calcStatistics(result as TypingResult).summary, [result]);

  const gameStateContext = useContext(GameStateContext);

  const handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key;

    if (key === 'Escape') {
      gameStateContext.setGameState('ModeSelect');
      return;
    }
  }

  useEffect(() => {
    addEventListener('keydown', handleKeyDown);

    return () => { removeEventListener('keydown', handleKeyDown) }
  });

  return (
    <div className='row my-3 mx-0'>
      <div className='col-12 p-0 vh-50 w-40 border border-secondary border-3 rounded-3 bg-white'>
        <ResultSummaryPane summary={statisticsSummery} />
      </div>
    </div>
  );
}
