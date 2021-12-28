import React, { useMemo } from 'react';
import { ResultSummaryPane } from './ResultSummaryPane';
import { reduceCandidate } from './RomanEngineUtility';

function calcStatistics(src: TypingResult): TypingStatistics {
  let idealWordCount = 0;
  let inputWordCount = 0;
  let missCount = 0;
  let elapsedTime = 0;

  for (let confirmedChunk of src.confirmedChunkList) {
    idealWordCount += confirmedChunk.minCandidateString.length;
    inputWordCount += reduceCandidate(confirmedChunk.confirmedCandidate.candidate).length;

    confirmedChunk.keyStrokeList.forEach(keyStroke => {
      elapsedTime = keyStroke.elapsedTime;
      missCount += keyStroke.isHit ? 0 : 1;
    });
  }

  let summary: TypingStatisticsSummary = {
    idealWordCount: idealWordCount,
    inputWordCount: inputWordCount,
    missCount: missCount,
    totalTime: elapsedTime,
  }

  return {
    summary: summary
  }
}

// | undefinedとしているのは初回には結果はないため
export function ResultPane(props: { result: TypingResult | undefined }): JSX.Element {
  const statisticsSummery = useMemo(() => calcStatistics(props.result as TypingResult).summary, [props.result]);

  return (
    <div className='row'>
      <div className='col-12 border border-4'>
        <ResultSummaryPane summary={statisticsSummery} />
      </div>
    </div>
  );
}
