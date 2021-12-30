import React, { useEffect } from 'react';
import { TimerPane } from './TimerPane';
import { RomanPane } from './RomanPane';
import { QueryPane } from './QueryPane';

import { useRomanEngine } from './useRomanEngine';

export function TypingView(props: { queryInformation: QueryInformation, elapsedTime: number }) {
  const [sentenceViewPaneInformation, handleInput] = useRomanEngine(props.queryInformation.hiraganaString);

  useEffect(() => {
    let func = (e: CustomEventInit<PrintableKeyDownEvent>) => {
      if (e.detail !== undefined) {
        handleInput(e.detail.key, e.detail.elapsedTime);
      }
    };

    addEventListener('printableKeydown', func);

    return () => { removeEventListener('printableKeydown', func) }
  });

  return (
    <>
      <div className='row'>
        <div className='col-3 offset-9'>
          <TimerPane elapsedTime={props.elapsedTime} />
        </div>
      </div>

      <div className='row my-3 mx-0'>
        <div className='col-12'>
          <QueryPane input={props.queryInformation} information={sentenceViewPaneInformation.querySentencePaneInforamtion} />
        </div>
      </div>

      <div className='row my-5 mx-0'>
        <div className='col-12'>
          <RomanPane information={sentenceViewPaneInformation.romanPaneInformation} />
        </div>
      </div>
    </>
  );
}
