import React, { useState } from 'react';

export function ResultSummaryPane(props: { summary: TypingStatisticsSummary }): JSX.Element {
  const [isWordCountIdeal, setIsWordCountIdeal] = useState<boolean>(false);

  const summary = props.summary;
  const wordCount = isWordCountIdeal ? summary.idealWordCount : summary.inputWordCount;
  const accuracy = Math.max(0, wordCount - summary.missCount) * 1.0 / wordCount * 100;

  // WPMは切り捨て
  const wpm = Math.floor(wordCount * 60000 / summary.totalTime);

  // WPM x ( 正確率 )^3 の小数点以下切り捨て
  // 実際のeタイピングはwordCountとしてidealじゃなくて実際の打ったローマ字数を使っている
  const eTypingScore = Math.floor(wpm * (accuracy / 100) ** 3);

  const WORD_COUNT_IDEAL_HELP = 'オン:タイプ数が最も少なくなるようなローマ字系列の字数で計算します\
  \nオフ:実際にタイプしたローマ字系列の字数で計算します\
  \nEx. 「きょう」を「kilyou」と打った場合にはオンにすると4字（kyou）、オフにすると6字打ったことになります\
  \nオンにすると実際にタイプした文字数よりも少なくなるのでWPM・スコアは低くなります';


  return (
    <>
      <div className='form-check form-switch'>
        <label className='form-check-label'>文字数として最短を使う
          <input className='form-check-input' type='checkbox' checked={isWordCountIdeal} onChange={() => setIsWordCountIdeal(prev => !prev)} />
        </label>
        <i className='bi bi-question-circle' data-bs-toggle='tooltip' data-bs-placement='top' title={WORD_COUNT_IDEAL_HELP} />
      </div>

      <div className='row'>
        <div className='col-4 text-center fs-1'>
          {wpm} 打/分
        </div>

        <div className='col-4 text-center fs-1'>
          {accuracy - Math.floor(accuracy) == 0 ? accuracy.toFixed(0) : accuracy.toFixed(2)}%
        </div>

        <div className='col-4 text-center fs-1'>
          {eTypingScore}
        </div>
      </div>

      <div className='row'>
        <div className='col-4 text-center fs-5'>
          {wordCount}字
        </div>

        <div className='col-4 text-center fs-5'>
          {summary.missCount}回
        </div>

        <div className='col-4 text-center fs-5'>
          {summary.totalTime / 1000}秒
        </div>
      </div>
    </>
  )
}
